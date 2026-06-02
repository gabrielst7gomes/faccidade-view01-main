import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEduAuth } from '@/hooks/edu/useEduAuth';
import { EduPageHeader } from '@/components/edu/AlertCard';
import { EduEmpty, CardSkeleton } from '@/components/edu/EduEmpty';
import { School, Users, TrendingUp, Calendar } from 'lucide-react';

export const Route = createFileRoute('/edu/professor/turmas')({
  component: ProfTurmasPage,
});

function ProfTurmasPage() {
  const { perfil } = useEduAuth();

  const { data: turmas, isLoading } = useQuery({
    queryKey: ['prof-turmas-full', perfil?.id],
    enabled: !!perfil?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edu_turmas')
        .select('*, edu_disciplinas(nome, carga_horaria), perfis(nome)')
        .eq('professor_id', perfil!.id)
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <EduPageHeader title="Minhas turmas" subtitle="Visualize todas as suas turmas e alunos" />

      {isLoading ? <CardSkeleton count={3} /> : !turmas?.length ? (
        <EduEmpty
          title="Você não tem turmas"
          description="Aguarde o coordenador vincular você a uma turma."
          icon={<School size={28} />}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turmas.map((t: any) => (
            <TurmaCard key={t.id} turma={t} professorId={perfil!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function TurmaCard({ turma, professorId }: { turma: any; professorId: string }) {
  const { data: stats } = useQuery({
    queryKey: ['prof-turma-stats', turma.id],
    queryFn: async () => {
      const [{ count: totalAlunos }, { data: aulas }] = await Promise.all([
        supabase.from('edu_turma_alunos').select('*', { count: 'exact' }).eq('turma_id', turma.id),
        supabase.from('edu_aulas').select('id').eq('turma_id', turma.id).eq('realizada', true),
      ]);

      const aulasIds = aulas?.map((a) => a.id) ?? [];
      let presenca = 0;
      if (aulasIds.length > 0) {
        const { data: pres } = await supabase.from('edu_presencas').select('presente').in('aula_id', aulasIds);
        const total = pres?.length ?? 0;
        const presentes = pres?.filter((p) => p.presente).length ?? 0;
        presenca = total > 0 ? Math.round((presentes / total) * 100) : 0;
      }

      return { totalAlunos: totalAlunos ?? 0, totalAulas: aulas?.length ?? 0, presenca };
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#1A3A6E] flex items-center justify-center shrink-0">
          <School size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-[#1A3A6E] truncate">{turma.nome}</h3>
          <p className="text-xs text-slate-400 truncate">{turma.edu_disciplinas?.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <div className="flex justify-center mb-1"><Users size={14} className="text-slate-400" /></div>
          <p className="text-sm font-black text-[#1A3A6E]">{stats?.totalAlunos ?? '—'}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold">Alunos</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <div className="flex justify-center mb-1"><Calendar size={14} className="text-slate-400" /></div>
          <p className="text-sm font-black text-[#1A3A6E]">{stats?.totalAulas ?? '—'}</p>
          <p className="text-[9px] text-slate-400 uppercase font-bold">Aulas</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <div className="flex justify-center mb-1"><TrendingUp size={14} className="text-slate-400" /></div>
          <p className={`text-sm font-black ${stats?.presenca !== undefined ? (stats.presenca >= 75 ? 'text-green-600' : stats.presenca >= 50 ? 'text-amber-600' : 'text-red-600') : 'text-[#1A3A6E]'}`}>
            {stats?.presenca !== undefined ? `${stats.presenca}%` : '—'}
          </p>
          <p className="text-[9px] text-slate-400 uppercase font-bold">Presença</p>
        </div>
      </div>

      {turma.sala && (
        <p className="mt-3 text-xs text-slate-400">
          Sala: <span className="font-bold text-slate-600">{turma.sala}</span>
        </p>
      )}
    </div>
  );
}
