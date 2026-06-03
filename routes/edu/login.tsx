import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/edu/login')({
  component: EduLogin,
});

function EduLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error('E-mail ou senha incorretos.');
        setLoading(false);
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('perfil')
        .eq('id', authData.user.id)
        .single();

      if (perfilError || !perfil) {
        toast.error('Perfil não encontrado. Contate o coordenador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success('Bem-vindo ao FacCidade Edu!');

      if (perfil.perfil === 'coordenador') navigate({ to: '/edu/coordenador' });
      else if (perfil.perfil === 'professor') navigate({ to: '/edu/professor' });
      else navigate({ to: '/edu/aluno' });
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3A6E 60%, #1e4a8a 100%)',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1A3A6E] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-[#1A3A6E] tracking-tight">FacCidade Edu</h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Sistema Acadêmico</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                E-mail institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@faccidade.edu.br"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#1A3A6E] focus:ring-4 focus:ring-[#1A3A6E]/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-[#1A3A6E] focus:ring-4 focus:ring-[#1A3A6E]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-[#1A3A6E] hover:bg-[#0D1B3E] text-white font-black text-sm uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Problemas de acesso?{' '}
            <a href="tel:+556232833959" className="text-[#F26522] font-bold hover:underline">
              Fale com a secretaria
            </a>
          </p>
        </div>

        {/* Back to site */}
        <div className="text-center mt-5">
          <a href="/" className="text-white/50 hover:text-white text-xs font-medium transition-colors">
            ← Voltar ao site da FacCidade
          </a>
        </div>
      </div>
    </div>
  );
}
