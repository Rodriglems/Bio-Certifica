import { useState } from "react";
import { ArrowLeft, ArrowRight, FileText, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";
import { VoiceInput } from "../voice-input";

interface PropsDetalhesDestino {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  destination: string;
  onExitDailyRecord: () => void;
}

export function DetalhesDestino({ onSave, onNavigate, destination, onExitDailyRecord }: PropsDetalhesDestino) {
  const [saleValue, setSaleValue] = useState("");
  const [buyer, setBuyer] = useState("");
  const [customBuyer, setCustomBuyer] = useState("");
  const [exchangeItem, setExchangeItem] = useState("");
  const [customExchange, setCustomExchange] = useState("");
  const [donationRecipient, setDonationRecipient] = useState("");
  const [customDonation, setCustomDonation] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const details: any = {};
    
    if (destination === "Venda") {
      details.saleValue = saleValue;
      details.buyer = buyer === "Outro" ? customBuyer : buyer;
    } else if (destination === "Troca") {
      details.exchangeItem = exchangeItem === "Outro" ? customExchange : exchangeItem;
    } else if (destination === "Doação") {
      details.donationRecipient = donationRecipient === "Outro" ? customDonation : donationRecipient;
    }
    
    onSave({ destinationDetails: details });
    onNavigate("costs");
  };

  const saleValues = ["Até R$50", "R$51–100", "Acima de R$100", "Outro"];
  const buyers = ["Feira", "Vizinho", "Programa", "Outro"];
  const exchanges = ["Alimento", "Insumo", "Serviço", "Outro"];
  const donations = ["Família", "Vizinho", "Comunidade", "Outro"];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">Detalhes do destino</h1>
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
            {destination === "Venda" && (
              <>
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Valor
                  </label>
                  <div className="space-y-2">
                    {saleValues.map((value) => (
                      <label key={value} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                        <input
                          type="radio"
                          name="saleValue"
                          value={value}
                          checked={saleValue === value}
                          onChange={(e) => setSaleValue(e.target.value)}
                          className="w-5 h-5 text-green-600"
                          required
                        />
                        <span className="text-lg">{value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-3">
                    Para quem
                  </label>
                  <div className="space-y-2">
                    {buyers.map((b) => (
                      <label key={b} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                        <input
                          type="radio"
                          name="buyer"
                          value={b}
                          checked={buyer === b}
                          onChange={(e) => setBuyer(e.target.value)}
                          className="w-5 h-5 text-green-600"
                          required
                        />
                        <span className="text-lg">{b}</span>
                      </label>
                    ))}
                    {buyer === "Outro" && (
                      <VoiceInput
                        value={customBuyer}
                        onChange={setCustomBuyer}
                        placeholder="Digite para quem"
                        required
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {destination === "Troca" && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Trocou por quê?
                </label>
                <div className="space-y-2">
                  {exchanges.map((ex) => (
                    <label key={ex} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                      <input
                        type="radio"
                        name="exchangeItem"
                        value={ex}
                        checked={exchangeItem === ex}
                        onChange={(e) => setExchangeItem(e.target.value)}
                        className="w-5 h-5 text-green-600"
                        required
                      />
                      <span className="text-lg">{ex}</span>
                    </label>
                  ))}
                  {exchangeItem === "Outro" && (
                    <VoiceInput
                      value={customExchange}
                      onChange={setCustomExchange}
                      placeholder="Digite o item"
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {destination === "Doação" && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Doou para quem?
                </label>
                <div className="space-y-2">
                  {donations.map((don) => (
                    <label key={don} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                      <input
                        type="radio"
                        name="donationRecipient"
                        value={don}
                        checked={donationRecipient === don}
                        onChange={(e) => setDonationRecipient(e.target.value)}
                        className="w-5 h-5 text-green-600"
                        required
                      />
                      <span className="text-lg">{don}</span>
                    </label>
                  ))}
                  {donationRecipient === "Outro" && (
                    <VoiceInput
                      value={customDonation}
                      onChange={setCustomDonation}
                      placeholder="Digite para quem"
                      required
                    />
                  )}
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
