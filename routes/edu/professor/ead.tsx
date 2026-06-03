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
import { Plus, X, Video, FileText, Link as LinkIcon, Presentation, Music, Eye, EyeOff } from 'lucide-react';
import type { TipoMaterial } from '@/types/edu';
import { TIPO_MATERIAL_LABEL } from '@/types/edu';

export const Route = createFileRoute('/edu/professor/ead')({
  component: EadPage,
});

const materialSchema = z.object({
  titulo: z.string().min(2),
  descricao: z.string().optional(),
  tipo: z.enum(['video', 'pdf', 'link', 'apresentacao', 'audio']),
  turma_id: z.string().min(1, 'Selecione a turma'),
  url: z.string().optional(),
  ordem: z.coerce.number().default(0),
  publicado: z.boolean().default(true),
});
type MaterialForm = z.infer<typeof materialSchema>;

const TIPO_ICON: Record<TipoMaterial, React.ReactNode> = {
  video: <Video size={18} />,
  pdf: <FileText size={18} />,
  link: <LinkIcon size={18} />,
  apresentacao: <Presentation size={18} />,
  audio: <Music size={18} />,
};

const TIPO_COLOR: Record<TipoMaterial, string> = {
  video: 'bg-red-100 text-red-700',
  pdf: 'bg-blue-100 text-blue-700',
  link: 'bg-purple-100 text-purple-700',
  apresentacao: 'bg-orange-100 text-orange-700',
  audio: 'bg-green-100 text-green-700',
};

function EadPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: materiais, isLoading } = useQuery({
    queryKey: ['prof-materiais', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_materiais_ead')
        .select('*, edu_turmas(nome)')
        .eq('professor_id', perfil!.id)
        .order('ordem')
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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: { tipo: 'video', publicado: true, ordem: 0 },
  });
  const tipoSelecionado = watch('tipo');

  const criarMutation = useMutation({
    mutationFn: async (values: MaterialForm) => {
      const { error } = await supabase.from('edu_materiais_ead').insert({ ...values, professor_id: perfil!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Material publicado!');
      qc.invalidateQueries({ queryKey: ['prof-materiais'] });
      setShowModal(false);
      reset();
    },
    onError: () => toast.error('Erro ao publicar material.'),
  });

  const togglePublicadoMutation = useMutation({
    mutationFn: async ({ id, publicado }: { id: string; publicado: boolean }) => {
      const { error } = await supabase.from('edu_materiais_ead').update({ publicado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      qc.invalidateQueries({ queryKey: ['prof-materiais'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('edu_materiais_ead').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Material removido.');
      qc.invalidateQueries({ queryKey: ['prof-materiais'] });
    },
  });

  return (
    <div>
      <EduPageHeader
        title="EAD — Materiais"
        subtitle="Publique e gerencie materiais de estudo para suas turmas"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all">
            <Plus size={16} /> Novo material
          </button>
        }
      />

      {isLoading ? <CardSkeleton count={6} /> : !materiais?.length ? (
        <EduEmpty title="Nenhum material publicado" description="Adicione vídeos, PDFs, links e outros materiais para seus alunos." action={<button onClick={() => setShowModal(true)} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">Adicionar material</button>} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiais.map((m: any) => (
            <div key={m.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${m.publicado ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${TIPO_COLOR[m.tipo as TipoMaterial]}`}>
                    {TIPO_ICON[m.tipo as TipoMaterial]}
                    <span>{TIPO_MATERIAL_LABEL[m.tipo as TipoMaterial]}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePublicadoMutation.mutate({ id: m.id, publicado: !m.publicado })}
                      className="p-1.5 text-slate-400 hover:text-[#1A3A6E] transition-colors"
                      title={m.publicado ? 'Despublicar' : 'Publicar'}
                    >
                      {m.publicado ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => deleteMutation.mutate(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 line-clamp-2">{m.titulo}</h3>
                {m.descricao && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{m.descricao}</p>}
                <p className="text-xs text-slate-400">{(m.edu_turmas as any)?.nome}</p>
                {!m.publicado && <Badge color="gray">Rascunho</Badge>}
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs font-bold text-[#1A3A6E] hover:text-[#F26522] transition-colors block truncate">
                    {m.url}
                  </a>
                )}
              </div>
              <MaterialAcessos materialId={m.id} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-[#1A3A6E]">Novo material EAD</h3>
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
                <textarea {...register('descricao')} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                  <select {...register('tipo')} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white">
                    {Object.entries(TIPO_MATERIAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ordem</label>
                  <input {...register('ordem')} type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {tipoSelecionado === 'video' ? 'URL do YouTube/Vimeo' : tipoSelecionado === 'link' ? 'URL do link' : 'URL do arquivo'}
                </label>
                <input {...register('url')} type="url" placeholder="https://..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]" />
              </div>
              <div className="flex items-center gap-3">
                <input {...register('publicado')} type="checkbox" id="publicado" className="w-4 h-4 accent-[#1A3A6E]" />
                <label htmlFor="publicado" className="text-sm font-medium text-slate-600">Publicar imediatamente</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancelar</button>
                <button type="submit" disabled={criarMutation.isPending} className="flex-1 py-2.5 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold disabled:opacity-70">
                  {criarMutation.isPending ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialAcessos({ materialId }: { materialId: string }) {
  const { data } = useQuery({
    queryKey: ['mat-acessos', materialId],
    queryFn: async () => {
      const { count } = await supabase.from('edu_rastreamento_ead').select('*', { count: 'exact' }).eq('material_id', materialId);
      return count ?? 0;
    },
  });

  return (
    <div className="px-4 pb-3">
      <span className="text-xs text-slate-400">{data ?? 0} acesso{data !== 1 ? 's' : ''}</span>
    </div>
  );
}
