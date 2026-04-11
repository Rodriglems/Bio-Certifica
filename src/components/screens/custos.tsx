import { useState } from "react";
import { ArrowLeft, ArrowRight, DollarSign, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";
import { VoiceInput } from "../voice-input";

interface PropsCustos {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function Custos({ onSave, onNavigate, onExitDailyRecord }: PropsCustos) {
  const [hasExpense, setHasExpense] = useState<boolean | null>(null);
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [value, setValue] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasExpense === false) {
      onSave({ costs: { hasExpense: false } });
      onNavigate("labor");
      return;
    }

    const finalType = type === "Outro" ? customType : type;
    const finalLocation = purchaseLocation === "Outro" ? customLocation : purchaseLocation;
    
    onSave({
      costs: {
        hasExpense: true,
        type: finalType,
        value,
        purchaseLocation: finalLocation
      }
    });
    onNavigate("labor");
  };

  const types = ["Semente", "Adubo orgânico", "Transporte", "Energia", "Outro"];
  const values = ["Até R$50", "R$51–100", "Acima de R$100"];
  const locations = ["Comércio local", "Feira", "Cooperativa", "Outro"];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Custos do dia</h1>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sair do registro diário"
              onClick={() => setExitOpen(true)}
              className="rounded-xl transition-transform active:scale-90">
              <X className="text-gray-600" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Teve gasto hoje?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasExpense"
                    value="no"
                    checked={hasExpense === false}
                    onChange={() => setHasExpense(false)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Não</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hasExpense"
                    value="yes"
                    checked={hasExpense === true}
                    onChange={() => setHasExpense(true)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Sim</span>
                </label>
              </div>
            </div>

            {hasExpense === true && (
              <>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Tipo
                  </label>
                  <div className="space-y-2">
                    {types.map((t) => (
                      <label key={t} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value={t}
                          checked={type === t}
                          onChange={(e) => setType(e.target.value)}
                          className="w-5 h-5 text-green-600"
                          required
                        />
                        <span className="text-lg">{t}</span>
                      </label>
                    ))}
                    {type === "Outro" && (
                      <VoiceInput
                        value={customType}
                        onChange={setCustomType}
                        placeholder="Digite o tipo"
                        required
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Valor
                  </label>
                  <div className="space-y-2">
                    {values.map((v) => (
                      <label key={v} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                        <input
                          type="radio"
                          name="value"
                          value={v}
                          checked={value === v}
                          onChange={(e) => setValue(e.target.value)}
                          className="w-5 h-5 text-green-600"
                          required
                        />
                        <span className="text-lg">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Onde comprou
                  </label>
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <label key={loc} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                        <input
                          type="radio"
                          name="purchaseLocation"
                          value={loc}
                          checked={purchaseLocation === loc}
                          onChange={(e) => setPurchaseLocation(e.target.value)}
                          className="w-5 h-5 text-green-600"
                          required
                        />
                        <span className="text-lg">{loc}</span>
                      </label>
                    ))}
                    {purchaseLocation === "Outro" && (
                      <VoiceInput
                        value={customLocation}
                        onChange={setCustomLocation}
                        placeholder="Digite o local"
                        required
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6"
            >
              Continuar
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("production-destination")}
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
