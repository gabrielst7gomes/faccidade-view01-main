import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, CardSkeleton } from '@/components/edu/EduEmpty';
import { useEffect, useRef, useState } from 'react';
import { Video, FileText, Link as LinkIcon, Presentation, Music, ExternalLink, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import type { TipoMaterial } from '@/types/edu';
import { TIPO_MATERIAL_LABEL } from '@/types/edu';

export const Route = createFileRoute('/edu/aluno/ead')({
  component: AlunoEadPage,
});

const TIPO_ICON: Record<TipoMaterial, React.ReactNode> = {
  video: <Video size={16} />,
  pdf: <FileText size={16} />,
  link: <LinkIcon size={16} />,
  apresentacao: <Presentation size={16} />,
  audio: <Music size={16} />,
};

const TIPO_BG: Record<TipoMaterial, string> = {
  video: 'bg-red-100 text-red-700',
  pdf: 'bg-blue-100 text-blue-700',
  link: 'bg-purple-100 text-purple-700',
  apresentacao: 'bg-orange-100 text-orange-700',
  audio: 'bg-green-100 text-green-700',
};

function AlunoEadPage() {
  const { perfil } = useEduAuth();
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  const { data: turmas, isLoading } = useQuery({
    queryKey: ['aluno-ead-turmas', perfil?.id],
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
          const { data: materiais } = await supabase
            .from('edu_materiais_ead')
            .select('*')
            .eq('turma_id', t.id)
            .eq('publicado', true)
            .order('ordem');

          const { data: registros } = await supabase
            .from('edu_rastreamento_ead')
            .select('*')
            .eq('aluno_id', perfil!.id)
            .in('material_id', materiais?.map((m) => m.id) ?? []);

          const map: Record<string, any> = {};
          registros?.forEach((r) => { map[r.material_id] = r; });

          return {
            turma: t,
            materiais: (materiais ?? []).map((m) => ({ ...m, rastreamento: map[m.id] ?? null })),
          };
        })
      );

      return result;
    },
  });

  return (
    <div>
      <EduPageHeader title="EAD" subtitle="Acesse os materiais de estudo das suas disciplinas" />

      {isLoading ? <CardSkeleton count={6} /> : !turmas?.length ? (
        <EduEmpty title="Nenhum material disponível" description="Seus professores ainda não publicaram materiais." icon={<BookOpen size={28} />} />
      ) : (
        <div className="space-y-8">
          {turmas.map(({ turma, materiais }: any) => (
            <div key={turma.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#1A3A6E] flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="font-black text-[#1A3A6E]">{turma.edu_disciplinas?.nome ?? turma.nome}</h2>
                  <p className="text-xs text-slate-400">{materiais.length} material{materiais.length !== 1 ? 'is' : ''}</p>
                </div>
              </div>

              {materiais.length === 0 ? (
                <p className="text-sm text-slate-400 pl-11">Nenhum material publicado ainda.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {materiais.map((m: any) => (
                    <MaterialCard
                      key={m.id}
                      material={m}
                      alunoId={perfil!.id}
                      onOpen={() => setSelectedMaterial(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedMaterial && (
        <MaterialViewer material={selectedMaterial} alunoId={perfil!.id} onClose={() => setSelectedMaterial(null)} />
      )}
    </div>
  );
}

function MaterialCard({ material: m, alunoId, onOpen }: { material: any; alunoId: string; onOpen: () => void }) {
  const r = m.rastreamento;
  const status = r?.concluido ? 'concluido' : r ? 'andamento' : 'nao_acessado';

  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-[#1A3A6E]/20 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${TIPO_BG[m.tipo as TipoMaterial]}`}>
          {TIPO_ICON[m.tipo as TipoMaterial]}
          <span>{TIPO_MATERIAL_LABEL[m.tipo as TipoMaterial]}</span>
        </div>
        {status === 'concluido' && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
        {status === 'andamento' && <Clock size={16} className="text-blue-500 shrink-0" />}
      </div>
      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-[#1A3A6E] transition-colors">{m.titulo}</h3>
      {m.descricao && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{m.descricao}</p>}
      <div className="mt-2">
        <Badge color={status === 'concluido' ? 'green' : status === 'andamento' ? 'blue' : 'gray'}>
          {status === 'concluido' ? 'Concluído' : status === 'andamento' ? 'Em andamento' : 'Não acessado'}
        </Badge>
      </div>
    </button>
  );
}

function MaterialViewer({ material: m, alunoId, onClose }: { material: any; alunoId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempoRef = useRef(0);

  const registrarMutation = useMutation({
    mutationFn: async (extra: Partial<{ tempo_total_segundos: number; progresso_percent: number; concluido: boolean }> = {}) => {
      const { data: existing } = await supabase
        .from('edu_rastreamento_ead')
        .select('*')
        .eq('material_id', m.id)
        .eq('aluno_id', alunoId)
        .maybeSingle();

      if (existing) {
        await supabase.from('edu_rastreamento_ead').update({
          ultimo_acesso: new Date().toISOString(),
          total_acessos: (existing.total_acessos ?? 0) + 1,
          ...extra,
        }).eq('id', existing.id);
      } else {
        await supabase.from('edu_rastreamento_ead').insert({
          material_id: m.id,
          aluno_id: alunoId,
          ...extra,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aluno-ead-turmas'] }),
  });

  useEffect(() => {
    registrarMutation.mutate({});

    if (m.tipo === 'pdf' || m.tipo === 'link' || m.tipo === 'apresentacao' || m.tipo === 'audio') {
      timerRef.current = setInterval(() => {
        tempoRef.current += 30;
        if (tempoRef.current >= 60) {
          registrarMutation.mutate({ tempo_total_segundos: tempoRef.current, progresso_percent: 100, concluido: true });
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 30000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [m.id]);

  const getYoutubeEmbed = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${TIPO_BG[m.tipo as TipoMaterial]}`}>
              {TIPO_ICON[m.tipo as TipoMaterial]}
              {TIPO_MATERIAL_LABEL[m.tipo as TipoMaterial]}
            </div>
            <h2 className="font-black text-[#1A3A6E]">{m.titulo}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-auto">
          {m.tipo === 'video' && m.url && (
            <div className="aspect-video w-full">
              <iframe
                src={getYoutubeEmbed(m.url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {m.tipo === 'pdf' && m.url && (
            <iframe src={m.url} className="w-full h-[70vh]" title={m.titulo} />
          )}

          {(m.tipo === 'link' || m.tipo === 'apresentacao') && m.url && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${TIPO_BG[m.tipo as TipoMaterial]}`}>
                {TIPO_ICON[m.tipo as TipoMaterial]}
              </div>
              <h3 className="font-bold text-slate-700">{m.titulo}</h3>
              {m.descricao && <p className="text-sm text-slate-400 text-center max-w-sm">{m.descricao}</p>}
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => registrarMutation.mutate({ progresso_percent: 100, concluido: true })}
                className="flex items-center gap-2 bg-[#1A3A6E] text-white font-bold px-6 py-3 rounded-full hover:bg-[#0D1B3E] transition-all"
              >
                <ExternalLink size={16} />
                Abrir recurso
              </a>
            </div>
          )}

          {m.tipo === 'audio' && m.url && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Music size={36} className="text-green-600" />
              </div>
              <h3 className="font-bold text-slate-700">{m.titulo}</h3>
              <audio controls className="w-full max-w-md" src={m.url} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
