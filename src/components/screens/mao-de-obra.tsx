import { useState } from "react";
import { ArrowLeft, ArrowRight, Users, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";
import { VoiceInput } from "../voice-input";

interface PropsMaoDeObra {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function MaoDeObra({ onSave, onNavigate, onExitDailyRecord }: PropsMaoDeObra) {
  const [laborType, setLaborType] = useState("");
  const [customType, setCustomType] = useState("");
  const [peopleCount, setPeopleCount] = useState("");
  const [hadPayment, setHadPayment] = useState<boolean | null>(null);
  const [paymentValue, setPaymentValue] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalType = laborType === "Outro" ? customType : laborType;
    
    onSave({
      labor: {
        type: finalType,
        peopleCount,
        hadPayment: hadPayment || false,
        paymentValue: hadPayment ? paymentValue : undefined
      }
    });
    onNavigate("field-conditions");
  };

  const laborTypes = [
    "Só o agricultor",
    "Família",
    "Diarista",
    "Família + diarista",
    "Outro"
  ];
  
  const peopleCounts = ["1", "2–3", "+3"];
  const paymentValues = ["Até R$50", "R$51–100", "Acima de R$100"];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Users size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Mão de obra</h1>
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
                Tipo de mão de obra
              </label>
              <div className="space-y-2">
                {laborTypes.map((type) => (
                  <label key={type} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="laborType"
                      value={type}
                      checked={laborType === type}
                      onChange={(e) => setLaborType(e.target.value)}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{type}</span>
                  </label>
                ))}
                {laborType === "Outro" && (
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
                Quantidade de pessoas
              </label>
              <div className="space-y-2">
                {peopleCounts.map((count) => (
                  <label key={count} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="peopleCount"
                      value={count}
                      checked={peopleCount === count}
                      onChange={(e) => setPeopleCount(e.target.value)}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{count}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Houve pagamento?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hadPayment"
                    value="no"
                    checked={hadPayment === false}
                    onChange={() => setHadPayment(false)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Não</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hadPayment"
                    value="yes"
                    checked={hadPayment === true}
                    onChange={() => setHadPayment(true)}
                    className="w-6 h-6 text-green-600"
                    required
                  />
                  <span className="text-lg font-medium">Sim</span>
                </label>
              </div>
            </div>

            {hadPayment === true && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Valor do pagamento
                </label>
                <div className="space-y-2">
                  {paymentValues.map((val) => (
                    <label key={val} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentValue"
                        value={val}
                        checked={paymentValue === val}
                        onChange={(e) => setPaymentValue(e.target.value)}
                        className="w-5 h-5 text-green-600"
                        required
                      />
                      <span className="text-lg">{val}</span>
                    </label>
                  ))}
                </div>
              </div>
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
              onClick={() => onNavigate("costs")}
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
