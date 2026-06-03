export type PerfilTipo = 'coordenador' | 'professor' | 'aluno';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilTipo;
  matricula?: string;
  telefone?: string;
  especialidade?: string;
  foto_url?: string;
  created_at: string;
}

export interface EduCurso {
  id: string;
  nome: string;
  codigo?: string;
  turno?: 'matutino' | 'noturno' | 'integral';
  ativo: boolean;
}

export interface EduDisciplina {
  id: string;
  nome: string;
  codigo?: string;
  curso_id?: string;
  carga_horaria?: number;
  semestre?: number;
  edu_cursos?: EduCurso;
}

export interface EduTurma {
  id: string;
  nome: string;
  disciplina_id?: string;
  professor_id?: string;
  sala?: string;
  semestre?: string;
  ano?: number;
  ativo: boolean;
  edu_disciplinas?: EduDisciplina;
  perfis?: Perfil;
}

export interface EduTurmaAluno {
  turma_id: string;
  aluno_id: string;
  data_matricula: string;
  edu_turmas?: EduTurma;
  perfis?: Perfil;
}

export interface EduHorario {
  id: string;
  turma_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  sala?: string;
  edu_turmas?: EduTurma;
}

export interface EduAula {
  id: string;
  turma_id: string;
  data: string;
  hora_inicio?: string;
  hora_fim?: string;
  conteudo?: string;
  realizada: boolean;
  created_by?: string;
  created_at: string;
  edu_turmas?: EduTurma;
}

export interface EduPresenca {
  id: string;
  aula_id: string;
  aluno_id: string;
  presente: boolean;
  justificativa?: string;
  edu_aulas?: EduAula;
  perfis?: Perfil;
}

export type TipoAtividade = 'trabalho' | 'prova' | 'exercicio' | 'complementar' | 'seminario';

export interface EduAtividade {
  id: string;
  turma_id: string;
  professor_id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoAtividade;
  data_entrega?: string;
  pontuacao_maxima: number;
  arquivo_url?: string;
  created_at: string;
  edu_turmas?: EduTurma;
  perfis?: Perfil;
}

export type StatusEntrega = 'pendente' | 'entregue' | 'corrigido' | 'atrasado';

export interface EduEntrega {
  id: string;
  atividade_id: string;
  aluno_id: string;
  arquivo_url?: string;
  texto_resposta?: string;
  data_entrega: string;
  nota?: number;
  feedback?: string;
  status: StatusEntrega;
  edu_atividades?: EduAtividade;
  perfis?: Perfil;
}

export interface EduNota {
  id: string;
  turma_id: string;
  aluno_id: string;
  tipo_avaliacao: string;
  valor?: number;
  data: string;
  observacao?: string;
  perfis?: Perfil;
}

export type TipoMaterial = 'video' | 'pdf' | 'link' | 'apresentacao' | 'audio';

export interface EduMaterialEad {
  id: string;
  turma_id: string;
  professor_id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoMaterial;
  url?: string;
  arquivo_url?: string;
  ordem: number;
  publicado: boolean;
  created_at: string;
  edu_turmas?: EduTurma;
}

export interface EduRastreamentoEad {
  id: string;
  material_id: string;
  aluno_id: string;
  primeiro_acesso: string;
  ultimo_acesso: string;
  total_acessos: number;
  tempo_total_segundos: number;
  progresso_percent: number;
  concluido: boolean;
  edu_materiais_ead?: EduMaterialEad;
  perfis?: Perfil;
}

export type TipoComunicado = 'aviso' | 'urgente' | 'lembrete';

export interface EduComunicado {
  id: string;
  remetente_id: string;
  turma_id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoComunicado;
  created_at: string;
  perfis?: Perfil;
  edu_turmas?: EduTurma;
}

export type TipoAlerta = 'falta_excesso' | 'ead_inativo' | 'atividade_atrasada' | 'nota_baixa';

export interface EduAlertaSistema {
  id: string;
  aluno_id: string;
  tipo: TipoAlerta;
  mensagem?: string;
  lido: boolean;
  created_at: string;
}

export const DIAS_SEMANA = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const TIPO_MATERIAL_LABEL: Record<TipoMaterial, string> = {
  video: 'Vídeo',
  pdf: 'PDF',
  link: 'Link',
  apresentacao: 'Apresentação',
  audio: 'Áudio',
};

export const TIPO_ATIVIDADE_LABEL: Record<TipoAtividade, string> = {
  trabalho: 'Trabalho',
  prova: 'Prova',
  exercicio: 'Exercício',
  complementar: 'Complementar',
  seminario: 'Seminário',
};

export const STATUS_ENTREGA_LABEL: Record<StatusEntrega, string> = {
  pendente: 'Pendente',
  entregue: 'Entregue',
  corrigido: 'Corrigido',
  atrasado: 'Atrasado',
};

export const STATUS_ENTREGA_COLOR: Record<StatusEntrega, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  entregue: 'bg-blue-100 text-blue-700',
  corrigido: 'bg-green-100 text-green-700',
  atrasado: 'bg-red-100 text-red-700',
};
