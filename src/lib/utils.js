/**
 * Utility helpers shared across UdyamSetu pages & components.
 */

/**
 * Format a numeric or string value as Indian Rupee text.
 */
export function formatCurrency(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string") {
    const num = parseFloat(value.replace(/[₹,]/g, "").trim());
    if (!isNaN(num)) return formatCurrency(num);
    return value;
  }
  const num = Number(value);
  if (isNaN(num)) return "—";
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
}

/**
 * Parse an ISO date string and return a formatted locale date.
 */
export function formatDate(dateStr, opts = { day: "short", month: "short", year: "numeric" }) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", opts);
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text, maxLen = 100) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get a colour class for a pilot offer status.
 */
export function pilotStatusColor(status) {
  const map = {
    proposed: "bg-blue-100 text-blue-800 border-blue-200",
    negotiating: "bg-amber-100 text-amber-800 border-amber-200",
    accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    declined: "bg-rose-100 text-rose-800 border-rose-200",
    in_progress: "bg-cyan-100 text-cyan-800 border-cyan-200",
    completed: "bg-slate-100 text-slate-800 border-slate-300",
    cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

/**
 * Get a label for a pilot offer status.
 */
export function pilotStatusLabel(status) {
  const map = {
    proposed: "Pilot Offered",
    negotiating: "Negotiating",
    accepted: "Accepted",
    declined: "Declined",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] || capitalize(status || "");
}

/**
 * Get valid next statuses for a given current pilot status.
 */
export function validPilotTransitions(currentStatus) {
  const transitions = {
    proposed: ["negotiating", "accepted", "declined"],
    negotiating: ["accepted", "declined", "proposed"],
    accepted: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    declined: [],
    cancelled: [],
  };
  return transitions[currentStatus] || [];
}

/**
 * Get a colour class for an application status.
 */
export function applicationStatusColor(status) {
  const map = {
    Submitted: "bg-blue-100 text-blue-800 border-blue-200",
    "Under Review": "bg-amber-100 text-amber-800 border-amber-200",
    Shortlisted: "bg-purple-100 text-purple-800 border-purple-200",
    Selected: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-rose-100 text-rose-800 border-rose-200",
    "Pilot Offered": "bg-cyan-100 text-cyan-800 border-cyan-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

/**
 * Match score colour based on percentile.
 */
export function scoreColor(score) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

/**
 * Match score bg gradient based on percentile.
 */
export function scoreBgColor(score) {
  if (score >= 90) return "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (score >= 75) return "bg-gradient-to-r from-blue-500 to-sky-400";
  if (score >= 60) return "bg-gradient-to-r from-amber-500 to-orange-400";
  return "bg-gradient-to-r from-rose-500 to-pink-400";
}

/**
 * Create a notification via the backend RPC.
 */
export async function createNotification(supabaseClient, { recipientId, message, type, relatedId, relatedType }) {
  const { error } = await supabaseClient.rpc("create_notification", {
    p_recipient_id: recipientId,
    p_message: message,
    p_type: type,
    p_related_id: relatedId || null,
    p_related_type: relatedType || null,
  });
  return { error };
}
