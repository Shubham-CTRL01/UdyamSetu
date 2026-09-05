import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Loader2 } from "lucide-react";

import DemoWorkflowGuide from "./components/DemoWorkflowGuide";

const LandingPage            = lazy(() => import("./pages/LandingPage"));
const LoginPage              = lazy(() => import("./pages/LoginPage"));
const GovernmentDashboard    = lazy(() => import("./pages/GovernmentDashboard"));
const StartupDashboard       = lazy(() => import("./pages/StartupDashboard"));
const BusinessProfile        = lazy(() => import("./pages/BusinessProfile"));
const GovApplicationReview   = lazy(() => import("./pages/GovernmentApplicationReview"));
const PilotManagement        = lazy(() => import("./pages/PilotManagement"));
const ChallengeDiscovery     = lazy(() => import("./pages/ChallengeDiscovery"));
const ChallengeDetail        = lazy(() => import("./pages/ChallengeDetail"));
const SecurityPolicy         = lazy(() => import("./pages/SecurityPolicy"));
const TermsOfAccess          = lazy(() => import("./pages/TermsOfAccess"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        Loading Sovereign Portal...
      </span>
    </div>
  );
}

// Smart dashboard redirector based on authenticated user role
function RoleDashboardRouter() {
  const { role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (role === "government") return <Navigate to="/government/dashboard" replace />;
  return <Navigate to="/startup/dashboard" replace />;
}

// Layout wrapper — hides the sidebar nav on login page, policy documents, and dashboard pages with their own sidebar layout
function Layout({ children }) {
  const { pathname } = useLocation();
  const isStandalone =
    pathname === "/login" ||
    pathname === "/security-policy" ||
    pathname === "/terms-of-access";
  const isDashboard =
    pathname.startsWith("/government/dashboard") ||
    pathname.startsWith("/startup/dashboard") ||
    pathname.startsWith("/government/challenges/create");

  const showSidebar = !isStandalone && !isDashboard;

  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[#0B192C] text-amber-400 text-[11px] font-semibold tracking-widest uppercase text-center py-2 px-4 hidden sm:block">
        📢 National Innovation Challenge 2026 — Sovereign GovTech & High-Growth Startup Exchange
      </div>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/security-policy" element={<SecurityPolicy />} />
                <Route path="/terms-of-access" element={<TermsOfAccess />} />

                {/* Role-Based Dashboards */}
                <Route
                  path="/government/dashboard"
                  element={
                    <ProtectedRoute allowedRole="government">
                      <GovernmentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/government/challenges/create"
                  element={
                    <ProtectedRoute allowedRole="government">
                      <GovernmentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/government/applications/:applicationId"
                  element={
                    <ProtectedRoute allowedRole="government">
                       <GovApplicationReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/startup/dashboard"
                  element={
                    <ProtectedRoute allowedRole="startup">
                      <StartupDashboard />
                    </ProtectedRoute>
                  }
                />
                {/* Generic /dashboard redirects to user's assigned role dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleDashboardRouter />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Protected Features */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <BusinessProfile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/challenges" element={<ChallengeDiscovery />} />
                <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />

                {/* Pilot Management (both Government & Startup) */}
                <Route
                  path="/pilot-management"
                  element={
                    <ProtectedRoute>
                      <PilotManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pilot-management/:pilotId"
                  element={
                    <ProtectedRoute>
                      <PilotManagement />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
          <DemoWorkflowGuide />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
