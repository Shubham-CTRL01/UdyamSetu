import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Rocket, Search, Filter, Clock, ShieldCheck, CheckCircle2,
  AlertCircle, ArrowRight, Eye, Send, Landmark, Loader2, X,
  BrainCircuit, TrendingUp, Users, User, Target, Zap, IndianRupee, Calendar,
  LayoutDashboard, FileText
} from "lucide-react";
import { pilotStatusColor, pilotStatusLabel, formatCurrency, formatDate } from "../lib/utils";
import StartupAIMatchViewer from "../components/StartupAIMatchViewer";

const DEFAULT_CHALLENGES = [
  {
    id: "demo-ch-1",
    title: "AI-Powered Predictive Maintenance for Track Infrastructure",
    department: "Ministry of Railways",
    sector: "Deep Tech",
    budget: "₹2.5 Cr",
    deadline: "2026-10-15",
    problem_statement: "Autonomous inspection of rail track anomalies using computer vision models mounted on inspection locomotives.",
    description: "Seeking deep tech startups with computer vision models for real-time crack detection.",
    eligibility: "DPIIT Recognized Startups with TRL-6+ technology",
    status: "Published",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-ch-2",
    title: "Last-Mile Diagnostic Solutions for Tier-3 Health Centres",
    department: "Ministry of Health & Family Welfare",
    sector: "HealthTech & Life Sciences",
    budget: "₹80 Lakhs",
    deadline: "2026-09-30",
    problem_statement: "Low-cost portable point-of-care blood diagnostic devices for rural primary health centres.",
    description: "Portable battery-operated point of care diagnostic device for 20+ blood parameters.",
    eligibility: "MedTech Startups & ISO 13485 certified manufacturers",
    status: "Published",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-ch-3",
    title: "High-Efficiency Solid-State Battery Storage for Micro-Grids",
    department: "Ministry of Power & Renewable Energy",
    sector: "CleanTech & Renewable Energy",
    budget: "₹3.2 Cr",
    deadline: "2026-12-10",
    problem_statement: "Next-gen battery storage solutions with >92% round trip efficiency for remote micro-grids.",
    description: "Scaling solid state lithium battery technology for micro-grid energy storage.",
    eligibility: "CleanTech companies with indigenous cell chemistry IP",
    status: "Published",
    created_at: new Date().toISOString()
  }
];

const SECTORS = [
  "All",
  "Deep Tech",
  "Defence & Aerospace",
  "HealthTech & Life Sciences",
  "CleanTech & Renewable Energy",
  "AgriTech & Food Processing",
  "Smart Cities & Infrastructure",
  "Cybersecurity & AI",
  "FinTech & GovTech",
  "Manufacturing & Robotics"
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

function ApplicationStatusBadge({ status }) {
  const map = {
    Submitted: "bg-blue-100 text-blue-800 border-blue-200",
    "Under Review": "bg-amber-100 text-amber-800 border-amber-200",
    Shortlisted: "bg-purple-100 text-purple-800 border-purple-200",
    Selected: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-rose-100 text-rose-800 border-rose-200",
    "Pilot Offered": "bg-cyan-100 text-cyan-800 border-cyan-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${map[status] || "bg-slate-100 text-slate-700"}`}>
      ● {status}
    </span>
  );
}

function ApplicationAIMatchCard({ app, onSelect }) {
  const [match, setMatch] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ai_match_scores")
        .select("*")
        .eq("application_id", app.id)
        .maybeSingle();
      if (data) setMatch(data);
    };
    load();
  }, [app.id]);

  if (!match) return null;

  return (
    <div
      onClick={() => onSelect && onSelect(app)}
      className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">
          {app.challenges?.department || "Govt Department"}
        </span>
        <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">
        {app.solution_title}
      </h3>
      <div className="text-xs text-slate-600 line-clamp-1 mb-2">
        For: <strong>{app.challenges?.title}</strong>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-xs text-slate-500">AI Match Score</span>
          <div className="text-2xl font-bold text-indigo-600">
            {match.overall_score}%
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Problem Fit</span>
          <span className="font-semibold text-slate-800 block">
            {match.problem_fit ?? match.problemFit}%
          </span>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Submitted {formatDate(app.created_at)}</span>
        <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
          View <Eye className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default function StartupDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [challenges, setChallenges] = useState([]);

  const [applications, setApplications] = useState([]);
  const [pilotOffers, setPilotOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  // Modals
  const [detailModalChallenge, setDetailModalChallenge] = useState(null);
  const [applyModalChallenge, setApplyModalChallenge] = useState(null);
  const [viewAppModal, setViewAppModal] = useState(null);

  // Application Form
  const [submitting, setSubmitting] = useState(false);
  const [appError, setAppError] = useState("");
  const [appSuccess, setAppSuccess] = useState("");
  const [appForm, setAppForm] = useState({
    startup_name: profile?.organization_name || "",
    contact_person: profile?.full_name || "",
    startup_sector: profile?.sector || "",
    startup_description: profile?.description || "",
    solution_title: "",
    pitch_summary: "",
    solution_description: "",
    problem_solving_approach: "",
    technology: "",
    key_features: "",
    implementation_methodology: "",
    expected_impact: "",
    current_maturity: "",
    existing_deployments: "",
    team_capabilities: "",
    timeline: "3 to 6 months",
    estimated_cost: "₹25 - 50 Lakhs",
    supporting_docs_url: "",
  });

  const [businessData, setBusinessData] = useState(null);

  useEffect(() => {
    if (businessData && !appForm.startup_name) {
      setAppForm((prev) => ({
        ...prev,
        startup_name: businessData.company_name || businessData.name || "",
        contact_person: businessData.contact_name || businessData.full_name || "",
        technology: businessData.technology || prev.technology,
      }));
    }
  }, [businessData, appForm.startup_name]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Published Challenges
      const { data: challengesData, error: cErr } = await supabase
        .from("challenges")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (cErr) console.warn("Challenges error:", cErr.message);

      // 2. Fetch Startup's Applications
      const { data: appsData, error: aErr } = await supabase
        .from("challenge_applications")
        .select("*, challenges(title, department, sector, budget)")
        .eq("startup_id", user.id)
        .order("created_at", { ascending: false });

      if (aErr) console.warn("Applications error:", aErr.message);

      // 3. Fetch business profile for auto-fill
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // 4. Fetch pilot offers for this startup
      const { data: pilotData, error: pErr } = await supabase
        .from("pilot_offers")
        .select("*, challenges!inner(title, department)")
        .eq("startup_id", user.id)
        .order("created_at", { ascending: false });

      if (pErr) console.warn("Pilot offers error:", pErr.message);

      setChallenges((challengesData && challengesData.length > 0) ? challengesData : DEFAULT_CHALLENGES);
      setApplications(appsData || []);
      setBusinessData(bizData);
      setPilotOffers(pilotData || []);
    } catch (err) {
      console.warn("Load data error:", err);
      setChallenges(DEFAULT_CHALLENGES);
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

  // Handle Application Submit
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setAppError("");
    setAppSuccess("");

    if (!appForm.solution_title || !appForm.solution_description) {
      setAppError("Solution title and detailed description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        challenge_id: applyModalChallenge.id,
        startup_id: user.id,
        startup_name: appForm.startup_name || profile?.organization_name || "Startup Entity",
        contact_person: appForm.contact_person || profile?.full_name || "Founder",
        solution_title: appForm.solution_title,
        solution_description: appForm.solution_description,
        pitch_summary: appForm.pitch_summary,
        problem_solving_approach: appForm.problem_solving_approach,
        technology: appForm.technology,
        key_features: appForm.key_features,
        implementation_methodology: appForm.implementation_methodology,
        expected_impact: appForm.expected_impact,
        current_maturity: appForm.current_maturity,
        existing_deployments: appForm.existing_deployments,
        team_capabilities: appForm.team_capabilities,
        timeline: appForm.timeline,
        estimated_cost: appForm.estimated_cost,
        supporting_docs_url: appForm.supporting_docs_url,
        status: "Submitted",
      };

      const { error: insertErr } = await supabase
        .from("challenge_applications")
        .insert(payload);

      if (insertErr) {
        if (insertErr.code === "23505") {
          setAppError("You have already submitted an application for this challenge.");
        } else {
          setAppError(insertErr.message);
        }
      } else {
        setAppSuccess("Application submitted successfully to the department!");
        setTimeout(() => {
          setApplyModalChallenge(null);
          setAppSuccess("");
          setAppForm({
            startup_name: profile?.organization_name || "",
            contact_person: profile?.full_name || "",
            startup_sector: profile?.sector || "",
            startup_description: profile?.description || "",
            solution_title: "",
            pitch_summary: "",
            solution_description: "",
            problem_solving_approach: "",
            technology: "",
            key_features: "",
            implementation_methodology: "",
            expected_impact: "",
            current_maturity: "",
            existing_deployments: "",
            team_capabilities: "",
            timeline: "3 to 6 months",
            estimated_cost: "₹25 - 50 Lakhs",
            supporting_docs_url: "",
          });
        }, 1500);
        await loadData();
      }
    } catch (errObj) {
      setAppError(errObj.message || "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter challenges
  const filteredChallenges = challenges.filter((c) => {
    const matchesSector = selectedSector === "All" || c.sector === selectedSector;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.problem_statement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesSearch;
  });

  // Check if startup applied to a given challenge
  const hasApplied = (challengeId) => {
    return applications.some((a) => a.challenge_id === challengeId);
  };

  // Stats
  const availableCount = challenges.length;
  const appliedCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === "Under Review").length;
  const shortlistedCount = applications.filter((a) => a.status === "Shortlisted" || a.status === "Selected").length;

  const startupName = profile?.organization_name || "Indigenous Startup Enterprise";
  const founderName = profile?.full_name || user?.email?.split("@")[0];

  const STARTUP_NAV = [
    { id: "dashboard",   label: "Dashboard",            icon: LayoutDashboard, badge: undefined },
    { id: "challenges",  label: "Available Challenges",  icon: FileText,         badge: availableCount || undefined },
    { id: "applications",label: "My Applications",       icon: Send,             badge: appliedCount || undefined },
    { id: "pilots",      label: "Pilots",                icon: Target,           badge: pilotOffers.length || undefined },
  ];

  return (
    <DashboardLayout
      role="startup"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      navItems={STARTUP_NAV}
    >
      <div className="space-y-8">

        {/* ===== DASHBOARD SECTION ===== */}
        {activeSection === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Rocket} value={availableCount} label="Available Challenges" color="bg-amber-50 text-amber-600" sub="Live government tenders" />
              <StatCard icon={Send} value={appliedCount} label="Proposals Submitted" color="bg-blue-50 text-blue-600" sub="Active solutions logged" />
              <StatCard icon={Clock} value={underReviewCount} label="Under Ministry Review" color="bg-purple-50 text-purple-600" sub="In evaluation phase" />
              <StatCard icon={CheckCircle2} value={shortlistedCount + pilotOffers.length} label="Shortlisted / Pilots" color="bg-emerald-50 text-emerald-600" sub={`${shortlistedCount} shortlisted · ${pilotOffers.length} pilot offers`} />
            </div>

            {/* Quick Applications Preview */}
            {applications.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>My Recent Applications</h2>
                    <p className="text-xs text-slate-500">Track government review status of your solutions.</p>
                  </div>
                  <button onClick={() => setActiveSection("applications")} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} onClick={() => setViewAppModal(app)}
                      className="cursor-pointer flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-slate-900 truncate">{app.solution_title}</div>
                        <div className="text-xs text-slate-400 truncate">For: {app.challenges?.title}</div>
                      </div>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Pilot Offers Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Recent Pilot Offers</h2>
                <button onClick={() => setActiveSection("pilots")} className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-800">View All <ArrowRight className="w-3.5 h-3.5" /></button>
              </div>
              {pilotOffers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No pilot offers yet. They appear here when government departments select your solution.
                </div>
              ) : (
                <div className="space-y-3">
                  {pilotOffers.slice(0, 3).map((offer) => (
                    <div key={offer.id} onClick={() => navigate(`/pilot-management/${offer.id}`)}
                      className="cursor-pointer flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-slate-900 truncate">{offer.objective || "Pilot Offer"}</div>
                        <div className="text-xs text-slate-400 truncate">{offer.challenges?.title}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-3 ${pilotStatusColor(offer.status)}`}>{pilotStatusLabel(offer.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CHALLENGES SECTION ===== */}
        {activeSection === "challenges" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Available Government Challenges</h2>
              <p className="text-sm text-slate-500 mt-1">Official problem statements from Ministries. Submit your solution for grant funding and pilots.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {/* Search + Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 flex-1">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search challenges, departments..." className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2"><Filter className="w-3 h-3 inline" /> Sector:</span>
                {SECTORS.map((sec) => (
                  <button key={sec} onClick={() => setSelectedSector(sec)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${ selectedSector === sec ? "bg-[#0B192C] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200" }`}
                  >{sec}</button>
                ))}
              </div>
              {loading ? (
                <div className="p-12 text-center flex flex-col items-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /><span className="text-sm text-slate-500">Loading challenges...</span></div>
              ) : filteredChallenges.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3"><Search className="w-8 h-8 text-slate-300" /><h3 className="font-semibold text-slate-800">No Matching Challenges</h3></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredChallenges.map((c) => {
                    const applied = hasApplied(c.id);
                    return (
                      <div key={c.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">{c.sector}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.deadline || "Open"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1"><Landmark className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{c.department}</span></div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2">{c.problem_statement}</p>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                          <button onClick={() => setDetailModalChallenge(c)} className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700">View Details</button>
                          {applied ? (
                            <span className="flex-1 py-2 text-xs font-bold text-center bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Applied</span>
                          ) : (
                            <button onClick={() => setApplyModalChallenge(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white">Apply <ArrowRight className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== APPLICATIONS SECTION ===== */}
        {activeSection === "applications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>My Applications</h2>
              <p className="text-sm text-slate-500 mt-1">Track real-time government review status of your submitted solutions.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {applications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <Send className="w-8 h-8 text-slate-300" />
                  <h3 className="font-semibold text-slate-800">No Applications Yet</h3>
                  <p className="text-xs text-slate-500">Browse challenges and submit your first solution.</p>
                  <button onClick={() => setActiveSection("challenges")} className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-semibold">Browse Challenges <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applications.map((app) => (
                    <div key={app.id} onClick={() => setViewAppModal(app)}
                      className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">{app.challenges?.department || "Govt Department"}</span>
                          <ApplicationStatusBadge status={app.status} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{app.solution_title}</h3>
                        <div className="text-xs text-slate-600 line-clamp-1 mb-2">For: <strong>{app.challenges?.title}</strong></div>
                        <p className="text-xs text-slate-500 line-clamp-2">{app.solution_description}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Submitted {new Date(app.created_at).toLocaleDateString()}</span>
                        <span className="font-semibold text-blue-600 flex items-center gap-0.5">View <Eye className="w-3 h-3" /></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PILOTS SECTION ===== */}
        {activeSection === "pilots" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Pilot Opportunities</h2>
              <p className="text-sm text-slate-500 mt-1">Pilot offers and negotiations from government departments.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {pilotOffers.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <Target className="w-8 h-8 text-slate-300" />
                  <h3 className="font-semibold text-slate-800">No Pilot Offers Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md">Pilot offers appear here when a government department selects your solution for a pilot deployment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pilotOffers.map((offer) => (
                    <div key={offer.id} onClick={() => navigate(`/pilot-management/${offer.id}`)}
                      className="cursor-pointer p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase truncate">{offer.challenges?.title || "Challenge"}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pilotStatusColor(offer.status)}`}>● {pilotStatusLabel(offer.status)}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2 line-clamp-1">{offer.objective || "Pilot Offer"}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{formatCurrency(offer.proposed_budget) || "—"}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{offer.duration ? `${offer.duration}d` : "—"}</div>
                      </div>
                      {offer.start_date && <div className="text-xs text-slate-500 mt-1">Starts: {formatDate(offer.start_date)}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {detailModalChallenge && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailModalChallenge(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                {detailModalChallenge.sector}
              </span>
              <span className="text-xs text-slate-400">● {detailModalChallenge.department}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {detailModalChallenge.title}
            </h2>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Problem Statement:</h4>
                <p className="leading-relaxed whitespace-pre-line">{detailModalChallenge.problem_statement}</p>
              </div>

              {detailModalChallenge.description && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Detailed Description:</h4>
                  <p className="leading-relaxed whitespace-pre-line text-slate-600">{detailModalChallenge.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block font-bold text-slate-900 mb-1">Expected Outcome:</span>
                  <span>{detailModalChallenge.expected_outcome || "Functional prototype"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block font-bold text-slate-900 mb-1">Eligibility Criteria:</span>
                  <span>{detailModalChallenge.eligibility || "DPIIT Startups"}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100/60 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Grant / Budget</span>
                  <strong className="text-slate-900">{detailModalChallenge.budget || "Govt Pilot"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Deadline</span>
                  <strong className="text-slate-900">{detailModalChallenge.deadline || "Open"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Scope</span>
                  <strong className="text-slate-900">{detailModalChallenge.location || "Pan-India"}</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setDetailModalChallenge(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              {!hasApplied(detailModalChallenge.id) && (
                <button
                  onClick={() => {
                    const c = detailModalChallenge;
                    setDetailModalChallenge(null);
                    setApplyModalChallenge(c);
                  }}
                  className="px-5 py-2 bg-[#0B192C] text-white text-xs font-bold rounded-xl hover:bg-[#1E3E62]"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPLY FOR CHALLENGE MODAL */}
      {applyModalChallenge && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setApplyModalChallenge(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Proposal Submission</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Apply for Challenge
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Submitting to: <strong className="text-slate-800">{applyModalChallenge.title}</strong> ({applyModalChallenge.department})
            </p>

            {appError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{appError}</span>
              </div>
            )}

            {appSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-5">
              {/* Startup Information (auto-retrieved from profile) */}
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Startup Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Startup Name</label>
                    <input
                      type="text"
                      value={appForm.startup_name}
                      onChange={(e) => setAppForm({ ...appForm, startup_name: e.target.value })}
                      required
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person / Founder</label>
                    <input
                      type="text"
                      value={appForm.contact_person}
                      onChange={(e) => setAppForm({ ...appForm, contact_person: e.target.value })}
                      required
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Industry / Sector</label>
                    <input
                      type="text"
                      value={appForm.startup_sector}
                      onChange={(e) => setAppForm({ ...appForm, startup_sector: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Link to="/profile" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                      Update via Business Profile →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Proposed Solution */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Proposed Solution
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Solution Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={appForm.solution_title}
                      onChange={(e) => setAppForm({ ...appForm, solution_title: e.target.value })}
                      placeholder="e.g. Edge-AI Vision Module for Automated Defect Detection"
                      required
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pitch / Executive Summary</label>
                    <textarea
                      value={appForm.pitch_summary}
                      onChange={(e) => setAppForm({ ...appForm, pitch_summary: e.target.value })}
                      placeholder="A concise 2-3 sentence summary of your solution and its value proposition."
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Solution Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={appForm.solution_description}
                      onChange={(e) => setAppForm({ ...appForm, solution_description: e.target.value })}
                      placeholder="Explain your technical architecture, methodology, and how it solves the ministry's bottleneck..."
                      rows={3}
                      required
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Problem-Solving Approach</label>
                    <textarea
                      value={appForm.problem_solving_approach}
                      onChange={(e) => setAppForm({ ...appForm, problem_solving_approach: e.target.value })}
                      placeholder="How does your solution approach and resolve the specific problem outlined?"
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Approach */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Technical Approach
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Technology / Technical Approach</label>
                    <input
                      type="text"
                      value={appForm.technology}
                      onChange={(e) => setAppForm({ ...appForm, technology: e.target.value })}
                      placeholder="e.g. Computer Vision, IoT Sensors, Edge computing"
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Features</label>
                    <textarea
                      value={appForm.key_features}
                      onChange={(e) => setAppForm({ ...appForm, key_features: e.target.value })}
                      placeholder="List the key features and differentiators of your solution."
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Implementation Methodology</label>
                    <textarea
                      value={appForm.implementation_methodology}
                      onChange={(e) => setAppForm({ ...appForm, implementation_methodology: e.target.value })}
                      placeholder="Describe your step-by-step implementation plan."
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Impact & Feasibility */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Impact &amp; Feasibility
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Impact</label>
                    <input
                      type="text"
                      value={appForm.expected_impact}
                      onChange={(e) => setAppForm({ ...appForm, expected_impact: e.target.value })}
                      placeholder="e.g. 40% reduction in downtime, 10x throughput"
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Maturity / Stage</label>
                    <select
                      value={appForm.current_maturity}
                      onChange={(e) => setAppForm({ ...appForm, current_maturity: e.target.value })}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    >
                      <option value="">Select maturity level</option>
                      <option value="Concept / Ideation">Concept / Ideation</option>
                      <option value="Proof of Concept">Proof of Concept</option>
                      <option value="Prototype">Prototype</option>
                      <option value="TRL-4 / Validation">TRL-4 / Validation</option>
                      <option value="TRL-5 / Lab Tested">TRL-5 / Lab Tested</option>
                      <option value="TRL-6 / Prototype Tested">TRL-6 / Prototype Tested</option>
                      <option value="TRL-7 / Demo">TRL-7 / Demo</option>
                      <option value="TRL-8 / Actual System">TRL-8 / Actual System</option>
                      <option value="TRL-9 / Deployed">TRL-9 / Deployed</option>
                      <option value="Deployed / Production">Deployed / Production</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Capability & Deployments */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Capability &amp; Deployments
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Existing Deployments / Pilots</label>
                    <textarea
                      value={appForm.existing_deployments}
                      onChange={(e) => setAppForm({ ...appForm, existing_deployments: e.target.value })}
                      placeholder="Describe any existing deployments or pilot experiences."
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Team / Capabilities</label>
                    <textarea
                      value={appForm.team_capabilities}
                      onChange={(e) => setAppForm({ ...appForm, team_capabilities: e.target.value })}
                      placeholder="Describe your team's relevant experience and capabilities."
                      rows={2}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cost & Timeline */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" /> Cost &amp; Timeline
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Timeline</label>
                    <input
                      type="text"
                      value={appForm.timeline}
                      onChange={(e) => setAppForm({ ...appForm, timeline: e.target.value })}
                      placeholder="e.g. 4 months to MVP"
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost / Budget</label>
                    <input
                      type="text"
                      value={appForm.estimated_cost}
                      onChange={(e) => setAppForm({ ...appForm, estimated_cost: e.target.value })}
                      placeholder="e.g. ₹35 Lakhs"
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Documents (optional)</label>
                <input
                  type="url"
                  value={appForm.supporting_docs_url}
                  onChange={(e) => setAppForm({ ...appForm, supporting_docs_url: e.target.value })}
                  placeholder="URL to portfolio, deck, or datasheet"
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]/10"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalChallenge(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? "Submitting..." : "Submit Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SUBMITTED APPLICATION DETAILS MODAL */}
      {viewAppModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewAppModal(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Proposal Details</span>
              <ApplicationStatusBadge status={viewAppModal.status} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mt-1">{viewAppModal.solution_title}</h3>
            <div className="text-xs text-slate-500 mb-4">
              Submitted for: <strong className="text-slate-800">{viewAppModal.challenges?.title}</strong> ({viewAppModal.challenges?.department})
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              {viewAppModal.pitch_summary && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Pitch / Executive Summary:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.pitch_summary}</p>
                </div>
              )}

              <div>
                <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Solution Description:</strong>
                <p className="leading-relaxed whitespace-pre-line">{viewAppModal.solution_description}</p>
              </div>

              {viewAppModal.problem_solving_approach && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Problem-Solving Approach:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.problem_solving_approach}</p>
                </div>
              )}

              {viewAppModal.technology && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Technology &amp; Technical Approach:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.technology}</p>
                </div>
              )}

              {viewAppModal.key_features && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Key Features:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.key_features}</p>
                </div>
              )}

              {viewAppModal.implementation_methodology && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Implementation Methodology:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.implementation_methodology}</p>
                </div>
              )}

              {viewAppModal.expected_impact && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Expected Impact:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.expected_impact}</p>
                </div>
              )}

              {viewAppModal.current_maturity && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Current Maturity:</strong>
                  <p className="leading-relaxed">{viewAppModal.current_maturity}</p>
                </div>
              )}

              {viewAppModal.existing_deployments && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Existing Deployments:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.existing_deployments}</p>
                </div>
              )}

              {viewAppModal.team_capabilities && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Team / Capabilities:</strong>
                  <p className="leading-relaxed whitespace-pre-line">{viewAppModal.team_capabilities}</p>
                </div>
              )}

              {viewAppModal.supporting_docs_url && (
                <div>
                  <strong className="block text-slate-900 mb-0.5 text-xs font-semibold">Supporting Documents:</strong>
                  <a
                    href={viewAppModal.supporting_docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline break-all"
                  >
                    {viewAppModal.supporting_docs_url}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <strong className="text-slate-500">Timeline:</strong> {viewAppModal.timeline || "—"}
                </div>
                <div>
                  <strong className="text-slate-500">Cost:</strong> {viewAppModal.estimated_cost || "—"}
                </div>
                <div>
                  <strong className="text-slate-500">Submitted:</strong> {formatDate(viewAppModal.created_at)}
                </div>
                <div>
                  <strong className="text-slate-500">Status:</strong> {viewAppModal.status}
                </div>
              </div>
            </div>

            {/* AI Analysis Section (startup view) */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> AI-Assisted Match Analysis
              </h4>
              <StartupAIMatchViewer appId={viewAppModal.id} />
            </div>

            <button
              onClick={() => setViewAppModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm mt-6"
            >
              Close
            </button>
            </div>
          </div>
      )}
    </DashboardLayout>
  );
}
