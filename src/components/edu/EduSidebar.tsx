import { Link, useLocation } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import type { Perfil } from '@/types/edu';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface EduSidebarProps {
  menuItems: MenuItem[];
  perfil: Perfil;
  onLogout: () => void;
}

const PERFIL_LABEL: Record<string, string> = {
  coordenador: 'Coordenador',
  professor: 'Professor',
  aluno: 'Aluno',
};

export function EduSidebar({ menuItems, perfil, onLogout }: EduSidebarProps) {
  const location = useLocation();

  const initials = perfil.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="w-[240px] bg-[#1A3A6E] flex flex-col shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <a href="/" className="flex items-center gap-2 group">
          <img
            src="https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/21421442-d428-41c1-9c81-5e6bb5067d7a/1778281588613_4mym60_image.png"
            alt="FacCidade"
            className="h-8 brightness-0 invert"
          />
        </a>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[4px] text-[#F26522]">
          Sistema Acadêmico
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== `/edu/${perfil.perfil}` && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-white/10 text-white border-l-[3px] border-[#F26522] pl-[9px]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={isActive ? 'text-[#F26522]' : 'text-white/40 group-hover:text-white/60'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="p-4 bg-[#0D1B3E] border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#F26522] flex items-center justify-center text-white text-sm font-black shrink-0">
            {perfil.foto_url
              ? <img src={perfil.foto_url} alt={perfil.nome} className="w-9 h-9 rounded-full object-cover" />
              : initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-bold truncate leading-tight">{perfil.nome}</p>
            <p className="text-[#F26522] text-[9px] uppercase font-black tracking-[2px]">
              {PERFIL_LABEL[perfil.perfil]}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-semibold w-full"
        >
          <LogOut size={14} />
          Sair do sistema
        </button>
      </div>
    </aside>
  );
}
