import { Preferences } from "@capacitor/preferences";
import type { AppDataResponse } from "./api";
import { ApiError } from "./api";

// Preferences grava no armazenamento nativo do Android, que o sistema não apaga para
// liberar espaço como pode fazer com o localStorage da WebView. No navegador, usa localStorage.
const QUEUE_KEY = "biocertifica.pending.v1";
const SNAPSHOT_KEY = "biocertifica.snapshot.v1";

export type PendingKind = "record" | "harvest" | "annual";

export interface PendingEntry {
  /** Pedir de novo com o mesmo id substitui a entrada anterior. */
  id: string;
  /** Agricultor dono do dado: outra conta no mesmo celular nunca envia estes dados. */
  owner: string;
  kind: PendingKind;
  payload: unknown;
  createdAt: string;
  /** Preenchido quando o servidor recusou o dado. A entrada é mantida, nunca apagada. */
  rejectedReason?: string;
}

export type AppSnapshot = AppDataResponse["data"];

export interface FlushResult {
  sent: number;
  rejected: number;
  authExpired: boolean;
  unreachable: boolean;
  remaining: PendingEntry[];
}

async function readAll(): Promise<PendingEntry[]> {
  const { value } = await Preferences.get({ key: QUEUE_KEY });
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Preserva o conteúdo ilegível em vez de sobrescrever dados de campo.
    await Preferences.set({ key: `${QUEUE_KEY}.corrupted.${Date.now()}`, value });
    return [];
  }
}

async function writeAll(entries: PendingEntry[]) {
  await Preferences.set({ key: QUEUE_KEY, value: JSON.stringify(entries) });
}

// Serializa leituras e gravações para que uma alteração não apague outra.
let lock: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = lock.then(task, task);
  lock = run.catch(() => undefined);
  return run;
}

export function listPending(owner: string) {
  return withLock(async () => (await readAll()).filter((entry) => entry.owner === owner));
}

export function enqueuePending(entry: Omit<PendingEntry, "createdAt">) {
  return withLock(async () => {
    const entries = await readAll();
    const next: PendingEntry = { ...entry, createdAt: new Date().toISOString() };
    const index = entries.findIndex((item) => item.owner === entry.owner && item.id === entry.id);
    if (index >= 0) entries[index] = next;
    else entries.push(next);
    await writeAll(entries);
  });
}

export function removePending(owner: string, id: string) {
  return withLock(async () => {
    const entries = await readAll();
    await writeAll(entries.filter((item) => !(item.owner === owner && item.id === id)));
  });
}

function markRejected(owner: string, id: string, reason: string) {
  return withLock(async () => {
    const entries = await readAll();
    await writeAll(
      entries.map((item) => (item.owner === owner && item.id === id ? { ...item, rejectedReason: reason } : item)),
    );
  });
}

/**
 * Envia as entradas do agricultor, da mais antiga para a mais nova. Uma entrada só sai
 * da fila depois da confirmação do servidor. O envio repetido é seguro: o servidor
 * identifica cada registro pelo id gerado no celular e não o duplica.
 */
export async function flushQueue(
  owner: string,
  send: (entry: PendingEntry) => Promise<unknown>,
  { retryRejected }: { retryRejected: boolean },
): Promise<FlushResult> {
  const attempted = new Set<string>();
  const result: FlushResult = { sent: 0, rejected: 0, authExpired: false, unreachable: false, remaining: [] };

  // Relê a fila a cada volta para incluir o que foi salvo durante o envio.
  while (true) {
    const entries = await listPending(owner);
    const entry = entries.find((item) => !attempted.has(item.id) && (retryRejected || !item.rejectedReason));
    if (!entry) break;
    attempted.add(entry.id);

    try {
      await send(entry);
      await removePending(owner, entry.id);
      result.sent++;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      if (status === 401) {
        result.authExpired = true;
        break;
      }
      if (status === 0 || status === 408 || status === 429 || status >= 500) {
        result.unreachable = true;
        break;
      }
      await markRejected(owner, entry.id, error instanceof Error ? error.message : "Dados recusados pelo servidor");
      result.rejected++;
    }
  }

  result.remaining = await listPending(owner);
  return result;
}

export async function saveSnapshot(snapshot: AppSnapshot) {
  await Preferences.set({ key: SNAPSHOT_KEY, value: JSON.stringify(snapshot) });
}

export async function loadSnapshot(): Promise<AppSnapshot | null> {
  const { value } = await Preferences.get({ key: SNAPSHOT_KEY });
  if (!value) return null;
  try {
    return JSON.parse(value) as AppSnapshot;
  } catch {
    return null;
  }
}

export async function clearSnapshot() {
  await Preferences.remove({ key: SNAPSHOT_KEY });
}
