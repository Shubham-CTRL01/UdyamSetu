import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Lock, Eye, EyeOff, Landmark, Rocket, KeyRound,
  BadgeCheck, ShieldCheck, RefreshCw, CreditCard, Mail, AlertCircle, Loader2,
} from "lucide-react";

function TrackBadge({ icon: Icon, label, active, onClick, color }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active ? "bg-white shadow-md text-slate-800 border border-slate-200" : "text-slate-500 hover:text-slate-700"
      }`}>
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
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className="relative">
        <input type={inputType} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all" />
        {type === "password" && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
    <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${
      type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"
    }`}>
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      {message}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [track, setTrack] = useState("startup");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lang, setLang] = useState("en");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) { setError("Email and password are required."); return; }
    if (mode === "signup" && !fullName) { setError("Full name is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await signUp(email, password, fullName, phone);
        if (err) {
          setError(err.message);
        } else if (data?.session) {
          navigate("/dashboard");
        } else {
          setSuccess("Account created! Check your email to confirm, then sign in.");
          setMode("login");
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
        } else {
          navigate("/dashboard");
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
          <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-xs font-medium mb-6 transition-colors">
            ← Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-200 tracking-widest font-semibold uppercase">Official Sovereign Digital Exchange Gateway</span>
          </div>
        </div>
        <div className="relative z-10 my-10 lg:my-0 flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="font-extrabold text-[32px] sm:text-[38px] xl:text-[42px] tracking-tight text-white leading-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
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
            <span>Protected under the Government of India Cyber Security Policy framework. All SSO and API data transactions are cryptographically signed & audited.</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth pane */}
      <div className="flex-1 bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>e-Pramaan & JanParichay Gateway</span>
          </div>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {["en", "hi"].map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === l ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
                {l === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
        </div>

        {/* Form container */}
        <div className="max-w-xl w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="font-bold text-[28px] sm:text-[32px] text-slate-900 tracking-tight leading-snug" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {mode === "login" ? "Sign In to UdyamSetu" : "Create Your Account"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">Select your institutional track to securely access your portal.</p>
          </div>

          {/* Track switcher */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-8">
            <div className="flex gap-1.5">
              <TrackBadge icon={Landmark} label="Government & PSU" active={track === "govt"} onClick={() => setTrack("govt")} color="text-indigo-600" />
              <TrackBadge icon={Rocket} label="Startup & Innovator" active={track === "startup"} onClick={() => setTrack("startup")} color="text-amber-600" />
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert message={error} type="error" />}
            {success && <Alert message={success} type="success" />}

            {mode === "signup" && (
              <>
                <InputField label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rajesh Kumar" required />
                <InputField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </>
            )}
            <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 shadow-sm hover:shadow-md ${
                track === "startup" ? "bg-blue-700 hover:bg-blue-800 text-white" : "bg-[#0B192C] hover:bg-[#1E3E62] text-white"
              } disabled:opacity-60 disabled:cursor-not-allowed`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (track === "startup" ? <BadgeCheck className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />)}
              {loading ? "Please wait..." : (mode === "login" ? "Sign In Securely" : "Create Account")}
            </button>

            <div className="text-center text-xs text-slate-500">
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <button type="button" onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                    className="font-semibold text-blue-600 hover:underline">Create one free</button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    className="font-semibold text-blue-600 hover:underline">Sign in</button>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Secondary options */}
            <div className="grid grid-cols-2 gap-3">
              {track === "startup" ? (
                <>
                  <button type="button" onClick={() => {}} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                    <BadgeCheck className="w-4 h-4 text-slate-400" /> Startup India Cert
                  </button>
                  <button type="button" onClick={() => {}} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                    <CreditCard className="w-4 h-4 text-slate-400" /> MCA CIN / PAN
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => {}} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                    <Mail className="w-4 h-4 text-slate-400" /> Govt Email (.gov.in)
                  </button>
                  <button type="button" onClick={() => {}} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
                    <KeyRound className="w-4 h-4 text-slate-400" /> NIC SSO / e-Pramaan
                  </button>
                </>
              )}
            </div>

            {/* Info banner */}
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-left ${track === "startup" ? "bg-indigo-50/70 border-indigo-100" : "bg-blue-50/70 border-blue-100"}`}>
              <RefreshCw className={`w-5 h-5 mt-0.5 shrink-0 ${track === "startup" ? "text-indigo-600" : "text-blue-600"}`} />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-slate-900">
                  {track === "startup" ? "Automated DPIIT Registry Sync" : "JanParichay SSO v3.4 Enabled"}
                </strong>
                {track === "startup"
                  ? "Instant fetch of Certificate of Recognition, DPIIT registration number, and Section 80-IAC tax status."
                  : "Seamless identity authentication via official NIC credentials, Aadhaar-based OTP, or hardware digital signature token."}
              </div>
            </div>
          </form>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 UdyamSetu National Portal</span>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-slate-700">Security Policy</Link>
            <Link to="#" className="hover:text-slate-700">Terms of Access</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
