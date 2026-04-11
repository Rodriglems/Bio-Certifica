-- Sessões persistidas (evita logout ao reiniciar o backend)

CREATE TABLE IF NOT EXISTS auth_sessions (
  token text PRIMARY KEY,
  agricultor_id uuid NOT NULL REFERENCES agricultores(id) ON DELETE CASCADE,
  usuario_auth_id uuid NOT NULL REFERENCES usuarios_auth(id) ON DELETE CASCADE,
  username text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_agricultor_id_idx ON auth_sessions(agricultor_id);
