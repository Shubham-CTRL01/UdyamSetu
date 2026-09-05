import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Shield, Menu, X, LogOut, LogIn, Landmark, Rocket, Home,
  LayoutDashboard, Target, Settings,
} from "lucide-react";

function NavLink({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
        active
          ? "bg-[#0B192C] text-white shadow-md"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600"}`} />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function SidebarContent({ pathname, user, profile, role, dashboardLink, lang, setLang, onLogout, onLinkClick }) {
  const isAdmin = role === "admin";
  const isGovt = role === "government";

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const navItems = [
    { to: "/", icon: Home, label: lang === "hi" ? "मुखपृष्ठ" : "Home" },
    { to: "/challenges", icon: Target, label: lang === "hi" ? "चुनौतियां" : "Challenges" },
  ];

  const portalItems = user
    ? [
        { to: dashboardLink, icon: LayoutDashboard, label: lang === "hi" ? "डैशबोर्ड" : "Dashboard" },
        ...(!isAdmin
          ? [
              { to: "/profile", icon: Settings, label: lang === "hi" ? "व्यावसायिक प्रोफ़ाइल" : "Business Profile" },
            ]
          : []),
      ]
    : [];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-64 shrink-0">
      {/* Brand */}
      <Link to="/" onClick={onLinkClick} className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <img src="/logo.png" alt="UdyamSetu Logo" className="w-9 h-9 rounded-lg object-contain shadow-sm shrink-0 border border-slate-100" />
        <div>
          <div className="font-extrabold text-[15px] text-[#0B192C] tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            UdyamSetu
          </div>
          <div className="text-[10px] text-slate-500 font-medium tracking-wide leading-none mt-0.5">उद्यम सेतु</div>
        </div>
      </Link>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
          {lang === "hi" ? "मेनू" : "Menu"}
        </div>
        {navItems.map((item) => (
          <NavLink key={item.to} {...item} active={isActive(item.to)} onClick={onLinkClick} />
        ))}

        {portalItems.length > 0 && (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mt-5 mb-2">
              {lang === "hi" ? "मेरा पोर्टल" : "My Portal"}
            </div>
            {portalItems.map((item) => (
              <NavLink key={item.to} {...item} active={isActive(item.to)} onClick={onLinkClick} />
            ))}
          </>
        )}
      </nav>

      {/* Footer: language + account */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200 w-fit mx-auto">
          {["en", "hi"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                lang === l ? "bg-white text-[#0B192C] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {l === "en" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>

        {user ? (
          <>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              {isAdmin ? (
                <span className="flex items-center gap-1 text-purple-700 font-bold shrink-0">
                  <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin
                </span>
              ) : isGovt ? (
                <span className="flex items-center gap-1 text-indigo-700 font-bold shrink-0">
                  <Landmark className="w-3.5 h-3.5" /> Govt
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700 font-bold shrink-0">
                  <Rocket className="w-3.5 h-3.5" /> Startup
                </span>
              )}
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-700 truncate">
                {profile?.organization_name || profile?.full_name || user.email?.split("@")[0]}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#0B192C] rounded-xl hover:bg-[#1E3E62] transition-colors shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> {lang === "hi" ? "लॉग आउट" : "Sign Out"}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            onClick={onLinkClick}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold text-[#0B192C] bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" /> {lang === "hi" ? "साइन इन / खाता बनाएं" : "Sign In / Get Started"}
          </Link>
        )}
      </div>
    </aside>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
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
      console.warn("Could not save language preference:", e);
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

  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  const isAdmin = role === "admin";
  const isGovt = role === "government";
  const dashboardLink = isGovt ? "/government/dashboard" : "/startup/dashboard";

  const sidebarProps = { pathname, user, profile, role, dashboardLink, lang, setLang: handleLangChange, onLogout: handleLogout };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:shrink-0">
        <SidebarContent {...sidebarProps} onLinkClick={undefined} />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => setMenuOpen(true)}
          type="button"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="UdyamSetu Logo" className="w-7 h-7 rounded-md object-contain shadow-xs border border-slate-100" />
          <span className="font-bold text-sm text-[#0B192C]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            UdyamSetu
          </span>
        </Link>
        {user ? (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
              isAdmin ? "bg-purple-600" : isGovt ? "bg-indigo-600" : "bg-amber-500"
            }`}
          >
            {(profile?.full_name || user.email || "U")[0].toUpperCase()}
          </div>
        ) : (
          <Link to="/login" className="text-xs font-bold text-[#0B192C] bg-amber-400 px-3 py-1.5 rounded-lg shadow-2xs">
            {lang === "hi" ? "साइन इन" : "Sign In"}
          </Link>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative z-10 h-full overflow-y-auto shadow-2xl">
            <SidebarContent {...sidebarProps} onLinkClick={() => setMenuOpen(false)} />
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/90 text-slate-600 shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
