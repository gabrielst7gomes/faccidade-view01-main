import { useEffect, useState } from "react";
import { X } from "lucide-react";

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (shown) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !shown) {
        setOpen(true);
        setShown(true);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [shown]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1 text-foreground/60 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-display text-2xl font-extrabold text-brand">
          Espera! Sua vaga pode esgotar.
        </h3>
        <p className="mt-2 text-sm text-foreground/70">
          Garanta agora <strong className="text-cta">50% de desconto</strong> e assegure sua matrícula.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.open(
              `https://api.whatsapp.com/send?phone=5562986031010&text=${encodeURIComponent("Olá! Quero garantir minha vaga (WhatsApp: " + phone + ")")}`,
              "_blank",
            );
            setOpen(false);
          }}
          className="mt-4 grid gap-3"
        >
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="Seu WhatsApp"
            className="w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            required
          />
          <button className="btn-cta">QUERO GARANTIR MINHA VAGA</button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-foreground/50 underline"
          >
            Não, vou perder essa oportunidade
          </button>
        </form>
      </div>
    </div>
  );
}
