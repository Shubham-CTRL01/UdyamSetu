import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Loader2, Save, Send, CheckCircle, XCircle,
  User, Building2, Globe, Mail, Phone, Calendar, IndianRupee,
  Target, BrainCircuit, RefreshCw, AlertTriangle, Rocket
} from "lucide-react";
import { analyzeApplication, getOrCreateMatchScore, fetchMatchScore } from "../lib/matching";
import { createNotification, applicationStatusColor, formatCurrency, formatDate } from "../lib/utils";
import AIMatchPanel from "../components/AIMatchPanel";
import PilotOfferForm from "../components/PilotOfferForm";

export default function GovernmentApplicationReview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [application, setApplication] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [startupProfile, setStartupProfile] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPilotForm, setShowPilotForm] = useState(false);
  const [pilotFormLoading, setPilotFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!applicationId || !user) return;
    setLoading(true);
    try {
      // Fetch application with challenge details
      const { data: appData, error: appErr } = await supabase
        .from("challenge_applications")
        .select(`
          *,
          challenges!inner(*)
        `)
        .eq("id", applicationId)
        .single();

      if (appErr) throw appErr;
      setApplication(appData);
      setChallenge(appData.challenges);

      // Fetch startup profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", appData.startup_id)
        .maybeSingle();
      setStartupProfile(prof);

      // Fetch cached match score
      const { data: cached } = await fetchMatchScore(supabase, applicationId);
      if (cached) setMatchData(cached);
    } catch (err) {
      setError(err.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [applicationId, user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData, applicationId]);

  const runAIAnalysis = async () => {
    if (!application || !challenge) return;
    setAnalyzing(true);
    setError("");
    try {
      const result = await getOrCreateMatchScore(
        supabase,
        applicationId,
        challenge,
        application,
        startupProfile
      );
      if (result.error) {
        setError(result.error);
      } else {
        setMatchData({
          ...result.data,
          overall_score: result.data.overall_score ?? result.data.overallScore,
          analysis_text: result.data.analysis_text ?? result.data.analysisText,
          concerns_text: result.data.concerns_text ?? result.data.concernsText,
        });
      }
    } catch (err) {
      setError(err.message || "AI analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const recomputeAI = async () => {
    if (!application || !challenge) return;
    setAnalyzing(true);
    try {
      const result = await analyzeApplication(challenge, application, startupProfile);
      // Save fresh result
      const { error: saveErr } = await supabase.from("ai_match_scores").upsert({
        application_id: applicationId,
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
      }, { onConflict: "application_id" });
      if (saveErr) {
        setError(saveErr.message);
      } else {
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
      setError(err.message || "Failed to recompute");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateApplicationStatus = async (newStatus) => {
    if (!application) return;
    setStatusLoading(true);
    try {
      const { error: err } = await supabase
        .from("challenge_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", applicationId);

      if (err) {
        setError(err.message);
      } else {
        setApplication((prev) => ({ ...prev, status: newStatus }));
        // Notification is handled by the DB trigger
      }
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePilotSubmit = async (formData) => {
    if (!application || !challenge) return;
    setPilotFormLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.from("pilot_offers").insert({
        challenge_id: challenge.id,
        application_id: application.id,
        government_id: user.id,
        startup_id: application.startup_id,
        objective: formData.objective,
        location: formData.location,
        duration: formData.duration,
        proposed_budget: formData.proposed_budget,
        start_date: formData.start_date,
        deliverables: formData.deliverables,
        success_criteria: formData.success_criteria,
        beneficiaries: formData.beneficiaries,
        special_conditions: formData.special_conditions,
        additional_notes: formData.additional_notes,
        status: "proposed",
      });

      if (err) {
        setError(err.message);
      } else {
        // Update application status to Pilot Offered
        await supabase
          .from("challenge_applications")
          .update({ status: "Pilot Offered", updated_at: new Date().toISOString() })
          .eq("id", applicationId);
        setApplication((prev) => ({ ...prev, status: "Pilot Offered" }));
        setShowPilotForm(false);
        // Notification is handled by the DB trigger
        navigate("/pilot-management");
      }
    } catch (err) {
      setError(err.message || "Failed to create pilot offer");
    } finally {
      setPilotFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Application Review...
        </span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{error || "Application not found"}</p>
          <Link to="/government/dashboard" className="text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              to="/government/dashboard"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Application Review
            </h1>
          </div>
          {application?.status && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border w-fit ${applicationStatusColor(application.status)}`}>
              ● {application.status}
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Challenge context */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              {challenge?.department || "Government Department"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {challenge?.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {challenge?.problem_statement}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Deadline: {challenge?.deadline || "Open-ended"}
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              Budget: {challenge?.budget || "N/A"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Application details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Startup information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Startup Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Company Name</span>
                  <div className="font-semibold text-slate-800">{application.startup_name || startupProfile?.organization_name}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Contact Person</span>
                  <div className="font-semibold text-slate-800">{application.contact_person || startupProfile?.full_name}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Sector</span>
                  <div className="font-semibold text-slate-800">{startupProfile?.sector || application.technology}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Email</span>
                  <div className="font-semibold text-slate-800">{startupProfile?.email || "—"}</div>
                </div>
                {startupProfile?.website && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400">Website</span>
                    <div className="font-semibold text-indigo-600 break-all">{startupProfile.website}</div>
                  </div>
                )}
                {startupProfile?.description && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400">About</span>
                    <p className="text-slate-700 mt-1 leading-relaxed text-sm">{startupProfile.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Proposed Solution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Proposed Solution</h3>
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Solution Title</span>
                  <p className="font-semibold text-slate-800 mt-1">{application.solution_title}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pitch / Executive Summary</span>
                  <p className="mt-1 leading-relaxed whitespace-pre-line">
                    {application.pitch_summary || application.solution_description}
                  </p>
                </div>

                {application.problem_solving_approach && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Problem-Solving Approach</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.problem_solving_approach}
                    </p>
                  </div>
                )}

                {application.solution_description && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Detailed Description</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.solution_description}
                    </p>
                  </div>
                )}

                {application.technology && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Technology &amp; Technical Approach</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.technology}
                    </p>
                  </div>
                )}

                {application.key_features && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Key Features</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.key_features}
                    </p>
                  </div>
                )}

                {application.implementation_methodology && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Implementation Methodology</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.implementation_methodology}
                    </p>
                  </div>
                )}

                {application.expected_impact && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Expected Impact</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.expected_impact}
                    </p>
                  </div>
                )}

                {application.current_maturity && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Current Maturity / Stage</span>
                    <p className="mt-1 leading-relaxed">
                      {application.current_maturity}
                    </p>
                  </div>
                )}

                {application.existing_deployments && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Existing Deployments / Pilots</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.existing_deployments}
                    </p>
                  </div>
                )}

                {application.team_capabilities && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Team / Capabilities</span>
                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                      {application.team_capabilities}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Timeline</span>
                    <p className="font-semibold text-slate-800">{application.timeline || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Cost</span>
                    <p className="font-semibold text-slate-800">{application.estimated_cost || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Submitted</span>
                    <p className="font-semibold text-slate-800">{formatDate(application.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons for status / pilot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Review Actions</h3>
                {statusLoading && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating status...
                  </span>
                )}
              </div>

              {/* Decision: Rejected */}
              {application.status === "Rejected" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white font-bold text-sm rounded-xl shadow-md cursor-default"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </button>
                    <button
                      onClick={() => updateApplicationStatus("Under Review")}
                      disabled={statusLoading}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium transition-colors"
                    >
                      Change decision
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Decision recorded: Application has been rejected.
                  </p>
                </div>
              )}

              {/* Decision: Shortlisted */}
              {application.status === "Shortlisted" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl shadow-md cursor-default"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Shortlisted
                    </button>
                    <button
                      onClick={() => setShowPilotForm(true)}
                      className="flex items-center gap-2 px-5 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <Send className="w-4 h-4" /> Send Pilot
                    </button>
                    <button
                      onClick={() => updateApplicationStatus("Under Review")}
                      disabled={statusLoading}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium transition-colors"
                    >
                      Change decision
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Decision recorded: Startup is shortlisted for pilot selection.
                  </p>
                </div>
              )}

              {/* Decision: Selected for Pilot (Pending offer details) */}
              {application.status === "Selected" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md cursor-default"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Selected for Pilot
                    </button>
                    <button
                      onClick={() => setShowPilotForm(true)}
                      className="flex items-center gap-2 px-5 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <Send className="w-4 h-4" /> Configure &amp; Send Pilot
                    </button>
                    <button
                      onClick={() => updateApplicationStatus("Under Review")}
                      disabled={statusLoading}
                      className="text-xs text-slate-500 hover:text-slate-800 underline font-medium transition-colors"
                    >
                      Change decision
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Selected for pilot. Click "Configure &amp; Send Pilot" to dispatch the pilot offer.
                  </p>
                </div>
              )}

              {/* Decision: Pilot Offered */}
              {application.status === "Pilot Offered" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/pilot-management"
                      className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg w-fit"
                      title="View deployment in Pilot Management"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Pilot Offered
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500">
                    Decision recorded: Pilot offer dispatched to startup. Click above to view deployment in Pilot Management.
                  </p>
                </div>
              )}

              {/* No final decision yet: Submitted or Under Review */}
              {application.status !== "Rejected" &&
                application.status !== "Shortlisted" &&
                application.status !== "Selected" &&
                application.status !== "Pilot Offered" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-1">
                      Take a review decision on this proposal:
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setShowPilotForm(true)}
                        disabled={statusLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Pilot
                      </button>
                      <button
                        onClick={() => updateApplicationStatus("Shortlisted")}
                        disabled={statusLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition-all disabled:opacity-60"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Shortlist
                      </button>
                      <button
                        onClick={() => updateApplicationStatus("Rejected")}
                        disabled={statusLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-all disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      {application.status !== "Under Review" && (
                        <button
                          onClick={() => updateApplicationStatus("Under Review")}
                          disabled={statusLoading}
                          className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all disabled:opacity-60"
                        >
                          Mark for Review
                        </button>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Right column: AI Analysis */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  AI Analysis
                </h3>
                {application.status !== "Rejected" && (
                  <button
                    onClick={recomputeAI}
                    disabled={analyzing}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    title="Refresh AI analysis"
                  >
                    <RefreshCw className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>

              {analyzing ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
                  <p className="text-xs">Generating AI-powered analysis...</p>
                </div>
              ) : matchData ? (
                <AIMatchPanel matchData={matchData} />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs mb-3">No AI analysis has been generated for this application yet.</p>
                  <button
                    onClick={runAIAnalysis}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto"
                  >
                    <BrainCircuit className="w-4 h-4" />
                    Generate AI Match Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pilot Offer Modal */}
        {showPilotForm && challenge && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setShowPilotForm(false)}
                className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <PilotOfferForm
                challenge={challenge}
                application={application}
                onSubmit={handlePilotSubmit}
                onCancel={() => setShowPilotForm(false)}
                loading={pilotFormLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
