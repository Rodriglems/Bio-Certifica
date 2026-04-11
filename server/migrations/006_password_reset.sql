-- Reset de senha por e-mail

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_auth_id uuid NOT NULL REFERENCES usuarios_auth(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_requests_usuario_auth_id_idx ON password_reset_requests(usuario_auth_id);
CREATE INDEX IF NOT EXISTS password_reset_requests_expires_at_idx ON password_reset_requests(expires_at);
