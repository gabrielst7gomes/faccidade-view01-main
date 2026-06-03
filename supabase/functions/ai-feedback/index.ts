/**
 * FacCidade Edu — AI Feedback Edge Function
 *
 * Recebe uma entrega de aluno e a atividade, retorna sugestão de nota
 * e feedback estruturado usando structured outputs do Claude.
 *
 * Deploy: supabase functions deploy ai-feedback --no-verify-jwt
 * Env:    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';
import { corsHeaders } from '../_shared/cors.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

interface FeedbackRequest {
  atividade: {
    titulo: string;
    descricao?: string;
    tipo: string;
    pontuacao_maxima: number;
  };
  entrega: {
    texto_resposta?: string;
    aluno_nome: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { atividade, entrega } = (await req.json()) as FeedbackRequest;

    if (!entrega.texto_resposta?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Sem texto para analisar.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = `Você é um professor universitário avaliando a entrega de um aluno.

ATIVIDADE: ${atividade.titulo} (${atividade.tipo})
${atividade.descricao ? `DESCRIÇÃO: ${atividade.descricao}` : ''}
PONTUAÇÃO MÁXIMA: ${atividade.pontuacao_maxima}
ALUNO: ${entrega.aluno_nome}

RESPOSTA ENTREGUE:
"""
${entrega.texto_resposta}
"""

Analise a entrega e retorne um JSON com exatamente esta estrutura:
{
  "nota_sugerida": <número entre 0 e ${atividade.pontuacao_maxima}>,
  "percentual": <0 a 100>,
  "pontos_fortes": ["<lista de pontos positivos>"],
  "pontos_melhoria": ["<lista de pontos a melhorar>"],
  "feedback_detalhado": "<feedback construtivo em 2-3 parágrafos em português>",
  "nivel": "<Excelente|Bom|Regular|Insuficiente>"
}

Seja justo, objetivo e construtivo. Responda APENAS o JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as any).text as string;

    // Extrai JSON da resposta
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude não retornou JSON válido.');

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ ...parsed, tokens_used: response.usage.output_tokens }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('AI Feedback error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Erro ao gerar feedback.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
