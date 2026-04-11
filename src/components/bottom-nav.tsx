import { Home, PlusCircle, History, User } from "lucide-react";
import { Screen } from "../App";

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const TEST_LAST_STEP = ["1", "true", "yes", "on"].includes(
  String((import.meta.env as any).VITE_TEST_LAST_STEP ?? "").toLowerCase(),
);

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { icon: Home, label: "Início", screen: "main-menu" as Screen },
    { icon: PlusCircle, label: "Registrar", screen: (TEST_LAST_STEP ? "observations" : "activity-type") as Screen },
    { icon: History, label: "Histórico", screen: "history" as Screen },
    { icon: User, label: "Perfil", screen: "profile" as Screen }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-200 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isRegisterConfirmActive = item.screen === "activity-type" && currentScreen === "register-confirm";
          const isActive = currentScreen === item.screen || isRegisterConfirmActive;
          
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? "text-green-700 bg-green-50" 
                  : "text-gray-600 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              <Icon size={24} strokeWidth={2.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
