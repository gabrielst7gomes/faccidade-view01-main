import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Users, Search } from 'lucide-react';
import type { EduTurma, Perfil, EduDisciplina } from '@/types/edu';
import { DIAS_SEMANA } from '@/types/edu';

export const Route = createFileRoute('/edu/coordenador/turmas')({
  component: TurmasPage,
});

const turmaSchema = z.object({
  nome: z.string().min(2),
  disciplina_id: z.string().min(1, 'Selecione a disciplina'),
  professor_id: z.string().min(1, 'Selecione o professor'),
  sala: z.string().optional(),
  semestre: z.string().optional(),
  ano: z.coerce.number().default(new Date().getFullYear()),
});
type TurmaForm = z.infer<typeof turmaSchema>;

const TURNO_COLOR: Record<string, string> = {
  matutino: 'blue',
  noturno: 'orange',
  integral: 'green',
};

function TurmasPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<EduTurma | null>(null);
  const [searchAluno, setSearchAluno] = useState('');
  const [view, setView] = useState<'lista' | 'grade'>('lista');

  const { data: turmas, isLoading } = useQuery({
    queryKey: ['coord-turmas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_turmas')
        .select('*, edu_disciplinas(*, edu_cursos(*)), perfis(nome)')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data as EduTurma[];
    },
  });

  const { data: disciplinas } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => {
      const { data } = await supabase.from('edu_disciplinas').select('*').order('nome');
      return data as EduDisciplina[];
    },
  });

  const { data: professores } = useQuery({
    queryKey: ['coord-profs-select'],
    queryFn: async () => {
      const { data } = await supabase.from('perfis').select('id, nome').eq('perfil', 'professor').order('nome');
      return data as Perfil[];
    },
  });

  const { data: horarios } = useQuery({
    queryKey: ['coord-horarios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_horarios')
        .select('*, edu_turmas(nome, edu_disciplinas(nome), perfis(nome))');
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TurmaForm>({
    resolver: zodResolver(turmaSchema),
    defaultValues: { ano: new Date().getFullYear() },
  });

  const criarMutation = useMutation({
    mutationFn: async (values: TurmaForm) => {
      const { error } = await supabase.from('edu_turmas').insert({ ...values, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Turma criada com sucesso!');
      qc.invalidateQueries({ queryKey: ['coord-turmas'] });
      setShowModal(false);
      reset();
    },
    onError: () => toast.error('Erro ao criar turma.'),
  });

  const { data: turmaAlunos } = useQuery({
    queryKey: ['coord-turma-alunos', selectedTurma?.id],
    enabled: !!selectedTurma,
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turma_alunos')
        .select('*, perfis(nome, email, matricula)')
        .eq('turma_id', selectedTurma!.id);
      return data ?? [];
    },
  });

  const { data: alunosDisponiveis } = useQuery({
    queryKey: ['coord-alunos-disponiveis', selectedTurma?.id, searchAluno],
    enabled: !!selectedTurma && searchAluno.length > 1,
    queryFn: async () => {
      const { data } = await supabase
        .from('perfis')
        .select('id, nome, email, matricula')
        .eq('perfil', 'aluno')
        .ilike('nome', `%${searchAluno}%`)
        .limit(10);
      return data ?? [];
    },
  });

  const addAlunoMutation = useMutation({
    mutationFn: async (alunoId: string) => {
      const { error } = await supabase.from('edu_turma_alunos').insert({ turma_id: selectedTurma!.id, aluno_id: alunoId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Aluno adicionado!');
      qc.invalidateQueries({ queryKey: ['coord-turma-alunos'] });
      setSearchAluno('');
    },
    onError: () => toast.error('Aluno já matriculado ou erro ao adicionar.'),
  });

  const removeAlunoMutation = useMutation({
    mutationFn: async ({ turmaId, alunoId }: { turmaId: string; alunoId: string }) => {
      const { error } = await supabase.from('edu_turma_alunos').delete().eq('turma_id', turmaId).eq('aluno_id', alunoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Aluno removido da turma.');
      qc.invalidateQueries({ queryKey: ['coord-turma-alunos'] });
    },
  });

  return (
    <div>
      <EduPageHeader
        title="Turmas e Grade"
        subtitle="Gerencie turmas, alunos e visualize a grade semanal"
        action={
          <div className="flex gap-2">
            <button onClick={() => setView(view === 'lista' ? 'grade' : 'lista')} className="px-4 py-2.5 border border-[#1A3A6E] text-[#1A3A6E] text-sm font-bold rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all">
              {view === 'lista' ? 'Ver grade' : 'Ver lista'}
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
              <Plus size={16} /> Nova turma
            </button>
          </div>
        }
      />

      {view === 'grade' ? (
        <GradeView horarios={horarios ?? []} />
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : !turmas?.length ? (
        <EduEmpty title="Nenhuma turma cadastrada" description="Crie turmas vinculando disciplinas e professores." action={<button onClick={() => setShowModal(true)} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">Nova turma</button>} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Turma</th>
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Disciplina</th>
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Professor</th>
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Sala</th>
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Turno</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {turmas.map((t) => {
                const turno = (t.edu_disciplinas as any)?.edu_cursos?.turno ?? '';
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1A3A6E]">{t.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{(t.edu_disciplinas as any)?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{(t.perfis as any)?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{t.sala ?? '—'}</td>
                    <td className="px-4 py-3">
                      {turno && <Badge color={TURNO_COLOR[turno] as any}>{turno}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedTurma(t)} className="text-xs font-bold text-[#1A3A6E] hover:text-[#F26522] transition-colors">
                        Gerenciar →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nova turma */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1A3A6E]">Nova turma</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit((v) => criarMutation.mutate(v))} className="space-y-4">
              {[
                { label: 'Nome da turma', name: 'nome' as const, type: 'text' },
                { label: 'Sala', name: 'sala' as const, type: 'text' },
                { label: 'Semestre', name: 'semestre' as const, type: 'text', placeholder: 'Ex: 2025.1' },
                { label: 'Ano', name: 'ano' as const, type: 'number' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <input {...register(f.name)} type={f.type} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Disciplina</label>
                <select {...register('disciplina_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="">Selecione...</option>
                  {disciplinas?.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
                {errors.disciplina_id && <p className="text-xs text-red-500 mt-1">{errors.disciplina_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Professor</label>
                <select {...register('professor_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="">Selecione...</option>
                  {professores?.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {errors.professor_id && <p className="text-xs text-red-500 mt-1">{errors.professor_id.message}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold hover:bg-[#0D1B3E] disabled:opacity-70">
                  {criarMutation.isPending ? 'Criando...' : 'Criar turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gerenciar alunos da turma */}
      {selectedTurma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedTurma(null); setSearchAluno(''); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-[#1A3A6E]">{selectedTurma.nome}</h3>
                <p className="text-xs text-slate-400 font-medium">{turmaAlunos?.length ?? 0} alunos matriculados</p>
              </div>
              <button onClick={() => { setSelectedTurma(null); setSearchAluno(''); }}><X size={18} className="text-slate-400" /></button>
            </div>

            {/* Buscar aluno */}
            <div className="mb-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchAluno}
                  onChange={(e) => setSearchAluno(e.target.value)}
                  placeholder="Buscar aluno por nome..."
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]"
                />
              </div>
              {alunosDisponiveis && alunosDisponiveis.length > 0 && (
                <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  {alunosDisponiveis.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => addAlunoMutation.mutate(a.id)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">{a.nome}</span>
                      <span className="text-xs text-slate-400">{a.matricula ?? a.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alunos matriculados */}
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Alunos matriculados</h4>
            {!turmaAlunos?.length ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum aluno matriculado</p>
            ) : (
              <div className="space-y-2">
                {turmaAlunos.map((ta: any) => (
                  <div key={ta.aluno_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white text-xs font-bold">
                        {ta.perfis?.nome?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{ta.perfis?.nome}</p>
                        <p className="text-xs text-slate-400">{ta.perfis?.matricula ?? ta.perfis?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAlunoMutation.mutate({ turmaId: ta.turma_id, alunoId: ta.aluno_id })}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GradeView({ horarios }: { horarios: any[] }) {
  const dias = [1, 2, 3, 4, 5, 6];
  const horariosPorDia: Record<number, any[]> = {};
  dias.forEach((d) => { horariosPorDia[d] = horarios.filter((h) => h.dia_semana === d); });

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-auto">
      <table className="w-full text-xs min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="w-24" />
            {dias.map((d) => (
              <th key={d} className="px-3 py-3 text-center font-black uppercase tracking-wider text-slate-500 border-l border-slate-100">
                {DIAS_SEMANA[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-3 py-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-r border-slate-100">Horários</td>
            {dias.map((d) => (
              <td key={d} className="px-2 py-2 border-l border-slate-100 align-top">
                {horariosPorDia[d].length === 0 ? (
                  <p className="text-slate-200 text-center text-xs py-4">—</p>
                ) : (
                  <div className="space-y-1.5">
                    {horariosPorDia[d].map((h: any) => {
                      const turno = h.edu_turmas?.edu_disciplinas?.edu_cursos?.turno ?? 'noturno';
                      const colors: Record<string, string> = {
                        matutino: 'bg-blue-50 border-blue-200 text-blue-800',
                        noturno: 'bg-indigo-50 border-indigo-200 text-indigo-800',
                        integral: 'bg-green-50 border-green-200 text-green-800',
                      };
                      return (
                        <div key={h.id} className={`rounded-lg border px-2 py-1.5 ${colors[turno]}`}>
                          <p className="font-bold text-[11px] leading-tight">{h.edu_turmas?.edu_disciplinas?.nome ?? h.edu_turmas?.nome}</p>
                          <p className="text-[10px] opacity-70">{h.hora_inicio?.slice(0, 5)}–{h.hora_fim?.slice(0, 5)}</p>
                          {h.sala && <p className="text-[10px] opacity-60">Sala {h.sala}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
