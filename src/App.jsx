import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// ── Mock dashboard placeholder ────────────────────────────────────────────────
function DashboardPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-extrabold text-2xl text-slate-900 mb-2" style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
          Welcome to your Dashboard
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          You are signed in to UdyamSetu. This is a prototype — your full dashboard will be wired to Firebase here.
        </p>
        <button
          onClick={() => onNavigate("/")}
          className="px-6 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3E62] transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage] = useState("/");

  const navigate = (href) => {
    setCurrentPage(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLoginPage = currentPage === "/login";

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar onNavigate={navigate} currentPage={currentPage} />}

      <main className="flex-1">
        {currentPage === "/" && <LandingPage onNavigate={navigate} />}
        {currentPage === "/login" && <LoginPage onNavigate={navigate} />}
        {currentPage === "/dashboard" && <DashboardPage onNavigate={navigate} />}
        {!["/", "/login", "/dashboard"].includes(currentPage) && (
          <DashboardPage onNavigate={navigate} />
        )}
      </main>

      {!isLoginPage && <Footer onNavigate={navigate} />}
    </div>
  );
}
