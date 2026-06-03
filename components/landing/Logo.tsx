import fullLogo from "@/assets/full-logo.png";

import navbarLogo from "@/assets/navbar-logo.png";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center">
      <img 
        src={navbarLogo} 
        alt="FacCidade" 
        className={`h-12 md:h-14 w-auto object-contain transition-all duration-300 hover:scale-105 select-none ${light ? 'brightness-0 invert' : ''}`}
        draggable={false}
      />
    </div>
  );
}
