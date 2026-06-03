import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save,
  Info,
  Type,
  ExternalLink,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/adminincomy/hero')({
  component: AdminHero,
});

function AdminHero() {
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHeadline, setNewHeadline] = useState('');
  
  // Configs
  const [typewriterSpeed, setTypewriterSpeed] = useState('6000');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCtaText, setHeroCtaText] = useState('QUERO MUDAR MINHA VIDA AGORA');
  const [exitPopupTitle, setExitPopupTitle] = useState('');
  const [exitPopupText, setExitPopupText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [headlinesRes, configRes] = await Promise.all([
        supabase.from('hero_headlines').select('*').order('ordem', { ascending: true }),
        supabase.from('config').select('*')
      ]);

      if (headlinesRes.data) setHeadlines(headlinesRes.data);
      
      if (configRes.data) {
        configRes.data.forEach(item => {
          if (item.chave === 'typewriter_speed' && item.valor) setTypewriterSpeed(item.valor);
          if (item.chave === 'hero_subtitle' && item.valor) setHeroSubtitle(item.valor);
          if (item.chave === 'hero_cta_text' && item.valor) setHeroCtaText(item.valor);
          if (item.chave === 'exit_popup_title' && item.valor) setExitPopupTitle(item.valor);
          if (item.chave === 'exit_popup_text' && item.valor) setExitPopupText(item.valor);
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  const handleAddHeadline = async () => {
    if (!newHeadline.trim()) return;
    try {
      const { data, error } = await supabase.from('hero_headlines').insert({
        texto: newHeadline,
        ordem: headlines.length,
        ativo: true
      }).select().single();

      if (error) throw error;
      setHeadlines([...headlines, data]);
      setNewHeadline('');
      toast.success('Frase adicionada!');
    } catch (error) {
      toast.error('Erro ao adicionar frase');
    }
  };

  const handleDeleteHeadline = async (id: string) => {
    try {
      const { error } = await supabase.from('hero_headlines').delete().eq('id', id);
      if (error) throw error;
      setHeadlines(headlines.filter(h => h.id !== id));
      toast.success('Frase removida');
    } catch (error) {
      toast.error('Erro ao remover frase');
    }
  };

  const handleToggleHeadline = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('hero_headlines').update({ ativo: !current }).eq('id', id);
      if (error) throw error;
      setHeadlines(headlines.map(h => h.id === id ? { ...h, ativo: !current } : h));
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const saveConfig = async (chave: string, valor: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('config').upsert({ chave, valor });
      if (error) throw error;
      toast.success('Configuração salva!');
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-slate-400">Carregando...</div>;

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Headlines Section */}
      <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1A3A6E]/5 flex items-center justify-center text-[#1A3A6E]">
            <Type size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A3A6E]">Frases do Hero</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Typewriter Headlines</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {headlines.map((headline, index) => (
            <div key={headline.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
              <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${headline.ativo ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                  {headline.texto}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggleHeadline(headline.id, headline.ativo)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${headline.ativo ? 'bg-[#1A3A6E]' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${headline.ativo ? 'left-7' : 'left-1'}`} />
                </button>
                <button 
                  onClick={() => handleDeleteHeadline(headline.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Nova frase de impacto..."
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
            value={newHeadline}
            onChange={(e) => setNewHeadline(e.target.value)}
          />
          <button
            onClick={handleAddHeadline}
            className="bg-[#1A3A6E] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Adicionar
          </button>
        </div>
      </section>

      {/* Subtitle & CTA Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <h4 className="font-bold text-[#1A3A6E] mb-6 flex items-center gap-2">
            <Info size={18} className="text-[#F26522]" />
            Subtítulo do Hero
          </h4>
          <textarea
            className="w-full h-32 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-medium leading-relaxed mb-6"
            placeholder="Texto complementar que aparece abaixo das frases..."
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
          />
          <button
            onClick={() => saveConfig('hero_subtitle', heroSubtitle)}
            disabled={saving}
            className="w-full bg-[#1A3A6E] text-white py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Subtítulo'}
          </button>
        </section>

        <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <h4 className="font-bold text-[#1A3A6E] mb-6 flex items-center gap-2">
            <ExternalLink size={18} className="text-[#F26522]" />
            Botão CTA (Chamada)
          </h4>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Texto do Botão</label>
              <input
                type="text"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
                value={heroCtaText}
                onChange={(e) => setHeroCtaText(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Velocidade do Typewriter (ms)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="500"
                  className="flex-1 accent-[#1A3A6E]"
                  value={typewriterSpeed}
                  onChange={(e) => setTypewriterSpeed(e.target.value)}
                />
                <span className="font-black text-[#1A3A6E] w-16 text-center">{(parseInt(typewriterSpeed) / 1000).toFixed(1)}s</span>
              </div>
            </div>
            <button
              onClick={async () => {
                setSaving(true);
                await Promise.all([
                  supabase.from('config').upsert({ chave: 'hero_cta_text', valor: heroCtaText }),
                  supabase.from('config').upsert({ chave: 'typewriter_speed', valor: typewriterSpeed })
                ]);
                setSaving(false);
                toast.success('Configurações salvas!');
              }}
              disabled={saving}
              className="w-full bg-[#1A3A6E] text-white py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </section>
      </div>

      {/* Exit Intent Section */}
      <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#F26522]/5 flex items-center justify-center text-[#F26522]">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1A3A6E]">Popup de Saída (Exit Intent)</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Retenção de Visitantes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Título do Popup</label>
            <input
              type="text"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-bold"
              value={exitPopupTitle}
              onChange={(e) => setExitPopupTitle(e.target.value)}
              placeholder="Ex: Não vá embora ainda!"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Texto do Popup</label>
            <textarea
              className="w-full h-24 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-[#1A3A6E] transition-all text-sm font-medium leading-relaxed"
              value={exitPopupText}
              onChange={(e) => setExitPopupText(e.target.value)}
              placeholder="Ex: Você sabia que temos bolsas de 50%..."
            />
          </div>
        </div>

        <button
          onClick={async () => {
            setSaving(true);
            await Promise.all([
              supabase.from('config').upsert({ chave: 'exit_popup_title', valor: exitPopupTitle }),
              supabase.from('config').upsert({ chave: 'exit_popup_text', valor: exitPopupText })
            ]);
            setSaving(false);
            toast.success('Popup configurado!');
          }}
          disabled={saving}
          className="mt-8 w-full md:w-auto bg-[#1A3A6E] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#F26522] transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Configurações do Popup'}
        </button>
      </section>
    </div>
  );
}