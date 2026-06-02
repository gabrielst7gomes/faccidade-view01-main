import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EduEmpty } from '@/components/edu/EduEmpty';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus, X, Search, Mail, Phone, Briefcase, School,
  Eye, Pencil, Trash2, Users, BookOpen, TrendingUp,
  ChevronRight, GraduationCap, CheckCircle2, AlertTriangle,
  UserPlus, Filter,
} from 'lucide-react';
import type { Perfil } from '@/types/edu';

export const Route = createFileRoute('/edu/coordenador/professores')({
  component: ProfessoresPage,
});

/* ─── Schema de validação ─── */
const professorSchema = z.object({
  nome:          z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email:         z.string().email('E-mail inválido'),
  senha:         z.string().min(6, 'Mínimo 6 caracteres'),
  telefone:      z.string().optional(),
  especialidade: z.string().optional(),
  matricula:     z.string().optional(),
});
type ProfessorForm = z.infer<typeof professorSchema>;

const editSchema = professorSchema.omit({ senha: true }).extend({
  senha: z.string().min(6).optional().or(z.literal('')),
});
type EditForm = z.infer<typeof editSchema>;

/* ═══════════════════════════════════════════ */
function ProfessoresPage() {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [sidebarMode, setSidebarMode] = useState<'closed' | 'create' | 'view' | 'edit'>('closed');
  const [selected, setSelected]       = useState<Perfil | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── Busca professores ── */
  const { data: professores, isLoading } = useQuery({
    queryKey: ['coord-professores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('perfil', 'professor')
        .order('nome');
      if (error) throw error;
      return data as Perfil[];
    },
  });

  const filtered = (professores ?? []).filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.especialidade ?? '').toLowerCase().includes(search.toLowerCase())
  );

  /* ── Abrir sidebar ── */
  const openCreate = () => { setSelected(null); setSidebarMode('create'); };
  const openView   = (p: Perfil) => { setSelected(p); setSidebarMode('view'); };
  const openEdit   = (p: Perfil) => { setSelected(p); setSidebarMode('edit'); };
  const closeSidebar = () => { setSidebarMode('closed'); setSelected(null); };

  /* ── Deletar professor ── */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('perfis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Professor removido.');
      qc.invalidateQueries({ queryKey: ['coord-professores'] });
      setDeleteConfirm(null);
      closeSidebar();
    },
    onError: () => toast.error('Erro ao remover professor.'),
  });

  return (
    <div className="flex h-full gap-0 relative">
      {/* ══════════════ ÁREA PRINCIPAL ══════════════ */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarMode !== 'closed' ? 'mr-[420px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-[#1A3A6E]">Professores</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {professores?.length ?? 0} professor{(professores?.length ?? 0) !== 1 ? 'es' : ''} cadastrado{(professores?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#1A3A6E] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#0D1B3E] transition-all shadow-lg shadow-[#1A3A6E]/20 hover:-translate-y-0.5"
          >
            <UserPlus size={16} /> Novo professor
          </button>
        </div>

        {/* Barra de busca */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou especialidade..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#1A3A6E] focus:ring-4 focus:ring-[#1A3A6E]/5 transition-all bg-white shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Resultados */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : !filtered.length ? (
          <EduEmpty
            title={search ? 'Nenhum resultado encontrado' : 'Nenhum professor cadastrado'}
            description={search ? `Sem resultados para "${search}"` : 'Clique em "Novo professor" para adicionar o primeiro.'}
            icon={<GraduationCap size={28} />}
            action={!search ? (
              <button onClick={openCreate} className="bg-[#1A3A6E] text-white text-sm font-bold px-6 py-2.5 rounded-full">
                Adicionar professor
              </button>
            ) : undefined}
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(prof => (
              <ProfCard
                key={prof.id}
                prof={prof}
                isSelected={selected?.id === prof.id}
                onView={() => openView(prof)}
                onEdit={() => openEdit(prof)}
                onDelete={() => setDeleteConfirm(prof.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <Sidebar
        mode={sidebarMode}
        prof={selected}
        onClose={closeSidebar}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && setDeleteConfirm(selected.id)}
        onCreated={() => { qc.invalidateQueries({ queryKey: ['coord-professores'] }); closeSidebar(); }}
        onUpdated={() => { qc.invalidateQueries({ queryKey: ['coord-professores'] }); closeSidebar(); }}
      />

      {/* ══════════════ CONFIRM DELETE ══════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Remover professor?</h3>
            <p className="text-sm text-slate-500 mb-6">Esta ação não pode ser desfeita. O professor perderá acesso ao sistema.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-70"
              >
                {deleteMutation.isPending ? 'Removendo…' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── CARD DO PROFESSOR ─────────────────────────── */
function ProfCard({
  prof, isSelected, onView, onEdit, onDelete,
}: {
  prof: Perfil;
  isSelected: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: stats } = useQuery({
    queryKey: ['prof-card-stats', prof.id],
    queryFn: async () => {
      const { count: turmas } = await supabase.from('edu_turmas').select('*', { count: 'exact' }).eq('professor_id', prof.id).eq('ativo', true);
      const { count: atividades } = await supabase.from('edu_atividades').select('*', { count: 'exact' }).eq('professor_id', prof.id);
      return { turmas: turmas ?? 0, atividades: atividades ?? 0 };
    },
  });

  const initials = prof.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['bg-[#1A3A6E]', 'bg-[#7C3AED]', 'bg-[#059669]', 'bg-[#D97706]', 'bg-[#0ea5e9]'];
  const colorIdx = prof.nome.charCodeAt(0) % colors.length;

  return (
    <article
      onClick={onView}
      className={`group bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isSelected ? 'border-[#1A3A6E] ring-2 ring-[#1A3A6E]/10' : 'border-slate-100 hover:border-[#1A3A6E]/20'
      }`}
    >
      {/* Topo: avatar + ações */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${colors[colorIdx]} flex items-center justify-center text-white font-black text-lg shrink-0`}>
            {prof.foto_url
              ? <img src={prof.foto_url} alt={prof.nome} className="w-12 h-12 rounded-full object-cover" />
              : initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate leading-tight">{prof.nome}</p>
            <p className="text-xs text-[#F26522] font-bold uppercase tracking-wider">Professor</p>
          </div>
        </div>
        {/* Ações rápidas */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-[#1A3A6E] hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Infos */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">{prof.email}</span>
        </div>
        {prof.telefone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={12} className="shrink-0 text-slate-400" />
            <span>{prof.telefone}</span>
          </div>
        )}
        {prof.especialidade && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Briefcase size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{prof.especialidade}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <School size={12} className="text-[#1A3A6E]" />
          <span className="font-bold text-slate-700">{stats?.turmas ?? '—'}</span> turma{stats?.turmas !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <BookOpen size={12} className="text-[#F26522]" />
          <span className="font-bold text-slate-700">{stats?.atividades ?? '—'}</span> atividade{stats?.atividades !== 1 ? 's' : ''}
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-[#1A3A6E] font-bold">
          Ver mais <ChevronRight size={12} />
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────── SIDEBAR ─────────────────────────── */
function Sidebar({
  mode, prof, onClose, onEdit, onDelete, onCreated, onUpdated,
}: {
  mode: 'closed' | 'create' | 'view' | 'edit';
  prof: Perfil | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreated: () => void;
  onUpdated: () => void;
}) {
  const isOpen = mode !== 'closed';

  return (
    <>
      {/* Overlay semitransparente no mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] lg:hidden" onClick={onClose} />
      )}

      {/* Painel */}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {mode === 'create' && <SidebarCreate onClose={onClose} onCreated={onCreated} />}
        {mode === 'view'   && prof && <SidebarView prof={prof} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />}
        {mode === 'edit'   && prof && <SidebarEdit prof={prof} onClose={onClose} onUpdated={onUpdated} />}
      </div>
    </>
  );
}

/* ─── Sidebar: CRIAR professor ─── */
function SidebarCreate({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfessorForm>({
    resolver: zodResolver(professorSchema),
  });

  const criarMutation = useMutation({
    mutationFn: async (values: ProfessorForm) => {
      const { error } = await supabase.rpc('create_edu_user', {
        p_email:         values.email,
        p_password:      values.senha,
        p_nome:          values.nome,
        p_perfil:        'professor',
        p_telefone:      values.telefone || null,
        p_especialidade: values.especialidade || null,
        p_matricula:     values.matricula || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Professor cadastrado com sucesso!');
      reset();
      onCreated();
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate') || err.message?.includes('already exists')) {
        toast.error('E-mail já cadastrado no sistema.');
      } else {
        toast.error('Erro ao cadastrar: ' + (err.message ?? 'tente novamente.'));
      }
    },
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A3A6E] flex items-center justify-center">
            <UserPlus size={17} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-[#1A3A6E] text-base leading-tight">Novo Professor</h2>
            <p className="text-xs text-slate-400">Preencha todos os campos obrigatórios</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form
        id="form-criar-prof"
        onSubmit={handleSubmit(v => criarMutation.mutate(v))}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
      >
        {/* Nome */}
        <FormField label="Nome completo *" error={errors.nome?.message}>
          <input
            {...register('nome')}
            placeholder="Ex: Maria Oliveira Santos"
            className={Input(!!errors.nome)}
          />
        </FormField>

        {/* Email */}
        <FormField label="E-mail institucional *" error={errors.email?.message}>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="professor@faccidade.edu.br"
              className={`${Input(!!errors.email)} pl-9`}
            />
          </div>
        </FormField>

        {/* Senha */}
        <FormField label="Senha de acesso *" error={errors.senha?.message}
          hint="Mínimo 6 caracteres. O professor poderá alterar depois.">
          <input
            {...register('senha')}
            type="password"
            placeholder="••••••••"
            className={Input(!!errors.senha)}
          />
        </FormField>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Informações adicionais</p>

          {/* Telefone */}
          <FormField label="Telefone / WhatsApp">
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('telefone')}
                placeholder="(62) 99999-0000"
                className={`${Input(false)} pl-9`}
              />
            </div>
          </FormField>

          {/* Especialidade */}
          <FormField label="Especialidade / Área" className="mt-4">
            <div className="relative">
              <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('especialidade')}
                placeholder="Ex: Direito Civil, Enfermagem, Contabilidade"
                className={`${Input(false)} pl-9`}
              />
            </div>
          </FormField>

          {/* Matrícula */}
          <FormField label="Código / Matrícula" className="mt-4">
            <input
              {...register('matricula')}
              placeholder="Ex: PROF-2024-001"
              className={Input(false)}
            />
          </FormField>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700 leading-relaxed">
          <p className="font-bold mb-1">ℹ️ Após o cadastro:</p>
          <ul className="space-y-1 list-disc list-inside text-blue-600">
            <li>O professor já poderá fazer login com o e-mail e senha definidos</li>
            <li>Vincule-o a turmas na seção <strong>Turmas e Grade</strong></li>
            <li>Ele terá acesso apenas às suas próprias turmas</li>
          </ul>
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="form-criar-prof"
          disabled={criarMutation.isPending}
          className="flex-1 py-3 bg-[#1A3A6E] text-white rounded-xl text-sm font-bold hover:bg-[#0D1B3E] transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-[#1A3A6E]/20"
        >
          {criarMutation.isPending ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Cadastrando…</>
          ) : (
            <><UserPlus size={15} /> Cadastrar professor</>
          )}
        </button>
      </div>
    </>
  );
}

/* ─── Sidebar: VER detalhes do professor ─── */
function SidebarView({
  prof, onClose, onEdit, onDelete,
}: {
  prof: Perfil;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: detalhes } = useQuery({
    queryKey: ['prof-detalhes', prof.id],
    queryFn: async () => {
      const [{ data: turmas }, { data: aulas }, { data: atividades }] = await Promise.all([
        supabase.from('edu_turmas').select('id, nome, edu_disciplinas(nome)').eq('professor_id', prof.id).eq('ativo', true),
        supabase.from('edu_aulas').select('id, realizada').eq('created_by', prof.id),
        supabase.from('edu_atividades').select('id, titulo, tipo, created_at').eq('professor_id', prof.id).order('created_at', { ascending: false }).limit(5),
      ]);

      const turmaIds = turmas?.map(t => t.id) ?? [];
      let freqMedia = 0;
      if (turmaIds.length) {
        let totalP = 0, presentesP = 0;
        for (const tid of turmaIds) {
          const { data: aulasT } = await supabase.from('edu_aulas').select('id').eq('turma_id', tid).eq('realizada', true);
          const ids = aulasT?.map(a => a.id) ?? [];
          if (ids.length) {
            const { data: p } = await supabase.from('edu_presencas').select('presente').in('aula_id', ids);
            totalP += p?.length ?? 0;
            presentesP += p?.filter(x => x.presente).length ?? 0;
          }
        }
        freqMedia = totalP > 0 ? Math.round((presentesP / totalP) * 100) : 0;
      }

      return { turmas: turmas ?? [], aulas: aulas ?? [], atividades: atividades ?? [], freqMedia };
    },
  });

  const initials = prof.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const aulasRealizadas = detalhes?.aulas.filter(a => a.realizada).length ?? 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <h2 className="font-black text-[#1A3A6E] text-base">Detalhes do Professor</h2>
        <div className="flex gap-1">
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1A3A6E] border border-[#1A3A6E]/20 rounded-full hover:bg-[#1A3A6E] hover:text-white transition-all">
            <Pencil size={12} /> Editar
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + nome */}
        <div className="px-6 py-6 flex flex-col items-center text-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="w-20 h-20 rounded-2xl bg-[#1A3A6E] flex items-center justify-center text-white font-black text-3xl mb-3 shadow-lg shadow-[#1A3A6E]/20">
            {initials}
          </div>
          <h3 className="font-black text-slate-800 text-lg leading-tight">{prof.nome}</h3>
          <p className="text-xs text-[#F26522] font-bold uppercase tracking-widest mt-1">Professor</p>
          {prof.especialidade && (
            <p className="text-sm text-slate-500 mt-1">{prof.especialidade}</p>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { label: 'Turmas', value: detalhes?.turmas.length ?? '—', icon: <School size={14} className="text-[#1A3A6E]" /> },
            { label: 'Aulas', value: aulasRealizadas, icon: <BookOpen size={14} className="text-[#F26522]" /> },
            { label: 'Freq. alunos', value: detalhes?.freqMedia !== undefined ? `${detalhes.freqMedia}%` : '—', icon: <TrendingUp size={14} className="text-green-500" /> },
          ].map(k => (
            <div key={k.label} className="flex flex-col items-center py-4 gap-1">
              {k.icon}
              <p className="font-black text-lg text-[#1A3A6E] leading-none">{k.value}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Contato */}
          <Section title="Informações de contato">
            <InfoRow icon={<Mail size={14} />} label="E-mail" value={prof.email} />
            {prof.telefone && <InfoRow icon={<Phone size={14} />} label="Telefone" value={prof.telefone} />}
            {prof.matricula && <InfoRow icon={<Briefcase size={14} />} label="Código" value={prof.matricula} />}
          </Section>

          {/* Turmas */}
          {(detalhes?.turmas.length ?? 0) > 0 && (
            <Section title={`Turmas ativas (${detalhes?.turmas.length})`}>
              <div className="space-y-2">
                {detalhes?.turmas.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-sm">
                    <School size={13} className="text-[#1A3A6E] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 truncate">{t.nome}</p>
                      <p className="text-xs text-slate-400 truncate">{(t.edu_disciplinas as any)?.nome ?? ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Últimas atividades */}
          {(detalhes?.atividades.length ?? 0) > 0 && (
            <Section title="Atividades recentes">
              <div className="space-y-1.5">
                {detalhes?.atividades.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={13} className="text-green-400 shrink-0" />
                    <span className="text-slate-600 truncate">{a.titulo}</span>
                    <span className="ml-auto text-xs text-slate-400 capitalize shrink-0">{a.tipo}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 shrink-0">
        <button
          onClick={onDelete}
          className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={14} /> Remover professor
        </button>
      </div>
    </>
  );
}

/* ─── Sidebar: EDITAR professor ─── */
function SidebarEdit({
  prof, onClose, onUpdated,
}: {
  prof: Perfil;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nome:          prof.nome,
      email:         prof.email,
      telefone:      prof.telefone ?? '',
      especialidade: prof.especialidade ?? '',
      matricula:     prof.matricula ?? '',
      senha:         '',
    },
  });

  const editMutation = useMutation({
    mutationFn: async (values: EditForm) => {
      const { error } = await supabase
        .from('perfis')
        .update({
          nome:          values.nome,
          email:         values.email,
          telefone:      values.telefone || null,
          especialidade: values.especialidade || null,
          matricula:     values.matricula || null,
        })
        .eq('id', prof.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Dados atualizados!');
      onUpdated();
    },
    onError: () => toast.error('Erro ao atualizar professor.'),
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F26522] flex items-center justify-center">
            <Pencil size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-[#1A3A6E] text-base leading-tight">Editar Professor</h2>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">{prof.nome}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form
        id="form-editar-prof"
        onSubmit={handleSubmit(v => editMutation.mutate(v))}
        className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
      >
        <FormField label="Nome completo *" error={errors.nome?.message}>
          <input {...register('nome')} className={Input(!!errors.nome)} />
        </FormField>

        <FormField label="E-mail *" error={errors.email?.message}>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input {...register('email')} type="email" className={`${Input(!!errors.email)} pl-9`} />
          </div>
        </FormField>

        <FormField label="Telefone">
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input {...register('telefone')} className={`${Input(false)} pl-9`} />
          </div>
        </FormField>

        <FormField label="Especialidade">
          <div className="relative">
            <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input {...register('especialidade')} className={`${Input(false)} pl-9`} />
          </div>
        </FormField>

        <FormField label="Código / Matrícula">
          <input {...register('matricula')} className={Input(false)} />
        </FormField>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
          <strong>Nota:</strong> Para alterar a senha do professor, use o painel de autenticação do Supabase Dashboard.
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button
          type="submit"
          form="form-editar-prof"
          disabled={editMutation.isPending}
          className="flex-1 py-3 bg-[#F26522] text-white rounded-xl text-sm font-bold hover:bg-[#d4551c] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {editMutation.isPending ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Salvando…</>
          ) : (
            <><CheckCircle2 size={15} /> Salvar alterações</>
          )}
        </button>
      </div>
    </>
  );
}

/* ─── Helpers de formulário ─── */
function FormField({
  label, error, hint, children, className = '',
}: {
  label: string; error?: string; hint?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}

function Input(hasError: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50'
      : 'border-slate-200 focus:border-[#1A3A6E] focus:ring-4 focus:ring-[#1A3A6E]/5'
  }`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
