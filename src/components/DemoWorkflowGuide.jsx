import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { WORKFLOW_STAGES } from "../lib/demoData";
import {
  Landmark, Rocket, BrainCircuit, FileCheck, Target, Award,
  ArrowRight, ArrowLeft, X, ChevronUp, ChevronDown, Zap, Users,
  CheckCircle2, Sparkles, Database, RotateCcw
} from "lucide-react";
import { tempDb } from "../lib/tempDb";

const ICON_MAP = {
  Landmark,
  Rocket,
  BrainCircuit,
  FileCheck,
  Target,
  Award
};

export default function DemoWorkflowGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signInDemo } = useAuth();

  // Expanded or collapsed state
  const [isOpen, setIsOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Multilingual State: English or Hindi
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("udyam_lang") || "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    const onLanguageChange = () => {
      try {
        const saved = localStorage.getItem("udyam_lang");
        if (saved && (saved === "en" || saved === "hi")) {
          setLang(saved);
        }
      } catch (e) {}
    };
    window.addEventListener("languageChange", onLanguageChange);
    return () => window.removeEventListener("languageChange", onLanguageChange);
  }, []);

  // Detect current step from route
  useEffect(() => {
    const path = location.pathname;
    const state = location.state || {};

    if (path === "/government/dashboard" && state.section === "applications") {
      setCurrentStep(3);
    } else if (path.startsWith("/government/applications/")) {
      setCurrentStep(3);
    } else if (path === "/pilot-management/demo-pilot-1" && (state.scrollToResults || state.tab === "results")) {
      setCurrentStep(6);
    } else if (path.startsWith("/pilot-management/demo-pilot-1")) {
      setCurrentStep(5);
    } else if (path === "/pilot-management") {
      setCurrentStep(4);
    } else if (path.startsWith("/startup/dashboard")) {
      setCurrentStep(2);
    } else if (path.startsWith("/government/dashboard")) {
      setCurrentStep(1);
    }
  }, [location.pathname, location.state]);

  const handleExecuteStage = (stage) => {
    // 1. Check if we need to switch the demo account
    const needsSwitch =
      (stage.role === "government" && (!user || role !== "government")) ||
      (stage.role === "startup" && (!user || role !== "startup"));

    if (needsSwitch) {
      const demoKey = stage.role === "government" ? "janparichay" : "startup";
      signInDemo(demoKey);
    }

    setCurrentStep(stage.step);

    // 2. Navigate AFTER React state from signInDemo settles (setTimeout 0 lets the
    //    synchronous setState batch flush so ProtectedRoute sees the new role)
    const doNavigate = () => {
      navigate(stage.path, { state: stage.state || {} });

      // 3. If scrolling to results is requested
      if (stage.state?.scrollToResults) {
        setTimeout(() => {
          const el = document.getElementById("pilot-results-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 600);
      }
    };

    if (needsSwitch) {
      // Give React a tick to flush the state update from signInDemo
      setTimeout(doNavigate, 50);
    } else {
      doNavigate();
    }
  };

  const handleNext = () => {
    // WORKFLOW_STAGES is 0-indexed, steps are 1-6
    const nextStep = currentStep < 6 ? currentStep + 1 : 1;
    const nextStage = WORKFLOW_STAGES.find(s => s.step === nextStep) || WORKFLOW_STAGES[0];
    handleExecuteStage(nextStage);
  };

  const handlePrev = () => {
    const prevStep = currentStep > 1 ? currentStep - 1 : 6;
    const prevStage = WORKFLOW_STAGES.find(s => s.step === prevStep) || WORKFLOW_STAGES[0];
    handleExecuteStage(prevStage);
  };

  const toggleRole = () => {
    if (role === "government") {
      signInDemo("startup");
      setTimeout(() => navigate("/startup/dashboard"), 50);
    } else {
      signInDemo("janparichay");
      setTimeout(() => navigate("/government/dashboard"), 50);
    }
  };

  // Hide floating bar on /login page as login page embeds the full showcase
  if (location.pathname === "/login") {
    return null;
  }

  // If user minimized or dismissed
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0B192C] text-white shadow-xl hover:shadow-2xl border border-amber-400/40 text-xs font-bold transition-all hover:scale-105 cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Workflow Tour (Step {currentStep}/6)</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  const activeStage = WORKFLOW_STAGES.find((s) => s.step === currentStep) || WORKFLOW_STAGES[0];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none">
      <div className="max-w-6xl mx-auto bg-[#0B192C]/95 backdrop-blur-md text-white rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden pointer-events-auto transition-all animate-in slide-in-from-bottom-4 duration-200">
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* Header Bar */}
        <div className="px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {lang === "hi" ? "संप्रभु कार्यप्रवाह अनुकरण" : "Sovereign Workflow Simulation"}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  {lang === "hi" ? "मार्गदर्शित गाइड" : "Interactive Guide"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {lang === "hi"
                  ? "चुनौती प्रस्ताव → स्टार्टअप समाधान → एआई समीक्षा → पायलट अनुबंध → लाइव टेलीमेट्री → परिणाम व खरीद"
                  : "Challenge Proposal → Startup Proposal → AI Review → Pilot Contract → Live Telemetry → Results & Procurement"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Temp DB Sync Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold" title="Data is retained in local temporary database while switching accounts">
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden md:inline">{lang === "hi" ? "अस्थायी डेटाबेस सक्रिय" : "Temp DB: Active & Synced"}</span>
            </div>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => {
                if (window.confirm(lang === "hi" ? "क्या आप डेमो डेटा रीसेट करना चाहते हैं? सभी बनाए गए बदलाव प्रारंभिक स्थिति में लौट जाएंगे।" : "Reset temporary demo database back to clean defaults? All submitted challenges, applications and pilot steps will be restored to default seeds.")) {
                  tempDb.resetTempDb();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 text-[11px] font-medium transition-colors cursor-pointer"
              title="Reset temporary demo database back to default state"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">{lang === "hi" ? "रीसेट" : "Reset Demo"}</span>
            </button>

            <button
              onClick={toggleRole}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              title="Toggle role between Government and Startup"
            >
              <Users className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">{lang === "hi" ? "सक्रिय:" : "Active:"}</span>
              <strong className="text-white">
                {role === "government"
                  ? (lang === "hi" ? "सरकारी विभाग" : "Govt Department")
                  : (lang === "hi" ? "डीपीआईआईटी स्टार्टअप" : "DPIIT Startup")}
              </strong>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isOpen ? "Collapse Stages" : "Expand Stages"}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Minimize guide bar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Stages (collapsible) */}
        {isOpen && (
          <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {WORKFLOW_STAGES.map((stage) => {
                const Icon = ICON_MAP[stage.icon] || Target;
                const isActive = stage.step === currentStep;
                const isPassed = stage.step < currentStep;
                const stageTitle = lang === "hi" ? (stage.shortTitleHi || stage.shortTitle) : stage.shortTitle;
                const stageCaption = lang === "hi" ? (stage.captionHi || stage.caption) : stage.caption;
                const stageRoleBadge = lang === "hi" ? (stage.badgeHi || stage.badge) : (stage.role === "government" ? "Govt" : "Startup");

                return (
                  <button
                    key={stage.id}
                    onClick={() => handleExecuteStage(stage)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                      isActive
                        ? "bg-indigo-600/30 border-indigo-400 shadow-md ring-2 ring-indigo-500/30"
                        : isPassed
                        ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                        : "bg-slate-800/20 border-slate-800 hover:bg-slate-800/60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-indigo-500 text-white" : isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                        stage.role === "government" ? "bg-blue-500/20 text-blue-300 border-blue-400/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                      }`}>
                        {stageRoleBadge}
                      </span>
                    </div>

                    <div>
                      <div className={`text-xs font-bold line-clamp-1 ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                        {stageTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {stageCaption}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage Action Footer */}
        <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#0B192C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-extrabold text-amber-400 shrink-0">
              {lang === "hi" ? `चरण ${activeStage.step}/6:` : `Stage ${activeStage.step}/6:`}
            </span>
            <span className="font-bold text-white truncate">
              {lang === "hi" ? (activeStage.titleHi || activeStage.title) : activeStage.title}
            </span>
            <span className="text-slate-400 hidden md:inline truncate">
              — {lang === "hi" ? (activeStage.captionHi || activeStage.description) : activeStage.description}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{lang === "hi" ? "पिछला" : "Back"}</span>
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>{lang === "hi" ? "अगला चरण" : "Next Stage"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
