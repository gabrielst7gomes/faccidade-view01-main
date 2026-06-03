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
import { Plus, X, Clock } from 'lucide-react';
import { DIAS_SEMANA } from '@/types/edu';

export const Route = createFileRoute('/edu/coordenador/horarios')({
  component: HorariosPage,
});

const horarioSchema = z.object({
  turma_id: z.string().min(1, 'Selecione a turma'),
  dia_semana: z.coerce.number().min(1).max(6),
  hora_inicio: z.string().min(1, 'Horário de início obrigatório'),
  hora_fim: z.string().min(1, 'Horário de fim obrigatório'),
  sala: z.string().optional(),
});
type HorarioForm = z.infer<typeof horarioSchema>;

function HorariosPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['coord-horarios-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_horarios')
        .select('*, edu_turmas(nome, edu_disciplinas(nome), perfis(nome))')
        .order('dia_semana')
        .order('hora_inicio');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: turmas } = useQuery({
    queryKey: ['coord-turmas-select'],
    queryFn: async () => {
      const { data } = await supabase.from('edu_turmas').select('id, nome').eq('ativo', true).order('nome');
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<HorarioForm>({
    resolver: zodResolver(horarioSchema),
    defaultValues: { dia_semana: 1 },
  });

  const criarMutation = useMutation({
    mutationFn: async (values: HorarioForm) => {
      const { error } = await supabase.from('edu_horarios').insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Horário criado!');
      qc.invalidateQueries({ queryKey: ['coord-horarios-full'] });
      qc.invalidateQueries({ queryKey: ['coord-horarios'] });
      setShowModal(false);
      reset();
    },
    onError: () => toast.error('Erro ao criar horário.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('edu_horarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Horário removido.');
      qc.invalidateQueries({ queryKey: ['coord-horarios-full'] });
    },
  });

  const horariosPorDia = DIAS_SEMANA.slice(1).map((nome, i) => ({
    dia: i + 1,
    nome,
    items: horarios?.filter((h: any) => h.dia_semana === i + 1) ?? [],
  }));

  return (
    <div>
      <EduPageHeader
        title="Horários"
        subtitle="Configure os horários de cada turma por dia da semana"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all"
          >
            <Plus size={16} /> Novo horário
          </button>
        }
      />

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
        </div>
      ) : !horarios?.length ? (
        <EduEmpty
          title="Nenhum horário cadastrado"
          description="Adicione horários para cada turma."
          action={<button onClick={() => setShowModal(true)} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">Adicionar horário</button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {horariosPorDia.map(({ dia, nome, items }) => (
            <div key={dia} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#1A3A6E] flex items-center gap-2">
                <span className="text-white font-black text-sm">{nome}</span>
                <span className="ml-auto text-white/60 text-xs">{items.length} aula{items.length !== 1 ? 's' : ''}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-slate-300 text-center py-6">Sem horários</p>
              ) : (
                <div className="p-3 space-y-2">
                  {items.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg group">
                      <div className="flex items-center gap-1 text-[#1A3A6E] mt-0.5">
                        <Clock size={13} />
                        <span className="text-xs font-black">{h.hora_inicio?.slice(0, 5)}–{h.hora_fim?.slice(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{h.edu_turmas?.nome}</p>
                        <p className="text-xs text-slate-400 truncate">{h.edu_turmas?.edu_disciplinas?.nome}</p>
                        {h.sala && <p className="text-[10px] text-slate-400">Sala {h.sala}</p>}
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(h.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1A3A6E]">Novo horário</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit((v) => criarMutation.mutate(v))} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
                <select {...register('turma_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  <option value="">Selecione...</option>
                  {turmas?.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {errors.turma_id && <p className="text-xs text-red-500 mt-1">{errors.turma_id.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dia da semana</label>
                <select {...register('dia_semana')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                  {DIAS_SEMANA.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Início</label>
                  <input {...register('hora_inicio')} type="time" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                  {errors.hora_inicio && <p className="text-xs text-red-500 mt-1">{errors.hora_inicio.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fim</label>
                  <input {...register('hora_fim')} type="time" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                  {errors.hora_fim && <p className="text-xs text-red-500 mt-1">{errors.hora_fim.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sala (opcional)</label>
                <input {...register('sala')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold hover:bg-[#0D1B3E] disabled:opacity-70">
                  {criarMutation.isPending ? 'Salvando...' : 'Criar horário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
