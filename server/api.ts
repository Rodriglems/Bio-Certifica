  import 'dotenv/config';
  import crypto from 'node:crypto';
  import { sendPasswordResetEmail } from './email';
  import express from 'express';
  import { pool } from './db';

  const app = express();
  app.disable('etag');
  app.use(express.json({ limit: '10mb' }));

  const defaultCorsOrigins = ['http://localhost:5173', 'http://localhost', 'capacitor://localhost'];
  const configuredCorsOrigins = String(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedCorsOrigins = new Set([...defaultCorsOrigins, ...configuredCorsOrigins]);
  const allowAllCorsOrigins = allowedCorsOrigins.has('*');

  app.use((req, res, next) => {
    const origin = req.header('origin');
    const isAllowedOrigin = !!origin && (allowAllCorsOrigins || allowedCorsOrigins.has(origin));

    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowAllCorsOrigins ? '*' : origin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
      if (!origin || isAllowedOrigin) {
        res.status(204).end();
        return;
      }
      res.status(403).json({ ok: false, error: 'Origem não permitida por CORS' });
      return;
    }

    if (origin && !isAllowedOrigin) {
      res.status(403).json({ ok: false, error: 'Origem não permitida por CORS' });
      return;
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  const DEBUG_API = ['1', 'true', 'yes', 'on'].includes(String(process.env.DEBUG_API ?? '').toLowerCase());

  function debugLog(message: string, data?: unknown) {
    if (!DEBUG_API) return;
    if (typeof data === 'undefined') {
      console.log(message);
      return;
    }
    try {
      console.log(message, JSON.stringify(data));
    } catch {
      console.log(message, data);
    }
  }

  const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
  const sessions = new Map<string, { agricultorId: string; usuarioAuthId: string; username: string; expiresAt: number }>();
  const COLUMNS_CACHE_TTL_MS = 5_000;
  const tableColumnsCache = new Map<string, { expiresAt: number; promise: Promise<Set<string>> }>();

  type Session = { token: string; agricultorId: string; usuarioAuthId: string; username: string; expiresAt: number };

  function sessionExpiryDate() {
    return new Date(Date.now() + SESSION_TTL_MS);
  }

  type RegistrosDiariosColumnMap = {
    local: string;
    destino: string;
    producao: string;
    custos: string;
    maoDeObra: string;
    observacoes: string;
    hasRegistrador: boolean;
  };

  function normalizeText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function normalizePhone(value: unknown) {
    return String(value ?? '').replace(/\D/g, '');
  }

  function normalizeIdentifier(value: unknown) {
    return normalizeText(value).toLowerCase();
  }

  function getSafeForgotPasswordErrorMessage(error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error ?? '');
    const lower = rawMessage.toLowerCase();
    if (lower.includes('invalid login') || lower.includes('badcredentials') || lower.includes('username and password not accepted')) {
      return 'Falha ao enviar e-mail: verifique SMTP_USER e SMTP_PASS (senha de app do Gmail).';
    }
    return 'Não foi possível enviar o código no momento. Tente novamente.';
  }

  function hashPassword(password: string) {
    const cleaned = normalizeText(password);
    if (cleaned.length < 6) throw new Error('Senha deve ter no mínimo 6 caracteres');

    const salt = crypto.randomBytes(16);
    const derived = crypto.scryptSync(cleaned, salt, 64);
    return `${salt.toString('base64')}:${derived.toString('base64')}`;
  }

  function generateResetCode(length = 6) {
    const max = 10 ** length;
    const value = crypto.randomInt(0, max);
    return String(value).padStart(length, '0');
  }


  async function createPasswordResetRequest(usuarioAuthId: string, code: string) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);
    const codeHash = hashPassword(code);
    const result = await pool.query<{ id: string }>(
      `
      INSERT INTO password_reset_requests (usuario_auth_id, code_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
      `.trim(),
      [usuarioAuthId, codeHash, expiresAt.toISOString()],
    );
    return { id: result.rows[0]?.id, expiresAt };
  }

  function verifyPassword(password: string, stored: string) {
    const cleaned = normalizeText(password);
    if (cleaned.length < 6) return false;

    const [saltB64, hashB64] = String(stored).split(':');
    if (!saltB64 || !hashB64) return false;

    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const derived = crypto.scryptSync(cleaned, salt, expected.length);

    return crypto.timingSafeEqual(derived, expected);
  }

  async function issueSession(agricultorId: string, usuarioAuthId: string, username: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = sessionExpiryDate();
    await pool.query(
      `
      INSERT INTO auth_sessions (token, agricultor_id, usuario_auth_id, username, expires_at)
      VALUES ($1,$2,$3,$4,$5)
      `.trim(),
      [token, agricultorId, usuarioAuthId, username, expiresAt.toISOString()],
    );

    sessions.set(token, { agricultorId, usuarioAuthId, username, expiresAt: expiresAt.getTime() });
    return token;
  }

  async function getSessionFromRequest(req: express.Request): Promise<Session | null> {
    const authHeader = req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      debugLog('[auth] missing Authorization header');
      return null;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      debugLog('[auth] empty Bearer token');
      return null;
    }

    const tokenHint = `${token.slice(0, 8)}…`;

    const cached = sessions.get(token);
    if (cached && cached.expiresAt >= Date.now()) {
      const newExpiry = sessionExpiryDate();
      sessions.set(token, { ...cached, expiresAt: newExpiry.getTime() });
      try {
        await pool.query('UPDATE auth_sessions SET expires_at = $2 WHERE token = $1', [token, newExpiry.toISOString()]);
      } catch {
        // ignora falhas de renovação; será revalidado no banco na próxima vez
      }
      return { token, ...sessions.get(token)! };
    }

    const result = await pool.query<{
      token: string;
      agricultor_id: string;
      usuario_auth_id: string;
      username: string;
      expires_at: Date;
    }>(
      `
      SELECT token, agricultor_id, usuario_auth_id, username, expires_at
      FROM auth_sessions
      WHERE token = $1 AND expires_at > now()
      `.trim(),
      [token],
    );

    const row = result.rows[0];
    if (!row) {
      debugLog('[auth] invalid/expired token', { token: tokenHint });
      sessions.delete(token);
      return null;
    }

    const newExpiry = sessionExpiryDate();
    await pool.query('UPDATE auth_sessions SET expires_at = $2 WHERE token = $1', [token, newExpiry.toISOString()]);

    const session = {
      agricultorId: row.agricultor_id,
      usuarioAuthId: row.usuario_auth_id,
      username: row.username,
      expiresAt: newExpiry.getTime(),
    };
    sessions.set(token, session);
    debugLog('[auth] session ok', {
      token: tokenHint,
      agricultorId: session.agricultorId,
      usuarioAuthId: session.usuarioAuthId,
      username: session.username,
    });
    return { token, ...session };
  }

  async function requireSession(req: express.Request, res: express.Response) {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        res.status(401).json({ ok: false, error: 'Não autenticado' });
        return null;
      }
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
      return null;
    }
  }

  async function getTableColumns(tableName: string) {
    const now = Date.now();
    const cached = tableColumnsCache.get(tableName);
    if (cached && cached.expiresAt > now) return cached.promise;

    const promise = pool
      .query<{ column_name: string }>(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        `.trim(),
        [tableName],
      )
      .then((result: { rows: Array<{ column_name: string }> }) => new Set(result.rows.map((row) => row.column_name)));

    tableColumnsCache.set(tableName, { expiresAt: now + COLUMNS_CACHE_TTL_MS, promise });
    promise.catch(() => {
      tableColumnsCache.delete(tableName);
    });
    return promise;
  }

  async function tableHasColumn(tableName: string, columnName: string) {
    const columns = await getTableColumns(tableName);
    return columns.has(columnName);
  }

  async function getRegistrosDiariosColumnMap(): Promise<RegistrosDiariosColumnMap> {
    const columns = await getTableColumns('registros_diarios');

    const local = columns.has('local') ? 'local' : columns.has('location') ? 'location' : null;
    const destino = columns.has('destino') ? 'destino' : columns.has('destination') ? 'destination' : null;
    const producao = columns.has('producao') ? 'producao' : columns.has('production') ? 'production' : null;
    const custos = columns.has('custos') ? 'custos' : columns.has('costs') ? 'costs' : null;
    const maoDeObra = columns.has('mao_de_obra') ? 'mao_de_obra' : columns.has('labor') ? 'labor' : null;
    const observacoes = columns.has('observacoes') ? 'observacoes' : columns.has('observations') ? 'observations' : null;

    if (!local || !destino || !producao || !custos || !maoDeObra || !observacoes) {
      throw new Error('Schema de registros_diarios incompatível: colunas obrigatórias ausentes');
    }

    return {
      local,
      destino,
      producao,
      custos,
      maoDeObra,
      observacoes,
      hasRegistrador: columns.has('registrador_usuario_id'),
    };
  }

  type AgricultorRow = {
    id: string;
    nome: string;
    comunidade: string;
    municipio: string;
    telefone: string | null;
    tamanho_propriedade: string | null;
    producoes: string | null;
    como_chegar_propriedade: string | null;
    foto_propriedade_data_url: string | null;
  };

  type UsuarioAuthRow = {
    id: string;
    agricultor_id: string;
    username: string;
    email: string | null;
    password_hash: string | null;
  };

  async function getAgricultorById(id: string) {
    const result = await pool.query<AgricultorRow>(
      `
      SELECT
        id,
        nome,
        comunidade,
        municipio,
        telefone,
        tamanho_propriedade,
        producoes,
        como_chegar_propriedade,
        foto_propriedade_data_url
      FROM agricultores
      WHERE id = $1
      `.trim(),
      [id],
    );
    return result.rows[0];
  }

  async function getUserByIdentifier(identifier: string) {
    const normalized = normalizeIdentifier(identifier);
    const result = await pool.query<
      UsuarioAuthRow & {
        nome: string;
        comunidade: string;
        municipio: string;
        telefone: string | null;
        tamanho_propriedade: string | null;
        producoes: string | null;
        como_chegar_propriedade: string | null;
        foto_propriedade_data_url: string | null;
      }
    >(
      `
      SELECT
        ua.id,
        ua.agricultor_id,
        ua.username,
        ua.email,
        ua.password_hash,
        a.nome,
        a.comunidade,
        a.municipio,
        a.telefone,
        a.tamanho_propriedade,
        a.producoes,
        a.como_chegar_propriedade,
        a.foto_propriedade_data_url
      FROM usuarios_auth ua
      INNER JOIN agricultores a ON a.id = ua.agricultor_id
      WHERE lower(ua.username) = $1 OR lower(coalesce(ua.email, '')) = $1
      LIMIT 1
      `.trim(),
      [normalized],
    );
    return result.rows[0];
  }

  async function getUserByEmail(email: string) {
    const normalized = normalizeIdentifier(email);
    const result = await pool.query<
      UsuarioAuthRow & {
        nome: string;
        comunidade: string;
        municipio: string;
        telefone: string | null;
        tamanho_propriedade: string | null;
        producoes: string | null;
        como_chegar_propriedade: string | null;
        foto_propriedade_data_url: string | null;
      }
    >(
      `
      SELECT
        ua.id,
        ua.agricultor_id,
        ua.username,
        ua.email,
        ua.password_hash,
        a.nome,
        a.comunidade,
        a.municipio,
        a.telefone,
        a.tamanho_propriedade,
        a.producoes,
        a.como_chegar_propriedade,
        a.foto_propriedade_data_url
      FROM usuarios_auth ua
      INNER JOIN agricultores a ON a.id = ua.agricultor_id
      WHERE lower(ua.email) = $1
      LIMIT 1
      `.trim(),
      [normalized],
    );
    return result.rows[0];
  }

  async function getLatestValidPasswordResetRequest(usuarioAuthId: string) {
    const resetResult = await pool.query<{
      id: string;
      code_hash: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `
      SELECT id, code_hash, expires_at, used_at
      FROM password_reset_requests
      WHERE usuario_auth_id = $1
        AND used_at IS NULL
        AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1
      `.trim(),
      [usuarioAuthId],
    );

    return resetResult.rows[0];
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/db-check', async (_req, res) => {
    try {
      const result = await pool.query('select 1 as ok');
      res.json({ ok: true, db: result.rows?.[0] ?? null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/agricultor', async (req, res) => {
    const {
      name,
      community,
      municipality,
      phone,
      propertySize,
      produces,
      accessDirections,
      propertyPhotoDataUrl,
      username,
      email,
      password,
    } = req.body ?? {};

    const cleanName = normalizeText(name);
    const cleanCommunity = normalizeText(community);
    const cleanMunicipality = normalizeText(municipality);
    const cleanUsername = normalizeIdentifier(username);
    const cleanEmail = normalizeIdentifier(email) || null;
    const cleanPassword = normalizeText(password);

    if (!cleanName || !cleanCommunity || !cleanMunicipality || !cleanUsername || !cleanPassword) {
      res.status(400).json({
        ok: false,
        error: 'Campos obrigatórios: name, community, municipality, username, password',
      });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ ok: false, error: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const agricultorInsert = await client.query<{ id: string }>(
        `
        INSERT INTO agricultores (
          nome,
          comunidade,
          municipio,
          telefone,
          tamanho_propriedade,
          producoes,
          como_chegar_propriedade,
          foto_propriedade_data_url
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
        `.trim(),
        [
          cleanName,
          cleanCommunity,
          cleanMunicipality,
          normalizeText(phone) || null,
          normalizeText(propertySize) || null,
          normalizeText(produces) || null,
          normalizeText(accessDirections) || null,
          normalizeText(propertyPhotoDataUrl) || null,
        ],
      );

      const agricultorId = agricultorInsert.rows[0]?.id;
      if (!agricultorId) throw new Error('Falha ao criar agricultor');

      const usuarioAuthInsert = await client.query<{ id: string }>(
        `
        INSERT INTO usuarios_auth (agricultor_id, username, email, password_hash)
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `.trim(),
        [agricultorId, cleanUsername, cleanEmail, hashPassword(cleanPassword)],
      );

      const usuarioAuthId = usuarioAuthInsert.rows[0]?.id;
      if (!usuarioAuthId) throw new Error('Falha ao criar credencial do usuário');

      await client.query('COMMIT');

      const token = await issueSession(agricultorId, usuarioAuthId, cleanUsername);
      res.status(201).json({
        ok: true,
        agricultorId,
        token,
        user: {
          agricultorId,
          usuarioAuthId,
          username: cleanUsername,
          email: cleanEmail,
          name: cleanName,
        },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error?.code === '23505') {
        res.status(409).json({ ok: false, error: 'Nome de usuário ou e-mail já está em uso' });
        return;
      }
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    } finally {
      client.release();
    }
  });

  app.put('/api/agricultor', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    const { name, community, municipality, phone, propertySize, produces, accessDirections, propertyPhotoDataUrl } = req.body ?? {};
    if (!name || !community || !municipality) {
      res.status(400).json({ ok: false, error: 'Campos obrigatórios: name, community, municipality' });
      return;
    }

    try {
      await pool.query(
        `
        UPDATE agricultores
        SET
          nome = $2,
          comunidade = $3,
          municipio = $4,
          telefone = $5,
          tamanho_propriedade = $6,
          producoes = $7,
          como_chegar_propriedade = $8,
          foto_propriedade_data_url = $9,
          atualizado_em = now()
        WHERE id = $1
        `.trim(),
        [
          session.agricultorId,
          String(name),
          String(community),
          String(municipality),
          normalizeText(phone) || null,
          normalizeText(propertySize) || null,
          normalizeText(produces) || null,
          normalizeText(accessDirections) || null,
          normalizeText(propertyPhotoDataUrl) || null,
        ],
      );

      res.json({ ok: true, agricultorId: session.agricultorId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body ?? {};

    if (!identifier || !password) {
      res.status(400).json({ ok: false, error: 'identifier e password são obrigatórios' });
      return;
    }

    try {
      debugLog('[login] attempt', { identifier: normalizeIdentifier(identifier) });
      const user = await getUserByIdentifier(String(identifier));
      if (!user?.password_hash) {
        debugLog('[login] unauthorized: user not found or no password_hash', {
          found: !!user,
          hasPasswordHash: !!user?.password_hash,
        });
        res.status(401).json({ ok: false, error: 'Usuário/senha inválidos' });
        return;
      }

      if (!verifyPassword(String(password), user.password_hash)) {
        debugLog('[login] unauthorized: password mismatch', { userId: user.id, agricultorId: user.agricultor_id });
        res.status(401).json({ ok: false, error: 'Usuário/senha inválidos' });
        return;
      }

      const token = await issueSession(user.agricultor_id, user.id, user.username);
      res.json({
        ok: true,
        token,
        user: {
          agricultorId: user.agricultor_id,
          usuarioAuthId: user.id,
          username: user.username,
          email: user.email,
          name: user.nome,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/logout', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (session) {
        sessions.delete(session.token);
        await pool.query('DELETE FROM auth_sessions WHERE token = $1', [session.token]);
      }
    } catch {
      // ignora
    }
    res.json({ ok: true });
  });

  app.post('/api/password/change', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    const { currentPassword, newPassword } = req.body ?? {};
    const cleanNewPassword = normalizeText(newPassword);

    if (cleanNewPassword.length < 6) {
      res.status(400).json({ ok: false, error: 'A nova senha deve ter no mínimo 6 caracteres' });
      return;
    }

    try {
      const userResult = await pool.query<UsuarioAuthRow>(
        `
        SELECT id, agricultor_id, username, email, password_hash
        FROM usuarios_auth
        WHERE agricultor_id = $1
        LIMIT 1
        `.trim(),
        [session.agricultorId],
      );

      const user = userResult.rows[0];
      if (!user) {
        res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
        return;
      }

      if (user.password_hash) {
        const currentOk = verifyPassword(String(currentPassword ?? ''), user.password_hash);
        if (!currentOk) {
          res.status(401).json({ ok: false, error: 'Senha atual incorreta' });
          return;
        }
      }

      await pool.query('UPDATE usuarios_auth SET password_hash = $2 WHERE agricultor_id = $1', [
        session.agricultorId,
        hashPassword(cleanNewPassword),
      ]);

      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/password/forgot', async (req, res) => {
    const { email } = req.body ?? {};
    const cleanEmail = normalizeIdentifier(email);

    if (!cleanEmail) {
      res.status(400).json({ ok: false, error: 'E-mail é obrigatório' });
      return;
    }

    try {
      const user = await getUserByEmail(cleanEmail);
      if (!user || !user.email) {
        res.status(404).json({ ok: false, error: 'E-mail não encontrado' });
        return;
      }

      const code = generateResetCode(6);
      await createPasswordResetRequest(user.id, code);
      await sendPasswordResetEmail(user.email, code, user.nome);

      res.json({ ok: true });
    } catch (error) {
      const message = getSafeForgotPasswordErrorMessage(error);
      console.error('[password/forgot]', error);
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/password/verify-code', async (req, res) => {
    const { email, code } = req.body ?? {};

    const cleanEmail = normalizeIdentifier(email);
    const cleanCode = normalizeText(code);

    if (!cleanEmail || !cleanCode || cleanCode.length < 4) {
      res.status(400).json({ ok: false, error: 'Dados inválidos' });
      return;
    }

    try {
      const user = await getUserByEmail(cleanEmail);
      if (!user) {
        res.status(404).json({ ok: false, error: 'E-mail não encontrado' });
        return;
      }

      const resetRow = await getLatestValidPasswordResetRequest(user.id);
      if (!resetRow) {
        res.status(400).json({ ok: false, error: 'Código inválido ou expirado' });
        return;
      }

      if (!verifyPassword(cleanCode, resetRow.code_hash)) {
        res.status(400).json({ ok: false, error: 'Código inválido ou expirado' });
        return;
      }

      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/password/reset', async (req, res) => {
    const { email, code, newPassword } = req.body ?? {};

    const cleanEmail = normalizeIdentifier(email);
    const cleanCode = normalizeText(code);
    const cleanNewPassword = normalizeText(newPassword);

    if (!cleanEmail || !cleanCode || cleanCode.length < 4 || cleanNewPassword.length < 6) {
      res.status(400).json({ ok: false, error: 'Dados inválidos' });
      return;
    }

    try {
      const user = await getUserByIdentifier(cleanEmail);
      if (!user) {
        res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
        return;
      }

      const resetRow = await getLatestValidPasswordResetRequest(user.id);
      if (!resetRow) {
        res.status(400).json({ ok: false, error: 'Código inválido ou expirado' });
        return;
      }

      if (!verifyPassword(cleanCode, resetRow.code_hash)) {
        res.status(400).json({ ok: false, error: 'Código inválido ou expirado' });
        return;
      }

      const newHash = hashPassword(cleanNewPassword);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE usuarios_auth SET password_hash = $2 WHERE id = $1', [user.id, newHash]);
        await client.query('UPDATE password_reset_requests SET used_at = now() WHERE id = $1', [resetRow.id]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.get('/api/app-data', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      debugLog('[app-data] session', {
        agricultorId: session.agricultorId,
        usuarioAuthId: session.usuarioAuthId,
        username: session.username,
      });

      const agricultor = await getAgricultorById(session.agricultorId);
      if (!agricultor) {
        res.status(404).json({ ok: false, error: 'Agricultor não encontrado' });
        return;
      }

      const farmer = {
        name: agricultor.nome,
        community: agricultor.comunidade,
        municipality: agricultor.municipio,
        phone: agricultor.telefone ?? undefined,
        propertySize: agricultor.tamanho_propriedade ?? undefined,
        produces: agricultor.producoes ?? undefined,
        accessDirections: agricultor.como_chegar_propriedade ?? undefined,
        propertyPhotoDataUrl: agricultor.foto_propriedade_data_url ?? undefined,
      };

      const harvestResult = await pool.query(
        `
        SELECT cultura_principal, tipo_semente, sistema_cultivo, area_plantada
        FROM safras
        WHERE agricultor_id = $1
        ORDER BY criado_em DESC
        LIMIT 1
        `.trim(),
        [agricultor.id],
      );
      const harvestRow = harvestResult.rows[0] as
        | {
            cultura_principal: string;
            tipo_semente: string;
            sistema_cultivo: string;
            area_plantada: string;
          }
        | undefined;

      const harvest = harvestRow
        ? {
            mainCrop: harvestRow.cultura_principal,
            seedType: harvestRow.tipo_semente,
            cultivationSystem: harvestRow.sistema_cultivo,
            plantedArea: harvestRow.area_plantada,
          }
        : null;

      const annualResult = await pool.query(
        `
        SELECT ano, teve_mudancas, detalhes_mudancas
        FROM respostas_anuais
        WHERE agricultor_id = $1
        `.trim(),
        [agricultor.id],
      );

      const annual: Record<string, { year: number; hadChanges: boolean; changesDetails?: string }> = {};
      for (const row of annualResult.rows as Array<{ ano: number; teve_mudancas: boolean; detalhes_mudancas: string | null }>) {
        annual[String(row.ano)] = {
          year: row.ano,
          hadChanges: row.teve_mudancas,
          changesDetails: row.detalhes_mudancas ?? undefined,
        };
      }

      type RegistroDiarioRow = {
        id: string;
        id_registro_cliente: string | null;
        registrado_em: string;
        tipo_atividade: string;
        local: string;
        destino: string;
        producao: unknown | null;
        detalhes_destino: unknown | null;
        custos: unknown | null;
        mao_de_obra: unknown;
        condicoes_campo: unknown;
        observacoes: string | null;
      };

      const registrosSchema = await getRegistrosDiariosColumnMap();

      const recordsResult = await pool.query<RegistroDiarioRow>(
        (() => {
          const sql = `
        SELECT
          id,
          id_registro_cliente,
          registrado_em,
          tipo_atividade,
          ${registrosSchema.local} as local,
          ${registrosSchema.destino} as destino,
          ${registrosSchema.producao} as producao,
          detalhes_destino,
          ${registrosSchema.custos} as custos,
          ${registrosSchema.maoDeObra} as mao_de_obra,
          condicoes_campo,
          ${registrosSchema.observacoes} as observacoes
        FROM registros_diarios
        WHERE agricultor_id = $1
        ORDER BY registrado_em DESC
        `.trim();
          debugLog('[app-data] SELECT records SQL', sql);
          debugLog('[app-data] SELECT records params', [agricultor.id]);
          return sql;
        })(),
        [agricultor.id],
      );

      const records = recordsResult.rows.map((row: RegistroDiarioRow) => ({
        id: row.id_registro_cliente?.trim() ? row.id_registro_cliente : row.id,
        date: row.registrado_em,
        activityType: row.tipo_atividade,
        production: row.producao ?? undefined,
        location: row.local,
        destination: row.destino,
        destinationDetails: row.detalhes_destino ?? undefined,
        costs: row.custos ?? undefined,
        labor: row.mao_de_obra,
        fieldConditions: row.condicoes_campo,
        observations: row.observacoes ?? undefined,
      }));

      const passwordResult = await pool.query('SELECT 1 FROM usuarios_auth WHERE agricultor_id = $1 AND password_hash IS NOT NULL', [
        agricultor.id,
      ]);

      res.json({
        ok: true,
        data: {
          farmer,
          harvest,
          records,
          annual,
          hasPasswordConfigured: passwordResult.rowCount > 0,
          user: {
            agricultorId: agricultor.id,
            usuarioAuthId: session.usuarioAuthId,
            username: session.username,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.put('/api/safra', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      const { mainCrop, seedType, cultivationSystem, plantedArea } = req.body ?? {};
      if (!mainCrop || !seedType || !cultivationSystem || !plantedArea) {
        res.status(400).json({
          ok: false,
          error: 'Campos obrigatórios: mainCrop, seedType, cultivationSystem, plantedArea',
        });
        return;
      }

      const hasRegistradorSafra = await tableHasColumn('safras', 'registrador_usuario_id');

      const safraColumns = [
        'agricultor_id',
        ...(hasRegistradorSafra ? ['registrador_usuario_id'] : []),
        'cultura_principal',
        'tipo_semente',
        'sistema_cultivo',
        'area_plantada',
      ];

      const safraValues = [
        session.agricultorId,
        ...(hasRegistradorSafra ? [session.usuarioAuthId] : []),
        String(mainCrop),
        String(seedType),
        String(cultivationSystem),
        String(plantedArea),
      ];

      const safraPlaceholders = safraValues.map((_, index) => `$${index + 1}`).join(',');

      const result = await pool.query(
        `
        INSERT INTO safras (${safraColumns.join(', ')})
        VALUES (${safraPlaceholders})
        RETURNING id
        `.trim(),
        safraValues,
      );
      res.status(201).json({ ok: true, safraId: result.rows[0]?.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.put('/api/respostas-anuais', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      const { year, hadChanges, changesDetails } = req.body ?? {};
      if (typeof year !== 'number' || typeof hadChanges !== 'boolean') {
        res.status(400).json({ ok: false, error: 'Campos obrigatórios: year (number), hadChanges (boolean)' });
        return;
      }

      const hasRegistradorAnual = await tableHasColumn('respostas_anuais', 'registrador_usuario_id');

      const anualColumns = [
        'agricultor_id',
        ...(hasRegistradorAnual ? ['registrador_usuario_id'] : []),
        'ano',
        'teve_mudancas',
        'detalhes_mudancas',
      ];

      const anualValues = [
        session.agricultorId,
        ...(hasRegistradorAnual ? [session.usuarioAuthId] : []),
        year,
        hadChanges,
        changesDetails ? String(changesDetails) : null,
      ];

      const anualPlaceholders = anualValues.map((_, index) => `$${index + 1}`).join(',');
      const updateAssignments = [
        ...(hasRegistradorAnual ? ['registrador_usuario_id = EXCLUDED.registrador_usuario_id'] : []),
        'teve_mudancas = EXCLUDED.teve_mudancas',
        'detalhes_mudancas = EXCLUDED.detalhes_mudancas',
      ];

      await pool.query(
        `
        INSERT INTO respostas_anuais (${anualColumns.join(', ')})
        VALUES (${anualPlaceholders})
        ON CONFLICT (agricultor_id, ano)
        DO UPDATE SET ${updateAssignments.join(', ')}
        `.trim(),
        anualValues,
      );

      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.post('/api/registros-diarios', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      debugLog('[registros-diarios:POST] session', {
        agricultorId: session.agricultorId,
        usuarioAuthId: session.usuarioAuthId,
        username: session.username,
      });
      debugLog('[registros-diarios:POST] payload', req.body ?? null);

      const {
        id,
        date,
        activityType,
        production,
        location,
        destination,
        destinationDetails,
        costs,
        labor,
        fieldConditions,
        observations,
      } = req.body ?? {};

      if (!date || !activityType || !location || !destination || !labor || !fieldConditions) {
        res.status(400).json({
          ok: false,
          error: 'Campos obrigatórios: date, activityType, location, destination, labor, fieldConditions',
        });
        return;
      }

      const registradoEm = new Date(String(date));
      if (Number.isNaN(registradoEm.getTime())) {
        res.status(400).json({ ok: false, error: 'date inválido (use ISO string)' });
        return;
      }

      const registrosSchema = await getRegistrosDiariosColumnMap();

      const registrosEntries: Array<{ column: string; value: unknown; jsonb?: boolean }> = [
        { column: 'id_registro_cliente', value: id ? String(id) : null },
        { column: 'agricultor_id', value: session.agricultorId },
        ...(registrosSchema.hasRegistrador
          ? [{ column: 'registrador_usuario_id', value: session.usuarioAuthId }]
          : []),
        { column: 'registrado_em', value: registradoEm.toISOString() },
        { column: 'tipo_atividade', value: String(activityType) },
        { column: registrosSchema.local, value: String(location) },
        { column: registrosSchema.destino, value: String(destination) },
        { column: registrosSchema.producao, value: production ? JSON.stringify(production) : null, jsonb: true },
        { column: 'detalhes_destino', value: destinationDetails ? JSON.stringify(destinationDetails) : null, jsonb: true },
        { column: registrosSchema.custos, value: costs ? JSON.stringify(costs) : null, jsonb: true },
        { column: registrosSchema.maoDeObra, value: JSON.stringify(labor), jsonb: true },
        { column: 'condicoes_campo', value: JSON.stringify(fieldConditions), jsonb: true },
        { column: registrosSchema.observacoes, value: observations ? String(observations) : null },
      ];

      const registrosColumns = registrosEntries.map((entry) => entry.column).join(', ');
      const registrosValues = registrosEntries.map((entry) => entry.value);
      const registrosPlaceholders = registrosEntries
        .map((entry, index) => (entry.jsonb ? `$${index + 1}::jsonb` : `$${index + 1}`))
        .join(', ');

      const registrosUpdates = [
        ...(registrosSchema.hasRegistrador
          ? ['registrador_usuario_id = EXCLUDED.registrador_usuario_id']
          : []),
        'registrado_em = EXCLUDED.registrado_em',
        'tipo_atividade = EXCLUDED.tipo_atividade',
        `${registrosSchema.local} = EXCLUDED.${registrosSchema.local}`,
        `${registrosSchema.destino} = EXCLUDED.${registrosSchema.destino}`,
        `${registrosSchema.producao} = EXCLUDED.${registrosSchema.producao}`,
        'detalhes_destino = EXCLUDED.detalhes_destino',
        `${registrosSchema.custos} = EXCLUDED.${registrosSchema.custos}`,
        `${registrosSchema.maoDeObra} = EXCLUDED.${registrosSchema.maoDeObra}`,
        'condicoes_campo = EXCLUDED.condicoes_campo',
        `${registrosSchema.observacoes} = EXCLUDED.${registrosSchema.observacoes}`,
      ];

      const insertSql = `
        INSERT INTO registros_diarios (${registrosColumns})
        VALUES (${registrosPlaceholders})
        ON CONFLICT (agricultor_id, id_registro_cliente)
        DO UPDATE SET ${registrosUpdates.join(', ')}
        RETURNING id
        `.trim();

      debugLog('[registros-diarios:POST] INSERT SQL', insertSql);
      debugLog('[registros-diarios:POST] INSERT params', registrosValues);

      const result = await pool.query(insertSql, registrosValues);

      if (DEBUG_API) {
        try {
          const count = await pool.query<{ total: string }>(
            'SELECT count(*)::text as total FROM registros_diarios WHERE agricultor_id = $1',
            [session.agricultorId],
          );
          debugLog('[registros-diarios:POST] total registros_diarios p/ agricultor', count.rows?.[0] ?? null);
        } catch {
          // ignora erros de contagem em debug
        }
      }

      res.status(201).json({ ok: true, registroId: result.rows[0]?.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.get('/api/registros-diarios', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);

      type RegistroDiarioRow = {
        id: string;
        id_registro_cliente: string | null;
        registrado_em: string;
        tipo_atividade: string;
        local: string;
        destino: string;
        producao: unknown | null;
        detalhes_destino: unknown | null;
        custos: unknown | null;
        mao_de_obra: unknown;
        condicoes_campo: unknown;
        observacoes: string | null;
      };

      const registrosSchema = await getRegistrosDiariosColumnMap();

      const result = await pool.query<RegistroDiarioRow>(
        `
        SELECT
          id,
          id_registro_cliente,
          registrado_em,
          tipo_atividade,
          ${registrosSchema.local} as local,
          ${registrosSchema.destino} as destino,
          ${registrosSchema.producao} as producao,
          detalhes_destino,
          ${registrosSchema.custos} as custos,
          ${registrosSchema.maoDeObra} as mao_de_obra,
          condicoes_campo,
          ${registrosSchema.observacoes} as observacoes
        FROM registros_diarios
        WHERE agricultor_id = $1
        ORDER BY registrado_em DESC
        LIMIT $2
        `.trim(),
        [session.agricultorId, limit],
      );

      const records = result.rows.map((row: RegistroDiarioRow) => ({
        id: row.id_registro_cliente?.trim() ? row.id_registro_cliente : row.id,
        date: row.registrado_em,
        activityType: row.tipo_atividade,
        production: row.producao ?? undefined,
        location: row.local,
        destination: row.destino,
        destinationDetails: row.detalhes_destino ?? undefined,
        costs: row.custos ?? undefined,
        labor: row.mao_de_obra,
        fieldConditions: row.condicoes_campo,
        observations: row.observacoes ?? undefined,
      }));

      res.json({ ok: true, records });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  app.delete('/api/registros-diarios/:id', async (req, res) => {
    const session = await requireSession(req, res);
    if (!session) return;

    try {
      const id = String(req.params.id ?? '').trim();
      if (!id) {
        res.status(400).json({ ok: false, error: 'id é obrigatório' });
        return;
      }

      const result = await pool.query(
        `
        DELETE FROM registros_diarios
        WHERE agricultor_id = $1
          AND (id_registro_cliente = $2 OR id::text = $2)
        `.trim(),
        [session.agricultorId, id],
      );

      if (result.rowCount === 0) {
        res.status(404).json({ ok: false, error: 'Registro não encontrado' });
        return;
      }

      res.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({ ok: false, error: message });
    }
  });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? '3001');
  app.listen(port, '0.0.0.0', () => {
    console.log(`[api] listening on port ${port}`);
  });
