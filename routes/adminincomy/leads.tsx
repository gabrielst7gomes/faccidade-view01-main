import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Video, 
  Save,
  Info,
  ExternalLink,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/adminincomy/leads')({
  component: AdminLeads,
});

function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('Todos');
  const [courses, setCourses] = useState<string[]>([]);
  
  // Configs
  const [destWpp, setDestWpp] = useState('');
  const [destEmail, setDestEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [leadsRes, configRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('config').select('*')
      ]);

      if (leadsRes.data) {
        setLeads(leadsRes.data);
        const uniqueCourses = Array.from(new Set(leadsRes.data.map(l => l.curso_interesse)));
        setCourses(uniqueCourses as string[]);
      }
      
      if (configRes.data) {
        configRes.data.forEach(item => {
          if (item.chave === 'lead_whatsapp_destino' && item.valor) setDestWpp(item.valor);
          if (item.chave === 'lead_email_destino' && item.valor) setDestEmail(item.valor);
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads(leads.filter(l => l.id !== id));
      toast.success('Lead removido');
    } catch (error) {
      toast.error('Erro ao remover lead');
    }
  };

  const exportCSV = () => {
    const filtered = leads.filter(l => {
      const matchesSearch = l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           l.whatsapp?.includes(searchTerm);
      const matchesCourse = filterCourse === 'Todos' || l.curso_interesse === filterCourse;
      return matchesSearch && matchesCourse;
    });

    const headers = ['Nome', 'WhatsApp', 'Email', 'Curso', 'Turno', 'Data'];
    const rows = filtered.map(l => [
      l.nome,
      l.whatsapp,
      l.email,
      l.curso_interesse,
      l.turno,
      new Date(l.created_at).toLocaleString('pt-BR')
    ]);

    const content = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_faccidade_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.whatsapp?.includes(searchTerm);
    const matchesCourse = filterCourse === 'Todos' || l.curso_interesse === filterCourse;
    return matchesSearch && matchesCourse;
  });

  if (loading) return <div className="p-10 text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-6 items-end justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 w-full">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Buscar Lead</label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                placeholder="Nome ou WhatsApp..."
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Filtrar por Curso</label>
            <select
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold appearance-none bg-white"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="Todos">Todos os Cursos</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="bg-[#1A3A6E] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center gap-2 h-14"
        >
          Exportar CSV
        </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Lead</th>
                <th className="text-left py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Interesse</th>
                <th className="text-left py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="text-left py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Data</th>
                <th className="text-center py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-6 px-8">
                    <p className="font-bold text-slate-700">{lead.nome}</p>
                    <p className="text-xs text-slate-400 font-medium">{lead.email}</p>
                  </td>
                  <td className="py-6 px-8">
                    <p className="text-sm font-bold text-[#1A3A6E]">{lead.curso_interesse}</p>
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{lead.turno}</p>
                  </td>
                  <td className="py-6 px-8 text-sm text-slate-600 font-bold">
                    {lead.whatsapp}
                  </td>
                  <td className="py-6 px-8 text-sm text-slate-400 font-medium">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center justify-center gap-3">
                      <a 
                        href={`https://wa.me/55${lead.whatsapp?.replace(/\D/g, '')}`} 
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 text-green-500 hover:bg-green-50 rounded-xl transition-all"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 italic">Nenhum lead encontrado com estes filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Destination Config */}
      <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 max-w-2xl">
        <h3 className="text-xl font-bold text-[#1A3A6E] mb-8 flex items-center gap-3">
          <Info size={22} className="text-[#F26522]" />
          Notificações de Novos Leads
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">WhatsApp Destino</label>
              <input
                type="text"
                placeholder="(62) 99999-9999"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
                value={destWpp}
                onChange={(e) => setDestWpp(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">E-mail Destino</label>
              <input
                type="email"
                placeholder="comercial@faccidade.edu.br"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
                value={destEmail}
                onChange={(e) => setDestEmail(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              setSaving(true);
              await Promise.all([
                supabase.from('config').upsert({ chave: 'lead_whatsapp_destino', valor: destWpp }),
                supabase.from('config').upsert({ chave: 'lead_email_destino', valor: destEmail })
              ]);
              setSaving(false);
              toast.success('Destinos atualizados!');
            }}
            disabled={saving}
            className="bg-[#1A3A6E] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Destinos'}
          </button>
        </div>
      </section>
    </div>
  );
}