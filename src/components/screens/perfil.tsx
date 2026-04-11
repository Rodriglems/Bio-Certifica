import { User, Sprout, MapPin, Phone, Edit } from "lucide-react";
import { Screen, Farmer, Harvest } from "../../App";

interface PropsPerfil {
  farmer: Farmer | null;
  harvest: Harvest | null;
  onNavigate: (screen: Screen) => void;
}

export function Perfil({ farmer, harvest, onNavigate }: PropsPerfil) {
  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
          <div className="bg-green-100 p-3 rounded-full">
            <User size={28} className="text-green-700" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-green-800">
            Perfil
          </h1>
        </div>

        {/* Dados do Agricultor */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-xl font-bold text-green-800">Dados do Agricultor</h2>
            <button
              onClick={() => onNavigate("farmer-registration")}
              className="text-green-600 hover:text-green-700"
            >
              <Edit size={20} />
            </button>
          </div>

          {farmer ? (
            <div className="space-y-3">
              {farmer.propertyPhotoDataUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foto da Propriedade</p>
                  <img
                    src={farmer.propertyPhotoDataUrl}
                    alt="Foto da propriedade"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="text-lg font-semibold text-gray-800">{farmer.name}</p>
              </div>

              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Comunidade / Propriedade</p>
                  <p className="text-base text-gray-800">{farmer.community}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Município</p>
                  <p className="text-base text-gray-800">{farmer.municipality}</p>
                </div>
              </div>

              {farmer.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={18} className="text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="text-base text-gray-800">{farmer.phone}</p>
                  </div>
                </div>
              )}

              {farmer.propertySize && (
                <div>
                  <p className="text-sm text-gray-500">Tamanho da propriedade</p>
                  <p className="text-base text-gray-800">{farmer.propertySize}</p>
                </div>
              )}

              {farmer.produces && (
                <div>
                  <p className="text-sm text-gray-500">Produção</p>
                  <p className="text-base text-gray-800">{farmer.produces}</p>
                </div>
              )}

              {farmer.accessDirections && (
                <div>
                  <p className="text-sm text-gray-500">Como chegar na propriedade</p>
                  <p className="text-base text-gray-800 whitespace-pre-line">{farmer.accessDirections}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhum agricultor cadastrado</p>
              <button
                onClick={() => onNavigate("farmer-registration")}
                className="mt-3 text-green-600 font-semibold hover:text-green-700"
              >
                Cadastrar agora
              </button>
            </div>
          )}
        </div>

        {/* Dados da Safra */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h2 className="text-xl font-bold text-green-800">Safra Atual</h2>
            <button
              onClick={() => onNavigate("harvest-registration")}
              className="text-green-600 hover:text-green-700"
            >
              <Edit size={20} />
            </button>
          </div>

          {harvest ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Sprout size={18} className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Cultura principal</p>
                  <p className="text-base font-semibold text-gray-800">{harvest.mainCrop}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Tipo de semente</p>
                <p className="text-base text-gray-800">{harvest.seedType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Sistema de cultivo</p>
                <p className="text-base text-gray-800">{harvest.cultivationSystem}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Área plantada</p>
                <p className="text-base text-gray-800">{harvest.plantedArea}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Nenhuma safra cadastrada</p>
              <button
                onClick={() => onNavigate("harvest-registration")}
                className="mt-3 text-green-600 font-semibold hover:text-green-700">
                Cadastrar safra
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={() => onNavigate("annual-questions")}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors">
            Atualizar perguntas anuais
          </button>
        </div>
      </div>
    </div>
  );
}
