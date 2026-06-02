import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { MetricCard, MetricCardSkeleton } from '@/components/edu/MetricCard';
import { AlertCard, EduPageHeader } from '@/components/edu/AlertCard';
import { Calendar, TrendingUp, Files, Laptop, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/edu/aluno/')({
  component: AlunoDashboard,
});

function AlunoDashboard() {
  const { perfil } = useEduAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['aluno-metrics', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data: turmasData } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id')
        .eq('aluno_id', perfil!.id);

      const turmaIds = turmasData?.map((t) => t.turma_id) ?? [];

      const [aulasHoje, ativPendentes, matNaoAcessados, alertas] = await Promise.all([
        turmaIds.length
          ? supabase.from('edu_aulas').select('id', { count: 'exact' }).in('turma_id', turmaIds).eq('data', today)
          : Promise.resolve({ count: 0 }),
        supabase.from('edu_entregas').select('id', { count: 'exact' }).eq('aluno_id', perfil!.id).eq('status', 'pendente'),
        supabase.from('edu_rastreamento_ead').select('id', { count: 'exact' }).eq('aluno_id', perfil!.id).eq('concluido', false),
        supabase.from('edu_alertas_sistema').select('id, tipo, mensagem, created_at').eq('aluno_id', perfil!.id).eq('lido', false).order('created_at', { ascending: false }).limit(3),
      ]);

      let presencaGeral = 0;
      if (turmaIds.length) {
        const { data: aulas } = await supabase.from('edu_aulas').select('id').in('turma_id', turmaIds).eq('realizada', true);
        const aulasIds = aulas?.map((a) => a.id) ?? [];
        if (aulasIds.length) {
          const { data: presencas } = await supabase.from('edu_presencas').select('presente').in('aula_id', aulasIds).eq('aluno_id', perfil!.id);
          const total = presencas?.length ?? 0;
          const pres = presencas?.filter((p) => p.presente).length ?? 0;
          presencaGeral = total > 0 ? Math.round((pres / total) * 100) : 0;
        }
      }

      return {
        aulasHoje: (aulasHoje as any).count ?? 0,
        presencaGeral,
        ativPendentes: ativPendentes.count ?? 0,
        matNaoAcessados: matNaoAcessados.count ?? 0,
        alertas: alertas.data ?? [],
      };
    },
  });

  return (
    <div>
      <EduPageHeader title={`Olá, ${perfil?.nome?.split(' ')[0] ?? 'Aluno'}! 👋`} subtitle="Aqui está seu resumo acadêmico de hoje" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard label="Aulas hoje" value={metrics?.aulasHoje ?? 0} icon={<Calendar size={20} />} color="#1A3A6E" />
            <MetricCard
              label="Frequência geral"
              value={`${metrics?.presencaGeral ?? 0}%`}
              icon={<TrendingUp size={20} />}
              color={(metrics?.presencaGeral ?? 0) >= 75 ? '#22c55e' : (metrics?.presencaGeral ?? 0) >= 50 ? '#f59e0b' : '#ef4444'}
            />
            <MetricCard label="Atividades pendentes" value={metrics?.ativPendentes ?? 0} icon={<Files size={20} />} color="#D97706" />
            <MetricCard label="Materiais EAD pendentes" value={metrics?.matNaoAcessados ?? 0} icon={<Laptop size={20} />} color="#7C3AED" />
          </>
        )}
      </div>

      {/* Alertas */}
      {!!metrics?.alertas.length && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#1A3A6E] mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Alertas importantes
          </h2>
          <div className="space-y-2">
            {metrics.alertas.map((a: any) => (
              <AlertCard
                key={a.id}
                variant={a.tipo === 'falta_excesso' ? 'danger' : a.tipo === 'atividade_atrasada' ? 'warning' : 'info'}
                title={a.mensagem ?? 'Alerta do sistema'}
                action={
                  <Link to="/edu/aluno/notificacoes" className="text-xs font-bold text-[#1A3A6E] whitespace-nowrap hover:text-[#F26522]">
                    Ver →
                  </Link>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
