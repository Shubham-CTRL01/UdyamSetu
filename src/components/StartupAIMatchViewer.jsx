import { useEffect, useState, useCallback } from "react";
import { BrainCircuit, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import AIMatchPanel from "./AIMatchPanel";

const SCORE_FIELD_MAP = {
  problemFit: ["problem_fit", "scores.problemFit"],
  technicalFit: ["technical_fit", "scores.technicalFit"],
  impact: ["impact_score", "scores.impact"],
  feasibility: ["feasibility_score", "scores.feasibility"],
  timeline: ["timeline_score", "scores.timeline"],
  budgetFit: ["budget_fit", "scores.budgetFit"],
  capability: ["capability_score", "scores.capability"],
};

const ANALYSIS_FIELD_MAP = {
  analysisText: "analysis_text",
  concernsText: "concerns_text",
  scorerVersion: "scorer_version",
  overallScore: "overall_score",
};

function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function normalizeMatchData(raw) {
  if (!raw) return null;
  const normalized = { overall_score: raw.overall_score ?? raw.overallScore ?? 0 };
  for (const [targetKey, [dbKey, scoresKey]] of Object.entries(SCORE_FIELD_MAP)) {
    normalized[targetKey] = raw[dbKey] ?? getNested(raw, scoresKey) ?? 0;
  }
  for (const [targetKey, dbKey] of Object.entries(ANALYSIS_FIELD_MAP)) {
    normalized[targetKey] = raw[dbKey] ?? raw[targetKey];
  }
  return normalized;
}

export default function StartupAIMatchViewer({ appId }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatch = useCallback(async () => {
    const { data } = await supabase
      .from("ai_match_scores")
      .select("*")
      .eq("application_id", appId)
      .maybeSingle();
    setMatchData(normalizeMatchData(data));
  }, [appId]);

  useEffect(() => {
    if (appId) {
      setLoading(true);
      loadMatch().finally(() => setLoading(false));
    }
  }, [appId, loadMatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMatch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-6">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading AI analysis…</span>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
        <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm text-slate-500 mb-3">
          AI analysis has not been generated yet. It will appear once the
          government completes an evaluation.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1"
        >
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          title="Refresh analysis"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>
      <AIMatchPanel matchData={matchData} />
    </div>
  );
}
