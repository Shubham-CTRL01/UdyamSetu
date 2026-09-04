import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, FileText, Send, Rocket, ShieldCheck, ShieldAlert,
  Clock, LogOut, LogIn, Menu, Globe, Mail, Settings, Landmark
} from "lucide-react";

function NavItem({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 group ${
        active
          ? "bg-[#0B192C] text-white shadow-md"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon
        className={`shrink-0 ${active ? "text-amber-400" : "text-slate-400 group-hover:text-slate-600"}`}
        style={{ width: "18px", height: "18px" }}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            active ? "bg-amber-400 text-[#0B192C]" : "bg-slate-200 text-slate-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function SidebarContent({ profile, user, role, verificationStatus, navItems, activeSection, onSectionChange, onSignOut }) {
  const isGovt = role === "government";
  const isVerified = verificationStatus === "verified";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  const deptName = profile?.organization_name || (isGovt ? "Government Department" : "Startup Enterprise");
  const personName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const designation = profile?.designation || (isGovt ? "Government Official" : profile?.sector || "Founder");
  const avatarLetter = (personName[0] || deptName[0] || "U").toUpperCase();

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[#0B192C] flex items-center justify-center shrink-0">
          <span className="text-amber-400 font-extrabold text-sm">U</span>
        </div>
        <div>
          <div className="font-extrabold text-[13px] text-[#0B192C] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            UdyamSetu
          </div>
          <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            {isGovt ? "Government Portal" : "Startup Portal"}
          </div>
        </div>
      </Link>

      {/* Profile Card */}
      <div className="px-3 pt-4 pb-3 border-b border-slate-100">
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/40 rounded-2xl border border-slate-200">
          {/* Avatar + Name */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm ${
                isGovt ? "bg-gradient-to-br from-indigo-600 to-indigo-800" : "bg-gradient-to-br from-amber-500 to-orange-600"
              }`}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[13px] text-slate-900 truncate leading-tight">{personName}</div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">{designation}</div>
            </div>
          </div>

          {/* Org Name */}
          <div className="flex items-center gap-1.5 mb-2.5">
            {isGovt ? (
              <Landmark className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            ) : (
              <Rocket className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="text-xs font-semibold text-slate-700 truncate">{deptName}</span>
          </div>

          {/* Verification Badge (govt only) */}
          {isGovt && (
            <div className="mb-2.5">
              {isVerified && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-800">Verified Department</span>
                </div>
              )}
              {isPending && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-800">Pending Verification</span>
                </div>
              )}
              {isRejected && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span className="text-[11px] font-bold text-red-800">Verification Rejected</span>
                </div>
              )}
            </div>
          )}

          {/* Contact */}
          {profile?.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
              <Mail className="w-3 h-3 shrink-0 text-slate-400" />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          {profile?.website && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 truncate">
              <Globe className="w-3 h-3 shrink-0 text-slate-400" />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-indigo-600 transition-colors"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {/* Edit Profile */}
          <Link
            to="/profile"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Settings className="w-3 h-3" /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
          Menu
        </div>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.id}
            badge={item.badge}
            onClick={() => {
              onSectionChange(item.id);
            }}
          />
        ))}
      </nav>

      {/* Sign In & Sign Out */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-1.5 mt-auto">
        {user ? (
          <>
            <Link
              to="/login"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200/80 bg-slate-50/50"
            >
              <LogIn className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Sign In / Switch Account</span>
            </Link>
            <button
              onClick={onSignOut}
              type="button"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0B192C] bg-amber-400 hover:bg-amber-500 transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children, activeSection, onSectionChange, navItems, role = "government" }) {
  const { user, profile, verificationStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isGovt = role === "government";
  const personName = profile?.full_name || user?.email?.split("@")[0] || "U";
  const avatarLetter = (personName[0] || "U").toUpperCase();

  const sidebarProps = {
    profile,
    user,
    role,
    verificationStatus,
    navItems,
    activeSection,
    onSectionChange: (id) => {
      onSectionChange(id);
      setSidebarOpen(false);
    },
    onSignOut: handleSignOut,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0 overflow-y-auto">
        <SidebarContent {...sidebarProps} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 h-full overflow-y-auto shadow-2xl">
            <SidebarContent {...sidebarProps} />
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            type="button"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0B192C] flex items-center justify-center">
              <span className="text-amber-400 font-extrabold text-xs">U</span>
            </div>
            <span className="font-bold text-sm text-[#0B192C]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UdyamSetu</span>
          </div>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
            isGovt ? "bg-indigo-600" : "bg-amber-500"
          }`}>
            {avatarLetter}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
