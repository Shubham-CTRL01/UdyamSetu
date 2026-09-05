import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import NotificationsList from "../components/NotificationsList";
import { useNotifications, useNotificationPolling } from "../context/NotificationsContext";
import {
  Rocket, Search, Filter, Clock, CheckCircle2,
  ArrowRight, Eye, Send, Landmark, Loader2, X,
  BrainCircuit, Target, IndianRupee, Calendar,
  LayoutDashboard, FileText, Bell
} from "lucide-react";
import { pilotStatusColor, pilotStatusLabel, formatCurrency, formatDate } from "../lib/utils";
import StartupAIMatchViewer from "../components/StartupAIMatchViewer";
import { DEFAULT_APPLICATIONS } from "../lib/demoData";
import { DEFAULT_PILOT_OFFERS } from "./PilotManagement";
import { tempDb, subscribeTempDb } from "../lib/tempDb";

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
  const { unreadCount } = useNotifications();
  useNotificationPolling(user?.id);

  const location = useLocation();
  const [activeSection, setActiveSection] = useState(
    location.state?.section || "dashboard"
  );

  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state]);
  const [challenges, setChallenges] = useState([]);

  const [applications, setApplications] = useState([]);
  const [pilotOffers, setPilotOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");

  // Modals
  const [viewAppModal, setViewAppModal] = useState(null);

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
      setChallenges((challengesData && challengesData.length > 0) ? challengesData : tempDb.getChallenges());

      // In demo mode, load directly from shared persistent Temp Database
      if (user.id.startsWith("demo-")) {
        setChallenges(tempDb.getChallenges());
        setApplications(tempDb.getApplicationsByStartup(user.id));
        setPilotOffers(tempDb.getPilotOffers());
        setLoading(false);
        return;
      }

      // 2. Fetch Startup's Applications
      const { data: appsData, error: aErr } = await supabase
        .from("challenge_applications")
        .select("*, challenges(title, department, sector, budget)")
        .eq("startup_id", user.id)
        .order("created_at", { ascending: false });

      if (aErr) console.warn("Applications error:", aErr.message);

      // 3. Fetch pilot offers for this startup
      const { data: pilotData, error: pErr } = await supabase
        .from("pilot_offers")
        .select("*, challenges!inner(title, department)")
        .eq("startup_id", user.id)
        .order("created_at", { ascending: false });

      if (pErr) console.warn("Pilot offers error:", pErr.message);

      setApplications(appsData || []);
      setPilotOffers(pilotData || []);
    } catch (err) {
      console.warn("Load data error:", err);
      setChallenges(tempDb.getChallenges());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to Temp Database updates across personas
  useEffect(() => {
    if (user?.id?.startsWith("demo-")) {
      const unsub = subscribeTempDb(() => {
        setChallenges(tempDb.getChallenges());
        setApplications(tempDb.getApplicationsByStartup(user.id));
        setPilotOffers(tempDb.getPilotOffers());
      });
      return unsub;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

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
    { id: "dashboard",      label: "Dashboard",             icon: LayoutDashboard, badge: undefined },
    { id: "challenges",     label: "Available Challenges",   icon: FileText,         badge: availableCount || undefined },
    { id: "applications",   label: "My Applications",        icon: Send,             badge: appliedCount || undefined },
    { id: "pilots",         label: "Pilot Offers",           icon: Target,           badge: pilotOffers.length || undefined },
    { id: "notifications",  label: "Notifications",          icon: Bell,             badge: unreadCount || undefined },
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
                          <button onClick={() => navigate(`/challenges/${c.id}`)} className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700">View Details</button>
                          {applied ? (
                            <span className="flex-1 py-2 text-xs font-bold text-center bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Applied</span>
                          ) : (
                            <button onClick={() => navigate(`/challenges/${c.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white">Apply <ArrowRight className="w-3.5 h-3.5" /></button>
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

        {/* ===== PILOT OFFERS SECTION ===== */}
        {activeSection === "pilots" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Pilot Offers</h2>
              <p className="text-sm text-slate-500 mt-1">
                Active pilot offers from government departments. Click a card to view details, accept offers, and track milestones.
              </p>
            </div>

            {pilotOffers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center gap-3">
                <Target className="w-10 h-10 text-slate-300" />
                <h3 className="font-semibold text-slate-800">No Pilot Offers Yet</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Pilot offers appear here when a government department selects your solution for a pilot deployment.
                  Keep submitting strong proposals to improve your chances.
                </p>
                <button
                  onClick={() => setActiveSection("challenges")}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-semibold"
                >
                  Browse Challenges <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pilotOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1 flex-1">
                          {offer.challenges?.department || "Government Department"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${pilotStatusColor(offer.status)}`}>
                          ● {pilotStatusLabel(offer.status)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {offer.objective || "Pilot Offer"}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                        For: <strong className="text-slate-700">{offer.challenges?.title || "—"}</strong>
                      </p>

                      {/* Key metrics */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Budget</span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3" />{formatCurrency(offer.proposed_budget) || "—"}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Duration</span>
                          <span className="text-xs font-bold text-slate-800">
                            {offer.duration ? `${offer.duration} days` : "—"}
                          </span>
                        </div>
                        {offer.start_date && (
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 col-span-2">
                            <span className="text-[10px] text-slate-400 block">Start Date</span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{formatDate(offer.start_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => navigate(`/pilot-management/${offer.id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white transition-all"
                      >
                        View Full Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== NOTIFICATIONS SECTION ===== */}
        {activeSection === "notifications" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Notifications</h2>
              <p className="text-sm text-slate-500 mt-1">Updates on your applications and pilot offers.</p>
            </div>
            <NotificationsList />
          </div>
        )}

      </div>

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
