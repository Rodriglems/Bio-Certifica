import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";

interface ExitConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExitConfirmModal({ open, onCancel, onConfirm }: ExitConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="exit-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="z-50 flex items-center justify-center bg-black/50 p-4"
          style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={onCancel} >
          <motion.div
            key="exit-modal-content"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
            className="max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()} >

            <h2 className="text-xl font-bold text-green-800 text-center">Sair do registro diário?</h2>

            <p className="mt-2 text-sm text-gray-600 text-center">As informações ainda não salvas serão perdidas.</p>

            <div className="mt-6 flex flex-row gap-2 justify-center">
              
              <Button type="button" onClick={onConfirm} className="btn-danger rounded-lg flex-1"> Sair </Button>

              <Button type="button" variant="outline" onClick={onCancel} className="bg-green-600 text-white font-bold hover: rounded-lg border-red-200 flex-1">
                Continuar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
