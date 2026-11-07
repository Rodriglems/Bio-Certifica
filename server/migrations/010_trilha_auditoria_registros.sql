-- Trilha de auditoria: excluir não apaga o registro, e a data da atividade
-- passa a ser separada do momento em que ela foi lançada no aplicativo.

ALTER TABLE registros_diarios
  ADD COLUMN IF NOT EXISTS lancado_em timestamptz,
  ADD COLUMN IF NOT EXISTS excluido_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_exclusao text;

UPDATE registros_diarios SET lancado_em = criado_em WHERE lancado_em IS NULL;

ALTER TABLE registros_diarios
  ALTER COLUMN lancado_em SET DEFAULT now(),
  ALTER COLUMN lancado_em SET NOT NULL;

CREATE INDEX IF NOT EXISTS registros_diarios_excluidos_idx
  ON registros_diarios (agricultor_id, excluido_em)
  WHERE excluido_em IS NOT NULL;
