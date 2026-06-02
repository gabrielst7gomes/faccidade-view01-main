import { createFileRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Users, School, Calendar, BarChart3, Settings, ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduSidebar } from '@/components/edu/EduSidebar';
import { toast } from 'sonner';

export const Route = createFileRoute('/edu/coordenador/_layout')({
  component: CoordenadorLayout,
});

const MENU = [
  { path: '/edu/coordenador', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/edu/coordenador/professores', label: 'Professores', icon: <Users size={18} /> },
  { path: '/edu/coordenador/turmas', label: 'Turmas e Grade', icon: <School size={18} /> },
  { path: '/edu/coordenador/horarios', label: 'Horários', icon: <Calendar size={18} /> },
  { path: '/edu/coordenador/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  { path: '/edu/coordenador/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

function CoordenadorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { perfil, loading, error } = useEduAuth();

  useEffect(() => {
    if (!loading) {
      if (!perfil) { navigate({ to: '/edu/login' }); return; }
      if (perfil.perfil !== 'coordenador') {
        toast.error('Acesso restrito a coordenadores.');
        navigate({ to: '/edu/login' });
      }
    }
  }, [loading, perfil, navigate]);

  const handleLogout = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();
    navigate({ to: '/edu/login' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F6FA]">
        <div className="w-10 h-10 rounded-full border-4 border-[#1A3A6E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!perfil || error) return null;

  const currentLabel = MENU.find(
    (m) => location.pathname === m.path || (m.path !== '/edu/coordenador' && location.pathname.startsWith(m.path))
  )?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden font-[Inter,sans-serif]">
      <EduSidebar menuItems={MENU} perfil={perfil} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Coordenador</span>
            <ChevronRight size={14} />
            <span className="text-[#1A3A6E] font-bold">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">FacCidade Edu</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
