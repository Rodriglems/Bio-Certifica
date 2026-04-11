import { useMemo, useState, type FormEvent } from "react";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Screen } from "../../App";
import { VoiceTextarea } from "../voice-textarea";

export interface RespostasAnuais {
  year: number;
  hadChanges: boolean;
  changesDetails?: string;
}

interface PropsPerguntasAnuais {
  currentYear: number;
  initial?: RespostasAnuais | null;
  onSave: (answers: RespostasAnuais) => void;
  onNavigate: (screen: Screen) => void;
}

export function PerguntasAnuais({ currentYear, initial, onSave, onNavigate }: PropsPerguntasAnuais) {
  const [hadChanges, setHadChanges] = useState<boolean | null>(initial?.hadChanges ?? null);
  const [details, setDetails] = useState(initial?.changesDetails ?? "");

  const canSubmit = useMemo(() => {
    if (hadChanges === null) return false;
    if (hadChanges === true) return details.trim().length > 0;
    return true;
  }, [hadChanges, details]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || hadChanges === null) return;

    onSave({
      year: currentYear,
      hadChanges,
      changesDetails: hadChanges ? details.trim() : undefined
    });
    onNavigate("main-menu");
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
            <div className="bg-green-100 p-3 rounded-full">
              <CalendarClock size={28} className="text-green-700" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800">Perguntas do Ano</h1>
              <p className="text-sm text-gray-600 mt-1">Ano {currentYear}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Houve mudanças importantes na propriedade ou na produção este ano?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hadChanges"
                    value="no"
                    checked={hadChanges === false}
                    onChange={() => setHadChanges(false)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Não</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hadChanges"
                    value="yes"
                    checked={hadChanges === true}
                    onChange={() => setHadChanges(true)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Sim</span>
                </label>
              </div>
            </div>

            {hadChanges === true && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Descreva (de forma simples)
                </label>
                <VoiceTextarea
                  value={details}
                  onChange={setDetails}
                  placeholder="Ex.: ampliei a área, troquei a cultura principal, comprei insumos..."
                  rows={5}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 px-6 rounded-xl text-lg font-bold transition-colors flex items-center justify-center gap-2 mt-2 ${
                canSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Salvar
              <ArrowRight size={24} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("main-menu")}
              className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Fazer depois
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
