import { CloudOff, RefreshCw } from "lucide-react";

interface SyncStatusProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

function describePending(count: number) {
  return count === 1 ? "1 registro guardado no celular" : `${count} registros guardados no celular`;
}

export function SyncStatus({ pendingCount, isOnline, isSyncing }: SyncStatusProps) {
  if (isOnline && pendingCount === 0) return null;

  const isSending = isOnline && isSyncing && pendingCount > 0;
  let message: string;
  if (isSending) {
    message = pendingCount === 1 ? "Enviando 1 registro…" : `Enviando ${pendingCount} registros…`;
  } else if (pendingCount > 0) {
    message = `${describePending(pendingCount)}. O envio é automático quando a conexão voltar.`;
  } else {
    message = "Sem internet. Pode continuar registrando: tudo fica guardado no celular.";
  }

  const Icon = isSending ? RefreshCw : CloudOff;

  return (
    <div role="status" data-speak={message} className="sync-status">
      <Icon size={18} className={`flex-shrink-0 ${isSending ? "animate-spin" : ""}`.trim()} />
      <span>{message}</span>
    </div>
  );
}
