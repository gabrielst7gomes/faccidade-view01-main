import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { MetricCard, MetricCardSkeleton } from '@/components/edu/MetricCard';
import { AlertCard, EduPageHeader } from '@/components/edu/AlertCard';
import { School, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/edu/professor/')({
  component: ProfessorDashboard,
});

function ProfessorDashboard() {
  const { perfil } = useEduAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['prof-metrics', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const endOfWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd');

      const [turmas, aulasHoje, atividades, alertas] = await Promise.all([
        supabase.from('edu_turmas').select('id', { count: 'exact' }).eq('professor_id', perfil!.id).eq('ativo', true),
        supabase.from('edu_aulas').select('id', { count: 'exact' }).eq('created_by', perfil!.id).eq('data', today),
        supabase.from('edu_atividades').select('id', { count: 'exact' }).eq('professor_id', perfil!.id).gte('data_entrega', today).lte('data_entrega', endOfWeek),
        supabase.from('edu_alertas_sistema').select('id', { count: 'exact' }).eq('lido', false),
      ]);

      return {
        turmas: turmas.count ?? 0,
        aulasHoje: aulasHoje.count ?? 0,
        atividades: atividades.count ?? 0,
        alertas: alertas.count ?? 0,
      };
    },
  });

  const { data: alunosAtencao } = useQuery({
    queryKey: ['prof-alunos-atencao', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data: turmas } = await supabase
        .from('edu_turmas')
        .select('id, nome')
        .eq('professor_id', perfil!.id)
        .eq('ativo', true);

      if (!turmas?.length) return [];

      const results: { aluno: string; turma: string; tipo: string; msg: string }[] = [];

      for (const t of turmas) {
        const { data: aulas } = await supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true);
        const aulasIds = aulas?.map((a) => a.id) ?? [];
        if (!aulasIds.length) continue;

        const { data: alunos } = await supabase.from('edu_turma_alunos').select('aluno_id, perfis(nome)').eq('turma_id', t.id);

        for (const a of alunos ?? []) {
          const { data: presencas } = await supabase.from('edu_presencas').select('presente').in('aula_id', aulasIds).eq('aluno_id', a.aluno_id);
          const total = presencas?.length ?? 0;
          const faltas = presencas?.filter((p) => !p.presente).length ?? 0;
          const pct = total > 0 ? (faltas / total) * 100 : 0;
          if (pct > 25) {
            results.push({ aluno: (a.perfis as any)?.nome ?? 'Aluno', turma: t.nome, tipo: 'falta', msg: `${pct.toFixed(0)}% de faltas` });
          }
        }
      }

      return results.slice(0, 5);
    },
  });

  return (
    <div>
      <EduPageHeader title="Dashboard" subtitle={`Bem-vindo, ${perfil?.nome?.split(' ')[0] ?? 'Professor'}!`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard label="Turmas ativas" value={metrics?.turmas ?? 0} icon={<School size={20} />} color="#1A3A6E" />
            <MetricCard label="Aulas hoje" value={metrics?.aulasHoje ?? 0} icon={<Calendar size={20} />} color="#7C3AED" />
            <MetricCard label="Atividades esta semana" value={metrics?.atividades ?? 0} icon={<Clock size={20} />} color="#D97706" />
            <MetricCard label="Alertas ativos" value={metrics?.alertas ?? 0} icon={<AlertTriangle size={20} />} color="#DC2626" />
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#1A3A6E] mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          Alunos que precisam de atenção
        </h2>
        {!alunosAtencao?.length ? (
          <p className="text-sm text-slate-400 text-center py-6">Todos os alunos com frequência adequada ✓</p>
        ) : (
          <div className="space-y-2">
            {alunosAtencao.map((a, i) => (
              <AlertCard
                key={i}
                variant={a.tipo === 'falta' ? 'danger' : 'warning'}
                title={`${a.aluno} — ${a.turma}`}
                description={a.msg}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
