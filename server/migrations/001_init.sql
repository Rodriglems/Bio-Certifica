-- Migração inicial: tabelas para o App de Agroecologia

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS agricultores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  comunidade text NOT NULL,
  municipio text NOT NULL,
  telefone text,
  tamanho_propriedade text,
  producoes text,
  como_chegar_propriedade text,
  foto_propriedade_data_url text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Credencial simples (PIN) por agricultor.
-- A aplicação atual não usa login por usuário; esta tabela permite evoluir sem perder compatibilidade.
CREATE TABLE IF NOT EXISTS credenciais_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agricultor_id uuid NOT NULL UNIQUE REFERENCES agricultores(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS safras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agricultor_id uuid NOT NULL REFERENCES agricultores(id) ON DELETE CASCADE,
  cultura_principal text NOT NULL,
  tipo_semente text NOT NULL,
  sistema_cultivo text NOT NULL,
  area_plantada text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS safras_agricultor_id_idx ON safras(agricultor_id);

CREATE TABLE IF NOT EXISTS respostas_anuais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agricultor_id uuid NOT NULL REFERENCES agricultores(id) ON DELETE CASCADE,
  ano int NOT NULL,
  teve_mudancas boolean NOT NULL,
  detalhes_mudancas text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT respostas_anuais_agricultor_ano_uk UNIQUE (agricultor_id, ano)
);

CREATE INDEX IF NOT EXISTS respostas_anuais_agricultor_id_idx ON respostas_anuais(agricultor_id);

CREATE TABLE IF NOT EXISTS registros_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- id gerado no front (Date.now().toString()) para facilitar import/export
  id_registro_cliente text,

  agricultor_id uuid NOT NULL REFERENCES agricultores(id) ON DELETE CASCADE,
  registrado_em timestamptz NOT NULL,
  tipo_atividade text NOT NULL,
  location text NOT NULL,
  destination text NOT NULL,

  production jsonb,
  detalhes_destino jsonb,
  costs jsonb,
  labor jsonb NOT NULL,
  condicoes_campo jsonb NOT NULL,
  observations text,

  criado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT registros_diarios_agricultor_id_cliente_uk UNIQUE (agricultor_id, id_registro_cliente)
);

CREATE INDEX IF NOT EXISTS registros_diarios_agricultor_registrado_em_idx ON registros_diarios(agricultor_id, registrado_em DESC);
