import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Landmark, Plus, Rocket, FileText, CheckCircle2, Clock, AlertCircle,
  Users, TrendingUp, X, Trash2, ArrowRight, ShieldCheck, ShieldAlert,
  Loader2, Lock, Globe, Mail, Building2, BrainCircuit
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

export default function GovernmentDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallengeForApps, setSelectedChallengeForApps] = useState(null);
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

      const { error: insertErr } = await supabase
        .from("challenges")
        .insert(newChallenge);

      if (insertErr) {
        setError(insertErr.message);
      } else {
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
        await loadData();
      }
    } catch (errObj) {
      setError(errObj.message || "Could not propose challenge.");
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Landmark className="w-7 h-7 text-indigo-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ✓ Verified Government Department
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> ⏳ Verification in Progress (Pending Approval)
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> ❌ Verification Rejected
                  </span>
                )}
                {profile?.govt_level && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                    {profile.govt_level}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {deptName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Authorized Officer: <strong className="text-slate-700">{officialName}</strong> {profile?.designation && `· ${profile.designation}`}
              </p>
            </div>
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
                disabled
                title="Account pending administrator verification. Challenge creation is restricted."
                className="flex items-center gap-2 px-5 py-3 bg-slate-200 text-slate-500 font-bold text-sm rounded-xl cursor-not-allowed border border-slate-300/80 shadow-none"
              >
                <Lock className="w-4 h-4" /> Propose a Challenge (Verification Required)
              </button>
            )}
          </div>
        </div>

        {/* PENDING VERIFICATION BANNER & WORKFLOW */}
        {isPending && (
          <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-white border border-amber-300 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-700 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                    Verification In Progress
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    Government Department Account Under Sovereign Review
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Your institutional registration has been submitted and is currently being audited by UdyamSetu National Administrators.
                    To safeguard public procurement integrity, government challenges cannot be published until department jurisdiction and credentials are authenticated.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                  <Clock className="w-3.5 h-3.5" /> Verification SLA: 24–48 Hours
                </span>
              </div>
            </div>

            {/* 3-Step Verification Progress Indicator */}
            <div className="mt-6 pt-6 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 bg-white/80 p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Registration Submitted</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Department details, designated officer, and domain submitted.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/90 p-3.5 rounded-xl border-2 border-amber-400 shadow-xs">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">2. Administrator Review</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Portal administrator validates official email & department authority.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 p-3.5 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">3. Sovereign Publishing</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Posting national tenders, pilots, and reviewing proposals unlocked.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REJECTED VERIFICATION BANNER */}
        {isRejected && (
          <div className="bg-gradient-to-br from-red-50 via-red-100/40 to-white border border-red-300 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-400/40 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                  Verification Rejected
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Department Verification Was Not Approved
                </h3>
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  The portal administrator reviewed your registration but was unable to authenticate this department account.
                </p>
                {profile?.rejection_reason && (
                  <div className="mt-3 p-3.5 bg-red-100/70 border border-red-200 rounded-xl text-xs text-red-900">
                    <strong className="block font-bold text-red-950 mb-1">Reason Provided by Administrator:</strong>
                    {profile.rejection_reason}
                  </div>
                )}
                <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>To request a re-review or submit additional institutional credentials, contact <strong>admin@udyamsetu.gov.in</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMITTED CREDENTIALS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <Building2 className="w-4 h-4 text-indigo-600" /> Submitted Department Credentials
              </h2>
              <p className="text-xs text-slate-500">Official institutional record on the national register.</p>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase ${
              isVerified ? "bg-emerald-100 text-emerald-800" : isRejected ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
            }`}>
              Status: {verificationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Ministry / Department</span>
              <strong className="text-slate-800 text-sm block truncate">{deptName}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Administrative Level</span>
              <strong className="text-slate-800 text-sm block">{profile?.govt_level || "Central Ministry"}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Authorized Officer</span>
              <strong className="text-slate-800 text-sm block">{officialName} {profile?.designation ? `(${profile.designation})` : ""}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-0.5 uppercase tracking-wider text-[10px]">Official Portal</span>
              {profile?.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-xs truncate">
                  <Globe className="w-3.5 h-3.5 shrink-0" /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <span className="text-slate-400 italic">Not provided</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} value={totalChallenges} label="Total Challenges" color="bg-indigo-50 text-indigo-600" sub="All recorded initiatives" />
          <StatCard icon={CheckCircle2} value={publishedCount} label="Active & Published" color="bg-emerald-50 text-emerald-600" sub="Accepting startup proposals" />
          <StatCard icon={Clock} value={draftCount} label="Draft Challenges" color="bg-amber-50 text-amber-600" sub="Pending official release" />
          <StatCard icon={TrendingUp} value={totalAppsCount} label="Proposals Received" color="bg-violet-50 text-violet-600" sub="From DPIIT startups" />
        </div>

        {/* Main Section: Proposed Challenges Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Proposed Challenges
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-world problem statements opened for indigenous startup solutions and procurement pilots.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Showing {challenges.length} challenges
            </span>
          </div>

          {!isVerified ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-slate-50/50">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Challenge Publishing Is Locked</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Your department account must be verified by the administrator before you can publish challenges or launch procurement pilots on the national portal.
              </p>
              <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                Current Status: {isPending ? "⏳ Verification in Progress" : "❌ Verification Rejected"}
              </div>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
              <span className="text-sm">Loading sovereign challenges...</span>
            </div>
          ) : challenges.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">No Challenges Propose Yet</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Publish your department's technical roadblocks or procurement needs to invite proposals from verified startups.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold"
              >
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
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                            {c.sector}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedChallengeForApps(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{cApps.length} {cApps.length === 1 ? "Proposal" : "Proposals"}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {c.deadline || "Open-ended"}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleStatus(c.id, c.status)}
                            className="text-xs font-semibold px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
                          >
                            {c.status === "Published" ? "Close" : "Publish"}
                          </button>
                          {c.status === "Draft" && (
                            <button
                              onClick={() => handleDeleteChallenge(c.id)}
                              className="text-xs font-semibold px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Incoming Startup Proposals */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Recent Startup Proposals Received
              </h2>
              <p className="text-xs text-slate-500">Review solutions submitted by DPIIT-verified startups.</p>
            </div>
          </div>

          {!isVerified ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Lock className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
              Startup proposal reviews are hidden while department account is awaiting administrative verification.
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No startup proposals received yet. Startups will submit solutions once your challenges are published.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.slice(0, 6).map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/government/applications/${app.id}`)}
                  className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider line-clamp-1">
                          {app.startup_name}
                        </span>
                        <AIChip appId={app.id} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {app.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{app.solution_title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{app.solution_description}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Contact: {app.contact_person}</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
          <div className="bg-white max-w-xl w-full h-full p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Challenge Submissions</span>
                  <h3 className="text-xl font-bold text-slate-900">{selectedChallengeForApps.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedChallengeForApps(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {applications.filter((a) => a.challenge_id === selectedChallengeForApps.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No startup proposals submitted for this challenge yet.
                </div>
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
    </div>
  );
}
