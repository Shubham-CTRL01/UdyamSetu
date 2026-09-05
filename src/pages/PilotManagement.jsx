import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Loader2, AlertTriangle, Rocket, Send, Check, X,
  Calendar, IndianRupee, Users, List, Clipboard, MapPin,
  FileText, BrainCircuit, TrendingUp, Clock, Save, Database,
  CheckCircle2
} from "lucide-react";
import {
  formatCurrency, formatDate, pilotStatusLabel, pilotStatusColor,
  applicationStatusColor, createNotification
} from "../lib/utils";
import AIMatchPanel from "../components/AIMatchPanel";
import { analyzeApplication } from "../lib/matching";
import { DEFAULT_PILOT_RESULT_1 } from "../lib/demoData";
import { tempDb, subscribeTempDb } from "../lib/tempDb";

export const DEFAULT_PILOT_OFFERS = [
  {
    id: "demo-pilot-1",
    challenge_id: "demo-ch-1",
    government_id: "demo-govt-railways-001",
    startup_id: "demo-startup-apex-001",
    status: "in_progress",
    grant_allocated: "₹1.50 Cr",
    proposed_budget: 15000000,
    pilot_duration: "6 Months",
    duration: 180,
    start_date: "2026-08-01",
    location: "Northern Railway Zone (Delhi - Ambala Division)",
    objective: "Deploy vision AI camera arrays on 4 inspection locomotives for real-time track defect detection.",
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
  },
  {
    id: "demo-pilot-2",
    challenge_id: "demo-ch-2",
    government_id: "demo-govt-defence-002",
    startup_id: "demo-startup-garuda-002",
    status: "accepted",
    grant_allocated: "₹85 Lakh",
    proposed_budget: 8500000,
    pilot_duration: "3 Months",
    duration: 90,
    start_date: "2026-09-01",
    location: "Forward Operations Logistics Hub, Western Sector",
    objective: "Autonomous perimeter surveillance and drone swarm threat detection under extreme weather conditions.",
    scope: "Autonomous perimeter surveillance and drone swarm threat detection under extreme weather conditions.",
    milestones: [
      { id: "m1", title: "Sensor Node Deployment & Mesh Networking", status: "Completed", date: "2026-09-10" },
      { id: "m2", title: "Autonomous Patrol Simulation & Alert Triangulation", status: "In Progress", date: "2026-10-15" },
      { id: "m3", title: "Field Command Integration & Trial Sign-Off", status: "Pending", date: "2026-11-30" },
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    challenges: {
      title: "Autonomous Surveillance for Strategic Perimeter Defence",
      department: "Ministry of Defence",
      sector: "Defence & Aerospace",
      budget: "₹1.2 Cr"
    },
    applications: {
      solution_title: "GarudaNet Autonomous Edge Surveillance Grid",
      solution_description: "Solar-powered thermal and optical sensor network with satellite telemetry.",
      startup_name: "Garuda Aerotech"
    },
    startup_profile: {
      full_name: "Col. Raghavendra Joshi (Retd.)",
      organization_name: "Garuda Aerotech",
      sector: "Defence & Aerospace",
      email: "contact@garudaaerotech.in",
      website: "https://garudaaerotech.in",
      description: "Tactical defense electronics and autonomous surveillance solutions."
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
      // Demo accounts use tempDb so changes persist across account switches
      if (user.id.startsWith("demo-")) {
        const demoOffers = tempDb.getPilotOffers();
        setOffers(demoOffers);
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
        setOffers(tempDb.getPilotOffers());
      } else {
        setOffers((data && data.length > 0) ? data : tempDb.getPilotOffers());
      }
    } catch (err) {
      console.warn("Load offers catch:", err);
      setOffers(tempDb.getPilotOffers());
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

    const unsubscribe = subscribeTempDb(() => {
      loadOffers();
      if (pilotId) {
        loadOfferDetail(pilotId);
      }
    });

    return () => unsubscribe();
  }, [user, navigate, loadOffers, pilotId, loadOfferDetail]);

  // Load single offer detail
  const loadOfferDetail = useCallback(async (offerId) => {
    if (!offerId || !user) return;
    setDetailLoading(true);
    try {
      if (offerId.startsWith("demo-")) {
        const found = tempDb.getPilotOfferById(offerId) || DEFAULT_PILOT_OFFERS.find((o) => o.id === offerId) || DEFAULT_PILOT_OFFERS[0];
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
          <button
            onClick={() => isGovernment ? navigate("/pilot-management") : navigate("/startup/dashboard", { state: { section: "pilots" } })}
            className="text-indigo-600 hover:underline mt-2 inline-block text-sm"
          >
            ← Back to Pilot Overview
          </button>
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
  const location = useLocation();

  const isGovernment = profile?.role === "government";
  const challenge = offer.challenges;
  const application = offer.applications;

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  const [offerData, setOfferData] = useState(offer);
  useEffect(() => {
    setOfferData(offer);
  }, [offer]);

  useEffect(() => {
    if (location.state?.scrollToResults) {
      setTimeout(() => {
        const el = document.getElementById("pilot-results-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
    }
  }, [location.state]);

  const handleStatusUpdate = async (newStatus) => {
    setStatusUpdating(true);
    setStatusNotice(null);

    // Optimistic UI state update
    setOfferData((prev) => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
    try {
      localStorage.setItem(`udyam_pilot_status_${offer.id}`, newStatus);
    } catch (e) {
      console.warn("Could not cache pilot status locally:", e);
    }

    try {
      if (String(offer.id).startsWith("demo-")) {
        tempDb.updatePilotOffer(offer.id, { status: newStatus });
      } else {
        const { error } = await supabase
          .from("pilot_offers")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", offer.id);
        if (error) throw error;
      }

      setStatusNotice({
        type: "success",
        message: newStatus === "completed"
          ? "Pilot successfully marked as Completed!"
          : newStatus === "cancelled"
          ? "Pilot deployment has been cancelled."
          : `Pilot status updated to ${pilotStatusLabel(newStatus)}.`
      });

      // Send notification to counterpart
      const recipientId = isGovernment ? offer.startup_id : offer.government_id;
      if (recipientId && !String(recipientId).startsWith("demo-")) {
        createNotification(
          recipientId,
          newStatus === "completed"
            ? `Pilot deployment for "${offer.challenges?.title || "challenge"}" has been marked as Completed.`
            : `Pilot status updated to ${pilotStatusLabel(newStatus)}.`,
          newStatus === "completed" ? "pilot_completed" : "pilot_status_update",
          offer.id,
          "pilot_offer"
        );
      }

      onUpdated?.();
    } catch (err) {
      console.error("Status update error:", err);
      setStatusNotice({
        type: "error",
        message: `Status update notice: ${err.message || "Failed to update in database"}. (Local preview updated)`
      });
    } finally {
      setStatusUpdating(false);
    }
  };

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
              if (isGovernment) {
                navigate("/pilot-management");
              } else {
                navigate("/startup/dashboard", { state: { section: "pilots" } });
              }
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

        {/* Pilot Offer Response / Actions (when proposed) */}
        {offerData.status === "proposed" && !isGovernment && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Pilot Offer Decision</h3>
            <p className="text-xs text-slate-500 mb-4">
              Review the pilot terms proposed above. Accept the offer to proceed with milestone setup and deployment, or decline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleStatusUpdate("accepted")}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <Check className="w-4 h-4" /> Accept Offer
              </button>
              <button
                onClick={() => handleStatusUpdate("declined")}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <X className="w-4 h-4" /> Decline Offer
              </button>
            </div>
          </div>
        )}

        {offerData.status === "proposed" && isGovernment && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm bg-amber-50/40">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              Awaiting Startup Decision
            </div>
            <p className="text-xs text-slate-600">
              This pilot offer has been sent to {application?.startup_name || "the startup"} and is awaiting their response.
            </p>
          </div>
        )}

        {/* When offer accepted */}
        {offerData.status === "accepted" && isGovernment && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Offer Accepted by Startup</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {application?.startup_name || "The startup"} has accepted this pilot offer. Set up milestones below and start deployment.
                </p>
              </div>
              <button
                onClick={() => handleStatusUpdate("in_progress")}
                className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
              >
                <Rocket className="w-4 h-4" /> Start Pilot (In Progress)
              </button>
            </div>
          </div>
        )}

        {offerData.status === "accepted" && !isGovernment && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm bg-emerald-50/40">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
              <Check className="w-4 h-4 text-emerald-600" />
              Offer Accepted
            </div>
            <p className="text-xs text-slate-600">
              You have accepted this pilot offer. Track milestones below as the government department initiates deployment.
            </p>
          </div>
        )}

        {/* Status notice: Declined */}
        {offerData.status === "declined" && (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm bg-rose-50/40">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
              <X className="w-4 h-4 text-rose-600" />
              Pilot Offer Declined
            </div>
            <p className="text-xs text-slate-600">
              This pilot offer was declined.
            </p>
          </div>
        )}

        {/* Status notice: Cancelled */}
        {offerData.status === "cancelled" && (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm bg-rose-50/40">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
              <X className="w-4 h-4 text-rose-600" />
              Pilot Deployment Cancelled
            </div>
            <p className="text-xs text-slate-600">
              This pilot deployment has been cancelled.
            </p>
          </div>
        )}

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
          <div id="pilot-results-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm scroll-mt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Pilot Results &amp; Evaluation</h3>
            <PilotResultsView offer={offerData} offerId={offerData.id} isGovernment={isGovernment} onUpdated={onUpdated} />
          </div>
        )}

        {/* Pilot Controls (government only, when in_progress) */}
        {offerData.status === "in_progress" && isGovernment && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Complete Pilot</h3>

            {statusNotice && (
              <div className={`mb-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusNotice.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                {statusNotice.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusNotice.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleStatusUpdate("completed")}
                disabled={statusUpdating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {statusUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Pilot...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Mark Pilot as Completed</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this pilot deployment?")) {
                    handleStatusUpdate("cancelled");
                  }
                }}
                disabled={statusUpdating}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancel Pilot
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Submit pilot results and evaluation above before or after marking complete.
            </p>
          </div>
        )}

        {/* Status card: Completed */}
        {offerData.status === "completed" && (
          <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-950">Pilot Deployment Completed</h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ● Completed
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  This pilot has reached successful completion. Final results and evaluation decisions recorded above are archived for departmental procurement and scaling.
                </p>
              </div>
            </div>
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
    try {
      if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
        const ms = tempDb.getMilestones(pilotOfferId);
        setMilestones(ms);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("pilot_milestones")
        .select("*")
        .eq("pilot_offer_id", pilotOfferId)
        .order("due_date", { ascending: true, nullsFirst: false });
      setMilestones(data || []);
    } catch (err) {
      console.warn("Milestones load err:", err);
    } finally {
      setLoading(false);
    }
  }, [pilotOfferId]);

  useEffect(() => {
    loadMilestones();
    const unsub = subscribeTempDb(() => {
      if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
        setMilestones(tempDb.getMilestones(pilotOfferId));
      }
    });
    return unsub;
  }, [loadMilestones, pilotOfferId]);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.title) return;
    setBusyId("new");

    if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
      tempDb.insertMilestone({
        pilot_offer_id: pilotOfferId,
        title: newMilestone.title,
        description: newMilestone.description || null,
        due_date: newMilestone.due_date || null,
        deliverable: newMilestone.deliverable || null,
        kpi: newMilestone.kpi || null,
        payment_amount: newMilestone.payment_amount ? Number(newMilestone.payment_amount) : 0,
        payment_status: "not_due",
        status: "pending"
      });
      setMilestones(tempDb.getMilestones(pilotOfferId));
      setNewMilestone({ title: "", description: "", due_date: "", deliverable: "", kpi: "", payment_amount: "" });
      setShowAddForm(false);
      setBusyId(null);
      return;
    }

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

    if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
      tempDb.updateMilestone(pilotOfferId, id, {
        submitted_result: submitResults[id] || "",
        status: "submitted"
      });
      setMilestones(tempDb.getMilestones(pilotOfferId));
      setBusyId(null);
      return;
    }

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

    if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
      tempDb.updateMilestone(pilotOfferId, id, { status });
      setMilestones(tempDb.getMilestones(pilotOfferId));
      setBusyId(null);
      return;
    }

    try {
      await supabase.from("pilot_milestones").update({ status }).eq("id", id);
      await loadMilestones();
    } finally {
      setBusyId(null);
    }
  };

  const updatePaymentStatus = async (id, payment_status) => {
    setBusyId(id);

    if (pilotOfferId && String(pilotOfferId).startsWith("demo-")) {
      tempDb.updateMilestone(pilotOfferId, id, { payment_status });
      setMilestones(tempDb.getMilestones(pilotOfferId));
      setBusyId(null);
      return;
    }

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

function PilotResultsView({ offer, offerId, isGovernment, onUpdated }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [dbStatus, setDbStatus] = useState("checking"); // 'checking' | 'connected' | 'not_found' | 'error'
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [startupForm, setStartupForm] = useState({ outcome: "", success_metrics: "", kpi_actual: "" });
  const [govForm, setGovForm] = useState({
    government_feedback: "", kpi_target: "", final_recommendation: "scale", scale_up_pathway: "within_department",
    validator_name: "", validation_summary: "", validation_status: "not_applicable",
  });

  const loadResult = useCallback(async () => {
    setLoading(true);

    // 1. Check localStorage for instantaneous local state
    let cached = null;
    try {
      const stored = localStorage.getItem(`udyam_pilot_result_${offerId}`);
      if (stored) {
        cached = JSON.parse(stored);
        setResult(cached);
        setStartupForm({
          outcome: cached.outcome || "",
          success_metrics: cached.success_metrics || "",
          kpi_actual: cached.kpi_actual || "",
        });
        setGovForm({
          government_feedback: cached.government_feedback || "",
          kpi_target: cached.kpi_target || "",
          final_recommendation: cached.final_recommendation || "scale",
          scale_up_pathway: cached.scale_up_pathway || "within_department",
          validator_name: cached.validator_name || "",
          validation_summary: cached.validation_summary || "",
          validation_status: cached.validation_status || "not_applicable",
        });
        if (cached.updated_at || cached.created_at) {
          setLastSyncedAt(cached.updated_at || cached.created_at);
        }
      }
    } catch (e) {
      console.warn("LocalStorage cache read notice:", e);
    }

    // Default verified result for demo-pilot-1 if no local override
    if (!cached && offerId === "demo-pilot-1") {
      const def = DEFAULT_PILOT_RESULT_1;
      setResult(def);
      setStartupForm({
        outcome: def.outcome || "",
        success_metrics: def.success_metrics || "",
        kpi_actual: def.kpi_actual || "",
      });
      setGovForm({
        government_feedback: def.government_feedback || "",
        kpi_target: def.kpi_target || "",
        final_recommendation: def.final_recommendation || "scale",
        scale_up_pathway: def.scale_up_pathway || "marketplace",
        validator_name: def.validator_name || "",
        validation_summary: def.validation_summary || "",
        validation_status: def.validation_status || "passed",
      });
      setDbStatus("connected");
      setLoading(false);
      return;
    }

    // 2. Query Supabase database if real UUID offerId
    if (offerId && !String(offerId).startsWith("demo-")) {
      try {
        const { data, error } = await supabase
          .from("pilot_results")
          .select("*")
          .eq("pilot_offer_id", offerId)
          .maybeSingle();

        if (error) {
          console.warn("Load pilot results DB notice:", error);
          if (error.code === "42P01" || error.message?.toLowerCase().includes("does not exist")) {
            setDbStatus("not_found");
          } else {
            setDbStatus("error");
          }
        } else {
          setDbStatus("connected");
          if (data) {
            setResult(data);
            setStartupForm({
              outcome: data.outcome || "",
              success_metrics: data.success_metrics || "",
              kpi_actual: data.kpi_actual || "",
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
            setLastSyncedAt(data.updated_at || data.created_at);
            try {
              localStorage.setItem(`udyam_pilot_result_${offerId}`, JSON.stringify(data));
            } catch (e) {
              console.warn("LocalStorage cache write notice:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Load pilot results network notice:", err);
        setDbStatus("error");
      }
    } else {
      setDbStatus("connected");
    }
    setLoading(false);
  }, [offerId]);

  useEffect(() => { loadResult(); }, [loadResult]);

  const upsert = async (payload, isStartup = false) => {
    // Form validation for startup submission
    if (isStartup) {
      if (!payload.outcome?.trim() && !payload.success_metrics?.trim() && !payload.kpi_actual?.trim()) {
        setSaveError("Please enter an outcome summary, success metrics, or actual KPI result before submitting.");
        return;
      }
    }

    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const nowIso = new Date().toISOString();

    // Optimistic local state update
    const mergedResult = {
      ...(result || {}),
      pilot_offer_id: offerId,
      ...payload,
      updated_at: nowIso
    };
    setResult(mergedResult);
    try {
      localStorage.setItem(`udyam_pilot_result_${offerId}`, JSON.stringify(mergedResult));
    } catch (e) {
      console.warn("LocalStorage save notice:", e);
    }

    try {
      if (offerId && !String(offerId).startsWith("demo-")) {
        // Step 1: Check if record exists in public.pilot_results
        const { data: existing, error: checkError } = await supabase
          .from("pilot_results")
          .select("id")
          .eq("pilot_offer_id", offerId)
          .maybeSingle();

        if (checkError && (checkError.code === "42P01" || checkError.message?.toLowerCase().includes("does not exist"))) {
          setDbStatus("not_found");
          setSaveError("Database table 'public.pilot_results' was not found in Supabase. Please execute the SQL migration in supabase/pilot_results_fix.sql in your Supabase SQL Editor.");
          setSaving(false);
          return;
        }

        let savedData = null;
        let saveErrorResult = null;

        if (existing?.id) {
          // Step 2a: Update existing record
          const { data: uData, error: uError } = await supabase
            .from("pilot_results")
            .update({
              ...payload,
              updated_at: nowIso
            })
            .eq("pilot_offer_id", offerId)
            .select()
            .maybeSingle();

          savedData = uData;
          saveErrorResult = uError;
        } else {
          // Step 2b: Insert new record
          const { data: iData, error: iError } = await supabase
            .from("pilot_results")
            .insert({
              pilot_offer_id: offerId,
              ...payload,
              updated_at: nowIso
            })
            .select()
            .maybeSingle();

          if (iError && (iError.code === "23505" || iError.message?.includes("duplicate key") || iError.message?.includes("unique"))) {
            // Fallback to update on race condition
            const { data: rData, error: rError } = await supabase
              .from("pilot_results")
              .update({
                ...payload,
                updated_at: nowIso
              })
              .eq("pilot_offer_id", offerId)
              .select()
              .maybeSingle();
            savedData = rData;
            saveErrorResult = rError;
          } else {
            savedData = iData;
            saveErrorResult = iError;
          }
        }

        if (saveErrorResult) {
          console.error("Save to pilot_results database error:", saveErrorResult);
          setSaveError(`Database notice: ${saveErrorResult.message || "Failed to persist to database"}. (Local preview saved)`);
          setDbStatus("error");
        } else {
          if (savedData) setResult(savedData);
          setDbStatus("connected");
          setLastSyncedAt(nowIso);
          setSaveSuccess(
            isGovernment
              ? "✓ Evaluation & Decision successfully saved to Supabase database (public.pilot_results)!"
              : "✓ Final results successfully submitted and stored in Supabase database (public.pilot_results)!"
          );
        }
      } else {
        // Demo mode
        setDbStatus("connected");
        setLastSyncedAt(nowIso);
        setSaveSuccess(isGovernment ? "Evaluation & Decision saved successfully!" : "Final results submitted successfully!");
      }

      // Notify counterparty
      const recipientId = isGovernment ? offer?.startup_id : offer?.government_id;
      if (recipientId && !String(recipientId).startsWith("demo-")) {
        createNotification(
          recipientId,
          isGovernment
            ? `Department evaluation & decision saved for pilot "${offer?.challenges?.title || "challenge"}".`
            : `Startup submitted final pilot results for "${offer?.challenges?.title || "challenge"}".`,
          isGovernment ? "pilot_evaluated" : "pilot_results_submitted",
          offerId,
          "pilot_offer"
        );
      }

      onUpdated?.();
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err.message || "Failed to save to database.");
      setDbStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-slate-400 my-4" />;

  return (
    <div className="space-y-6">
      {/* Database Connection Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Database:</span>
          {dbStatus === "connected" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase connected (public.pilot_results)
            </span>
          )}
          {dbStatus === "not_found" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Table Pending in Supabase
            </span>
          )}
          {dbStatus === "error" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Database Notice
            </span>
          )}
        </div>
        {lastSyncedAt && (
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Last synced to DB: {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Database Setup Required Notice if table not found */}
      {dbStatus === "not_found" && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <Database className="w-4 h-4 text-amber-600" />
            Supabase Database Table Setup Required
          </p>
          <p className="text-amber-800 leading-relaxed">
            The table <code className="px-1.5 py-0.5 bg-amber-100 rounded text-[11px] font-mono font-bold">public.pilot_results</code> is not yet present in your Supabase project. Open your Supabase Dashboard &rarr; <strong>SQL Editor</strong>, and run the script located at <code className="px-1.5 py-0.5 bg-amber-100 rounded text-[11px] font-mono font-bold">supabase/pilot_results_fix.sql</code> to create it with one click.
          </p>
        </div>
      )}

      {/* Success / Error notification alerts */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Startup submission */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Startup: Final Results</h4>
        {!isGovernment ? (
          <div className="space-y-2.5">
            <textarea
              value={startupForm.outcome}
              onChange={(e) => setStartupForm({ ...startupForm, outcome: e.target.value })}
              placeholder="Outcome / implementation summary"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <textarea
              value={startupForm.success_metrics}
              onChange={(e) => setStartupForm({ ...startupForm, success_metrics: e.target.value })}
              placeholder="Success metrics / evidence"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <input
              value={startupForm.kpi_actual}
              onChange={(e) => setStartupForm({ ...startupForm, kpi_actual: e.target.value })}
              placeholder="Actual KPI result (e.g. 37% reduction)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={() => upsert(startupForm, true)}
                disabled={saving}
                className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>Submit Final Results</span>
                  </>
                )}
              </button>
              {lastSyncedAt && !saving && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Database Synced
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-700 space-y-1.5 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
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
          <div className="space-y-3">
            <input
              value={govForm.kpi_target}
              onChange={(e) => setGovForm({ ...govForm, kpi_target: e.target.value })}
              placeholder="KPI target (e.g. 30% reduction in processing time)"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <textarea
              value={govForm.government_feedback}
              onChange={(e) => setGovForm({ ...govForm, government_feedback: e.target.value })}
              placeholder="Government feedback"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Independent Validation (optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={govForm.validator_name}
                  onChange={(e) => setGovForm({ ...govForm, validator_name: e.target.value })}
                  placeholder="Validator name / organization"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
                <select
                  value={govForm.validation_status}
                  onChange={(e) => setGovForm({ ...govForm, validation_status: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white focus:border-emerald-500"
                >
                  <option value="not_applicable">Not Applicable</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                </select>
              </div>
              <textarea
                value={govForm.validation_summary}
                onChange={(e) => setGovForm({ ...govForm, validation_summary: e.target.value })}
                placeholder="Validation summary"
                rows={2}
                className="w-full mt-2 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none resize-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Decision</label>
              <div className="flex gap-2 mb-2">
                {[
                  { key: "scale", label: "Scale" },
                  { key: "extend_pilot", label: "Extend Pilot" },
                  { key: "close", label: "Close" }
                ].map((rec) => (
                  <button
                    key={rec.key}
                    type="button"
                    onClick={() => setGovForm({ ...govForm, final_recommendation: rec.key })}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      govForm.final_recommendation === rec.key
                        ? "bg-[#0B192C] text-white border-[#0B192C] shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
              {govForm.final_recommendation === "scale" && (
                <div className="mt-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Scale-Up Pathway</label>
                  <select
                    value={govForm.scale_up_pathway}
                    onChange={(e) => setGovForm({ ...govForm, scale_up_pathway: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white focus:border-emerald-500"
                  >
                    {Object.entries(SCALE_UP_PATHWAYS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => upsert(govForm, false)}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Evaluation to Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Save Evaluation &amp; Decision</span>
                  </>
                )}
              </button>
              {lastSyncedAt && !saving && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Database Synced
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-700 space-y-1.5 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
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