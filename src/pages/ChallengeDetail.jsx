import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Loader2, Landmark, Clock, IndianRupee, MapPin,
  CheckCircle2, Rocket, LogIn,
} from "lucide-react";
import ChallengeApplyForm from "../components/ChallengeApplyForm";
import { tempDb } from "../lib/tempDb";

export default function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const isDemo =
        (user?.id && user.id.startsWith("demo-")) ||
        String(challengeId).startsWith("demo-") ||
        String(challengeId).startsWith("ch-local-");

      if (isDemo) {
        const found = tempDb.getChallengeById(challengeId) || tempDb.getChallenges()[0];
        setChallenge(found);
        const demoApps = tempDb.getApplicationsByStartup(user?.id);
        const already = demoApps.some((a) => String(a.challenge_id) === String(challengeId));
        setAlreadyApplied(already);
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .maybeSingle();

      if (err || !data) {
        // Fallback to tempDb
        const fallback = tempDb.getChallengeById(challengeId);
        if (fallback) {
          setChallenge(fallback);
          setLoading(false);
          return;
        }
        setError("Challenge not found or is no longer published.");
        setChallenge(null);
        return;
      }
      setChallenge(data);

      if (user && !user.id.startsWith("demo-") && role === "startup") {
        const { data: existing } = await supabase
          .from("challenge_applications")
          .select("id")
          .eq("challenge_id", challengeId)
          .eq("startup_id", user.id)
          .maybeSingle();
        setAlreadyApplied(!!existing);
      }
    } finally {
      setLoading(false);
    }
  }, [challengeId, user, role]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Challenge...</span>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
        <p className="text-slate-500 mb-4">{error || "Challenge not found"}</p>
        <Link to="/challenges" className="text-indigo-600 hover:underline">← Back to Challenges</Link>
      </div>
    );
  }

  const canApply = user && role === "startup" && !user.id.startsWith("demo-") && !alreadyApplied;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/challenges" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
              {challenge.sector}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Landmark className="w-3 h-3" /> {challenge.department}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {challenge.title}
          </h1>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Problem Statement</h4>
              <p className="leading-relaxed whitespace-pre-line text-sm">{challenge.problem_statement}</p>
            </div>

            {challenge.description && (
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Detailed Description</h4>
                <p className="leading-relaxed whitespace-pre-line text-slate-600 text-sm">{challenge.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block font-bold text-slate-900 mb-1 text-xs uppercase">Expected Outcome</span>
                <span className="text-sm">{challenge.expected_outcome || "Functional prototype"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block font-bold text-slate-900 mb-1 text-xs uppercase">Eligibility Criteria</span>
                <span className="text-sm">{challenge.eligibility || "DPIIT Startups"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100/60 rounded-xl">
              <div>
                <span className="text-slate-500 block text-xs flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Budget</span>
                <strong className="text-slate-900 text-sm">{challenge.budget || "Govt Pilot"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Deadline</span>
                <strong className="text-slate-900 text-sm">{challenge.deadline || "Open"}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Scope</span>
                <strong className="text-slate-900 text-sm">{challenge.location || "Pan-India"}</strong>
              </div>
            </div>
          </div>
        </div>

        {!user && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <p className="text-sm text-slate-600 mb-3">Sign in as a startup to check eligibility and apply for this challenge.</p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold rounded-xl transition-all"
            >
              <LogIn className="w-4 h-4" /> Sign In to Apply
            </button>
          </div>
        )}

        {user && role !== "startup" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
            Only startup accounts can apply to challenges.
          </div>
        )}

        {user && user.id.startsWith("demo-") && role === "startup" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
            Demo accounts can't submit real applications. Sign up for a real account to apply.
          </div>
        )}

        {alreadyApplied && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" /> You've already applied to this challenge.
          </div>
        )}

        {canApply && !showApply && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <Rocket className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 mb-1">Ready to propose your solution?</h3>
            <p className="text-xs text-slate-500 mb-4">Submit a detailed proposal for this challenge.</p>
            <button
              onClick={() => setShowApply(true)}
              className="px-6 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold rounded-xl transition-all"
            >
              Apply for This Challenge
            </button>
          </div>
        )}

        {canApply && showApply && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Apply for This Challenge
            </h3>
            <ChallengeApplyForm
              challenge={challenge}
              onCancel={() => setShowApply(false)}
              onSuccess={() => navigate("/startup/dashboard")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
