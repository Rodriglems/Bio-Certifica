-- Renomeia colunas remanescentes em PT na tabela registros_diarios

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'location'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN location TO local;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'destination'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN destination TO destino;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'production'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN production TO producao;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'costs'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN costs TO custos;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'labor'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN labor TO mao_de_obra;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'registros_diarios' AND column_name = 'observations'
  ) THEN
    ALTER TABLE registros_diarios RENAME COLUMN observations TO observacoes;
  END IF;
END $$;
