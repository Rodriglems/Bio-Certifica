import { CheckCircle, PlusCircle, Home } from "lucide-react";
import { Screen } from "../../App";
import { useEffect, useRef, useState } from "react";

interface PropsConfirmacao {
  onNavigate: (screen: Screen) => void;
  onSave: () => Promise<{ ok: boolean; message?: string }>;
  onReset: () => void;
}

export function Confirmacao({ onNavigate, onSave, onReset }: PropsConfirmacao) {
  const hasSavedRef = useRef(false);
  const [status, setStatus] = useState<"saving" | "success" | "error">("saving");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    void (async () => {
      setStatus("saving");
      setLocalError(null);
      const result = await onSave();
      if (result.ok) {
        setStatus("success");
        setLocalError(null);
      } else {
        setStatus("error");
        setLocalError(result.message ?? "Não foi possível salvar no servidor.");
      }
    })();
  }, [onSave]);

  const handleNewRecord = () => {
    onReset();
    onNavigate("activity-type");
  };

  const handleBackToMenu = () => {
    onReset();
    onNavigate("main-menu");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-600 to-green-800">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-6">
              <CheckCircle size={64} className="text-green-600" strokeWidth={2} />
            </div>
          </div>

          <div className="space-y-2">
            {status === "saving" && (
              <>
                <h1 className="text-3xl font-bold text-green-800">Salvando...</h1>
                <p className="text-lg text-gray-600">Aguarde a confirmação do servidor.</p>
              </>
            )}

            {status === "success" && (
              <>
                <h1 className="text-3xl font-bold text-green-800">Registro salvo com sucesso!</h1>
                <p className="text-lg text-gray-600">Seus dados foram salvos e podem ser consultados no histórico.</p>
              </>
            )}

            {status === "error" && (
              <>
                <h1 className="text-3xl font-bold text-red-800">Falha ao salvar</h1>
                <p className="text-lg text-gray-600">O registro não foi gravado no banco.</p>
              </>
            )}
          </div>

          {status === "error" && localError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-left">
              {localError}
            </div>
          )}

          <div className="space-y-3 pt-6">
            <button
              onClick={handleNewRecord}
              disabled={status === "saving"}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle size={24} />
              Novo registro
            </button>
            
            <button
              onClick={handleBackToMenu}
              disabled={status === "saving"}
              className="w-full bg-white text-green-600 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={24} />
              Voltar ao menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
