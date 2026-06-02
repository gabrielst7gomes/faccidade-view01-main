import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MetricCard, MetricCardSkeleton } from '@/components/edu/MetricCard';
import { AlertCard } from '@/components/edu/AlertCard';
import { TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Users, School, UserCheck, TrendingUp, AlertTriangle, BookOpen,
  GraduationCap, ClipboardCheck, WifiOff, Activity, Award, Clock,
  RefreshCw, ChevronRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/edu/coordenador/')({
  component: CoordenadorDashboard,
});

const COLORS = ['#1A3A6E', '#F26522', '#22c55e', '#7C3AED', '#D97706', '#0ea5e9', '#ec4899'];

/* ─────────────────── KPIs principais ─────────────────── */
function useKPIs() {
  return useQuery({
    queryKey: ['coord-kpis'],
    queryFn: async () => {
      const [alunos, professores, turmas, cursos, presencas, materiais, entregas] =
        await Promise.all([
          supabase.from('perfis').select('id', { count: 'exact' }).eq('perfil', 'aluno'),
          supabase.from('perfis').select('id', { count: 'exact' }).eq('perfil', 'professor'),
          supabase.from('edu_turmas').select('id', { count: 'exact' }).eq('ativo', true),
          supabase.from('edu_cursos').select('id', { count: 'exact' }).eq('ativo', true),
          supabase.from('edu_presencas').select('presente'),
          supabase.from('edu_materiais_ead').select('id', { count: 'exact' }).eq('publicado', true),
          supabase.from('edu_entregas').select('status'),
        ]);

      const presTotal = presencas.data?.length ?? 0;
      const presPresentes = presencas.data?.filter(p => p.presente).length ?? 0;
      const freqMedia = presTotal > 0 ? Math.round((presPresentes / presTotal) * 100) : 0;

      const entregasTotal = entregas.data?.length ?? 0;
      const entregasOk = entregas.data?.filter(e => e.status !== 'pendente').length ?? 0;
      const taxaEntrega = entregasTotal > 0 ? Math.round((entregasOk / entregasTotal) * 100) : 0;

      return {
        alunos: alunos.count ?? 0,
        professores: professores.count ?? 0,
        turmas: turmas.count ?? 0,
        cursos: cursos.count ?? 0,
        freqMedia,
        materiais: materiais.count ?? 0,
        taxaEntrega,
      };
    },
  });
}

/* ─────────────────── Alunos por curso ─────────────────── */
function useAlunosPorCurso() {
  return useQuery({
    queryKey: ['coord-alunos-por-curso'],
    queryFn: async () => {
      const { data: cursos } = await supabase.from('edu_cursos').select('id, nome').eq('ativo', true);
      if (!cursos?.length) return [];
      const result = await Promise.all(cursos.map(async c => {
        const { data: disciplinas } = await supabase.from('edu_disciplinas').select('id').eq('curso_id', c.id);
        const discIds = disciplinas?.map(d => d.id) ?? [];
        let count = 0;
        if (discIds.length) {
          const { data: turmas } = await supabase.from('edu_turmas').select('id').in('disciplina_id', discIds).eq('ativo', true);
          const turmaIds = turmas?.map(t => t.id) ?? [];
          if (turmaIds.length) {
            const { count: c2 } = await supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).in('turma_id', turmaIds);
            count = c2 ?? 0;
          }
        }
        return { nome: c.nome.length > 18 ? c.nome.slice(0, 18) + '…' : c.nome, alunos: count };
      }));
      return result.sort((a, b) => b.alunos - a.alunos);
    },
  });
}

/* ─────────────────── Alunos por turma ─────────────────── */
function useAlunosPorTurma() {
  return useQuery({
    queryKey: ['coord-alunos-por-turma'],
    queryFn: async () => {
      const { data: turmas } = await supabase
        .from('edu_turmas')
        .select('id, nome, edu_disciplinas(nome)')
        .eq('ativo', true)
        .order('nome');
      if (!turmas?.length) return [];
      const result = await Promise.all(turmas.map(async t => {
        const { count } = await supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).eq('turma_id', t.id);
        return {
          turma: t.nome,
          disciplina: (t.edu_disciplinas as any)?.nome ?? '',
          alunos: count ?? 0,
        };
      }));
      return result.sort((a, b) => b.alunos - a.alunos).slice(0, 10);
    },
  });
}

/* ─────────────────── Frequência por turma ─────────────────── */
function useFreqPorTurma() {
  return useQuery({
    queryKey: ['coord-freq-turma'],
    queryFn: async () => {
      const { data: turmas } = await supabase.from('edu_turmas').select('id, nome').eq('ativo', true);
      if (!turmas?.length) return [];
      const result = await Promise.all(turmas.map(async t => {
        const { data: aulas } = await supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true);
        const ids = aulas?.map(a => a.id) ?? [];
        if (!ids.length) return { nome: t.nome, freq: 0, cor: '#ef4444' };
        const { data: p } = await supabase.from('edu_presencas').select('presente').in('aula_id', ids);
        const total = p?.length ?? 0;
        const presentes = p?.filter(x => x.presente).length ?? 0;
        const freq = total > 0 ? Math.round((presentes / total) * 100) : 0;
        return { nome: t.nome.length > 16 ? t.nome.slice(0, 16) + '…' : t.nome, freq, cor: freq >= 75 ? '#22c55e' : freq >= 50 ? '#f59e0b' : '#ef4444' };
      }));
      return result.sort((a, b) => b.freq - a.freq);
    },
  });
}

/* ─────────────────── Frequência dos professores ─────────────────── */
function useFreqProfessores() {
  return useQuery({
    queryKey: ['coord-freq-profs'],
    queryFn: async () => {
      const { data: profs } = await supabase.from('perfis').select('id, nome').eq('perfil', 'professor');
      if (!profs?.length) return [];
      const result = await Promise.all(profs.map(async p => {
        const { data: turmas } = await supabase.from('edu_turmas').select('id').eq('professor_id', p.id).eq('ativo', true);
        const turmaIds = turmas?.map(t => t.id) ?? [];
        let aulasRealizadas = 0, totalAulas = 0;
        if (turmaIds.length) {
          const { count: total } = await supabase.from('edu_aulas').select('*', { count: 'exact' }).in('turma_id', turmaIds);
          const { count: realizadas } = await supabase.from('edu_aulas').select('*', { count: 'exact' }).in('turma_id', turmaIds).eq('realizada', true);
          totalAulas = total ?? 0;
          aulasRealizadas = realizadas ?? 0;
        }
        const freq = totalAulas > 0 ? Math.round((aulasRealizadas / totalAulas) * 100) : 0;
        return {
          nome: p.nome.split(' ').slice(0, 2).join(' '),
          aulas: aulasRealizadas,
          turmas: turmaIds.length,
          freq,
        };
      }));
      return result.filter(p => p.turmas > 0).sort((a, b) => b.aulas - a.aulas);
    },
  });
}

/* ─────────────────── Alunos em risco de reprovação ─────────────────── */
function useAlunosRisco() {
  return useQuery({
    queryKey: ['coord-alunos-risco'],
    queryFn: async () => {
      const { data: turmas } = await supabase.from('edu_turmas').select('id, nome, edu_disciplinas(nome)').eq('ativo', true);
      if (!turmas?.length) return [];
      const riscos: any[] = [];
      for (const t of turmas) {
        const { data: aulas } = await supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true);
        const ids = aulas?.map(a => a.id) ?? [];
        if (!ids.length) continue;
        const { data: alunos } = await supabase.from('edu_turma_alunos').select('aluno_id, perfis(nome)').eq('turma_id', t.id);
        for (const a of alunos ?? []) {
          const { data: p } = await supabase.from('edu_presencas').select('presente').in('aula_id', ids).eq('aluno_id', a.aluno_id);
          const total = p?.length ?? 0;
          const faltas = p?.filter(x => !x.presente).length ?? 0;
          const pct = total > 0 ? Math.round((faltas / total) * 100) : 0;
          if (pct >= 25) {
            riscos.push({ aluno: (a.perfis as any)?.nome ?? 'Aluno', turma: t.nome, disciplina: (t.edu_disciplinas as any)?.nome ?? '', pct });
          }
        }
      }
      return riscos.sort((a, b) => b.pct - a.pct).slice(0, 8);
    },
  });
}

/* ─────────────────── Distribuição por turno ─────────────────── */
function useDistTurno() {
  return useQuery({
    queryKey: ['coord-dist-turno'],
    queryFn: async () => {
      const { data } = await supabase.from('edu_cursos').select('turno').eq('ativo', true);
      const map: Record<string, number> = { matutino: 0, noturno: 0, integral: 0 };
      data?.forEach(c => { if (c.turno) map[c.turno] = (map[c.turno] ?? 0) + 1; });
      return [
        { name: 'Matutino', value: map.matutino, color: '#0ea5e9' },
        { name: 'Noturno', value: map.noturno, color: '#7C3AED' },
        { name: 'Integral', value: map.integral, color: '#22c55e' },
      ].filter(x => x.value > 0);
    },
  });
}

/* ─────────────────── Atividades com baixa entrega ─────────────────── */
function useAtividadesBaixaEntrega() {
  return useQuery({
    queryKey: ['coord-atv-baixa'],
    queryFn: async () => {
      const { data: atvs } = await supabase
        .from('edu_atividades')
        .select('id, titulo, tipo, turma_id, data_entrega, edu_turmas(nome)')
        .lt('data_entrega', new Date().toISOString())
        .order('data_entrega', { ascending: false })
        .limit(10);
      if (!atvs?.length) return [];
      const result = await Promise.all(atvs.map(async a => {
        const [{ count: total }, { count: entregues }] = await Promise.all([
          supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).eq('turma_id', a.turma_id),
          supabase.from('edu_entregas').select('*', { count: 'exact' }).eq('atividade_id', a.id).neq('status', 'pendente'),
        ]);
        const pct = (total ?? 0) > 0 ? Math.round(((entregues ?? 0) / (total ?? 1)) * 100) : 0;
        return { titulo: a.titulo, tipo: a.tipo, turma: (a.edu_turmas as any)?.nome ?? '', pct, total: total ?? 0, entregues: entregues ?? 0 };
      }));
      return result.sort((a, b) => a.pct - b.pct).slice(0, 6);
    },
  });
}

/* ─────────────────── Evolução de matrículas ─────────────────── */
function useEvolucaoMatriculas() {
  return useQuery({
    queryKey: ['coord-matriculas-evolucao'],
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turma_alunos')
        .select('data_matricula')
        .order('data_matricula');
      if (!data?.length) return [];
      const map: Record<string, number> = {};
      data.forEach(m => {
        const mes = format(new Date(m.data_matricula), 'MMM/yy', { locale: ptBR });
        map[mes] = (map[mes] ?? 0) + 1;
      });
      let acumulado = 0;
      return Object.entries(map).map(([mes, qtd]) => ({ mes, novas: qtd, total: (acumulado += qtd) }));
    },
  });
}

/* ════════════════════ DASHBOARD PRINCIPAL ════════════════════ */
function CoordenadorDashboard() {
  const { data: kpis, isLoading: loadingKpis, refetch } = useKPIs();
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'frequencia' | 'atividades' | 'risco'>('visao-geral');
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A3A6E]">Dashboard Acadêmico</h1>
          <p className="text-sm text-slate-400 mt-0.5">{now} · visão geral do sistema FacCidade Edu</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 border border-slate-200 px-3 py-2 rounded-full hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {loadingKpis ? Array.from({ length: 7 }).map((_, i) => <MetricCardSkeleton key={i} />) : (
          <>
            <MetricCard label="Alunos" value={kpis?.alunos ?? 0} icon={<Users size={18} />} color="#1A3A6E" sub="matriculados" />
            <MetricCard label="Professores" value={kpis?.professores ?? 0} icon={<UserCheck size={18} />} color="#7C3AED" sub="ativos" />
            <MetricCard label="Turmas" value={kpis?.turmas ?? 0} icon={<School size={18} />} color="#0ea5e9" sub="em andamento" />
            <MetricCard label="Cursos" value={kpis?.cursos ?? 0} icon={<GraduationCap size={18} />} color="#059669" sub="oferecidos" />
            <MetricCard
              label="Frequência"
              value={`${kpis?.freqMedia ?? 0}%`}
              icon={<TrendingUp size={18} />}
              color={(kpis?.freqMedia ?? 0) >= 75 ? '#22c55e' : (kpis?.freqMedia ?? 0) >= 50 ? '#f59e0b' : '#ef4444'}
              sub="média geral"
            />
            <MetricCard label="Materiais EAD" value={kpis?.materiais ?? 0} icon={<BookOpen size={18} />} color="#D97706" sub="publicados" />
            <MetricCard
              label="Entregas"
              value={`${kpis?.taxaEntrega ?? 0}%`}
              icon={<ClipboardCheck size={18} />}
              color={(kpis?.taxaEntrega ?? 0) >= 70 ? '#22c55e' : '#ef4444'}
              sub="taxa de entrega"
            />
          </>
        )}
      </div>

      {/* ── Tabs de navegação ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'visao-geral', label: 'Visão Geral', icon: <Activity size={14} /> },
          { id: 'frequencia', label: 'Frequência', icon: <TrendingUp size={14} /> },
          { id: 'atividades', label: 'Atividades', icon: <ClipboardCheck size={14} /> },
          { id: 'risco', label: 'Alunos em Risco', icon: <AlertTriangle size={14} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.id ? 'bg-white text-[#1A3A6E] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo por aba ── */}
      {activeTab === 'visao-geral' && <TabVisaoGeral />}
      {activeTab === 'frequencia' && <TabFrequencia />}
      {activeTab === 'atividades' && <TabAtividades />}
      {activeTab === 'risco' && <TabRisco />}
    </div>
  );
}

/* ─────────────────── ABA: Visão Geral ─────────────────── */
function TabVisaoGeral() {
  const { data: porCurso, isLoading: l1 } = useAlunosPorCurso();
  const { data: porTurma, isLoading: l2 } = useAlunosPorTurma();
  const { data: turno } = useDistTurno();
  const { data: matriculas } = useEvolucaoMatriculas();

  return (
    <div className="space-y-6">
      {/* Row 1: Alunos por curso + Distribuição por turno */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <SectionTitle icon={<GraduationCap size={15} />} title="Alunos por Curso" />
          {l1 ? <div className="h-56 animate-pulse bg-slate-100 rounded-lg" /> : !porCurso?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porCurso} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} alunos`]} />
                <Bar dataKey="alunos" radius={[6, 6, 0, 0]}>
                  {porCurso?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <SectionTitle icon={<Clock size={15} />} title="Distribuição por Turno" />
          {!turno?.length ? <Empty /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={turno} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {turno.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} curso${v !== 1 ? 's' : ''}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-1">
                {turno.map(t => (
                  <div key={t.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-slate-600 font-medium">{t.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{t.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Alunos por turma + Evolução de matrículas */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <SectionTitle icon={<School size={15} />} title="Alunos por Turma (Top 10)" />
          {l2 ? <div className="h-64 animate-pulse bg-slate-100 rounded-lg" /> : !porTurma?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={porTurma} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="turma" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v: any) => [`${v} alunos`]} />
                <Bar dataKey="alunos" fill="#1A3A6E" radius={[0, 6, 6, 0]}>
                  {porTurma?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <SectionTitle icon={<TrendingUp size={15} />} title="Evolução de Matrículas" />
          {!matriculas?.length ? <Empty msg="Nenhuma matrícula registrada ainda." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={matriculas} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="novas" stroke="#F26522" strokeWidth={2} name="Novas" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="total" stroke="#1A3A6E" strokeWidth={2} name="Acumulado" dot={{ r: 3 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 3: Tabela de turmas */}
      <TabelaTurmas />
    </div>
  );
}

/* ─────────────────── ABA: Frequência ─────────────────── */
function TabFrequencia() {
  const { data: freqTurma, isLoading: l1 } = useFreqPorTurma();
  const { data: freqProfs, isLoading: l2 } = useFreqProfessores();

  const boas = freqTurma?.filter(t => t.freq >= 75).length ?? 0;
  const atencao = freqTurma?.filter(t => t.freq >= 50 && t.freq < 75).length ?? 0;
  const criticas = freqTurma?.filter(t => t.freq < 50).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Resumo status */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Turmas regulares', value: boas, color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle2 size={18} className="text-green-500" /> },
          { label: 'Turmas em atenção', value: atencao, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle size={18} className="text-amber-500" /> },
          { label: 'Turmas críticas', value: criticas, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={18} className="text-red-500" /> },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 flex items-center gap-4`}>
            {s.icon}
            <div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico frequência por turma */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <SectionTitle icon={<TrendingUp size={15} />} title="Frequência por Turma" sub="Verde ≥ 75% | Amarelo 50-74% | Vermelho < 50%" />
        {l1 ? <div className="h-72 animate-pulse bg-slate-100 rounded-lg" /> : !freqTurma?.length ? <Empty /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={freqTurma} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Frequência']} />
              <Bar dataKey="freq" radius={[6, 6, 0, 0]}>
                {freqTurma?.map((t, i) => <Cell key={i} fill={t.cor} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Frequência dos professores */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <SectionTitle icon={<UserCheck size={15} />} title="Desempenho dos Professores" sub="Aulas realizadas e turmas sob responsabilidade" />
        {l2 ? <TableSkeleton rows={4} cols={4} /> : !freqProfs?.length ? <Empty msg="Nenhum professor com turmas ativas." /> : (
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="border-b border-slate-100">
                {['Professor', 'Turmas', 'Aulas realizadas', 'Frequência de aulas', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {freqProfs?.map((p, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1A3A6E] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{p.nome}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-bold text-[#1A3A6E]">{p.turmas}</td>
                  <td className="px-3 py-3 text-slate-600">{p.aulas}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.freq}%`, backgroundColor: p.freq >= 75 ? '#22c55e' : p.freq >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{p.freq}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.freq >= 75 ? 'bg-green-100 text-green-700' : p.freq >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {p.freq >= 75 ? 'Regular' : p.freq >= 50 ? 'Atenção' : 'Crítico'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── ABA: Atividades ─────────────────── */
function TabAtividades() {
  const { data, isLoading } = useAtividadesBaixaEntrega();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <SectionTitle icon={<ClipboardCheck size={15} />} title="Taxa de Entrega por Atividade" sub="Atividades com prazo encerrado, ordenadas por menor taxa de entrega" />
        {isLoading ? <TableSkeleton rows={5} cols={5} /> : !data?.length ? (
          <Empty msg="Nenhuma atividade com prazo encerrado." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="titulo" tick={{ fontSize: 10 }} tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Entregues']} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {data?.map((d, i) => <Cell key={i} fill={d.pct >= 70 ? '#22c55e' : d.pct >= 40 ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Atividade', 'Tipo', 'Turma', 'Entregas', 'Taxa', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.map((d, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-700 max-w-[160px] truncate">{d.titulo}</td>
                    <td className="px-3 py-2.5 text-slate-500 capitalize">{d.tipo}</td>
                    <td className="px-3 py-2.5 text-slate-500">{d.turma}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.entregues}/{d.total}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.pct >= 70 ? '#22c55e' : d.pct >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs font-bold">{d.pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.pct >= 70 ? 'bg-green-100 text-green-700' : d.pct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {d.pct >= 70 ? 'Boa' : d.pct >= 40 ? 'Regular' : 'Crítica'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── ABA: Alunos em Risco ─────────────────── */
function TabRisco() {
  const { data, isLoading } = useAlunosRisco();

  return (
    <div className="space-y-6">
      {/* Alerta geral */}
      {(data?.length ?? 0) > 0 && (
        <AlertCard
          variant="danger"
          title={`${data?.length} aluno${(data?.length ?? 0) !== 1 ? 's' : ''} com risco de reprovação por falta`}
          description="Alunos com 25% ou mais de ausências nas aulas realizadas. Recomenda-se contato imediato."
        />
      )}

      {isLoading ? <TableSkeleton rows={6} cols={4} /> : !data?.length ? (
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-bold text-green-700">Nenhum aluno em risco no momento</p>
          <p className="text-sm text-slate-400 mt-1">Todos os alunos estão com frequência adequada.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <SectionTitle icon={<AlertTriangle size={15} />} title="Alunos com ≥ 25% de Faltas" sub="Ordenados pelo percentual de faltas (maior → menor)" />
          <div className="space-y-2 mt-3">
            {data?.map((r, i) => (
              <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${r.pct >= 50 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${r.pct >= 50 ? 'bg-red-500' : 'bg-amber-500'}`}>
                  {r.pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{r.aluno}</p>
                  <p className="text-xs text-slate-500 truncate">{r.disciplina || r.turma}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="h-2 w-24 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(r.pct, 100)}%`, backgroundColor: r.pct >= 50 ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.pct}% de faltas</p>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${r.pct >= 50 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.pct >= 50 ? 'CRÍTICO' : 'ATENÇÃO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Tabela resumo de turmas ─────────────────── */
function TabelaTurmas() {
  const { data: turmas, isLoading } = useQuery({
    queryKey: ['coord-tabela-turmas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_turmas')
        .select('id, nome, sala, semestre, edu_disciplinas(nome, carga_horaria), perfis(nome)')
        .eq('ativo', true)
        .order('nome');
      if (!data?.length) return [];
      const result = await Promise.all(data.map(async t => {
        const [{ count: alunos }, { data: aulas }] = await Promise.all([
          supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).eq('turma_id', t.id),
          supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true),
        ]);
        const aulasIds = aulas?.map(a => a.id) ?? [];
        let freq = 0;
        if (aulasIds.length) {
          const { data: p } = await supabase.from('edu_presencas').select('presente').in('aula_id', aulasIds);
          const total = p?.length ?? 0;
          const presentes = p?.filter(x => x.presente).length ?? 0;
          freq = total > 0 ? Math.round((presentes / total) * 100) : 0;
        }
        return {
          nome: t.nome,
          disciplina: (t.edu_disciplinas as any)?.nome ?? '—',
          professor: (t.perfis as any)?.nome?.split(' ').slice(0, 2).join(' ') ?? '—',
          sala: t.sala ?? '—',
          semestre: t.semestre ?? '—',
          alunos: alunos ?? 0,
          aulas: aulasIds.length,
          freq,
        };
      }));
      return result;
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm overflow-hidden">
      <SectionTitle icon={<School size={15} />} title="Resumo de Todas as Turmas" />
      {isLoading ? <TableSkeleton rows={4} cols={6} /> : !turmas?.length ? <Empty msg="Nenhuma turma cadastrada." /> : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Turma', 'Disciplina', 'Professor', 'Sala', 'Alunos', 'Aulas', 'Frequência'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-400 first:pl-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {turmas?.map((t, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="pl-4 pr-3 py-3 font-bold text-[#1A3A6E]">{t.nome}</td>
                  <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">{t.disciplina}</td>
                  <td className="px-3 py-3 text-slate-600">{t.professor}</td>
                  <td className="px-3 py-3 text-slate-500">{t.sala}</td>
                  <td className="px-3 py-3">
                    <span className="font-black text-[#1A3A6E] text-base">{t.alunos}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{t.aulas}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${t.freq}%`, backgroundColor: t.freq >= 75 ? '#22c55e' : t.freq >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className={`text-xs font-bold ${t.freq >= 75 ? 'text-green-600' : t.freq >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {t.aulas > 0 ? `${t.freq}%` : '—'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Helpers de UI ─────────────────── */
function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2 mb-4">
      <span className="text-[#1A3A6E] mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-black text-[#1A3A6E] uppercase tracking-wider">{title}</h3>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Empty({ msg = 'Nenhum dado disponível.' }: { msg?: string }) {
  return <p className="text-sm text-slate-400 text-center py-8">{msg}</p>;
}
