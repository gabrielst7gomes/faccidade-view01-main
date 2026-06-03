import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/edu/')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: '/edu/login' });
    }
    const { data: perfil } = await supabase
      .from('perfis')
      .select('perfil')
      .eq('id', data.session.user.id)
      .single();

    if (!perfil) throw redirect({ to: '/edu/login' });

    if (perfil.perfil === 'coordenador') throw redirect({ to: '/edu/coordenador' });
    if (perfil.perfil === 'professor') throw redirect({ to: '/edu/professor' });
    if (perfil.perfil === 'aluno') throw redirect({ to: '/edu/aluno' });

    throw redirect({ to: '/edu/login' });
  },
  component: () => null,
});
