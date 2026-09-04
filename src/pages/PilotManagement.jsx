import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Loader2, AlertTriangle, Rocket, Send, Check, X,
  Calendar, IndianRupee, Users, List, Clipboard, MapPin,
  FileText, BrainCircuit, TrendingUp, Clock
} from "lucide-react";
import {
  formatCurrency, formatDate, pilotStatusLabel, pilotStatusColor,
  applicationStatusColor, createNotification
} from "../lib/utils";
import NegotiationWorkspace from "../components/NegotiationWorkspace";
import AIMatchPanel from "../components/AIMatchPanel";
import { analyzeApplication } from "../lib/matching";

const DEFAULT_PILOT_OFFERS = [
  {
    id: "demo-pilot-1",
    challenge_id: "demo-ch-1",
    government_id: "demo-govt-railways-001",
    startup_id: "demo-startup-apex-001",
    status: "Pilot Active",
    grant_allocated: "₹1.5 Cr",
    pilot_duration: "6 Months",
    location: "Northern Railway Zone (Delhi - Ambala Division)",
    scope: "Deploy vision AI camera arrays on 4 inspection locomotives for real-time track defect detection.",
    milestones: [
      { id: "m1", title: "Hardware Mount & Camera Calibration", status: "Completed", date: "2026-08-15" },
      { id: "m2", title: "Dataset Ingestion & Model Fine-Tuning", status: "In Progress", date: "2026-10-01" },
      { id: "m3", title: "Live Track Run & Alert Portal Verification", status: "Pending", date: "2026-11-15" },
    ],
    created_at: new Date().toISOString(),
    challenges: {
      title: "AI-Powered Predictive Maintenance for Track Infrastructure",
      department: "Ministry of Railways",
      sector: "Deep Tech",
      budget: "₹2.5 Cr"
    },
    applications: {
      solution_title: "RailVision AI Track Anomaly Detection System",
      solution_description: "Real-time edge computer vision model for identifying rail micro-fractures.",
      startup_name: "ApexVision AI Labs"
    },
    startup_profile: {
      full_name: "Vikram Patel",
      organization_name: "ApexVision AI Labs",
      sector: "Deep Tech",
      email: "vikram@apexvision.ai",
      website: "https://apexvision.ai",
      description: "Computer vision edge models for heavy transport infrastructure."
    }
  }
];

export default function PilotManagement() {
  const { pilotId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const isGovernment = profile?.role === "government";

  // Load list of pilot offers for the current user
  const loadOffers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Demo accounts use human-readable ids, not real uuids, so filtering
      // by government_id/startup_id would just 400 against a uuid column.
      if (user.id.startsWith("demo-")) {
        setOffers(DEFAULT_PILOT_OFFERS);
        return;
      }

      let query = supabase
        .from("pilot_offers")
        .select(`
          *,
          challenges!inner(title, department, sector, budget),
          applications:challenge_applications!left(solution_title, solution_description, startup_name),
          startup_profile:profiles!pilot_offers_startup_id_fkey(full_name, organization_name, sector, email, website, description)
        `);

      if (isGovernment) {
        query = query.eq("government_id", user.id);
      } else {
        query = query.eq("startup_id", user.id);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error: err } = await query;
      if (err) {
        console.warn("Pilot offers query notice:", err.message);
        setOffers(DEFAULT_PILOT_OFFERS);
      } else {
        setOffers((data && data.length > 0) ? data : DEFAULT_PILOT_OFFERS);
      }
    } catch (err) {
      console.warn("Load offers catch:", err);
      setOffers(DEFAULT_PILOT_OFFERS);
    } finally {
      setLoading(false);
    }
  }, [user, isGovernment]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadOffers();
  }, [user, navigate, loadOffers]);

  // Load single offer detail
  const loadOfferDetail = useCallback(async (offerId) => {
    if (!offerId || !user) return;
    setDetailLoading(true);
    try {
      // Demo pilot offers (e.g. "demo-pilot-1") aren't real uuids and were
      // never persisted — go straight to the matching demo record instead
      // of querying a uuid column with a non-uuid value.
      if (offerId.startsWith("demo-")) {
        const found = DEFAULT_PILOT_OFFERS.find((o) => o.id === offerId) || DEFAULT_PILOT_OFFERS[0];
        setSelectedOffer(found);
        return;
      }

      const { data, error: err } = await supabase
        .from("pilot_offers")
        .select(`
          *,
          challenges!inner(*),
          applications:challenge_applications!left(*),
          startup_profile:profiles!pilot_offers_startup_id_fkey(full_name, organization_name, sector, email, website, description, govt_level)
        `)
        .eq("id", offerId)
        .single();

      if (err || !data) {
        const found = DEFAULT_PILOT_OFFERS.find((o) => o.id === offerId) || DEFAULT_PILOT_OFFERS[0];
        setSelectedOffer(found);
      } else {
        setSelectedOffer(data);
      }
    } catch {
      const found = DEFAULT_PILOT_OFFERS.find((o) => o.id === offerId) || DEFAULT_PILOT_OFFERS[0];
      setSelectedOffer(found);
    } finally {
      setDetailLoading(false);
    }
  }, [user]);

  // If a pilotId is in the URL, load that offer's detail
  useEffect(() => {
    if (pilotId) {
      loadOfferDetail(pilotId);
    }
  }, [pilotId, loadOfferDetail]);

  const handleOfferUpdated = () => {
    loadOffers();
    if (selectedOffer) loadOfferDetail(selectedOffer.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Pilot Management...
        </span>
      </div>
    );
  }

  // Detail view
  if (selectedOffer || pilotId) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading offer details...</span>
        </div>
      );
    }

    if (!selectedOffer) {
      return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
          <p className="text-slate-500">{error || "Pilot offer not found"}</p>
          <Link to="/pilot-management" className="text-indigo-600 hover:underline mt-2 inline-block">
            ← Back to Pilot Overview
          </Link>
        </div>
      );
    }

    return <PilotDetailView offer={selectedOffer} currentUser={user} profile={profile} onUpdated={handleOfferUpdated} />;
  }

  // List view
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to={isGovernment ? "/government/dashboard" : "/startup/dashboard"}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {isGovernment ? "Pilot Offers — Management" : "Pilot Opportunities"}
          </h1>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {!isGovernment && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["All", "proposed", "negotiating", "accepted", "in_progress", "completed", "declined", "cancelled"]
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => {}}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 whitespace-nowrap"
                  >
                    {s === "All" ? "All" : pilotStatusLabel(s)}
                  </button>
                ))}
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 text-base mb-1">
              {isGovernment ? "No pilot offers created yet" : "No pilot opportunities yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isGovernment
                ? "Create pilot offers from the government dashboard when reviewing applications."
                : "Your pilot opportunities will appear here once a department selects your solution."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <PilotOfferCard
                key={offer.id}
                offer={offer}
                isGovernment={isGovernment}
                onClick={() => {
                  setSelectedOffer(offer);
                  if (pilotId) navigate("/pilot-management");
                  else navigate(`/pilot-management/${offer.id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PilotOfferCard({ offer, isGovernment, onClick }) {
  const party = isGovernment ? "startup_profile" : "challenges";
  const partyData = offer[party];

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isGovernment ? "To Startup" : "From Department"}
        </span>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pilotStatusColor(offer.status)}`}>
          ● {pilotStatusLabel(offer.status)}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          {isGovernment ? (
            <Rocket className="w-5 h-5 text-amber-600" />
          ) : (
            <FileText className="w-5 h-5 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
            {offer.applications?.solution_title || "Pilot Offer"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {offer.challenges?.title || "Challenge"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
        <div className="flex items-center gap-1.5">
          <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
          {formatCurrency(offer.proposed_budget) || "—"}
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {offer.duration ? `${offer.duration} days` : "—"}
        </div>
      </div>

      <div className="text-xs text-slate-500 line-clamp-2 mb-3">
        {offer.objective || "No objective specified"}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          {isGovernment ? partyData?.organization_name : partyData?.department}
        </span>
        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          View →
        </span>
      </div>
    </div>
  );
}

function PilotDetailView({ offer, currentUser, profile, onUpdated }) {
  const navigate = useNavigate();

  const isGovernment = profile?.role === "government";
  const challenge = offer.challenges;
  const application = offer.applications;

  const handleStatusUpdate = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("pilot_offers")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", offer.id);
      if (error) throw error;
      onUpdated();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const [offerData, setOfferData] = useState(offer);
  useEffect(() => {
    setOfferData(offer);
  }, [offer]);

  const handleOfferUpdated = () => {
    setOfferData({ ...offer });
    onUpdated();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              navigate("/pilot-management");
              onUpdated();
            }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Pilot Overview
          </button>
        </div>

        {/* Offer header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isGovernment ? "Outgoing Pilot Offer" : "Pilot Opportunity"}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${pilotStatusColor(offerData.status)}`}>
              ● {pilotStatusLabel(offerData.status)}
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {offerData.objective}
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Budget</span>
              <strong className="text-slate-800">{formatCurrency(offerData.proposed_budget) || "—"}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Duration</span>
              <strong className="text-slate-800">{offerData.duration ? `${offerData.duration} days` : "—"}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Start Date</span>
              <strong className="text-slate-800">{formatDate(offerData.start_date) || "To be decided"}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Location</span>
              <strong className="text-slate-800">{offerData.location || "—"}</strong>
            </div>
          </div>

          {offerData.deliverables && (
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Deliverables</span>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {offerData.deliverables}
              </p>
            </div>
          )}

          {offerData.success_criteria && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Success Criteria</span>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {offerData.success_criteria}
              </p>
            </div>
          )}

          {offerData.special_conditions && (
            <div className="mt-3">
              <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Special Conditions</span>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {offerData.special_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Challenge & Application Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Challenge & Solution</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Challenge:</span>
              <span className="text-slate-800 ml-2">{challenge?.title}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Application:</span>
              <span className="text-slate-800 ml-2">{application?.solution_title}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Startup:</span>
              <span className="text-slate-800 ml-2">{application?.startup_name}</span>
            </div>
          </div>
        </div>

        {/* AI Analysis (government view) */}
        {isGovernment && application && challenge && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              AI Match Analysis
            </h3>
            <AIAnalysisForPilot application={application} challenge={challenge} offer={offerData} />
          </div>
        )}

        {/* Negotiation Workspace */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-slate-600" />
            Negotiation Workspace
          </h3>
          <NegotiationWorkspace
            pilotOffer={offerData}
            currentUser={{ id: currentUser?.id, role: profile?.role }}
            onUpdated={handleOfferUpdated}
          />
        </div>

        {/* Milestone Tracker (accepted / in_progress) */}
        {(offerData.status === "accepted" || offerData.status === "in_progress") && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <List className="w-4 h-4 text-slate-600" />
              Milestones
            </h3>
            <MilestoneTracker pilotOfferId={offerData.id} isGovernment={isGovernment} />
          </div>
        )}

        {/* Pilot Results / Evaluation */}
        {(offerData.status === "in_progress" || offerData.status === "completed") && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Pilot Results &amp; Evaluation</h3>
            <PilotResultsView offerId={offerData.id} isGovernment={isGovernment} onUpdated={onUpdated} />
          </div>
        )}

        {/* Mark complete (government only, when in_progress) */}
        {offerData.status === "in_progress" && isGovernment && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Complete Pilot</h3>
            <button
              onClick={() => handleStatusUpdate("completed")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Mark Pilot as Completed
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Submit pilot results and evaluation above before or after marking complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// AI Analysis component for pilot detail (government only)
function AIAnalysisForPilot({ application, challenge, offer }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const { data: cached } = await supabase
          .from("ai_match_scores")
          .select("*")
          .eq("application_id", application.id)
          .maybeSingle();

        if (cached && !cancelled) {
          setMatchData(cached);
        } else if (!cancelled) {
          // Compute on the fly
          const startupProfile = await supabase
            .from("profiles")
            .select("*")
            .eq("id", application.startup_id)
            .maybeSingle();

          const result = await analyzeApplication(
            challenge,
            application,
            startupProfile.data
          );
          setMatchData({
            overall_score: result.overallScore,
            problem_fit: result.scores.problemFit,
            technical_fit: result.scores.technicalFit,
            impact_score: result.scores.impact,
            feasibility_score: result.scores.feasibility,
            timeline_score: result.scores.timeline,
            budget_fit: result.scores.budgetFit,
            capability_score: result.scores.capability,
            analysis_text: result.analysisText,
            concerns_text: result.concernsText,
            scorer_version: result.scorerVersion,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [application, challenge]);

  if (loading) {
    return (
      <div className="text-center py-6 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto mb-2" />
        <span className="text-xs">Loading AI analysis...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  return matchData ? <AIMatchPanel matchData={matchData} /> : <p className="text-xs text-slate-400">No analysis available.</p>;
}

// Milestone Management
const MILESTONE_STATUS_COLOR = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

const PAYMENT_STATUS_LABEL = {
  not_due: "Not Due", pending: "Pending", approved: "Approved", released: "Released",
};

function MilestoneTracker({ pilotOfferId, isGovernment }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: "", description: "", due_date: "", deliverable: "", kpi: "", payment_amount: "",
  });
  const [submitResults, setSubmitResults] = useState({}); // { [milestoneId]: text }
  const [busyId, setBusyId] = useState(null);

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pilot_milestones")
      .select("*")
      .eq("pilot_offer_id", pilotOfferId)
      .order("due_date", { ascending: true, nullsFirst: false });
    setMilestones(data || []);
    setLoading(false);
  }, [pilotOfferId]);

  useEffect(() => { loadMilestones(); }, [loadMilestones]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title) return;
    setBusyId("new");
    try {
      const { error } = await supabase.from("pilot_milestones").insert({
        pilot_offer_id: pilotOfferId,
        title: newMilestone.title,
        description: newMilestone.description || null,
        due_date: newMilestone.due_date || null,
        deliverable: newMilestone.deliverable || null,
        kpi: newMilestone.kpi || null,
        payment_amount: newMilestone.payment_amount ? Number(newMilestone.payment_amount) : null,
      });
      if (!error) {
        setNewMilestone({ title: "", description: "", due_date: "", deliverable: "", kpi: "", payment_amount: "" });
        setShowAddForm(false);
        await loadMilestones();
      }
    } finally {
      setBusyId(null);
    }
  };

  const submitMilestoneResult = async (id) => {
    setBusyId(id);
    try {
      await supabase.from("pilot_milestones").update({
        submitted_result: submitResults[id] || "",
        status: "submitted",
      }).eq("id", id);
      await loadMilestones();
    } finally {
      setBusyId(null);
    }
  };

  const updateMilestoneStatus = async (id, status) => {
    setBusyId(id);
    try {
      await supabase.from("pilot_milestones").update({ status }).eq("id", id);
      await loadMilestones();
    } finally {
      setBusyId(null);
    }
  };

  const updatePaymentStatus = async (id, payment_status) => {
    setBusyId(id);
    try {
      await supabase.from("pilot_milestones").update({ payment_status }).eq("id", id);
      await loadMilestones();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;

  return (
    <div className="space-y-4">
      {milestones.length === 0 && (
        <p className="text-xs text-slate-400">No milestones defined yet.</p>
      )}

      {milestones.map((m) => (
        <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <strong className="text-sm text-slate-900">{m.title}</strong>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${MILESTONE_STATUS_COLOR[m.status]}`}>
                {m.status.replace("_", " ")}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {PAYMENT_STATUS_LABEL[m.payment_status]}
              </span>
            </div>
          </div>
          {m.description && <p className="text-xs text-slate-600 mb-1.5">{m.description}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 mb-2">
            {m.due_date && <span>Due: {formatDate(m.due_date)}</span>}
            {m.deliverable && <span>Deliverable: {m.deliverable}</span>}
            {m.kpi && <span>KPI: {m.kpi}</span>}
            {m.payment_amount != null && <span>Payment: {formatCurrency(m.payment_amount)}</span>}
          </div>

          {m.submitted_result && (
            <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1">Submitted Result</span>
              {m.submitted_result}
            </div>
          )}

          {/* Startup: submit result when pending */}
          {!isGovernment && m.status === "pending" && (
            <div className="mt-2 space-y-2">
              <textarea
                value={submitResults[m.id] || ""}
                onChange={(e) => setSubmitResults((prev) => ({ ...prev, [m.id]: e.target.value }))}
                placeholder="Describe what was achieved for this milestone..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none resize-none"
              />
              <button
                onClick={() => submitMilestoneResult(m.id)}
                disabled={busyId === m.id || !submitResults[m.id]}
                className="px-3 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {busyId === m.id ? "Submitting..." : "Submit Result"}
              </button>
            </div>
          )}

          {/* Government: approve/reject when submitted or under review, set payment */}
          {isGovernment && (m.status === "submitted" || m.status === "under_review") && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button onClick={() => updateMilestoneStatus(m.id, "approved")} disabled={busyId === m.id}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                Approve
              </button>
              <button onClick={() => updateMilestoneStatus(m.id, "under_review")} disabled={busyId === m.id || m.status === "under_review"}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg disabled:opacity-50">
                Mark Under Review
              </button>
              <button onClick={() => updateMilestoneStatus(m.id, "rejected")} disabled={busyId === m.id}
                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold rounded-lg disabled:opacity-50">
                Reject
              </button>
            </div>
          )}

          {isGovernment && m.status === "approved" && m.payment_status !== "released" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Payment:</span>
              {["pending", "approved", "released"].map((ps) => (
                <button key={ps} onClick={() => updatePaymentStatus(m.id, ps)} disabled={busyId === m.id || m.payment_status === ps}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                    m.payment_status === ps ? "bg-[#0B192C] text-white border-[#0B192C]" : "border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}>
                  {PAYMENT_STATUS_LABEL[ps]}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {isGovernment && (
        showAddForm ? (
          <form onSubmit={handleAddMilestone} className="p-4 rounded-xl border border-dashed border-slate-300 space-y-2">
            <input value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              placeholder="Milestone title" required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none" />
            <textarea value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              placeholder="Description" rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={newMilestone.due_date} onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none" />
              <input type="number" value={newMilestone.payment_amount} onChange={(e) => setNewMilestone({ ...newMilestone, payment_amount: e.target.value })}
                placeholder="Payment amount (₹)"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none" />
              <input value={newMilestone.deliverable} onChange={(e) => setNewMilestone({ ...newMilestone, deliverable: e.target.value })}
                placeholder="Deliverable"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none" />
              <input value={newMilestone.kpi} onChange={(e) => setNewMilestone({ ...newMilestone, kpi: e.target.value })}
                placeholder="KPI"
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={busyId === "new"}
                className="px-4 py-1.5 bg-[#0B192C] text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                {busyId === "new" ? "Adding..." : "Add Milestone"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-500">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50">
            + Add Milestone
          </button>
        )
      )}
    </div>
  );
}

// Pilot Results & Evaluation — two-sided submission (see pin_pilot_result_content
// in schema.sql): the startup can only ever populate outcome/success_metrics/
// startup_feedback/kpi_actual, government can only populate government_feedback/
// kpi_target/final_recommendation/validation fields/scale_up_pathway. Whoever
// writes second must UPSERT since the row is unique per pilot_offer_id.
const SCALE_UP_PATHWAYS = {
  within_department: "Scale Within Department",
  other_districts: "Scale to Other Districts",
  procurement: "Further Procurement Process",
  marketplace: "Government Marketplace / Procurement Route",
  further_pilot: "Further Pilot",
};

function PilotResultsView({ offerId, isGovernment, onUpdated }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [startupForm, setStartupForm] = useState({ outcome: "", success_metrics: "", kpi_actual: "" });
  const [govForm, setGovForm] = useState({
    government_feedback: "", kpi_target: "", final_recommendation: "scale", scale_up_pathway: "within_department",
    validator_name: "", validation_summary: "", validation_status: "not_applicable",
  });

  const loadResult = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pilot_results")
      .select("*")
      .eq("pilot_offer_id", offerId)
      .maybeSingle();
    setResult(data);
    if (data) {
      setStartupForm({
        outcome: data.outcome || "", success_metrics: data.success_metrics || "", kpi_actual: data.kpi_actual || "",
      });
      setGovForm({
        government_feedback: data.government_feedback || "",
        kpi_target: data.kpi_target || "",
        final_recommendation: data.final_recommendation || "scale",
        scale_up_pathway: data.scale_up_pathway || "within_department",
        validator_name: data.validator_name || "",
        validation_summary: data.validation_summary || "",
        validation_status: data.validation_status || "not_applicable",
      });
    }
    setLoading(false);
  }, [offerId]);

  useEffect(() => { loadResult(); }, [loadResult]);

  const upsert = async (payload) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pilot_results")
        .upsert({ pilot_offer_id: offerId, ...payload }, { onConflict: "pilot_offer_id" });
      if (!error) {
        await loadResult();
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;

  return (
    <div className="space-y-6">
      {/* Startup submission */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Startup: Final Results</h4>
        {!isGovernment ? (
          <div className="space-y-2">
            <textarea value={startupForm.outcome} onChange={(e) => setStartupForm({ ...startupForm, outcome: e.target.value })}
              placeholder="Outcome / implementation summary" rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none" />
            <textarea value={startupForm.success_metrics} onChange={(e) => setStartupForm({ ...startupForm, success_metrics: e.target.value })}
              placeholder="Success metrics / evidence" rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none" />
            <input value={startupForm.kpi_actual} onChange={(e) => setStartupForm({ ...startupForm, kpi_actual: e.target.value })}
              placeholder="Actual KPI result (e.g. 37% reduction)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none" />
            <button onClick={() => upsert(startupForm)} disabled={saving}
              className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-xl disabled:opacity-50">
              {saving ? "Saving..." : "Submit Final Results"}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-700 space-y-1.5">
            <p><strong className="text-xs text-slate-500 uppercase">Outcome:</strong> {result?.outcome || "Not submitted yet"}</p>
            <p><strong className="text-xs text-slate-500 uppercase">Success Metrics:</strong> {result?.success_metrics || "—"}</p>
            <p><strong className="text-xs text-slate-500 uppercase">Actual KPI:</strong> {result?.kpi_actual || "—"}</p>
          </div>
        )}
      </div>

      {/* Government evaluation */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Government: Evaluation &amp; Decision</h4>
        {isGovernment ? (
          <div className="space-y-2">
            <input value={govForm.kpi_target} onChange={(e) => setGovForm({ ...govForm, kpi_target: e.target.value })}
              placeholder="KPI target (e.g. 30% reduction in processing time)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none" />
            <textarea value={govForm.government_feedback} onChange={(e) => setGovForm({ ...govForm, government_feedback: e.target.value })}
              placeholder="Government feedback" rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none" />

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Independent Validation (optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={govForm.validator_name} onChange={(e) => setGovForm({ ...govForm, validator_name: e.target.value })}
                  placeholder="Validator name / organization"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none" />
                <select value={govForm.validation_status} onChange={(e) => setGovForm({ ...govForm, validation_status: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none">
                  <option value="not_applicable">Not Applicable</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              <textarea value={govForm.validation_summary} onChange={(e) => setGovForm({ ...govForm, validation_summary: e.target.value })}
                placeholder="Validation summary" rows={2}
                className="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none" />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Decision</label>
              <div className="flex gap-2 mb-2">
                {["scale", "extend_pilot", "close"].map((rec) => (
                  <button key={rec} type="button" onClick={() => setGovForm({ ...govForm, final_recommendation: rec })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                      govForm.final_recommendation === rec ? "bg-[#0B192C] text-white border-[#0B192C]" : "border-slate-200 text-slate-600"
                    }`}>
                    {rec === "scale" ? "Scale" : rec === "extend_pilot" ? "Extend Pilot" : "Close"}
                  </button>
                ))}
              </div>
              {govForm.final_recommendation === "scale" && (
                <select value={govForm.scale_up_pathway} onChange={(e) => setGovForm({ ...govForm, scale_up_pathway: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none">
                  {Object.entries(SCALE_UP_PATHWAYS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              )}
            </div>

            <button onClick={() => upsert(govForm)} disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50">
              {saving ? "Saving..." : "Save Evaluation & Decision"}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-700 space-y-1.5">
            <p><strong className="text-xs text-slate-500 uppercase">Feedback:</strong> {result?.government_feedback || "Pending government review"}</p>
            {result?.final_recommendation && (
              <p><strong className="text-xs text-slate-500 uppercase">Decision:</strong>{" "}
                {result.final_recommendation === "scale" ? `Scale — ${SCALE_UP_PATHWAYS[result.scale_up_pathway] || ""}` :
                 result.final_recommendation === "extend_pilot" ? "Extend Pilot" : "Close"}
              </p>
            )}
            {result?.validation_status && result.validation_status !== "not_applicable" && (
              <p><strong className="text-xs text-slate-500 uppercase">Independent Validation:</strong> {result.validator_name} ({result.validation_status})</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}