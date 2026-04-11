import { useMemo, useState } from "react";
import { History as HistoryIcon, Calendar, Package, MapPin, FileDown, Trash2 } from "lucide-react";
import { Screen, DailyRecord } from "../../App";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { DeleteRecordModal } from "../delete-record-modal";

interface PropsHistorico {
  records: DailyRecord[];
  onNavigate: (screen: Screen) => void;
  onGeneratePdf: () => void;
  onDeleteRecord: (recordId: string) => Promise<void>;
  user?: {
    agricultorId: string;
    username: string;
  };
}

export function Historico({ records, onGeneratePdf, onDeleteRecord, user }: PropsHistorico) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DailyRecord | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const today = new Date();
    const dates: Date[] = [];

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - index);
      dates.push(date);
    }

    const counts = new Map<string, number>();

    for (const date of dates) {
      counts.set(date.toISOString().slice(0, 10), 0);
    }

    for (const record of records) {
      const recordDate = new Date(record.date);
      if (Number.isNaN(recordDate.getTime())) continue;
      recordDate.setHours(0, 0, 0, 0);
      const key = recordDate.toISOString().slice(0, 10);
      if (!counts.has(key)) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return dates.map((date) => {
      const key = date.toISOString().slice(0, 10);
      return {
        dia: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date),
        quantidade: counts.get(key) ?? 0,
      };
    });
  }, [records]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const confirmDelete = async () => {
    if (!recordToDelete?.id) {
      setDeleteError("Não foi possível identificar este registro para exclusão.");
      setRecordToDelete(null);
      return;
    }

    setDeleteError(null);
    setDeletingId(recordToDelete.id);
    try {
      await onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir este registro.";
      setDeleteError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
          <div className="bg-green-100 p-3 rounded-full">
            <HistoryIcon size={28} className="text-green-700" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-green-800">Histórico de Registros</h1>
            <p className="text-sm text-gray-600 mt-1">Exporte em PDF para auditoria</p>
          </div>
          <button
            onClick={onGeneratePdf}
            className="text-green-700 hover:text-green-800 bg-green-50 border-2 border-green-200 px-3 py-2 rounded-xl flex items-center gap-2"
            title="Gerar PDF"
          >
            <FileDown size={18} />
            <span className="text-sm font-bold">PDF</span>
          </button>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-lg text-gray-600">
              Nenhum registro ainda.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Comece registrando suas atividades diárias!
            </p>
            {user?.username && (
              <p className="text-xs text-gray-500 mt-3">
                Conta atual: @{user.username}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-green-800">Registros dos últimos 7 dias</h2>
              </div>

              <div className="mt-4 w-full h-[220px] min-w-[280px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="dia"
                      tick={{ fill: "#166534", fontSize: 12 }}
                      axisLine={{ stroke: "#86efac" }}
                      tickLine={{ stroke: "#86efac" }}
                    />
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
            </div>

            {records.map((record) => (
              <div key={`${record.id}-${record.date}`} className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-green-600" />
                    <span className="text-sm text-gray-600">
                      {formatDate(record.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {record.activityType}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(record)}
                      disabled={deletingId === record.id}
                      className="p-2 rounded-lg border border-red-200 text-black-600 hover:bg-red-50"
                      title="Excluir registro"
                    >
                      <Trash2 size={16} className={deletingId === record.id ? "opacity-50" : ""} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {record.production && (
                    <div className="flex items-start gap-2">
                      <Package size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Produção: {record.production.product}
                        </p>
                        <p className="text-sm text-gray-600">
                          {record.production.quantity} {record.production.unit}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Local: {record.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Destino: {record.destination}
                      </p>
                    </div>
                  </div>

                  {record.fieldConditions && (
                    <div className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                      <span className="font-medium">Clima:</span> {record.fieldConditions.weather}
                      {record.fieldConditions.occurrences !== "Nenhuma" && (
                        <span className="ml-3">
                          <span className="font-medium">Ocorrência:</span> {record.fieldConditions.occurrences}
                        </span>
                      )}
                      {record.fieldConditions.pestOrDiseaseFound && (
                        <p className="mt-2">
                          <span className="font-medium">Praga/Doença:</span> {record.fieldConditions.pestOrDiseaseFound}
                        </p>
                      )}
                      {record.fieldConditions.appliedProduct && (
                        <p>
                          <span className="font-medium">Produto aplicado:</span> {record.fieldConditions.appliedProduct}
                        </p>
                      )}
                      {record.fieldConditions.homemadeProductPreparation && (
                        <p>
                          <span className="font-medium">Preparo do produto:</span> {record.fieldConditions.homemadeProductPreparation}
                        </p>
                      )}
                    </div>
                  )}

                  {record.observations && (
                    <div className="bg-amber-50 p-3 rounded-lg mt-2">
                      <p className="text-sm font-medium text-gray-700">Observações:</p>
                      <p className="text-sm text-gray-600 mt-1">{record.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {deleteError && (
              <p className="text-sm text-destructive text-center">{deleteError}</p>
            )}
          </div>
        )}
      </div>

      <DeleteRecordModal
        open={recordToDelete !== null}
        loading={Boolean(deletingId)}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
