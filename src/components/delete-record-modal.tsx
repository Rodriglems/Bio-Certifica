import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { VoiceInput } from "./voice-input";

interface DeleteRecordModalProps {
  open: boolean;
  loading?: boolean;
  /** Registro que ainda não foi enviado nunca chegou ao servidor: não há o que justificar. */
  requireReason?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

const MIN_REASON_LENGTH = 3;

export function DeleteRecordModal({ open, loading = false, requireReason = true, onCancel, onConfirm }: DeleteRecordModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const canConfirm = !requireReason || reason.trim().length >= MIN_REASON_LENGTH;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="delete-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }} className="z-50 flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={loading ? undefined : onCancel}>

          <motion.div
            key="delete-modal-content"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}>

            <h2 className="text-xl font-bold text-center">Excluir registro?</h2>
            {requireReason ? (
              <>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  O registro sai do histórico, mas continua no caderno de campo como excluído, com o motivo informado.
                </p>
                <label className="mt-4 mb-2 block text-base font-semibold text-gray-700">
                  Por que você vai excluir?
                </label>
                <VoiceInput value={reason} onChange={setReason} placeholder="Ex.: lancei em duplicidade" required />
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-600 text-center">
                Este registro ainda não foi enviado e será apagado do celular.
              </p>
            )}

            <div className="mt-6 flex flex-row gap-2 justify-center">
              <Button
                type="button" variant="outline" onClick={onCancel} disabled={loading} className="rounded-lg border-gray-300 flex-1">
                Manter registro
              </Button>
              <Button
                type="button"
                onClick={() => onConfirm(reason.trim())}
                disabled={loading || !canConfirm}
                className="btn-danger rounded-lg flex-1">
                {loading ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
