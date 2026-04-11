import { useMemo, useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Screen } from "../../App";

interface PropsEsqueciSenha {
  onNavigate: (screen: Screen) => void;
  onRequestReset: (email: string) => Promise<{ ok: boolean; message?: string }>;
  onVerifyResetCode: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  onResetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
}

export function EsqueciSenha({ onNavigate, onRequestReset, onVerifyResetCode, onResetPassword }: PropsEsqueciSenha) {
  const [step, setStep] = useState<"request" | "verify" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canRequest = useMemo(() => {
    return email.trim().length > 0;
  }, [email]);

  const canVerify = useMemo(() => {
    return code.trim().length >= 4;
  }, [code]);

  const canReset = useMemo(() => {
    return (
      newPassword.trim().length >= 6 &&
      newPassword === confirmPassword
    );
  }, [newPassword, confirmPassword]);

  const handleRequest = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await onRequestReset(email.trim());
      if (!result.ok) {
        setError(result.message ?? "Não foi possível enviar o código.");
        return;
      }
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setInfo("Se os dados estiverem corretos, você receberá um e-mail com um código de verificação.");
      setStep("verify");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao conectar ao servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await onVerifyResetCode(email.trim(), code.trim());
      if (!result.ok) {
        setError(result.message ?? "Não foi possível validar o código.");
        return;
      }
      setInfo("Código validado. Agora defina sua nova senha.");
      setStep("reset");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao conectar ao servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await onResetPassword(email.trim(), code.trim(), newPassword);
      if (!result.ok) {
        setError(result.message ?? "Não foi possível redefinir sua senha.");
        return;
      }
      setInfo("Senha alterada com sucesso. Faça login com a nova senha.");
      setStep("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao conectar ao servidor";
      setError(message);
    } finally {
      setLoading(false);
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
            <div>
              <h1 className="text-2xl font-bold text-green-800">Recuperar senha</h1>
              <p className="text-sm text-gray-600">
                {step === "request" && "Digite seu e-mail para receber um código."}
                {step === "verify" && "Digite o código enviado para validar sua identidade."}
                {step === "reset" && "Agora defina sua nova senha."}
                {step === "done" && "Senha alterada com sucesso."}
              </p>
            </div>
          </div>

          {(error || info) && (
            <div className={`rounded-xl text-sm ${error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800"} p-4`}>
              {error || info}
            </div>
          )}

          {step === "request" && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">E-mail</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@dominio.com" />
              </div>
              <Button
                type="button"
                onClick={handleRequest}
                disabled={!canRequest || loading}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors"
              >
                {loading ? "Enviando..." : "Enviar código"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white text-green-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-200 hover:bg-green-50 transition-colors"
                onClick={() => onNavigate("login")}
              >
                Voltar ao login
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-gray-600">Código enviado para <span className="font-semibold">{email}</span>.</p>
                  <p className="text-sm text-gray-500">Caso não tenha recebido, verifique a caixa de spam.</p>
                </div>
                <Mail size={26} className="text-green-600" />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Código</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" />
              </div>

              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={!canVerify || loading}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors"
              >
                {loading ? "Validando..." : "Validar código"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white text-green-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-200 hover:bg-green-50 transition-colors"
                onClick={handleRequest}
                disabled={loading}
              >
                Reenviar código
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white text-green-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-200 hover:bg-green-50 transition-colors"
                onClick={() => setStep("request")}
              >
                Voltar
              </Button>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-gray-600">
                    Código validado para <span className="font-semibold">{email}</span>.
                  </p>
                  <p className="text-sm text-gray-500">Digite e confirme sua nova senha.</p>
                </div>
                <Mail size={26} className="text-green-600" />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Nova senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Confirmar nova senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="•••••••"
                />
              </div>

              <Button
                type="button"
                onClick={handleReset}
                disabled={!canReset || loading}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors"
              >
                {loading ? "Aguarde..." : "Alterar senha"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white text-green-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-green-200 hover:bg-green-50 transition-colors"
                onClick={() => setStep("verify")}
              >
                Voltar
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-800">Senha alterada com sucesso!</p>
                <p className="text-sm text-gray-600">Use a nova senha para entrar.</p>
              </div>
              <Button
                type="button"
                onClick={() => onNavigate("login")}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors"
              >
                Voltar ao login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
