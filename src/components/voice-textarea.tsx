import { useDictation, VoiceFieldStatus, VoiceMicButton, VOICE_FIELD_PADDING } from "./voice-mic";

interface VoiceTextareaProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

export function VoiceTextarea({ value, onChange, placeholder, rows = 5, required, className }: VoiceTextareaProps) {
  const { isListening, isSupported, error, toggle } = useDictation(value, onChange);
  const baseTextareaClass =
    "block w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none resize-none";

  return (
    <div>
      <div className="voice-field">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          style={isSupported ? VOICE_FIELD_PADDING : undefined}
          className={`${baseTextareaClass} ${className ?? ""}`.trim()}
        />
        {isSupported && <VoiceMicButton isListening={isListening} onClick={toggle} placement="top" />}
      </div>
      <VoiceFieldStatus isListening={isListening} error={error} />
    </div>
  );
}
