import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";

interface DeleteRecordModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteRecordModal({ open, loading = false, onCancel, onConfirm }: DeleteRecordModalProps) {
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
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}>

            <h2 className="text-xl font-bold text-black-700 text-center">Apagar registro?</h2>
            <p className="mt-2 text-sm text-gray-600 text-center"> Esta ação não pode ser desfeita.</p>

            <div className="mt-6 flex flex-row gap-2 justify-center">
              <Button
                type="button" variant="outline" onClick={onCancel} disabled={loading} className="rounded-lg border-gray-300 flex-1">
                Não apagar
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="btn-danger rounded-lg flex-1">
                {loading ? "Apagando..." : "Apagar"}
              </Button>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
