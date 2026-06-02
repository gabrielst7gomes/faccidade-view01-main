import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader, Badge } from '@/components/edu/AlertCard';
import { EduEmpty, TableSkeleton } from '@/components/edu/EduEmpty';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bell, CheckCircle2, Clock, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export const Route = createFileRoute('/edu/professor/rastreamento')({
  component: RastreamentoPage,
});

function RastreamentoPage() {
  const { perfil } = useEduAuth();
  const [materialId, setMaterialId] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'nao_acessaram' | 'acessaram_hoje' | 'concluiram'>('todos');

  const { data: materiais } = useQuery({
    queryKey: ['prof-materiais-track', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('edu_materiais_ead')
        .select('id, titulo, tipo, turma_id')
        .eq('professor_id', perfil!.id)
        .eq('publicado', true)
        .order('titulo');
      return data ?? [];
    },
  });

  const { data: rastreamento, isLoading } = useQuery({
    queryKey: ['prof-rastreamento', materialId],
    enabled: !!materialId,
    queryFn: async () => {
      const mat = materiais?.find((m) => m.id === materialId);
      if (!mat) return null;

      const [{ data: alunos }, { data: registros }] = await Promise.all([
        supabase.from('edu_turma_alunos').select('aluno_id, perfis(nome, email)').eq('turma_id', mat.turma_id),
        supabase.from('edu_rastreamento_ead').select('*').eq('material_id', materialId),
      ]);

      const map: Record<string, any> = {};
      registros?.forEach((r) => { map[r.aluno_id] = r; });

      return (alunos ?? []).map((a: any) => ({
        aluno_id: a.aluno_id,
        nome: a.perfis?.nome ?? 'Aluno',
        email: a.perfis?.email ?? '',
        registro: map[a.aluno_id] ?? null,
      }));
    },
  });

  const notificarMutation = useMutation({
    mutationFn: async (alunoId: string) => {
      const { error } = await supabase.from('edu_alertas_sistema').insert({
        aluno_id: alunoId,
        tipo: 'ead_inativo',
        mensagem: 'Você tem material EAD para acessar. Não perca o prazo!',
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Lembrete enviado ao aluno!'),
    onError: () => toast.error('Erro ao enviar lembrete.'),
  });

  const hoje = format(new Date(), 'yyyy-MM-dd');

  const filtrados = rastreamento?.filter((r) => {
    if (filtro === 'nao_acessaram') return !r.registro;
    if (filtro === 'acessaram_hoje') return r.registro && r.registro.ultimo_acesso?.startsWith(hoje);
    if (filtro === 'concluiram') return r.registro?.concluido;
    return true;
  }) ?? [];

  const acessaram = rastreamento?.filter((r) => r.registro).length ?? 0;
  const total = rastreamento?.length ?? 0;
  const chartData = [
    { name: 'Acessaram', value: acessaram, fill: '#1A3A6E' },
    { name: 'Não acessaram', value: total - acessaram, fill: '#ef4444' },
    { name: 'Concluíram', value: rastreamento?.filter((r) => r.registro?.concluido).length ?? 0, fill: '#22c55e' },
  ];

  return (
    <div>
      <EduPageHeader title="Rastreamento EAD" subtitle="Monitore o engajamento dos alunos com os materiais" />

      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Material</label>
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="w-full max-w-md border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A3A6E] bg-white"
        >
          <option value="">Selecione um material...</option>
          {materiais?.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
        </select>
      </div>

      {!materialId ? (
        <EduEmpty title="Selecione um material" description="Escolha um material para ver os dados de acesso dos alunos." />
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="space-y-6">
          {/* Gráfico */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4">Visão geral de acessos</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filtros */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'nao_acessaram', label: 'Não acessaram' },
              { id: 'acessaram_hoje', label: 'Acessaram hoje' },
              { id: 'concluiram', label: 'Concluíram' },
            ].map((f) => (
              <button key={f.id} onClick={() => setFiltro(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filtro === f.id ? 'bg-white text-[#1A3A6E] shadow-sm' : 'text-slate-500'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Aluno', 'Último acesso', 'Total acessos', 'Tempo (min)', 'Progresso', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-8 text-sm">Nenhum resultado</td></tr>
                ) : (
                  filtrados.map((r: any) => (
                    <tr key={r.aluno_id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">{r.nome}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {r.registro ? format(new Date(r.registro.ultimo_acesso), 'dd/MM/yyyy HH:mm') : (
                          <span className="flex items-center gap-1 text-red-500"><WifiOff size={12} /> Nunca acessou</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.registro?.total_acessos ?? 0}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1"><Clock size={12} /> {Math.round((r.registro?.tempo_total_segundos ?? 0) / 60)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1A3A6E] rounded-full" style={{ width: `${r.registro?.progresso_percent ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{r.registro?.progresso_percent ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.registro?.concluido ? (
                          <Badge color="green"><CheckCircle2 size={12} className="inline mr-1" />Concluído</Badge>
                        ) : r.registro ? (
                          <Badge color="blue">Em andamento</Badge>
                        ) : (
                          <Badge color="red">Não acessou</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!r.registro && (
                          <button onClick={() => notificarMutation.mutate(r.aluno_id)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Enviar lembrete">
                            <Bell size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
