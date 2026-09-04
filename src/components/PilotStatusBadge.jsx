import { pilotStatusLabel, pilotStatusColor } from "../lib/utils";

const STATUS_ICONS = {
  proposed: "○",
  negotiating: "⇄",
  accepted: "✓",
  declined: "✗",
  in_progress: "→",
  completed: "✓",
  cancelled: "⊘",
};

export default function PilotStatusBadge({ status, compact = false }) {
  const label = pilotStatusLabel(status);
  const colorClass = pilotStatusColor(status);
  const icon = STATUS_ICONS[status] || "●";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}
        title={label}
      >
        {icon} {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}
    >
      ● {label}
    </span>
  );
}
