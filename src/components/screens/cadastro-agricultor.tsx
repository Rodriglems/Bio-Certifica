import { useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, User } from "lucide-react";
import { Screen, Farmer } from "../../App";
import { VoiceTextarea } from "../voice-textarea";

interface PropsCadastroAgricultor {
  mode?: "register" | "edit";
  onRegister?: (payload: Farmer & { username: string; email?: string; password: string }) => Promise<void>;
  onSaveFarmer?: (payload: Farmer) => Promise<void>;
  onNavigate: (screen: Screen) => void;
  backScreen?: Screen;
  initialFarmer?: Farmer | null;
}

export function CadastroAgricultor({
  mode = "register",
  onRegister,
  onSaveFarmer,
  onNavigate,
  backScreen = "splash",
  initialFarmer
}: PropsCadastroAgricultor) {
  const isEditMode = mode === "edit";
  const [formData, setFormData] = useState<Farmer>({
    name: initialFarmer?.name ?? "",
    community: initialFarmer?.community ?? "",
    municipality: initialFarmer?.municipality ?? "",
    phone: initialFarmer?.phone ?? "",
    propertySize: initialFarmer?.propertySize ?? "",
    produces: initialFarmer?.produces ?? "",
    accessDirections: initialFarmer?.accessDirections ?? "",
    propertyPhotoDataUrl: initialFarmer?.propertyPhotoDataUrl
  });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const municipalityOptions = [
    "Teresina",
    "Altos",
    "Demerval Lobão",
    "Beneditinos",
    "Monsenhor Gil",
    "José de Freitas",
    "União",
    "Campo Maior",
    "Parnaíba",
    "Picos",
    "Barras",
    "Floriano",
    "Outros"
  ];

  const initialMunicipality = initialFarmer?.municipality ?? "";
  const initialMunicipalityIsOption = municipalityOptions.includes(initialMunicipality);
  const [selectedMunicipality, setSelectedMunicipality] = useState(
    initialMunicipality
      ? initialMunicipalityIsOption
        ? initialMunicipality
        : "Outros"
      : ""
  );
  const [customMunicipality, setCustomMunicipality] = useState(
    initialMunicipality && !initialMunicipalityIsOption ? initialMunicipality : ""
  );

  const passwordsMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const hasRequiredFarmerFields = formData.name && formData.community && formData.municipality;
    if (!hasRequiredFarmerFields) return;

    if (isEditMode) {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        if (!onSaveFarmer) throw new Error("Ação de atualização indisponível.");
        await onSaveFarmer(formData);
        onNavigate("profile");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível atualizar o perfil.";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (username.trim().length >= 3 && password.trim().length >= 6 && password === passwordConfirmation) {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        if (!onRegister) throw new Error("Ação de cadastro indisponível.");
        await onRegister({
          ...formData,
          username: username.trim(),
          email: email.trim() || undefined,
          password,
        });
        onNavigate("harvest-registration");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setFormData((prev) => ({ ...prev, propertyPhotoDataUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-green-100">
            <div className="bg-green-100 p-3 rounded-full">
              <User size={28} className="text-green-700" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-green-800">
              {isEditMode ? "Atualizar Perfil" : "Cadastro do Agricultor"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="Digite seu nome"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Comunidade / Propriedade
              </label>
              <input
                type="text"
                required
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="Nome da comunidade"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Município
              </label>
              <select
                required
                value={selectedMunicipality}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedMunicipality(value);

                  if (value === "Outros") {
                    setFormData({ ...formData, municipality: customMunicipality.trim() });
                    return;
                  }

                  setFormData({ ...formData, municipality: value });
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none bg-white"
              >
                <option value="">Selecione...</option>
                {municipalityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              {selectedMunicipality === "Outros" && (
                <input
                  type="text"
                  required
                  value={customMunicipality}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomMunicipality(value);
                    setFormData({ ...formData, municipality: value.trim() });
                  }}
                  className="mt-3 w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                  placeholder="Digite sua cidade"
                />
              )}
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Telefone 
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Tamanho da propriedade
              </label>
              <input
                type="text"
                required
                value={formData.propertySize ?? ""}
                onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="Ex.: 2 hectares"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                O que você produz?
              </label>
              <input
                type="text"
                required
                value={formData.produces ?? ""}
                onChange={(e) => setFormData({ ...formData, produces: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                placeholder="Ex.: hortaliças, frutas, ovos..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Foto da propriedade <span className="text-sm text-gray-500">(opcional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none bg-white"
              />
              {formData.propertyPhotoDataUrl && (
                <div className="mt-3">
                  <img
                    src={formData.propertyPhotoDataUrl}
                    alt="Foto da propriedade"
                    className="w-full h-48 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Como chegar na propriedade? <span className="text-sm text-gray-500">(opcional)</span>
              </label>
              <VoiceTextarea
                value={formData.accessDirections ?? ""}
                onChange={(value) => setFormData({ ...formData, accessDirections: value })}
                placeholder="Ex.: entrar na estrada X, depois da escola virar à direita..."
                rows={4}
              />
            </div>


            {!isEditMode && (
              <div>
                <label htmlFor="username" className="block text-lg font-semibold text-gray-700 mb-2">
                  Nome de usuário
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  minLength={3}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                  placeholder="ex.: joaosilva"
                />

                <label htmlFor="email" className="block text-lg font-semibold text-gray-700 mb-2 mt-4">
                  E-mail 
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                  placeholder="seuemail@dominio.com"
                />

                <label htmlFor="password" className="block text-lg font-semibold text-gray-700 mb-2 mt-4">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-green-500 focus:outline-none"
                  placeholder="••••••"
                />

                <label htmlFor="passwordConfirmation" className="block text-lg font-semibold text-gray-700 mb-2 mt-4">
                  Confirme a senha
                </label>
                <input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  minLength={6}
                  aria-invalid={passwordsMismatch}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:border-green-500 focus:outline-none ${
                    passwordsMismatch ? "border-destructive" : "border-gray-300"
                  }`}
                  placeholder="••••••"
                />
                {passwordsMismatch && (
                  <p className="text-sm text-destructive mt-2">As senhas não coincidem.</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Use essa senha para entrar no app.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? "Salvando..." : isEditMode ? "Salvar perfil" : "Salvar e continuar"}
              <ArrowRight size={24} />
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onNavigate(backScreen)}
              className="w-full bg-white text-gray-700 py-4 px-6 rounded-xl text-lg font-bold border-2 border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={22} />
              Voltar
            </button>
            {submitError && (
              <p className="text-sm text-destructive mt-2">{submitError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
