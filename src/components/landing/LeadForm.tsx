import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLandingData } from "@/hooks/useLandingData";

export function LeadForm() {
  const { config, cursos } = useLandingData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    curso: "",
    turno: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("leads").insert({
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        email: formData.email,
        curso_interesse: formData.curso,
        turno: formData.turno,
      });

      if (error) throw error;

      toast.success("Inscrição realizada com sucesso! Em breve entraremos em contato.");
      setFormData({ nome: "", whatsapp: "", email: "", curso: "", turno: "" });

      // Opcional: Notificação via WhatsApp
      const wppDest = config?.lead_whatsapp_destino;
      if (wppDest) {
        const text = encodeURIComponent(
          `*Novo Lead FacCidade*\n\n*Nome:* ${formData.nome}\n*Curso:* ${formData.curso}\n*WhatsApp:* ${formData.whatsapp}`
        );
        window.open(`https://api.whatsapp.com/send?phone=55${wppDest.replace(/\D/g, '')}&text=${text}`, '_blank');
      }
    } catch (error) {
      toast.error("Erro ao enviar inscrição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="inscrever" onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nome completo"
        required
        className="w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand"
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="tel"
          placeholder="WhatsApp"
          required
          className="w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand"
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
        />
        <input
          type="email"
          placeholder="E-mail"
          required
          className="w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <select
          required
          className="w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand appearance-none"
          value={formData.curso}
          onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
        >
          <option value="">Selecione o curso</option>
          {cursos.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
          {cursos.length === 0 && (
            <>
              <option value="Administração">Administração</option>
              <option value="Ciências Contábeis">Ciências Contábeis</option>
              <option value="Direito">Direito</option>
              <option value="Educação Física">Educação Física</option>
              <option value="Enfermagem">Enfermagem</option>
            </>
          )}
        </select>
        <select
          required
          className="w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand appearance-none"
          value={formData.turno}
          onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
        >
          <option value="">Selecione o turno</option>
          <option value="Matutino">Matutino</option>
          <option value="Noturno">Noturno</option>
          <option value="Integral">Integral</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-cta w-full py-4 text-sm font-bold shadow-lg shadow-brand/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
      >
        {loading ? "ENVIANDO..." : "QUERO MINHA BOLSA DE 50% AGORA"}
      </button>
    </form>
  );
}
