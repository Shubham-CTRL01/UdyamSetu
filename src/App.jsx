import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Loader2 } from "lucide-react";

const LandingPage     = lazy(() => import("./pages/LandingPage"));
const LoginPage       = lazy(() => import("./pages/LoginPage"));
const Dashboard       = lazy(() => import("./pages/Dashboard"));
const BusinessProfile = lazy(() => import("./pages/BusinessProfile"));
const Schemes         = lazy(() => import("./pages/Schemes"));
const Applications    = lazy(() => import("./pages/Applications"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0B192C] animate-spin" />
    </div>
  );
}

// Layout wrapper — hides Navbar/Footer on login page
function Layout({ children }) {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";
  return (
    <div className="min-h-screen flex flex-col">
      {!isLogin && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isLogin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
              <Route path="/schemes" element={<ProtectedRoute><Schemes /></ProtectedRoute>} />
              <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
