import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { FileText, ArrowLeft, Loader2, Rocket, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";

const STATUS_CONFIG = {
  "Submitted":    { color: "bg-blue-100 text-blue-700",    icon: Clock,         label: "Submitted" },
  "Under Review": { color: "bg-amber-100 text-amber-700",  icon: Eye,           label: "Under Review" },
  "Approved":     { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2, label: "Approved" },
  "Rejected":     { color: "bg-red-100 text-red-700",      icon: XCircle,       label: "Rejected" },
};

const ALL_STATUSES = ["Submitted", "Under Review", "Approved", "Rejected"];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Submitted"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [updating, setUpdating] = useState(null);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Demo accounts use human-readable ids, not real uuids, so filtering by
    // user_id would just 400 against this uuid column.
    if (user.id.startsWith("demo-")) {
      setApps([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("applications")
      .select("*, schemes(name, category, description), businesses(business_name)")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadApplications();
  }, [user, navigate, loadApplications]);

  // Demo: cycle through statuses for prototype demonstration
  async function cycleStatus(app) {
    const idx = ALL_STATUSES.indexOf(app.status);
    const next = ALL_STATUSES[(idx + 1) % ALL_STATUSES.length];
    setUpdating(app.id);
    await supabase.from("applications").update({ status: next, updated_at: new Date().toISOString() }).eq("id", app.id);
    await loadApplications();
    setUpdating(null);
  }

  const filtered = filter === "All" ? apps : apps.filter((a) => a.status === filter);

  const counts = ALL_STATUSES.reduce((acc, s) => ({ ...acc, [s]: apps.filter(a => a.status === s).length }), {});

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              My Applications
            </h1>
            <p className="text-slate-500 text-sm mt-1">{apps.length} total applications submitted</p>
          </div>
          <Link to="/schemes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3E62] transition-colors">
            <Rocket className="w-4 h-4" /> Browse More Schemes
          </Link>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <div key={s} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <div className={`w-8 h-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-xl text-slate-900">{counts[s]}</div>
                <div className="text-xs text-slate-500 font-medium">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["All", ...ALL_STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                filter === s ? "bg-[#0B192C] text-white border-[#0B192C]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}>
              {s} {s === "All" ? `(${apps.length})` : `(${counts[s]})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-600 mb-1">No applications found</p>
            <p className="text-sm text-slate-400 mb-4">
              {filter === "All" ? "You haven't applied to any scheme yet." : `No applications with status "${filter}".`}
            </p>
            <Link to="/schemes" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
              <Rocket className="w-4 h-4" /> Browse Schemes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-base truncate" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {app.schemes?.name}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{app.businesses?.business_name}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">
                      Submitted: {new Date(app.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-xs text-slate-400">
                      Updated: {new Date(app.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      { Finance: "bg-emerald-50 text-emerald-600", Startup: "bg-amber-50 text-amber-600" }[app.schemes?.category] || "bg-slate-100 text-slate-500"
                    }`}>
                      {app.schemes?.category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <button
                    onClick={() => cycleStatus(app)}
                    disabled={updating === app.id}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors disabled:opacity-50"
                    title="Demo: click to cycle status"
                  >
                    {updating === app.id ? "Updating..." : "[ Demo: cycle status ]"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
