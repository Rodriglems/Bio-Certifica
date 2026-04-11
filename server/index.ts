import 'dotenv/config';
import express from 'express';
import { pool } from './db';
import { hashPin, verifyPin } from './pin';

const app = express();
app.disable('etag');
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

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

async function getAgricultorAtual() {
  const result = await pool.query(
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
    ORDER BY criado_em ASC
    LIMIT 1
    `.trim(),
  );
  return result.rows[0] as
    | {
        id: string;
        nome: string;
        comunidade: string;
        municipio: string;
        telefone: string | null;
        tamanho_propriedade: string | null;
        producoes: string | null;
        como_chegar_propriedade: string | null;
        foto_propriedade_data_url: string | null;
      }
    | undefined;
}

async function hasPinConfigurado(agricultorId: string) {
  const result = await pool.query('SELECT 1 FROM credenciais_acesso WHERE agricultor_id = $1', [agricultorId]);
  return result.rowCount > 0;
}

app.get('/api/app-data', async (_req, res) => {
  try {
    const agricultor = await getAgricultorAtual();
    if (!agricultor) {
      res.json({
        ok: true,
        data: {
          farmer: null,
          harvest: null,
          records: [],
          annual: {},
          hasPinConfigured: false,
        },
      });
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

    const recordsResult = await pool.query<RegistroDiarioRow>(
      `
      SELECT
        id,
        id_registro_cliente,
        registrado_em,
        tipo_atividade,
        local,
        destino,
        producao,
        detalhes_destino,
        custos,
        mao_de_obra,
        condicoes_campo,
        observacoes
      FROM registros_diarios
      WHERE agricultor_id = $1
      ORDER BY registrado_em DESC
      `.trim(),
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

    const hasPinConfigured = await hasPinConfigurado(agricultor.id);

    res.json({ ok: true, data: { farmer, harvest, records, annual, hasPinConfigured } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.put('/api/agricultor', async (req, res) => {
  try {
    const { name, community, municipality, phone, propertySize, produces, accessDirections, propertyPhotoDataUrl } = req.body ?? {};
    if (!name || !community || !municipality) {
      res.status(400).json({ ok: false, error: 'Campos obrigatórios: name, community, municipality' });
      return;
    }

    const atual = await getAgricultorAtual();
    if (!atual) {
      const result = await pool.query(
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
          String(name),
          String(community),
          String(municipality),
          phone ? String(phone) : null,
          propertySize ? String(propertySize) : null,
          produces ? String(produces) : null,
          accessDirections ? String(accessDirections) : null,
          propertyPhotoDataUrl ? String(propertyPhotoDataUrl) : null,
        ],
      );
      res.status(201).json({ ok: true, agricultorId: result.rows[0]?.id });
      return;
    }

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
        atual.id,
        String(name),
        String(community),
        String(municipality),
        phone ? String(phone) : null,
        propertySize ? String(propertySize) : null,
        produces ? String(produces) : null,
        accessDirections ? String(accessDirections) : null,
        propertyPhotoDataUrl ? String(propertyPhotoDataUrl) : null,
      ],
    );

    res.json({ ok: true, agricultorId: atual.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.put('/api/pin', async (req, res) => {
  try {
    const { pin } = req.body ?? {};
    if (!pin) {
      res.status(400).json({ ok: false, error: 'pin é obrigatório' });
      return;
    }
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

    const pinHash = hashPin(String(pin));
    await pool.query(
      `
      INSERT INTO credenciais_acesso (agricultor_id, pin_hash)
      VALUES ($1, $2)
      ON CONFLICT (agricultor_id)
      DO UPDATE SET pin_hash = EXCLUDED.pin_hash
      `.trim(),
      [atual.id, pinHash],
    );

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { pin } = req.body ?? {};
    if (!pin) {
      res.status(400).json({ ok: false, error: 'pin é obrigatório' });
      return;
    }

    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

    const result = await pool.query('SELECT pin_hash FROM credenciais_acesso WHERE agricultor_id = $1', [atual.id]);
    const row = result.rows[0] as { pin_hash?: string } | undefined;
    if (!row?.pin_hash) {
      res.status(401).json({ ok: false, error: 'Nenhum PIN configurado' });
      return;
    }

    const ok = verifyPin(String(pin), row.pin_hash);
    if (!ok) {
      res.status(401).json({ ok: false, error: 'PIN inválido' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/pin/change', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body ?? {};
    if (!currentPin || !newPin) {
      res.status(400).json({ ok: false, error: 'currentPin e newPin são obrigatórios' });
      return;
    }

    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

    const result = await pool.query('SELECT pin_hash FROM credenciais_acesso WHERE agricultor_id = $1', [atual.id]);
    const row = result.rows[0] as { pin_hash?: string } | undefined;
    if (!row?.pin_hash) {
      res.status(401).json({ ok: false, error: 'Nenhum PIN configurado' });
      return;
    }

    const ok = verifyPin(String(currentPin), row.pin_hash);
    if (!ok) {
      res.status(401).json({ ok: false, error: 'PIN atual incorreto' });
      return;
    }

    const newHash = hashPin(String(newPin));
    await pool.query('UPDATE credenciais_acesso SET pin_hash = $2 WHERE agricultor_id = $1', [atual.id, newHash]);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.put('/api/safra', async (req, res) => {
  try {
    const { mainCrop, seedType, cultivationSystem, plantedArea } = req.body ?? {};
    if (!mainCrop || !seedType || !cultivationSystem || !plantedArea) {
      res.status(400).json({
        ok: false,
        error: 'Campos obrigatórios: mainCrop, seedType, cultivationSystem, plantedArea',
      });
      return;
    }
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO safras (agricultor_id, cultura_principal, tipo_semente, sistema_cultivo, area_plantada)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `.trim(),
      [atual.id, String(mainCrop), String(seedType), String(cultivationSystem), String(plantedArea)],
    );
    res.status(201).json({ ok: true, safraId: result.rows[0]?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.put('/api/respostas-anuais', async (req, res) => {
  try {
    const { year, hadChanges, changesDetails } = req.body ?? {};
    if (typeof year !== 'number' || typeof hadChanges !== 'boolean') {
      res.status(400).json({ ok: false, error: 'Campos obrigatórios: year (number), hadChanges (boolean)' });
      return;
    }
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

    await pool.query(
      `
      INSERT INTO respostas_anuais (agricultor_id, ano, teve_mudancas, detalhes_mudancas)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (agricultor_id, ano)
      DO UPDATE SET teve_mudancas = EXCLUDED.teve_mudancas, detalhes_mudancas = EXCLUDED.detalhes_mudancas
      `.trim(),
      [atual.id, year, hadChanges, changesDetails ? String(changesDetails) : null],
    );

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/registros-diarios', async (req, res) => {
  try {
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(400).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

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

    const result = await pool.query(
      `
      INSERT INTO registros_diarios (
        id_registro_cliente,
        agricultor_id,
        registrado_em,
        tipo_atividade,
        local,
        destino,
        producao,
        detalhes_destino,
        custos,
        mao_de_obra,
        condicoes_campo,
        observacoes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,
        $12
      )
      ON CONFLICT (agricultor_id, id_registro_cliente)
      DO UPDATE SET
        registrado_em = EXCLUDED.registrado_em,
        tipo_atividade = EXCLUDED.tipo_atividade,
        local = EXCLUDED.local,
        destino = EXCLUDED.destino,
        producao = EXCLUDED.producao,
        detalhes_destino = EXCLUDED.detalhes_destino,
        custos = EXCLUDED.custos,
        mao_de_obra = EXCLUDED.mao_de_obra,
        condicoes_campo = EXCLUDED.condicoes_campo,
        observacoes = EXCLUDED.observacoes
      RETURNING id
      `.trim(),
      [
        id ? String(id) : null,
        atual.id,
        registradoEm.toISOString(),
        String(activityType),
        String(location),
        String(destination),
        production ? JSON.stringify(production) : null,
        destinationDetails ? JSON.stringify(destinationDetails) : null,
        costs ? JSON.stringify(costs) : null,
        JSON.stringify(labor),
        JSON.stringify(fieldConditions),
        observations ? String(observations) : null,
      ],
    );

    res.status(201).json({ ok: true, registroId: result.rows[0]?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/registros-diarios', async (req, res) => {
  try {
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.json({ ok: true, records: [] });
      return;
    }

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

    const result = await pool.query<RegistroDiarioRow>(
      `
      SELECT
        id,
        id_registro_cliente,
        registrado_em,
        tipo_atividade,
        local,
        destino,
        producao,
        detalhes_destino,
        custos,
        mao_de_obra,
        condicoes_campo,
        observacoes
      FROM registros_diarios
      WHERE agricultor_id = $1
      ORDER BY registrado_em DESC
      LIMIT $2
      `.trim(),
      [atual.id, limit],
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
  try {
    const atual = await getAgricultorAtual();
    if (!atual) {
      res.status(404).json({ ok: false, error: 'Nenhum agricultor cadastrado' });
      return;
    }

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
      [atual.id, id],
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

app.post('/api/agricultores', async (req, res) => {
  try {
    const {
      nome,
      comunidade,
      municipio,
      telefone,
      tamanhoPropriedade,
      producoes,
      fotoPropriedadeDataUrl,
    } = req.body ?? {};

    if (!nome || !comunidade || !municipio) {
      res.status(400).json({ ok: false, error: 'Campos obrigatórios: nome, comunidade, municipio' });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO agricultores (
        nome,
        comunidade,
        municipio,
        telefone,
        tamanho_propriedade,
        producoes,
        foto_propriedade_data_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `.trim(),
      [
        String(nome),
        String(comunidade),
        String(municipio),
        telefone ? String(telefone) : null,
        tamanhoPropriedade ? String(tamanhoPropriedade) : null,
        producoes ? String(producoes) : null,
        fotoPropriedadeDataUrl ? String(fotoPropriedadeDataUrl) : null,
      ],
    );

    res.status(201).json({ ok: true, agricultorId: result.rows[0]?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/agricultores/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      `
      SELECT
        id,
        nome,
        comunidade,
        municipio,
        telefone,
        tamanho_propriedade,
        producoes,
        foto_propriedade_data_url
      FROM agricultores
      WHERE id = $1
      `.trim(),
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ ok: false, error: 'Agricultor não encontrado' });
      return;
    }

    res.json({ ok: true, agricultor: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/agricultores/:id/pin', async (req, res) => {
  try {
    const agricultorId = req.params.id;
    const { pin } = req.body ?? {};
    if (!pin) {
      res.status(400).json({ ok: false, error: 'pin é obrigatório' });
      return;
    }

    const pinHash = hashPin(String(pin));

    await pool.query(
      `
      INSERT INTO credenciais_acesso (agricultor_id, pin_hash)
      VALUES ($1, $2)
      ON CONFLICT (agricultor_id)
      DO UPDATE SET pin_hash = EXCLUDED.pin_hash
      `.trim(),
      [agricultorId, pinHash],
    );

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { agricultorId, pin } = req.body ?? {};
    if (!agricultorId || !pin) {
      res.status(400).json({ ok: false, error: 'agricultorId e pin são obrigatórios' });
      return;
    }

    const result = await pool.query(
      'SELECT pin_hash FROM credenciais_acesso WHERE agricultor_id = $1',
      [String(agricultorId)],
    );
    const row = result.rows[0] as { pin_hash?: string } | undefined;
    if (!row?.pin_hash) {
      res.status(401).json({ ok: false, error: 'Credencial não encontrada' });
      return;
    }

    const ok = verifyPin(String(pin), row.pin_hash);
    if (!ok) {
      res.status(401).json({ ok: false, error: 'PIN inválido' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/agricultores/:id/safra', async (req, res) => {
  try {
    const agricultorId = req.params.id;
    const { culturaPrincipal, tipoSemente, sistemaCultivo, areaPlantada } = req.body ?? {};
    if (!culturaPrincipal || !tipoSemente || !sistemaCultivo || !areaPlantada) {
      res.status(400).json({
        ok: false,
        error: 'Campos obrigatórios: culturaPrincipal, tipoSemente, sistemaCultivo, areaPlantada',
      });
      return;
    }

    const result = await pool.query(
      `
      INSERT INTO safras (agricultor_id, cultura_principal, tipo_semente, sistema_cultivo, area_plantada)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `.trim(),
      [
        agricultorId,
        String(culturaPrincipal),
        String(tipoSemente),
        String(sistemaCultivo),
        String(areaPlantada),
      ],
    );

    res.status(201).json({ ok: true, safraId: result.rows[0]?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/agricultores/:id/respostas-anuais', async (req, res) => {
  try {
    const agricultorId = req.params.id;
    const { ano, teveMudancas, detalhesMudancas } = req.body ?? {};
    if (typeof ano !== 'number' || typeof teveMudancas !== 'boolean') {
      res.status(400).json({ ok: false, error: 'Campos obrigatórios: ano (number), teveMudancas (boolean)' });
      return;
    }

    await pool.query(
      `
      INSERT INTO respostas_anuais (agricultor_id, ano, teve_mudancas, detalhes_mudancas)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (agricultor_id, ano)
      DO UPDATE SET teve_mudancas = EXCLUDED.teve_mudancas, detalhes_mudancas = EXCLUDED.detalhes_mudancas
      `.trim(),
      [agricultorId, ano, teveMudancas, detalhesMudancas ? String(detalhesMudancas) : null],
    );

    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.post('/api/agricultores/:id/registros-diarios', async (req, res) => {
  try {
    const agricultorId = req.params.id;
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

    const result = await pool.query(
      `
      INSERT INTO registros_diarios (
        id_registro_cliente,
        agricultor_id,
        registrado_em,
        tipo_atividade,
        local,
        destino,
        producao,
        detalhes_destino,
        custos,
        mao_de_obra,
        condicoes_campo,
        observacoes
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,
        $12
      )
      ON CONFLICT (agricultor_id, id_registro_cliente)
      DO UPDATE SET
        registrado_em = EXCLUDED.registrado_em,
        tipo_atividade = EXCLUDED.tipo_atividade,
        local = EXCLUDED.local,
        destino = EXCLUDED.destino,
        producao = EXCLUDED.producao,
        detalhes_destino = EXCLUDED.detalhes_destino,
        custos = EXCLUDED.custos,
        mao_de_obra = EXCLUDED.mao_de_obra,
        condicoes_campo = EXCLUDED.condicoes_campo,
        observacoes = EXCLUDED.observacoes
      RETURNING id
      `.trim(),
      [
        id ? String(id) : null,
        agricultorId,
        registradoEm.toISOString(),
        String(activityType),
        String(location),
        String(destination),
        production ? JSON.stringify(production) : null,
        destinationDetails ? JSON.stringify(destinationDetails) : null,
        costs ? JSON.stringify(costs) : null,
        JSON.stringify(labor),
        JSON.stringify(fieldConditions),
        observations ? String(observations) : null,
      ],
    );

    res.status(201).json({ ok: true, registroId: result.rows[0]?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ ok: false, error: message });
  }
});

app.get('/api/agricultores/:id/registros-diarios', async (req, res) => {
  try {
    const agricultorId = req.params.id;
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

    const result = await pool.query<RegistroDiarioRow>(
      `
      SELECT
        id,
        id_registro_cliente,
        registrado_em,
        tipo_atividade,
        local,
        destino,
        producao,
        detalhes_destino,
        custos,
        mao_de_obra,
        condicoes_campo,
        observacoes
      FROM registros_diarios
      WHERE agricultor_id = $1
      ORDER BY registrado_em DESC
      LIMIT $2
      `.trim(),
      [agricultorId, limit],
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

const port = Number(process.env.API_PORT ?? '3001');
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
