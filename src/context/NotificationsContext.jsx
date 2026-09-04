import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("Notifications fetch error:", error.message);
      } else {
        setNotifications(data || []);
        setUnreadCount((data || []).filter((n) => !n.is_read).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async (userId) => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback(async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const refresh = useCallback((userId) => {
    fetchNotifications(userId);
  }, [fetchNotifications]);

  // Expose via context
  const value = {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markRead,
    refresh,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

/**
 * Hook that auto-refreshes notifications on a timer.
 * Call in any component that wants live updates.
 */
export function useNotificationPolling(userId, intervalMs = 15000) {
  const { refresh } = useNotifications();
  useEffect(() => {
    if (!userId) return;
    refresh(userId);
    const timer = setInterval(() => refresh(userId), intervalMs);
    return () => clearInterval(timer);
  }, [userId, refresh, intervalMs]);
}
