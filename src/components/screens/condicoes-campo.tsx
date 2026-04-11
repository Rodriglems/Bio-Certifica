import { useState } from "react";
import { ArrowLeft, ArrowRight, Cloud, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";
import { VoiceTextarea } from "../voice-textarea";
import { VoiceInput } from "../voice-input";

interface PropsCondicoesCampo {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function CondicoesCampo({ onSave, onNavigate, onExitDailyRecord }: PropsCondicoesCampo) {
  const [weather, setWeather] = useState("");
  const [occurrences, setOccurrences] = useState<string[]>([]);
  const [occurrenceDetails, setOccurrenceDetails] = useState("");
  const [pestOrDiseaseFound, setPestOrDiseaseFound] = useState("");
  const [appliedProduct, setAppliedProduct] = useState("");
  const [homemadeProductPreparation, setHomemadeProductPreparation] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleOccurrence = (occ: string) => {
    setFormError(null);
    setOccurrences((prev) => {
      const has = prev.includes(occ);
      if (has) return prev.filter((item) => item !== occ);
      if (occ === "Nenhuma") return ["Nenhuma"];
      return [...prev.filter((item) => item !== "Nenhuma"), occ];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (occurrences.length === 0) {
      setFormError("Selecione pelo menos uma ocorrência.");
      return;
    }

    const hasOther = occurrences.includes("Outra");
    if (hasOther && !occurrenceDetails.trim()) {
      setFormError("Descreva a opção 'Outra'.");
      return;
    }

    const requiresPestDiseaseDetails = occurrences.includes("Praga") || occurrences.includes("Doença");
    if (requiresPestDiseaseDetails && (!pestOrDiseaseFound.trim() || !appliedProduct.trim())) {
      setFormError("Preencha os detalhes de praga/doença e o produto aplicado.");
      return;
    }

    const finalOccurrence = occurrences
      .map((occ) => (occ === "Outra" ? occurrenceDetails.trim() : occ))
      .filter(Boolean)
      .join(", ");

    onSave({
      fieldConditions: {
        weather,
        occurrences: finalOccurrence,
        occurrenceDetails: hasOther ? occurrenceDetails.trim() : undefined,
        pestOrDiseaseFound: requiresPestDiseaseDetails ? pestOrDiseaseFound.trim() : undefined,
        appliedProduct: requiresPestDiseaseDetails ? appliedProduct.trim() : undefined,
        homemadeProductPreparation: requiresPestDiseaseDetails ? homemadeProductPreparation.trim() : undefined
      }
    });
    onNavigate("observations");
  };

  const weatherOptions = ["Sol", "Nublado", "Chuva", "Misto"];
  const occurrenceOptions = [
    "Nenhuma",
    "Praga",
    "Doença",
    "Falta de chuva",
    "Excesso de chuva",
    "Outra"
  ];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Cloud size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Condições do campo</h1>
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
              Clima
              </label>
              <div className="space-y-2">
                {weatherOptions.map((w) => (
                  <label key={w} className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="weather"
                      value={w}
                      checked={weather === w}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-6 h-6 text-green-600"
                      required
                    />
                    <span className="text-lg font-medium">{w}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Ocorrências
              </label>
              <p className="text-sm text-gray-500 mb-2">Pode marcar mais de uma opção.</p>
              <div className="space-y-2">
                {occurrenceOptions.map((occ) => (
                  <label key={occ} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="occurrences[]"
                      value={occ}
                      checked={occurrences.includes(occ)}
                      onChange={() => toggleOccurrence(occ)}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="text-lg">{occ}</span>
                  </label>
                ))}
                {occurrences.includes("Outra") && (
                  <VoiceInput
                    value={occurrenceDetails}
                    onChange={setOccurrenceDetails}
                    placeholder="Digite (ou fale) a ocorrência"
                    required
                  />
                )}
              </div>
            </div>

            {(occurrences.includes("Praga") || occurrences.includes("Doença")) && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-4 space-y-4">
                <h2 className="text-lg font-bold text-green-800">Detalhes da ocorrência</h2>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Qual praga ou doença você encontrou?
                  </label>
                  <VoiceTextarea
                    value={pestOrDiseaseFound}
                    onChange={setPestOrDiseaseFound}
                    placeholder="Ex.: lagarta, pulgão, ferrugem..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Qual produto você aplicou?
                  </label>
                  <VoiceTextarea
                    value={appliedProduct}
                    onChange={setAppliedProduct}
                    placeholder="Ex.: calda de nim, biofertilizante, outro..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Se o produto foi feito por você, como preparou?
                  </label>
                  <VoiceTextarea
                    value={homemadeProductPreparation}
                    onChange={setHomemadeProductPreparation}
                    placeholder="Descreva o preparo (opcional)"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6">
              Continuar
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("labor")}
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
