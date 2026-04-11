import { useMemo, useState } from "react";
import { Sprout, History as HistoricoIcone, User, Activity, Menu, LogOut, KeyRound } from "lucide-react";
import { Screen, Farmer, Harvest, DailyRecord } from "../../App";
import Logo from "../../assets/imagens/Logo_robo_biocertifica03.png";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import { getWeeklyActivitiesForMonth } from "../../lib/weekly-activities";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

interface PropsMenuPrincipal {
  onNavigate: (screen: Screen) => void;
  farmer: Farmer | null;
  harvest: Harvest | null;
  records: DailyRecord[];
  user?: {
    agricultorId: string;
    username: string;
  };
  onLogout: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export function MenuPrincipal({ onNavigate, farmer, harvest, records, user, onLogout, onChangePassword }: PropsMenuPrincipal) {
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirmation, setNewPinConfirmation] = useState("");
  const [changePinError, setChangePinError] = useState<string | null>(null);

  const getRecordDateParts = (value: string) => {
    const cleaned = String(value ?? "").trim();
    const brDateMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brDateMatch) {
      const day = Number(brDateMatch[1]);
      const month = Number(brDateMatch[2]) - 1;
      const year = Number(brDateMatch[3]);
      const recordDate = new Date(Date.UTC(year, month, day));
      if (Number.isNaN(recordDate.getTime())) return null;
      return { year, month, day };
    }

    // 1) Primeiro tenta parsear a string como veio (ex.: Postgres costuma enviar "YYYY-MM-DD HH:mm:ss.sss-03")
    const direct = new Date(cleaned);
    if (!Number.isNaN(direct.getTime())) {
      return {
        year: direct.getUTCFullYear(),
        month: direct.getUTCMonth(),
        day: direct.getUTCDate(),
      };
    }

    // 2) Se falhar, normaliza para um ISO aceito pelo JS (ex.: "YYYY-MM-DDTHH:mm:ss.sss-03:00")
    let normalized = cleaned.includes(" ") && !cleaned.includes("T") ? cleaned.replace(" ", "T") : cleaned;

    // Corrige offsets sem minutos ("-03" -> "-03:00")
    if (/[+-]\d{2}$/.test(normalized)) {
      normalized = `${normalized}:00`;
    }

    // Corrige offsets sem ':' ("-0300" -> "-03:00")
    const hhmmOffset = normalized.match(/([+-])(\d{2})(\d{2})$/);
    if (hhmmOffset) {
      normalized = normalized.replace(/([+-])(\d{2})(\d{2})$/, `$1$2:$3`);
    }

    const recordDate = new Date(normalized);
    if (Number.isNaN(recordDate.getTime())) return null;
    return {
      year: recordDate.getUTCFullYear(),
      month: recordDate.getUTCMonth(),
      day: recordDate.getUTCDate(),
    };
  };

  const { monthActivities, weeks } = useMemo(() => getWeeklyActivitiesForMonth(records), [records]);

  const chartData = useMemo(
    () => weeks.map((week, index) => ({ name: `Sem ${index + 1}`, quantidade: week.activities })),
    [weeks],
  );

  const hasChartValues = useMemo(
    () => chartData.some((item) => item.quantidade > 0),
    [chartData],
  );

  const lastRecordDate = useMemo(() => {
    if (records.length === 0) return "-";
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastParts = getRecordDateParts(sorted[0].date);
    if (!lastParts) return "-";
    const lastDate = new Date(Date.UTC(lastParts.year, lastParts.month, lastParts.day));
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(lastDate);
  }, [records]);

  const handleSubmitChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    const cleanedCurrent = currentPin.trim();
    const cleanedNew = newPin.trim();
    const cleanedConfirm = newPinConfirmation.trim();

    if (cleanedNew.length < 6) {
      setChangePinError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (cleanedNew !== cleanedConfirm) {
      setChangePinError("A confirmação não confere.");
      return;
    }

    const ok = await onChangePassword(cleanedCurrent, cleanedNew);
    if (!ok) {
      setChangePinError("Senha atual incorreta.");
      return;
    }

    setChangePinOpen(false);
    setCurrentPin("");
    setNewPin("");
    setNewPinConfirmation("");
  };

  return (

    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
          <div className="rounded-full bg-white p-1.5 shadow-md ring-2 ring-green-100">
            <img
              src={Logo}
              alt="Logo BioCertifica"
              className="h-12 w-12 rounded-full object-contain bg-white"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-green-800">BioCertifica</h1>
            {farmer?.name && (
              <p className="text-sm text-gray-600 mt-1">Olá, {farmer.name}</p>
            )}
            {user?.username && (
              <p className="text-xs text-gray-500 mt-0.5">Conta: @{user.username}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="text-green-700 hover:text-green-800 bg-white border-2 border-gray-200 px-3 py-2 rounded-xl flex items-center gap-2"
              >
                <Menu size={18} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-[220px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
            >
              <DropdownMenuItem className="py-1 text-sm font-medium" onSelect={() => onNavigate("profile")}>
                <User size={16} />
                Perfil
              </DropdownMenuItem>

              <DropdownMenuItem
                className="py-1 text-sm font-medium"
                onSelect={() => {
                  setChangePinError(null);
                  setChangePinOpen(true);
                }}
              >
                <KeyRound size={16} />
                Mudar senha
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="py-1 text-sm font-medium"
                variant="destructive"
                onSelect={onLogout}
              >
                <LogOut size={16} />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Mini Dashboard */}
        <div className="mb-6 grid grid-cols-1 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 text-gray-600">
              <Sprout size={18} className="text-green-600" />
              <span className="text-sm">Cultura principal</span>
            </div>
            <p className="text-xl font-bold mt-2 text-green-800">
              {harvest?.mainCrop || "-"}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 text-gray-600">
              <Activity size={18} className="text-green-600" />
              <span className="text-sm">Atividades no mês</span>
            </div>
            <p className="text-xl font-bold mt-2 text-green-800">{monthActivities}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 text-gray-600">
              <HistoricoIcone size={18} className="text-green-600" />
              <span className="text-sm">Último registro</span>
            </div>
            <p className="text-xl font-bold mt-2 text-green-800">{lastRecordDate}</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-xl font-bold text-green-800">Atividades por semana</h2>
          </div>

          <div className="mt-4 w-full h-[250px] min-w-[280px]">
            {monthActivities === 0 || !hasChartValues ? (
              <div className="h-[250px] min-w-[280px] flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-600">
                  Nenhuma atividade registrada neste mês.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Comece registrando suas atividades diárias para visualizar o gráfico.
                </p>
              </div>
            ) : (
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#166534", fontSize: 12 }}
                      axisLine={{ stroke: "#86efac" }}
                      tickLine={{ stroke: "#86efac" }}
                    />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "#dcfce7" }}
                      contentStyle={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "0.75rem",
                        color: "#166534"
                      }}
                      labelStyle={{ color: "#363535ff", fontWeight: 600 }}
                    />
                    <Bar dataKey="quantidade" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {changePinOpen && (
        <>
          <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-black/50 backdrop-blur flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border-2 border-green-100" style={{ position: 'relative', zIndex: 10000 }}>
              <h2 className="text-xl font-bold text-green-800 mb-3">Mudar senha</h2>
              <p className="text-sm text-gray-600 mb-6">
                Digite sua senha atual e defina uma nova (mínimo 6 caracteres).
              </p>

              <form onSubmit={handleSubmitChangePin} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-semibold text-green-800 mb-2">Senha atual</label>
                  <input
                    id="current-password"
                    name="current-password"
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    placeholder="••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-green-800 mb-2">Nova senha</label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    placeholder="••••"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-green-800 mb-2">Confirmar nova senha</label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={newPinConfirmation}
                    onChange={(e) => setNewPinConfirmation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
                    placeholder="••••"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {changePinError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
                    {changePinError}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setChangePinOpen(false)} className="bg-gray-700 text-white hover:bg-gray-800 rounded-lg">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                    Salvar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
