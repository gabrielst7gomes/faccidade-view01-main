import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Calendar, UserCheck, Laptop, Files, Pencil, Bell, ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduSidebar } from '@/components/edu/EduSidebar';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/edu/aluno/_layout')({
  component: AlunoLayout,
});

function AlunoLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { perfil, loading, error } = useEduAuth();

  const { data: notifCount } = useQuery({
    queryKey: ['aluno-notif-count', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('edu_alertas_sistema')
        .select('*', { count: 'exact' })
        .eq('aluno_id', perfil!.id)
        .eq('lido', false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const MENU = [
    { path: '/edu/aluno', label: 'Início', icon: <LayoutDashboard size={18} /> },
    { path: '/edu/aluno/agenda', label: 'Minha agenda', icon: <Calendar size={18} /> },
    { path: '/edu/aluno/frequencia', label: 'Frequência', icon: <UserCheck size={18} /> },
    { path: '/edu/aluno/ead', label: 'EAD', icon: <Laptop size={18} /> },
    { path: '/edu/aluno/atividades', label: 'Atividades', icon: <Files size={18} /> },
    { path: '/edu/aluno/boletim', label: 'Boletim', icon: <Pencil size={18} /> },
    {
      path: '/edu/aluno/notificacoes',
      label: `Notificações${notifCount ? ` (${notifCount})` : ''}`,
      icon: <Bell size={18} />,
    },
  ];

  useEffect(() => {
    if (!loading) {
      if (!perfil) { navigate({ to: '/edu/login' }); return; }
      if (perfil.perfil !== 'aluno') {
        toast.error('Acesso restrito a alunos.');
        navigate({ to: '/edu/login' });
      }
    }
  }, [loading, perfil, navigate]);

  const handleLogout = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    navigate({ to: '/edu/login' });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F6FA]">
      <div className="w-10 h-10 rounded-full border-4 border-[#1A3A6E] border-t-transparent animate-spin" />
    </div>
  );

  if (!perfil || error) return null;

  const currentLabel = MENU.find(
    (m) => location.pathname === m.path || (m.path !== '/edu/aluno' && location.pathname.startsWith(m.path))
  )?.label?.split(' (')[0] ?? 'Início';

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden font-[Inter,sans-serif]">
      <EduSidebar menuItems={MENU} perfil={perfil} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Aluno</span>
            <ChevronRight size={14} />
            <span className="text-[#1A3A6E] font-bold">{currentLabel}</span>
          </div>
          {!!notifCount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {notifCount} {notifCount === 1 ? 'notificação' : 'notificações'}
            </span>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
