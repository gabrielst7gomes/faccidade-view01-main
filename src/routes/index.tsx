import { createFileRoute } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Star,
  MapPin,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Beaker,
  BookOpen,
  Trophy,
  Briefcase,
  GraduationCap,
  Target,
  ArrowRight,
  Wallet,
  Handshake,
  FileCheck,
  Plus,
  X,
  Check,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { LeadForm } from "@/components/landing/LeadForm";
import { Reveal } from "@/components/landing/Reveal";
import { ThingIcon } from "@/components/landing/ThingIcon";
import { Jornada } from "@/components/landing/Jornada";
import { Counter } from "@/components/landing/Counter";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { ExitIntent } from "@/components/landing/ExitIntent";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { Logo } from "@/components/landing/Logo";
import { COURSES, AREAS } from "@/components/landing/data";
import { useLandingData } from "@/hooks/useLandingData";

import heroImg from "@/assets/hero-student.jpg";
import labImg from "@/assets/campus-lab.jpg";
import classroomImg from "@/assets/campus-classroom.jpg";
import libraryImg from "@/assets/campus-library.jpg";
import courtImg from "@/assets/campus-court.jpg";
import nursingImg from "@/assets/campus-nursing.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

const VISIT_WPP =
  "https://api.whatsapp.com/send?phone=5562986031010&text=" +
  encodeURIComponent("Olá, vim pela Landing Page e quero agendar uma visita");

function Landing() {
  const { config, loading } = useLandingData();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const openEnrollModal = (courseName?: string) => {
    setSelectedCourse(courseName || null);
    setIsEnrollModalOpen(true);
  };

  if (loading) {
    return (
      <div
        className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#0E2750] text-white"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Top thin orange line */}
        <div className="pointer-events-none absolute top-2 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#F26522]/60 to-transparent" />
        {/* Orange glow bottom-right */}
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-[#F26522]/30 blur-[120px]" />

        {/* Corner brackets */}
        {[
          "top-6 left-6 border-l border-t",
          "top-6 right-6 border-r border-t",
          "bottom-6 left-6 border-l border-b",
          "bottom-6 right-6 border-r border-b",
        ].map((c) => (
          <div key={c} className={`pointer-events-none absolute h-10 w-10 border-white/30 ${c}`} />
        ))}

        <div className="relative z-10 flex flex-col items-center gap-7 px-6">
          {/* Concentric circles + cap */}
          <div className="relative h-[150px] w-[150px] flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border border-dashed border-white/25"
              style={{ animation: "spin 18s linear infinite" }}
            />
            <div
              className="absolute inset-3 rounded-full border border-white/15"
              style={{ animation: "spin 12s linear infinite reverse" }}
            />
            <div className="absolute inset-7 rounded-full border border-dotted border-white/20" />

            {/* Orbiting dots */}
            <div className="absolute inset-0" style={{ animation: "spin 6s linear infinite" }}>
              <span className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-[#F26522] shadow-[0_0_12px_#F26522]" />
            </div>
            <div className="absolute inset-0" style={{ animation: "spin 8s linear infinite reverse" }}>
              <span className="absolute left-1/2 -bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
            </div>

            {/* Graduation cap */}
            <GraduationCap className="relative h-12 w-12 text-white/90" strokeWidth={1.5} />
          </div>

          {/* Wordmark */}
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[10px] tracking-[6px] text-white/50 uppercase">Bem-vindo à</p>
            <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight text-white/90">
              Fac<span className="text-white">Cidade</span>
            </h1>
            <p className="text-[10px] tracking-[6px] text-white/40 uppercase">Aparecida de Goiânia</p>
          </div>

          {/* Progress */}
          <div className="mt-2 w-72 max-w-[80vw]">
            <div className="flex items-center justify-between mb-2 text-[10px] tracking-[3px] text-white/50 uppercase">
              <span>Carregando</span>
              <span className="text-white/70">0%</span>
            </div>
            <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-[#F26522] to-transparent rounded-full animate-[loader-slide_1.6s_ease-in-out_infinite]" />
            </div>
            <p className="mt-4 text-center text-[9px] tracking-[5px] text-white/40 uppercase">
              Preparando sua experiência
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-background isolate" style={{ 
      '--brand': config?.cor_primaria || '#1A3A6E',
      '--cta': config?.cor_destaque || '#F26522'
    } as React.CSSProperties}>
      <ScrollProgress />
      <Header />
      <main className="pt-[116px] md:pt-[116px]">
        <Hero onEnroll={openEnrollModal} />
        <Portals />
        
        
        <Courses onSelectCourse={openEnrollModal} />
        <WhyUs />
        <Jornada />

        <Comparador />
        <Campus />
        <Bolsas />
        <MainForm />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppButton />
      <ExitIntentPopup />
      <EnrollmentModal 
        isOpen={isEnrollModalOpen} 
        onClose={() => setIsEnrollModalOpen(false)} 
        courseName={selectedCourse || undefined} 
      />
      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white p-3 md:hidden">
        <button 
          onClick={() => openEnrollModal()}
          className="btn-cta w-full"
        >
          INSCREVA-SE AGORA
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- Hero -------------------------------- */
function Hero({ onEnroll }: { onEnroll: () => void }) {
  const { headlines, config } = useLandingData();
  const [currentHeadline, setCurrentHeadline] = useState(0);
  
  const defaultHeadlines = [
    "59% das pessoas buscam a faculdade por mais oportunidades de trabalho. E você?",
    "Com diploma, sua renda pode dobrar. Sem ele, as portas ficam fechadas.",
    "A FacCidade abre o caminho. Com 50% de bolsa do início ao fim.",
    "Estágio desde o 1º semestre. Mercado. Rede. Futuro."
  ];

  const activeHeadlines = (headlines && headlines.length > 0) ? headlines : defaultHeadlines;
  const speed = config?.typewriter_speed ? parseInt(config.typewriter_speed) : 6000;

  useEffect(() => {
    if (activeHeadlines.length === 0) return;
    const timer = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % activeHeadlines.length);
    }, speed);
    return () => clearInterval(timer);
  }, [activeHeadlines, speed]);

  const headlineImages = [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200", // Career
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200", // Success
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200", // Scholarship
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200", // Connection
  ];

  const bullets = [
    "Profissionais com diploma ganham até 2x mais",
    "59% dos recrutadores exigem ensino superior",
    "Estágio remunerado desde o 1º semestre",
    "50% de bolsa garantida — do 1º ao último mês",
  ];
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-[oklch(0.97_0.01_260)]">
      {/* Thiings decorativos */}
      <ThingIcon name="rocket" size={100} anim="float" className="absolute top-10 right-[6%] opacity-60 hidden md:block" />
      <ThingIcon name="bulb" size={60} anim="wobble" delay={400} className="absolute top-[55%] left-[3%] opacity-50 hidden md:block" />
      <div className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-20 relative z-10">
        <Reveal>
          <div className="mb-8">
            <h1 className="font-display text-4xl font-black leading-[1.1] text-brand sm:text-5xl lg:text-7xl tracking-tighter transition-all duration-700">
              {activeHeadlines[currentHeadline]}
            </h1>
          </div>
          <div className="relative">
            <p className="max-w-[560px] text-[17px] leading-[1.7] text-[#444]">
              {config?.hero_subtitle || "Mais de 48% das pessoas que entram na faculdade buscam crescimento pessoal e profissional. A FacCidade oferece os dois — com estrutura real, professores do mercado e bolsa garantida."}
            </p>
          </div>
          <div className="mt-10">
            <Reveal delay={300}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-brand/10 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-8 rounded-2xl border border-brand/10 bg-white/50">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-brand/5">
                    <div className="flex-1 w-full">
                      <button 
                        onClick={() => onEnroll()} 
                        className="btn-cta text-center w-full px-10 py-5 text-lg shadow-lg hover:shadow-brand/20 transition-all active:scale-[0.98]"
                      >
                        {config?.hero_cta_text || "QUERO MUDAR MINHA VIDA AGORA"} <ArrowRight className="h-5 w-5 inline ml-2" />
                      </button>
                      <p className="mt-3 text-[13px] text-[#666] text-center font-medium">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Vagas abertas para o semestre atual
                      </p>
                    </div>
                    <div className="w-px h-12 bg-brand/10 hidden sm:block"></div>
                    <a href="#cursos" className="py-5 px-10 text-center font-bold text-brand border-2 border-brand/20 rounded-full hover:bg-brand/5 hover:border-brand/40 transition-all w-full sm:w-auto">
                      Ver cursos
                    </a>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    {bullets.map((b) => (
                      <div key={b} className="flex items-center gap-3 p-3 rounded-xl bg-brand/[0.02] border border-brand/[0.05] hover:bg-brand/[0.04] transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-brand" />
                        </div>
                        <span className="text-[14px] font-semibold text-[#333] leading-tight">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Reveal>
        <Reveal delay={150} className="relative">
          <div className="relative">
            {/* Removed the colored blur effect */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-card">
              {headlineImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Estudante no campus da FacCidade"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                    currentHeadline % headlineImages.length === i ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            {/* Removed the overlapping info card */}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Portals ------------------------------- */
function Portals() {
  const cards = [
    {
      kicker: "Para",
      title: "Vestibular",
      desc: "Se inscreva, conheça os cursos disponíveis e tire suas dúvidas em minutos.",
      cta: "Inscrições",
      href: "#inscrever",
      icon: "graduation-cap",
    },
    {
      kicker: "Para",
      title: "Oportunidades",
      desc: "Bolsas, vagas de estágio e opções de financiamento para o seu curso na FacCidade.",
      cta: "Saber mais",
      href: "#bolsas",
      icon: "money-with-wings",
    },
    {
      kicker: "Para",
      title: "Acessos",
      desc: "Sistemas acadêmicos, regulamentos, biblioteca digital e diploma digital.",
      cta: "Acessar",
      href: VISIT_WPP,
      icon: "locked-with-key",
    },
  ];
  return (
    <section className="relative -mt-10 bg-transparent pb-10">
      <div className="container-x grid gap-6 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 80}>
            <article className="card-hover group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-brand/5 bg-white p-6 md:p-8 shadow-sm transition-all hover:border-brand/20 hover:shadow-xl">
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-full bg-brand/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="mb-8 text-brand transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {c.icon === "graduation-cap" && <GraduationCap size={40} />}
                {c.icon === "money-with-wings" && <Star size={40} />}
                {c.icon === "locked-with-key" && <BookOpen size={40} />}
              </div>
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
                  {c.kicker}
                </p>
                <h3 className="mt-2 font-display text-2xl font-black text-brand tracking-tight">{c.title}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-foreground/60">{c.desc}</p>
                <div className="mt-10">
                  <a
                    href={c.href}
                    className="inline-flex items-center gap-3 font-black text-brand transition-all hover:gap-4 group/link"
                  >
                    <span className="relative">
                      {c.cta}
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand transition-all group-hover/link:w-full" />
                    </span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover/link:translate-x-1" />
                  </a>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}



/* ------------------------------ Courses ------------------------------- */
function Courses({ onSelectCourse }: { onSelectCourse: (name: string) => void }) {
  const { cursos, loading } = useLandingData();
  const [area, setArea] = useState<string>("Todos");

  const AREAS_DYNAMIC = ["Todos", ...new Set((cursos || []).map(c => c.categoria))];

  const filtered = useMemo(
    () => (area === "Todos" ? (cursos || []) : (cursos || []).filter((c) => c.categoria === area)),
    [area, cursos],
  );

  if ((!cursos || cursos.length === 0) && !loading) return null;
  return (
    <section id="cursos" className="bg-background py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute left-0 top-0 h-96 w-96 bg-cta/5 blur-3xl rounded-full -ml-48 -mt-48" />
      <ThingIcon name="pencilCup" size={80} anim="wobble" className="absolute top-12 right-[8%] opacity-40 hidden md:block" />
      
      <div className="container-x">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cta/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-cta mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
            Nossos Cursos
          </div>
          <h2 className="font-display text-4xl font-black text-brand sm:text-5xl">
            Sua carreira começa com <span className="text-cta">excelência</span>
          </h2>
          <p className="mt-6 text-lg text-foreground/60 leading-relaxed">
            Graduação e Pós-Graduação presenciais com laboratórios de ponta e infraestrutura completa em Aparecida de Goiânia.
          </p>
        </Reveal>
        
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {AREAS_DYNAMIC.map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={`rounded-2xl px-8 py-3 text-sm font-bold transition-all duration-300 ${
                area === a
                  ? "bg-brand text-brand-foreground shadow-lg scale-105"
                  : "bg-slate-50 text-foreground/50 hover:bg-slate-100 hover:text-brand"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <Reveal key={c.nome} delay={i * 50}>
              <article className="card-hover group flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-brand/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="group-hover:scale-110 transition-transform">
                    <ThingIcon
                      name={
                        c.categoria === "Saúde" ? "brain"
                        : c.categoria === "Negócios" ? "dartboard"
                        : c.categoria === "Jurídico" ? "badge"
                        : c.categoria === "Esporte" ? "trail"
                        : "pencilCup"
                      }
                      size={56}
                      anim="float"
                      delay={i * 120}
                    />
                  </div>
                  <span className="rounded-full bg-brand/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand/60">
                    50% de bolsa
                  </span>
                </div>
                <h3 className="font-display text-2xl font-black text-brand leading-tight">{c.nome}</h3>
                <p className="mt-2 text-sm font-bold text-foreground/40 uppercase tracking-widest">
                  Graduação • {c.categoria}
                </p>
                <p className="mt-1 text-[11px] text-foreground/30 font-bold uppercase tracking-widest">
                  Turno: {c.turno}
                </p>
                
                <div className="mt-auto pt-10 flex items-center justify-between">
                  <button
                    onClick={() => onSelectCourse(c.nome)}
                    className="inline-flex items-center gap-2 font-bold text-cta transition-all hover:gap-3"
                  >
                    Ver detalhes <ArrowRight className="h-4 w-4" />
                  </button>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                    <div className="flex h-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 px-1 text-[8px] font-bold text-slate-500">
                      +100
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Why Us -------------------------------- */
function WhyUs() {
  const items = [
    { icon: "mortar-board", text: "Diploma reconhecido pelo MEC — exigência de 35% das profissões regulamentadas" },
    { icon: "briefcase", text: "Professores atuantes no mercado — não só teoria, mas prática real" },
    { icon: "handshake", text: "Networking desde o 1º dia — colegas e professores que abrem portas" },
    { icon: "target", text: "Estágio remunerado no 1º semestre — experiência antes de todo mundo" },
    { icon: "wallet", text: "50% de bolsa garantida — sem surpresa no boleto todo mês" },
    { icon: "building", text: "Estrutura completa: laboratórios, biblioteca e quadra no centro de Aparecida" },
    { icon: "trending-up", text: "Ambiente que acelera seu amadurecimento profissional e pessoal" },
  ];
  return (
    <section id="diferenciais" className="bg-slate-50 py-24 relative overflow-hidden">
      <ThingIcon name="trail" size={80} anim="float" className="absolute top-10 right-[5%] opacity-40 hidden md:block" />
      <div className="container-x grid items-center gap-16 lg:grid-cols-2 relative z-10">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-brand mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Nossos Diferenciais
          </div>
          <h2 className="font-display text-4xl font-black text-brand sm:text-5xl leading-tight">
            Mais do que uma faculdade. <span className="text-cta">Sua nova etapa.</span>
          </h2>
          <p className="mt-6 text-lg text-foreground/60 leading-relaxed">
            Estrutura, professores e oportunidades pensadas para colocar você no mercado desde o primeiro semestre.
          </p>
          <ul className="mt-10 grid gap-4">
            {items.map((it) => (
              <li
                key={it.text}
                className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:translate-x-1"
              >
                <div className="text-brand shrink-0">
                  {it.icon === "mortar-board" && <GraduationCap size={20} />}
                  {it.icon === "briefcase" && <Briefcase size={20} />}
                  {it.icon === "handshake" && <Handshake size={20} />}
                  {it.icon === "target" && <Target size={20} />}
                  {it.icon === "wallet" && <Wallet size={20} />}
                  {it.icon === "building" && <MapPin size={20} />}
                  {it.icon === "trending-up" && <TrendingUp size={20} />}
                </div>
                <span className="font-bold text-brand">{it.text}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <div className="grid grid-cols-2 gap-4">
            <img
              src={labImg}
              alt="Laboratório da FacCidade"
              loading="lazy"
              className="col-span-2 aspect-[16/10] w-full rounded-2xl object-cover shadow-card"
            />
            <img
              src={nursingImg}
              alt="Aula prática de enfermagem"
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover shadow-soft"
            />
            <img
              src={classroomImg}
              alt="Sala de aula"
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* --------------------------- Testimonials ----------------------------- */

/* ------------------------------ Campus -------------------------------- */
function Campus() {
  const photos = [
    { src: classroomImg, alt: "Sala de aula moderna", className: "row-span-2" },
    { src: libraryImg, alt: "Biblioteca da FacCidade" },
    { src: courtImg, alt: "Quadra poliesportiva" },
    { src: nursingImg, alt: "Laboratório de enfermagem" },
    { src: labImg, alt: "Laboratório de ciências", className: "col-span-2" },
  ];
  return (
    <section id="campus" className="bg-slate-900 py-24 text-white overflow-hidden relative">
      {/* Decorative background overlay */}
      <div className="absolute inset-0 bg-brand/40 mix-blend-multiply opacity-50" />
      <ThingIcon name="cathedral" size={90} anim="float" className="absolute top-10 right-[5%] opacity-50 hidden md:block" />
      
      <div className="container-x relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/80 mb-6">
            Nosso Campus
          </div>
          <h2 className="font-display text-4xl font-black sm:text-5xl">
            Ambiente pensado para o seu <span className="text-cta">sucesso</span>
          </h2>
          <p className="mt-6 text-lg text-white/60 leading-relaxed">
            Localização privilegiada no centro de Aparecida com infraestrutura moderna, salas climatizadas e laboratórios completos.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-10">
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] lg:grid-cols-3">
            {photos.map((p) => (
              <img
                key={p.alt}
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className={`h-full w-full rounded-2xl object-cover shadow-soft ${p.className ?? ""}`}
              />
            ))}
          </div>
        </Reveal>
        <div className="mt-10 text-center">
          <a href={VISIT_WPP} target="_blank" rel="noopener" className="btn-cta">
            Agendar visita ao campus <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Bolsas -------------------------------- */
function Bolsas() {
  const items = [
    { icon: "wallet", title: "Bolsa de 50% garantida", desc: "Do primeiro ao último semestre, sem letras miúdas." },
    { icon: "handshake", title: "Parcerias de Sucesso", desc: "Estágio remunerado em empresas líderes da região." },
    { icon: "file-check", title: "FIES e PROUNI", desc: "Suporte total para programas de financiamento e bolsa." },
  ];
  return (
    <section id="bolsas" className="relative overflow-hidden py-24 text-white" style={{ background: "var(--gradient-brand-deep)" }}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <ThingIcon name="gold" size={90} anim="drift" className="absolute top-12 right-[6%] opacity-50 hidden md:block" />
      
      <div className="container-x relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/80 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
            Bolsas e Financiamento
          </div>
          <h2 className="font-display text-4xl font-black sm:text-5xl leading-tight">
            Seu sonho cabe no <span className="text-cta">seu bolso</span>
          </h2>
          <p className="mt-6 text-lg text-white/70 leading-relaxed">
            Na FacCidade, acreditamos que educação de qualidade deve ser acessível. Por isso, oferecemos condições exclusivas.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 80}>
              <div className="group h-full rounded-3xl border-2 border-white/20 bg-white/10 backdrop-blur-md p-8 text-white transition-all hover:bg-white/20 hover:border-white/40">
                <div className="mb-6 text-white opacity-80">
                  {it.icon === "wallet" && <Wallet size={28} />}
                  {it.icon === "handshake" && <Handshake size={28} />}
                  {it.icon === "file-check" && <FileCheck size={28} />}
                </div>
                <h3 className="font-display text-xl font-black">{it.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a href="#inscrever" className="btn-cta">
            Garanta sua bolsa agora <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Main Form ------------------------------ */
function MainForm() {
  return (
    <section id="inscrever" className="bg-cta py-24 text-white relative overflow-hidden">
      {/* Background visual element */}
      <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-brand/10 blur-[100px] rounded-full -mr-64 -mt-64" />
      <ThingIcon name="rocket" size={90} anim="float" className="absolute top-10 right-[6%] opacity-50 hidden lg:block" />
      
      <div className="container-x relative z-10 grid items-center gap-16 lg:grid-cols-2">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/80 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Inscrição Gratuita
          </div>
          <h2 className="font-display text-4xl font-black sm:text-5xl leading-tight">
            Seu futuro não pode <span className="opacity-40">esperar</span>
          </h2>
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            Preencha o formulário e nossa equipe entrará em contato em até 24h para garantir sua vaga com 50% de bolsa.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              { icon: <Star className="h-5 w-5" />, text: "Atendimento humano e rápido" },
              { icon: <CheckCircle2 className="h-5 w-5" />, text: "Inscrição 100% gratuita" },
              { icon: <GraduationCap className="h-5 w-5" />, text: "Bolsa garantida em contrato" },
            ].map((it, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 transition-transform hover:translate-x-2">
                <div className="text-white opacity-80">{it.icon}</div>
                <span className="font-bold">{it.text}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative">
            <div className="absolute -inset-4 bg-brand/20 blur-2xl rounded-[40px] -z-10" />
            <LeadForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- Comparador ----------------------------- */
function Comparador() {
  const { config } = useLandingData();
  const baRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const dragging = useRef(false);

  const getPos = (clientX: number) => {
    if (!baRef.current) return;
    const rect = baRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
    
    // Celebrate when dragging to the far left (revealing the full "Before" side is actually revealing "After" if inverted)
    // The user said: "Os confetes estão invertidos, é quando completar estiver em 0%"
    if (pct < 2 && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F26522', '#1A3A6E', '#ffffff']
      });
      setHasCelebrated(true);
    } else if (pct > 50) {
      setHasCelebrated(false);
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) getPos(e.clientX); };
    const onTouch = (e: TouchEvent) => { if (dragging.current) { e.preventDefault(); getPos(e.touches[0].clientX); } };
    const onUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onTouch, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onTouch);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos(prev => Math.max(0, prev - 5));
    if (e.key === "ArrowRight") setPos(prev => Math.min(100, prev + 5));
  };

  return (
    <section id="comparador" className="bg-[#F5F6FA] py-24 overflow-hidden relative">
      <ThingIcon name="hand" size={70} anim="wobble" className="absolute top-12 right-[5%] opacity-40 hidden md:block" />
      <div className="container-x relative z-10">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F265221a] px-3.5 py-1 text-[12px] font-semibold text-[#F26522] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F26522] animate-pulse" />
            Veja a diferença
          </div>
          <h2 className="font-display text-[clamp(22px,5vw,36px)] font-[800] text-[#1A3A6E] leading-tight">
            O que muda na sua vida com um diploma?
          </h2>
          <p className="mt-2 text-[15px] text-[#666]">
            Arraste o divisor e compare a realidade antes e depois da graduação
          </p>
        </Reveal>

        <div className="mt-10 mx-auto max-w-[680px]">
          <div 
            ref={baRef}
            className="relative h-[240px] md:h-[320px] rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(26,58,110,0.12)] select-none touch-none cursor-ew-resize group/slider"
            onMouseDown={() => { dragging.current = true; }}
            onTouchStart={() => { dragging.current = true; }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="slider"
            aria-label="Comparador de salário antes e depois da graduação"
            aria-valuemin={10}
            aria-valuemax={90}
            aria-valuenow={pos}
          >
            {/* ANTES (Esquerda) */}
            <div className="absolute inset-0 bg-[#F0F0F2] p-6 md:p-8 md:px-10">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold text-[#999] tracking-[2px] uppercase">Antes</span>
                <X className="text-[#E53935]" size={18} />
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#999] font-bold mb-1">Renda média mensal</p>
                  <p className="text-[28px] md:text-[36px] font-[800] text-[#BBBBBB] leading-none">{config?.comparador_antes_renda || "R$ 1.800/mês"}</p>
                  <p className="text-[10px] text-[#999] mt-1 font-medium">(Média ensino médio completo, IBGE 2023)</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#999] font-bold mb-1">Cargo típico</p>
                  <p className="text-[16px] md:text-[18px] font-semibold text-[#BBBBBB]">{config?.comparador_antes_cargo || "Auxiliar / Operacional"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#999] font-bold mb-2">Progressão de carreira</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-[#E0E0E0] rounded-full">
                      <div className="h-full bg-[#CCCCCC] rounded-full" style={{ width: `${config?.comparador_antes_progressao || 25}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-[#999]">{config?.comparador_antes_progressao || 25}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#999] font-bold mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {config?.comparador_antes_badges ? JSON.parse(config.comparador_antes_badges).map((b: string) => (
                      <span key={b} className="bg-[#E0E0E0] text-[#999] rounded-full text-[11px] px-2.5 py-0.5">{b}</span>
                    )) : (
                      <>
                        <span className="bg-[#E0E0E0] text-[#999] rounded-full text-[11px] px-2.5 py-0.5">Ensino médio</span>
                        <span className="bg-[#E0E0E0] text-[#999] rounded-full text-[11px] px-2.5 py-0.5">Mercado saturado</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DEPOIS (Direita) */}
            <div 
              className="absolute inset-0 bg-[#1A3A6E] p-6 md:p-8 md:px-10 z-10 transition-[clip-path] duration-100 ease-out"
              style={{ 
                clipPath: `inset(0 0 0 ${pos}%)`,
                transition: dragging.current ? 'none' : 'clip-path 0.1s ease'
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <GraduationCap size={13} className="text-white" />
                      <span className="text-white font-[800] text-[13px]">FacCidade</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-white/60 tracking-[2px] uppercase mb-1">Depois</span>
                  <Check className="text-[#4CAF50]" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:gap-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-1">Renda média mensal</p>
                  <p className="text-[28px] md:text-[36px] font-[800] text-[#F26522] leading-none">{config?.comparador_depois_renda || "R$ 4.500/mês"}</p>
                  <p className="text-[10px] text-white/60 mt-1 font-medium">(Média ensino superior, IBGE 2023)</p>
                  <span className="inline-block mt-2 bg-[#F2652233] text-[#F26522] rounded-full text-[11px] px-2.5 py-1 font-bold">{config?.comparador_depois_aumento_texto || "+150% de aumento médio"}</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-1">Cargo típico</p>
                  <p className="text-[16px] md:text-[18px] font-semibold text-white">{config?.comparador_depois_cargo || "Coordenador / Especialista"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-2">Progressão de carreira</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F26522] rounded-full transition-all duration-[1200ms] ease-out" 
                        style={{ width: `${config?.comparador_depois_progressao || 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white">{config?.comparador_depois_progressao || 100}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {config?.comparador_depois_badges ? JSON.parse(config.comparador_depois_badges).map((b: string) => (
                      <span key={b} className="bg-[#F2652233] text-[#F26522] rounded-full text-[11px] px-2.5 py-0.5">{b}</span>
                    )) : (
                      <>
                        <span className="bg-[#F2652233] text-[#F26522] rounded-full text-[11px] px-2.5 py-0.5">Diploma MEC</span>
                        <span className="bg-[#F2652233] text-[#F26522] rounded-full text-[11px] px-2.5 py-0.5">59% mais contratável</span>
                        <span className="bg-[#F2652233] text-[#F26522] rounded-full text-[11px] px-2.5 py-0.5">Rede profissional</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DIVISOR (Handle) */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white z-20 pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[44px] h-[44px] md:w-[52px] md:h-[52px] bg-white border-[3px] border-[#F26522] rounded-full shadow-[0_4px_20px_rgba(242,101,34,0.35)] flex items-center justify-center animate-[handle-hint_0.6s_ease_1s_3]">
                <div className="flex items-center text-[#F26522] font-bold">
                  <span className="text-[16px]">↔</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Reveal delay={0} className="h-full">
            <div className="h-full bg-white p-6 rounded-[16px] shadow-[0_4px_24px_rgba(26,58,110,0.08)] flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#F265221a] flex items-center justify-center text-[#F26522] mb-4">
                <TrendingUp size={24} />
              </div>
              <p className="text-[32px] font-[800] text-[#1A3A6E] leading-tight">+150%</p>
              <p className="mt-2 text-[13px] text-[#666] leading-relaxed">de aumento salarial médio após a graduação (IBGE 2023)</p>
            </div>
          </Reveal>
          <Reveal delay={150} className="h-full">
            <div className="h-full bg-white p-6 rounded-[16px] shadow-[0_4px_24px_rgba(26,58,110,0.08)] flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#1A3A6E1a] flex items-center justify-center text-[#1A3A6E] mb-4">
                <Briefcase size={24} />
              </div>
              <p className="text-[32px] font-[800] text-[#1A3A6E] leading-tight">59%</p>
              <p className="mt-2 text-[13px] text-[#666] leading-relaxed">dos recrutadores priorizam candidatos com ensino superior</p>
            </div>
          </Reveal>
          <Reveal delay={300} className="h-full">
            <div className="h-full bg-white p-6 rounded-[16px] shadow-[0_4px_24px_rgba(26,58,110,0.08)] flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#F265221a] flex items-center justify-center text-[#F26522] mb-4">
                <Star size={24} />
              </div>
              <p className="text-[32px] font-[800] text-[#1A3A6E] leading-tight">2x</p>
              <p className="mt-2 text-[13px] text-[#666] leading-relaxed">mais chances de promoção com diploma em mãos</p>
            </div>
          </Reveal>
        </div>

        <p className="mt-4 text-[11px] text-[#999] text-center italic">
          * Fontes: IBGE 2023, CNN Brasil Educação, pesquisa Quero Bolsa 2024
        </p>

        <div className="mt-10 flex justify-center">
          <a 
            href="#inscrever" 
            className="btn-cta bg-[#F26522] hover:bg-[#d9561a] text-white rounded-full py-4 px-10 text-[15px] font-[700] font-display shadow-[0_8px_32px_rgba(242,101,34,0.35)] transition-all hover:-translate-y-0.5"
          >
            QUERO ESSA MUDANÇA NA MINHA VIDA →
          </a>
        </div>
      </div>
      
      <style>{`
        @keyframes handle-hint {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </section>
  );
}

/* ------------------------------ ExitIntentPopup ------------------------------- */
function ExitIntentPopup() {
  const { config } = useLandingData();
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setShow(true);
        setHasShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasShown]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-brand/60 backdrop-blur-md" onClick={() => setShow(false)} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        <div className="md:w-2/5 bg-brand relative overflow-hidden p-8 flex flex-col justify-center items-center text-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="relative z-10">
            <ThingIcon name="rocket" size={140} anim="float" className="drop-shadow-[0_20px_40px_rgba(242,101,34,0.4)]" />
          </div>
          
          <div className="mt-6 relative z-10">
            <span className="block text-cta font-black text-4xl leading-none">50%</span>
            <span className="block text-white/80 font-bold text-xs tracking-[4px] uppercase mt-1">De Bolsa</span>
          </div>
        </div>

        <div className="flex-1 p-8 sm:p-12 relative">
          <button 
            onClick={() => setShow(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-cta hover:text-white transition-all shadow-sm"
          >
            <X size={18} />
          </button>

          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-cta/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-cta">
              Oferta Exclusiva
            </div>
            
            <h3 className="font-display text-3xl sm:text-4xl font-black text-brand leading-[1.1]">
              Sua carreira não pode <span className="text-cta">esperar!</span>
            </h3>
            
            <p className="text-lg text-foreground/60 leading-relaxed">
              {config?.exit_popup_text || "Você sabia que temos bolsas de 50% em todos os cursos? Garanta a sua antes de fechar."}
            </p>

            <div className="flex flex-col gap-3 pt-4">
              <a 
                href="#inscrever" 
                onClick={() => setShow(false)}
                className="btn-cta w-full py-5 text-center shadow-[0_12px_24px_rgba(242,101,34,0.3)] hover:translate-y-[-2px] transition-all"
              >
                {config?.exit_popup_title ? "GARANTIR MINHA BOLSA" : "QUERO MEU DESCONTO AGORA"}
              </a>
              <button 
                onClick={() => setShow(false)}
                className="w-full py-4 font-bold text-slate-400 hover:text-brand transition-colors text-sm"
              >
                Talvez depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- FAQ --------------------------------- */
function FAQ() {
  const items = [
    {
      q: "Como funciona a bolsa de 50%?",
      a: "A bolsa de 50% é aplicada em 100% das mensalidades, do primeiro ao último semestre, sem condições escondidas.",
    },
    {
      q: "Quais cursos estão disponíveis?",
      a: "Oferecemos graduação em Enfermagem, Educação Física, Ciências Contábeis, Administração e Direito, além de pós-graduações nas áreas de saúde, gestão e educação.",
    },
    {
      q: "A FacCidade é reconhecida pelo MEC?",
      a: "Sim. Todos os nossos cursos são autorizados e reconhecidos pelo Ministério da Educação.",
    },
    {
      q: "Como faço para me inscrever no vestibular?",
      a: "Basta preencher o formulário desta página. Nossa equipe entra em contato e conduz você por todo o processo.",
    },
    {
      q: "Tem estágio durante o curso?",
      a: "Sim. Temos parcerias com empresas e instituições da região e incentivamos o estágio desde os primeiros semestres.",
    },
    {
      q: "Qual a localização da faculdade?",
      a: "Estamos no centro de Aparecida de Goiânia - GO, com fácil acesso por transporte público.",
    },
    {
      q: "Tem pós-graduação disponível?",
      a: "Sim, oferecemos diversas pós-graduações presenciais com foco em mercado e prática profissional.",
    },
    {
      q: "Posso visitar o campus antes de me inscrever?",
      a: "Claro! Agende uma visita pelo nosso WhatsApp e venha conhecer nossa estrutura pessoalmente.",
    },
    {
      q: "Vale a pena fazer faculdade hoje em dia?",
      a: "Sim. Dados do IBGE mostram que profissionais com ensino superior ganham em média o dobro de quem tem apenas o ensino médio. Além disso, 59% das vagas no mercado exigem ou preferem candidatos com graduação.",
    },
    {
      q: "Quanto tempo leva para o diploma mudar minha vida?",
      a: "Na FacCidade, o impacto começa antes do diploma. Nossos alunos entram em estágio remunerado já no 1º semestre, o que significa renda e experiência enquanto ainda estudam.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  
  return (
    <section id="faq" className="bg-white py-24 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand/[0.02] rounded-full blur-3xl -mr-20 -mt-20"></div>
      <ThingIcon name="brain" size={80} anim="float" className="absolute top-16 right-[6%] opacity-40 hidden md:block" />
      
      <div className="container-x relative z-10">
        <div className="grid gap-16 lg:grid-cols-[380px_1fr]">
          <div className="lg:sticky lg:top-32 h-fit">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-brand mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                FAQ
              </div>
              <h2 className="font-display text-4xl font-black text-brand sm:text-5xl leading-tight">
                Dúvidas <br /><span className="text-cta">Frequentes</span>
              </h2>
              <p className="mt-6 text-lg text-foreground/60 leading-relaxed max-w-sm">
                Tudo o que você precisa saber sobre a FacCidade antes de começar sua jornada profissional.
              </p>
              
              <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-100 hidden lg:block">
                <p className="text-sm font-bold text-brand mb-4">Ainda tem dúvidas?</p>
                <a 
                  href={VISIT_WPP} 
                  target="_blank" 
                  rel="noopener" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-brand/10 rounded-2xl text-brand font-bold text-sm hover:bg-brand hover:text-white transition-all group"
                >
                  Falar com consultor
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-4">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={it.q} delay={i * 40}>
                  <div 
                    className={`group overflow-hidden rounded-[24px] border transition-all duration-500 ${
                      isOpen 
                        ? "border-brand/20 bg-brand/[0.01] shadow-[0_8px_30px_rgba(26,58,110,0.04)]" 
                        : "border-slate-100 bg-white hover:border-brand/10 hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-6 p-6 text-left sm:p-8"
                    >
                      <span className={`font-display font-black text-lg transition-colors duration-300 ${isOpen ? "text-brand" : "text-[#333] group-hover:text-brand"}`}>
                        {it.q}
                      </span>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                        isOpen 
                          ? "rotate-180 bg-brand border-brand text-white shadow-lg shadow-brand/20" 
                          : "bg-slate-50 border-slate-100 text-brand"
                      }`}>
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </button>
                    <div
                      className={`grid transition-all duration-500 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-8 text-[16px] leading-relaxed text-foreground/70 sm:px-8 max-w-2xl">
                          {it.a}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
        
        {/* Mobile footer call to action */}
        <div className="mt-12 lg:hidden">
          <Reveal>
             <a 
              href={VISIT_WPP} 
              target="_blank" 
              rel="noopener" 
              className="flex items-center justify-center gap-2 w-full py-5 bg-slate-50 border border-slate-100 rounded-3xl text-brand font-bold"
            >
              Falar com consultor via WhatsApp
              <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Footer -------------------------------- */
export function Footer() {
  return (
    <footer className="w-full font-display">
      {/* CAMADA 1 — FAIXA CTA */}
      <section className="bg-[#F26522] px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-5">
        <div className="text-center md:text-left">
          <h3 className="font-bold text-[22px] text-white leading-tight font-display">Ainda não garantiu sua vaga?</h3>
          <p className="font-normal text-sm text-white/85 mt-1 font-display">50% de bolsa do início ao fim. Matrículas abertas agora.</p>
        </div>
        <a 
          href="#inscrever" 
          className="w-full md:w-auto bg-white text-[#F26522] font-bold text-[13px] px-8 py-3.5 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all duration-200 text-center uppercase tracking-wider font-display"
        >
          GARANTIR MINHA VAGA →
        </a>
      </section>

      {/* CAMADA 2 — CORPO PRINCIPAL */}
      <section className="bg-[#0D1B3E] px-12 py-15 pb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-10 items-start">
          {/* Coluna 1 — Identidade */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <span className="block font-black text-2xl text-white uppercase tracking-tight font-display">FacCidade</span>
              <span className="block font-semibold text-[9px] text-[#F26522] tracking-[3px] mt-0.5 font-display uppercase">APARECIDA DE GOIÂNIA</span>
            </div>
            <p className="text-[13px] text-white/60 leading-[1.7] max-w-[260px] font-display">
              A 1ª Faculdade do centro de Aparecida de Goiânia. Estrutura completa, 50% de bolsa e estágio desde o 1º semestre.
            </p>
            <div className="mt-5 flex gap-2.5">
              <SocialIcon href="https://instagram.com/faccidade" icon={<Instagram size={18} />} />
              <SocialIcon href="#" icon={<Facebook size={18} />} />
              <SocialIcon href={VISIT_WPP} icon={<Phone size={18} />} />
            </div>
          </div>

          {/* Coluna 2 — Cursos */}
          <div>
            <FooterHeading>Graduação</FooterHeading>
            <ul className="space-y-0 list-none p-0">
              <FooterLink href="#inscrever">Enfermagem</FooterLink>
              <FooterLink href="#inscrever">Educação Física</FooterLink>
              <FooterLink href="#inscrever">Ciências Contábeis</FooterLink>
              <FooterLink href="#inscrever">Administração</FooterLink>
              <FooterLink href="#inscrever">Direito</FooterLink>
            </ul>
            <div className="mt-4">
              <FooterHeading>Pós-Graduação</FooterHeading>
              <ul className="space-y-0 list-none p-0">
                <FooterLink href={VISIT_WPP}>MBA Gestão Empresarial</FooterLink>
                <FooterLink href={VISIT_WPP}>Especialização em Saúde</FooterLink>
              </ul>
            </div>
          </div>

          {/* Coluna 3 — Institucional */}
          <div>
            <FooterHeading>Institucional</FooterHeading>
            <ul className="space-y-0 list-none p-0">
              <FooterLink href="#">Quem Somos</FooterLink>
              <FooterLink href="#">Parceiros</FooterLink>
              <FooterLink href="#">Oportunidades</FooterLink>
              <FooterLink href="#inscrever">Vestibular</FooterLink>
              <FooterLink href="#">Portal do Aluno</FooterLink>
              <FooterLink href="#">Política de Privacidade</FooterLink>
              <FooterLink href="https://verificadordiplomadigital.mec.gov.br/diploma" external>Validar Diploma</FooterLink>
            </ul>
          </div>

          {/* Coluna 4 — Contato */}
          <div className="col-span-2 md:col-span-1">
            <FooterHeading>Contato</FooterHeading>
            <div className="flex flex-col gap-3.5 mt-2">
              <ContactItem 
                icon={<MapPin size={16} className="text-[#F26522] shrink-0" />} 
                text="Av. Chile, Qd. 41 Lt. 10 – Jd. Belo Horizonte CEP 74.976-030 – Aparecida de Goiânia, GO" 
              />
              <ContactItem 
                icon={<Phone size={16} className="text-[#F26522] shrink-0" />} 
                text="(62) 98591-2420 / (62) 3283-3959" 
                href="tel:+556232833959"
              />
              <ContactItem 
                icon={<Phone size={16} className="text-[#F26522] shrink-0" />} 
                text="(62) 98603-1010" 
                href={VISIT_WPP}
                badge="Comercial"
              />
              <ContactItem 
                icon={<Mail size={16} className="text-[#F26522] shrink-0" />} 
                text="contato@faccidade.edu.br" 
                href="mailto:contato@faccidade.edu.br"
              />
              <ContactItem 
                icon={<Mail size={16} className="text-white/30 shrink-0" />} 
                text="secretaria@faccidade.edu.br" 
                badge="Secretaria"
                badgeLight
              />
            </div>
            <div className="mt-5">
              <a 
                href={VISIT_WPP} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-[12px] font-semibold text-white/80 border border-white/25 rounded-full px-5 py-2.5 hover:border-[#F26522] hover:text-[#F26522] transition-all duration-200 font-display"
              >
                Agendar visita ao campus →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CAMADA 3 — FAIXA INSTITUCIONAL/LEGAL */}
      <section className="bg-[#07111F] px-12 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">
        <div className="text-[11px] text-white/40 leading-[1.8] font-display">
          <p>Sociedade de Educação e Cultura Aparecida de Goiânia Ltda.</p>
          <p>CNPJ: 23.888.490/0001-00 · CNAE: 8532-5/00 – Educação superior</p>
          <p>Fundada em 17/11/2015 · Situação cadastral: Ativa</p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 mb-1 font-display">Cadastro e-MEC</p>
          <a 
            href="https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/MjE2NzU=" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-[#F26522] hover:underline font-display"
          >
            Consultar credenciamento →
          </a>
        </div>
      </section>

      {/* CAMADA 4 — BARRA DE COPYRIGHT */}
      <section className="bg-[#050D18] px-12 py-3.5 flex flex-col md:flex-row justify-between items-center gap-2 text-center">
        <p className="text-[11px] text-white/30 font-display">
          © 2025 FacCidade — Faculdade Cidade Aparecida de Goiânia. Todos os direitos reservados. · <a href="https://www.thiings.co/things" target="_blank" rel="noopener noreferrer" className="hover:text-white/60">Produzido por Thiings</a>
        </p>
        <div className="flex gap-2 text-[11px] text-white/30 font-display">
          <a href="#" className="hover:text-white/60">Política de Privacidade</a>
          <span>·</span>
          <a href="#" className="hover:text-white/60">Termos de Uso</a>
        </div>
      </section>
    </footer>
  );
}

/* ------------------------------ EnrollmentModal ------------------------------- */
function EnrollmentModal({ isOpen, onClose, courseName }: { isOpen: boolean; onClose: () => void; courseName?: string }) {
  const [phone, setPhone] = useState("");
  
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(`Olá! Quero garantir minha vaga no curso de ${courseName || "Graduação"} (WhatsApp: ${phone})`);
    window.open(`https://api.whatsapp.com/send?phone=5562986031010&text=${text}`, "_blank");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-brand/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Banner Superior */}
        <div className="bg-brand p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10 flex flex-col items-center">
            <ThingIcon name="badge" size={80} anim="wobble" className="drop-shadow-lg mb-4" />
            <h3 className="font-display text-2xl font-black text-white">Inscrição Prioritária</h3>
            <p className="text-white/60 text-sm mt-1 uppercase tracking-widest font-bold">Vagas limitadas com 50% de bolsa</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-8 sm:p-10 relative">
          <button 
            onClick={onClose}
            className="absolute top-[-20px] right-6 p-2 rounded-full bg-white text-slate-400 hover:text-cta transition-all shadow-xl"
          >
            <X size={18} />
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Curso Selecionado</label>
              <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-display font-bold text-brand">
                {courseName || "Escolher na conversa"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Seu WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="w-full rounded-2xl border border-slate-200 px-5 py-4 outline-none focus:border-cta focus:ring-4 focus:ring-cta/10 transition-all font-bold text-brand placeholder:text-slate-300"
                required
              />
            </div>

            <button type="submit" className="btn-cta w-full py-5 text-center shadow-[0_12px_24px_rgba(242,101,34,0.3)] hover:translate-y-[-2px] transition-all">
              GARANTIR MINHA VAGA AGORA
            </button>
            
            <p className="text-center text-[10px] text-slate-400 font-medium">
              Ao clicar, você será redirecionado para o nosso WhatsApp oficial.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ExitIntentPopup implementation is moved up

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/70 hover:bg-[#F26522] hover:text-white transition-all duration-200"
    >
      {icon}
    </a>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-bold text-[11px] text-[#F26522] uppercase tracking-[2px] pb-2.5 mb-3.5 border-b border-white/10">
      {children}
    </h4>
  );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  return (
    <li className="list-none">
      <a 
        href={href} 
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-[13px] text-white/65 leading-[2.2] block hover:text-[#F26522] hover:pl-1 transition-all duration-200"
      >
        {children}
      </a>
    </li>
  );
}

function ContactItem({ icon, text, href, badge, badgeLight }: { icon: React.ReactNode; text: string; href?: string; badge?: string; badgeLight?: boolean }) {
  const content = (
    <div className="flex items-start gap-2.5">
      {icon}
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-white/65 leading-[1.6]">
          {text}
          {badge && (
            <span className={`inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeLight ? "bg-white/5 text-white/40" : "bg-[#F265221a] text-[#F26522]"}`}>
              {badge}
            </span>
          )}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }
  return content;
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-display font-bold text-white">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="hover:text-cta">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
