import type { LucideIcon } from "lucide-react";

export type MetricTone = "green" | "amber" | "coral" | "violet";

type Props = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  tone: MetricTone;
};

export function MetricCard({ label, value, change, icon: Icon, tone }: Props) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{change}</span>
      </div>
    </article>
  );
}
