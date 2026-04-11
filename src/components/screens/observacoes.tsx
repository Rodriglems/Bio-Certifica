import { useState } from "react";
import { ArrowLeft, ArrowRight, FileText, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { VoiceTextarea } from "../voice-textarea";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";

interface PropsObservacoes {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function Observacoes({ onSave, onNavigate, onExitDailyRecord }: PropsObservacoes) {
  const [hasObservation, setHasObservation] = useState<boolean | null>(null);
  const [observation, setObservation] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      observations: hasObservation ? observation : undefined
    });
    onNavigate("confirmation");
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Observações</h1>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sair do registro diário"
              onClick={() => setExitOpen(true)}
              className="rounded-xl transition-transform active:scale-90"
            >
              <X className="text-gray-600" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Deseja registrar algo?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasObservation"
                    value="no"
                    checked={hasObservation === false}
                    onChange={() => setHasObservation(false)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Não</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasObservation"
                    value="yes"
                    checked={hasObservation === true}
                    onChange={() => setHasObservation(true)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Sim</span>
                </label>
              </div>
            </div>

            {hasObservation === true && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Observação
                </label>
                <VoiceTextarea
                  value={observation}
                  onChange={setObservation}
                  placeholder="Digite (ou fale) suas observações aqui..."
                  rows={5}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6"
            >
              Salvar registro
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("field-conditions")}
              className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={22} />
              Voltar
            </button>
          </form>

          <ExitConfirmModal
            open={exitOpen}
            onCancel={() => setExitOpen(false)}
            onConfirm={() => {
              setExitOpen(false);
              onExitDailyRecord();
            }}
          />

        </div>
      </div>
    </div>
  );
}
