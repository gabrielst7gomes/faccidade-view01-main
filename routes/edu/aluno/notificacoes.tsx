import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { AlertTriangle, WifiOff, ClipboardX, TrendingDown, Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TipoAlerta } from '@/types/edu';

export const Route = createFileRoute('/edu/aluno/notificacoes')({
  component: NotificacoesPage,
});

const TIPO_CONFIG: Record<TipoAlerta, { icon: React.ReactNode; label: string; color: 'red' | 'yellow' | 'orange' | 'blue' }> = {
  falta_excesso: { icon: <AlertTriangle size={16} />, label: 'Excesso de faltas', color: 'red' },
  ead_inativo: { icon: <WifiOff size={16} />, label: 'EAD inativo', color: 'yellow' },
  atividade_atrasada: { icon: <ClipboardX size={16} />, label: 'Atividade atrasada', color: 'orange' },
  nota_baixa: { icon: <TrendingDown size={16} />, label: 'Nota baixa', color: 'blue' },
};

function NotificacoesPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();

  const { data: alertas, isLoading } = useQuery({
    queryKey: ['aluno-alertas', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_alertas_sistema')
        .select('*')
        .eq('aluno_id', perfil!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const marcarLidoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('edu_alertas_sistema').update({ lido: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aluno-alertas'] }),
  });

  const marcarTodosLidosMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('edu_alertas_sistema').update({ lido: true }).eq('aluno_id', perfil!.id).eq('lido', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aluno-alertas'] }),
  });

  const naoLidas = alertas?.filter((a) => !a.lido).length ?? 0;

  return (
    <div>
      <EduPageHeader
        title="Notificações"
        subtitle={`${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}`}
        action={
          naoLidas > 0 ? (
            <button
              onClick={() => marcarTodosLidosMutation.mutate()}
              className="flex items-center gap-2 text-sm font-bold text-[#1A3A6E] border border-[#1A3A6E] px-4 py-2 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all"
            >
              <CheckCheck size={15} /> Marcar todas como lidas
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}</div>
      ) : !alertas?.length ? (
        <EduEmpty title="Sem notificações" description="Você está em dia com tudo! Não há alertas no momento." icon={<Bell size={28} />} />
      ) : (
        <div className="space-y-2">
          {alertas.map((a: any) => {
            const cfg = TIPO_CONFIG[a.tipo as TipoAlerta] ?? { icon: <Bell size={16} />, label: 'Notificação', color: 'gray' as const };
            return (
              <button
                key={a.id}
                onClick={() => !a.lido && marcarLidoMutation.mutate(a.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm ${
                  a.lido
                    ? 'bg-slate-50 border-slate-100 opacity-60'
                    : 'bg-white border-slate-200 shadow-sm hover:border-[#1A3A6E]/20'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  a.lido ? 'bg-slate-200 text-slate-400' :
                  cfg.color === 'red' ? 'bg-red-100 text-red-600' :
                  cfg.color === 'yellow' ? 'bg-amber-100 text-amber-600' :
                  cfg.color === 'orange' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge color={a.lido ? 'gray' : cfg.color}>{cfg.label}</Badge>
                    {!a.lido && <span className="w-2 h-2 rounded-full bg-[#F26522] shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-700 leading-snug">{a.mensagem ?? 'Alerta do sistema acadêmico.'}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
