import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, TableSkeleton } from '@/components/edu/EduEmpty';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/edu/aluno/boletim')({
  component: BoletimPage,
});

const TIPOS_AVALIACAO = ['Prova 1', 'Prova 2', 'Trabalho 1', 'Seminário', 'Participação'];

function BoletimPage() {
  const { perfil } = useEduAuth();

  const { data: boletim, isLoading } = useQuery({
    queryKey: ['aluno-boletim', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data: ta } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id, edu_turmas(id, nome, edu_disciplinas(nome))')
        .eq('aluno_id', perfil!.id);

      if (!ta?.length) return [];

      const result = await Promise.all(
        ta.map(async (item: any) => {
          const t = item.edu_turmas;
          const { data: notas } = await supabase
            .from('edu_notas')
            .select('*')
            .eq('turma_id', t.id)
            .eq('aluno_id', perfil!.id)
            .order('data');

          const notasMap: Record<string, number | null> = {};
          TIPOS_AVALIACAO.forEach((tipo) => {
            const n = notas?.find((n) => n.tipo_avaliacao === tipo);
            notasMap[tipo] = n?.valor ?? null;
          });

          const valores = Object.values(notasMap).filter((v) => v !== null) as number[];
          const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;

          const chartData = notas?.map((n) => ({
            name: n.tipo_avaliacao,
            nota: n.valor,
          })) ?? [];

          return {
            turma: t,
            notas: notasMap,
            media,
            chartData,
          };
        })
      );

      return result;
    },
  });

  return (
    <div>
      <EduPageHeader title="Boletim" subtitle="Suas notas por disciplina e avaliação" />

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : !boletim?.length ? (
        <EduEmpty title="Sem notas disponíveis" description="Seu boletim será exibido quando os professores lançarem as notas." />
      ) : (
        <div className="space-y-6">
          {boletim.map(({ turma, notas, media, chartData }: any) => {
            const status = media === null ? null : media >= 7 ? 'aprovado' : media >= 5 ? 'recuperacao' : 'reprovado';
            return (
              <div key={turma.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-[#1A3A6E]">{turma.edu_disciplinas?.nome ?? turma.nome}</h3>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {media !== null && (
                      <>
                        <div>
                          <p className={`font-black text-2xl ${
                            status === 'aprovado' ? 'text-green-600' :
                            status === 'recuperacao' ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {media.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-400">Média</p>
                        </div>
                        <Badge color={status === 'aprovado' ? 'green' : status === 'recuperacao' ? 'yellow' : 'red'}>
                          {status === 'aprovado' ? 'Aprovado' : status === 'recuperacao' ? 'Em recuperação' : 'Reprovado'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {TIPOS_AVALIACAO.map((tipo) => (
                          <th key={tipo} className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">{tipo}</th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {TIPOS_AVALIACAO.map((tipo) => {
                          const v = notas[tipo];
                          return (
                            <td key={tipo} className="px-4 py-4 text-center">
                              {v !== null ? (
                                <span className={`font-black text-lg ${v >= 5 ? 'text-green-600' : 'text-red-600'}`}>{v.toFixed(1)}</span>
                              ) : (
                                <span className="text-slate-300 text-sm">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center">
                          {media !== null ? (
                            <span className={`font-black text-xl ${
                              status === 'aprovado' ? 'text-green-600' :
                              status === 'recuperacao' ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {media.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {chartData.length >= 2 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                      <TrendingUp size={12} /> Evolução das notas
                    </p>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="nota" stroke="#1A3A6E" strokeWidth={2} dot={{ r: 4, fill: '#F26522' }} />
                      </LineChart>
                    </ResponsiveContainer>
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
