import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Search, Filter, Landmark, Clock, ArrowLeft, ArrowRight, Loader2,
} from "lucide-react";
import { tempDb, subscribeTempDb } from "../lib/tempDb";

const SECTORS = [
  "All", "Deep Tech", "Defence & Aerospace", "HealthTech & Life Sciences",
  "CleanTech & Renewable Energy", "AgriTech & Food Processing",
  "Smart Cities & Infrastructure", "Cybersecurity & AI",
  "FinTech & GovTech", "Manufacturing & Robotics",
];

const DEADLINE_FILTERS = ["Any Time", "Next 30 Days", "Next 90 Days"];

function parseBudgetLakhs(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const crMatch = lower.match(/([\d.]+)\s*cr/);
  if (crMatch) return parseFloat(crMatch[1]) * 100;
  const lakhMatch = lower.match(/([\d.]+)\s*(lakh|l\b)/);
  if (lakhMatch) return parseFloat(lakhMatch[1]);
  return null;
}

export default function ChallengeDiscovery() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("Any Time");
  const [minBudget, setMinBudget] = useState("");

  const loadChallenges = async () => {
    setLoading(true);
    try {
      if (user?.id && user.id.startsWith("demo-")) {
        const demoChs = tempDb.getChallenges().filter((c) => c.status === "Published" || !c.status);
        setChallenges(demoChs);
        return;
      }

      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        const demoChs = tempDb.getChallenges().filter((c) => c.status === "Published" || !c.status);
        setChallenges(demoChs);
      } else {
        setChallenges(data);
      }
    } catch {
      const demoChs = tempDb.getChallenges().filter((c) => c.status === "Published" || !c.status);
      setChallenges(demoChs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
    const unsub = subscribeTempDb(() => {
      loadChallenges();
    });
    return unsub;
  }, [user]);

  const backLink = user
    ? role === "government" ? "/government/dashboard" : "/startup/dashboard"
    : "/";

  const now = new Date();
  const filtered = challenges.filter((c) => {
    const matchesSector = sector === "All" || c.sector === sector;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      (c.problem_statement || "").toLowerCase().includes(q);

    let matchesDeadline = true;
    if (deadlineFilter !== "Any Time" && c.deadline) {
      const days = deadlineFilter === "Next 30 Days" ? 30 : 90;
      const deadlineDate = new Date(c.deadline);
      const diffDays = (deadlineDate - now) / (1000 * 60 * 60 * 24);
      matchesDeadline = diffDays >= 0 && diffDays <= days;
    }

    let matchesBudget = true;
    if (minBudget) {
      const budgetLakhs = parseBudgetLakhs(c.budget);
      matchesBudget = budgetLakhs === null || budgetLakhs >= parseFloat(minBudget);
    }

    return matchesSector && matchesSearch && matchesDeadline && matchesBudget;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {user ? "Dashboard" : "Home"}
        </Link>

        <div className="mb-8">
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Government Challenges
          </h1>
          <p className="text-slate-500 text-sm mt-1">{challenges.length} published challenges open for startup proposals</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges, departments..."
                className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
              />
            </div>
            <select value={deadlineFilter} onChange={(e) => setDeadlineFilter(e.target.value)}
              className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none">
              {DEADLINE_FILTERS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
              type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)}
              placeholder="Min budget (₹L)"
              className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none w-full md:w-40"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0"><Filter className="w-3 h-3 inline" /> Sector:</span>
            {SECTORS.map((sec) => (
              <button key={sec} onClick={() => setSector(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  sector === sec ? "bg-[#0B192C] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {sec}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No challenges match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">{c.sector}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.deadline || "Open"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{c.department}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{c.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3">{c.problem_statement}</p>
                  <p className="text-xs text-slate-400 mt-2">Budget: <strong className="text-slate-600">{c.budget || "Govt Pilot"}</strong></p>
                </div>
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => navigate(`/challenges/${c.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white"
                  >
                    View Details &amp; Apply <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
