import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/adminincomy/login')({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      navigate({ to: '/adminincomy/dashboard' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <div className="flex flex-col items-center mb-10">
          <img 
            src="https://rmetppilvfrxosvxzhgj.supabase.co/storage/v1/object/public/message-attachments/21421442-d428-41c1-9c81-5e6bb5067d7a/1778281588613_4mym60_image.png" 
            alt="FacCidade" 
            className="h-16 mb-6" 
          />
          <h1 className="text-2xl font-bold text-[#1A3A6E] text-center">Painel Administrativo</h1>
          <p className="text-slate-400 mt-2 text-center">Faça login para gerenciar sua Landing Page</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-[#1A3A6E] focus:ring-2 focus:ring-[#1A3A6E]/10 outline-none transition-all"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
            <input
              type="password"
              required
              className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-[#1A3A6E] focus:ring-2 focus:ring-[#1A3A6E]/10 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A3A6E] hover:bg-[#F26522] text-white font-bold py-4 rounded-full shadow-lg shadow-[#1A3A6E]/20 hover:shadow-[#F26522]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
