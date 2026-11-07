-- Conta tentativas de validação de cada código de recuperação de senha

ALTER TABLE password_reset_requests
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
