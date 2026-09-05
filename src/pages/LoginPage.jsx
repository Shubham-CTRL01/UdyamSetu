import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Lock, Eye, EyeOff, Landmark, Rocket, KeyRound,
  BadgeCheck, ShieldCheck, RefreshCw, AlertCircle, Loader2, ArrowLeft
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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

const SECTOR_NAMES_HI = {
  "Deep Tech": "डीप टेक (गहन प्रौद्योगिकी)",
  "Defence & Aerospace": "रक्षा एवं एयरोस्पेस",
  "HealthTech & Life Sciences": "स्वास्थ्य तकनीक एवं जीव विज्ञान",
  "CleanTech & Renewable Energy": "स्वच्छ तकनीक एवं नवीकरणीय ऊर्जा",
  "AgriTech & Food Processing": "कृषि तकनीक एवं खाद्य प्रसंस्करण",
  "Smart Cities & Infrastructure": "स्मार्ट सिटी एवं अवसंरचना",
  "Cybersecurity & AI": "साइबर सुरक्षा एवं कृत्रिम बुद्धिमत्ता (AI)",
  "FinTech & GovTech": "वित्तीय एवं शासन प्रौद्योगिकी (GovTech)",
  "Manufacturing & Robotics": "उन्नत विनिर्माण एवं रोबोटिक्स",
  "Other": "अन्य नवाचार क्षेत्र"
};

const TRANSLATIONS = {
  en: {
    backHome: "← Back to Home",
    sovereignBadge: "Official Sovereign Digital Exchange Gateway",
    heroTitle: "Bridging National Governance & High-Growth Startups",
    heroDesc: "A unified, interoperable exchange enabling public sector departments to pilot, procure, and scale verified indigenous innovations with zero friction.",
    badgeDigitalIndia: "Digital India",
    badgeDigitalIndiaSub: "National Initiative",
    badgeDpiit: "DPIIT Recognized",
    badgeDpiitSub: "Startup India Aligned",
    badgeIso: "ISO 27001",
    badgeIsoSub: "Security Certified",
    badgeJanparichay: "JanParichay",
    badgeJanparichaySub: "SSO v3.4 Enabled",
    leftSecurityNoticePre: "Protected under the Government of India ",
    cyberSecurityPolicy: "Cyber Security Policy",
    leftSecurityNoticePost: " framework. Role-based cryptographic access control with audited transaction trails.",

    gatewayBadge: "e-Pramaan & Sovereign Gateway",
    secPolicy: "Security Policy",
    termsOfAccess: "Terms of Access",

    signInTitle: "Sign In to UdyamSetu",
    signUpTitle: "Get Started on UdyamSetu",
    signInSub: "National digital gateway for public sector departments and high-growth startups.",
    signUpSub: "Select your institutional track to create your official verified profile.",

    dualAuthTitle: "Dual Auth Pathway",
    selectGateway: "Select Institutional Gateway",
    janparichayTitle: "JanParichay",
    janparichayBadge: "जनपरिचय",
    janparichaySub: "National Single Sign-On (NSSO)",
    janparichayDescPrefix: "Government Official Gate • Sovereign SSO login via ",
    janparichayBtn: "Sign In with JanParichay →",
    janparichayLoading: "Connecting to NSSO...",

    startupIndiaTitle: "Startup India",
    startupIndiaBadge: "DPIIT",
    startupIndiaSub: "Startup Innovation Pathway",
    startupIndiaDesc: "Startup Pathway • Instant verified access for DPIIT recognized innovators & MSMEs",
    startupIndiaBtn: "Sign In as Startup →",

    orEmailPassword: "Or sign in with email & password",

    registeringAs: "I am registering as:",
    govtDeptTrack: "Government Department",
    startupTrack: "Startup / Innovator",

    govtDeptName: "Department / Ministry Name",
    govtDeptNamePh: "e.g. Ministry of Railways, DRDO, Smart City Mission",
    govtLevel: "Government Level",
    govtPortal: "Official Department Website / Portal",
    govtPortalPh: "https://railways.gov.in",
    officialName: "Official Name",
    officialNamePh: "Dr. Rajesh Kumar",
    designation: "Designation",
    designationPh: "e.g. Director, Mission Lead",
    phone: "Phone Number",
    deptMandate: "Department Mandate / Description",
    optional: "(optional)",
    deptMandatePh: "Brief overview of department procurement or pilot scope...",

    verificationNoticeTitle: "Verification Required Before Publishing Challenges",
    verificationNoticeDesc: "Newly registered government departments are placed in Pending Verification. Portal administrators review department credentials before challenge publication and startup application review access is enabled.",

    startupName: "Startup Name",
    startupNamePh: "e.g. NeuroSync Technologies Pvt Ltd",
    founderName: "Founder / Representative Name",
    founderNamePh: "Priya Sharma",
    industrySector: "Industry / Sector",
    dpiitIdLabel: "DPIIT Recognition Number (DPIIT ID)",
    dpiitIdPh: "e.g. DIPP12345",
    website: "Website",
    websitePh: "https://yourstartup.in",
    innovationSummary: "Brief Innovation Summary",
    innovationSummaryPh: "e.g. AI-driven logistics optimization",

    govtEmailLabel: "Official Govt Email (.gov.in / nic.in / institutional)",
    emailLabel: "Email Address",
    emailPh: "you@institution.org",
    passwordLabel: "Password",
    passwordPh: "•••••••• (min. 6 characters)",

    verifying: "Verifying...",
    signInSecurely: "Sign In Securely",
    registerGovt: "Register Government Department",
    registerStartup: "Register Startup Profile",

    consentPre: "By continuing, you agree to UdyamSetu's ",
    consentAnd: " and ",
    consentPost: ".",

    newToUdyamSetu: "New to UdyamSetu?",
    createAccount: "Create an account",
    alreadyRegistered: "Already registered?",
    signInLink: "Sign In",

    guaranteeTitle: "Unified National Single-Window Authentication",
    guaranteeDesc: "Credentials grant instant access to your verified portal track. Startups explore live government challenges; departments propose and review national tenders.",
    copyright: "© 2026 UdyamSetu National Exchange",

    govtLevels: {
      "Central Ministry": "Central Ministry",
      "State Department": "State Department",
      "Local / Municipal Body": "Local / Municipal Body",
      "Public Sector Undertaking (PSU)": "Public Sector Undertaking (PSU)",
    },

    toastJanParichay: "Authenticated via JanParichay (जनपरिचय) NSSO Gateway. Redirecting to Government Dashboard...",
    toastStartup: "Authenticated via Startup India Gateway. Redirecting to Startup Dashboard...",
    errEmailPassword: "Email and password are required.",
    errPasswordLength: "Password must be at least 6 characters.",
    errOfficialName: "Official Name is required.",
    errFounderName: "Founder / Representative Name is required.",
    errDeptName: "Department/Ministry name is required.",
    errStartupName: "Startup name is required.",
  },
  hi: {
    backHome: "← मुखपृष्ठ पर वापस जाएं",
    sovereignBadge: "आधिकारिक संप्रभु डिजिटल एक्सचेंज प्रवेश द्वार",
    heroTitle: "राष्ट्रीय सुशासन एवं अग्रणी स्टार्टअप्स का सेतु",
    heroDesc: "एक एकीकृत, अंतर-संचालनीय विनिमय जो सार्वजनिक क्षेत्र के विभागों को बिना किसी बाधा के सत्यापित स्वदेशी नवाचारों का परीक्षण, अधिप्राप्ति और विस्तार करने में सक्षम बनाता है।",
    badgeDigitalIndia: "डिजिटल इंडिया",
    badgeDigitalIndiaSub: "राष्ट्रीय पहल",
    badgeDpiit: "डीपीआईआईटी मान्यता प्राप्त",
    badgeDpiitSub: "स्टार्टअप इंडिया संलग्न",
    badgeIso: "आईएसओ 27001",
    badgeIsoSub: "सुरक्षा प्रमाणित",
    badgeJanparichay: "जनपरिचय",
    badgeJanparichaySub: "एन.एस.एस.ओ. v3.4 सक्षम",
    leftSecurityNoticePre: "भारत सरकार के ",
    cyberSecurityPolicy: "साइबर सुरक्षा नीति",
    leftSecurityNoticePost: " ढांचे के अंतर्गत संरक्षित। लेखापरीक्षित लेन-देन ट्रैल्स के साथ भूमिका-आधारित क्रिप्टोग्राफिक एक्सेस नियंत्रण।",

    gatewayBadge: "ई-प्रमाण एवं संप्रभु प्रवेश द्वार",
    secPolicy: "सुरक्षा नीति",
    termsOfAccess: "उपयोग की शर्तें",

    signInTitle: "उद्यमसेतु में साइन इन करें",
    signUpTitle: "उद्यमसेतु पर नया खाता बनाएं",
    signInSub: "सार्वजनिक क्षेत्र के विभागों एवं उच्च-विकास स्टार्टअप्स हेतु राष्ट्रीय डिजिटल प्रवेश द्वार।",
    signUpSub: "अपनी आधिकारिक सत्यापित प्रोफाइल बनाने के लिए संस्थागत मार्ग चुनें।",

    dualAuthTitle: "द्वैध प्रमाणीकरण मार्ग",
    selectGateway: "संस्थागत प्रवेश द्वार चुनें",
    janparichayTitle: "जनपरिचय",
    janparichayBadge: "जनपरिचय",
    janparichaySub: "राष्ट्रीय एकल साइन-ऑन (NSSO)",
    janparichayDescPrefix: "सरकारी अधिकारी प्रवेश • के माध्यम से संप्रभु एसएसओ लॉग इन ",
    janparichayBtn: "जनपरिचय से साइन इन करें →",
    janparichayLoading: "एन.एस.एस.ओ. से जुड़ रहा है...",

    startupIndiaTitle: "स्टार्टअप इंडिया",
    startupIndiaBadge: "डीपीआईआईटी",
    startupIndiaSub: "स्टार्टअप नवाचार मार्ग",
    startupIndiaDesc: "स्टार्टअप मार्ग • डीपीआईआईटी मान्यता प्राप्त नवप्रवर्तकों एवं एमएसएमई हेतु त्वरित सत्यापित प्रवेश",
    startupIndiaBtn: "स्टार्टअप के रूप में साइन इन करें →",

    orEmailPassword: "या ईमेल और पासवर्ड से साइन इन करें",

    registeringAs: "मैं पंजीकरण कर रहा हूँ:",
    govtDeptTrack: "सरकारी विभाग / मंत्रालय",
    startupTrack: "स्टार्टअप / नवप्रवर्तक",

    govtDeptName: "विभाग / मंत्रालय का नाम",
    govtDeptNamePh: "उदा. रेल मंत्रालय, डीआरडीओ, स्मार्ट सिटी मिशन",
    govtLevel: "प्रशासनिक स्तर",
    govtPortal: "आधिकारिक विभाग वेबसाइट / पोर्टल",
    govtPortalPh: "https://railways.gov.in",
    officialName: "अधिकारी का पूरा नाम",
    officialNamePh: "उदा. डॉ. राजेश कुमार",
    designation: "पदनाम",
    designationPh: "उदा. निदेशक, मिशन प्रमुख",
    phone: "फ़ोन नंबर",
    deptMandate: "विभागीय शासनादेश / विवरण",
    optional: "(वैकल्पिक)",
    deptMandatePh: "विभागीय खरीद या पायलट सैंडबॉक्स दायरे का संक्षिप्त विवरण...",

    verificationNoticeTitle: "चुनौतियां प्रकाशित करने से पूर्व सत्यापन आवश्यक",
    verificationNoticeDesc: "नए पंजीकृत सरकारी विभागों को 'सत्यापन लंबित' स्थिति में रखा जाता है। चुनौती प्रकाशन और स्टार्टअप आवेदन समीक्षा सक्षम होने से पहले पोर्टल व्यवस्थापक साख की पुष्टि करते हैं।",

    startupName: "स्टार्टअप / कंपनी का नाम",
    startupNamePh: "उदा. न्यूरोसिंक टेक्नोलॉजीज प्राइवेट लिमिटेड",
    founderName: "संस्थापक / प्रतिनिधि का नाम",
    founderNamePh: "उदा. प्रिया शर्मा",
    industrySector: "उद्योग / क्षेत्र",
    dpiitIdLabel: "डीपीआईआईटी मान्यता संख्या (DPIIT ID)",
    dpiitIdPh: "उदा. DIPP12345",
    website: "वेबसाइट",
    websitePh: "https://yourstartup.in",
    innovationSummary: "नवाचार का संक्षिप्त सारांश",
    innovationSummaryPh: "उदा. एआई-आधारित लॉजिस्टिक्स अनुकूलन प्रणाली",

    govtEmailLabel: "आधिकारिक सरकारी ईमेल (.gov.in / nic.in / संस्थागत)",
    emailLabel: "ईमेल पता",
    emailPh: "apka.naam@institution.org",
    passwordLabel: "पासवर्ड",
    passwordPh: "•••••••• (न्यूनतम 6 अक्षर)",

    verifying: "सत्यापित हो रहा है...",
    signInSecurely: "सुरक्षित साइन इन करें",
    registerGovt: "सरकारी विभाग पंजीकृत करें",
    registerStartup: "स्टार्टअप प्रोफाइल पंजीकृत करें",

    consentPre: "जारी रखकर, आप उद्यमसेतु की ",
    consentAnd: " एवं ",
    consentPost: " से सहमत होते हैं।",

    newToUdyamSetu: "उद्यमसेतु पर नए हैं?",
    createAccount: "नया खाता बनाएं",
    alreadyRegistered: "पहले से पंजीकृत हैं?",
    signInLink: "साइन इन करें",

    guaranteeTitle: "एकीकृत राष्ट्रीय एकल-खिड़की प्रमाणीकरण",
    guaranteeDesc: "प्रमाणपत्र आपके सत्यापित पोर्टल मार्ग तक त्वरित पहुँच प्रदान करते हैं। स्टार्टअप्स सक्रिय सरकारी चुनौतियों का अन्वेषण करते हैं; विभाग राष्ट्रीय निविदाएं प्रस्तावित और समीक्षित करते हैं।",
    copyright: "© 2026 उद्यमसेतु राष्ट्रीय विनिमय",

    govtLevels: {
      "Central Ministry": "केंद्रीय मंत्रालय",
      "State Department": "राज्य सरकार विभाग",
      "Local / Municipal Body": "स्थानीय / नगर निकाय",
      "Public Sector Undertaking (PSU)": "सार्वजनिक क्षेत्र उपक्रम (PSU)",
    },

    toastJanParichay: "जनपरिचय (JanParichay) NSSO प्रवेश द्वार द्वारा सत्यापित। सरकारी डैशबोर्ड पर निर्देशित किया जा रहा है...",
    toastStartup: "डीपीआईआईटी स्टार्टअप इंडिया प्रवेश द्वार द्वारा सत्यापित। स्टार्टअप डैशबोर्ड पर निर्देशित किया जा रहा है...",
    errEmailPassword: "ईमेल और पासवर्ड आवश्यक हैं।",
    errPasswordLength: "पासवर्ड न्यूनतम 6 अक्षरों का होना चाहिए।",
    errOfficialName: "अधिकारी का नाम आवश्यक है।",
    errFounderName: "संस्थापक / प्रतिनिधि का नाम आवश्यक है।",
    errDeptName: "विभाग/मंत्रालय का नाम आवश्यक है।",
    errStartupName: "स्टार्टअप का नाम आवश्यक है।",
  }
};

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
  
  // Multilingual State: English or Hindi
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("udyam_lang") || "en";
    } catch {
      return "en";
    }
  });

  const handleLangChange = (l) => {
    setLang(l);
    try {
      localStorage.setItem("udyam_lang", l);
      window.dispatchEvent(new Event("languageChange"));
    } catch (e) {
      console.warn("Could not persist language preference:", e);
    }
  };

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

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

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
  const [dpiitId, setDpiitId] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [ssoLoading, setSsoLoading] = useState(false);

  // JanParichay NSSO Gateway Login
  const handleJanParichayLogin = async () => {
    setSsoLoading(true);
    setError("");
    setSuccess("");
    try {
      let loggedIn = false;
      try {
        const { profile, role: userRole, error: err } = await signIn("official@gov.in", "official123");
        if (!err && profile && userRole === "government") {
          loggedIn = true;
        }
      } catch (e) {
        console.warn("Direct Supabase login fallback notice:", e);
      }

      if (!loggedIn) {
        signInDemo("janparichay");
      }

      setSuccess(t.toastJanParichay);
      setTimeout(() => {
        navigate("/government/dashboard");
      }, 400);
    } catch (err) {
      console.error("JanParichay SSO error:", err);
      signInDemo("janparichay");
      navigate("/government/dashboard");
    } finally {
      setSsoLoading(false);
    }
  };

  // Startup India / DPIIT Gateway Login
  const handleStartupQuickLogin = () => {
    setError("");
    setSuccess(t.toastStartup);
    signInDemo("startup");
    setTimeout(() => {
      navigate("/startup/dashboard");
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError(t.errEmailPassword);
      return;
    }
    if (password.length < 6) {
      setError(t.errPasswordLength);
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName) {
          setError(role === "government" ? t.errOfficialName : t.errFounderName);
          setLoading(false);
          return;
        }
        if (!organizationName) {
          setError(role === "government" ? t.errDeptName : t.errStartupName);
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
          dpiitId: role === "startup" ? dpiitId : "",
          description,
          website,
        };

        const { data, error: err } = await signUp(email, password, roleData);
        if (err) {
          setError(err.message);
        } else if (data?.session) {
          navigate(role === "government" ? "/government/dashboard" : "/startup/dashboard");
        } else {
          setSuccess(
            role === "government"
              ? (lang === "hi"
                  ? "सरकारी पंजीकरण प्रेषित! व्यवस्थापक सत्यापन लंबित है।"
                  : "Government registration submitted! Verification is pending administrator approval.")
              : (lang === "hi"
                  ? "खाता पंजीकृत हो गया! कृपया अपने क्रेडेंशियल्स से साइन इन करें।"
                  : "Account registered! Please sign in with your credentials.")
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
      setError(errObj?.message || (lang === "hi" ? "त्रुटि हुई। कृपया पुनः प्रयास करें।" : "Something went wrong. Please try again."));
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
            {t.backHome}
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
            <span className="text-[11px] text-slate-200 tracking-widest font-semibold uppercase">{t.sovereignBadge}</span>
          </div>
        </div>
        <div className="relative z-10 my-10 lg:my-0 flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="font-extrabold text-[30px] sm:text-[36px] xl:text-[40px] tracking-tight text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {t.heroTitle}
            </h1>
            <p className="text-slate-300 text-[14px] sm:text-[15px] leading-relaxed max-w-lg">
              {t.heroDesc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: BadgeCheck, color: "text-amber-400", title: t.badgeDigitalIndia, sub: t.badgeDigitalIndiaSub },
              { icon: Rocket, color: "text-emerald-400", title: t.badgeDpiit, sub: t.badgeDpiitSub },
              { icon: ShieldCheck, color: "text-sky-400", title: t.badgeIso, sub: t.badgeIsoSub },
              { icon: KeyRound, color: "text-violet-400", title: t.badgeJanparichay, sub: t.badgeJanparichaySub },
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
            <span>
              {t.leftSecurityNoticePre}
              <Link to="/security-policy" className="text-sky-300 hover:text-white underline decoration-sky-400/60 underline-offset-2 transition-colors">
                {t.cyberSecurityPolicy}
              </Link>
              {t.leftSecurityNoticePost}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth pane */}
      <div className="flex-1 bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.gatewayBadge}</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link to="/security-policy" className="hidden sm:inline text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              {t.secPolicy}
            </Link>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <Link to="/terms-of-access" className="hidden sm:inline text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              {t.termsOfAccess}
            </Link>
          </div>

          {/* Bilingual Language Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
            {["en", "hi"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => handleLangChange(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  lang === l ? "bg-white text-slate-900 shadow-sm border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {l === "en" ? "English" : "हिन्दी"}
              </button>
            ))}
          </div>
        </div>

        {/* Form container */}
        <div className="max-w-xl w-full mx-auto my-auto py-8">
          <div className="mb-6">
            <h2 className="font-bold text-[28px] sm:text-[32px] text-slate-900 tracking-tight leading-snug" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {mode === "login" ? t.signInTitle : t.signUpTitle}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === "login" ? t.signInSub : t.signUpSub}
            </p>
          </div>

          {/* UdyamSetu Dual Auth Path */}
          {mode === "login" && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {t.dualAuthTitle}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{t.selectGateway}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Government Pathway: JanParichay NSSO */}
                <button
                  type="button"
                  onClick={handleJanParichayLogin}
                  disabled={ssoLoading || loading}
                  className="group relative overflow-hidden flex flex-col p-4 bg-white hover:bg-indigo-50/40 border-2 border-indigo-200 hover:border-indigo-600 rounded-2xl text-left transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {/* National Tricolor accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-700 to-[#0B192C] text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                      <Landmark className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors flex items-center gap-1.5">
                        <span>{t.janparichayTitle}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          {t.janparichayBadge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">{t.janparichaySub}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug mb-3">
                    {t.janparichayDescPrefix}<span className="font-semibold text-slate-800">official@gov.in</span>
                  </p>

                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-indigo-700 pt-2 border-t border-slate-100">
                    <span>{ssoLoading ? t.janparichayLoading : t.janparichayBtn}</span>
                  </div>
                </button>

                {/* Startup Pathway: Startup India / DPIIT */}
                <button
                  type="button"
                  onClick={handleStartupQuickLogin}
                  disabled={ssoLoading || loading}
                  className="group relative overflow-hidden flex flex-col p-4 bg-white hover:bg-amber-50/40 border-2 border-amber-200 hover:border-amber-600 rounded-2xl text-left transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {/* Saffron/Amber accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-500" />

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                      <Rocket className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                        <span>{t.startupIndiaTitle}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {t.startupIndiaBadge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">{t.startupIndiaSub}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug mb-3">
                    {t.startupIndiaDesc}
                  </p>

                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-amber-800 pt-2 border-t border-slate-100">
                    <span>{t.startupIndiaBtn}</span>
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 px-3 text-slate-400 font-semibold tracking-wider">
                    {t.orEmailPassword}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Role selector on Signup */}
          {mode === "signup" && (
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.registeringAs}
              </label>
              <div className="bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/80">
                <div className="flex gap-1.5">
                  <TrackBadge
                    icon={Landmark}
                    label={t.govtDeptTrack}
                    active={role === "government"}
                    onClick={() => setRole("government")}
                    color="text-indigo-600"
                  />
                  <TrackBadge
                    icon={Rocket}
                    label={t.startupTrack}
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
                      label={t.govtDeptName}
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={t.govtDeptNamePh}
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          {t.govtLevel} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={govtLevel}
                          onChange={(e) => setGovtLevel(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                        >
                          <option value="Central Ministry">{t.govtLevels["Central Ministry"]}</option>
                          <option value="State Department">{t.govtLevels["State Department"]}</option>
                          <option value="Local / Municipal Body">{t.govtLevels["Local / Municipal Body"]}</option>
                          <option value="Public Sector Undertaking (PSU)">{t.govtLevels["Public Sector Undertaking (PSU)"]}</option>
                        </select>
                      </div>
                      <InputField
                        label={t.govtPortal}
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder={t.govtPortalPh}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label={t.officialName}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.officialNamePh}
                        required
                      />
                      <InputField
                        label={t.designation}
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder={t.designationPh}
                      />
                    </div>
                    <InputField
                      label={t.phone}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t.deptMandate} <span className="text-slate-400 font-normal">{t.optional}</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.deptMandatePh}
                        rows={2}
                        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all resize-none"
                      />
                    </div>

                    {/* Government Verification Notice */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold text-amber-900 mb-0.5">
                          {t.verificationNoticeTitle}
                        </strong>
                        {t.verificationNoticeDesc}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Startup Registration Fields */
                  <>
                    <InputField
                      label={t.startupName}
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={t.startupNamePh}
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label={t.founderName}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.founderNamePh}
                        required
                      />
                      <InputField
                        label={t.phone}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t.industrySector} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                      >
                        {SECTORS.map((sec) => (
                          <option key={sec} value={sec}>
                            {lang === "hi" ? (SECTOR_NAMES_HI[sec] || sec) : sec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputField
                        label={t.dpiitIdLabel}
                        value={dpiitId}
                        onChange={(e) => setDpiitId(e.target.value)}
                        placeholder={t.dpiitIdPh}
                        required
                      />
                      <InputField
                        label={t.website}
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder={t.websitePh}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t.innovationSummary}
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.innovationSummaryPh}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B192C] focus:ring-2 focus:ring-[#0B192C]/10 transition-all"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <InputField
              label={mode === "signup" && role === "government" ? t.govtEmailLabel : t.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              required
            />

            <InputField
              label={t.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPh}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer ${
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
                ? t.verifying
                : mode === "login"
                ? t.signInSecurely
                : role === "government"
                ? t.registerGovt
                : t.registerStartup}
            </button>

            {/* Terms and Security Policy Direct Connection */}
            <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
              {t.consentPre}
              <Link to="/terms-of-access" className="font-semibold text-indigo-700 hover:underline">
                {t.termsOfAccess}
              </Link>
              {t.consentAnd}
              <Link to="/security-policy" className="font-semibold text-indigo-700 hover:underline">
                {t.secPolicy}
              </Link>
              {t.consentPost}
            </p>

            <div className="text-center text-xs text-slate-500 pt-1">
              {mode === "login" ? (
                <>
                  {t.newToUdyamSetu}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t.createAccount}
                  </button>
                </>
              ) : (
                <>
                  {t.alreadyRegistered}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t.signInLink}
                  </button>
                </>
              )}
            </div>

            {/* Sovereign Institutional Guarantee */}
            <div className="mt-4 p-3.5 rounded-xl border border-slate-200 bg-slate-100/70 flex items-start gap-3 text-left">
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-slate-600" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-slate-800">
                  {t.guaranteeTitle}
                </strong>
                {t.guaranteeDesc}
              </div>
            </div>
          </form>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>{t.copyright}</span>
          <div className="flex items-center gap-4">
            <Link to="/security-policy" className="hover:text-slate-700 transition-colors font-medium">
              {t.secPolicy}
            </Link>
            <Link to="/terms-of-access" className="hover:text-slate-700 transition-colors font-medium">
              {t.termsOfAccess}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
