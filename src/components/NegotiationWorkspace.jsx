import { useState, useEffect } from "react";
import {
  Send, MessageCircle, IndianRupee, Calendar,
  AlertCircle, Loader2, Check, X, Clock, User
} from "lucide-react";
import { formatCurrency, formatDate } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { tempDb, subscribeTempDb } from "../lib/tempDb";

const inputCls =
  "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all";

export default function NegotiationWorkspace({ pilotOffer, currentUser, onUpdated }) {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGovernment = currentUser?.role === "government";
  const isStartup = currentUser?.role === "startup";

  const loadNegotiations = async () => {
    setLoading(true);
    try {
      if (pilotOffer?.id && String(pilotOffer.id).startsWith("demo-")) {
        const data = tempDb.getNegotiations(pilotOffer.id);
        setNegotiations(data || []);
        return;
      }

      const { data, error: err } = await supabase
        .from("pilot_negotiations")
        .select(`
          *,
          sender:sender_id (full_name, organization_name, role)
        `)
        .eq("pilot_offer_id", pilotOffer.id)
        .order("created_at", { ascending: false });

      if (err) setError(err.message);
      else setNegotiations(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNegotiations();
    const unsub = subscribeTempDb(() => {
      if (pilotOffer?.id && String(pilotOffer.id).startsWith("demo-")) {
        loadNegotiations();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilotOffer.id]);

  const acceptOffer = async () => {
    setError("");
    setLoading(true);
    try {
      if (String(pilotOffer.id).startsWith("demo-")) {
        tempDb.updatePilotOffer(pilotOffer.id, { status: "accepted" });
        await loadNegotiations();
        if (onUpdated) onUpdated();
        return;
      }

      const { error: err } = await supabase
        .from("pilot_offers")
        .update({ status: "accepted" })
        .eq("id", pilotOffer.id);
      if (err) setError(err.message);
      else {
        await loadNegotiations();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const declineOffer = async () => {
    setError("");
    setLoading(true);
    try {
      if (String(pilotOffer.id).startsWith("demo-")) {
        tempDb.updatePilotOffer(pilotOffer.id, { status: "declined" });
        await loadNegotiations();
        if (onUpdated) onUpdated();
        return;
      }

      const { error: err } = await supabase
        .from("pilot_offers")
        .update({ status: "declined" })
        .eq("id", pilotOffer.id);
      if (err) setError(err.message);
      else {
        await loadNegotiations();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startPilot = async () => {
    setError("");
    setLoading(true);
    try {
      if (String(pilotOffer.id).startsWith("demo-")) {
        tempDb.updatePilotOffer(pilotOffer.id, { status: "in_progress" });
        await loadNegotiations();
        if (onUpdated) onUpdated();
        return;
      }

      const { error: err } = await supabase
        .from("pilot_offers")
        .update({ status: "in_progress" })
        .eq("id", pilotOffer.id);
      if (err) setError(err.message);
      else {
        await loadNegotiations();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelPilot = async () => {
    setError("");
    setLoading(true);
    try {
      if (String(pilotOffer.id).startsWith("demo-")) {
        tempDb.updatePilotOffer(pilotOffer.id, { status: "cancelled" });
        await loadNegotiations();
        if (onUpdated) onUpdated();
        return;
      }

      const { error: err } = await supabase
        .from("pilot_offers")
        .update({ status: "cancelled" })
        .eq("id", pilotOffer.id);
      if (err) setError(err.message);
      else {
        await loadNegotiations();
        if (onUpdated) onUpdated();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Negotiation history */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Activity Log
        </h4>

        {negotiations.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
            No activity recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {negotiations.map((neg) => {
              const isOwn = neg.sender_id === currentUser.id;
              const senderName = neg.sender?.full_name || neg.sender?.organization_name || "Unknown";
              return (
                <div
                  key={neg.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isOwn
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-600" />
                      </div>
                      <span className="font-bold text-slate-800">
                        {senderName}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        neg.sender?.role === "government"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {neg.sender?.role === "government" ? "Government" : "Startup"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(neg.created_at)}
                    </span>
                  </div>

                  {neg.message && (
                    <p className="text-slate-600 leading-relaxed">{neg.message}</p>
                  )}

                  {neg.proposed_budget && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-slate-600">
                        <IndianRupee className="w-3 h-3" />
                        Budget: {formatCurrency(neg.proposed_budget)}
                      </span>
                      {neg.proposed_duration && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3 h-3" />
                          {neg.proposed_duration} days
                        </span>
                      )}
                      {neg.proposed_start_date && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3" />
                          Start: {formatDate(neg.proposed_start_date)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      neg.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : neg.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : neg.status === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {neg.status === "active" ? "Active" : neg.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons based on current pilot status */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
        {/* Startup: Accept or Decline when proposed */}
        {pilotOffer.status === "proposed" && isStartup && (
          <>
            <button
              onClick={acceptOffer}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Accept Offer
            </button>
            <button
              onClick={declineOffer}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Decline Offer
            </button>
          </>
        )}

        {/* Government: Start pilot once accepted */}
        {pilotOffer.status === "accepted" && isGovernment && (
          <button
            onClick={startPilot}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Start Pilot (In Progress)
          </button>
        )}

        {/* Government: Cancel an in-progress pilot */}
        {pilotOffer.status === "in_progress" && isGovernment && (
          <button
            onClick={cancelPilot}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cancel Pilot
          </button>
        )}
      </div>
    </div>
  );
}
