import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

type SpeechRecognitionType = typeof window.SpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionType;
  }
}

interface VoiceInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function VoiceInput({ value, onChange, placeholder, required, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript ?? "";
      }

      const cleaned = transcript.trim();
      if (!cleaned) return;
      const next = value.trim().length ? `${value.trim()} ${cleaned}` : cleaned;
      onChange(next);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) recognition.stop();
    else recognition.start();
  };

  const buttonTitle = useMemo(() => (isListening ? "Parar gravação" : "Falar"), [isListening]);
  const baseInputClass =
    "block w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none";

  return (
    <div className="voice-field">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`${baseInputClass} ${isSupported ? "voice-field-input--with-mic" : ""} ${className ?? ""}`.trim()}
      />

      {isSupported && (
        <button
          type="button"
          onClick={toggle}
          title={buttonTitle}
          aria-label={buttonTitle}
          className={`voice-field-button voice-field-button--center transition-colors ${
            isListening
              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              : "bg-white text-green-700 border-green-200 hover:bg-green-50"
          }`}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      )}
    </div>
  );
}
