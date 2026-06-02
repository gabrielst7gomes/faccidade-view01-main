import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EduPageHeader } from '@/components/edu/AlertCard';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, BookOpen } from 'lucide-react';

export const Route = createFileRoute('/edu/coordenador/configuracoes')({
  component: ConfiguracoesPage,
});

const cursoSchema = z.object({
  nome: z.string().min(2),
  codigo: z.string().optional(),
  turno: z.enum(['matutino', 'noturno', 'integral']),
});
type CursoForm = z.infer<typeof cursoSchema>;

const disciplinaSchema = z.object({
  nome: z.string().min(2),
  codigo: z.string().optional(),
  curso_id: z.string().min(1, 'Selecione o curso'),
  carga_horaria: z.coerce.number().optional(),
  semestre: z.coerce.number().optional(),
});
type DisciplinaForm = z.infer<typeof disciplinaSchema>;

function ConfiguracoesPage() {
  const [tab, setTab] = useState<'cursos' | 'disciplinas'>('cursos');
  const qc = useQueryClient();
  const [showCurso, setShowCurso] = useState(false);
  const [showDisciplina, setShowDisciplina] = useState(false);

  const { data: cursos } = useQuery({
    queryKey: ['edu-cursos'],
    queryFn: async () => {
      const { data } = await supabase.from('edu_cursos').select('*').order('nome');
      return data ?? [];
    },
  });

  const { data: disciplinas } = useQuery({
    queryKey: ['edu-disciplinas-full'],
    queryFn: async () => {
      const { data } = await supabase.from('edu_disciplinas').select('*, edu_cursos(nome)').order('nome');
      return data ?? [];
    },
  });

  const cursoForm = useForm<CursoForm>({ resolver: zodResolver(cursoSchema), defaultValues: { turno: 'noturno' } });
  const disciplinaForm = useForm<DisciplinaForm>({ resolver: zodResolver(disciplinaSchema) });

  const criarCurso = useMutation({
    mutationFn: async (v: CursoForm) => {
      const { error } = await supabase.from('edu_cursos').insert({ ...v, ativo: true });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Curso criado!'); qc.invalidateQueries({ queryKey: ['edu-cursos'] }); setShowCurso(false); cursoForm.reset(); },
    onError: () => toast.error('Erro ao criar curso.'),
  });

  const criarDisciplina = useMutation({
    mutationFn: async (v: DisciplinaForm) => {
      const { error } = await supabase.from('edu_disciplinas').insert(v);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Disciplina criada!'); qc.invalidateQueries({ queryKey: ['edu-disciplinas-full'] }); qc.invalidateQueries({ queryKey: ['disciplinas'] }); setShowDisciplina(false); disciplinaForm.reset(); },
    onError: () => toast.error('Erro ao criar disciplina.'),
  });

  return (
    <div>
      <EduPageHeader title="Configurações" subtitle="Gerencie cursos e disciplinas do sistema" />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[{ id: 'cursos', label: 'Cursos' }, { id: 'disciplinas', label: 'Disciplinas' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-white text-[#1A3A6E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cursos' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCurso(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
              <Plus size={16} /> Novo curso
            </button>
          </div>
          {!cursos?.length ? (
            <EduEmpty title="Nenhum curso" description="Adicione cursos para organizar as disciplinas." icon={<BookOpen size={28} />} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursos.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[#1A3A6E]">{c.nome}</p>
                      {c.codigo && <p className="text-xs text-slate-400 mt-0.5">{c.codigo}</p>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.turno === 'matutino' ? 'bg-blue-100 text-blue-700' : c.turno === 'noturno' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                      {c.turno}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'disciplinas' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowDisciplina(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
              <Plus size={16} /> Nova disciplina
            </button>
          </div>
          {!disciplinas?.length ? (
            <EduEmpty title="Nenhuma disciplina" description="Adicione disciplinas vinculadas aos cursos." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Nome', 'Código', 'Curso', 'Carga Horária', 'Semestre'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disciplinas.map((d: any) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">{d.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{d.codigo ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{d.edu_cursos?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{d.carga_horaria ? `${d.carga_horaria}h` : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{d.semestre ?? '—'}º</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal curso */}
      {showCurso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCurso(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#1A3A6E]">Novo curso</h3>
              <button onClick={() => setShowCurso(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={cursoForm.handleSubmit((v) => criarCurso.mutate(v))} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome</label>
                <input {...cursoForm.register('nome')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Código</label>
                <input {...cursoForm.register('codigo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turno</label>
                <select {...cursoForm.register('turno')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="matutino">Matutino</option>
                  <option value="noturno">Noturno</option>
                  <option value="integral">Integral</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCurso(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
                <button type="submit" disabled={criarCurso.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {criarCurso.isPending ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal disciplina */}
      {showDisciplina && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDisciplina(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#1A3A6E]">Nova disciplina</h3>
              <button onClick={() => setShowDisciplina(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={disciplinaForm.handleSubmit((v) => criarDisciplina.mutate(v))} className="space-y-4">
              {[{ label: 'Nome', name: 'nome' as const }, { label: 'Código', name: 'codigo' as const }].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <input {...disciplinaForm.register(f.name)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Curso</label>
                <select {...disciplinaForm.register('curso_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="">Selecione...</option>
                  {cursos?.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Carga Horária</label>
                  <input {...disciplinaForm.register('carga_horaria')} type="number" placeholder="80" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Semestre</label>
                  <input {...disciplinaForm.register('semestre')} type="number" placeholder="1" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDisciplina(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
                <button type="submit" disabled={criarDisciplina.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {criarDisciplina.isPending ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
