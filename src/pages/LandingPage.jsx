import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, ArrowRight, TrendingUp, Building2, Rocket, Users,
  IndianRupee, ShieldCheck, BadgeCheck, Zap, Globe,
  ChevronRight, Star, Clock, Trophy, X, CheckCircle2
} from "lucide-react";

const STATS = [
  { icon: IndianRupee, value: "₹4,850+ Cr", label: "Grants Facilitated", color: "text-amber-500" },
  { icon: Building2,   value: "86",          label: "Ministries & Depts", color: "text-indigo-500" },
  { icon: Rocket,      value: "14,200+",     label: "MSMEs & Startups",   color: "text-emerald-500" },
  { icon: Trophy,      value: "1,340+",      label: "Pilots Deployed",     color: "text-violet-500" },
];

const CHALLENGES = [
  { id:1, ministry:"Ministry of Railways", badge:"Grand Challenge", badgeColor:"bg-amber-100 text-amber-800",
    title:"AI-Powered Predictive Maintenance for Track Infrastructure",
    tags:["AI/ML","Deep Tech","Railways"], grant:"₹2.5 Cr", deadline:"15 Oct 2026", applicants:342 },
  { id:2, ministry:"Ministry of Health & Family Welfare", badge:"MSME Grant", badgeColor:"bg-emerald-100 text-emerald-800",
    title:"Last-Mile Diagnostic Solutions for Tier-3 Health Centres",
    tags:["HealthTech","MSME","Rural"], grant:"₹80 L", deadline:"30 Sep 2026", applicants:189 },
  { id:3, ministry:"Ministry of Defence (DRDO)", badge:"iDEX Challenge", badgeColor:"bg-red-100 text-red-800",
    title:"Drone Swarm Coordination Software for Border Surveillance",
    tags:["Defence","Drones","SaaS"], grant:"₹5 Cr", deadline:"20 Nov 2026", applicants:97 },
  { id:4, ministry:"Ministry of Power & Renewable Energy", badge:"CleanTech Mission", badgeColor:"bg-emerald-100 text-emerald-800",
    title:"High-Efficiency Solid-State Battery Storage for Micro-Grids",
    tags:["CleanTech","Energy","Deep Tech"], grant:"₹3.2 Cr", deadline:"10 Dec 2026", applicants:124 },
  { id:5, ministry:"Ministry of Agriculture & Farmers Welfare", badge:"AgriTech Sprint", badgeColor:"bg-yellow-100 text-yellow-800",
    title:"Autonomous Drone Spraying & Soil Hyperspectral Sensor Array",
    tags:["AgriTech","Hardware","Sensors"], grant:"₹1.2 Cr", deadline:"05 Nov 2026", applicants:215 },
];

const ECOSYSTEMS = [
  { track:"Startup & MSME", icon:Rocket, color:"from-amber-500 to-orange-500",
    features:["DPIIT Recognition & Registry sync","Grand Challenge applications","GeM vendor onboarding pipeline","Section 80-IAC tax exemption tracking","Investor matchmaking network","Pilot deployment tracking dashboard"] },
  { track:"Government & PSU", icon:Building2, color:"from-indigo-600 to-blue-700",
    features:["JanParichay / MeriPehchaan SSO","Ministry problem statement portal","DPIIT-verified startup discovery","Compliance & procurement audit logs","GeM integration & tendering","Real-time pilot monitoring console"] },
];

const INTEGRATIONS = [
  { name:"DigiLocker", desc:"Document verification" },
  { name:"GeM Portal",  desc:"Procurement gateway" },
  { name:"NSWS",        desc:"National Single Window" },
  { name:"DPIIT Registry", desc:"Startup certification" },
  { name:"CERT-In",    desc:"Cyber security clearance" },
  { name:"GSTN",       desc:"Tax compliance bridge" },
];

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-center">
      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-1 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-extrabold text-2xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{value}</div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function ChallengeCard({ challenge, user, role }) {
  const applyTarget = user
    ? role === "government"
      ? "/government/dashboard"
      : "/startup/dashboard"
    : "/login";

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${challenge.badgeColor}`}>{challenge.badge}</span>
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1" />{challenge.deadline}</span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium mb-1.5">{challenge.ministry}</p>
        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-3" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{challenge.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {challenge.tags.map((tag) => <span key={tag} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>)}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div><div className="text-[11px] text-slate-500">Grant Value</div><div className="font-bold text-slate-900 text-sm">{challenge.grant}</div></div>
        <div className="text-right mr-3"><div className="text-[11px] text-slate-500">Applicants</div><div className="font-bold text-slate-900 text-sm">{challenge.applicants}</div></div>
        <Link to={applyTarget} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0B192C] text-white hover:bg-[#1E3E62] transition-colors">
          Apply <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", org: "", slot: "Morning (10 AM - 1 PM)" });

  const filters = ["All", "Deep Tech", "HealthTech", "CleanTech", "Defence", "AgriTech"];

  const filteredChallenges = CHALLENGES.filter((c) => {
    const matchesFilter = activeFilter === "All" || c.tags.includes(activeFilter);
    const matchesSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ministry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleExploreScroll = () => {
    const el = document.getElementById("challenges");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
    setTimeout(() => {
      setDemoSubmitted(false);
      setShowDemoModal(false);
      setDemoForm({ name: "", email: "", org: "", slot: "Morning (10 AM - 1 PM)" });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#0B192C] via-[#10243E] to-[#1E3E62] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.05]">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full border-2 border-white" />
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-white" />
          <div className="absolute bottom-0 -left-20 w-[350px] h-[350px] rounded-full border border-white" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-200 tracking-widest font-semibold uppercase">Official Sovereign Digital Exchange Platform</span>
            </div>
            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-[56px] tracking-tight leading-[1.1] mb-6" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              India's National <span className="text-amber-400">GovTech &</span><br /><span className="text-amber-400">MSME</span> Innovation Bridge
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 max-w-2xl">
              A unified, interoperable exchange enabling public sector departments to pilot, procure, and scale verified indigenous innovations with zero friction.
            </p>
            <div className="flex items-center gap-0 bg-white rounded-2xl p-1.5 shadow-2xl max-w-2xl mb-8">
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grand challenges, schemes, sectors..."
                  className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent py-2" />
              </div>
              <button
                onClick={handleExploreScroll}
                type="button"
                className="px-5 py-2.5 bg-[#0B192C] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3E62] transition-colors whitespace-nowrap"
              >
                Explore Challenges
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login" className="flex items-center gap-2.5 px-7 py-3.5 bg-amber-400 hover:bg-amber-500 text-[#0B192C] font-bold text-base rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                Sign In / Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleExploreScroll}
                type="button"
                className="flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Browse Open Challenges
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14">
            <path d="M0 60L1440 60L1440 0C1200 50 960 50 720 25C480 0 240 0 0 30L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3"><Zap className="w-3.5 h-3.5" /> Two-Sided National Platform</div>
          <h2 className="font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Built for Every Stakeholder</h2>
          <p className="text-slate-500 text-base mt-3 max-w-xl mx-auto">
            Connecting public sector departments seeking innovative solutions with verified startups ready to scale national impact.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ECOSYSTEMS.map((eco) => (
            <div key={eco.track} className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <div className={`h-2 bg-gradient-to-r ${eco.color}`} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${eco.color} flex items-center justify-center`}><eco.icon className="w-5 h-5 text-white" /></div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{eco.track}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {eco.track === "Startup & MSME"
                          ? "Discover government challenges and submit your solutions."
                          : "Post real-world challenges and find innovative solutions from startups."}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {eco.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <BadgeCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-6 pt-0">
                <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0B192C] hover:text-white text-slate-800 transition-all">
                  Sign In / Get Started <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHALLENGES */}
      <section id="challenges" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-2"><TrendingUp className="w-3.5 h-3.5" /> Featured National Challenges</div>
              <h2 className="font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Live Grand Challenges</h2>
            </div>
            <Link to="/schemes" className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">
              View all 124+ challenges <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${activeFilter === f ? "bg-[#0B192C] text-white border-[#0B192C]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
                {f}
              </button>
            ))}
          </div>

          {filteredChallenges.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-base text-slate-800">No grand challenges found for "{activeFilter}"</p>
              <p className="text-xs text-slate-500 mt-1">Try selecting "All" or clear your search term above.</p>
              <button
                onClick={() => { setActiveFilter("All"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredChallenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} user={user} role={role} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3"><Globe className="w-3.5 h-3.5" /> Certified Integrations</div>
          <h2 className="font-extrabold text-3xl text-slate-900 tracking-tight" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Trusted by India's Digital Infrastructure</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="flex flex-col items-center text-center p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-2"><ShieldCheck className="w-5 h-5 text-slate-600" /></div>
              <div className="font-bold text-xs text-slate-900 mb-0.5">{i.name}</div>
              <div className="text-[10px] text-slate-500">{i.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0B192C] via-[#10243E] to-[#1E3E62] py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="font-extrabold text-3xl sm:text-4xl text-white tracking-tight mb-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Ready to bridge the gap?</h2>
          <p className="text-slate-400 text-base mb-8">Join 14,200+ startups, MSMEs, and 86 government bodies already on India's premier innovation exchange.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-[#0B192C] font-bold text-sm rounded-xl transition-colors shadow-lg"><Rocket className="w-4 h-4" /> Get Started Free</Link>
            <button
              onClick={() => setShowDemoModal(true)}
              type="button"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              <Users className="w-4 h-4" /> Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* SCHEDULE DEMO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
              <Clock className="w-4 h-4" /> UdyamSetu Walkthrough
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Schedule an Institutional Demo
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Book a live walkthrough with our sovereign onboarding team for your ministry or startup.
            </p>

            {demoSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-slate-900 text-base">Demo Request Confirmed!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Our integration lead will reach out to <strong>{demoForm.email}</strong> within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    placeholder="Dr. Ananya Roy"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    placeholder="ananya@ministry.gov.in"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Organization</label>
                  <input
                    type="text"
                    required
                    value={demoForm.org}
                    onChange={(e) => setDemoForm({ ...demoForm, org: e.target.value })}
                    placeholder="Ministry of Electronics & IT"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Slot</label>
                  <select
                    value={demoForm.slot}
                    onChange={(e) => setDemoForm({ ...demoForm, slot: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#0B192C] bg-white text-slate-800"
                  >
                    <option>Morning (10 AM - 1 PM)</option>
                    <option>Afternoon (2 PM - 5 PM)</option>
                    <option>Evening (5 PM - 7 PM)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white font-bold text-sm rounded-xl transition-all shadow-md mt-2"
                >
                  Confirm Demo Booking
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
