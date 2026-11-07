import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

const LANGUAGE = "pt-BR";

function normalizeForSpeech(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\*/g, "")
    .replace(/<\s*(\d)/g, "menos de $1")
    .replace(/\+\s*(\d)/g, "mais de $1")
    .replace(/(\d)\s*[–-]\s*(\d)/g, "$1 a $2")
    .replace(/\bha\b/g, "hectare")
    .replace(/\bkg\b/gi, "quilo")
    .trim();
}

export function isSpeechSupported() {
  return Capacitor.isNativePlatform() || "speechSynthesis" in window;
}

function findPortugueseVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === "pt-br")
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"))
  );
}

export function speak(rawText: string) {
  const text = normalizeForSpeech(rawText);
  if (!text) return;

  if (Capacitor.isNativePlatform()) {
    void (async () => {
      await TextToSpeech.stop().catch(() => undefined);
      await TextToSpeech.speak({ text, lang: LANGUAGE, rate: 0.95, category: "playback" });
    })().catch((error) => console.warn("[tts] falha ao falar", error));
    return;
  }

  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGE;
  utterance.rate = 0.95;
  const voice = findPortugueseVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (Capacitor.isNativePlatform()) {
    void TextToSpeech.stop().catch(() => undefined);
    return;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
