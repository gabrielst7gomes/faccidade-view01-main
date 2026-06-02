-- Configurações Globais
CREATE TABLE public.config (
  chave TEXT PRIMARY KEY,
  valor TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Headlines do Hero
CREATE TABLE public.hero_headlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Depoimentos (Reels)
CREATE TABLE public.depoimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  curso TEXT,
  instagram_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cursos
CREATE TABLE public.cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT,
  turno TEXT,
  link_inscricao TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leads
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  whatsapp TEXT,
  email TEXT,
  curso_interesse TEXT,
  turno TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_headlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas para Config
CREATE POLICY "Configurações são visíveis por todos" ON public.config FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode gerenciar config" ON public.config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para Hero Headlines
CREATE POLICY "Headlines são visíveis por todos" ON public.hero_headlines FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode gerenciar headlines" ON public.hero_headlines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para Depoimentos
CREATE POLICY "Depoimentos são visíveis por todos" ON public.depoimentos FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode gerenciar depoimentos" ON public.depoimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para Cursos
CREATE POLICY "Cursos são visíveis por todos" ON public.cursos FOR SELECT USING (true);
CREATE POLICY "Apenas admin pode gerenciar cursos" ON public.cursos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para Leads
CREATE POLICY "Qualquer um pode enviar leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admin pode gerenciar leads" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_headlines;
