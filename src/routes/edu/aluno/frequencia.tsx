import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader } from '@/components/edu/AlertCard';
import { EduEmpty, TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const Route = createFileRoute('/edu/aluno/frequencia')({
  component: FrequenciaPage,
});

function FrequenciaPage() {
  const { perfil } = useEduAuth();
  const [selectedTurma, setSelectedTurma] = useState<string | null>(null);

  const { data: turmas, isLoading } = useQuery({
    queryKey: ['aluno-turmas-freq', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data: ta } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id, edu_turmas(id, nome, edu_disciplinas(nome, carga_horaria), perfis(nome))')
        .eq('aluno_id', perfil!.id);

      if (!ta?.length) return [];

      const result = await Promise.all(
        (ta ?? []).map(async (item: any) => {
          const t = item.edu_turmas;
          const { data: aulas } = await supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true);
          const aulasIds = aulas?.map((a) => a.id) ?? [];

          if (!aulasIds.length) return { ...t, totalAulas: 0, faltas: 0, presencas: 0, pct: 100, limite: 25 };

          const { data: presencas } = await supabase.from('edu_presencas').select('presente').in('aula_id', aulasIds).eq('aluno_id', perfil!.id);
          const total = presencas?.length ?? 0;
          const presentes = presencas?.filter((p) => p.presente).length ?? 0;
          const faltas = total - presentes;
          const pct = total > 0 ? Math.round((presentes / total) * 100) : 100;
          const pctFaltas = total > 0 ? Math.round((faltas / total) * 100) : 0;

          return {
            ...t,
            totalAulas: total,
            faltas,
            presencas: presentes,
            pct,
            pctFaltas,
            limite: 25,
          };
        })
      );

      return result;
    },
  });

  const { data: historico } = useQuery({
    queryKey: ['aluno-historico-freq', perfil?.id, selectedTurma],
    enabled: !!perfil?.id && !!selectedTurma,
    queryFn: async () => {
      const { data: aulas } = await supabase
        .from('edu_aulas')
        .select('id, data, conteudo, edu_presencas!inner(presente, aluno_id)')
        .eq('turma_id', selectedTurma)
        .eq('realizada', true)
        .eq('edu_presencas.aluno_id', perfil!.id)
        .order('data', { ascending: false });

      return aulas ?? [];
    },
  });

  return (
    <div>
      <EduPageHeader title="Frequência" subtitle="Acompanhe sua presença em cada disciplina" />

      {isLoading ? <TableSkeleton rows={4} cols={4} /> : !turmas?.length ? (
        <EduEmpty title="Sem turmas matriculadas" description="Você ainda não está matriculado em nenhuma turma." />
      ) : (
        <div className="space-y-4">
          {turmas.map((t: any) => {
            const pctFaltas = t.pctFaltas ?? 0;
            const barColor = pctFaltas >= 25 ? 'bg-red-500' : pctFaltas >= 15 ? 'bg-amber-500' : 'bg-green-500';
            const status = pctFaltas >= 25 ? 'danger' : pctFaltas >= 15 ? 'warning' : 'ok';

            return (
              <div
                key={t.id}
                className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow ${selectedTurma === t.id ? 'border-[#1A3A6E] ring-2 ring-[#1A3A6E]/10' : 'border-slate-100'}`}
                onClick={() => setSelectedTurma(selectedTurma === t.id ? null : t.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#1A3A6E]">{t.edu_disciplinas?.nome ?? t.nome}</h3>
                    <p className="text-xs text-slate-400">{t.perfis?.nome} • {t.totalAulas} aulas registradas</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${pctFaltas >= 25 ? 'text-red-600' : pctFaltas >= 15 ? 'text-amber-600' : 'text-green-600'}`}>
                      {t.pct}%
                    </p>
                    <p className="text-xs text-slate-400">presença</p>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mb-2">
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pctFaltas}%`, maxWidth: '100%' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">{t.faltas} falta{t.faltas !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-slate-400">limite: {t.limite}%</span>
                  </div>
                </div>

                {status === 'danger' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
                    <AlertTriangle size={13} />
                    Risco de reprovação por falta! Procure a coordenação.
                  </div>
                )}
                {status === 'warning' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                    <AlertTriangle size={13} />
                    Atenção: você está se aproximando do limite de faltas.
                  </div>
                )}

                {/* Histórico */}
                {selectedTurma === t.id && historico && historico.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Histórico de chamadas</h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {historico.map((aula: any) => {
                        const presente = (aula.edu_presencas as any[])?.[0]?.presente ?? false;
                        return (
                          <div key={aula.id} className="flex items-center gap-3 text-xs">
                            <span className={presente ? 'text-green-500' : 'text-red-500'}>
                              {presente ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            </span>
                            <span className="text-slate-600 font-medium w-24 shrink-0">
                              {format(new Date(aula.data), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <span className="text-slate-400 truncate">{aula.conteudo ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
