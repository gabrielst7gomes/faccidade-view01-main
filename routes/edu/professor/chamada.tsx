import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Save, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/edu/professor/chamada')({
  component: ChamadaPage,
});

function ChamadaPage() {
  const { perfil } = useEduAuth();
  const qc = useQueryClient();
  const [turmaId, setTurmaId] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [conteudo, setConteudo] = useState('');
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  const { data: turmas } = useQuery({
    queryKey: ['prof-turmas', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turmas')
        .select('id, nome, edu_disciplinas(nome)')
        .eq('professor_id', perfil!.id)
        .eq('ativo', true)
        .order('nome');
      return data ?? [];
    },
  });

  const { data: alunos, isLoading: loadingAlunos } = useQuery({
    queryKey: ['prof-chamada-alunos', turmaId],
    enabled: !!turmaId,
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turma_alunos')
        .select('aluno_id, perfis(id, nome, matricula)')
        .eq('turma_id', turmaId)
        .order('perfis(nome)');
      return data ?? [];
    },
  });

  const { data: aulaExistente } = useQuery({
    queryKey: ['prof-aula', turmaId, data],
    enabled: !!turmaId && !!data,
    queryFn: async () => {
      const { data: aula } = await supabase
        .from('edu_aulas')
        .select('*, edu_presencas(*)')
        .eq('turma_id', turmaId)
        .eq('data', data)
        .maybeSingle();
      if (aula) {
        const map: Record<string, boolean> = {};
        (aula.edu_presencas as any[]).forEach((p) => { map[p.aluno_id] = p.presente; });
        setPresencas(map);
        setConteudo(aula.conteudo ?? '');
        setSaved(aula.realizada);
      }
      return aula;
    },
  });

  const togglePresenca = useCallback((alunoId: string) => {
    setPresencas((prev) => ({ ...prev, [alunoId]: !prev[alunoId] }));
    setSaved(false);
  }, []);

  const marcarTodos = (presente: boolean) => {
    const map: Record<string, boolean> = {};
    alunos?.forEach((a: any) => { map[a.aluno_id] = presente; });
    setPresencas(map);
    setSaved(false);
  };

  const salvarMutation = useMutation({
    mutationFn: async () => {
      let aulaId = aulaExistente?.id;
      if (!aulaId) {
        const { data: novaAula, error } = await supabase
          .from('edu_aulas')
          .insert({ turma_id: turmaId, data, conteudo, realizada: true, created_by: perfil!.id })
          .select('id')
          .single();
        if (error) throw error;
        aulaId = novaAula.id;
      } else {
        await supabase.from('edu_aulas').update({ conteudo, realizada: true }).eq('id', aulaId);
      }

      const upserts = (alunos ?? []).map((a: any) => ({
        aula_id: aulaId,
        aluno_id: a.aluno_id,
        presente: presencas[a.aluno_id] ?? false,
      }));

      const { error } = await supabase.from('edu_presencas').upsert(upserts, { onConflict: 'aula_id,aluno_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Chamada salva com sucesso!');
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['prof-aula'] });
    },
    onError: () => toast.error('Erro ao salvar chamada.'),
  });

  const enviarAlertaMutation = useMutation({
    mutationFn: async (alunoId: string) => {
      const { error } = await supabase.from('edu_alertas_sistema').insert({
        aluno_id: alunoId,
        tipo: 'falta_excesso',
        mensagem: 'Você está com excesso de faltas. Procure a coordenação.',
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Alerta enviado ao aluno.'),
    onError: () => toast.error('Erro ao enviar alerta.'),
  });

  const presentes = Object.values(presencas).filter(Boolean).length;
  const total = alunos?.length ?? 0;
  const ausentes = total - presentes;

  const getPercentualFaltas = (_alunoId: string) => 0;

  return (
    <div>
      <EduPageHeader title="Chamada Digital" subtitle="Registre a presença dos alunos em cada aula" />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Turma</label>
            <select
              value={turmaId}
              onChange={(e) => { setTurmaId(e.target.value); setPresencas({}); setSaved(false); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white"
            >
              <option value="">Selecione uma turma...</option>
              {turmas?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.nome} — {t.edu_disciplinas?.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => { setData(e.target.value); setPresencas({}); setSaved(false); }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conteúdo ministrado</label>
            <input
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Resumo do conteúdo..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E]"
            />
          </div>
        </div>
      </div>

      {!turmaId ? (
        <EduEmpty title="Selecione uma turma" description="Escolha a turma e a data para registrar a chamada." />
      ) : loadingAlunos ? (
        <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}</div>
      ) : !alunos?.length ? (
        <EduEmpty title="Sem alunos na turma" description="Esta turma não possui alunos matriculados." />
      ) : (
        <div>
          {/* Resumo e ações */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <Badge color="green">{presentes} presentes</Badge>
              <Badge color="red">{ausentes} ausentes</Badge>
              <Badge color="gray">{total} total</Badge>
            </div>
            <div className="flex gap-2">
              <button onClick={() => marcarTodos(true)} className="text-xs font-bold text-green-600 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-50">Todos presentes</button>
              <button onClick={() => marcarTodos(false)} className="text-xs font-bold text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-50">Todos ausentes</button>
            </div>
          </div>

          {/* Lista de alunos */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-4">
            {alunos.map((a: any, i: number) => {
              const presente = presencas[a.aluno_id] ?? true;
              return (
                <div
                  key={a.aluno_id}
                  className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 transition-colors ${
                    present ? '' : 'bg-red-50/30'
                  }`}
                >
                  <span className="text-xs text-slate-400 w-5 text-center">{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {a.perfis?.nome?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{a.perfis?.nome}</p>
                    {a.perfis?.matricula && <p className="text-xs text-slate-400">{a.perfis.matricula}</p>}
                  </div>
                  <button
                    onClick={() => enviarAlertaMutation.mutate(a.aluno_id)}
                    className="p-1.5 text-slate-300 hover:text-amber-500 transition-colors"
                    title="Enviar alerta ao aluno"
                  >
                    <Bell size={15} />
                  </button>
                  <button
                    onClick={() => togglePresenca(a.aluno_id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      presente
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {presente ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    {presente ? 'Presente' : 'Ausente'}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => salvarMutation.mutate()}
            disabled={salvarMutation.isPending}
            className="flex items-center gap-2 bg-[#1A3A6E] text-white font-bold px-6 py-3 rounded-full hover:bg-[#0D1B3E] transition-all disabled:opacity-70 shadow-lg"
          >
            <Save size={16} />
            {salvarMutation.isPending ? 'Salvando...' : saved ? 'Chamada salva ✓' : 'Salvar chamada'}
          </button>
        </div>
      )}
    </div>
  );
}
