import { useState } from "react";
import { ArrowLeft, ArrowRight, Package, X } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import { VoiceInput } from "../voice-input";
import { Button } from "../ui/button";
import { ExitConfirmModal } from "../exit-confirm-modal";

interface PropsProducao {
  onSave: (data: Partial<DailyRecord>) => void;
  onNavigate: (screen: Screen) => void;
  onExitDailyRecord: () => void;
}

export function Producao({ onSave, onNavigate, onExitDailyRecord }: PropsProducao) {
  const [product, setProduct] = useState("");
  const [customProduct, setCustomProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct = product === "Outra" ? customProduct : product;
    const finalUnit = unit === "Outra" ? customUnit : unit;
    
    onSave({
      production: {
        product: finalProduct,
        quantity,
        unit: finalUnit
      }
    });
    onNavigate("production-location");
  };

  const products = ["Milho", "Feijão", "Hortaliças", "Mandioca", "Outra"];
  const units = ["kg", "Dúzia", "Maço", "Caixa", "Outra"];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b-2 border-green-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <Package size={28} className="text-green-700" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-green-800">
                Produção do dia
              </h1>
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
                O que foi produzido ou colhido?
              </label>
              <div className="space-y-2">
                {products.map((p) => (
                  <label key={p} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="product"
                      value={p}
                      checked={product === p}
                      onChange={(e) => setProduct(e.target.value)}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{p}</span>
                  </label>
                ))}
                {product === "Outra" && (
                  <VoiceInput
                    value={customProduct}
                    onChange={setCustomProduct}
                    placeholder="Digite o produto"
                    className="block w-full px-4 py-3 pr-14 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                    required />
                )}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Quantidade
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Digite a quantidade"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Unidade
              </label>
              <div className="space-y-2">
                {units.map((u) => (
                  <label key={u} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="unit"
                      value={u}
                      checked={unit === u}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{u}</span>
                  </label>
                ))}
                {unit === "Outra" && (
                  <VoiceInput
                    value={customUnit}
                    onChange={setCustomUnit}
                    placeholder="Digite a unidade"
                    className="block w-full px-4 py-3 pr-14 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                    required
                  />
                )}
              </div>
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
              onClick={() => onNavigate("activity-type")}
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
