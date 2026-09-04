import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Building2, Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const CATEGORIES = ["Manufacturing","Technology","Services","Agriculture","Textile","Food Processing","Healthcare","Education","Retail","Construction","Other"];
const BUSINESS_TYPES = ["Proprietorship","Partnership","LLP","Private Limited","Public Limited","Section 8 Company","Cooperative"];

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all";
const selectCls = inputCls + " cursor-pointer";

export default function BusinessProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState(null);

  const [form, setForm] = useState({
    business_name: "", business_type: "", category: "",
    state: "", district: "", address: "",
    annual_turnover: "", employee_count: "",
  });

  const loadBusiness = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("businesses").select("*").eq("user_id", user.id).maybeSingle();
    if (data) {
      setBusinessId(data.id);
      setForm({
        business_name: data.business_name || "",
        business_type: data.business_type || "",
        category: data.category || "",
        state: data.state || "",
        district: data.district || "",
        address: data.address || "",
        annual_turnover: data.annual_turnover ? String(data.annual_turnover) : "",
        employee_count: data.employee_count ? String(data.employee_count) : "",
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadBusiness();
  }, [user, navigate, loadBusiness]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!form.business_name) { setError("Business name is required."); return; }
    setSaving(true);
    const payload = {
      user_id: user.id,
      ...form,
      annual_turnover: form.annual_turnover ? parseInt(form.annual_turnover) : null,
      employee_count: form.employee_count ? parseInt(form.employee_count) : null,
    };
    let result;
    if (businessId) {
      result = await supabase.from("businesses").update(payload).eq("id", businessId);
    } else {
      result = await supabase.from("businesses").insert(payload).select().single();
      if (result.data) setBusinessId(result.data.id);
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Business Profile
              </h1>
              <p className="text-sm text-slate-500">
                {businessId ? "Update your registered business information." : "Add your business details to apply for government schemes."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Business profile saved successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Field label="Business Name" required>
                  <input value={form.business_name} onChange={set("business_name")} placeholder="e.g. Sharma Textile Mills Pvt. Ltd." className={inputCls} required />
                </Field>
              </div>

              <Field label="Business Type">
                <select value={form.business_type} onChange={set("business_type")} className={selectCls}>
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Industry Category">
                <select value={form.category} onChange={set("category")} className={selectCls}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="State">
                <select value={form.state} onChange={set("state")} className={selectCls}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="District">
                <input value={form.district} onChange={set("district")} placeholder="e.g. Pune" className={inputCls} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Business Address">
                  <textarea value={form.address} onChange={set("address")} placeholder="Plot No., Street, City, PIN" rows={3}
                    className={inputCls + " resize-none"} />
                </Field>
              </div>

              <Field label="Annual Turnover (₹)">
                <input type="number" value={form.annual_turnover} onChange={set("annual_turnover")} placeholder="e.g. 5000000" className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Enter in rupees (without commas)</p>
              </Field>

              <Field label="Number of Employees">
                <input type="number" value={form.employee_count} onChange={set("employee_count")} placeholder="e.g. 25" className={inputCls} />
              </Field>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : (businessId ? "Update Business Profile" : "Save Business Profile")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
