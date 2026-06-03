/**
 * Jornada.tsx — Seção "Sua Jornada" interativa com ícones 3D do Thiings.co
 */
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const ICONS = {
  backpack:      "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-53doFZDyMbmChPPHfnbbPjt0Zvlzq7.png",
  pencil:        "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-uvT8LcYBki2O1QqshT6NUI5Uh81k3r.png",
  microscope:    "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-77A79flIO6Aoo3qawDuFwbEKPZgKpa.png",
  laptop:        "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-UsyTZyMk2er8VfZu1T68Z4BbnfHYL1.png",
  trophy:        "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-BwtahaCLSoUOyWdITnlPCNiwzCLUdL.png",
  graduationCap: "https://lftz25oez4aqbxpq.public.blob.vercel-storage.com/image-iZKfmUSHuQtDn1W2NBIwoLZ0epsnzZ.png",
};

type Step = {
  img: string;
  step: string;
  title: string;
  sub: string;
  desc: string;
  color: string;
  light: string;
  isFinal?: boolean;
};

const STEPS: Step[] = [
  {
    img: ICONS.backpack,
    step: "01",
    title: "Matrícula",
    sub: "Sem burocracia",
    desc: "Inscrição gratuita em 2 minutos. Nossa equipe entra em contato em até 24h para garantir sua vaga com 50% de bolsa.",
    color: "#1A3A6E",
    light: "#EEF2FF",
  },
  {
    img: ICONS.pencil,
    step: "02",
    title: "1º Semestre",
    sub: "Sentindo o mercado",
    desc: "Professores ativos no mercado ensinam com cases reais desde o primeiro dia. Teoria que vira prática imediata.",
    color: "#7C3AED",
    light: "#F5F3FF",
  },
  {
    img: ICONS.microscope,
    step: "03",
    title: "Laboratórios",
    sub: "Prática de verdade",
    desc: "Infraestrutura completa: laboratórios modernos, biblioteca digital e quadra poliesportiva no campus.",
    color: "#059669",
    light: "#ECFDF5",
  },
  {
    img: ICONS.laptop,
    step: "04",
    title: "Estágio",
    sub: "Renda antes de todo mundo",
    desc: "Vagas remuneradas já no 1º semestre através de nossas empresas parceiras na região.",
    color: "#D97706",
    light: "#FFFBEB",
  },
  {
    img: ICONS.trophy,
    step: "05",
    title: "Conquistas",
    sub: "Currículo que cresce",
    desc: "Eventos, competições, certificações e atividades complementares que enriquecem seu perfil profissional.",
    color: "#DC2626",
    light: "#FFF1F2",
  },
  {
    img: ICONS.graduationCap,
    step: "06",
    title: "Diploma",
    sub: "Sua nova etapa! 🎉",
    desc: "Diploma reconhecido pelo MEC. O início de uma carreira que vai muito além das suas expectativas.",
    color: "#F26522",
    light: "#FFF7ED",
    isFinal: true,
  },
];

const CSS = `
@keyframes jornada-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-14px) rotate(3deg); }
}
@keyframes jornada-float-r {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-10px) rotate(-3deg); }
}
@keyframes jornada-check {
  from { transform: scale(0) rotate(-90deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg);   opacity: 1; }
}
@keyframes jornada-fadein {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes jornada-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(242,101,34,0); }
  50%      { box-shadow: 0 0 0 8px rgba(242,101,34,0.12); }
}
.jornada-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
}
.jornada-card:hover { transform: translateY(-8px) scale(1.05); }
.jornada-card:active { transform: scale(0.97); }
`;

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(14px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

export function Jornada() {
  const [active, setActive] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<number>>(new Set());

  const handleClick = (i: number) => {
    setActive((prev) => (prev === i ? null : i));
    setVisited((prev) => new Set([...prev, i]));

    if (STEPS[i].isFinal) {
      confetti({
        particleCount: 220,
        spread: 110,
        origin: { y: 0.55 },
        colors: ["#F26522", "#1A3A6E", "#FFD700", "#ffffff", "#7C3AED"],
      });
    }
  };

  return (
    <section
      id="jornada"
      style={{
        position: "relative",
        padding: "96px 16px",
        background: "linear-gradient(180deg, #ffffff 0%, #F8FAFC 100%)",
        fontFamily: "Montserrat, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{CSS}</style>

      {/* Glow de fundo */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(242,101,34,0.08), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 18px",
                borderRadius: 999,
                background: "rgba(26,58,110,0.06)",
                color: "#1A3A6E",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Sua Jornada
            </span>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 900,
              color: "#1A3A6E",
              lineHeight: 1.05,
              margin: "0 0 18px",
            }}
          >
            Do primeiro dia ao{" "}
            <span style={{ color: "#F26522" }}>diploma</span>
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p
            style={{
              textAlign: "center",
              maxWidth: 640,
              margin: "0 auto 56px",
              color: "rgba(15,23,42,0.6)",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Clique em cada etapa e descubra o que te espera na FacCidade.{" "}
            <strong style={{ color: "#1A3A6E" }}>Spoiler: é melhor do que você imagina!</strong>
          </p>
        </Reveal>

        {/* Grid de cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 18,
            marginBottom: 48,
          }}
        >
          {STEPS.map((s, i) => {
            const isActive = active === i;
            const isDone = visited.has(i);

            return (
              <Reveal key={s.step} delay={i * 80}>
                <button
                  onClick={() => handleClick(i)}
                  className="jornada-card"
                  style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px 16px",
                    borderRadius: 24,
                    border: `2px solid ${
                      isActive ? s.color : isDone ? s.color + "50" : "rgba(0,0,0,0.04)"
                    }`,
                    background: isActive ? s.light : "#ffffff",
                    boxShadow: isActive
                      ? `0 24px 60px ${s.color}22`
                      : isDone
                      ? `0 4px 20px ${s.color}15`
                      : "0 2px 12px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                    textAlign: "center",
                    animation: isActive ? "jornada-pulse 2s ease-in-out infinite" : undefined,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {isDone && !isActive && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: s.color,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "jornada-check 0.4s ease",
                      }}
                    >
                      ✓
                    </span>
                  )}

                  <img
                    src={s.img}
                    alt={s.title}
                    width={88}
                    height={88}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={{
                      width: 88,
                      height: 88,
                      objectFit: "contain",
                      marginBottom: 10,
                      animation: `${i % 2 === 0 ? "jornada-float" : "jornada-float-r"} ${
                        4 + (i % 3)
                      }s ease-in-out infinite`,
                      animationDelay: `${i * 200}ms`,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 3,
                      color: s.color,
                      opacity: 0.7,
                    }}
                  >
                    {s.step}
                  </span>

                  <h3
                    style={{
                      margin: "4px 0 2px",
                      fontSize: 17,
                      fontWeight: 900,
                      color: "#1A3A6E",
                      lineHeight: 1.15,
                    }}
                  >
                    {s.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "rgba(15,23,42,0.55)",
                      fontWeight: 600,
                    }}
                  >
                    {s.sub}
                  </p>

                  {isActive && (
                    <p
                      style={{
                        marginTop: 14,
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: "rgba(15,23,42,0.75)",
                        animation: "jornada-fadein 0.4s ease",
                      }}
                    >
                      {s.desc}
                    </p>
                  )}
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Área de progresso */}
        <Reveal>
          <div
            style={{
              maxWidth: 640,
              margin: "0 auto",
              padding: "24px 28px",
              borderRadius: 20,
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 8px 30px rgba(15,23,42,0.05)",
              textAlign: "center",
            }}
          >
            {visited.size === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "rgba(15,23,42,0.6)",
                  fontWeight: 600,
                }}
              >
                👆 Toque em cada etapa para explorar sua jornada
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    marginBottom: visited.size === 6 ? 18 : 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 3,
                      color: "#1A3A6E",
                      textTransform: "uppercase",
                    }}
                  >
                    Progresso
                  </span>
                  <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "center" }}>
                    {STEPS.map((st, i) => (
                      <span
                        key={i}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: visited.has(i) ? st.color : "rgba(15,23,42,0.1)",
                          transition: "background 0.3s ease",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#1A3A6E",
                    }}
                  >
                    {visited.size}/6
                  </span>
                </div>

                {visited.size === 6 && (
                  <div style={{ animation: "jornada-fadein 0.5s ease" }}>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontSize: 18,
                        fontWeight: 900,
                        color: "#1A3A6E",
                      }}
                    >
                      Você completou a jornada FacCidade!
                    </p>
                    <a
                      href="#inscrever"
                      style={{
                        display: "inline-block",
                        padding: "14px 28px",
                        borderRadius: 999,
                        background: "#F26522",
                        color: "#fff",
                        fontWeight: 900,
                        fontSize: 14,
                        letterSpacing: 1,
                        textDecoration: "none",
                        transition: "background 0.2s ease, transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#d4551c")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#F26522")}
                    >
                      Começar agora →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Jornada;
