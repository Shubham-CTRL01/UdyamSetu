import { X, Bell, FileText, Rocket, Send, CheckCircle2 } from "lucide-react";

const TYPE_ICONS = {
  application_shortlisted: FileText,
  application_rejected: FileText,
  application_selected: CheckCircle2,
  pilot_offered: Rocket,
  pilot_offer_received: Rocket,
  pilot_accepted: CheckCircle2,
  pilot_declined: X,
  pilot_negotiating: Send,
  pilot_in_progress: Rocket,
  pilot_completed: CheckCircle2,
  pilot_cancelled: X,
};

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;
  const Icon = TYPE_ICONS[notification.type] || Bell;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white max-w-sm animate-in slide-in-from-top-2 duration-200">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-700 leading-relaxed">
          {notification.message}
        </p>
        <span className="text-[10px] text-slate-400 block mt-1">
          {new Date(notification.created_at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
