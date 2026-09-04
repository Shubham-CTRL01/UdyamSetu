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
      let query = supabase
        .from("pilot_offers")
        .select(`
          *,
          challenges!inner(title, department, sector, budget),
          applications:challenge_applications!left(solution_title, solution_description, startup_name),
          startup_profile:profiles!inner_1(full_name, organization_name, sector, email, website, description)
        `);

      if (isGovernment) {
        query = query.eq("government_id", user.id);
      } else {
        query = query.eq("startup_id", user.id);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error: err } = await query;
      if (err) throw err;
      setOffers(data || []);
    } catch (err) {
      setError(err.message || "Failed to load pilot offers");
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
      const { data, error: err } = await supabase
        .from("pilot_offers")
        .select(`
          *,
          challenges!inner(*),
          applications:challenge_applications!left(*),
          startup_profile:profiles!inner(full_name, organization_name, sector, email, website, description, govt_level)
        `)
        .eq("id", offerId)
        .single();

      if (err) throw err;
      setSelectedOffer(data);
    } catch (err) {
      setError(err.message || "Failed to load offer");
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
  const [negotiations, setNegotiations] = useState([]);
  const [loadingNegotiations, setLoadingNegotiations] = useState(true);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultForm, setResultForm] = useState({
    outcome: "",
    success_metrics: "",
    government_feedback: "",
    startup_feedback: "",
    final_recommendation: "scale",
  });
  const [resultLoading, setResultLoading] = useState(false);

  const isGovernment = profile?.role === "government";
  const challenge = offer.challenges;
  const application = offer.applications;

  const loadNegotiations = useCallback(async () => {
    setLoadingNegotiations(true);
    try {
      const { data, error: err } = await supabase
        .from("pilot_negotiations")
        .select(`
          *,
          sender:profiles!sender_id(full_name, organization_name, role)
        `)
        .eq("pilot_offer_id", offer.id)
        .order("created_at", { ascending: true });

      if (err) console.warn(err);
      else setNegotiations(data || []);
    } finally {
      setLoadingNegotiations(false);
    }
  }, [offer.id]);

  useEffect(() => {
    loadNegotiations();
  }, [loadNegotiations]);

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

  const handlePilotResult = async (e) => {
    e.preventDefault();
    setResultLoading(true);
    try {
      const { error } = await supabase.from("pilot_results").insert({
        pilot_offer_id: offer.id,
        outcome: resultForm.outcome,
        success_metrics: resultForm.success_metrics,
        government_feedback: resultForm.government_feedback,
        startup_feedback: resultForm.startup_feedback,
        final_recommendation: resultForm.final_recommendation,
      });
      if (error) throw error;
      setShowResultForm(false);
      onUpdated();
    } catch (err) {
      console.error("Result error:", err);
    } finally {
      setResultLoading(false);
    }
  };

  const [offerData, setOfferData] = useState(offer);
  useEffect(() => {
    setOfferData(offer);
  }, [offer]);

  const handleOfferUpdated = () => {
    setOfferData({ ...offer });
    loadNegotiations();
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

        {/* Pilot Results (only when completed) */}
        {offerData.status === "completed" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Pilot Results</h3>
            <PilotResultsView offerId={offerData.id} isGovernment={isGovernment} onUpdated={onUpdated} />
          </div>
        )}

        {/* Mark complete + results (government only, when in_progress) */}
        {offerData.status === "in_progress" && isGovernment && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Complete Pilot & Evaluate</h3>
            <button
              onClick={() => handleStatusUpdate("completed")}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Mark Pilot as Completed
            </button>
            <p className="text-xs text-slate-400 mt-2">
              After completion, you can submit pilot results and evaluation.
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

// Pilot Results view
function PilotResultsView({ offerId, isGovernment, onUpdated }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadResult = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("pilot_results")
      .select("*")
      .eq("pilot_offer_id", offerId)
      .maybeSingle();
    if (!err) setResult(data);
    setLoading(false);
  }, [offerId]);

  useEffect(() => {
    loadResult();
  }, [loadResult]);

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;
  }

  if (!result) {
    return (
      <p className="text-xs text-slate-400">
        Results have not been submitted yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {result.outcome && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Outcome:</span>
          <p className="text-slate-700 mt-0.5 whitespace-pre-line">{result.outcome}</p>
        </div>
      )}
      {result.success_metrics && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Success Metrics:</span>
          <p className="text-slate-700 mt-0.5 whitespace-pre-line">{result.success_metrics}</p>
        </div>
      )}
      {result.final_recommendation && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Recommendation:</span>
          <span className="text-slate-700 ml-2 font-medium">
            {result.final_recommendation === "scale" ? "Scale" : result.final_recommendation === "extend_pilot" ? "Extend Pilot" : "Close"}
          </span>
        </div>
      )}
    </div>
  );
}