import type { DailyRecord, Farmer, Harvest } from "../App";
import type { RespostasAnuais } from "../components/screens/perguntas-anuais";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const AUTH_TOKEN_STORAGE_KEY = "agro_auth_token";
const DEBUG_API = ["1", "true", "yes", "on"].includes(
  String((import.meta.env as any).VITE_DEBUG_API ?? "").toLowerCase(),
);

function getTokenFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

let authToken: string | null = getTokenFromStorage();

function setInternalAuthToken(token: string | null) {
  authToken = token;
  if (typeof window === "undefined") return;
  try {
    if (!token) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } else {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignora erros de armazenamento
  }
}

export type AuthUser = {
  agricultorId: string;
  usuarioAuthId?: string;
  username: string;
  email?: string | null;
  name: string;
};

type AuthResponse = {
  ok: true;
  token: string;
  user: AuthUser;
};

function shouldRedactBody(path: string) {
  return (
    path.includes("/api/login") ||
    path.includes("/api/agricultor") ||
    path.includes("/api/password") ||
    path.includes("/password")
  );
}

function debugRequestLog(message: string, data?: unknown) {
  if (!DEBUG_API) return;
  if (typeof data === "undefined") {
    console.log(message);
    return;
  }
  try {
    console.log(message, JSON.stringify(data));
  } catch {
    console.log(message, data);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = String(init?.method ?? "GET").toUpperCase();
  const baseUrl = API_BASE_URL ? joinUrl(API_BASE_URL, path) : path;
  const url = baseUrl;
  const bodyPreview =
    typeof init?.body === "string" && !shouldRedactBody(path) && init.body.length <= 10_000
      ? init.body
      : typeof init?.body === "string"
        ? "<redacted>"
        : undefined;

  debugRequestLog("[api] request", {
    method,
    url,
    hasAuthToken: !!authToken,
    body: bodyPreview,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(0, "Falha de conexão com o servidor");
  }

  if (res.status === 304) {
    throw new ApiError(304, "Resposta em cache (304). Desative cache e tente novamente.");
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  debugRequestLog("[api] response", {
    method,
    url,
    status: res.status,
    ok: res.ok,
    bytes: text.length,
  });

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as any).error)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export type AppDataResponse = {
  ok: true;
  data: {
    farmer: Farmer | null;
    harvest: Harvest | null;
    records: DailyRecord[];
    annual: Record<string, RespostasAnuais>;
    hasPasswordConfigured: boolean;
    user: {
      agricultorId: string;
      usuarioAuthId?: string;
      username: string;
    };
  };
};

export const api = {
  setAuthToken(token: string | null) {
    setInternalAuthToken(token);
  },

  getAuthToken() {
    return authToken;
  },

  async getAppData() {
    const result = await request<AppDataResponse>("/api/app-data");
    return result.data;
  },

  async registerFarmerAccount(payload: Farmer & { username: string; email?: string; password: string }) {
    const result = await request<AuthResponse & { agricultorId: string }>("/api/agricultor", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setInternalAuthToken(result.token);
    return result;
  },

  async saveFarmer(farmer: Farmer) {
    return request<{ ok: true; agricultorId: string }>("/api/agricultor", {
      method: "PUT",
      body: JSON.stringify(farmer),
    });
  },

  async login(identifier: string, password: string) {
    try {
      const result = await request<AuthResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setInternalAuthToken(result.token);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  },

  async logout() {
    try {
      await request<{ ok: true }>("/api/logout", {
        method: "POST",
      });
    } finally {
      setInternalAuthToken(null);
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const result = await request<{ ok: boolean }>("/api/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      return !!result.ok;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  },

  async requestPasswordReset(email: string) {
    return request<{ ok: true }>("/api/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetCode(email: string, code: string) {
    return request<{ ok: true }>("/api/password/verify-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    return request<{ ok: true }>("/api/password/reset", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  async saveHarvest(harvest: Harvest) {
    return request<{ ok: true; safraId: string }>("/api/safra", {
      method: "PUT",
      body: JSON.stringify(harvest),
    });
  },

  async saveAnnualAnswers(answers: RespostasAnuais) {
    return request<{ ok: true }>("/api/respostas-anuais", {
      method: "PUT",
      body: JSON.stringify(answers),
    });
  },

  async saveDailyRecord(record: DailyRecord) {
    return request<{ ok: true; registroId: string }>("/api/registros-diarios", {
      method: "POST",
      body: JSON.stringify(record),
    });
  },

  async listDailyRecords(limit = 50) {
    const result = await request<{ ok: true; records: DailyRecord[] }>(
      `/api/registros-diarios?limit=${encodeURIComponent(String(limit))}`,
    );
    return result.records;
  },

  async deleteDailyRecord(id: string) {
    return request<{ ok: true }>(`/api/registros-diarios/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
