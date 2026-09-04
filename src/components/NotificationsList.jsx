import { Bell, FileText, Rocket, Send, CheckCircle2, X, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications, useNotificationPolling } from "../context/NotificationsContext";

const TYPE_ICONS = {
  application_submitted: Users,
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
  milestone_approved: CheckCircle2,
};

export default function NotificationsList() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();
  useNotificationPolling(user?.id);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading notifications...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead(user?.id)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                  n.is_read ? "" : "bg-indigo-50/40"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.is_read ? "bg-slate-100" : "bg-indigo-100"
                }`}>
                  <Icon className={`w-4 h-4 ${n.is_read ? "text-slate-500" : "text-indigo-600"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.is_read ? "text-slate-600" : "text-slate-800 font-medium"}`}>
                    {n.message}
                  </p>
                  <span className="text-xs text-slate-400 block mt-1">
                    {new Date(n.created_at).toLocaleString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
