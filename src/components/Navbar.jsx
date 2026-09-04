import { useState } from "react";
import { Shield, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Challenges", href: "/challenges" },
  { label: "Schemes", href: "/schemes" },
  { label: "About", href: "/about" },
];

export default function Navbar({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("en");

  const handleNav = (href) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(href);
  };

  return (
    <>
      {/* Sovereign ticker banner */}
      <div className="bg-[#0B192C] text-amber-400 text-[11px] font-semibold tracking-widest uppercase text-center py-2 px-4 hidden sm:block">
        📢 National Innovation Challenge 2026 — Submissions open for CleanTech & Defence Sectors
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <button onClick={() => handleNav("/")} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0B192C] to-[#1E3E62] flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-[16px] text-[#0B192C] tracking-tight leading-none" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                  UdyamSetu
                </div>
                <div className="text-[10px] text-slate-500 font-medium tracking-wide leading-none mt-0.5">
                  उद्यम सेतु
                </div>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop Right */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    lang === "en" ? "bg-white text-[#0B192C] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang("hi")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    lang === "hi" ? "bg-white text-[#0B192C] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  हिन्दी
                </button>
              </div>
              <button
                onClick={() => handleNav("/login")}
                className="px-4 py-2 text-sm font-semibold text-[#0B192C] border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav("/login")}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#1E3E62] transition-colors shadow-sm"
              >
                Register
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => handleNav("/login")}
                className="w-full py-2.5 text-sm font-semibold text-[#0B192C] border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav("/login")}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#1E3E62]"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
