import { Capacitor } from "@capacitor/core";
import { SpeechRecognition as NativeSpeech } from "@capacitor-community/speech-recognition";

// A WebView do Android expõe webkitSpeechRecognition, mas ele não funciona lá.
// Por isso o app instalado usa o reconhecedor nativo e só o navegador usa a API web.

type WebRecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }>>;

interface WebRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: WebRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type WebRecognitionConstructor = new () => WebRecognition;

export interface DictationCallbacks {
  onText: (text: string) => void;
  onEnd: (errorMessage?: string) => void;
}

const MESSAGES = {
  permission: "O microfone está bloqueado. Permita o uso do microfone nas configurações do celular.",
  network: "O ditado por voz precisa de internet. Sem conexão, digite a resposta.",
  noSpeech: "Não ouvi nada. Toque no microfone e fale de novo.",
  unavailable: "Este aparelho não tem reconhecimento de voz. Digite a resposta.",
  noMicrophone: "Não encontrei um microfone neste aparelho.",
  generic: "Não foi possível usar o microfone agora. Tente de novo ou digite a resposta.",
};

function getWebRecognition(): WebRecognitionConstructor | undefined {
  const scope = window as unknown as {
    SpeechRecognition?: WebRecognitionConstructor;
    webkitSpeechRecognition?: WebRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

export function isDictationSupported() {
  return Capacitor.isNativePlatform() || !!getWebRecognition();
}

function nativeErrorMessage(raw: string): string | undefined {
  const text = raw.toLowerCase();
  if (text.includes("permission")) return MESSAGES.permission;
  if (text.includes("network")) return MESSAGES.network;
  if (text.includes("match") || text.includes("timeout") || text.includes("understand") || text.includes("input")) {
    return MESSAGES.noSpeech;
  }
  if (text.includes("not available")) return MESSAGES.unavailable;
  return MESSAGES.generic;
}

function webErrorMessage(code: string): string | undefined {
  switch (code) {
    case "aborted":
      return undefined;
    case "not-allowed":
    case "service-not-allowed":
      return MESSAGES.permission;
    case "network":
      return MESSAGES.network;
    case "no-speech":
      return MESSAGES.noSpeech;
    case "audio-capture":
      return MESSAGES.noMicrophone;
    default:
      return MESSAGES.generic;
  }
}

function startNative(callbacks: DictationCallbacks) {
  void (async () => {
    try {
      const { available } = await NativeSpeech.available();
      if (!available) {
        callbacks.onEnd(MESSAGES.unavailable);
        return;
      }

      let permission = await NativeSpeech.checkPermissions();
      if (permission.speechRecognition !== "granted") {
        permission = await NativeSpeech.requestPermissions();
      }
      if (permission.speechRecognition !== "granted") {
        callbacks.onEnd(MESSAGES.permission);
        return;
      }

      // Com partialResults, o plugin descarta os erros depois de iniciar e o botão
      // ficaria preso em "ouvindo". Sem ele, a promessa sempre traz resultado ou erro.
      const result = await NativeSpeech.start({
        language: "pt-BR",
        maxResults: 1,
        partialResults: false,
        popup: false,
      });
      const text = result?.matches?.[0];
      if (text) callbacks.onText(text);
      callbacks.onEnd();
    } catch (error) {
      callbacks.onEnd(nativeErrorMessage(error instanceof Error ? error.message : String(error)));
    }
  })();

  return () => {
    // O stop() do plugin nunca conclui a promessa; o resultado chega pelo start().
    void NativeSpeech.stop().catch(() => undefined);
  };
}

function startWeb(callbacks: DictationCallbacks) {
  const Recognition = getWebRecognition();
  if (!Recognition) {
    callbacks.onEnd(MESSAGES.unavailable);
    return () => undefined;
  }

  const recognition = new Recognition();
  let lastError: string | undefined;

  recognition.lang = "pt-BR";
  recognition.interimResults = true;
  // No Chrome do Android, o modo contínuo repete as palavras já reconhecidas.
  recognition.continuous = !/android/i.test(navigator.userAgent);

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0]?.transcript ?? "";
    }
    callbacks.onText(transcript);
  };
  recognition.onerror = (event) => {
    lastError = webErrorMessage(event.error);
  };
  recognition.onend = () => callbacks.onEnd(lastError);

  try {
    recognition.start();
  } catch {
    callbacks.onEnd(MESSAGES.generic);
  }

  return () => recognition.stop();
}

let finishActiveSession: (() => void) | null = null;

/** Inicia o ditado e devolve a função que o encerra. Só um campo escuta por vez. */
export function startDictation(callbacks: DictationCallbacks) {
  finishActiveSession?.();

  let finished = false;
  const finish = (errorMessage?: string) => {
    if (finished) return;
    finished = true;
    if (finishActiveSession === finishThisSession) finishActiveSession = null;
    callbacks.onEnd(errorMessage);
  };
  const finishThisSession = () => {
    stop();
    finish();
  };
  finishActiveSession = finishThisSession;

  const guarded: DictationCallbacks = {
    onText: (text) => {
      if (!finished) callbacks.onText(text);
    },
    onEnd: finish,
  };

  const stop = Capacitor.isNativePlatform() ? startNative(guarded) : startWeb(guarded);
  return stop;
}
