import { createFileRoute, Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Type, 
  Video, 
  ArrowLeftRight, 
  School, 
  Users, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/adminincomy/_layout')({
  component: AdminLayout,
});

const MENU_ITEMS = [
  { path: '/adminincomy/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/adminincomy/hero', label: 'Hero & Headlines', icon: Type },
  { path: '/adminincomy/depoimentos', label: 'Depoimentos', icon: Video },
  { path: '/adminincomy/comparador', label: 'Comparador', icon: ArrowLeftRight },
  { path: '/adminincomy/cursos', label: 'Cursos', icon: School },
  { path: '/adminincomy/leads', label: 'Leads', icon: Users },
  { path: '/adminincomy/config', label: 'Configurações', icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/adminincomy/login' });
  };

  const currentItem = MENU_ITEMS.find(item => location.pathname.startsWith(item.path));

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#1A3A6E] flex flex-col shrink-0">
        <div className="p-8">
          <img 
            src="https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/21421442-d428-41c1-9c81-5e6bb5067d7a/1778281588613_4mym60_image.png" 
            alt="FacCidade" 
            className="h-10 brightness-0 invert" 
          />
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-white/10 text-white border-l-4 border-[#F26522]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#F26522]' : 'text-white/40 group-hover:text-white/60'} />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 bg-[#0D1B3E] mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white font-bold border border-white/10">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-bold truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold w-full"
          >
            <LogOut size={16} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-[#1A3A6E]">{currentItem?.label || 'Dashboard'}</h2>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-widest">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="text-[#1A3A6E]">{currentItem?.label || 'Dashboard'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}