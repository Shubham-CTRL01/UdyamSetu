import { Link } from "react-router-dom";
import { Scale, ArrowLeft, ShieldCheck, FileCheck, CheckCircle2, AlertCircle, Building2, Rocket } from "lucide-react";

export default function TermsOfAccess() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Home
            </Link>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Scale className="w-3.5 h-3.5" /> GFR 2017 &amp; DPIIT Framework Aligned
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-[#0B192C] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase block">
                Institutional Regulatory Framework
              </span>
              <span className="text-xs text-slate-400">Terms of Access &amp; Operating Protocol · Version 2.8</span>
            </div>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            UdyamSetu Institutional Terms of Access
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed max-w-3xl">
            Governing institutional onboarding, Grand Challenge participations, proprietary intellectual property safeguards, and sovereign pilot execution between public sector authorities and verified innovators.
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-slate-700">

          {/* 1. Legal Entity & Jurisdiction */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                1
              </span>
              <h2>Preamble &amp; Statutory Authority</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              The UdyamSetu National Digital Platform (&quot;Platform&quot;) functions as the institutional bridge between Government entities (Central Ministries, State Departments, PSUs, Autonomous Bodies) and high-growth innovators recognized under the Department for Promotion of Industry and Internal Trade (DPIIT) and the Ministry of Micro, Small and Medium Enterprises (MoMSME). Access to and utilization of this digital infrastructure is conditioned upon strict compliance with these Terms of Access and relevant Indian statutory guidelines.
            </p>
          </section>

          {/* 2. Track Eligibility */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                2
              </span>
              <h2>Institutional Onboarding &amp; Track Verification</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                  <Building2 className="w-4 h-4 text-indigo-700" />
                  Government Authority Track
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Restricted to verified public officials utilizing sovereign <strong>@gov.in</strong> or <strong>@nic.in</strong> credentials, or authenticated via the JanParichay National Single Sign-On (NSSO) e-Pramaan service. Officials warrant that problem statements posted represent sanctioned institutional requirements.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
                  <Rocket className="w-4 h-4 text-amber-600" />
                  Startup &amp; MSME Track
                </div>
                <p className="text-xs leading-relaxed text-slate-600">
                  Open to entities incorporated under the Companies Act, 2013 or LLP Act, 2008 holding valid DPIIT Recognition (Startup India) or MSME Udyam Registration. Entities warrant that submitted technical and financial claims are truthful and verifiable.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Intellectual Property Rights (Crucial for Startups) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                3
              </span>
              <h2>Intellectual Property (IP) Sovereignty &amp; Non-Disclosure</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              UdyamSetu strictly upholds the intellectual property rights of participating innovators:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full IP Retention:</strong> Startups retain full and unrestricted ownership of all pre-existing and foreground intellectual property, patents, source code, neural network weights, and proprietary architecture disclosed during challenge submissions.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidentiality Mandate:</strong> Reviewing government committees are bound by non-disclosure protocols. Submissions marked as proprietary shall not be circulated beyond the designated evaluation bench or utilized for reverse engineering.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No Involuntary Transfer:</strong> Participation in grand challenges or deployment in pilot sandboxes does not constitute an assignment or transfer of ownership to any government body.
                </span>
              </div>
            </div>
          </section>

          {/* 4. Public Procurement & Pilot Guidelines */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                4
              </span>
              <h2>GFR Alignment &amp; Pilot Sandboxing Rules</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Pilot projects initiated on UdyamSetu conform to <strong>Rule 149 and Rule 194 of the General Financial Rules (GFR), 2017</strong> (Procurement of Innovative Solutions &amp; Exemption from prior turnover/experience for recognized startups):
            </p>
            <ul className="list-disc pl-5 text-xs space-y-2 text-slate-600">
              <li>
                <strong>Pilot Offer Discretion:</strong> Selection for a pilot deployment represents an invitation to negotiate a live sandbox trial and does not constitute a guaranteed commercial procurement order.
              </li>
              <li>
                <strong>Structured Evaluation:</strong> Departments must provide clear KPI milestones (e.g., uptime, precision, throughput) and conclude evaluation within the agreed trial window (typically 30–90 days).
              </li>
              <li>
                <strong>Zero Punitive Recourse:</strong> Startup non-selection or mutual termination of an unviable technical pilot carries no adverse blacklisting penalty on public procurement portals (GeM / CPPP).
              </li>
            </ul>
          </section>

          {/* 5. User Responsibilities & Prohibited Acts */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                5
              </span>
              <h2>Prohibited Activities &amp; System Integrity</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Users of the UdyamSetu digital gateway agree strictly not to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Submit forged DPIIT, GSTIN, or Udyam documentation or impersonate government officials.</span>
              </div>
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Engage in automated scraping, vulnerability probing, or denial-of-service attempts.</span>
              </div>
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Participate in collusive bidding or price-fixing practices during procurement pilots.</span>
              </div>
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>Share verified credentials or sub-license platform access to unauthorized third parties.</span>
              </div>
            </div>
          </section>

          {/* 6. Dispute Resolution & Sovereign Arbitration */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                6
              </span>
              <h2>Dispute Resolution &amp; Governing Law</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              These Terms of Access shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>. In the event of any operational or contractual dispute arising between participants:
            </p>
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                <strong>Amicable Settlement:</strong> The parties shall first attempt to resolve disputes through the UdyamSetu Grievance Redressal Mechanism within 30 business days.
              </p>
              <p>
                <strong>Arbitration:</strong> Unresolved disputes shall be referred to sole arbitration in accordance with the <em>Arbitration and Conciliation Act, 1996</em>. The seat and venue of arbitration shall be New Delhi, India.
              </p>
              <p>
                <strong>Jurisdiction:</strong> The competent courts of New Delhi shall have exclusive jurisdiction over any matters arising hereunder.
              </p>
            </div>
          </section>

          {/* Summary Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Official Sovereign Innovation Bridge
              </div>
              <p className="text-xs text-slate-300">
                UdyamSetu is supported under national digital public infrastructure initiatives.
              </p>
            </div>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shrink-0 shadow-sm"
            >
              Acknowledge &amp; Return to Login
            </Link>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 UdyamSetu National Exchange · All Rights Reserved</div>
          <div className="flex items-center gap-4">
            <Link to="/security-policy" className="hover:text-indigo-600 font-semibold transition-colors">
              Security Policy
            </Link>
            <Link to="/login" className="hover:text-indigo-600 font-semibold transition-colors">
              Portal Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
