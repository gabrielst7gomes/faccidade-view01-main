import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, WifiOff, ClipboardCheck } from 'lucide-react';

export const Route = createFileRoute('/edu/coordenador/relatorios')({
  component: RelatoriosPage,
});

type Tab = 'frequencia' | 'ead' | 'atividades';

function RelatoriosPage() {
  const [tab, setTab] = useState<Tab>('frequencia');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'frequencia', label: 'Frequência', icon: <TrendingUp size={15} /> },
    { id: 'ead', label: 'Engajamento EAD', icon: <WifiOff size={15} /> },
    { id: 'atividades', label: 'Atividades', icon: <ClipboardCheck size={15} /> },
  ];

  return (
    <div>
      <EduPageHeader title="Relatórios" subtitle="Análise de frequência, EAD e atividades" />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.id ? 'bg-white text-[#1A3A6E] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'frequencia' && <RelatorioFrequencia />}
      {tab === 'ead' && <RelatorioEad />}
      {tab === 'atividades' && <RelatorioAtividades />}
    </div>
  );
}

function RelatorioFrequencia() {
  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-frequencia'],
    queryFn: async () => {
      const { data: turmas } = await supabase
        .from('edu_turmas')
        .select('id, nome, edu_disciplinas(nome)')
        .eq('ativo', true);

      if (!turmas?.length) return [];

      const result = await Promise.all(
        turmas.map(async (t) => {
          const { data: aulas } = await supabase.from('edu_aulas').select('id').eq('turma_id', t.id).eq('realizada', true);
          const aulasIds = aulas?.map((a) => a.id) ?? [];

          if (!aulasIds.length) return { turma: t.nome, disciplina: (t.edu_disciplinas as any)?.nome, media: 0, total: 0 };

          const { data: presencas } = await supabase
            .from('edu_presencas')
            .select('presente')
            .in('aula_id', aulasIds);

          const total = presencas?.length ?? 0;
          const presentes = presencas?.filter((p) => p.presente).length ?? 0;
          const media = total > 0 ? Math.round((presentes / total) * 100) : 0;

          return { turma: t.nome, disciplina: (t.edu_disciplinas as any)?.nome, media, total };
        })
      );

      return result.sort((a, b) => b.media - a.media);
    },
  });

  const exportCSV = () => {
    if (!data) return;
    const csv = ['Turma,Disciplina,Frequência Média (%)'];
    data.forEach((r) => csv.push(`${r.turma},${r.disciplina ?? ''},${r.media}`));
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frequencia.csv';
    a.click();
  };

  if (isLoading) return <TableSkeleton rows={5} cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={exportCSV} className="flex items-center gap-2 text-sm font-bold text-[#1A3A6E] border border-[#1A3A6E] px-4 py-2 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all">
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Frequência por turma</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="turma" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v}%`, 'Frequência']} />
            <Bar dataKey="media" fill="#1A3A6E" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Turma</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Disciplina</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Frequência</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-[#1A3A6E]">{r.turma}</td>
                <td className="px-4 py-3 text-slate-600">{r.disciplina ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full rounded-full" style={{ width: `${r.media}%`, backgroundColor: r.media >= 75 ? '#22c55e' : r.media >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <span className="font-bold text-slate-700 text-xs w-10">{r.media}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={r.media >= 75 ? 'green' : r.media >= 50 ? 'yellow' : 'red'}>
                    {r.media >= 75 ? 'Regular' : r.media >= 50 ? 'Atenção' : 'Crítico'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatorioEad() {
  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-ead'],
    queryFn: async () => {
      const { data: materiais } = await supabase
        .from('edu_materiais_ead')
        .select('id, titulo, tipo, edu_turmas(nome)')
        .eq('publicado', true);

      if (!materiais?.length) return [];

      const result = await Promise.all(
        materiais.map(async (m) => {
          const { data: acessos } = await supabase
            .from('edu_rastreamento_ead')
            .select('total_acessos, tempo_total_segundos, concluido')
            .eq('material_id', m.id);

          const totalAcessos = acessos?.reduce((s, a) => s + a.total_acessos, 0) ?? 0;
          const tempoMedio = acessos?.length ? Math.round(acessos.reduce((s, a) => s + a.tempo_total_segundos, 0) / acessos.length / 60) : 0;
          const concluidos = acessos?.filter((a) => a.concluido).length ?? 0;

          return {
            titulo: m.titulo,
            tipo: m.tipo,
            turma: (m.edu_turmas as any)?.nome ?? '—',
            totalAcessos,
            tempoMedio,
            concluidos,
          };
        })
      );

      return result.sort((a, b) => b.totalAcessos - a.totalAcessos);
    },
  });

  if (isLoading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Material', 'Tipo', 'Turma', 'Total de acessos', 'Tempo médio (min)', 'Concluídos'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data?.length ? (
            <tr><td colSpan={6} className="text-center text-slate-400 py-8 text-sm">Nenhum material com rastreamento</td></tr>
          ) : (
            data.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-700 max-w-[200px] truncate">{r.titulo}</td>
                <td className="px-4 py-3"><Badge color="blue">{r.tipo}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{r.turma}</td>
                <td className="px-4 py-3 font-bold text-[#1A3A6E]">{r.totalAcessos}</td>
                <td className="px-4 py-3 text-slate-600">{r.tempoMedio} min</td>
                <td className="px-4 py-3"><Badge color="green">{r.concluidos}</Badge></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RelatorioAtividades() {
  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-atividades'],
    queryFn: async () => {
      const { data: atividades } = await supabase
        .from('edu_atividades')
        .select('id, titulo, tipo, turma_id, pontuacao_maxima, edu_turmas(nome)');

      if (!atividades?.length) return [];

      const result = await Promise.all(
        atividades.map(async (a) => {
          const [{ count: totalAlunos }, { data: entregas }] = await Promise.all([
            supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).eq('turma_id', a.turma_id),
            supabase.from('edu_entregas').select('nota, status').eq('atividade_id', a.id),
          ]);

          const total = totalAlunos ?? 0;
          const entregues = entregas?.filter((e) => e.status !== 'pendente').length ?? 0;
          const mediaNota = entregas?.filter((e) => e.nota != null).reduce((acc, e, _, arr) => acc + (e.nota ?? 0) / arr.length, 0) ?? 0;
          const pctEntrega = total > 0 ? Math.round((entregues / total) * 100) : 0;

          return {
            titulo: a.titulo,
            tipo: a.tipo,
            turma: (a.edu_turmas as any)?.nome ?? '—',
            total,
            entregues,
            pctEntrega,
            mediaNota: mediaNota.toFixed(1),
          };
        })
      );

      return result.sort((a, b) => a.pctEntrega - b.pctEntrega);
    },
  });

  if (isLoading) return <TableSkeleton rows={5} cols={5} />;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Atividade', 'Tipo', 'Turma', 'Entregas', '% Entrega', 'Média'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!data?.length ? (
            <tr><td colSpan={6} className="text-center text-slate-400 py-8 text-sm">Nenhuma atividade cadastrada</td></tr>
          ) : (
            data.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-700 max-w-[180px] truncate">{r.titulo}</td>
                <td className="px-4 py-3"><Badge color="blue">{r.tipo}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{r.turma}</td>
                <td className="px-4 py-3 text-slate-600">{r.entregues}/{r.total}</td>
                <td className="px-4 py-3">
                  <Badge color={r.pctEntrega >= 70 ? 'green' : r.pctEntrega >= 40 ? 'yellow' : 'red'}>
                    {r.pctEntrega}%
                  </Badge>
                </td>
                <td className="px-4 py-3 font-bold text-[#1A3A6E]">{r.mediaNota}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
