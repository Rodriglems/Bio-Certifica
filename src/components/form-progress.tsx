import type { DailyRecord, Screen } from "../App";
import { isHarvestActivity } from "../lib/record-format";

const DESTINATIONS_WITH_DETAILS = ["Venda", "Troca", "Doação"];

function stepsFor(record: Partial<DailyRecord>): Screen[] {
  const steps: Screen[] = ["activity-type", "production", "production-location"];
  if (!record.activityType || isHarvestActivity(record.activityType)) {
    steps.push("production-destination");
    if (DESTINATIONS_WITH_DETAILS.includes(record.destination ?? "")) steps.push("destination-details");
  }
  steps.push("costs", "labor", "field-conditions", "observations");
  return steps;
}

export function FormProgress({ screen, record }: { screen: Screen; record: Partial<DailyRecord> }) {
  const steps = stepsFor(record);
  const index = steps.indexOf(screen);
  if (index < 0) return null;

  const current = index + 1;
  const label = `Passo ${current} de ${steps.length}`;

  return (
    <div className="form-progress" data-speak={label}>
      <span>{label}</span>
      <div
        className="form-progress__track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current}
        aria-label={label}
      >
        <div className="form-progress__fill" style={{ width: `${(current / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}
