import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Search, Rocket, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, Filter, IndianRupee, Users
} from "lucide-react";

const CATEGORIES = ["All","Manufacturing","Finance","Procurement","Startup","Technology","Infrastructure"];

function SchemeCard({ scheme, onApply, applying }) {
  const categoryColors = {
    Finance: "bg-emerald-100 text-emerald-700",
    Manufacturing: "bg-blue-100 text-blue-700",
    Procurement: "bg-violet-100 text-violet-700",
    Startup: "bg-amber-100 text-amber-700",
    Technology: "bg-sky-100 text-sky-700",
    Infrastructure: "bg-orange-100 text-orange-700",
  };
  const color = categoryColors[scheme.category] || "bg-slate-100 text-slate-600";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${color}`}>
            {scheme.category}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${scheme.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
            {scheme.status === "active" ? "● Active" : "Closed"}
          </span>
        </div>
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-2" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          {scheme.name}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3">{scheme.description}</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <IndianRupee className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
            <span><strong className="text-slate-800">Benefits:</strong> {scheme.benefits}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <Users className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
            <span><strong className="text-slate-800">Eligibility:</strong> {scheme.eligibility}</span>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <button
          onClick={() => onApply(scheme)}
          disabled={applying === scheme.id}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {applying === scheme.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {applying === scheme.id ? "Applying..." : "Apply Now"}
        </button>
      </div>
    </div>
  );
}

export default function Schemes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState(null); // { type, message }

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("schemes").select("*").eq("status", "active").order("created_at");
    setSchemes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadSchemes();
  }, [user, navigate, loadSchemes]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleApply(scheme) {
    if (!user) { navigate("/login"); return; }
    setApplying(scheme.id);

    // Check business profile
    const { data: business } = await supabase
      .from("businesses").select("id").eq("user_id", user.id).maybeSingle();

    if (!business) {
      showToast("error", "You need a business profile before applying. Please complete it first.");
      navigate("/profile");
      setApplying(null);
      return;
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("scheme_id", scheme.id)
      .maybeSingle();

    if (existing) {
      showToast("error", "You have already applied for this scheme.");
      setApplying(null);
      return;
    }

    // Create application
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      business_id: business.id,
      scheme_id: scheme.id,
      status: "Submitted",
    });

    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", `Successfully applied for "${scheme.name}"! Redirecting to your applications...`);
      setTimeout(() => navigate("/applications"), 2000);
    }
    setApplying(null);
  }

  const filtered = schemes.filter((s) => {
    const matchCat = category === "All" || s.category === category;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-sm ${
          toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Government Schemes
          </h1>
          <p className="text-slate-500 text-sm mt-1">{schemes.length} active schemes available for MSMEs and startups</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1 bg-white border border-slate-200 rounded-xl px-4">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schemes by name or keyword..."
              className="flex-1 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  category === c ? "bg-[#0B192C] text-white border-[#0B192C]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No schemes found for your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} onApply={handleApply} applying={applying} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
