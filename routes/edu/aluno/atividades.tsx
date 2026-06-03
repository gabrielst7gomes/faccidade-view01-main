import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, CardSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { toast } from 'sonner';
import { X, Upload, Send, Star, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TipoAtividade, StatusEntrega } from '@/types/edu';
import { TIPO_ATIVIDADE_LABEL, STATUS_ENTREGA_COLOR, STATUS_ENTREGA_LABEL } from '@/types/edu';

export const Route = createFileRoute('/edu/aluno/atividades')({
  component: AlunoAtividadesPage,
});

function AlunoAtividadesPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [selectedAtv, setSelectedAtv] = useState<any | null>(null);
  const [resposta, setResposta] = useState('');

  const { data: atividades, isLoading } = useQuery({
    queryKey: ['aluno-atividades', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data: ta } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id')
        .eq('aluno_id', perfil!.id);

      const turmaIds = ta?.map((t) => t.turma_id) ?? [];
      if (!turmaIds.length) return [];

      const { data: atvs } = await supabase
        .from('edu_atividades')
        .select('*, edu_turmas(nome, edu_disciplinas(nome))')
        .in('turma_id', turmaIds)
        .order('data_entrega', { ascending: true, nullsFirst: false });

      if (!atvs?.length) return [];

      const { data: entregas } = await supabase
        .from('edu_entregas')
        .select('*')
        .eq('aluno_id', perfil!.id)
        .in('atividade_id', atvs.map((a) => a.id));

      const entregasMap: Record<string, any> = {};
      entregas?.forEach((e) => { entregasMap[e.atividade_id] = e; });

      return atvs.map((a) => {
        const entrega = entregasMap[a.id] ?? null;
        let status: StatusEntrega = 'pendente';
        if (entrega) {
          status = entrega.status;
        } else if (a.data_entrega && new Date(a.data_entrega) < new Date()) {
          status = 'atrasado';
        }
        return { ...a, entrega, status };
      });
    },
  });

  const entregarMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('edu_entregas').upsert({
        atividade_id: selectedAtv.id,
        aluno_id: perfil!.id,
        texto_resposta: resposta,
        status: 'entregue',
        data_entrega: new Date().toISOString(),
      }, { onConflict: 'atividade_id,aluno_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Atividade entregue com sucesso!');
      qc.invalidateQueries({ queryKey: ['aluno-atividades'] });
      setSelectedAtv(null);
      setResposta('');
    },
    onError: () => toast.error('Erro ao entregar atividade.'),
  });

  const getStatusIcon = (status: StatusEntrega) => {
    if (status === 'corrigido') return <CheckCircle2 size={14} className="text-green-500" />;
    if (status === 'entregue') return <Clock size={14} className="text-blue-500" />;
    if (status === 'atrasado') return <AlertTriangle size={14} className="text-red-500" />;
    return null;
  };

  return (
    <div>
      <EduPageHeader title="Atividades" subtitle="Acompanhe e entregue suas atividades" />

      {isLoading ? <CardSkeleton count={4} /> : !atividades?.length ? (
        <EduEmpty title="Nenhuma atividade" description="Seus professores ainda não publicaram atividades." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {atividades.map((atv: any) => (
            <button
              key={atv.id}
              onClick={() => { setSelectedAtv(atv); setResposta(atv.entrega?.texto_resposta ?? ''); }}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-[#1A3A6E]/20 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <Badge color={
                  atv.tipo === 'prova' ? 'red' :
                  atv.tipo === 'trabalho' ? 'blue' : 'gray'
                }>
                  {TIPO_ATIVIDADE_LABEL[atv.tipo as TipoAtividade]}
                </Badge>
                <div className="flex items-center gap-2">
                  {getStatusIcon(atv.status)}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_ENTREGA_COLOR[atv.status as StatusEntrega]}`}>
                    {STATUS_ENTREGA_LABEL[atv.status as StatusEntrega]}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-1 group-hover:text-[#1A3A6E] transition-colors">{atv.titulo}</h3>
              <p className="text-xs text-slate-400">{(atv.edu_turmas as any)?.edu_disciplinas?.nome ?? (atv.edu_turmas as any)?.nome}</p>
              {atv.data_entrega && (
                <p className="text-xs text-slate-500 mt-2">
                  Prazo: {format(new Date(atv.data_entrega), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Star size={12} className="text-[#F26522]" />
                <span className="text-xs font-bold text-slate-500">{atv.pontuacao_maxima} pontos</span>
                {atv.entrega?.nota != null && (
                  <span className="text-xs font-black text-green-600 ml-auto">Nota: {atv.entrega.nota}/{atv.pontuacao_maxima}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal detalhe/entrega */}
      {selectedAtv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAtv(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-2">
              <div>
                <Badge color={
                  selectedAtv.tipo === 'prova' ? 'red' :
                  selectedAtv.tipo === 'trabalho' ? 'blue' : 'gray'
                }>
                  {TIPO_ATIVIDADE_LABEL[selectedAtv.tipo as TipoAtividade]}
                </Badge>
                <h3 className="text-lg font-black text-[#1A3A6E] mt-1">{selectedAtv.titulo}</h3>
              </div>
              <button onClick={() => setSelectedAtv(null)}><X size={18} className="text-slate-400" /></button>
            </div>

            {selectedAtv.descricao && (
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{selectedAtv.descricao}</p>
            )}

            <div className="flex gap-4 mb-4 text-xs text-slate-500">
              {selectedAtv.data_entrega && (
                <span>📅 Prazo: {format(new Date(selectedAtv.data_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              )}
              <span>⭐ {selectedAtv.pontuacao_maxima} pontos</span>
            </div>

            {/* Se já corrigido, mostrar nota e feedback */}
            {selectedAtv.entrega?.status === 'corrigido' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="font-black text-green-700 text-lg">Nota: {selectedAtv.entrega.nota}/{selectedAtv.pontuacao_maxima}</p>
                {selectedAtv.entrega.feedback && (
                  <p className="text-sm text-green-600 mt-1">{selectedAtv.entrega.feedback}</p>
                )}
              </div>
            )}

            {/* Campo de entrega se pendente/atrasado */}
            {(!selectedAtv.entrega || selectedAtv.status === 'pendente' || selectedAtv.status === 'atrasado') && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sua resposta</label>
                <textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={6}
                  placeholder="Digite sua resposta aqui..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A3A6E] resize-none"
                />
                {selectedAtv.status === 'atrasado' && (
                  <p className="text-xs text-red-500 font-bold">⚠️ Prazo encerrado — entrega atrasada</p>
                )}
                <button
                  onClick={() => entregarMutation.mutate()}
                  disabled={!resposta.trim() || entregarMutation.isPending}
                  className="flex items-center gap-2 bg-[#1A3A6E] text-white font-bold px-6 py-3 rounded-full hover:bg-[#0D1B3E] transition-all disabled:opacity-50 shadow-lg"
                >
                  <Send size={16} />
                  {entregarMutation.isPending ? 'Enviando...' : 'Entregar atividade'}
                </button>
              </div>
            )}

            {/* Já entregou mas não corrigido */}
            {selectedAtv.entrega?.status === 'entregue' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-700">✓ Atividade entregue — aguardando correção</p>
                <p className="text-xs text-blue-500 mt-1">Entregue em: {format(new Date(selectedAtv.entrega.data_entrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                {selectedAtv.entrega.texto_resposta && (
                  <p className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded-lg line-clamp-3">{selectedAtv.entrega.texto_resposta}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
