import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { Network } from "@capacitor/network";
import { TelaInicial } from "./components/screens/tela-inicial";
import { SyncStatus } from "./components/sync-status";
import { FormProgress } from "./components/form-progress";
import { DESTINATION_NOT_APPLICABLE, isHarvestActivity } from "./lib/record-format";
import { BottomNav } from "./components/bottom-nav";
import type { RespostasAnuais } from "./components/screens/perguntas-anuais";
import { downloadAuditPdf } from "./lib/audit-pdf";
import { api, ApiError } from "./lib/api";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import {
  clearSnapshot,
  enqueuePending,
  flushQueue,
  listPending,
  loadSnapshot,
  removePending,
  saveSnapshot,
  type AppSnapshot,
  type FlushResult,
  type PendingEntry,
} from "./lib/offline-queue";
import { installReadAloud, READ_ALOUD_STORAGE_KEY } from "./lib/read-aloud";

// As telas fora da abertura são baixadas somente quando o usuário as acessa.
const CadastroAgricultor = lazy(() => import("./components/screens/cadastro-agricultor").then(({ CadastroAgricultor }) => ({ default: CadastroAgricultor })));
const CadastroSafra = lazy(() => import("./components/screens/cadastro-safra").then(({ CadastroSafra }) => ({ default: CadastroSafra })));
const MenuPrincipal = lazy(() => import("./components/screens/menu-principal").then(({ MenuPrincipal }) => ({ default: MenuPrincipal })));
const TipoAtividade = lazy(() => import("./components/screens/tipo-atividade").then(({ TipoAtividade }) => ({ default: TipoAtividade })));
const Producao = lazy(() => import("./components/screens/producao").then(({ Producao }) => ({ default: Producao })));
const LocalProducao = lazy(() => import("./components/screens/local-producao").then(({ LocalProducao }) => ({ default: LocalProducao })));
const DestinoProducao = lazy(() => import("./components/screens/destino-producao").then(({ DestinoProducao }) => ({ default: DestinoProducao })));
const DetalhesDestino = lazy(() => import("./components/screens/detalhes-destino").then(({ DetalhesDestino }) => ({ default: DetalhesDestino })));
const Custos = lazy(() => import("./components/screens/custos").then(({ Custos }) => ({ default: Custos })));
const MaoDeObra = lazy(() => import("./components/screens/mao-de-obra").then(({ MaoDeObra }) => ({ default: MaoDeObra })));
const CondicoesCampo = lazy(() => import("./components/screens/condicoes-campo").then(({ CondicoesCampo }) => ({ default: CondicoesCampo })));
const Observacoes = lazy(() => import("./components/screens/observacoes").then(({ Observacoes }) => ({ default: Observacoes })));
const Confirmacao = lazy(() => import("./components/screens/confirmacao").then(({ Confirmacao }) => ({ default: Confirmacao })));
const Historico = lazy(() => import("./components/screens/historico").then(({ Historico }) => ({ default: Historico })));
const Perfil = lazy(() => import("./components/screens/perfil").then(({ Perfil }) => ({ default: Perfil })));
const Entrar = lazy(() => import("./components/screens/entrar").then(({ Entrar }) => ({ default: Entrar })));
const EsqueciSenha = lazy(() => import("./components/screens/esqueci-senha").then(({ EsqueciSenha }) => ({ default: EsqueciSenha })));
const ConfirmarRegistro = lazy(() => import("./components/screens/confirmar-registro").then(({ ConfirmarRegistro }) => ({ default: ConfirmarRegistro })));
const PerguntasAnuais = lazy(() => import("./components/screens/perguntas-anuais").then(({ PerguntasAnuais }) => ({ default: PerguntasAnuais })));

export type Screen = 
  | "splash"
  | "login"
  | "forgot-password"
  | "farmer-registration" 
  | "harvest-registration"
  | "main-menu"
  | "annual-questions"
  | "register-confirm"
  | "activity-type"
  | "production"
  | "production-location"
  | "production-destination"
  | "destination-details"
  | "costs"
  | "labor"
  | "field-conditions"
  | "observations"
  | "confirmation"
  | "history"
  | "profile";

export interface Farmer {
  name: string;
  community: string;
  municipality: string;
  phone?: string;
  propertySize?: string;
  produces?: string;
  accessDirections?: string;
  propertyPhotoDataUrl?: string;
}

export interface Harvest {
  mainCrop: string;
  seedType: string;
  cultivationSystem: string;
  plantedArea: string;
}

export interface DailyRecord {
  id: string;
  /** Dia em que a atividade foi feita. */
  date: string;
  /** Momento em que foi lançada no aplicativo. */
  loggedAt?: string;
  activityType: string;
  production?: {
    product: string;
    quantity: string;
    unit: string;
  };
  location: string;
  destination: string;
  destinationDetails?: {
    saleValue?: string;
    buyer?: string;
    exchangeItem?: string;
    donationRecipient?: string;
  };
  costs?: {
    hasExpense: boolean;
    type?: string;
    value?: string;
    purchaseLocation?: string;
  };
  labor: {
    type: string;
    peopleCount: string;
    hadPayment: boolean;
    paymentValue?: string;
  };
  fieldConditions: {
    weather: string;
    occurrences: string;
    occurrenceDetails?: string;
    pestOrDiseaseFound?: string;
    appliedProduct?: string;
    appliedDose?: string;
    homemadeProductPreparation?: string;
  };
  observations?: string;
  /** Presente enquanto o registro está só no celular, aguardando envio. */
  syncStatus?: "pending";
}

export interface AppData {
  farmer: Farmer | null;
  harvest: Harvest | null;
  records: DailyRecord[];
  recordPagination: {
    hasMore: boolean;
    nextOffset: number;
  };
  currentRecord: Partial<DailyRecord>;
  annual?: Record<string, RespostasAnuais>;
  auth?: {
    isLoggedIn: boolean;
    hasPasswordConfigured: boolean;
    token?: string;
    user?: {
      agricultorId: string;
      username: string;
      email?: string | null;
      name?: string;
    };
  };
}

const DEFAULT_APP_DATA: AppData = {
  farmer: null,
  harvest: null,
  records: [],
  recordPagination: {
    hasMore: false,
    nextOffset: 0,
  },
  currentRecord: {},
  annual: {},
  auth: {
    isLoggedIn: false,
    hasPasswordConfigured: false,
  }
};

const DEBUG_UI = ["1", "true", "yes", "on"].includes(
  String((import.meta.env as any).VITE_DEBUG_API ?? "").toLowerCase(),
);

const TEST_LAST_STEP = ["1", "true", "yes", "on"].includes(
  String((import.meta.env as any).VITE_TEST_LAST_STEP ?? "").toLowerCase(),
);

const RECORDS_PAGE_SIZE = 50;
const SYNC_REQUEST_TIMEOUT_MS = 20_000;
const SYNC_RETRY_INTERVAL_MS = 45_000;

/** Envia uma entrada da fila, com limite de tempo: conexão ruim no campo não pode travar o envio. */
function sendPendingEntry(entry: PendingEntry) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
  const request =
    entry.kind === "record"
      ? api.saveDailyRecord(entry.payload as DailyRecord, controller.signal)
      : entry.kind === "harvest"
        ? api.saveHarvest(entry.payload as Harvest, controller.signal)
        : api.saveAnnualAnswers(entry.payload as RespostasAnuais, controller.signal);
  return request.finally(() => clearTimeout(timeout));
}

/** Junta os dados do servidor com o que ainda está só no celular, que é sempre mais recente. */
function mergePending(snapshot: AppSnapshot, pending: PendingEntry[]) {
  const pendingRecords = pending
    .filter((entry) => entry.kind === "record")
    .map((entry) => ({ ...(entry.payload as DailyRecord), syncStatus: "pending" as const }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const pendingIds = new Set(pendingRecords.map((record) => record.id));
  const pendingHarvest = pending.find((entry) => entry.kind === "harvest")?.payload as Harvest | undefined;
  const annual = { ...snapshot.annual };
  for (const entry of pending) {
    if (entry.kind !== "annual") continue;
    const answers = entry.payload as RespostasAnuais;
    annual[String(answers.year)] = answers;
  }

  return {
    farmer: snapshot.farmer,
    harvest: pendingHarvest ?? snapshot.harvest,
    records: [...pendingRecords, ...snapshot.records.filter((record) => !pendingIds.has(record.id))],
    recordPagination: snapshot.recordPagination,
    annual,
  };
}

function isValidDailyRecord(record: Partial<DailyRecord> | null | undefined): record is DailyRecord {
  if (!record) return false;
  if (typeof record.id !== "string" || !record.id.trim()) return false;
  if (typeof record.date !== "string" || !record.date.trim()) return false;
  if (typeof record.activityType !== "string" || !record.activityType.trim()) return false;
  if (typeof record.location !== "string" || !record.location.trim()) return false;
  if (typeof record.destination !== "string" || !record.destination.trim()) return false;

  if (!record.labor || typeof record.labor !== "object") return false;
  if (!record.labor.type?.trim() || !record.labor.peopleCount?.trim()) return false;

  if (!record.fieldConditions || typeof record.fieldConditions !== "object") return false;
  if (!record.fieldConditions.weather?.trim() || !record.fieldConditions.occurrences?.trim()) return false;

  return true;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.localStorage.getItem("biocertifica-theme") === "dark";
  });
  
  const currentYear = new Date().getFullYear();

  const [appData, setAppData] = useState<AppData>(DEFAULT_APP_DATA);

  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const [registerConfirmFromScreen, setRegisterConfirmFromScreen] = useState<Screen>("main-menu")

  const [serverError, setServerError] = useState<string | null>(null);

  const [serverErrorTitle, setServerErrorTitle] = useState("Erro ao sincronizar");
  const [isReloading, setIsReloading] = useState(false);
  const [isLoadingMoreRecords, setIsLoadingMoreRecords] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPropertyPhotoLoaded, setIsPropertyPhotoLoaded] = useState(false);
  const [isReadAloudEnabled, setIsReadAloudEnabled] = useState(() => {
    return window.localStorage.getItem(READ_ALOUD_STORAGE_KEY) === "true";
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInFlight = useRef<Promise<FlushResult> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    window.localStorage.setItem("biocertifica-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    window.localStorage.setItem(READ_ALOUD_STORAGE_KEY, String(isReadAloudEnabled));
    if (!isReadAloudEnabled) return;
    return installReadAloud();
  }, [isReadAloudEnabled]);

  const reportServerError = useCallback((error: unknown) => {
    const message =
      typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Falha ao conectar ao servidor";

    const isConnectionError =
      (error instanceof ApiError && error.status === 0)
      || /conex[aã]o|network|offline|failed to fetch/i.test(message);

    setServerErrorTitle(isConnectionError ? "Sem conexão com o servidor" : "Não foi possível salvar os dados");
    setServerError(
      isConnectionError
        ? "Verifique sua internet ou se o backend está ligado e tente novamente."
        : message,
    );
    console.error(error);
  }, []);

  const reloadFromServer = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    setIsReloading(true);
    try {
      const data = await api.getAppData(RECORDS_PAGE_SIZE);
      const pending = await listPending(data.user.agricultorId);
      void saveSnapshot(data).catch((error) => console.warn("Falha ao guardar dados no celular:", error));
      setPendingCount(pending.length);
      setIsServerReachable(true);
      setIsPropertyPhotoLoaded(false);
      setAppData((prev) => ({
        ...prev,
        ...mergePending(data, pending),
        auth: {
          ...(prev.auth ?? { isLoggedIn: false, hasPasswordConfigured: false }),
          isLoggedIn: true,
          hasPasswordConfigured: data.hasPasswordConfigured,
          user: {
            ...prev.auth?.user,
            agricultorId: data.user.agricultorId,
            username: data.user.username,
          },
        },
      }));
      setServerErrorTitle("Erro ao sincronizar");
      setServerError(null);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : "Falha ao conectar ao servidor";
        setServerErrorTitle("Erro ao sincronizar");
        setServerError(message);
      }
      console.error("Falha ao carregar dados do servidor:", error);
      throw error;
    } finally {
      setIsReloading(false);
    }
  }, []);

  const endExpiredSession = useCallback(() => {
    api.setAuthToken(null);
    void clearSnapshot();
    setAppData((prev) => ({
      ...prev,
      auth: {
        ...(prev.auth ?? { isLoggedIn: false, hasPasswordConfigured: false }),
        isLoggedIn: false,
        token: undefined,
        user: undefined,
      },
    }));
    setServerErrorTitle("Sessão expirada");
    setServerError("Entre de novo para enviar o que está guardado no celular. Nada foi perdido.");
    setCurrentScreen("login");
  }, []);

  const syncQueue = useCallback(
    (owner: string, { retryRejected = true }: { retryRejected?: boolean } = {}) => {
      if (syncInFlight.current) return syncInFlight.current;

      const run = (async () => {
        setIsSyncing(true);
        try {
          const result = await flushQueue(owner, sendPendingEntry, { retryRejected });
          setPendingCount(result.remaining.length);
          if (result.sent > 0 || result.unreachable) setIsServerReachable(!result.unreachable);

          const remainingIds = new Set(result.remaining.map((entry) => entry.id));
          setAppData((prev) => ({
            ...prev,
            records: prev.records.map((record) => {
              if (!record.syncStatus || remainingIds.has(`record:${record.id}`)) return record;
              const { syncStatus: _sent, ...sentRecord } = record;
              return sentRecord;
            }),
          }));

          if (result.rejected > 0) {
            const reason = result.remaining.find((entry) => entry.rejectedReason)?.rejectedReason;
            setServerErrorTitle("O servidor não aceitou um registro");
            setServerError(`${reason ?? "Dados inválidos."} O registro continua guardado no celular.`);
          }
          if (result.authExpired) endExpiredSession();
          return result;
        } finally {
          setIsSyncing(false);
          syncInFlight.current = null;
        }
      })();

      syncInFlight.current = run;
      return run;
    },
    [endExpiredSession],
  );

  const ownerId = appData.auth?.isLoggedIn ? appData.auth.user?.agricultorId : undefined;

  useEffect(() => {
    if (!ownerId) return;

    const syncAfterSending = async (options?: { retryRejected?: boolean }) => {
      const result = await syncQueue(ownerId, options);
      if (result.sent > 0) await reloadFromServer({ silent: true });
    };
    const trySync = (options?: { retryRejected?: boolean }) => {
      syncAfterSending(options).catch((error) => console.warn("Sincronização adiada:", error));
    };
    const handleForeground = () => {
      if (document.visibilityState === "visible") trySync();
    };
    const handleBrowserOnline = () => trySync();

    trySync();
    // Se a conexão voltar sem o aviso do sistema, a nova tentativa periódica resolve.
    const retryTimer = window.setInterval(() => trySync({ retryRejected: false }), SYNC_RETRY_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleForeground);
    window.addEventListener("online", handleBrowserOnline);

    void Network.getStatus().then((status) => setIsNetworkOnline(status.connected)).catch(() => undefined);
    const networkListener = Network.addListener("networkStatusChange", (status) => {
      setIsNetworkOnline(status.connected);
      if (status.connected) trySync();
    });

    return () => {
      window.clearInterval(retryTimer);
      document.removeEventListener("visibilitychange", handleForeground);
      window.removeEventListener("online", handleBrowserOnline);
      void networkListener.then((handle) => handle.remove());
    };
  }, [ownerId, reloadFromServer, syncQueue]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = api.getAuthToken();
      if (!token) {
        if (!cancelled) setIsRestoringSession(false);
        return;
      }

      api.setAuthToken(token);
      if (!cancelled) {
        setAppData((prev) => ({
          ...prev,
          auth: {
            ...(prev.auth ?? { isLoggedIn: false, hasPasswordConfigured: false }),
            isLoggedIn: true,
            hasPasswordConfigured: prev.auth?.hasPasswordConfigured ?? false,
            token,
          },
        }));
      }

      try {
        await reloadFromServer({ silent: true });
        if (!cancelled) {
          setCurrentScreen("main-menu");
        }
      } catch (error) {
        const isSessionInvalid = error instanceof ApiError && error.status === 401;

        // Sem internet a sessão continua válida: abre com os últimos dados guardados.
        if (!isSessionInvalid) {
          const snapshot = await loadSnapshot().catch(() => null);
          if (snapshot && !cancelled) {
            const pending = await listPending(snapshot.user.agricultorId).catch(() => []);
            setAppData((prev) => ({
              ...prev,
              ...mergePending(snapshot, pending),
              auth: {
                isLoggedIn: true,
                hasPasswordConfigured: snapshot.hasPasswordConfigured,
                token,
                user: {
                  agricultorId: snapshot.user.agricultorId,
                  username: snapshot.user.username,
                },
              },
            }));
            setPendingCount(pending.length);
            setIsServerReachable(false);
            setCurrentScreen("main-menu");
            return;
          }
        } else {
          api.setAuthToken(null);
          void clearSnapshot();
        }

        if (!cancelled) {
          setAppData((prev) => ({
            ...prev,
            auth: {
              ...(prev.auth ?? { isLoggedIn: false, hasPasswordConfigured: false }),
              isLoggedIn: false,
              token: undefined,
              user: undefined,
            },
          }));
          setCurrentScreen("login");
          if (isSessionInvalid) {
            setServerError(null);
          }
        }
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [reloadFromServer]);

  useEffect(() => {
    if (
      isPropertyPhotoLoaded
      || currentScreen !== "profile"
      || !appData.auth?.isLoggedIn
      || !appData.farmer
    ) {
      return;
    }

    let cancelled = false;

    const loadPropertyPhoto = async () => {
      try {
        const propertyPhotoDataUrl = await api.getPropertyPhoto();
        if (!cancelled) {
          setAppData((prev) => prev.farmer
            ? { ...prev, farmer: { ...prev.farmer, propertyPhotoDataUrl } }
            : prev,
          );
        }
      } catch (error) {
        // Sem conexão, o perfil apenas fica sem a foto.
        const isConnectionError = error instanceof ApiError && error.status === 0;
        if (!cancelled && !isConnectionError) reportServerError(error);
      } finally {
        if (!cancelled) setIsPropertyPhotoLoaded(true);
      }
    };

    void loadPropertyPhoto();
    return () => {
      cancelled = true;
    };
  }, [appData.auth?.isLoggedIn, appData.farmer, currentScreen, isPropertyPhotoLoaded, reportServerError]);

  useEffect(() => {
    if (isRestoringSession) return;
    const isAuthRoute =
      currentScreen === "splash" ||
      currentScreen === "login" ||
      currentScreen === "farmer-registration" ||
      currentScreen === "forgot-password";
    if (!appData.auth?.isLoggedIn && !isAuthRoute) {
      setCurrentScreen("splash");
    }
  }, [appData.auth?.isLoggedIn, currentScreen, isRestoringSession]);

  useEffect(() => {
    if (!appData.auth?.isLoggedIn) return;
    if (!appData.farmer) return;
    const hasAnnualForYear = !!appData.annual?.[String(currentYear)];
    if (!hasAnnualForYear && currentScreen === "main-menu") {
      setCurrentScreen("annual-questions");
    }
  }, [appData.auth?.isLoggedIn, appData.farmer, appData.annual, currentYear, currentScreen]);

  const updateFarmer = async (farmer: Farmer) => {
    try {
      if (DEBUG_UI) console.log("[ui] submit farmer", { name: farmer.name, municipality: farmer.municipality });
      await api.saveFarmer(farmer);
      setIsPropertyPhotoLoaded(true);
      setAppData((prev: AppData) => ({ ...prev, farmer }));
      setServerError(null);
    } catch (error) {
      reportServerError(error);
      throw error;
    }
  };

  const registerFarmerAccount = async (payload: Farmer & { username: string; email?: string; password: string }) => {
    try {
      if (DEBUG_UI) console.log("[ui] register farmer account", { username: payload.username, hasEmail: !!payload.email });
      const result = await api.registerFarmerAccount(payload);
      api.setAuthToken(result.token);
      setIsPropertyPhotoLoaded(true);
      setAppData((prev: AppData) => ({
        ...prev,
        farmer: {
          name: payload.name,
          community: payload.community,
          municipality: payload.municipality,
          phone: payload.phone,
          propertySize: payload.propertySize,
          produces: payload.produces,
          accessDirections: payload.accessDirections,
          propertyPhotoDataUrl: payload.propertyPhotoDataUrl,
        },
        auth: {
          ...prev.auth,
          isLoggedIn: true,
          hasPasswordConfigured: true,
          token: result.token,
          user: result.user,
        }
      }));
      setCurrentScreen("harvest-registration");
      setServerError(null);
    } catch (error) {
      // Conflito de cadastro é erro esperado da tela de formulário.
      if (error instanceof ApiError && error.status === 409) {
        throw error;
      }
      reportServerError(error);
      throw error;
    }
  };

  const updateHarvest = (harvest: Harvest) => {
    if (DEBUG_UI) console.log("[ui] submit harvest", { mainCrop: harvest.mainCrop, seedType: harvest.seedType });
    setAppData((prev: AppData) => ({ ...prev, harvest }));
    if (!ownerId) {
      api.saveHarvest(harvest).then(() => setServerError(null)).catch(reportServerError);
      return;
    }
    enqueuePending({ id: "harvest", owner: ownerId, kind: "harvest", payload: harvest })
      .then(() => syncQueue(ownerId))
      .catch(reportServerError);
  };

  const updateCurrentRecord = (data: Partial<DailyRecord>) => {
    setAppData((prev: AppData) => ({
      ...prev,
      currentRecord: { ...prev.currentRecord, ...data }
    }));
  };

  const saveRecord = async (): Promise<{ ok: boolean; queued?: boolean; message?: string }> => {
    const authToken = api.getAuthToken();
    if (!appData.auth?.isLoggedIn || !authToken || !ownerId) {
      setServerErrorTitle("Sessão expirada");
      setServerError("Faça login novamente para salvar e sincronizar no Postgres.");
      setCurrentScreen("login");
      return { ok: false, message: "Sessão expirada. Faça login novamente." };
    }
    const isHarvest = isHarvestActivity(appData.currentRecord.activityType);
    const baseRecord: DailyRecord = {
      id: Date.now().toString(),
      date: appData.currentRecord.date || new Date().toISOString(),
      loggedAt: new Date().toISOString(),
      activityType: appData.currentRecord.activityType || "",
      production: appData.currentRecord.production,
      location: appData.currentRecord.location || "",
      destination: isHarvest ? appData.currentRecord.destination || "" : DESTINATION_NOT_APPLICABLE,
      destinationDetails: isHarvest ? appData.currentRecord.destinationDetails : undefined,
      costs: appData.currentRecord.costs,
      labor: appData.currentRecord.labor || {
        type: "",
        peopleCount: "",
        hadPayment: false,
      },
      fieldConditions: appData.currentRecord.fieldConditions || {
        weather: "",
        occurrences: "",
      },
      observations: appData.currentRecord.observations,
    };

    const candidate: DailyRecord = TEST_LAST_STEP
      ? {
          ...baseRecord,
          activityType: baseRecord.activityType || "teste",
          location: baseRecord.location || "teste",
          destination: baseRecord.destination || "teste",
          labor: {
            type: baseRecord.labor?.type || "teste",
            peopleCount: baseRecord.labor?.peopleCount || "1",
            hadPayment: !!baseRecord.labor?.hadPayment,
          },
          fieldConditions: {
            weather: baseRecord.fieldConditions?.weather || "teste",
            occurrences: baseRecord.fieldConditions?.occurrences || "teste",
          },
        }
      : baseRecord;

    if (!TEST_LAST_STEP) {
      const missingFields: string[] = [];
      if (!candidate.activityType.trim()) missingFields.push("atividade");
      if (!candidate.location.trim()) missingFields.push("local");
      if (!candidate.destination.trim()) missingFields.push("destino");
      if (!candidate.labor?.type?.trim() || !candidate.labor?.peopleCount?.trim()) missingFields.push("mão de obra");
      if (!candidate.fieldConditions?.weather?.trim() || !candidate.fieldConditions?.occurrences?.trim()) {
        missingFields.push("condições do campo");
      }

      if (missingFields.length > 0) {
        const message = `Preencha os campos obrigatórios antes de salvar: ${missingFields.join(", ")}.`;
        setServerErrorTitle("Registro incompleto");
        setServerError(message);
        return { ok: false, message };
      }
    }

    if (DEBUG_UI) console.log("[ui] submit daily record", { id: candidate.id, testMode: TEST_LAST_STEP });

    // Grava no celular antes de tentar enviar: se o app fechar ou a conexão cair, nada se perde.
    const entryId = `record:${candidate.id}`;
    try {
      await enqueuePending({ id: entryId, owner: ownerId, kind: "record", payload: candidate });
    } catch (error) {
      console.error("Falha ao guardar o registro no celular:", error);
      return { ok: false, message: "Não foi possível guardar o registro neste celular. Verifique se há espaço livre e tente de novo." };
    }

    setPendingCount((count) => count + 1);
    setAppData((prev: AppData) => ({
      ...prev,
      currentRecord: {},
      records: [{ ...candidate, syncStatus: "pending" }, ...prev.records],
    }));

    let stillPending: PendingEntry | undefined;
    try {
      const result = await syncQueue(ownerId);
      stillPending = result.remaining.find((entry) => entry.id === entryId);
      if (!stillPending) {
        setServerError(null);
        await reloadFromServer({ silent: true }).catch(() => undefined);
        return { ok: true };
      }
    } catch (error) {
      console.warn("Envio adiado; o registro continua guardado:", error);
      return { ok: true, queued: true };
    }

    if (stillPending.rejectedReason) {
      return { ok: false, message: `${stillPending.rejectedReason} O registro continua guardado no celular.` };
    }
    return { ok: true, queued: true };
  };

  const resetCurrentRecord = () => {
    setAppData((prev: AppData) => ({ ...prev, currentRecord: {} }));
  };

  const exitDailyRecord = () => {
    resetCurrentRecord();
    setCurrentScreen("main-menu");
  };

  const saveAnnualAnswers = (answers: RespostasAnuais) => {
    setAppData((prev: AppData) => ({
      ...prev,
      annual: {
        ...(prev.annual ?? {}),
        [String(answers.year)]: answers
      }
    }));

    if (!ownerId) {
      api.saveAnnualAnswers(answers).then(() => setServerError(null)).catch(reportServerError);
      return;
    }
    enqueuePending({ id: `annual:${answers.year}`, owner: ownerId, kind: "annual", payload: answers })
      .then(() => syncQueue(ownerId))
      .catch(reportServerError);
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    try {
      const authResult = await api.login(identifier, password);
      if (!authResult) return false;
      api.setAuthToken(authResult.token);

      setAppData((prev: AppData) => ({
        ...prev,
        auth: {
          ...prev.auth,
          isLoggedIn: true,
          hasPasswordConfigured: true,
          token: authResult.token,
          user: authResult.user,
        },
      }));
      await reloadFromServer();
      setCurrentScreen("main-menu");
      setServerError(null);
      return true;
    } catch (error) {
      reportServerError(error);
      throw error;
    }
  };

  const logout = () => {
    if (pendingCount > 0) {
      const confirmed = window.confirm(
        `Há ${pendingCount} registro(s) ainda não enviados. Eles continuam guardados neste celular e serão enviados quando você entrar de novo com a mesma conta, o que exige internet. Sair mesmo assim?`,
      );
      if (!confirmed) return;
    }
    void clearSnapshot();
    setPendingCount(0);
    void api.logout();
    api.setAuthToken(null);
    setIsPropertyPhotoLoaded(false);
    setAppData((prev: AppData) => ({
      ...prev,
      farmer: null,
      harvest: null,
      annual: {},
      records: [],
      currentRecord: {},
      auth: {
        ...(prev.auth ?? { isLoggedIn: false, hasPasswordConfigured: false }),
        isLoggedIn: false,
        token: undefined,
        user: undefined,
      }
    }));
    setCurrentScreen("splash");
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const ok = await api.changePassword(currentPassword, newPassword);
      if (!ok) return false;
      setServerError(null);
      setAppData((prev: AppData) => ({
        ...prev,
        auth: {
          ...prev.auth,
          isLoggedIn: true,
          hasPasswordConfigured: true,
        },
      }));
      return true;
    } catch {
      reportServerError("Falha ao trocar senha (servidor indisponível)");
      return false;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await api.requestPasswordReset(email);
      setServerError(null);
      return { ok: true };
    } catch (error) {
      reportServerError(error);
      return { ok: false, message: error instanceof Error ? error.message : undefined };
    }
  };

  const verifyPasswordResetCode = async (email: string, code: string) => {
    try {
      await api.verifyResetCode(email, code);
      setServerError(null);
      return { ok: true };
    } catch (error) {
      reportServerError(error);
      return { ok: false, message: error instanceof Error ? error.message : undefined };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await api.resetPassword(email, code, newPassword);
      setServerError(null);
      return { ok: true };
    } catch (error) {
      reportServerError(error);
      return { ok: false, message: error instanceof Error ? error.message : undefined };
    }
  };

  const deleteRecord = async (recordId: string, reason: string) => {
    const pendingRecord = appData.records.find((record) => record.id === recordId && record.syncStatus);
    if (pendingRecord && ownerId) {
      await removePending(ownerId, `record:${recordId}`);
      setPendingCount((count) => Math.max(0, count - 1));
      setAppData((prev: AppData) => ({
        ...prev,
        records: prev.records.filter((record) => record.id !== recordId),
      }));
      return;
    }

    const previousRecords = appData.records;
    setAppData((prev: AppData) => ({
      ...prev,
      records: prev.records.filter((record) => record.id !== recordId),
      recordPagination: {
        ...prev.recordPagination,
        nextOffset: Math.max(0, prev.recordPagination.nextOffset - 1),
      },
    }));

    try {
      await api.deleteDailyRecord(recordId, reason);
      setServerError(null);
    } catch (error) {
      setAppData((prev: AppData) => ({
        ...prev,
        records: previousRecords,
      }));
      reportServerError(error);
      throw error;
    }
  };

  const loadMoreRecords = async () => {
    if (isLoadingMoreRecords || !appData.recordPagination.hasMore) return;

    setIsLoadingMoreRecords(true);
    try {
      const page = await api.listDailyRecords(RECORDS_PAGE_SIZE, appData.recordPagination.nextOffset);
      setAppData((prev) => {
        const existingIds = new Set(prev.records.map((record) => record.id));
        const newRecords = page.records.filter((record) => !existingIds.has(record.id));
        return {
          ...prev,
          records: [...prev.records, ...newRecords],
          recordPagination: {
            hasMore: page.hasMore,
            nextOffset: page.nextOffset,
          },
        };
      });
      setServerError(null);
    } catch (error) {
      reportServerError(error);
      throw error;
    } finally {
      setIsLoadingMoreRecords(false);
    }
  };

  const generateAuditPdf = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      let records = appData.records;
      let { hasMore, nextOffset } = appData.recordPagination;

      // O PDF continua completo, mas os registros antigos só são baixados quando solicitado.
      while (hasMore) {
        const page = await api.listDailyRecords(RECORDS_PAGE_SIZE, nextOffset);
        const knownIds = new Set(records.map((record) => record.id));
        records = [...records, ...page.records.filter((record) => !knownIds.has(record.id))];
        hasMore = page.hasMore;
        nextOffset = page.nextOffset;
      }

      if (records.length !== appData.records.length) {
        setAppData((prev) => ({
          ...prev,
          records,
          recordPagination: { hasMore, nextOffset },
        }));
      }
      // Sem conexão o relatório ainda sai, avisando o que não pôde ser consultado.
      const audit = await api.getAuditData().catch(() => null);
      await downloadAuditPdf({ ...appData, records, recordPagination: { hasMore, nextOffset } }, audit);
      setServerError(null);
    } catch (error) {
      reportServerError(error);
      throw error;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Só a colheita tem a etapa de destino: as outras atividades passam direto por ela, nos dois sentidos.
  const navigateRecordFlow = (target: Screen) => {
    if (target === "production-destination" && !isHarvestActivity(appData.currentRecord.activityType)) {
      setCurrentScreen(currentScreen === "production-location" ? "costs" : "production-location");
      return;
    }
    setCurrentScreen(target);
  };

  const handleBottomNavNavigate = (screen: Screen) => {
    if (screen === "activity-type") {
      if (currentScreen === "register-confirm") return;
      setRegisterConfirmFromScreen(currentScreen);
      setCurrentScreen("register-confirm");
      return;
    }
    setCurrentScreen(screen);
  };

  const showBottomNav = !!appData.auth?.isLoggedIn
    && !["splash", "login", "farmer-registration", "harvest-registration", "confirmation", "forgot-password"].includes(currentScreen) 
    && currentScreen !== "annual-questions"
    && currentScreen !== "activity-type" 
    && currentScreen !== "production"
    && currentScreen !== "production-location"
    && currentScreen !== "production-destination"
    && currentScreen !== "destination-details"
    && currentScreen !== "costs"
    && currentScreen !== "labor"
    && currentScreen !== "field-conditions"
    && currentScreen !== "observations";

  const showGlobalErrorBanner = !!serverError
    && (serverErrorTitle === "Sessão expirada"
      || !["farmer-registration", "confirmation", "login", "forgot-password"].includes(currentScreen));

  const renderScreen = () => {
    if (isRestoringSession) {
      return (
        <TelaInicial
          onNavigate={setCurrentScreen}
          hasFarmer={false}
          isLoggedIn={false}
        />
      );
    }

    if (!appData.auth?.isLoggedIn) {
      if (currentScreen === "splash") {
        return (
          <TelaInicial
            onNavigate={setCurrentScreen}
            hasFarmer={false}
            isLoggedIn={false}
          />
        );
      }

      if (currentScreen === "farmer-registration") {
        return (
          <CadastroAgricultor
            mode="register"
            onRegister={registerFarmerAccount}
            onNavigate={setCurrentScreen}
            backScreen="splash"
            initialFarmer={appData.farmer}
          />
        );
      }

      if (currentScreen === "forgot-password") {
        return (
          <EsqueciSenha
            onNavigate={setCurrentScreen}
            onRequestReset={requestPasswordReset}
            onVerifyResetCode={verifyPasswordResetCode}
            onResetPassword={resetPassword}
          />
        );
      }

      return (
        <Entrar
          onLogin={loginWithCredentials}
          onNavigate={setCurrentScreen}
        />
      );
    }

    switch (currentScreen) {
      case "splash":
        return (
          <TelaInicial
            onNavigate={setCurrentScreen}
            hasFarmer={!!appData.farmer}
            isLoggedIn={!!appData.auth?.isLoggedIn}
          />
        );
      case "login":
        return (
          <Entrar
            onLogin={loginWithCredentials}
            onNavigate={setCurrentScreen}
          />
        );
      case "farmer-registration":
        return (
          <CadastroAgricultor
            mode="edit"
            onSaveFarmer={updateFarmer}
            onNavigate={setCurrentScreen}
            backScreen="profile"
            initialFarmer={appData.farmer}
          />
        );
      case "harvest-registration":
        return (
          <CadastroSafra
            onSave={updateHarvest}
            onNavigate={setCurrentScreen}
            initialHarvest={appData.harvest}
            mode={appData.harvest ? "update" : "register"}
          />
        );
      case "main-menu":
        return (
          <MenuPrincipal
            onNavigate={setCurrentScreen}
            farmer={appData.farmer}
            harvest={appData.harvest}
            records={appData.records}
            onLogout={logout}
            onChangePassword={changePassword}
            onRegister={() => {
              setRegisterConfirmFromScreen("main-menu");
              setCurrentScreen("activity-type");
            }}
          />
        );
      case "annual-questions":
        return (
          <PerguntasAnuais
            currentYear={currentYear}
            initial={appData.annual?.[String(currentYear)] ?? null}
            onSave={saveAnnualAnswers}
            onNavigate={setCurrentScreen}
          />
        );
      case "register-confirm":
        return (
          <ConfirmarRegistro
            onCancel={() => setCurrentScreen(registerConfirmFromScreen)}
            onConfirm={() => setCurrentScreen("activity-type")}
          />
        );
      case "activity-type":
        return <TipoAtividade onSave={updateCurrentRecord} onNavigate={setCurrentScreen} onExitDailyRecord={exitDailyRecord} />;
      case "production":
        return (
          <Producao
            onSave={updateCurrentRecord}
            onNavigate={setCurrentScreen}
            onExitDailyRecord={exitDailyRecord}
            activityType={appData.currentRecord.activityType}
          />
        );
      case "production-location":
        return <LocalProducao onSave={updateCurrentRecord} onNavigate={navigateRecordFlow} onExitDailyRecord={exitDailyRecord} />;
      case "production-destination":
        return (
          <DestinoProducao
            onSave={updateCurrentRecord}
            onNavigate={setCurrentScreen}
            currentRecord={appData.currentRecord}
            onExitDailyRecord={exitDailyRecord}
          />
        );
      case "destination-details":
        return (
          <DetalhesDestino
            onSave={updateCurrentRecord}
            onNavigate={setCurrentScreen}
            destination={appData.currentRecord.destination || ""}
            onExitDailyRecord={exitDailyRecord}
          />
        );
      case "costs":
        return <Custos onSave={updateCurrentRecord} onNavigate={navigateRecordFlow} onExitDailyRecord={exitDailyRecord} />;
      case "labor":
        return <MaoDeObra onSave={updateCurrentRecord} onNavigate={setCurrentScreen} onExitDailyRecord={exitDailyRecord} />;
      case "field-conditions":
        return <CondicoesCampo onSave={updateCurrentRecord} onNavigate={setCurrentScreen} onExitDailyRecord={exitDailyRecord} />;
      case "observations":
        return <Observacoes onSave={updateCurrentRecord} onNavigate={setCurrentScreen} onExitDailyRecord={exitDailyRecord} />;
      case "confirmation":
        return <Confirmacao onNavigate={setCurrentScreen} onSave={saveRecord} onReset={resetCurrentRecord} />;
      case "history":
        return (
          <Historico
            records={appData.records}
            onNavigate={setCurrentScreen}
            onGeneratePdf={generateAuditPdf}
            onDeleteRecord={deleteRecord}
            hasMoreRecords={appData.recordPagination.hasMore}
            isLoadingMoreRecords={isLoadingMoreRecords}
            onLoadMoreRecords={loadMoreRecords}
            isGeneratingPdf={isGeneratingPdf}
          />
        );
      case "profile":
        return (
          <Perfil
            farmer={appData.farmer}
            harvest={appData.harvest}
            onNavigate={setCurrentScreen}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((current) => !current)}
            isReadAloudEnabled={isReadAloudEnabled}
            onToggleReadAloud={() => setIsReadAloudEnabled((current) => !current)}
          />
        );
      default:
        return (
          <TelaInicial
            onNavigate={setCurrentScreen}
            hasFarmer={!!appData.farmer}
            isLoggedIn={!!appData.auth?.isLoggedIn}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!!appData.auth?.isLoggedIn && (
        <SyncStatus
          pendingCount={pendingCount}
          isOnline={isNetworkOnline && (isServerReachable || pendingCount === 0)}
          isSyncing={isSyncing}
        />
      )}
      {showGlobalErrorBanner && (
        <div className="p-4">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTitle className="text-red-800">{serverErrorTitle}</AlertTitle>
              <AlertDescription className="gap-3">
                <p>{serverError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reloadFromServer().catch(() => {})}
                  disabled={isReloading}
                  className="border-red-200 text-red-700 hover:bg-red-50" >
                  {isReloading ? "Tentando..." : "Tentar novamente"}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <FormProgress screen={currentScreen} record={appData.currentRecord} />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-green-50 text-green-800">
            Carregando...
          </div>
        }
      >
        {renderScreen()}
      </Suspense>
      {showBottomNav && <BottomNav currentScreen={currentScreen} onNavigate={handleBottomNavNavigate} />}
    </div>
  );
}
