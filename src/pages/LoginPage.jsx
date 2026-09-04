import { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Landmark,
  Rocket,
  KeyRound,
  Mail,
  CreditCard,
  BadgeCheck,
  Building2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

// ── Reusable small components ──────────────────────────────────────────────────

function TrackBadge({ icon: Icon, label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-white shadow-md text-slate-800 border border-slate-200"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? color : "text-slate-400"}`} />
      <span>{label}</span>
    </button>
  );
}

function PrimaryBtn({ children, onClick, className = "", icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 shadow-sm hover:shadow-md ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}

function OutlineBtn({ children, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
    >
      {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      {children}
    </button>
  );
}

function InfoBanner({ icon: Icon, iconClass, title, children, bgClass, borderClass }) {
  return (
    <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-left ${bgClass} ${borderClass}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="text-xs text-slate-700 leading-relaxed">
        <strong className="font-semibold block mb-0.5 text-slate-900">{title}</strong>
        {children}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LoginPage({ onNavigate }) {
  const [track, setTrack] = useState("startup"); // "govt" | "startup"
  const [lang, setLang] = useState("en");

  const t = {
    en: {
      heading: "Sign In to UdyamSetu",
      subheading: "Select your institutional track to securely access your portal.",
    },
    hi: {
      heading: "उद्यम सेतु में साइन इन करें",
      subheading: "अपने संस्थागत ट्रैक का चयन करके सुरक्षित रूप से पोर्टल एक्सेस करें।",
    },
  };

  const copy = t[lang];

  const handleSignIn = () => {
    if (onNavigate) onNavigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full">

      {/* ── LEFT: Sovereign authority pane ──────────────────────────────────── */}
      <div className="relative w-full lg:w-[46%] xl:w-[44%] bg-gradient-to-br from-[#0B192C] via-[#10243E] to-[#1E3E62] text-white flex flex-col justify-between overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-slate-700/60 p-8 sm:p-12 lg:p-14">

        {/* Watermark bridge graphic */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
          <svg
            className="absolute -right-20 -bottom-20 w-[550px] h-[550px] text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 400 400"
          >
            <circle cx="200" cy="200" r="160" strokeDasharray="8 8" strokeWidth="2" />
            <circle cx="200" cy="200" r="110" strokeWidth="1.5" />
            <path d="M40 280 C120 160, 280 160, 360 280" strokeWidth="4" />
            <line x1="40" y1="280" x2="360" y2="280" strokeWidth="2" />
            <line x1="200" y1="160" x2="200" y2="280" strokeDasharray="4 4" strokeWidth="2" />
            <circle cx="120" cy="220" r="12" strokeWidth="2" />
            <circle cx="200" cy="180" r="16" strokeWidth="2" />
            <circle cx="280" cy="220" r="12" strokeWidth="2" />
          </svg>
        </div>

        {/* Top badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-200 tracking-widest font-semibold uppercase">
              Official Sovereign Digital Exchange Gateway
            </span>
          </div>
        </div>

        {/* Center: headline + trust badges */}
        <div className="relative z-10 my-10 lg:my-0 flex flex-col gap-6">
          <div className="space-y-3">
            <h1
              className="font-extrabold text-[32px] sm:text-[38px] xl:text-[42px] tracking-tight text-white leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Bridging National Governance &amp; High-Growth Startups
            </h1>
            <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed max-w-lg">
              A unified, interoperable exchange enabling public sector departments to pilot, procure, and scale verified indigenous innovations with zero friction.
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: BadgeCheck, color: "text-amber-400", title: "Digital India", sub: "National Initiative" },
              { icon: Rocket, color: "text-emerald-400", title: "DPIIT Recognized", sub: "Startup India Aligned" },
              { icon: Building2, color: "text-sky-400", title: "MSME Sambandh", sub: "Registered Platform" },
              { icon: ShieldCheck, color: "text-violet-400", title: "ISO 27001", sub: "Security Certified" },
            ].map(({ icon: Icon, color, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-2.5 bg-white/[0.07] border border-white/10 rounded-lg p-2.5 backdrop-blur-sm"
              >
                <Icon className={`${color} w-5 h-5 shrink-0`} />
                <div>
                  <div className="font-semibold text-xs text-white">{title}</div>
                  <div className="text-[10px] text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: security assurance */}
        <div className="relative z-10 pt-4 border-t border-white/15">
          <div className="flex items-start gap-3 text-slate-400 text-xs leading-relaxed">
            <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Protected under the Government of India Cyber Security Policy framework. All SSO and API data transactions are cryptographically signed &amp; audited.
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Authentication pane ───────────────────────────────────────── */}
      <div className="flex-1 bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">

        {/* Top utility bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>e-Pramaan &amp; JanParichay Gateway</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors">
              <span>Helpdesk</span>
            </button>
            <div className="w-px h-4 bg-slate-300" />
            {/* Language switcher */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "en" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  lang === "hi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="max-w-xl w-full mx-auto my-auto py-8">

          {/* Title */}
          <div className="mb-8">
            <h2
              className="font-bold text-[28px] sm:text-[32px] text-slate-900 tracking-tight leading-snug"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {copy.heading}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">{copy.subheading}</p>
          </div>

          {/* Track switcher */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 mb-8">
            <div className="flex gap-1.5">
              <TrackBadge
                icon={Landmark}
                label="Government & PSU"
                active={track === "govt"}
                onClick={() => setTrack("govt")}
                color="text-indigo-600"
              />
              <TrackBadge
                icon={Rocket}
                label="Startup & Innovator"
                active={track === "startup"}
                onClick={() => setTrack("startup")}
                color="text-amber-600"
              />
            </div>
          </div>

          {/* ── GOVT TRACK ────────────────────────────────────────────────── */}
          {track === "govt" && (
            <div className="flex flex-col gap-5">
              {/* Info card */}
              <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Central, State &amp; PSU Department Login</h3>
                  <p className="text-xs text-slate-500">Access pilot approvals, procurement tenders, and verified innovations</p>
                </div>
              </div>

              {/* Primary CTA */}
              <PrimaryBtn
                icon={KeyRound}
                onClick={handleSignIn}
                className="bg-[#0B192C] hover:bg-[#1E3E62] text-white"
              >
                Sign In with JanParichay / MeriPehchaan
              </PrimaryBtn>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Secondary options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OutlineBtn icon={Mail} onClick={handleSignIn}>
                  Govt Email (.gov.in / .nic.in)
                </OutlineBtn>
                <OutlineBtn icon={KeyRound} onClick={handleSignIn}>
                  NIC SSO / e-Pramaan Token
                </OutlineBtn>
              </div>

              {/* Info banner */}
              <InfoBanner
                icon={ShieldCheck}
                iconClass="text-blue-600"
                title="JanParichay SSO v3.4 Enabled"
                bgClass="bg-blue-50/70"
                borderClass="border-blue-100"
              >
                Seamless identity authentication via official NIC credentials, Aadhaar-based OTP, or hardware digital signature token.
              </InfoBanner>
            </div>
          )}

          {/* ── STARTUP TRACK ──────────────────────────────────────────────── */}
          {track === "startup" && (
            <div className="flex flex-col gap-5">
              {/* Info card */}
              <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Startup &amp; Innovator Access Portal</h3>
                  <p className="text-xs text-slate-500">Submit pilot proposals, apply for GeM onboarding &amp; track trials</p>
                </div>
              </div>

              {/* Primary CTA */}
              <PrimaryBtn
                icon={BadgeCheck}
                onClick={handleSignIn}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                DPIIT Verification / OAuth
              </PrimaryBtn>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Secondary options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <OutlineBtn icon={BadgeCheck} onClick={handleSignIn}>
                  Startup India Cert Lookup
                </OutlineBtn>
                <OutlineBtn icon={CreditCard} onClick={handleSignIn}>
                  MCA CIN / PAN Login
                </OutlineBtn>
              </div>

              {/* Info banner */}
              <InfoBanner
                icon={RefreshCw}
                iconClass="text-indigo-600"
                title="Automated DPIIT Registry Sync"
                bgClass="bg-indigo-50/70"
                borderClass="border-indigo-100"
              >
                Instant fetch of Certificate of Recognition, DPIIT registration number, and Section 80-IAC tax status.
              </InfoBanner>
            </div>
          )}
        </div>

        {/* Bottom footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 UdyamSetu National Portal</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-slate-700 transition-colors">Security Policy</button>
            <button className="hover:text-slate-700 transition-colors">Terms of Access</button>
          </div>
        </div>
      </div>
    </div>
  );
}
