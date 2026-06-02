import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader } from '@/components/edu/AlertCard';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookOpen, ClipboardList, MapPin, Clock } from 'lucide-react';

export const Route = createFileRoute('/edu/aluno/agenda')({
  component: AgendaPage,
});

function AgendaPage() {
  const { perfil } = useEduAuth();

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['aluno-agenda', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data: ta } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id, edu_turmas(id, nome, edu_disciplinas(nome))')
        .eq('aluno_id', perfil!.id);

      const turmaIds = ta?.map((t: any) => t.turma_id) ?? [];
      const turmasMap: Record<string, any> = {};
      ta?.forEach((t: any) => { turmasMap[t.turma_id] = t.edu_turmas; });

      if (!turmaIds.length) return { aulas: [], atividades: [] };

      const hoje = format(new Date(), 'yyyy-MM-dd');
      const emSeteDias = format(addDays(new Date(), 30), 'yyyy-MM-dd');

      const [{ data: aulas }, { data: atividades }, { data: horarios }] = await Promise.all([
        supabase
          .from('edu_aulas')
          .select('id, data, hora_inicio, hora_fim, conteudo, turma_id')
          .in('turma_id', turmaIds)
          .gte('data', hoje)
          .lte('data', emSeteDias)
          .order('data'),
        supabase
          .from('edu_atividades')
          .select('id, titulo, tipo, data_entrega, turma_id, pontuacao_maxima')
          .in('turma_id', turmaIds)
          .gte('data_entrega', hoje)
          .order('data_entrega'),
        supabase
          .from('edu_horarios')
          .select('*')
          .in('turma_id', turmaIds),
      ]);

      return {
        aulas: (aulas ?? []).map((a) => ({ ...a, turma: turmasMap[a.turma_id] })),
        atividades: (atividades ?? []).map((a) => ({ ...a, turma: turmasMap[a.turma_id] })),
        horarios: (horarios ?? []).map((h) => ({ ...h, turma: turmasMap[h.turma_id] })),
      };
    },
  });

  const proximos7Dias = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  const getEventosDia = (dia: Date) => {
    const dataStr = format(dia, 'yyyy-MM-dd');
    const aulasDia = (eventos?.aulas ?? []).filter((a: any) => a.data === dataStr);

    const atividadesDia = (eventos?.atividades ?? []).filter((a: any) => {
      if (!a.data_entrega) return false;
      return isSameDay(new Date(a.data_entrega), dia);
    });

    return { aulasDia, atividadesDia };
  };

  return (
    <div>
      <EduPageHeader title="Minha Agenda" subtitle="Aulas e prazos dos próximos 7 dias" />

      {isLoading ? (
        <div className="animate-pulse space-y-4">{[...Array(7)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {proximos7Dias.map((dia) => {
            const { aulasDia, atividadesDia } = getEventosDia(dia);
            const isHoje = isSameDay(dia, new Date());
            const hasEventos = aulasDia.length > 0 || atividadesDia.length > 0;

            return (
              <div key={dia.toISOString()} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isHoje ? 'border-[#1A3A6E] ring-2 ring-[#1A3A6E]/10' : 'border-slate-100'}`}>
                <div className={`flex items-center gap-4 px-5 py-3 ${isHoje ? 'bg-[#1A3A6E]' : 'bg-slate-50'}`}>
                  <div className={`text-center min-w-[36px] ${isHoje ? 'text-white' : 'text-slate-600'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isHoje ? 'text-white/70' : 'text-slate-400'}`}>
                      {format(dia, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-xl font-black leading-none`}>{format(dia, 'dd')}</p>
                  </div>
                  <p className={`text-sm font-bold capitalize ${isHoje ? 'text-white/80' : 'text-slate-500'}`}>
                    {format(dia, 'MMMM yyyy', { locale: ptBR })}
                    {isHoje && <span className="ml-2 text-[#F26522] font-black">(Hoje)</span>}
                  </p>
                  {!hasEventos && (
                    <span className={`ml-auto text-xs ${isHoje ? 'text-white/40' : 'text-slate-300'}`}>Sem eventos</span>
                  )}
                </div>

                {hasEventos && (
                  <div className="p-4 space-y-2">
                    {aulasDia.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <BookOpen size={15} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-blue-800">{a.turma?.edu_disciplinas?.nome ?? a.turma?.nome}</p>
                          {a.conteudo && <p className="text-xs text-blue-500 truncate">{a.conteudo}</p>}
                        </div>
                        {a.hora_inicio && (
                          <div className="flex items-center gap-1 text-xs text-blue-500 shrink-0">
                            <Clock size={12} />
                            <span>{a.hora_inicio.slice(0, 5)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {atividadesDia.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <ClipboardList size={15} className="text-orange-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-orange-800">{a.titulo}</p>
                          <p className="text-xs text-orange-500">{a.turma?.edu_disciplinas?.nome ?? a.turma?.nome} • {a.tipo}</p>
                        </div>
                        {a.data_entrega && (
                          <div className="flex items-center gap-1 text-xs text-orange-500 shrink-0">
                            <Clock size={12} />
                            <span>{format(new Date(a.data_entrega), 'HH:mm')}</span>
                          </div>
                        )}
                      </div>
                    ))}
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
