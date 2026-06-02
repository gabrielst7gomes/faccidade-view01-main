import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/adminincomy')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Allow access to login page
    if (location.pathname === '/adminincomy/login') {
      if (session) {
        throw redirect({
          to: '/adminincomy/dashboard',
        });
      }
      return;
    }

    // Protect all other admin routes
    if (!session) {
      throw redirect({
        to: '/adminincomy/login',
      });
    }

    // Redirect root admin path to dashboard
    if (location.pathname === '/adminincomy' || location.pathname === '/adminincomy/') {
      throw redirect({
        to: '/adminincomy/dashboard',
      });
    }
  },
});