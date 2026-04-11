import { Screen } from "../../App";
import Logo from "../../assets/imagens/Logo_robo_biocertifica03.png";

interface PropsTelaInicial {
  onNavigate: (screen: Screen) => void;
  hasFarmer: boolean;
  isLoggedIn: boolean;
}

export function TelaInicial({ onNavigate, hasFarmer, isLoggedIn }: PropsTelaInicial) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-600 to-green-800">
      <div className="text-center space-y-8 max-w-md">
        <div className="flex justify-center">
          <img
            src={Logo}
            alt="Logo BioCertifica"
            className="h-48 w-48 object-contain rounded-full"
          />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">BioCertifica</h1>
          <p className="text-xl text-green-100">Manejo Vegetal</p>
        </div>

        <div className="space-y-4 pt-8">
          <button
            onClick={() => onNavigate(isLoggedIn ? (hasFarmer ? "main-menu" : "farmer-registration") : "login")}
            className="w-full bg-white text-green-700 py-4 px-8 rounded-xl text-lg font-bold shadow-lg hover:bg-green-50 transition-colors"
          >Entrar</button>
          
          <button
            onClick={() => onNavigate("farmer-registration")}
            className="w-full bg-green-700 text-white py-4 px-8 rounded-xl text-lg font-bold border-2 border-white hover:bg-green-600 transition-colors">Cadastrar Agricultor</button>
        </div>
      </div>
    </div>
  );
}
