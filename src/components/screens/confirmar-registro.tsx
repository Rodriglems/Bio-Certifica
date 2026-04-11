import { CalendarCheck2, CircleHelp } from "lucide-react";
import { Button } from "../ui/button";

interface PropsConfirmarRegistro {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmarRegistro({ onCancel, onConfirm }: PropsConfirmarRegistro) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-green-600 to-green-800 px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-amber-100 rounded-full p-5">
              <CircleHelp size={56} className="text-amber-600" strokeWidth={2} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-green-800">
              Registrar atividade?
            </h1>
            <p className="text-lg text-gray-600">
              Deseja iniciar um novo registro hoje?
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              onClick={onConfirm}
              className="w-full bg-green-600 text-white py-4 px-4 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CalendarCheck2 size={24} />
              Registrar hoje
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full bg-white text-green-600 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-600 hover:bg-green-50 transition-colors"
            >
              Não, voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
