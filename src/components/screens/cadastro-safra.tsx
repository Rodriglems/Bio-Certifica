import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Leaf } from "lucide-react";
import { Screen, Harvest } from "../../App";
import { VoiceInput } from "../voice-input";

interface PropsCadastroSafra {
  onSave: (harvest: Harvest) => void;
  onNavigate: (screen: Screen) => void;
  initialHarvest?: Harvest | null;
  mode?: "register" | "update";
}

const MAIN_CROP_OPTIONS = ["Milho", "Feijão", "Mandioca", "Hortaliças", "Outra"];
const SEED_TYPE_OPTIONS = ["Crioula", "Comercial", "Guardada da produção", "Outra"];
const CULTIVATION_SYSTEM_OPTIONS = ["Consorciado", "Monocultivo", "Rotação de culturas", "Outro"];
const PLANTED_AREA_OPTIONS = ["< 0,5 ha", "0,5 – 1 ha", "1 – 2 ha", "Outra"];

function getOptionValue(value: string | undefined, options: string[], fallbackOption: string) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return { selected: "", custom: "" };
  if (options.includes(cleaned)) return { selected: cleaned, custom: "" };
  return { selected: fallbackOption, custom: cleaned };
}

export function CadastroSafra({
  onSave,
  onNavigate,
  initialHarvest,
  mode = "register",
}: PropsCadastroSafra) {
  const isUpdateMode = mode === "update";
  const backScreen: Screen = isUpdateMode ? "profile" : "farmer-registration";
  const [formData, setFormData] = useState<Harvest>({
    mainCrop: "",
    seedType: "",
    cultivationSystem: "",
    plantedArea: ""
  });
  const [customCrop, setCustomCrop] = useState("");
  const [customSeed, setCustomSeed] = useState("");
  const [customSystem, setCustomSystem] = useState("");
  const [customArea, setCustomArea] = useState("");

  useEffect(() => {
    const mainCrop = getOptionValue(initialHarvest?.mainCrop, MAIN_CROP_OPTIONS, "Outra");
    const seedType = getOptionValue(initialHarvest?.seedType, SEED_TYPE_OPTIONS, "Outra");
    const cultivationSystem = getOptionValue(initialHarvest?.cultivationSystem, CULTIVATION_SYSTEM_OPTIONS, "Outro");
    const plantedArea = getOptionValue(initialHarvest?.plantedArea, PLANTED_AREA_OPTIONS, "Outra");

    setFormData({
      mainCrop: mainCrop.selected,
      seedType: seedType.selected,
      cultivationSystem: cultivationSystem.selected,
      plantedArea: plantedArea.selected,
    });
    setCustomCrop(mainCrop.custom);
    setCustomSeed(seedType.custom);
    setCustomSystem(cultivationSystem.custom);
    setCustomArea(plantedArea.custom);
  }, [initialHarvest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      mainCrop: formData.mainCrop === "Outra" ? customCrop : formData.mainCrop,
      seedType: formData.seedType === "Outra" ? customSeed : formData.seedType,
      cultivationSystem: formData.cultivationSystem === "Outro" ? customSystem : formData.cultivationSystem,
      plantedArea: formData.plantedArea === "Outra" ? customArea : formData.plantedArea
    };
    onSave(finalData);
    onNavigate("main-menu");
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
            <div className="bg-green-100 p-3 rounded-full">
              <Leaf size={28} className="text-green-700" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-green-800">
              {isUpdateMode ? "Atualizar dados da safra" : "Cadastro da Safra"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cultura Principal */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                1. Cultura principal
              </label>
              <div className="space-y-2">
                {MAIN_CROP_OPTIONS.map((crop) => (
                  <label key={crop} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="mainCrop"
                      value={crop}
                      checked={formData.mainCrop === crop}
                      onChange={(e) => setFormData({ ...formData, mainCrop: e.target.value })}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{crop}</span>
                  </label>
                ))}
                {formData.mainCrop === "Outra" && (
                  <VoiceInput
                    value={customCrop}
                    onChange={setCustomCrop}
                    placeholder="Digite a cultura"
                    required
                  />
                )}
              </div>
            </div>

            {/* Tipo de Semente */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                2. Tipo de semente
              </label>
              <div className="space-y-2">
                {SEED_TYPE_OPTIONS.map((seed) => (
                  <label key={seed} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="seedType"
                      value={seed}
                      checked={formData.seedType === seed}
                      onChange={(e) => setFormData({ ...formData, seedType: e.target.value })}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{seed}</span>
                  </label>
                ))}
                {formData.seedType === "Outra" && (
                  <VoiceInput
                    value={customSeed}
                    onChange={setCustomSeed}
                    placeholder="Digite o tipo"
                    required
                  />
                )}
              </div>
            </div>

            {/* Sistema de Cultivo */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                3. Sistema de cultivo
              </label>
              <div className="space-y-2">
                {CULTIVATION_SYSTEM_OPTIONS.map((system) => (
                  <label key={system} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="cultivationSystem"
                      value={system}
                      checked={formData.cultivationSystem === system}
                      onChange={(e) => setFormData({ ...formData, cultivationSystem: e.target.value })}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{system}</span>
                  </label>
                ))}
                {formData.cultivationSystem === "Outro" && (
                  <VoiceInput
                    value={customSystem}
                    onChange={setCustomSystem}
                    placeholder="Digite o sistema"
                    required
                  />
                )}
              </div>
            </div>

            {/* Área Plantada */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                4. Área plantada
              </label>
              <div className="space-y-2">
                {PLANTED_AREA_OPTIONS.map((area) => (
                  <label key={area} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="plantedArea"
                      value={area}
                      checked={formData.plantedArea === area}
                      onChange={(e) => setFormData({ ...formData, plantedArea: e.target.value })}
                      className="w-5 h-5 text-green-600"
                      required
                    />
                    <span className="text-lg">{area}</span>
                  </label>
                ))}
                {formData.plantedArea === "Outra" && (
                  <VoiceInput
                    value={customArea}
                    onChange={setCustomArea}
                    placeholder="Digite a área"
                    required
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isUpdateMode ? "Salvar alterações" : "Salvar safra"}
              <ArrowRight size={24} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate(backScreen)}
              className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={22} />
              Voltar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
