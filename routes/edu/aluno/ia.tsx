import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader } from '@/components/edu/AlertCard';
import {
  Bot, Send, Loader2, Sparkles, BookOpen, RefreshCw, ChevronDown,
} from 'lucide-react';

export const Route = createFileRoute('/edu/aluno/ia')({
  component: AlunoIAPage,
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const SUGGESTIONS = [
  'Me explique o conteúdo mais importante desta disciplina',
  'Como posso me preparar para a próxima prova?',
  'Qual a diferença entre débito e crédito na contabilidade?',
  'Explique o princípio da dignidade humana no direito',
  'Quais são as principais funções do sistema cardiovascular?',
  'Como funciona a administração por objetivos?',
];

function AlunoIAPage() {
  const { perfil } = useEduAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: turmas } = useQuery({
    queryKey: ['aluno-turmas-ia', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turma_alunos')
        .select('turma_id, edu_turmas(id, nome, edu_disciplinas(nome))')
        .eq('aluno_id', perfil!.id);
      return data ?? [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          alunoId: perfil!.id,
          turmaId: selectedTurma || undefined,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { reply } = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns segundos.',
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      <EduPageHeader
        title="Tutor IA"
        subtitle="Tire dúvidas sobre suas disciplinas com inteligência artificial"
        action={
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 border border-slate-200 px-3 py-2 rounded-full hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={12} /> Novo chat
          </button>
        }
      />

      {/* Seletor de disciplina */}
      {(turmas?.length ?? 0) > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0">Disciplina:</label>
          <div className="relative">
            <select
              value={selectedTurma}
              onChange={e => setSelectedTurma(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:border-[#1A3A6E] bg-white appearance-none font-medium text-slate-600"
            >
              <option value="">Geral (todas as disciplinas)</option>
              {turmas?.map((t: any) => (
                <option key={t.turma_id} value={t.turma_id}>
                  {t.edu_turmas?.edu_disciplinas?.nome ?? t.edu_turmas?.nome}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggest={sendMessage} nome={perfil?.nome?.split(' ')[0] ?? 'Aluno'} />
        ) : (
          <>
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Digite sua dúvida... (Enter para enviar, Shift+Enter para nova linha)"
            rows={1}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#1A3A6E] focus:ring-4 focus:ring-[#1A3A6E]/5 resize-none transition-all bg-white max-h-32 overflow-y-auto"
            style={{ minHeight: '48px' }}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-12 h-12 rounded-2xl bg-[#1A3A6E] text-white flex items-center justify-center hover:bg-[#0D1B3E] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-[#1A3A6E]/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-1.5">
        Powered by Claude (Anthropic) · As respostas podem conter erros — sempre verifique com seu professor
      </p>
    </div>
  );
}

/* ─── Tela de boas-vindas ─── */
function WelcomeScreen({ onSuggest, nome }: { onSuggest: (t: string) => void; nome: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A3A6E] to-[#7C3AED] flex items-center justify-center mb-4 shadow-lg">
        <Sparkles size={28} className="text-white" />
      </div>
      <h3 className="font-black text-[#1A3A6E] text-lg mb-1">Olá, {nome}! 👋</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Sou seu tutor inteligente. Posso explicar conteúdos, tirar dúvidas e ajudar nos estudos. Como posso ajudar?
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {SUGGESTIONS.slice(0, 4).map(s => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 hover:border-[#1A3A6E] hover:text-[#1A3A6E] hover:bg-[#1A3A6E]/5 transition-all font-medium flex items-center gap-2"
          >
            <BookOpen size={12} className="shrink-0 text-slate-400" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Bolha de mensagem ─── */
function MessageBubble({ message: m }: { message: Message }) {
  const isUser = m.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${
        isUser ? 'bg-[#1A3A6E]' : 'bg-gradient-to-br from-[#7C3AED] to-[#1A3A6E]'
      }`}>
        {isUser ? 'EU' : <Bot size={14} />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-[#1A3A6E] text-white rounded-tr-none'
          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
      }`}>
        <MarkdownText text={m.content} isUser={isUser} />
      </div>
    </div>
  );
}

/* ─── Indicador de digitação ─── */
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#1A3A6E] flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <span
            key={d}
            className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Renderização básica de Markdown ─── */
function MarkdownText({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className={`font-bold ${isUser ? 'text-white' : 'text-[#1A3A6E]'}`}>{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <p key={i} className="pl-3">{line}</p>;
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
