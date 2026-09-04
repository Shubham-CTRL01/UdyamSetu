import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard, Building2, FileText, ListChecks,
  LogOut, ChevronRight, Loader2, CheckCircle2, AlertCircle,
  TrendingUp, Rocket, Shield, ArrowRight
} from "lucide-react";

function StatCard({ icon: Icon, value, label, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-extrabold text-2xl text-slate-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Submitted":    "bg-blue-100 text-blue-700",
    "Under Review": "bg-amber-100 text-amber-700",
    "Approved":     "bg-emerald-100 text-emerald-700",
    "Rejected":     "bg-red-100 text-red-700",
  };
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [applications, setApplications] = useState([]);
  const [schemesCount, setSchemesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [profileRes, businessRes, appsRes, schemesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("businesses").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("applications").select("*, schemes(name,category), businesses(business_name)").eq("user_id", user.id).order("submitted_at", { ascending: false }).limit(5),
      supabase.from("schemes").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);
    setProfile(profileRes.data);
    setBusiness(businessRes.data);
    setApplications(appsRes.data || []);
    setSchemesCount(schemesRes.count || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [user, navigate, loadData]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const profileComplete = business ? 100 : 30;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#0B192C] flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#0B192C]" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm leading-none" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>UdyamSetu</div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">उद्यम सेतु</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
            { icon: Building2, label: "Business Profile", href: "/profile" },
            { icon: Rocket, label: "Government Schemes", href: "/schemes" },
            { icon: FileText, label: "My Applications", href: "/applications" },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link key={href} to={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#0B192C] font-bold text-sm">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{displayName}</div>
              <div className="text-slate-400 text-[10px] truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-[#0B192C] px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-[#0B192C]" />
            </div>
            <span className="font-extrabold text-white text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>UdyamSetu</span>
          </Link>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-xs text-slate-500 font-medium mb-1">Welcome back 👋</div>
            <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {displayName}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here's what's happening with your UdyamSetu account today.</p>
          </div>

          {/* Profile completion banner */}
          {!business && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start sm:items-center gap-4 flex-col sm:flex-row">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-amber-900">Complete your Business Profile</div>
                <div className="text-xs text-amber-700 mt-0.5">You need a business profile to apply for government schemes.</div>
              </div>
              <Link to="/profile" className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5">
                Complete Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={TrendingUp} value={`${profileComplete}%`} label="Profile Complete" color="bg-indigo-100 text-indigo-600" sub={business ? "Business verified" : "Add business profile"} />
            <StatCard icon={Rocket} value={schemesCount} label="Available Schemes" color="bg-amber-100 text-amber-600" sub="Active govt schemes" />
            <StatCard icon={FileText} value={applications.length} label="Applications" color="bg-emerald-100 text-emerald-600" sub="Total submitted" />
            <StatCard icon={CheckCircle2} value={applications.filter(a => a.status === "Approved").length} label="Approved" color="bg-violet-100 text-violet-600" sub="Applications approved" />
          </div>

          {/* Mobile nav links */}
          <div className="lg:hidden mb-6 grid grid-cols-2 gap-3">
            {[
              { icon: Building2, label: "Business Profile", href: "/profile", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
              { icon: Rocket, label: "Browse Schemes", href: "/schemes", color: "bg-amber-50 text-amber-700 border-amber-100" },
              { icon: FileText, label: "My Applications", href: "/applications", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            ].map(({ icon: Icon, label, href, color }) => (
              <Link key={href} to={href}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-colors hover:opacity-80 ${color}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Recent Applications</h2>
                <Link to="/applications" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {applications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No applications yet</p>
                  <Link to="/schemes" className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline">
                    Browse Schemes →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{app.schemes?.name}</div>
                        <div className="text-xs text-slate-500">{app.businesses?.business_name} · {new Date(app.submitted_at).toLocaleDateString("en-IN")}</div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Quick Actions</h2>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { icon: Building2, label: business ? "Update Business Profile" : "Add Business Profile", href: "/profile", desc: business ? `${business.business_name}` : "Required to apply for schemes", color: "bg-indigo-50 text-indigo-600" },
                  { icon: Rocket, label: "Browse Government Schemes", href: "/schemes", desc: `${schemesCount} active schemes available`, color: "bg-amber-50 text-amber-600" },
                  { icon: ListChecks, label: "Track My Applications", href: "/applications", desc: `${applications.length} applications submitted`, color: "bg-emerald-50 text-emerald-600" },
                ].map(({ icon: Icon, label, href, desc, color }) => (
                  <Link key={href} to={href}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{label}</div>
                      <div className="text-xs text-slate-500 truncate">{desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
