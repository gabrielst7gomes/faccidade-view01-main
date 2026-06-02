import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, CardSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Bell, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TipoAtividade } from '@/types/edu';
import { TIPO_ATIVIDADE_LABEL, STATUS_ENTREGA_COLOR, STATUS_ENTREGA_LABEL } from '@/types/edu';

export const Route = createFileRoute('/edu/professor/atividades')({
  component: AtividadesPage,
});

const atividadeSchema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().optional(),
  tipo: z.enum(['trabalho', 'prova', 'exercicio', 'complementar', 'seminario']),
  turma_id: z.string().min(1, 'Selecione a turma'),
  data_entrega: z.string().optional(),
  pontuacao_maxima: z.coerce.number().min(0).max(100).default(10),
});
type AtividadeForm = z.infer<typeof atividadeSchema>;

function AtividadesPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedAtv, setSelectedAtv] = useState<any | null>(null);
  const [corrigindo, setCorrigindo] = useState<any | null>(null);
  const [nota, setNota] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: atividades, isLoading } = useQuery({
    queryKey: ['prof-atividades', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_atividades')
        .select('*, edu_turmas(nome, edu_disciplinas(nome))')
        .eq('professor_id', perfil!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: turmas } = useQuery({
    queryKey: ['prof-turmas-select', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data } = await supabase.from('edu_turmas').select('id, nome').eq('professor_id', perfil!.id).eq('ativo', true).order('nome');
      return data ?? [];
    },
  });

  const { data: entregas } = useQuery({
    queryKey: ['prof-entregas', selectedAtv?.id],
    enabled: !!selectedAtv?.id,
    queryFn: async () => {
      const [{ data: entregasData }, { data: alunos }] = await Promise.all([
        supabase.from('edu_entregas').select('*, perfis(nome)').eq('atividade_id', selectedAtv.id),
        supabase.from('edu_turma_alunos').select('aluno_id, perfis(nome)').eq('turma_id', selectedAtv.turma_id),
      ]);

      const entregasMap: Record<string, any> = {};
      entregasData?.forEach((e) => { entregasMap[e.aluno_id] = e; });

      return alunos?.map((a: any) => ({
        aluno_id: a.aluno_id,
        nome: a.perfis?.nome ?? 'Aluno',
        entrega: entregasMap[a.aluno_id] ?? null,
      })) ?? [];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AtividadeForm>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: { tipo: 'trabalho', pontuacao_maxima: 10 },
  });

  const criarMutation = useMutation({
    mutationFn: async (values: AtividadeForm) => {
      const { error } = await supabase.from('edu_atividades').insert({ ...values, professor_id: perfil!.id, data_entrega: values.data_entrega || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Atividade criada!');
      qc.invalidateQueries({ queryKey: ['prof-atividades'] });
      setShowModal(false);
      reset();
    },
    onError: () => toast.error('Erro ao criar atividade.'),
  });

  const corrigirMutation = useMutation({
    mutationFn: async ({ entregaId, alunoId }: { entregaId?: string; alunoId: string }) => {
      if (entregaId) {
        const { error } = await supabase.from('edu_entregas').update({ nota: parseFloat(nota), feedback, status: 'corrigido' }).eq('id', entregaId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Nota lançada!');
      qc.invalidateQueries({ queryKey: ['prof-entregas'] });
      setCorrigindo(null);
      setNota('');
      setFeedback('');
    },
    onError: () => toast.error('Erro ao lançar nota.'),
  });

  const notificarMutation = useMutation({
    mutationFn: async (alunoId: string) => {
      const { error } = await supabase.from('edu_alertas_sistema').insert({
        aluno_id: alunoId,
        tipo: 'atividade_atrasada',
        mensagem: `Você tem uma atividade "${selectedAtv?.titulo}" com entrega pendente.`,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Notificação enviada.'),
    onError: () => toast.error('Erro ao notificar.'),
  });

  const getStatusAtividade = (atv: any) => {
    if (!atv.data_entrega) return { label: 'Em aberto', color: 'blue' as const };
    if (new Date(atv.data_entrega) > new Date()) return { label: 'Em aberto', color: 'blue' as const };
    return { label: 'Prazo encerrado', color: 'red' as const };
  };

  return (
    <div>
      <EduPageHeader
        title="Atividades"
        subtitle="Crie e gerencie atividades para suas turmas"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
            <Plus size={16} /> Nova atividade
          </button>
        }
      />

      {isLoading ? <CardSkeleton count={3} /> : !atividades?.length ? (
        <EduEmpty title="Nenhuma atividade" description="Crie atividades para suas turmas." action={<button onClick={() => setShowModal(true)} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">Nova atividade</button>} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atividades.map((atv: any) => {
            const status = getStatusAtividade(atv);
            return (
              <div key={atv.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAtv(atv)}>
                <div className="flex items-start justify-between mb-3">
                  <Badge color={
                    atv.tipo === 'prova' ? 'red' :
                    atv.tipo === 'trabalho' ? 'blue' :
                    atv.tipo === 'exercicio' ? 'green' : 'gray'
                  }>
                    {TIPO_ATIVIDADE_LABEL[atv.tipo as TipoAtividade]}
                  </Badge>
                  <Badge color={status.color}>{status.label}</Badge>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{atv.titulo}</h3>
                <p className="text-xs text-slate-400">{(atv.edu_turmas as any)?.nome}</p>
                {atv.data_entrega && (
                  <p className="text-xs text-slate-500 mt-2">
                    Prazo: {format(new Date(atv.data_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Star size={14} className="text-[#F26522]" />
                  <span className="text-xs font-bold text-slate-600">{atv.pontuacao_maxima} pontos</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar atividade */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1A3A6E]">Nova atividade</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit((v) => criarMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título</label>
                <input {...register('titulo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                <textarea {...register('descricao')} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                  <select {...register('tipo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                    {Object.entries(TIPO_ATIVIDADE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pontuação</label>
                  <input {...register('pontuacao_maxima')} type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
                <select {...register('turma_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="">Selecione...</option>
                  {turmas?.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {errors.turma_id && <p className="text-xs text-red-500 mt-1">{errors.turma_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prazo de entrega</label>
                <input {...register('data_entrega')} type="datetime-local" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {criarMutation.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal entregas */}
      {selectedAtv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAtv(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-[#1A3A6E]">{selectedAtv.titulo}</h3>
              <button onClick={() => setSelectedAtv(null)}><X size={18} className="text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-5">{selectedAtv.descricao}</p>

            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Entregas dos alunos</h4>
            <div className="space-y-2">
              {entregas?.map((e: any) => (
                <div key={e.aluno_id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {e.nome?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{e.nome}</p>
                    {e.entrega ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_ENTREGA_COLOR[e.entrega.status as keyof typeof STATUS_ENTREGA_COLOR]}`}>
                        {STATUS_ENTREGA_LABEL[e.entrega.status as keyof typeof STATUS_ENTREGA_LABEL]}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Não entregou</span>
                    )}
                  </div>
                  {e.entrega?.nota != null && (
                    <span className="text-sm font-black text-[#1A3A6E]">{e.entrega.nota}/{selectedAtv.pontuacao_maxima}</span>
                  )}
                  {e.entrega && e.entrega.status !== 'corrigido' && (
                    <button onClick={() => { setCorrigindo(e); setNota(e.entrega?.nota?.toString() ?? ''); setFeedback(e.entrega?.feedback ?? ''); }}
                      className="text-xs font-bold text-[#1A3A6E] border border-[#1A3A6E] px-3 py-1 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all">
                      Corrigir
                    </button>
                  )}
                  {!e.entrega && (
                    <button onClick={() => notificarMutation.mutate(e.aluno_id)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <Bell size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal corrigir */}
      {corrigindo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCorrigindo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-[#1A3A6E] mb-1">Corrigir entrega</h3>
            <p className="text-sm text-slate-500 mb-4">{corrigindo.nome}</p>
            {corrigindo.entrega?.texto_resposta && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 max-h-32 overflow-y-auto">
                {corrigindo.entrega.texto_resposta}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nota (máx: {selectedAtv?.pontuacao_maxima})</label>
                <input type="number" value={nota} onChange={(e) => setNota(e.target.value)} min={0} max={selectedAtv?.pontuacao_maxima} step="0.1"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Feedback</label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setCorrigindo(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
                <button onClick={() => corrigirMutation.mutate({ entregaId: corrigindo.entrega?.id, alunoId: corrigindo.aluno_id })}
                  disabled={corrigirMutation.isPending}
                  className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {corrigirMutation.isPending ? 'Salvando...' : 'Salvar nota'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
