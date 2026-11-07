import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { isDictationSupported, startDictation } from "../lib/dictation";
import { stopSpeaking } from "../lib/tts";

/** Paddings aplicados inline: as utilitárias px-* dos campos venceriam uma classe CSS. */
export const VOICE_FIELD_PADDING = { paddingRight: "3.25rem" };

export function useDictation(value: string, onChange: (next: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(isDictationSupported);

  const stopRef = useRef<(() => void) | null>(null);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  useEffect(() => () => stopRef.current?.(), []);

  const toggle = () => {
    if (isListening) {
      stopRef.current?.();
      setIsListening(false);
      return;
    }

    // O ditado complementa o que já está no campo, sem substituir.
    const base = latest.current.value.trim();
    setError(null);
    setIsListening(true);
    stopSpeaking();

    stopRef.current = startDictation({
      onText: (text) => {
        const spoken = text.trim();
        if (spoken) latest.current.onChange(base ? `${base} ${spoken}` : spoken);
      },
      onEnd: (errorMessage) => {
        setIsListening(false);
        setError(errorMessage ?? null);
      },
    });
  };

  return { isListening, isSupported, error, toggle };
}

interface VoiceMicButtonProps {
  isListening: boolean;
  onClick: () => void;
  placement: "center" | "top";
}

export function VoiceMicButton({ isListening, onClick, placement }: VoiceMicButtonProps) {
  const label = isListening ? "Parar de ouvir" : "Falar a resposta";

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isListening}
      className={`voice-mic voice-mic--${placement} ${isListening ? "voice-mic--listening" : ""}`.trim()}
    >
      <Mic size={22} strokeWidth={2.25} />
    </button>
  );
}

export function VoiceFieldStatus({ isListening, error }: { isListening: boolean; error: string | null }) {
  if (!isListening && !error) return null;

  return (
    <p role="status" className={`voice-field-status ${error ? "voice-field-status--error" : ""}`.trim()}>
      {error ?? "Ouvindo… fale agora."}
    </p>
  );
}
