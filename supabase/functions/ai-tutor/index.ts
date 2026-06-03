/**
 * FacCidade Edu — AI Tutor Edge Function
 *
 * Chama Claude com contexto do aluno (disciplinas, materiais, progresso)
 * e responde perguntas acadêmicas em português.
 *
 * Deploy: supabase functions deploy ai-tutor --no-verify-jwt
 * Env:    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

interface TutorRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  alunoId: string;
  turmaId?: string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = (await req.json()) as TutorRequest;
    const { message, history = [], alunoId, turmaId } = body;

    // Busca contexto do aluno
    const [{ data: perfil }, { data: turmas }, { data: materiais }] =
      await Promise.all([
        supabase.from('perfis').select('nome').eq('id', alunoId).single(),
        supabase
          .from('edu_turma_alunos')
          .select('edu_turmas(nome, edu_disciplinas(nome, carga_horaria))')
          .eq('aluno_id', alunoId),
        turmaId
          ? supabase
              .from('edu_materiais_ead')
              .select('titulo, descricao, tipo')
              .eq('turma_id', turmaId)
              .eq('publicado', true)
              .limit(10)
          : Promise.resolve({ data: [] }),
      ]);

    const disciplinas = (turmas ?? [])
      .map((t: any) => t.edu_turmas?.edu_disciplinas?.nome)
      .filter(Boolean)
      .join(', ');

    const materiaisCtx = (materiais ?? [])
      .map((m: any) => `• ${m.titulo}${m.descricao ? ': ' + m.descricao : ''}`)
      .join('\n');

    const systemPrompt = `Você é um tutor acadêmico da FacCidade — Faculdade em Aparecida de Goiânia, GO.
Seu papel é ajudar o aluno a entender os conteúdos das suas disciplinas de forma clara, objetiva e empática.

ALUNO: ${perfil?.nome ?? 'Aluno'}
DISCIPLINAS MATRICULADO: ${disciplinas || 'não informadas'}
${materiaisCtx ? `\nMATERIAIS DA DISCIPLINA:\n${materiaisCtx}` : ''}

REGRAS:
- Responda SEMPRE em português do Brasil
- Seja didático: use exemplos práticos e analogias
- Se a pergunta não tiver relação com as disciplinas do aluno, responda de forma geral mas educativa
- Nunca invente informações — se não souber, diga e sugira onde buscar
- Seja encorajador, especialmente quando o aluno demonstrar dificuldade
- Mantenha respostas concisas (máximo 4 parágrafos) salvo quando necessário mais detalhes
- Use formatação Markdown quando ajudar na clareza (listas, negrito, código)`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
      ],
    });

    const reply = (response.content[0] as any).text as string;

    return new Response(
      JSON.stringify({
        reply,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('AI Tutor error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Erro interno no tutor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
