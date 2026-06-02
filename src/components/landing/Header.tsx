import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import navbarLogo from "../../assets/navbar-logo.png";

const topLeft = [
  { href: "#inscrever", label: "VESTIBULAR" },
  { href: "#bolsas", label: "OPORTUNIDADES" },
  { href: "#campus", label: "ACESSOS" },
  { href: "#diferenciais", label: "PARCEIROS" },
];

const leftLinks = [
  { href: "#diferenciais", label: "QUEM SOMOS" },
  { href: "#cursos", label: "CURSOS" },
  { href: "#campus", label: "CAMPUS" },
];

const rightLinks = [
  { href: "#diferenciais", label: "DIFERENCIAIS" },
  { href: "#depoimentos", label: "DEPOIMENTOS" },
  { href: "#faq", label: "FAQ" },
];

const allLinks = [...leftLinks, ...rightLinks];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Control background style (scrolled state)
      setScrolled(currentScrollY > 20);
      
      // Hide/Show logic for "collapsible upwards"
      if (currentScrollY < 10) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false); // Scrolling down - hide
      } else if (currentScrollY < lastScrollY) {
        setVisible(true); // Scrolling up - show
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 z-[100] w-full transition-transform duration-500 ease-in-out ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Top Bar */}
        <div
          className={`bg-[#1A3A6E] border-b border-white/10 overflow-hidden transition-all duration-300 ${
            scrolled ? "h-0 opacity-0" : "h-10 opacity-100"
          } hidden md:block`}
        >
          <div className="h-10 flex items-center justify-between px-12">
            <div className="flex items-center gap-[28px]">
              {topLeft.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[11.5px] font-medium text-white/75 hover:text-white transition-colors"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-[11.5px] font-semibold text-white/90 hover:text-white transition-colors tracking-wide"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                PORTAL DO ALUNO
              </a>
              <button aria-label="Buscar" className="text-white/75 hover:text-white transition-colors">
                <Search size={14} />
              </button>
              <a
                href="#inscrever"
                className="bg-[#F26522] border-[1.5px] border-[#F26522] hover:bg-transparent hover:text-[#F26522] text-white text-[11px] font-bold py-[6px] px-[18px] rounded-full transition-colors tracking-[0.5px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                INSCREVA-SE
              </a>
            </div>
          </div>
        </div>

        {/* Main Bar */}
        <div
          className={`bg-white border-b-[3px] border-[#1A3A6E] transition-all duration-300 ${
            scrolled ? "shadow-[0_2px_20px_rgba(26,58,110,0.12)]" : ""
          }`}
        >
          <div
            className={`hidden md:grid grid-cols-[1fr_auto_1fr] items-center px-12 transition-all duration-300 ${
              scrolled ? "h-14" : "h-[68px]"
            }`}
          >
            {/* Left nav */}
            <nav className="flex items-center gap-[36px] justify-self-start">
              {leftLinks.map((l) => (
                <NavLink key={l.label} href={l.href} label={l.label} />
              ))}
            </nav>

            {/* Logo center */}
            <a
              href="#top"
              className={`flex flex-col items-center justify-self-center transition-transform duration-300 ${
                scrolled ? "scale-[0.85]" : "scale-100"
              }`}
            >
              <img 
                src={navbarLogo}
                alt="FacCidade" 
                className="h-[40px] md:h-[42px] w-auto object-contain" 
              />
            </a>

            {/* Right nav */}
            <nav className="flex items-center gap-[36px] justify-self-end">
              {rightLinks.map((l) => (
                <NavLink key={l.label} href={l.href} label={l.label} />
              ))}
            </nav>
          </div>

          {/* Mobile bar */}
          <div className="md:hidden h-[60px] flex items-center justify-between px-5">
            <div className="w-8" />
            <a href="#top" className="flex items-center">
              <img 
                src={navbarLogo}
                alt="FacCidade" 
                className="h-[38px] w-auto object-contain" 
              />
            </a>
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="text-[#1A3A6E]"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-[280px] bg-white p-8 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="text-[#1A3A6E]"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
              {allLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-[14px] font-semibold uppercase tracking-wider text-[#1A3A6E] hover:text-[#F26522] border-b border-slate-100"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <a
              href="#inscrever"
              onClick={() => setOpen(false)}
              className="mt-6 bg-[#F26522] hover:bg-[#d4551c] text-white text-center font-bold py-3.5 rounded-full text-[13px] transition-colors"
            >
              INSCREVA-SE
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="relative text-[12.5px] font-semibold text-[#1A3A6E] hover:text-[#F26522] transition-colors group py-1 tracking-[1.2px]"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {label}
      <span className="absolute -bottom-[8px] left-0 right-0 h-[2px] bg-[#F26522] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </a>
  );
}
