import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Perfil } from '@/types/edu';

interface EduAuthState {
  user: any | null;
  perfil: Perfil | null;
  loading: boolean;
  error: string | null;
}

export function useEduAuth() {
  const [state, setState] = useState<EduAuthState>({
    user: null,
    perfil: null,
    loading: true,
    error: null,
  });

  const fetchPerfil = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      setState((s) => ({ ...s, loading: false, error: 'Perfil não encontrado. Contate o coordenador.' }));
      return;
    }
    setState((s) => ({ ...s, perfil: data as Perfil, loading: false }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setState((s) => ({ ...s, user }));
      if (user) {
        fetchPerfil(user.id);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState((s) => ({ ...s, user }));
      if (user) {
        fetchPerfil(user.id);
      } else {
        setState({ user: null, perfil: null, loading: false, error: null });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchPerfil]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, logout };
}
