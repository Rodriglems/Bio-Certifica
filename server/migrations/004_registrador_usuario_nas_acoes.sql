-- Garante rastreabilidade do registrador (usuário autenticado)
-- nas ações gravadas no banco.

ALTER TABLE safras
  ADD COLUMN IF NOT EXISTS registrador_usuario_id uuid REFERENCES usuarios_auth(id) ON DELETE RESTRICT;

ALTER TABLE respostas_anuais
  ADD COLUMN IF NOT EXISTS registrador_usuario_id uuid REFERENCES usuarios_auth(id) ON DELETE RESTRICT;

ALTER TABLE registros_diarios
  ADD COLUMN IF NOT EXISTS registrador_usuario_id uuid REFERENCES usuarios_auth(id) ON DELETE RESTRICT;

UPDATE safras s
SET registrador_usuario_id = ua.id
FROM usuarios_auth ua
WHERE ua.agricultor_id = s.agricultor_id
  AND s.registrador_usuario_id IS NULL;

UPDATE respostas_anuais ra
SET registrador_usuario_id = ua.id
FROM usuarios_auth ua
WHERE ua.agricultor_id = ra.agricultor_id
  AND ra.registrador_usuario_id IS NULL;

UPDATE registros_diarios rd
SET registrador_usuario_id = ua.id
FROM usuarios_auth ua
WHERE ua.agricultor_id = rd.agricultor_id
  AND rd.registrador_usuario_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM safras
    WHERE registrador_usuario_id IS NULL
  ) THEN
    ALTER TABLE safras
      ALTER COLUMN registrador_usuario_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM respostas_anuais
    WHERE registrador_usuario_id IS NULL
  ) THEN
    ALTER TABLE respostas_anuais
      ALTER COLUMN registrador_usuario_id SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM registros_diarios
    WHERE registrador_usuario_id IS NULL
  ) THEN
    ALTER TABLE registros_diarios
      ALTER COLUMN registrador_usuario_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS safras_registrador_usuario_id_idx
  ON safras (registrador_usuario_id);

CREATE INDEX IF NOT EXISTS respostas_anuais_registrador_usuario_id_idx
  ON respostas_anuais (registrador_usuario_id);

CREATE INDEX IF NOT EXISTS registros_diarios_registrador_usuario_id_idx
  ON registros_diarios (registrador_usuario_id);
