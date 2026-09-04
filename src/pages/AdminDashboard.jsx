import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ShieldAlert, ShieldCheck, Clock, CheckCircle2, XCircle, Search,
  Filter, Building2, User, Globe, Phone, Mail, FileText, AlertCircle,
  Loader2, RefreshCw, X, Eye, Check, ExternalLink
} from "lucide-react";

function StatCard({ icon: Icon, value, label, color, alert }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 flex items-start gap-4 shadow-sm transition-all ${alert ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-extrabold text-2xl text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {value}
        </div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [challengesCount, setChallengesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("pending"); // "pending" | "verified" | "rejected" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  // Modals
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectingProfile, setRejectingProfile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all profiles
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error("Error fetching profiles:", pErr);
      } else {
        setProfiles(profs || []);
      }

      // 2. Fetch challenge count
      const { count, error: cErr } = await supabase
        .from("challenges")
        .select("*", { count: "exact", head: true });

      if (!cErr && typeof count === "number") {
        setChallengesCount(count);
      }
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Approve
  const handleApprove = async (profileId, deptName) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "verified",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast(`✓ "${deptName || 'Department'}" approved! Publishing privileges unlocked.`);
        await loadData();
        if (selectedProfile?.id === profileId) {
          setSelectedProfile((prev) => ({ ...prev, verification_status: "verified", rejection_reason: null }));
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to approve profile", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingProfile) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: "rejected",
          rejection_reason: rejectionReason || "Department credentials could not be verified.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectingProfile.id);

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast(`Registration for "${rejectingProfile.organization_name || 'Department'}" marked as rejected.`);
        setRejectingProfile(null);
        setRejectionReason("");
        await loadData();
        if (selectedProfile?.id === rejectingProfile.id) {
          setSelectedProfile((prev) => ({
            ...prev,
            verification_status: "rejected",
            rejection_reason: rejectionReason || "Department credentials could not be verified."
          }));
        }
      }
    } catch (err) {
      showToast(err.message || "Failed to reject profile", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const govtProfiles = profiles.filter((p) => p.role === "government");
  const pendingCount = govtProfiles.filter((p) => p.verification_status === "pending").length;
  const verifiedCount = govtProfiles.filter((p) => p.verification_status === "verified").length;
  const rejectedCount = govtProfiles.filter((p) => p.verification_status === "rejected").length;
  const startupCount = profiles.filter((p) => p.role === "startup").length;

  // Filtered List
  const filteredList = govtProfiles.filter((p) => {
    // Tab filter
    if (filterTab === "pending" && p.verification_status !== "pending") return false;
    if (filterTab === "verified" && p.verification_status !== "verified") return false;
    if (filterTab === "rejected" && p.verification_status !== "rejected") return false;

    // Govt level filter
    if (levelFilter !== "all" && p.govt_level !== levelFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.organization_name || "").toLowerCase();
      const officer = (p.full_name || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return name.includes(q) || officer.includes(q) || email.includes(q);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 ${
              toastMessage.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              {toastMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              <span>{toastMessage.msg}</span>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-bold mb-2 border border-purple-200">
                🛡️ National Portal Administration
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Government Verification Authority
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Signed in as sovereign administrator: <strong className="text-slate-800">{user?.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Clock}
            value={pendingCount}
            label="Pending Verifications"
            color="bg-amber-50 text-amber-600"
            alert={pendingCount > 0}
          />
          <StatCard
            icon={CheckCircle2}
            value={verifiedCount}
            label="Verified Departments"
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            icon={User}
            value={startupCount}
            label="Registered Startups"
            color="bg-sky-50 text-sky-600"
          />
          <StatCard
            icon={FileText}
            value={challengesCount}
            label="National Challenges"
            color="bg-indigo-50 text-indigo-600"
          />
        </div>

        {/* Verification Queue Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tabs & Controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Government Department Registrations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review institutional credentials and grant publishing authorization to official departments.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => setFilterTab("pending")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    filterTab === "pending"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>Pending</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilterTab("verified")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterTab === "verified"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Verified ({verifiedCount})
                </button>
                <button
                  onClick={() => setFilterTab("rejected")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterTab === "rejected"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Rejected ({rejectedCount})
                </button>
                <button
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filterTab === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({govtProfiles.length})
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by department, officer name, or official email..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:border-[#0B192C]"
                >
                  <option value="all">All Administrative Levels</option>
                  <option value="Central Ministry">Central Ministry</option>
                  <option value="State Department">State Department</option>
                  <option value="Local / Municipal Body">Local / Municipal Body</option>
                  <option value="Public Sector Undertaking (PSU)">Public Sector Undertaking (PSU)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
              <span className="text-sm">Loading registration queue...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Building2 className="w-10 h-10 text-slate-300" />
              <h3 className="font-semibold text-slate-800 text-sm">No Department Registrations Found</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                No government accounts match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Department / Ministry</th>
                    <th className="px-6 py-4">Admin Level</th>
                    <th className="px-6 py-4">Authorized Officer</th>
                    <th className="px-6 py-4">Official Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((p) => {
                    const status = p.verification_status || "pending";
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 leading-snug">
                            {p.organization_name || "Untitled Department"}
                          </div>
                          {p.website && (
                            <a
                              href={p.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="w-3 h-3" /> {p.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                            {p.govt_level || "Central Ministry"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800 text-xs">{p.full_name || "Official"}</div>
                          <div className="text-[11px] text-slate-500">{p.designation || "Not specified"}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <div className="text-slate-800 truncate max-w-[180px]">{p.email}</div>
                          {p.phone && <div className="text-slate-400 text-[11px]">{p.phone}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {status === "verified" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                          {status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {status === "rejected" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedProfile(p)}
                            title="Inspect Details"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {status !== "verified" && (
                            <button
                              onClick={() => handleApprove(p.id, p.organization_name)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {status !== "rejected" && (
                            <button
                              onClick={() => {
                                setRejectingProfile(p);
                                setRejectionReason("");
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-lg transition-all inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* INSPECT DETAILS MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Department Profile Inspection</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedProfile.organization_name}</h3>
            <div className="text-xs text-slate-500 mb-4">
              Level: <strong className="text-slate-800">{selectedProfile.govt_level || "Central Ministry"}</strong> · Registered {selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString() : "Recently"}
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <div>
                <strong className="block text-slate-900 mb-0.5">Designated Officer:</strong>
                {selectedProfile.full_name} {selectedProfile.designation ? `(${selectedProfile.designation})` : ""}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong className="block text-slate-900 mb-0.5">Official Email:</strong>
                  {selectedProfile.email}
                </div>
                <div>
                  <strong className="block text-slate-900 mb-0.5">Phone:</strong>
                  {selectedProfile.phone || "Not specified"}
                </div>
              </div>
              {selectedProfile.website && (
                <div>
                  <strong className="block text-slate-900 mb-0.5">Department Portal:</strong>
                  <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                    {selectedProfile.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selectedProfile.description && (
                <div>
                  <strong className="block text-slate-900 mb-0.5">Mandate & Scope:</strong>
                  {selectedProfile.description}
                </div>
              )}
              {selectedProfile.rejection_reason && (
                <div className="p-2.5 bg-red-100/80 border border-red-200 rounded-lg text-red-900">
                  <strong className="block font-bold">Rejection Reason:</strong>
                  {selectedProfile.rejection_reason}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              {selectedProfile.verification_status !== "verified" && (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedProfile.id, selectedProfile.organization_name)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Approve Department
                </button>
              )}
              {selectedProfile.verification_status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectingProfile(selectedProfile);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Reject...
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setRejectingProfile(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Reject Department Registration</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{rejectingProfile.organization_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Specify a reason for rejecting this department's registration. The reason will be visible to the applicant on their portal.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Official government email domain (.gov.in / nic.in) could not be verified; unrecognized department name."
                  rows={3}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProfile(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
