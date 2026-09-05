import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Lock, CheckCircle2, KeyRound } from "lucide-react";

export default function SecurityPolicy() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> CERT-In &amp; DPDP Act 2023 Aligned
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-[#0B192C] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase block">
                Sovereign Information Security Architecture
              </span>
              <span className="text-xs text-slate-400">Policy Version 3.4 · Effective September 2026</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            UdyamSetu National Security &amp; Cyber Governance Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed max-w-3xl">
            Governing the cryptographic protection, data sovereignty, role-based access isolation, and audit integrity across India&apos;s National GovTech &amp; Startup Innovation Exchange.
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-slate-700">

          {/* 1. Sovereign Authority */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                1
              </span>
              <h2>Statutory Framework &amp; Data Sovereignty</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              The UdyamSetu National Platform operates in strict compliance with the <strong>Information Technology Act, 2000</strong>, the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>, and the <strong>National Cyber Security Guidelines</strong> issued by the Indian Computer Emergency Response Team (CERT-In). All database repositories, audit logs, and proprietary challenge submissions are hosted exclusively within MeitY-empanelled data centers located within the sovereign territory of the Republic of India.
            </p>
          </section>

          {/* 2. Institutional Authentication & NSSO */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                2
              </span>
              <h2>Identity Verification &amp; JanParichay NSSO Integration</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              UdyamSetu enforces a strict dual-track cryptographic identity verification model:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" /> Government Official Gate
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Government departments authenticate via the <strong>JanParichay National Single Sign-On (NSSO)</strong>. New department profiles undergo institutional verification before receiving clearance to publish national procurement challenges or review technical applications.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Startup DPIIT Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Startups register using their official <strong>DPIIT Recognition Number</strong>. Verification status is synchronized with the national DPIIT registry to validate MSME status and grant eligibility under Section 80-IAC.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Row-Level Security & Cryptographic Isolation */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                3
              </span>
              <h2>Row-Level Security (RLS) &amp; Data Boundary Enforcement</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Every database transaction is guarded by PostgreSQL <strong>Row-Level Security (RLS)</strong> policies enforced at the database kernel level:
            </p>
            <ul className="space-y-2 text-xs text-slate-600 list-disc pl-5 leading-relaxed">
              <li><strong>Challenge Application Privacy:</strong> Proprietary solution architecture and financial quotations submitted by startups are viewable solely by the submitting startup and the assigned evaluation committee of the target government ministry.</li>
              <li><strong>Evaluation &amp; Pilot Results Protection:</strong> Pilot outcome reviews, KPI metrics, and independent validation evaluations are locked to verified participants with non-repudiation logging.</li>
              <li><strong>Zero Inter-Ministry Data Leakage:</strong> Government departments cannot view tender applications or internal scoring cards belonging to other ministries without explicit cross-departmental authorization.</li>
            </ul>
          </section>

          {/* 4. Encryption Standards */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                4
              </span>
              <h2>Encryption in Transit &amp; at Rest</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              All communications between client devices, the Sovereign Gateway, and storage layers are encrypted using <strong>TLS 1.3</strong> with forward secrecy. At rest, all relational tables, files, and transaction attachments are encrypted using <strong>AES-256 GCM</strong> with managed hardware security modules (HSM).
            </p>
          </section>

          {/* 5. Immutable Audit Trails & Compliance */}
          <section className="space-y-3 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-[#0B192C] font-bold text-lg">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
                5
              </span>
              <h2>Audit Trails &amp; Incident Reporting (CERT-In)</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              System logs, authentication attempts, challenge publishing, milestone completions, and pilot status transitions are permanently timestamped and immutably recorded for vigilance inspection. Security anomalies or unauthorized intrusion attempts are automatically logged and reported to <strong>CERT-In within 6 hours</strong> under the CERT-In Directions 2022.
            </p>
          </section>

          {/* Footer link to Terms */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="block font-bold">Chief Information Security Officer (CISO) Directorate</strong>
              <span>National Informatics Centre / UdyamSetu Cyber Directorate · cyber-security@udyamsetu.gov.in</span>
            </div>
            <Link
              to="/terms-of-access"
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs whitespace-nowrap text-center transition-all"
            >
              View Terms of Access →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
