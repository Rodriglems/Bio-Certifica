import { Pool } from 'pg';

function asBoolean(value: string | undefined, defaultValue = false) {
  if (value == null) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const connectionString = process.env.DATABASE_URL;

const useSsl = asBoolean(process.env.DATABASE_SSL, false);
const rejectUnauthorized = asBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, true);

export const pool: Pool = connectionString
  ? new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized } : undefined,
    })
  : (({
      async query() {
        throw new Error('DATABASE_URL não definido. Crie um .env com DATABASE_URL=postgres://...');
      },
    }) as unknown as Pool);

if (!connectionString) {
  // Mantém o servidor vivo (evita ECONNREFUSED no proxy do Vite)
  // e devolve erro 500 com mensagem clara nas rotas que usam o banco.
  console.warn('[db] DATABASE_URL não definido; rotas que usam Postgres vão falhar até configurar o .env');
}
