-- Autenticação multiusuário (usuário/e-mail + senha)

CREATE TABLE IF NOT EXISTS usuarios_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agricultor_id uuid NOT NULL UNIQUE REFERENCES agricultores(id) ON DELETE CASCADE,
  username text NOT NULL,
  email text,
  password_hash text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_username_uk ON usuarios_auth (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_email_uk ON usuarios_auth (lower(email)) WHERE email IS NOT NULL;

-- Backfill básico para compatibilidade com bancos já existentes:
-- cria credenciais por agricultor para que possam definir senha depois.
INSERT INTO usuarios_auth (agricultor_id, username)
SELECT a.id, lower(regexp_replace(a.nome, '[^a-zA-Z0-9]+', '_', 'g')) || '_' || substr(a.id::text, 1, 6)
FROM agricultores a
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios_auth ua WHERE ua.agricultor_id = a.id
);
