import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";

interface RegisterConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RegisterConfirmModal({ open, onCancel, onConfirm }: RegisterConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="register-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="z-50 flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={onCancel}
        >
          <motion.div
            key="register-modal-content"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-green-800 text-center">Iniciar registro diário?</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Você deseja abrir agora o formulário de registro diário?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end justify-center">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="button" onClick={onConfirm} className="bg-green-600 text-white hover:bg-green-700">
                Sim, registrar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
