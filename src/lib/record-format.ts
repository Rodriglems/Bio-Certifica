/** Só a colheita tem quantidade e destino; as demais atividades informam apenas a cultura. */
export function isHarvestActivity(activityType: string | undefined) {
  return activityType === "Colheita";
}

export const DESTINATION_NOT_APPLICABLE = "Não se aplica";

/** Código fixo do registro: ao contrário da numeração, não muda entre um relatório e outro. */
export function recordCode(id: string) {
  const cleaned = String(id ?? "").trim();
  if (/^\d+$/.test(cleaned)) return `R-${BigInt(cleaned).toString(36).toUpperCase()}`;
  return `R-${cleaned.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Hoje no formato do campo de data, no fuso do aparelho. */
export function todayInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Converte o dia escolhido para data completa, sem risco de o fuso mudar o dia. */
export function activityDateFromInput(value: string) {
  if (!value || value === todayInputValue()) return new Date().toISOString();
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
}

export function parseQuantity(value: string | undefined) {
  const cleaned = String(value ?? "").trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}
