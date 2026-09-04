import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import NotificationsList from "../components/NotificationsList";
import { useNotifications, useNotificationPolling } from "../context/NotificationsContext";
import {
  Landmark, Plus, Rocket, FileText, CheckCircle2, Clock, AlertCircle,
  Users, TrendingUp, X, Trash2, ArrowRight, ShieldCheck, ShieldAlert,
  Loader2, Lock, Globe, Mail, Building2, BrainCircuit, Zap,
  LayoutDashboard, Send, Target, Bell
} from "lucide-react";

const SECTORS = [
  "Deep Tech",
  "Defence & Aerospace",
  "HealthTech & Life Sciences",
  "CleanTech & Renewable Energy",
  "AgriTech & Food Processing",
  "Smart Cities & Infrastructure",
  "Cybersecurity & AI",
  "FinTech & GovTech",
  "Manufacturing & Robotics",
  "Other"
];

function StatCard({ icon: Icon, value, label, color, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-extrabold text-2xl text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {value}
        </div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Published: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Draft: "bg-amber-100 text-amber-800 border-amber-200",
    Closed: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] || "bg-slate-100 text-slate-700"}`}>
      ● {status}
    </span>
  );
}

function AIChip({ appId }) {
  const [score, setScore] = useState(null);
  useEffect(() => {
    if (!appId) return;
    supabase
      .from("ai_match_scores")
      .select("overall_score")
      .eq("application_id", appId)
      .maybeSingle()
      .then(({ data }) => setScore(data?.overall_score ?? null));
  }, [appId]);
  if (!score) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
      <BrainCircuit className="w-3 h-3" /> AI: {score}%
    </span>
  );
}

const ELIGIBILITY_BADGE = {
  eligible: "bg-emerald-100 text-emerald-800",
  needs_review: "bg-amber-100 text-amber-800",
  not_eligible: "bg-rose-100 text-rose-800",
};

function CompareApplicantsTable({ applications }) {
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const ids = applications.map((a) => a.id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data } = await supabase
        .from("ai_match_scores")
        .select("*")
        .in("application_id", ids);
      if (!cancelled) {
        const byId = {};
        (data || []).forEach((s) => { byId[s.application_id] = s; });
        setScores(byId);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applications]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  }

  const cols = [
    { key: "overall_score", label: "Match" },
    { key: "problem_fit", label: "Problem Fit" },
    { key: "technical_fit", label: "Technical" },
    { key: "impact_score", label: "Impact" },
    { key: "feasibility_score", label: "Feasibility" },
    { key: "budget_fit", label: "Budget" },
    { key: "timeline_score", label: "Timeline" },
    { key: "capability_score", label: "Capability" },
  ];

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
            <th className="text-left py-2 px-2">Startup</th>
            <th className="text-left py-2 px-2">Eligibility</th>
            {cols.map((c) => <th key={c.key} className="text-center py-2 px-2">{c.label}</th>)}
            <th className="text-left py-2 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const s = scores[app.id];
            return (
              <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2.5 px-2 font-semibold text-slate-800 whitespace-nowrap">{app.startup_name}</td>
                <td className="py-2.5 px-2">
                  {app.eligibility_status ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELIGIBILITY_BADGE[app.eligibility_status] || "bg-slate-100 text-slate-600"}`}>
                      {app.eligibility_status.replace("_", " ")}
                    </span>
                  ) : "—"}
                </td>
                {cols.map((c) => (
                  <td key={c.key} className="text-center py-2.5 px-2 font-semibold text-slate-700">
                    {s ? `${s[c.key] ?? "—"}%` : "—"}
                  </td>
                ))}
                <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{app.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {Object.keys(scores).length < applications.length && (
        <p className="text-[11px] text-slate-400 mt-3">
          Applicants without a score yet haven't had AI analysis run — open their application to generate it.
        </p>
      )}
    </div>
  );
}

export default function GovernmentDashboard() {
  const { user, profile, verifyCurrentAccount } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  useNotificationPolling(user?.id);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [challenges, setChallenges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPendingHelpModal, setShowPendingHelpModal] = useState(false);
  const [selectedChallengeForApps, setSelectedChallengeForApps] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  useEffect(() => { setCompareMode(false); }, [selectedChallengeForApps]);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    problem_statement: "",
    description: "",
    department: profile?.organization_name || "",
    sector: "Deep Tech",
    expected_outcome: "",
    eligibility: "",
    deadline: "",
    budget: "",
    location: "Pan-India",
    status: "Published"
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Demo accounts use human-readable ids (e.g. "demo-govt-railways-001"),
      // not real uuids, so a query filtered by created_by=user.id would just
      // 400 against this uuid column — skip straight to empty demo state.
      if (user.id.startsWith("demo-")) {
        setChallenges([]);
        setApplications([]);
        return;
      }

      // 1. Fetch Government Challenges
      const { data: challengesData, error: cErr } = await supabase
        .from("challenges")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (cErr) console.warn("Challenges fetch issue:", cErr.message);

      // 2. Fetch all applications for these challenges
      let appsData = [];
      const challengeIds = (challengesData || []).map((c) => c.id);

      if (challengeIds.length > 0) {
        const { data: appsRes, error: aErr } = await supabase
          .from("challenge_applications")
          .select("*, challenges(title, department)")
          .in("challenge_id", challengeIds)
          .order("created_at", { ascending: false });

        if (aErr) console.warn("Challenge applications fetch issue:", aErr.message);
        appsData = appsRes || [];
      }

      setChallenges(challengesData || []);
      setApplications(appsData);
    } catch (err) {
      console.warn("Load data error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  // Handle Challenge Creation
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setError("");

    const isVerified = profile?.verification_status === "verified";
    if (!isVerified) {
      setError("Your department account is pending administrator verification. Challenge creation is restricted.");
      return;
    }

    if (!form.title || !form.problem_statement) {
      setError("Title and Problem Statement are required.");
      return;
    }

    setSubmitting(true);
    try {
      const newChallenge = {
        created_by: user.id,
        title: form.title,
        problem_statement: form.problem_statement,
        description: form.description || form.problem_statement,
        department: form.department || profile?.organization_name || "Government Department",
        sector: form.sector,
        expected_outcome: form.expected_outcome || "Scalable deployable prototype / pilot",
        eligibility: form.eligibility || "DPIIT recognized startups and Indian registered MSMEs",
        deadline: form.deadline || null,
        budget: form.budget || "Govt Grant / Pilot Contract",
        location: form.location || "Pan-India",
        status: form.status,
      };

      const createdItem = {
        id: `ch-local-${Date.now()}`,
        ...newChallenge,
        created_at: new Date().toISOString()
      };

      const { error: insertErr } = await supabase
        .from("challenges")
        .insert(newChallenge);

      if (insertErr) {
        console.warn("Database notice (Supabase table not found or offline):", insertErr.message);
        // Fallback to local state so user can evaluate challenge creation smoothly
        setChallenges((prev) => [createdItem, ...prev]);
      } else {
        await loadData();
      }

      setShowCreateModal(false);
      setForm({
        title: "",
        problem_statement: "",
        description: "",
        department: profile?.organization_name || "",
        sector: "Deep Tech",
        expected_outcome: "",
        eligibility: "",
        deadline: "",
        budget: "",
        location: "Pan-India",
        status: "Published"
      });
    } catch (errObj) {
      console.warn("Propose challenge catch:", errObj);
      setShowCreateModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Challenge Status
  const handleToggleStatus = async (challengeId, currentStatus) => {
    const nextStatus = currentStatus === "Published" ? "Closed" : "Published";
    await supabase
      .from("challenges")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", challengeId);
    await loadData();
  };

  // Delete Draft Challenge
  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm("Are you sure you want to delete this draft challenge?")) return;
    await supabase.from("challenges").delete().eq("id", challengeId);
    await loadData();
  };

  // Update Application Review Status
  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    await supabase
      .from("challenge_applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", appId);

    if (selectedApplication) {
      setSelectedApplication((prev) => ({ ...prev, status: newStatus }));
    }
    await loadData();
  };

  // Stats calculation
  const totalChallenges = challenges.length;
  const publishedCount = challenges.filter((c) => c.status === "Published").length;
  const draftCount = challenges.filter((c) => c.status === "Draft").length;
  const totalAppsCount = applications.length;

  // Verification states
  const verificationStatus = profile?.verification_status || "pending";
  const isVerified = verificationStatus === "verified";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  const deptName = profile?.organization_name || "Department of Public Innovations";
  const officialName = profile?.full_name || user?.email?.split("@")[0];

  const GOV_NAV = [
    { id: "dashboard",   label: "Dashboard",           icon: LayoutDashboard, badge: undefined },
    { id: "challenges",  label: "Proposed Challenges",  icon: FileText,         badge: totalChallenges || undefined },
    { id: "applications",label: "Applications",         icon: Send,             badge: totalAppsCount || undefined },
    { id: "pilots",      label: "Pilots",               icon: Target,           badge: undefined },
    { id: "notifications", label: "Notifications",      icon: Bell,             badge: unreadCount || undefined },
  ];

  return (
    <DashboardLayout
      role="government"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      navItems={GOV_NAV}
    >
      <div className="space-y-8">
        {/* Section: Dashboard Overview */}
        {activeSection === "dashboard" && (
          <div className="space-y-8">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Government Department Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              National innovation problem statements, startup proposals, and sovereign procurement pilots.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isVerified ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" /> Propose a Challenge
              </button>
            ) : (
              <button
                onClick={() => setShowPendingHelpModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <Lock className="w-4 h-4" /> Propose a Challenge (Pending Review)
              </button>
            )}
          </div>
        </div>

        {/* PENDING VERIFICATION BANNER */}
        {isPending && (
          <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-white border border-amber-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Department Account Under Sovereign Review</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">Pending</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Challenge publishing is restricted until the UdyamSetu team verifies your department.
                </p>
              </div>
            </div>
            {user?.id?.startsWith("demo-") && (
              <button
                onClick={() => verifyCurrentAccount()}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-colors shadow-sm shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Verify (Demo Mode)
              </button>
            )}
          </div>
        )}

        {/* REJECTED VERIFICATION BANNER */}
        {isRejected && (
          <div className="bg-gradient-to-br from-red-50 via-red-100/40 to-white border border-red-300 rounded-2xl p-5 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-900">Verification Rejected by Administrator</div>
              <p className="text-xs text-slate-600 mt-0.5">
                {profile?.rejection_reason || "Department credentials could not be authenticated. Contact admin@udyamsetu.gov.in"}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} value={totalChallenges} label="Total Challenges" color="bg-indigo-50 text-indigo-600" sub="All recorded initiatives" />
          <StatCard icon={CheckCircle2} value={publishedCount} label="Active & Published" color="bg-emerald-50 text-emerald-600" sub="Accepting startup proposals" />
          <StatCard icon={Clock} value={draftCount} label="Draft Challenges" color="bg-amber-50 text-amber-600" sub="Pending official release" />
          <StatCard icon={TrendingUp} value={totalAppsCount} label="Proposals Received" color="bg-violet-50 text-violet-600" sub="From DPIIT startups" />
        </div>

        {/* Quick Challenges Summary in Dashboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Recent Proposed Challenges
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Your department's active national tender challenges.</p>
            </div>
            <button
              onClick={() => setActiveSection("challenges")}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {!isVerified ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50/50">
              <Lock className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
              Challenge publishing is locked until your account is verified.
            </div>
          ) : challenges.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No challenges proposed yet.{" "}
              <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 font-semibold hover:underline">Propose one now</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {challenges.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.sector} · {c.status}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Recent Startup Proposals
            </h2>
            <button onClick={() => setActiveSection("applications")} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {!isVerified || applications.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              {!isVerified ? "Locked until verification." : "No proposals received yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div key={app.id} onClick={() => navigate(`/government/applications/${app.id}`)}
                  className="cursor-pointer flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">{app.startup_name || "Startup"}</div>
                    <div className="text-xs text-slate-400 truncate">{app.solution_title}</div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-0.5 ml-3">Review <ArrowRight className="w-3 h-3" /></span>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        )}


        {/* Section: Proposed Challenges */}
        {activeSection === "challenges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Proposed Challenges</h2>
                <p className="text-sm text-slate-500 mt-1">Real-world problem statements opened for indigenous startup solutions.</p>
              </div>
              {isVerified && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> Propose a Challenge
                </button>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {!isVerified ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Challenge Publishing Is Locked</h3>
                  <p className="text-xs text-slate-500 max-w-md">
                    Your department account must be verified before you can publish challenges.
                  </p>
                </div>
              ) : loading ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-500">Loading challenges...</span>
                </div>
              ) : challenges.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <Rocket className="w-8 h-8 text-slate-300" />
                  <h3 className="font-semibold text-slate-800">No Challenges Proposed Yet</h3>
                  <button onClick={() => setShowCreateModal(true)} className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold">
                    <Plus className="w-4 h-4" /> Propose First Challenge
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Challenge Title</th>
                        <th className="px-6 py-4">Sector</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Proposals</th>
                        <th className="px-6 py-4">Deadline</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {challenges.map((c) => {
                        const cApps = applications.filter((a) => a.challenge_id === c.id);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 leading-snug">{c.title}</div>
                              <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.problem_statement}</div>
                            </td>
                            <td className="px-6 py-4"><span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">{c.sector}</span></td>
                            <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                            <td className="px-6 py-4"><span className="font-bold text-indigo-700">{cApps.length}</span></td>
                            <td className="px-6 py-4"><span className="text-xs text-slate-500">{c.deadline ? new Date(c.deadline).toLocaleDateString("en-IN") : "Open"}</span></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {cApps.length > 0 && (
                                  <button onClick={() => { setSelectedChallengeForApps(c); setActiveSection("applications"); }} className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100">
                                    View {cApps.length} Proposals
                                  </button>
                                )}
                                <button onClick={() => handleToggleChallengeStatus(c)} className="text-xs font-semibold px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700">
                                  {c.status === "Published" ? "Close" : "Publish"}
                                </button>
                                {c.status === "Draft" && (
                                  <button onClick={() => handleDeleteChallenge(c.id)} className="text-xs font-semibold px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-3.5 h-3.5 inline" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section: Applications */}
        {activeSection === "applications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Startup Proposals Received</h2>
              <p className="text-sm text-slate-500 mt-1">Review solutions submitted by DPIIT-verified startups.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {!isVerified ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Lock className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
                  Startup proposal reviews are locked until your account is verified.
                </div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No startup proposals received yet. Startups will submit solutions once your challenges are published.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/government/applications/${app.id}`)}
                      className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">{app.challenges?.department || "Govt Dept"}</span>
                          <AIChip appId={app.id} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{app.startup_name || "Startup"}</h3>
                        <div className="text-xs text-slate-600 line-clamp-1 mb-2">For: <strong>{app.challenges?.title}</strong></div>
                        <p className="text-xs text-slate-500 line-clamp-2">{app.solution_title}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        <span className="font-semibold text-indigo-600 flex items-center gap-0.5">Review <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section: Pilots */}
        {activeSection === "pilots" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Pilot Deployments</h2>
              <p className="text-sm text-slate-500 mt-1">Track ongoing pilots and procurement contracts with startups.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Target className="w-7 h-7 text-violet-500" />
              </div>
              <h3 className="font-bold text-slate-900">Pilot Management Console</h3>
              <p className="text-xs text-slate-500 max-w-md">Once a startup is shortlisted and a pilot contract is initiated, deployment tracking will appear here.</p>
              <button onClick={() => navigate("/pilot-management")} className="mt-2 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold">
                <ArrowRight className="w-4 h-4" /> Go to Pilot Management
              </button>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Notifications</h2>
              <p className="text-sm text-slate-500 mt-1">Updates on applications, pilots, and milestones for your department.</p>
            </div>
            <NotificationsList />
          </div>
        )}

      </div>

      {/* CREATE CHALLENGE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Government Gateway</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Propose a National Challenge
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Publish a technical challenge or procurement problem statement to invite high-growth startup solutions.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Challenge Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AI-Powered Predictive Track Maintenance System"
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.problem_statement}
                  onChange={(e) => setForm({ ...form, problem_statement: e.target.value })}
                  placeholder="Describe the critical operational bottlenecks or technical roadblocks..."
                  rows={3}
                  required
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Government Department / Ministry</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="e.g. Ministry of Railways"
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Sector / Domain</label>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Required Solution / Expected Outcome</label>
                  <input
                    type="text"
                    value={form.expected_outcome}
                    onChange={(e) => setForm({ ...form, expected_outcome: e.target.value })}
                    placeholder="e.g. Working pilot prototype with >95% accuracy"
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Eligibility Criteria</label>
                  <input
                    type="text"
                    value={form.eligibility}
                    onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                    placeholder="e.g. DPIIT Recognized Startups with TRL-4+"
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget / Grant</label>
                  <input
                    type="text"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="e.g. ₹2.5 Cr"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Published">Publish Now</option>
                    <option value="Draft">Save as Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : form.status === "Published" ? "Publish Challenge" : "Save Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICATIONS DRAWER FOR SPECIFIC CHALLENGE */}
      {selectedChallengeForApps && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className={`bg-white w-full h-full p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between ${compareMode ? "max-w-4xl" : "max-w-xl"}`}>
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Challenge Submissions</span>
                  <h3 className="text-xl font-bold text-slate-900">{selectedChallengeForApps.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {applications.filter((a) => a.challenge_id === selectedChallengeForApps.id).length > 1 && (
                    <button
                      onClick={() => setCompareMode((m) => !m)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        compareMode ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {compareMode ? "List View" : "Compare Applicants"}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedChallengeForApps(null)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {applications.filter((a) => a.challenge_id === selectedChallengeForApps.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No startup proposals submitted for this challenge yet.
                </div>
              ) : compareMode ? (
                <CompareApplicantsTable
                  applications={applications.filter((a) => a.challenge_id === selectedChallengeForApps.id)}
                />
              ) : (
                <div className="space-y-4">
                   {applications
                     .filter((a) => a.challenge_id === selectedChallengeForApps.id)
                     .map((app) => (
                       <div
                         key={app.id}
                         onClick={() => { setSelectedChallengeForApps(null); navigate(`/government/applications/${app.id}`); }}
                         className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all"
                       >
                         <div className="flex items-center justify-between mb-1">
                           <div className="flex items-center gap-2">
                             <strong className="text-sm font-bold text-slate-900">{app.startup_name}</strong>
                             <AIChip appId={app.id} />
                           </div>
                           <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                             {app.status}
                           </span>
                         </div>
                         <div className="text-xs font-semibold text-slate-700 mb-1">{app.solution_title}</div>
                         <p className="text-xs text-slate-500 line-clamp-2">{app.solution_description}</p>
                         <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                           <span>Cost: {app.estimated_cost || "N/A"}</span>
                           <span>Timeline: {app.timeline || "N/A"}</span>
                         </div>
                       </div>
                    ))}
                  </div>
               )}
            </div>
            <button
              onClick={() => setSelectedChallengeForApps(null)}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* SINGLE APPLICATION REVIEW MODAL */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedApplication(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Startup Proposal Review</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedApplication.solution_title}</h3>
            <div className="text-xs text-slate-500 mb-4">
              Submitted by <strong className="text-slate-800">{selectedApplication.startup_name}</strong> (Contact: {selectedApplication.contact_person})
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 max-h-60 overflow-y-auto">
              <div>
                <strong className="block text-slate-900 mb-0.5">Solution Description:</strong>
                {selectedApplication.solution_description}
              </div>
              {selectedApplication.technology && (
                <div>
                  <strong className="block text-slate-900 mb-0.5">Technology & Approach:</strong>
                  {selectedApplication.technology}
                </div>
              )}
              {selectedApplication.expected_impact && (
                <div>
                  <strong className="block text-slate-900 mb-0.5">Expected Impact:</strong>
                  {selectedApplication.expected_impact}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <strong className="text-slate-900">Timeline:</strong> {selectedApplication.timeline || "Not specified"}
                </div>
                <div>
                  <strong className="text-slate-900">Cost:</strong> {selectedApplication.estimated_cost || "Not specified"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Update Application Status:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Under Review", "Shortlisted", "Selected", "Rejected"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateApplicationStatus(selectedApplication.id, st)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedApplication.status === st
                        ? "bg-[#0B192C] text-white border-[#0B192C]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PENDING HELP MODAL */}
      {showPendingHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowPendingHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Institutional Sovereign Audit</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Account Verification Required
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              To publish grand challenges and invite startup proposals, government department accounts must be verified by the UdyamSetu team.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 leading-relaxed space-y-2">
              {user?.id?.startsWith("demo-") ? (
                <div>
                  <strong>For Quick Testing:</strong> You can click the Instant Verify button below to verify this account immediately in demo mode.
                </div>
              ) : (
                <div>
                  <strong>How verification works:</strong> Department credentials are reviewed and verified directly by the UdyamSetu team. You'll be notified once your account is approved.
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {user?.id?.startsWith("demo-") && (
                <button
                  onClick={() => {
                    verifyCurrentAccount();
                    setShowPendingHelpModal(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-400" /> Instant Verify & Propose Challenge
                </button>
              )}
              <button
                onClick={() => setShowPendingHelpModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
