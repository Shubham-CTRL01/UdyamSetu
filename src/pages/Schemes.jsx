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

const DEFAULT_SCHEMES = [
  {
    id: "scheme-1",
    name: "Prime Minister's Employment Generation Programme (PMEGP)",
    category: "Finance",
    status: "active",
    description: "Credit-linked subsidy programme to generate self-employment opportunities through micro-enterprises.",
    benefits: "Subsidy of 15% to 35% on project cost up to ₹50 Lakhs",
    eligibility: "Individuals above 18 years, SHGs, Institutions registered under Societies Act"
  },
  {
    id: "scheme-2",
    name: "Credit Guarantee Scheme for Micro & Small Enterprises (CGTMSE)",
    category: "Finance",
    status: "active",
    description: "Collateral-free credit facility up to ₹5 Cr for MSMEs provided by Member Lending Institutions.",
    benefits: "Guarantee cover up to 85% for collateral-free business loans",
    eligibility: "New and existing Micro and Small Enterprises"
  },
  {
    id: "scheme-3",
    name: "Startup India Seed Fund Scheme (SISFS)",
    category: "Startup",
    status: "active",
    description: "Financial assistance to startups for proof of concept, prototype development, product trials, and market entry.",
    benefits: "Grants up to ₹20 Lakhs and debt funding up to ₹50 Lakhs via incubators",
    eligibility: "DPIIT-recognized startups incorporated within 2 years"
  },
  {
    id: "scheme-4",
    name: "Scheme for Promotion of Innovation, Rural Industry & Entrepreneurship (ASPIRE)",
    category: "Technology",
    status: "active",
    description: "Sets up Livelihood Business Incubators (LBI) and Technology Business Incubators (TBI) across rural districts.",
    benefits: "One-time grant up to ₹1 Cr for plant & machinery",
    eligibility: "Government and private incubators, MSME institutions"
  },
  {
    id: "scheme-5",
    name: "Public Procurement Policy for Micro & Small Enterprises (MSMEs)",
    category: "Procurement",
    status: "active",
    description: "Mandatory 25% annual procurement by Central Ministries/PSUs from Micro & Small Enterprises.",
    benefits: "Free tender sets, exemption from EMD, price preference of L1+15%",
    eligibility: "Udyam-registered Micro & Small Enterprises"
  },
  {
    id: "scheme-6",
    name: "ZED Certification Scheme (Zero Defect Zero Effect)",
    category: "Manufacturing",
    status: "active",
    description: "Financial support to MSMEs for ZED rating, quality control systems, and sustainable manufacturing.",
    benefits: "Up to 80% subsidy on certification cost & ₹5 Lakhs testing assistance",
    eligibility: "Manufacturing MSMEs with valid Udyam Registration"
  }
];

export default function Schemes() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState(null); // { type, message }

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("schemes").select("*").eq("status", "active").order("created_at");
      if (data && data.length > 0) {
        setSchemes(data);
      } else {
        setSchemes(DEFAULT_SCHEMES);
      }
    } catch {
      setSchemes(DEFAULT_SCHEMES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleApply(scheme) {
    if (!user) {
      showToast("error", "Please sign in to submit your official application for this government scheme.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
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

  const backLink = user
    ? role === "government"
      ? "/government/dashboard"
      : "/startup/dashboard"
    : "/";

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
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {user ? "Dashboard" : "Home"}
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
