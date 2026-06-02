import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader } from '@/components/edu/AlertCard';
import { EduEmpty, TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Download, X, Check } from 'lucide-react';

export const Route = createFileRoute('/edu/professor/notas')({
  component: NotasPage,
});

const TIPOS_AVALIACAO = ['Prova 1', 'Prova 2', 'Trabalho 1', 'Seminário', 'Participação'];

function NotasPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [turmaId, setTurmaId] = useState('');
  const [editCell, setEditCell] = useState<{ alunoId: string; tipo: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: turmas } = useQuery({
    queryKey: ['prof-turmas-select', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data } = await supabase.from('edu_turmas').select('id, nome').eq('professor_id', perfil!.id).eq('ativo', true).order('nome');
      return data ?? [];
    },
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ['prof-notas-alunos', turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      const { data } = await supabase.from('edu_turma_alunos').select('aluno_id, perfis(id, nome, matricula)').eq('turma_id', turmaId);
      return data ?? [];
    },
  });

  const { data: notas, isLoading: loadingNotas } = useQuery({
    queryKey: ['prof-notas', turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      const { data } = await supabase.from('edu_notas').select('*').eq('turma_id', turmaId);
      return data ?? [];
    },
  });

  const salvarNotaMutation = useMutation({
    mutationFn: async ({ alunoId, tipo, valor }: { alunoId: string; tipo: string; valor: number }) => {
      const { error } = await supabase.from('edu_notas').upsert({
        turma_id: turmaId,
        aluno_id: alunoId,
        tipo_avaliacao: tipo,
        valor,
      }, { onConflict: 'turma_id,aluno_id,tipo_avaliacao' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prof-notas'] });
      setEditCell(null);
    },
    onError: () => toast.error('Erro ao salvar nota.'),
  });

  const getNota = (alunoId: string, tipo: string) => {
    return notas?.find((n) => n.aluno_id === alunoId && n.tipo_avaliacao === tipo)?.valor ?? null;
  };

  const getMedia = (alunoId: string) => {
    const notasAluno = TIPOS_AVALIACAO.map((t) => getNota(alunoId, t)).filter((n) => n !== null) as number[];
    if (!notasAluno.length) return null;
    return (notasAluno.reduce((a, b) => a + b, 0) / notasAluno.length).toFixed(1);
  };

  const exportCSV = () => {
    if (!alunos || !notas) return;
    const header = ['Aluno', 'Matrícula', ...TIPOS_AVALIACAO, 'Média'];
    const rows = alunos.map((a: any) => {
      const nome = a.perfis?.nome ?? 'Aluno';
      const mat = a.perfis?.matricula ?? '';
      const ns = TIPOS_AVALIACAO.map((t) => getNota(a.aluno_id, t) ?? '');
      const media = getMedia(a.aluno_id) ?? '';
      return [nome, mat, ...ns, media].join(',');
    });
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas-${turmaId}.csv`;
    a.click();
  };

  const isLoading = loadingAlunos || loadingNotas;

  return (
    <div>
      <EduPageHeader title="Notas" subtitle="Lance e gerencie notas por aluno e avaliação" />

      <div className="flex items-end gap-4 mb-6">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
          <select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white"
          >
            <option value="">Selecione uma turma...</option>
            {turmas?.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        {turmaId && (
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm font-bold text-[#1A3A6E] border border-[#1A3A6E] px-4 py-2.5 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all">
            <Download size={15} /> Exportar CSV
          </button>
        )}
      </div>

      {!turmaId ? (
        <EduEmpty title="Selecione uma turma" description="Escolha uma turma para visualizar e lançar as notas." />
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={TIPOS_AVALIACAO.length + 2} />
      ) : !alunos?.length ? (
        <EduEmpty title="Sem alunos na turma" description="Esta turma não possui alunos matriculados." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Aluno</th>
                {TIPOS_AVALIACAO.map((t) => (
                  <th key={t} className="text-center px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{t}</th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Média</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((a: any) => {
                const media = getMedia(a.aluno_id);
                const mediaNum = media ? parseFloat(media) : null;
                return (
                  <tr key={a.aluno_id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {a.perfis?.nome?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-xs">{a.perfis?.nome}</p>
                          {a.perfis?.matricula && <p className="text-[10px] text-slate-400">{a.perfis.matricula}</p>}
                        </div>
                      </div>
                    </td>
                    {TIPOS_AVALIACAO.map((tipo) => {
                      const nota = getNota(a.aluno_id, tipo);
                      const isEditing = editCell?.alunoId === a.aluno_id && editCell?.tipo === tipo;
                      return (
                        <td key={tipo} className="px-2 py-2 text-center">
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                min={0}
                                max={10}
                                step="0.1"
                                autoFocus
                                className="w-16 border border-[#1A3A6E] rounded-lg px-2 py-1 text-xs text-center outline-none"
                              />
                              <button
                                onClick={() => salvarNotaMutation.mutate({ alunoId: a.aluno_id, tipo, valor: parseFloat(editValue) })}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check size={13} />
                              </button>
                              <button onClick={() => setEditCell(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditCell({ alunoId: a.aluno_id, tipo }); setEditValue(nota?.toString() ?? ''); }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors hover:bg-slate-100 ${
                                nota === null ? 'text-slate-300' : nota >= 5 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                              }`}
                            >
                              {nota !== null ? nota.toFixed(1) : '—'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {mediaNum !== null ? (
                        <span className={`font-black text-sm ${mediaNum >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                          {media}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-50">
            Clique em qualquer célula para editar a nota. Notas abaixo de 5 são exibidas em vermelho.
          </p>
        </div>
      )}
    </div>
  );
}
