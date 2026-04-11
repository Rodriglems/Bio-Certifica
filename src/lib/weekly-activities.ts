export type WeekLabel = "Semana 1" | "Semana 2" | "Semana 3" | "Semana 4";

export type WeekActivities = {
  week: WeekLabel;
  activities: number;
};

export type WeeklyActivitiesResult = {
  monthActivities: number;
  weeks: WeekActivities[];
};

export type RecordWithDate = {
  date: string;
};

const WEEK_LABELS: WeekLabel[] = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function getUtcDateParts(value: string): { year: number; month: number; day: number } | null {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) return null;

  const brDateMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brDateMatch) {
    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]) - 1;
    const year = Number(brDateMatch[3]);
    const recordDate = new Date(Date.UTC(year, month, day));
    if (!isValidDate(recordDate)) return null;
    return { year, month, day };
  }

  const direct = new Date(cleaned);
  if (isValidDate(direct)) {
    return {
      year: direct.getUTCFullYear(),
      month: direct.getUTCMonth(),
      day: direct.getUTCDate(),
    };
  }

  let normalized = cleaned.includes(" ") && !cleaned.includes("T") ? cleaned.replace(" ", "T") : cleaned;

  if (/[+-]\d{2}$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }

  const hhmmOffset = normalized.match(/([+-])(\d{2})(\d{2})$/);
  if (hhmmOffset) {
    normalized = normalized.replace(/([+-])(\d{2})(\d{2})$/, `$1$2:$3`);
  }

  const recordDate = new Date(normalized);
  if (!isValidDate(recordDate)) return null;
  return {
    year: recordDate.getUTCFullYear(),
    month: recordDate.getUTCMonth(),
    day: recordDate.getUTCDate(),
  };
}

function getWeekIndex(dayOfMonth: number): 0 | 1 | 2 | 3 {
  if (dayOfMonth <= 7) return 0;
  if (dayOfMonth <= 14) return 1;
  if (dayOfMonth <= 21) return 2;
  return 3;
}

/**
 * Gera dados para gráfico semanal (4 semanas fixas) dentro do mês atual.
 *
 * Regras:
 * - Semana 1: dias 1-7
 * - Semana 2: dias 8-14
 * - Semana 3: dias 15-21
 * - Semana 4: dias 22-último dia do mês
 *
 * Observação: por padrão usa o mês de `referenceDate` (default: agora).
 */
export function getWeeklyActivitiesForMonth<T extends RecordWithDate>(
  records: readonly T[],
  referenceDate: Date = new Date(),
): WeeklyActivitiesResult {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const counts: [number, number, number, number] = [0, 0, 0, 0];

  for (const record of records) {
    const parts = getUtcDateParts(record.date);
    if (!parts) continue;

    if (parts.year !== year) continue;
    if (parts.month !== month) continue;

    const day = parts.day;
    const idx = getWeekIndex(day);
    counts[idx] += 1;
  }

  const weeks: WeekActivities[] = WEEK_LABELS.map((week, index) => ({
    week,
    activities: counts[index],
  }));

  const monthActivities = counts[0] + counts[1] + counts[2] + counts[3];

  return { monthActivities, weeks };
}
