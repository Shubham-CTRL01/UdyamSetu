import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Lock, Eye, EyeOff, Landmark, Rocket, KeyRound,
  BadgeCheck, ShieldCheck, RefreshCw, AlertCircle, Loader2, Zap
} from "lucide-react";

function TrackBadge({ icon: Icon, label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-white shadow-md text-slate-900 border border-slate-200"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? color : "text-slate-400"}`} />
      <span>{label}</span>
    </button>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" ? (show ? "text" : "password") : type;
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Alert({ message, type = "error" }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${
        type === "error"
          ? "bg-red-50 border border-red-200 text-red-700"
          : "bg-emerald-50 border border-emerald-200 text-emerald-700"
      }`}
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

const SECTORS = [
  "Deep Tech",
  "Defence & Aerospace",
  "HealthTech & Life Sciences",
  "CleanTech & Renewable Energy",
  "AgriTech & Food Processing",
  "Smart Cities & Infrastructure",
  "Cybersecurity & AI",
  "FinTech & GovTech",
  "Manufacturing & Robotics",
  "Other"
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signInDemo } = useAuth();

  // Mode: "login" or "signup"
  const [mode, setMode] = useState("login");
  // Role for registration: "government" or "startup"
  const [role, setRole] = useState("startup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lang, setLang] = useState("en");

  // Common credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Role-specific fields
  const [organizationName, setOrganizationName] = useState("");
  const [designation, setDesignation] = useState("");
  const [govtLevel, setGovtLevel] = useState("Central Ministry");
  const [sector, setSector] = useState("Deep Tech");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const handleDemoLogin = (demoKey) => {
    const demo = signInDemo(demoKey);
    const destination =
      demo.profile.role === "government" ? "/government/dashboard" : "/startup/dashboard";
    navigate(destination);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName) {
          setError(role === "government" ? "Official Name is required." : "Founder / Representative Name is required.");
          setLoading(false);
          return;
        }
        if (!organizationName) {
          setError(role === "government" ? "Department/Ministry name is required." : "Startup name is required.");
          setLoading(false);
          return;
        }

        const roleData = {
          role,
          fullName,
          phone,
          organizationName,
          designation: role === "government" ? designation : "",
          govtLevel: role === "government" ? govtLevel : "",
          sector: role === "startup" ? sector : "",
          description,
          website,
        };

        const { data, error: err } = await signUp(email, password, roleData);
        if (err) {
          setError(err.message);
        } else if (data?.session) {
          // Immediately redirect to user's role-based dashboard
          navigate(role === "government" ? "/government/dashboard" : "/startup/dashboard");
        } else {
          setSuccess(
            role === "government"
              ? "Government registration submitted! Verification is pending administrator approval."
              : "Account registered! Please sign in with your credentials."
          );
          setMode("login");
        }
      } else {
        // Unified Sign-In
        const { profile, role: userRole, error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
        } else {
          const targetRole = profile?.role || userRole;
          const destination =
            targetRole === "government" ? "/government/dashboard" : "/startup/dashboard";
          navigate(destination);
        }
      }
    } catch (errObj) {
      setError(errObj?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">
      {/* LEFT: Sovereign pane */}
      <div className="relative w-full lg:w-[46%] xl:w-[44%] bg-gradient-to-br from-[#0B192C] via-[#10243E] to-[#1E3E62] text-white flex flex-col justify-between overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-slate-700/60 p-8 sm:p-12 lg:p-14">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
          <svg className="absolute -right-20 -bottom-20 w-[550px] h-[550px] text-white" fill="none" stroke="currentColor" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="160" strokeDasharray="8 8" strokeWidth="2" />
            <circle cx="200" cy="200" r="110" strokeWidth="1.5" />
            <path d="M40 280 C120 160, 280 160, 360 280" strokeWidth="4" />
            <line x1="40" y1="280" x2="360" y2="280" strokeWidth="2" />
            <line x1="200" y1="160" x2="200" y2="280" strokeDasharray="4 4" strokeWidth="2" />
          </svg>
        </div>
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs font-medium mb-4 transition-colors">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="UdyamSetu" className="w-11 h-11 rounded-xl bg-white p-1 object-contain shadow-md" />
            <div>
              <span className="text-white font-extrabold text-lg tracking-tight block leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                UdyamSetu
              </span>
              <span className="text-slate-300 text-[11px] font-medium">उद्यम सेतु</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-200 tracking-widest font-semibold uppercase">Official Sovereign Digital Exchange Gateway</span>
          </div>
        </div>
        <div className="relative z-10 my-10 lg:my-0 flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="font-extrabold text-[32px] sm:text-[38px] xl:text-[42px] tracking-tight text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Bridging National Governance & High-Growth Startups
            </h1>
            <p className="text-slate-300 text-[15px] leading-relaxed max-w-lg">
              A unified, interoperable exchange enabling public sector departments to pilot, procure, and scale verified indigenous innovations with zero friction.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: BadgeCheck, color: "text-amber-400", title: "Digital India", sub: "National Initiative" },
              { icon: Rocket, color: "text-emerald-400", title: "DPIIT Recognized", sub: "Startup India Aligned" },
              { icon: ShieldCheck, color: "text-sky-400", title: "ISO 27001", sub: "Security Certified" },
              { icon: KeyRound, color: "text-violet-400", title: "JanParichay", sub: "SSO v3.4 Enabled" },
            ].map(({ icon: Icon, color, title, sub }) => (
              <div key={title} className="flex items-center gap-2.5 bg-white/[0.07] border border-white/10 rounded-lg p-2.5 backdrop-blur-sm">
                <Icon className={`${color} w-5 h-5 shrink-0`} />
                <div>
                  <div className="font-semibold text-xs text-white">{title}</div>
                  <div className="text-[10px] text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 pt-4 border-t border-white/15">
          <div className="flex items-start gap-3 text-slate-400 text-xs leading-relaxed">
            <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>Protected under the Government of India Cyber Security Policy framework. Role-based cryptographic access control with audited transaction trails.</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth pane */}
      <div className="flex-1 bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>e-Pramaan & Sovereign Gateway</span>
          </div>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {["en", "hi"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === l ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                }`}
              >
                {l === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
        </div>

        {/* Form container */}
        <div className="max-w-xl w-full mx-auto my-auto py-8">
          {/* Quick Demo Access Bar */}
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/70 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <Zap className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>⚡ Instant Demo Access (One-Click Evaluation)</span>
            </div>
            <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
              Bypass registration and evaluate the role-based portals instantly with pre-verified credentials:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("government_verified")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
              >
                <Landmark className="w-3.5 h-3.5 text-amber-400" />
                <span>🏛️ Govt Dept (Verified)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("startup")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md"
              >
                <Rocket className="w-3.5 h-3.5 text-amber-400" />
                <span>🚀 Startup Innovator</span>
              </button>
            </div>
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => handleDemoLogin("government_pending")}
                className="text-[11px] font-semibold text-indigo-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Test Govt Dept Pending Review Flow →</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-bold text-[28px] sm:text-[32px] text-slate-900 tracking-tight leading-snug" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {mode === "login" ? "Sign In to UdyamSetu" : "Get Started on UdyamSetu"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {mode === "login"
                ? "Enter your credentials below, or click any of the 1-click Demo buttons above."
                : "Select your institutional track to create your official verified profile."}
            </p>
          </div>

          {/* Role selector on Signup */}
          {mode === "signup" && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                I am registering as:
              </label>
              <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/80">
                <div className="flex gap-1.5">
                  <TrackBadge
                    icon={Landmark}
                    label="Government Department"
                    active={role === "government"}
                    onClick={() => setRole("government")}
                    color="text-indigo-600"
                  />
                  <TrackBadge
                    icon={Rocket}
                    label="Startup / Innovator"
                    active={role === "startup"}
                    onClick={() => setRole("startup")}
                    color="text-amber-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert message={error} type="error" />}
            {success && <Alert message={success} type="success" />}

            {mode === "signup" && (
              <>
                {/* Government Registration Fields */}
                {role === "government" ? (
                  <>
                    <InputField
                      label="Department / Ministry Name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Ministry of Railways, DRDO, Smart City Mission"
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Government Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={govtLevel}
                          onChange={(e) => setGovtLevel(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                        >
                          <option value="Central Ministry">Central Ministry</option>
                          <option value="State Department">State Department</option>
                          <option value="Local / Municipal Body">Local / Municipal Body</option>
                          <option value="Public Sector Undertaking (PSU)">Public Sector Undertaking (PSU)</option>
                        </select>
                      </div>
                      <InputField
                        label="Official Department Website / Portal"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://railways.gov.in"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label="Official Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Rajesh Kumar"
                        required
                      />
                      <InputField
                        label="Designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Director, Mission Lead"
                      />
                    </div>
                    <InputField
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Department Mandate / Description <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief overview of department procurement or pilot scope..."
                        rows={2}
                        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all resize-none"
                      />
                    </div>

                    {/* Government Verification Notice */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold text-amber-900 mb-0.5">
                          Verification Required Before Publishing Challenges
                        </strong>
                        Newly registered government departments are placed in <span className="font-bold underline">Pending Verification</span>. Portal administrators review department credentials before challenge publication and startup application review access is enabled.
                      </div>
                    </div>
                  </>
                ) : (
                  /* Startup Registration Fields */
                  <>
                    <InputField
                      label="Startup Name"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. NeuroSync Technologies Pvt Ltd"
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label="Founder / Representative Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Priya Sharma"
                        required
                      />
                      <InputField
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Industry / Sector <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                      >
                        {SECTORS.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label="Website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourstartup.in"
                      />
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Brief Innovation Summary
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. AI-driven logistics optimization"
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <InputField
              label={mode === "signup" && role === "government" ? "Official Govt Email (.gov.in / nic.in / institutional)" : "Email Address"}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.org"
              required
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min. 6 characters)"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 shadow-sm hover:shadow-md ${
                mode === "signup" && role === "government"
                  ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                  : "bg-[#0B192C] hover:bg-[#1E3E62] text-white"
              } disabled:opacity-60 disabled:cursor-not-allowed mt-2`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                <KeyRound className="w-4 h-4" />
              ) : role === "government" ? (
                <Landmark className="w-4 h-4" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {loading
                ? "Verifying..."
                : mode === "login"
                ? "Sign In Securely"
                : role === "government"
                ? "Register Government Department"
                : "Register Startup Profile"}
            </button>

            <div className="text-center text-xs text-slate-500 pt-1">
              {mode === "login" ? (
                <>
                  New to UdyamSetu?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>

            {/* Sovereign Institutional Guarantee */}
            <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-100/70 flex items-start gap-3 text-left">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-slate-800">
                  Unified National Single-Window Authentication
                </strong>
                Credentials grant instant access to your verified portal track. Startups explore live government challenges; departments propose and review national tenders.
              </div>
            </div>
          </form>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 UdyamSetu National Exchange</span>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-slate-700">Security Policy</Link>
            <Link to="#" className="hover:text-slate-700">Terms of Access</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
