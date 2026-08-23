-- Mantém a listagem paginada de registros ordenada e rápida.
CREATE INDEX IF NOT EXISTS registros_diarios_agricultor_registrado_em_id_idx
  ON registros_diarios (agricultor_id, registrado_em DESC, id DESC);
