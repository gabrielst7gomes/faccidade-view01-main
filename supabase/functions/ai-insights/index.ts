/**
 * FacCidade Edu — AI Insights Edge Function
 *
 * Analisa dados acadêmicos e gera insights automáticos para o coordenador
 * usando Extended Thinking do Claude (raciocínio profundo).
 *
 * Deploy: supabase functions deploy ai-insights --no-verify-jwt
 * Env:    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Coleta métricas gerais
    const [alunos, professores, turmas, presencas, entregas, alertas] =
      await Promise.all([
        supabase.from('perfis').select('id', { count: 'exact' }).eq('perfil', 'aluno'),
        supabase.from('perfis').select('id', { count: 'exact' }).eq('perfil', 'professor'),
        supabase.from('edu_turmas').select('id', { count: 'exact' }).eq('ativo', true),
        supabase.from('edu_presencas').select('presente'),
        supabase.from('edu_entregas').select('status'),
        supabase
          .from('edu_alertas_sistema')
          .select('tipo')
          .eq('lido', false),
      ]);

    const presTotal = presencas.data?.length ?? 0;
    const presPresentes = presencas.data?.filter(p => p.presente).length ?? 0;
    const freqMedia = presTotal > 0 ? ((presPresentes / presTotal) * 100).toFixed(1) : '0';

    const entregasTotal = entregas.data?.length ?? 0;
    const entregasOk = entregas.data?.filter(e => e.status !== 'pendente').length ?? 0;
    const taxaEntrega = entregasTotal > 0 ? ((entregasOk / entregasTotal) * 100).toFixed(1) : '0';

    const alertasPorTipo = (alertas.data ?? []).reduce<Record<string, number>>((acc, a) => {
      acc[a.tipo] = (acc[a.tipo] ?? 0) + 1;
      return acc;
    }, {});

    const dadosAcademicos = {
      total_alunos: alunos.count,
      total_professores: professores.count,
      total_turmas: turmas.count,
      frequencia_media_percent: freqMedia,
      taxa_entrega_atividades_percent: taxaEntrega,
      alertas_nao_lidos: alertasPorTipo,
    };

    // Usa Extended Thinking para análise profunda
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      thinking: { type: 'enabled', budget_tokens: 1500 },
      messages: [
        {
          role: 'user',
          content: `Você é um consultor educacional especialista em análise de dados acadêmicos.
Analise os dados da FacCidade (faculdade em Aparecida de Goiânia, GO) e gere insights acionáveis.

DADOS ATUAIS:
${JSON.stringify(dadosAcademicos, null, 2)}

Gere um relatório em JSON com:
{
  "resumo_executivo": "<2-3 frases sobre o estado geral>",
  "pontuacao_saude_academica": <0-100>,
  "insights": [
    {
      "categoria": "<Frequência|Entregas|Engajamento|Risco>",
      "prioridade": "<Alta|Média|Baixa>",
      "titulo": "<título conciso>",
      "descricao": "<análise detalhada>",
      "acao_recomendada": "<ação específica que o coordenador deve tomar>"
    }
  ],
  "tendencias": ["<tendência observada>"],
  "alertas_criticos": ["<situação que exige ação imediata>"],
  "previsao_proximas_semanas": "<o que pode acontecer se nada mudar>"
}

Responda APENAS o JSON.`,
        },
      ],
    });

    let insights = null;
    let thinking = null;

    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinking = block.thinking;
      } else if (block.type === 'text') {
        const jsonMatch = block.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) insights = JSON.parse(jsonMatch[0]);
      }
    }

    return new Response(
      JSON.stringify({ insights, thinking_summary: thinking?.slice(0, 200), dados_usados: dadosAcademicos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('AI Insights error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Erro ao gerar insights.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
