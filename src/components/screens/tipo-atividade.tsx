import { useState } from "react";
import { ArrowLeft, ArrowRight, Clipboard, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";
import { VoiceInput } from "../voice-input";

interface PropsTipoAtividade {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function TipoAtividade({ onSave, onNavigate, onExitDailyRecord }: PropsTipoAtividade) {
  const [activityType, setActivityType] = useState("");
  const [customActivity, setCustomActivity] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalActivity = activityType === "Outra" ? customActivity : activityType;
    onSave({ activityType: finalActivity });
    onNavigate("production");
  };

  const activities = [
    "Plantio",
    "Colheita",
    "Preparo da terra",
    "Capina",
    "Tratos culturais",
    "Outra"
  ];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Clipboard size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Atividade realizada hoje</h1>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {activities.map((activity) => (
                <label
                  key={activity}
                  className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="activityType"
                    value={activity}
                    checked={activityType === activity}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">{activity}</span>
                </label>
              ))}
              
              {activityType === "Outra" && (
                <VoiceInput
                  value={customActivity}
                  onChange={setCustomActivity}
                  placeholder="Digite a atividade"
                  className="w-full px-4 py-3 pr-14 border-2 border-green-500 rounded-lg text-lg focus:outline-none mt-2"
                  required
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6"
            >
              Continuar
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("register-confirm")}
              className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={22} />
              Voltar
            </button>
          </form>

        </div>
      </div>
      <ExitConfirmModal
        open={exitOpen}
        onCancel={() => setExitOpen(false)}
        onConfirm={() => {
          setExitOpen(false);
          onExitDailyRecord();
        }}
      />
    </div>
  );
}
