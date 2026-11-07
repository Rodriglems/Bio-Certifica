import { useDictation, VoiceFieldStatus, VoiceMicButton, VOICE_FIELD_PADDING } from "./voice-mic";

interface VoiceInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function VoiceInput({ value, onChange, placeholder, required, className }: VoiceInputProps) {
  const { isListening, isSupported, error, toggle } = useDictation(value, onChange);
  const baseInputClass =
    "block w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none";

  return (
    <div>
      <div className="voice-field">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={isSupported ? VOICE_FIELD_PADDING : undefined}
          className={`${baseInputClass} ${className ?? ""}`.trim()}
        />
        {isSupported && <VoiceMicButton isListening={isListening} onClick={toggle} placement="center" />}
      </div>
      <VoiceFieldStatus isListening={isListening} error={error} />
    </div>
  );
}
