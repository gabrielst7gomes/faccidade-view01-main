import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Megaphone, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/edu/professor/comunicados')({
  component: ComunicadosPage,
});

const comunicadoSchema = z.object({
  titulo: z.string().min(2),
  mensagem: z.string().min(5),
  tipo: z.enum(['aviso', 'urgente', 'lembrete']),
  turma_id: z.string().min(1, 'Selecione a turma'),
});
type ComunicadoForm = z.infer<typeof comunicadoSchema>;

const TIPO_CONFIG = {
  aviso: { label: 'Aviso', color: 'blue' as const, icon: <Info size={15} /> },
  urgente: { label: 'Urgente', color: 'red' as const, icon: <AlertTriangle size={15} /> },
  lembrete: { label: 'Lembrete', color: 'yellow' as const, icon: <Megaphone size={15} /> },
};

function ComunicadosPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [preview, setPreview] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ComunicadoForm>({
    resolver: zodResolver(comunicadoSchema),
    defaultValues: { tipo: 'aviso' },
  });
  const formValues = watch();

  const { data: comunicados, isLoading } = useQuery({
    queryKey: ['prof-comunicados', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_comunicados')
        .select('*, edu_turmas(nome)')
        .eq('remetente_id', perfil!.id)
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

  const criarMutation = useMutation({
    mutationFn: async (values: ComunicadoForm) => {
      const { error } = await supabase.from('edu_comunicados').insert({ ...values, remetente_id: perfil!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Comunicado enviado!');
      qc.invalidateQueries({ queryKey: ['prof-comunicados'] });
      setShowModal(false);
      setPreview(false);
      reset();
    },
    onError: () => toast.error('Erro ao enviar comunicado.'),
  });

  return (
    <div>
      <EduPageHeader
        title="Comunicados"
        subtitle="Envie avisos e recados para suas turmas"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
            <Plus size={16} /> Novo comunicado
          </button>
        }
      />

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}</div>
      ) : !comunicados?.length ? (
        <EduEmpty title="Nenhum comunicado enviado" description="Envie avisos, lembretes e comunicados urgentes para suas turmas." action={<button onClick={() => setShowModal(true)} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">Novo comunicado</button>} />
      ) : (
        <div className="space-y-3">
          {comunicados.map((c: any) => {
            const cfg = TIPO_CONFIG[c.tipo as keyof typeof TIPO_CONFIG];
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge color={cfg.color}>{cfg.icon}{' '}{cfg.label}</Badge>
                    <span className="text-xs text-slate-400">{(c.edu_turmas as any)?.nome}</span>
                  </div>
                  <span className="text-xs text-slate-400">{format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{c.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{c.mensagem}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); setPreview(false); reset(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1A3A6E]">Novo comunicado</h3>
              <div className="flex gap-2">
                <button onClick={() => setPreview(!preview)} className="text-xs font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50">
                  {preview ? 'Editar' : 'Preview'}
                </button>
                <button onClick={() => { setShowModal(false); setPreview(false); reset(); }}><X size={18} className="text-slate-400" /></button>
              </div>
            </div>

            {preview ? (
              <div className="border border-slate-200 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge color={TIPO_CONFIG[formValues.tipo ?? 'aviso'].color}>
                    {TIPO_CONFIG[formValues.tipo ?? 'aviso'].label}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">{formValues.titulo || 'Sem título'}</h4>
                <p className="text-sm text-slate-600">{formValues.mensagem || 'Sem mensagem'}</p>
              </div>
            ) : (
              <form id="com-form" onSubmit={handleSubmit((v) => criarMutation.mutate(v))} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título</label>
                  <input {...register('titulo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
                  {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mensagem</label>
                  <textarea {...register('mensagem')} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] resize-none" />
                  {errors.mensagem && <p className="text-xs text-red-500 mt-1">{errors.mensagem.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                    <select {...register('tipo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                      <option value="aviso">Aviso</option>
                      <option value="urgente">Urgente</option>
                      <option value="lembrete">Lembrete</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
                    <select {...register('turma_id')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                      <option value="">Selecione...</option>
                      {turmas?.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                    {errors.turma_id && <p className="text-xs text-red-500 mt-1">{errors.turma_id.message}</p>}
                  </div>
                </div>
              </form>
            )}

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => { setShowModal(false); setPreview(false); reset(); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
              <button
                type={preview ? 'button' : 'submit'}
                form="com-form"
                onClick={preview ? handleSubmit((v) => criarMutation.mutate(v)) : undefined}
                disabled={criarMutation.isPending}
                className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70"
              >
                {criarMutation.isPending ? 'Enviando...' : 'Enviar comunicado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
