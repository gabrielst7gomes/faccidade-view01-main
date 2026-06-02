import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  School, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/adminincomy/dashboard')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsToday: 0,
    mostRequestedCourse: '---',
    status: 'Online'
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          { count: totalLeads },
          { count: leadsToday },
          { data: allLeads },
          { data: latestLeads }
        ] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          supabase.from('leads').select('curso_interesse'),
          supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        // Calcular curso mais buscado
        let mostRequested = '---';
        if (allLeads && allLeads.length > 0) {
          const counts = allLeads.reduce((acc: any, lead: any) => {
            acc[lead.curso_interesse] = (acc[lead.curso_interesse] || 0) + 1;
            return acc;
          }, {});
          mostRequested = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        }

        setStats({
          totalLeads: totalLeads || 0,
          leadsToday: leadsToday || 0,
          mostRequestedCourse: mostRequested,
          status: 'Online'
        });
        setRecentLeads(latestLeads || []);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Carregando painel...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          color="bg-[#1A3A6E]" 
          value={stats.totalLeads} 
          label="Total de leads capturados" 
        />
        <StatCard 
          icon={Calendar} 
          color="bg-[#F26522]" 
          value={stats.leadsToday} 
          label="Novos leads hoje" 
        />
        <StatCard 
          icon={School} 
          color="bg-[#1A3A6E]" 
          value={stats.mostRequestedCourse} 
          label="Curso mais procurado" 
        />
        <StatCard 
          icon={CheckCircle2} 
          color="bg-green-500" 
          value={stats.status} 
          label="Status da Landing Page" 
        />
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-[#1A3A6E]">Leads Recentes</h3>
          <Link to="/adminincomy/leads" className="text-sm font-bold text-[#F26522] flex items-center gap-2 hover:gap-3 transition-all">
            Ver todos os leads <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Nome</th>
                <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Curso</th>
                <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Telefone</th>
                <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-4">
                    <p className="font-bold text-slate-700">{lead.nome}</p>
                    <p className="text-xs text-slate-400">{lead.email}</p>
                  </td>
                  <td className="py-5 px-4 text-sm font-semibold text-[#1A3A6E]">{lead.curso_interesse}</td>
                  <td className="py-5 px-4 text-sm text-slate-600 font-medium">{lead.whatsapp}</td>
                  <td className="py-5 px-4 text-sm text-slate-400">
                    {format(new Date(lead.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </td>
                </tr>
              ))}
              {recentLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 italic">Nenhum lead capturado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:translate-y-[-4px] hover:shadow-md">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-black/5`}>
        <Icon size={28} />
      </div>
      <h4 className="text-3xl font-black text-[#1A3A6E] mb-2">{value}</h4>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-4">{label}</p>
    </div>
  );
}