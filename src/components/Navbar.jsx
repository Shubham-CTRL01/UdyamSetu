import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Shield, Menu, X, LogOut, LayoutDashboard, User, Briefcase, FileCheck, Landmark, Rocket, Bell, Send, FileText } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    fetchUnreadCount();
    if (user) {
      const timer = setInterval(fetchUnreadCount, 15000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  const isAdmin = role === "admin";
  const isGovt = role === "government";
  const dashboardLink = isAdmin
    ? "/admin/dashboard"
    : isGovt
    ? "/government/dashboard"
    : "/startup/dashboard";

  return (
    <>
      <div className="bg-[#0B192C] text-amber-400 text-[11px] font-semibold tracking-widest uppercase text-center py-2 px-4 hidden sm:block">
        📢 National Innovation Challenge 2026 — Sovereign GovTech & High-Growth Startup Exchange
      </div>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0B192C] to-[#1E3E62] flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-[16px] text-[#0B192C] tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UdyamSetu</div>
                <div className="text-[10px] text-slate-500 font-medium tracking-wide leading-none mt-0.5">उद्यम सेतु</div>
              </div>
            </Link>

            {/* Dynamic Navigation Links based on authentication and role */}
            <nav className="hidden lg:flex items-center gap-1">
              {user ? (
                isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4 text-purple-600" /> Admin Approvals
                    </Link>
                    <Link to="/schemes" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-500" /> All Challenges
                    </Link>
                  </>
                ) : isGovt ? (
                  <>
                    <Link to="/government/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4 text-indigo-600" /> Dashboard
                    </Link>
                    <Link to="/government/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-500" /> Proposed Challenges
                    </Link>
                    <Link to="/government/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Applications
                    </Link>
                    <Link to="/pilot-management" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-cyan-600" /> Pilots
                    </Link>
                    <Link
                      to="/pilot-management"
                      onClick={() => supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id)}
                      className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 relative"
                    >
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="absolute -top-1 -right-1">
                        {unreadCount > 0 && (
                          <span className="flex items-center justify-center w-4 h-4 text-[8px] font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </span>
                    </Link>
                    <Link to="/profile" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-500" /> Department Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/startup/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <LayoutDashboard className="w-4 h-4 text-amber-600" /> Dashboard
                    </Link>
                    <Link to="/startup/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <Rocket className="w-4 h-4 text-slate-500" /> Challenges
                    </Link>
                    <Link to="/startup/dashboard" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-slate-500" /> My Applications
                    </Link>
                    <Link to="/pilot-management" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 relative">
                      <Send className="w-4 h-4 text-cyan-600" /> Pilot Opportunities
                    </Link>
                    <Link
                      to="/pilot-management"
                      onClick={() => supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id)}
                      className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 relative"
                    >
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span className="absolute -top-1 -right-1">
                        {unreadCount > 0 && (
                          <span className="flex items-center justify-center w-4 h-4 text-[8px] font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </span>
                    </Link>
                    <Link to="/profile" className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-500" /> Business Profile
                    </Link>
                  </>
                )
              ) : (
                <>
                  <Link to="/schemes" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors">
                    Challenges
                  </Link>
                  <Link to="/schemes" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors">
                    Schemes & Grants
                  </Link>
                  <Link to="/" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B192C] hover:bg-slate-50 rounded-lg transition-colors">
                    About Portal
                  </Link>
                </>
              )}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                {["en", "hi"].map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === l ? "bg-white text-[#0B192C] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    {l === "en" ? "English" : "हिन्दी"}
                  </button>
                ))}
              </div>

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    {isAdmin ? (
                      <span className="flex items-center gap-1 text-purple-700 font-bold">
                        <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin
                      </span>
                    ) : isGovt ? (
                      <span className="flex items-center gap-1 text-indigo-700 font-bold">
                        <Landmark className="w-3.5 h-3.5" />
                        {profile?.verification_status === "pending"
                          ? "Govt (Pending)"
                          : profile?.verification_status === "rejected"
                          ? "Govt (Rejected)"
                          : "Govt (Verified)"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 font-bold">
                        <Rocket className="w-3.5 h-3.5" /> Startup
                      </span>
                    )}
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                      {profile?.organization_name || profile?.full_name || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <Link to={dashboardLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#0B192C] border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#0B192C] rounded-lg hover:bg-[#1E3E62] transition-colors shadow-sm">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-[#0B192C] bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-sm">
                  Sign In / Get Started
                </Link>
              )}
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-2">
            {user ? (
              <>
                <div className="p-3 bg-slate-50 rounded-xl mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Signed in as</div>
                    <div className="font-bold text-sm text-slate-800">{profile?.organization_name || profile?.full_name || user.email}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isAdmin
                      ? "bg-purple-100 text-purple-800"
                      : isGovt
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {role} {isGovt && profile?.verification_status ? `(${profile.verification_status})` : ""}
                  </span>
                </div>
                <Link to={dashboardLink} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                  Dashboard
                </Link>
                {!isAdmin && (
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">
                    Profile
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/schemes" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700">
                  Challenges
                </Link>
                <Link to="/schemes" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-slate-700">
                  Schemes
                </Link>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block w-full text-center py-3 text-sm font-bold bg-amber-400 text-[#0B192C] rounded-xl mt-2">
                  Sign In / Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
}
