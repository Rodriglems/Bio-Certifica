import { useMemo, useState, type FormEvent, type ChangeEvent } from "react";
import { KeyRound, LogIn, Eye, EyeOff } from "lucide-react";
import { Screen } from "../../App";

interface PropsEntrar {
  onLogin: (identifier: string, password: string) => Promise<boolean>;
  onNavigate: (screen: Screen) => void;
}

export function Entrar({ onLogin, onNavigate }: PropsEntrar) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => identifier.trim().length >= 3 && password.trim().length >= 6,
    [identifier, password],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const ok = await onLogin(identifier.trim(), password);
      if (!ok) {
        setError("Usuário/e-mail ou senha inválidos.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao conectar ao servidor";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
            <div className="bg-green-100 p-3 rounded-full">
              <KeyRound size={28} className="text-green-700" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-green-800">Entrar</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Nome de usuário ou e-mail
              </label>
              <input
                value={identifier}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="usuario ou email@dominio.com"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Senha
              </label>

              <div className="relative border-2 border-gray-300 rounded-lg focus-within:border-green-500">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-lg outline-none rounded-lg"
                  placeholder="•••••••"
                  minLength={6}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-green-600"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <Eye size={22} /> : <EyeOff size={22} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="alert-error rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate("forgot-password")}
              className="w-full text-left text-sm text-green-700 underline hover:text-green-900 mt-2">
              Esqueci minha senha?
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 px-6 rounded-xl text-lg font-bold transition-colors flex items-center justify-center gap-2 mt-2 ${
                canSubmit
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Entrar
              <LogIn size={22} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("farmer-registration")}
              className="w-full bg-white text-green-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-200 hover:bg-green-50 transition-colors"
            >
              Criar cadastro
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
