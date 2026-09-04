import { Shield, Phone, Mail, ExternalLink } from "lucide-react";

export default function Footer({ onNavigate }) {
  const handleNav = (href) => {
    if (onNavigate) onNavigate(href);
  };

  return (
    <footer className="bg-[#0B192C] text-slate-300">
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#0B192C]" />
              </div>
              <div>
                <div className="font-extrabold text-white text-[15px] leading-none" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
                  UdyamSetu
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-none">उद्यम सेतु</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's official national digital bridge between public sector institutions and high-growth startups &amp; MSMEs.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              Platform Operational · 99.97% Uptime
            </div>
          </div>

          {/* Platform links */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Platform</h3>
            {["Grand Challenges", "Schemes & Grants", "GeM Onboarding", "DPIIT Registry", "DigiLocker Integration"].map((item) => (
              <button
                key={item}
                onClick={() => handleNav("/")}
                className="block text-sm text-slate-400 hover:text-white transition-colors text-left"
              >
                {item}
              </button>
            ))}
          </div>

          {/* For you */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">For You</h3>
            {["Startup Portal", "MSME Dashboard", "Ministry Portal", "PSU Access", "Investor Network"].map((item) => (
              <button
                key={item}
                onClick={() => handleNav("/")}
                className="block text-sm text-slate-400 hover:text-white transition-colors text-left"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Contact & compliance */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Support</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>1800-111-SETU (Toll Free)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>helpdesk@udyamsetu.gov.in</span>
            </div>
            <div className="pt-2 space-y-2">
              {["RTI Portal", "Grievance Redressal", "CERT-In Security"].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNav("/")}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© 2026 UdyamSetu National Portal · Ministry of Commerce &amp; Industry, Government of India</div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleNav("/")} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
            <button onClick={() => handleNav("/")} className="hover:text-slate-300 transition-colors">Terms of Access</button>
            <button onClick={() => handleNav("/")} className="hover:text-slate-300 transition-colors">Security Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
