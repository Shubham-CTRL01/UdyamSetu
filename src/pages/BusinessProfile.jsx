import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Landmark, Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft, Rocket } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const CATEGORIES = [
  "Deep Tech", "Defence & Aerospace", "HealthTech & Life Sciences",
  "CleanTech & Renewable Energy", "AgriTech & Food Processing",
  "Smart Cities & Infrastructure", "Cybersecurity & AI",
  "FinTech & GovTech", "Manufacturing & Robotics", "Other"
];

const BUSINESS_TYPES = [
  "Private Limited", "LLP", "Proprietorship", "Partnership",
  "Public Limited", "Section 8 Company", "Cooperative"
];

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
  const { user, profile, role, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const isGovt = role === "government";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState(null);

  // Government fields
  const [govtForm, setGovtForm] = useState({
    organization_name: "",
    full_name: "",
    designation: "",
    phone: "",
    description: "",
  });

  // Startup fields
  const [startupForm, setStartupForm] = useState({
    business_name: "",
    business_type: "Private Limited",
    category: "Deep Tech",
    state: "Delhi",
    district: "",
    address: "",
    annual_turnover: "",
    employee_count: "",
    website: "",
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (isGovt) {
        setGovtForm({
          organization_name: profile?.organization_name || "",
          full_name: profile?.full_name || "",
          designation: profile?.designation || "",
          phone: profile?.phone || "",
          description: profile?.description || "",
        });
      } else {
        if (user.id.startsWith("demo-")) {
          setStartupForm({
            business_name: profile?.organization_name || "ApexVision AI Labs",
            business_type: "Private Limited",
            category: profile?.sector || "Deep Tech",
            state: "Delhi",
            district: "New Delhi",
            address: "Plot 42, Technology Park, Okhla Phase III",
            annual_turnover: "15000000",
            employee_count: "24",
            website: profile?.website || "https://apexvision.ai",
          });
        } else {
          const { data } = await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (data) {
            setBusinessId(data.id);
            setStartupForm({
              business_name: data.business_name || profile?.organization_name || "",
              business_type: data.business_type || "Private Limited",
              category: data.category || profile?.sector || "Deep Tech",
              state: data.state || "Delhi",
              district: data.district || "",
              address: data.address || "",
              annual_turnover: data.annual_turnover ? String(data.annual_turnover) : "",
              employee_count: data.employee_count ? String(data.employee_count) : "",
              website: profile?.website || "",
            });
          } else {
            setStartupForm((prev) => ({
              ...prev,
              business_name: profile?.organization_name || "",
              website: profile?.website || "",
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isGovt, profile]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  const handleGovtSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!govtForm.organization_name) {
      setError("Department / Ministry name is required.");
      return;
    }

    setSaving(true);
    try {
      if (!user.id.startsWith("demo-")) {
        const { error: err } = await supabase
          .from("profiles")
          .update({
            organization_name: govtForm.organization_name,
            full_name: govtForm.full_name,
            designation: govtForm.designation,
            phone: govtForm.phone,
            description: govtForm.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (err) throw err;
        await refreshProfile();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (errObj) {
      setError(errObj.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartupSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!startupForm.business_name) {
      setError("Startup / Business name is required.");
      return;
    }

    setSaving(true);
    try {
      if (!user.id.startsWith("demo-")) {
        // 1. Update profiles table
        await supabase
          .from("profiles")
          .update({
            organization_name: startupForm.business_name,
            sector: startupForm.category,
            website: startupForm.website,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        // 2. Upsert businesses table
        const payload = {
          user_id: user.id,
          business_name: startupForm.business_name,
          business_type: startupForm.business_type,
          category: startupForm.category,
          state: startupForm.state,
          district: startupForm.district,
          address: startupForm.address,
          annual_turnover: startupForm.annual_turnover ? parseInt(startupForm.annual_turnover) : null,
          employee_count: startupForm.employee_count ? parseInt(startupForm.employee_count) : null,
        };

        let res;
        if (businessId) {
          res = await supabase.from("businesses").update(payload).eq("id", businessId);
        } else {
          res = await supabase.from("businesses").insert(payload).select().single();
          if (res.data) setBusinessId(res.data.id);
        }

        if (res.error) throw res.error;
        await refreshProfile();
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (errObj) {
      setError(errObj.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const dashboardPath = isGovt ? "/government/dashboard" : "/startup/dashboard";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isGovt ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}>
              {isGovt ? <Landmark className="w-6 h-6" /> : <Rocket className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {isGovt ? "Government Department Profile" : "Startup & Enterprise Profile"}
              </h1>
              <p className="text-sm text-slate-500">
                {isGovt
                  ? "Manage official ministry credentials, nodal contacts, and department mandate."
                  : "Keep your DPIIT and business data current for grant eligibility."}
              </p>
            </div>
          </div>

          {error && (
            <div className="m-6 mb-0 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {saved && (
            <div className="m-6 mb-0 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Profile details updated successfully!
            </div>
          )}

          {isGovt ? (
            /* GOVERNMENT PROFILE FORM */
            <form onSubmit={handleGovtSave} className="p-6 space-y-5">
              <Field label="Department / Ministry Name" required>
                <input
                  type="text"
                  value={govtForm.organization_name}
                  onChange={(e) => setGovtForm({ ...govtForm, organization_name: e.target.value })}
                  placeholder="e.g. Ministry of Road Transport & Highways"
                  className={inputCls}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Official Name" required>
                  <input
                    type="text"
                    value={govtForm.full_name}
                    onChange={(e) => setGovtForm({ ...govtForm, full_name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Designation">
                  <input
                    type="text"
                    value={govtForm.designation}
                    onChange={(e) => setGovtForm({ ...govtForm, designation: e.target.value })}
                    placeholder="e.g. Director, Mission Lead"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Official Email">
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className={inputCls + " bg-slate-50 text-slate-400 cursor-not-allowed"}
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    type="tel"
                    value={govtForm.phone}
                    onChange={(e) => setGovtForm({ ...govtForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Department Mandate / Pilot Scope">
                <textarea
                  value={govtForm.description}
                  onChange={(e) => setGovtForm({ ...govtForm, description: e.target.value })}
                  placeholder="Brief overview of department procurement or pilot scope..."
                  rows={3}
                  className={inputCls + " resize-none"}
                />
              </Field>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving Changes..." : "Save Department Profile"}
                </button>
              </div>
            </form>
          ) : (
            /* STARTUP PROFILE FORM */
            <form onSubmit={handleStartupSave} className="p-6 space-y-5">
              <Field label="Startup Name" required>
                <input
                  type="text"
                  value={startupForm.business_name}
                  onChange={(e) => setStartupForm({ ...startupForm, business_name: e.target.value })}
                  placeholder="e.g. AeroPulse Dynamics Pvt Ltd"
                  className={inputCls}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Constitution / Business Type" required>
                  <select
                    value={startupForm.business_type}
                    onChange={(e) => setStartupForm({ ...startupForm, business_type: e.target.value })}
                    className={selectCls}
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Primary Sector" required>
                  <select
                    value={startupForm.category}
                    onChange={(e) => setStartupForm({ ...startupForm, category: e.target.value })}
                    className={selectCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="State / UT" required>
                  <select
                    value={startupForm.state}
                    onChange={(e) => setStartupForm({ ...startupForm, state: e.target.value })}
                    className={selectCls}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="District">
                  <input
                    type="text"
                    value={startupForm.district}
                    onChange={(e) => setStartupForm({ ...startupForm, district: e.target.value })}
                    placeholder="e.g. Bengaluru Urban"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Registered Address">
                <input
                  type="text"
                  value={startupForm.address}
                  onChange={(e) => setStartupForm({ ...startupForm, address: e.target.value })}
                  placeholder="Building, Street, Area, PIN Code"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Annual Turnover (₹ in Lakhs)">
                  <input
                    type="number"
                    value={startupForm.annual_turnover}
                    onChange={(e) => setStartupForm({ ...startupForm, annual_turnover: e.target.value })}
                    placeholder="e.g. 15000000"
                    className={inputCls}
                  />
                </Field>

                <Field label="Team / Employee Count">
                  <input
                    type="number"
                    value={startupForm.employee_count}
                    onChange={(e) => setStartupForm({ ...startupForm, employee_count: e.target.value })}
                    placeholder="e.g. 24"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Official Website">
                <input
                  type="url"
                  value={startupForm.website}
                  onChange={(e) => setStartupForm({ ...startupForm, website: e.target.value })}
                  placeholder="https://yourstartup.in"
                  className={inputCls}
                />
              </Field>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving Changes..." : "Save Business Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
