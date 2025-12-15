-- =====================================================
-- MIGRATION: Sistema de Planos e Sprints
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Criar tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de demandas padrão por plano/sprint
CREATE TABLE IF NOT EXISTS plan_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  sprint_number INTEGER NOT NULL CHECK (sprint_number >= 0 AND sprint_number <= 15),
  title TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, sprint_number, title)
);

-- 2.0 Ajuste de constraint para bases já criadas (permitir Sprint 0)
ALTER TABLE plan_tasks
  DROP CONSTRAINT IF EXISTS plan_tasks_sprint_number_check;
ALTER TABLE plan_tasks
  ADD CONSTRAINT plan_tasks_sprint_number_check CHECK (sprint_number >= 0 AND sprint_number <= 15);

 -- 2.1 Subtarefas por demanda (template)
 CREATE TABLE IF NOT EXISTS plan_task_steps (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   plan_task_id UUID NOT NULL REFERENCES plan_tasks(id) ON DELETE CASCADE,
   step_order INTEGER NOT NULL DEFAULT 1,
   title TEXT NOT NULL,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(plan_task_id, step_order)
 );

-- 3. Adicionar colunas na tabela clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS current_sprint INTEGER DEFAULT 0 CHECK (current_sprint >= 0 AND current_sprint <= 15);

-- 3.0 Ajuste de constraint para bases já criadas (permitir Sprint 0)
ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_current_sprint_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_current_sprint_check CHECK (current_sprint >= 0 AND current_sprint <= 15);

-- 4. Inserir planos padrão
INSERT INTO plans (name, description) VALUES
  ('Ifood', 'Plano básico para parceiros Ifood'),
  ('Silver', 'Plano intermediário com mais demandas'),
  ('Gold', 'Plano premium com todas as demandas')
ON CONFLICT (name) DO NOTHING;

 -- 4.1 Colunas extras em client_tasks para suportar template + contador de alterações
 ALTER TABLE client_tasks
 ADD COLUMN IF NOT EXISTS template_plan_task_id UUID REFERENCES plan_tasks(id) ON DELETE SET NULL;

 ALTER TABLE client_tasks
 ADD COLUMN IF NOT EXISTS alteration_count INTEGER NOT NULL DEFAULT 0;

 -- 4.2 Subtarefas reais por tarefa do cliente
 CREATE TABLE IF NOT EXISTS client_task_steps (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   task_id UUID NOT NULL REFERENCES client_tasks(id) ON DELETE CASCADE,
   step_order INTEGER NOT NULL DEFAULT 1,
   title TEXT NOT NULL,
   done BOOLEAN NOT NULL DEFAULT false,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   UNIQUE(task_id, step_order)
 );

-- 5. Habilitar RLS (Row Level Security) - opcional mas recomendado
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tasks ENABLE ROW LEVEL SECURITY;

 ALTER TABLE plan_task_steps ENABLE ROW LEVEL SECURITY;
 ALTER TABLE client_task_steps ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir leitura pública (ajuste conforme necessário)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'Allow public read plans'
  ) THEN
    CREATE POLICY "Allow public read plans" ON plans FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_tasks' AND policyname = 'Allow public read plan_tasks'
  ) THEN
    CREATE POLICY "Allow public read plan_tasks" ON plan_tasks FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'Allow public insert plans'
  ) THEN
    CREATE POLICY "Allow public insert plans" ON plans FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'Allow public update plans'
  ) THEN
    CREATE POLICY "Allow public update plans" ON plans FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plans' AND policyname = 'Allow public delete plans'
  ) THEN
    CREATE POLICY "Allow public delete plans" ON plans FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_tasks' AND policyname = 'Allow public insert plan_tasks'
  ) THEN
    CREATE POLICY "Allow public insert plan_tasks" ON plan_tasks FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_tasks' AND policyname = 'Allow public update plan_tasks'
  ) THEN
    CREATE POLICY "Allow public update plan_tasks" ON plan_tasks FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_tasks' AND policyname = 'Allow public delete plan_tasks'
  ) THEN
    CREATE POLICY "Allow public delete plan_tasks" ON plan_tasks FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_task_steps' AND policyname = 'Allow public read plan_task_steps'
  ) THEN
    CREATE POLICY "Allow public read plan_task_steps" ON plan_task_steps FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_task_steps' AND policyname = 'Allow public insert plan_task_steps'
  ) THEN
    CREATE POLICY "Allow public insert plan_task_steps" ON plan_task_steps FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_task_steps' AND policyname = 'Allow public update plan_task_steps'
  ) THEN
    CREATE POLICY "Allow public update plan_task_steps" ON plan_task_steps FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plan_task_steps' AND policyname = 'Allow public delete plan_task_steps'
  ) THEN
    CREATE POLICY "Allow public delete plan_task_steps" ON plan_task_steps FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_task_steps' AND policyname = 'Allow public read client_task_steps'
  ) THEN
    CREATE POLICY "Allow public read client_task_steps" ON client_task_steps FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_task_steps' AND policyname = 'Allow public insert client_task_steps'
  ) THEN
    CREATE POLICY "Allow public insert client_task_steps" ON client_task_steps FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_task_steps' AND policyname = 'Allow public update client_task_steps'
  ) THEN
    CREATE POLICY "Allow public update client_task_steps" ON client_task_steps FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_task_steps' AND policyname = 'Allow public delete client_task_steps'
  ) THEN
    CREATE POLICY "Allow public delete client_task_steps" ON client_task_steps FOR DELETE USING (true);
  END IF;
END$$;

-- =====================================================
-- VERIFICAÇÃO: Execute para ver se funcionou
-- =====================================================
-- SELECT * FROM plans;
-- SELECT * FROM plan_tasks;
-- SELECT id, name, slug, plan_id, current_sprint FROM clients;
