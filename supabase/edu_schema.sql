-- =============================================================
-- FacCidade Edu — Schema Completo
-- Execute no Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- ─── PERFIS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfis (
  id         UUID REFERENCES auth.users PRIMARY KEY,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL,
  perfil     TEXT CHECK (perfil IN ('coordenador','professor','aluno')) NOT NULL,
  matricula  TEXT,
  telefone   TEXT,
  especialidade TEXT,
  foto_url   TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfis_self_read" ON perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "perfis_coord_read" ON perfis FOR SELECT
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "perfis_coord_insert" ON perfis FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "perfis_coord_update" ON perfis FOR UPDATE
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "perfis_coord_delete" ON perfis FOR DELETE
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "perfis_self_update" ON perfis FOR UPDATE USING (auth.uid() = id);

-- ─── CURSOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_cursos (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome   TEXT NOT NULL,
  codigo TEXT UNIQUE,
  turno  TEXT CHECK (turno IN ('matutino','noturno','integral')),
  ativo  BOOLEAN DEFAULT true
);

ALTER TABLE edu_cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_cursos_read_all" ON edu_cursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "edu_cursos_coord_write" ON edu_cursos FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));

-- ─── DISCIPLINAS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_disciplinas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT NOT NULL,
  codigo        TEXT,
  curso_id      UUID REFERENCES edu_cursos(id) ON DELETE CASCADE,
  carga_horaria INTEGER,
  semestre      INTEGER
);

ALTER TABLE edu_disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_disciplinas_read_all" ON edu_disciplinas FOR SELECT TO authenticated USING (true);
CREATE POLICY "edu_disciplinas_coord_write" ON edu_disciplinas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));

-- ─── TURMAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_turmas (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome           TEXT NOT NULL,
  disciplina_id  UUID REFERENCES edu_disciplinas(id),
  professor_id   UUID REFERENCES perfis(id),
  sala           TEXT,
  semestre       TEXT,
  ano            INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  ativo          BOOLEAN DEFAULT true
);

ALTER TABLE edu_turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_turmas_coord_all" ON edu_turmas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_turmas_prof_read" ON edu_turmas FOR SELECT
  USING (professor_id = auth.uid());
CREATE POLICY "edu_turmas_aluno_read" ON edu_turmas FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_turmas.id AND ta.aluno_id = auth.uid()));

-- ─── TURMA_ALUNOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_turma_alunos (
  turma_id       UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  aluno_id       UUID REFERENCES perfis(id) ON DELETE CASCADE,
  data_matricula TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (turma_id, aluno_id)
);

ALTER TABLE edu_turma_alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_ta_coord_all" ON edu_turma_alunos FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_ta_prof_read" ON edu_turma_alunos FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turmas t WHERE t.id = edu_turma_alunos.turma_id AND t.professor_id = auth.uid()));
CREATE POLICY "edu_ta_aluno_read" ON edu_turma_alunos FOR SELECT
  USING (aluno_id = auth.uid());

-- ─── HORARIOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_horarios (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id    UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  dia_semana  INTEGER CHECK (dia_semana BETWEEN 1 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim    TIME NOT NULL,
  sala        TEXT
);

ALTER TABLE edu_horarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_horarios_coord_all" ON edu_horarios FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_horarios_prof_read" ON edu_horarios FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turmas t WHERE t.id = edu_horarios.turma_id AND t.professor_id = auth.uid()));
CREATE POLICY "edu_horarios_aluno_read" ON edu_horarios FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_horarios.turma_id AND ta.aluno_id = auth.uid()));

-- ─── AULAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_aulas (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id    UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  hora_inicio TIME,
  hora_fim    TIME,
  conteudo    TEXT,
  realizada   BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES perfis(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE edu_aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_aulas_coord_all" ON edu_aulas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_aulas_prof_all" ON edu_aulas FOR ALL
  USING (EXISTS (SELECT 1 FROM edu_turmas t WHERE t.id = edu_aulas.turma_id AND t.professor_id = auth.uid()));
CREATE POLICY "edu_aulas_aluno_read" ON edu_aulas FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_aulas.turma_id AND ta.aluno_id = auth.uid()));

-- ─── PRESENÇAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_presencas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aula_id       UUID REFERENCES edu_aulas(id) ON DELETE CASCADE,
  aluno_id      UUID REFERENCES perfis(id) ON DELETE CASCADE,
  presente      BOOLEAN DEFAULT false,
  justificativa TEXT,
  UNIQUE(aula_id, aluno_id)
);

ALTER TABLE edu_presencas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_pres_coord_all" ON edu_presencas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_pres_prof_all" ON edu_presencas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM edu_aulas a
    JOIN edu_turmas t ON t.id = a.turma_id
    WHERE a.id = edu_presencas.aula_id AND t.professor_id = auth.uid()
  ));
CREATE POLICY "edu_pres_aluno_read" ON edu_presencas FOR SELECT
  USING (aluno_id = auth.uid());

-- ─── ATIVIDADES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_atividades (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id         UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  professor_id     UUID REFERENCES perfis(id),
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  tipo             TEXT CHECK (tipo IN ('trabalho','prova','exercicio','complementar','seminario')),
  data_entrega     TIMESTAMP WITH TIME ZONE,
  pontuacao_maxima DECIMAL(5,2) DEFAULT 10,
  arquivo_url      TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE edu_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_atv_coord_all" ON edu_atividades FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_atv_prof_all" ON edu_atividades FOR ALL
  USING (professor_id = auth.uid());
CREATE POLICY "edu_atv_aluno_read" ON edu_atividades FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_atividades.turma_id AND ta.aluno_id = auth.uid()));

-- ─── ENTREGAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_entregas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id  UUID REFERENCES edu_atividades(id) ON DELETE CASCADE,
  aluno_id      UUID REFERENCES perfis(id) ON DELETE CASCADE,
  arquivo_url   TEXT,
  texto_resposta TEXT,
  data_entrega  TIMESTAMP WITH TIME ZONE DEFAULT now(),
  nota          DECIMAL(5,2),
  feedback      TEXT,
  status        TEXT CHECK (status IN ('pendente','entregue','corrigido','atrasado')) DEFAULT 'pendente',
  UNIQUE(atividade_id, aluno_id)
);

ALTER TABLE edu_entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_entr_coord_all" ON edu_entregas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_entr_prof_all" ON edu_entregas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM edu_atividades a WHERE a.id = edu_entregas.atividade_id AND a.professor_id = auth.uid()
  ));
CREATE POLICY "edu_entr_aluno_all" ON edu_entregas FOR ALL
  USING (aluno_id = auth.uid());

-- ─── NOTAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_notas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id         UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  aluno_id         UUID REFERENCES perfis(id) ON DELETE CASCADE,
  tipo_avaliacao   TEXT NOT NULL,
  valor            DECIMAL(5,2),
  data             DATE DEFAULT CURRENT_DATE,
  observacao       TEXT
);

ALTER TABLE edu_notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_notas_coord_all" ON edu_notas FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_notas_prof_all" ON edu_notas FOR ALL
  USING (EXISTS (SELECT 1 FROM edu_turmas t WHERE t.id = edu_notas.turma_id AND t.professor_id = auth.uid()));
CREATE POLICY "edu_notas_aluno_read" ON edu_notas FOR SELECT
  USING (aluno_id = auth.uid());

-- ─── MATERIAIS EAD ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_materiais_ead (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id     UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES perfis(id),
  titulo       TEXT NOT NULL,
  descricao    TEXT,
  tipo         TEXT CHECK (tipo IN ('video','pdf','link','apresentacao','audio')),
  url          TEXT,
  arquivo_url  TEXT,
  ordem        INTEGER DEFAULT 0,
  publicado    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE edu_materiais_ead ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_mat_coord_all" ON edu_materiais_ead FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_mat_prof_all" ON edu_materiais_ead FOR ALL
  USING (professor_id = auth.uid());
CREATE POLICY "edu_mat_aluno_read" ON edu_materiais_ead FOR SELECT
  USING (
    publicado = true AND
    EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_materiais_ead.turma_id AND ta.aluno_id = auth.uid())
  );

-- ─── RASTREAMENTO EAD ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_rastreamento_ead (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id           UUID REFERENCES edu_materiais_ead(id) ON DELETE CASCADE,
  aluno_id              UUID REFERENCES perfis(id) ON DELETE CASCADE,
  primeiro_acesso       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ultimo_acesso         TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_acessos         INTEGER DEFAULT 1,
  tempo_total_segundos  INTEGER DEFAULT 0,
  progresso_percent     INTEGER DEFAULT 0,
  concluido             BOOLEAN DEFAULT false,
  UNIQUE(material_id, aluno_id)
);

ALTER TABLE edu_rastreamento_ead ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_rast_coord_all" ON edu_rastreamento_ead FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_rast_prof_read" ON edu_rastreamento_ead FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM edu_materiais_ead m WHERE m.id = edu_rastreamento_ead.material_id AND m.professor_id = auth.uid()
  ));
CREATE POLICY "edu_rast_aluno_all" ON edu_rastreamento_ead FOR ALL
  USING (aluno_id = auth.uid());

-- ─── COMUNICADOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_comunicados (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  remetente_id UUID REFERENCES perfis(id),
  turma_id     UUID REFERENCES edu_turmas(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  mensagem     TEXT NOT NULL,
  tipo         TEXT CHECK (tipo IN ('aviso','urgente','lembrete')),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE edu_comunicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_com_coord_all" ON edu_comunicados FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_com_prof_all" ON edu_comunicados FOR ALL
  USING (remetente_id = auth.uid());
CREATE POLICY "edu_com_aluno_read" ON edu_comunicados FOR SELECT
  USING (EXISTS (SELECT 1 FROM edu_turma_alunos ta WHERE ta.turma_id = edu_comunicados.turma_id AND ta.aluno_id = auth.uid()));

-- ─── ALERTAS DO SISTEMA ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS edu_alertas_sistema (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id   UUID REFERENCES perfis(id) ON DELETE CASCADE,
  tipo       TEXT CHECK (tipo IN ('falta_excesso','ead_inativo','atividade_atrasada','nota_baixa')),
  mensagem   TEXT,
  lido       BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE edu_alertas_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_alert_coord_all" ON edu_alertas_sistema FOR ALL
  USING (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil = 'coordenador'));
CREATE POLICY "edu_alert_prof_insert" ON edu_alertas_sistema FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM perfis p WHERE p.id = auth.uid() AND p.perfil IN ('professor','coordenador')));
CREATE POLICY "edu_alert_aluno_all" ON edu_alertas_sistema FOR ALL
  USING (aluno_id = auth.uid());

-- ─── STORAGE BUCKETS ──────────────────────────────────────────
-- Execute separadamente no Supabase Dashboard > Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('atividades', 'atividades', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materiais-ead', 'materiais-ead', true);

-- ─── REALTIME ─────────────────────────────────────────────────
-- Habilite Realtime nas tabelas edu_alertas_sistema e edu_presencas
-- via Supabase Dashboard > Database > Replication

-- ─── DADOS DE EXEMPLO (opcional) ─────────────────────────────
-- Crie um usuário no Supabase Auth e insira na tabela perfis:
-- INSERT INTO perfis (id, nome, email, perfil) VALUES
--   ('<auth_user_id>', 'Coordenador Geral', 'coord@faccidade.edu.br', 'coordenador');
