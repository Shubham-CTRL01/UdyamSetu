import { DEFAULT_CHALLENGES, DEFAULT_APPLICATIONS, DEFAULT_STARTUP_PROFILE, DEFAULT_PILOT_RESULT_1 } from "./demoData";
import { DEFAULT_PILOT_OFFERS } from "../pages/PilotManagement";

const STORAGE_KEY = "udyam_demo_temp_db_v2";
const CHANGE_EVENT = "udyam_temp_db_change";

function buildInitialState() {
  const challenges = JSON.parse(JSON.stringify(DEFAULT_CHALLENGES));
  const applications = JSON.parse(JSON.stringify(DEFAULT_APPLICATIONS));
  const pilotOffers = JSON.parse(JSON.stringify(DEFAULT_PILOT_OFFERS));

  const milestones = {
    "demo-pilot-1": [
      {
        id: "m-1",
        pilot_offer_id: "demo-pilot-1",
        title: "Hardware Mount & Camera Calibration",
        description: "Bogie mounting on 4 locomotives and optical sensor alignment.",
        due_date: "2026-08-15",
        deliverable: "Calibration logs & Northern Railway sign-off",
        kpi: ">95% sensor alignment",
        payment_amount: 5000000,
        payment_status: "released",
        status: "approved",
        submitted_result: "Mounted on locomotives #4928, #4929, #4930, #4931. Calibration report signed by Northern Railway division."
      },
      {
        id: "m-2",
        pilot_offer_id: "demo-pilot-1",
        title: "Dataset Ingestion & Model Fine-Tuning",
        description: "Edge inference verification with TensorRT and YOLO-Track.",
        due_date: "2026-10-01",
        deliverable: "Telemetry logs & inference benchmark",
        kpi: "<200ms latency",
        payment_amount: 5000000,
        payment_status: "pending",
        status: "submitted",
        submitted_result: "189ms edge latency verified on Jetson AGX units. Zero threshold overruns."
      },
      {
        id: "m-3",
        pilot_offer_id: "demo-pilot-1",
        title: "Live Track Run & Alert Portal Verification",
        description: "Integration with railway central safety portal and GSAT uplink.",
        due_date: "2026-11-15",
        deliverable: "Real-time safety portal integration",
        kpi: "100% uplink uptime",
        payment_amount: 5000000,
        payment_status: "not_due",
        status: "pending",
        submitted_result: ""
      }
    ]
  };

  const results = {
    "demo-pilot-1": JSON.parse(JSON.stringify(DEFAULT_PILOT_RESULT_1))
  };

  const negotiations = {
    "demo-pilot-1": [
      {
        id: "neg-1",
        pilot_offer_id: "demo-pilot-1",
        sender_role: "government",
        sender_name: "Ministry of Railways",
        message: "We have reviewed your RailVision AI proposal and approved a 6-month live pilot across the Northern Railway Division with a ₹1.50 Cr milestone grant.",
        budget: 15000000,
        duration: 180,
        created_at: new Date(Date.now() - 48 * 3600000).toISOString()
      },
      {
        id: "neg-2",
        pilot_offer_id: "demo-pilot-1",
        sender_role: "startup",
        sender_name: "ApexVision AI Labs",
        message: "We accept the 6-month trial timeline and ₹1.50 Cr milestone allocation. Our engineering crew will initiate bogie mounts upon contract issuance.",
        budget: 15000000,
        duration: 180,
        created_at: new Date(Date.now() - 24 * 3600000).toISOString()
      }
    ]
  };

  return {
    challenges,
    applications,
    pilot_offers: pilotOffers,
    pilot_milestones: milestones,
    pilot_results: results,
    pilot_negotiations: negotiations,
    updated_at: new Date().toISOString()
  };
}

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Temp DB read error, resetting:", err);
    const initial = buildInitialState();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch (_) {}
    return initial;
  }
}

function saveStoredState(state, changeDetail = {}) {
  try {
    state.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: changeDetail }));
  } catch (err) {
    console.error("Temp DB save error:", err);
  }
}

export const tempDb = {
  // CHALLENGES
  getChallenges() {
    const state = getStoredState();
    return state.challenges || [];
  },

  getChallengeById(id) {
    const state = getStoredState();
    return (state.challenges || []).find((c) => String(c.id) === String(id)) || null;
  },

  insertChallenge(challenge) {
    const state = getStoredState();
    const newId = challenge.id || `demo-ch-${Date.now()}`;
    const newChallenge = {
      ...challenge,
      id: newId,
      created_at: challenge.created_at || new Date().toISOString(),
      status: challenge.status || "Published"
    };
    state.challenges = [newChallenge, ...(state.challenges || [])];
    saveStoredState(state, { table: "challenges", action: "insert", record: newChallenge });
    return newChallenge;
  },

  updateChallenge(id, updates) {
    const state = getStoredState();
    let updatedRecord = null;
    state.challenges = (state.challenges || []).map((c) => {
      if (String(c.id) === String(id)) {
        updatedRecord = { ...c, ...updates, updated_at: new Date().toISOString() };
        return updatedRecord;
      }
      return c;
    });
    if (updatedRecord) {
      saveStoredState(state, { table: "challenges", action: "update", record: updatedRecord });
    }
    return updatedRecord;
  },

  deleteChallenge(id) {
    const state = getStoredState();
    state.challenges = (state.challenges || []).filter((c) => String(c.id) !== String(id));
    saveStoredState(state, { table: "challenges", action: "delete", id });
  },

  // APPLICATIONS
  getApplications() {
    const state = getStoredState();
    const challenges = state.challenges || [];
    return (state.applications || []).map((app) => ({
      ...app,
      challenges: challenges.find((c) => String(c.id) === String(app.challenge_id)) || app.challenges || null
    }));
  },

  getApplicationById(id) {
    const state = getStoredState();
    const app = (state.applications || []).find((a) => String(a.id) === String(id));
    if (!app) return null;
    const challenge = (state.challenges || []).find((c) => String(c.id) === String(app.challenge_id)) || app.challenges;
    return { ...app, challenges: challenge };
  },

  getApplicationsByChallenge(challengeId) {
    return this.getApplications().filter((a) => String(a.challenge_id) === String(challengeId));
  },

  getApplicationsByStartup(startupId) {
    return this.getApplications().filter((a) => !startupId || String(a.startup_id) === String(startupId) || a.startup_id === "demo-startup-apex-001");
  },

  insertApplication(application) {
    const state = getStoredState();
    const newId = application.id || `demo-app-${Date.now()}`;
    const challenge = (state.challenges || []).find((c) => String(c.id) === String(application.challenge_id));

    const newApp = {
      ...application,
      id: newId,
      startup_id: application.startup_id || DEFAULT_STARTUP_PROFILE.id,
      startup_name: application.startup_name || DEFAULT_STARTUP_PROFILE.organization_name,
      contact_person: application.contact_person || DEFAULT_STARTUP_PROFILE.full_name,
      status: application.status || "Submitted",
      created_at: application.created_at || new Date().toISOString(),
      challenges: challenge || null
    };

    state.applications = [newApp, ...(state.applications || [])];
    saveStoredState(state, { table: "applications", action: "insert", record: newApp });
    return newApp;
  },

  updateApplication(id, updates) {
    const state = getStoredState();
    let updatedRecord = null;
    state.applications = (state.applications || []).map((a) => {
      if (String(a.id) === String(id)) {
        updatedRecord = { ...a, ...updates, updated_at: new Date().toISOString() };
        return updatedRecord;
      }
      return a;
    });
    if (updatedRecord) {
      saveStoredState(state, { table: "applications", action: "update", record: updatedRecord });
    }
    return updatedRecord;
  },

  // PILOT OFFERS
  getPilotOffers() {
    const state = getStoredState();
    const challenges = state.challenges || [];
    const applications = state.applications || [];

    return (state.pilot_offers || []).map((po) => {
      const ch = challenges.find((c) => String(c.id) === String(po.challenge_id)) || po.challenges;
      const app = applications.find((a) => String(a.id) === String(po.application_id)) || po.applications;
      const localStatus = localStorage.getItem(`udyam_pilot_status_${po.id}`);
      return {
        ...po,
        status: localStatus || po.status || "in_progress",
        challenges: ch || { title: "Challenge", department: "Department" },
        applications: app || { solution_title: "Solution", startup_name: "Startup" },
        startup_profile: po.startup_profile || DEFAULT_STARTUP_PROFILE
      };
    });
  },

  getPilotOfferById(id) {
    const list = this.getPilotOffers();
    return list.find((p) => String(p.id) === String(id)) || list[0] || null;
  },

  insertPilotOffer(offer) {
    const state = getStoredState();
    const newId = offer.id || `demo-pilot-${Date.now()}`;
    const ch = (state.challenges || []).find((c) => String(c.id) === String(offer.challenge_id));
    const app = (state.applications || []).find((a) => String(a.id) === String(offer.application_id));

    const newOffer = {
      ...offer,
      id: newId,
      status: offer.status || "proposed",
      created_at: new Date().toISOString(),
      challenges: ch || null,
      applications: app || null,
      startup_profile: offer.startup_profile || DEFAULT_STARTUP_PROFILE,
      milestones: offer.milestones || [
        { id: `m-${Date.now()}-1`, title: "Phase 1: Setup & Kickoff", status: "In Progress", date: "2026-10-15" },
        { id: `m-${Date.now()}-2`, title: "Phase 2: Validation", status: "Pending", date: "2026-11-30" }
      ]
    };

    state.pilot_offers = [newOffer, ...(state.pilot_offers || [])];

    // Also update application status if linked
    if (offer.application_id) {
      state.applications = (state.applications || []).map((a) => {
        if (String(a.id) === String(offer.application_id)) {
          return { ...a, status: "Pilot Offered" };
        }
        return a;
      });
    }

    saveStoredState(state, { table: "pilot_offers", action: "insert", record: newOffer });
    return newOffer;
  },

  updatePilotOffer(id, updates) {
    const state = getStoredState();
    let updatedRecord = null;

    if (updates.status) {
      try {
        localStorage.setItem(`udyam_pilot_status_${id}`, updates.status);
      } catch (_) {}
    }

    state.pilot_offers = (state.pilot_offers || []).map((po) => {
      if (String(po.id) === String(id)) {
        updatedRecord = { ...po, ...updates, updated_at: new Date().toISOString() };
        return updatedRecord;
      }
      return po;
    });

    if (updatedRecord) {
      saveStoredState(state, { table: "pilot_offers", action: "update", record: updatedRecord });
    }
    return updatedRecord;
  },

  // MILESTONES
  getMilestones(pilotOfferId) {
    const state = getStoredState();
    const pMilestones = state.pilot_milestones || {};
    return pMilestones[pilotOfferId] || [];
  },

  insertMilestone(milestone) {
    const state = getStoredState();
    const pid = milestone.pilot_offer_id || "demo-pilot-1";
    state.pilot_milestones = state.pilot_milestones || {};
    const currentList = state.pilot_milestones[pid] || [];

    const newM = {
      ...milestone,
      id: milestone.id || `demo-m-${Date.now()}`,
      status: milestone.status || "pending",
      payment_status: milestone.payment_status || "not_due",
      created_at: new Date().toISOString()
    };

    state.pilot_milestones[pid] = [...currentList, newM];
    saveStoredState(state, { table: "pilot_milestones", action: "insert", record: newM, pilotOfferId: pid });
    return newM;
  },

  updateMilestone(pilotOfferId, milestoneId, updates) {
    const state = getStoredState();
    state.pilot_milestones = state.pilot_milestones || {};
    const currentList = state.pilot_milestones[pilotOfferId] || [];
    let updated = null;

    state.pilot_milestones[pilotOfferId] = currentList.map((m) => {
      if (String(m.id) === String(milestoneId)) {
        updated = { ...m, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return m;
    });

    if (updated) {
      saveStoredState(state, { table: "pilot_milestones", action: "update", record: updated, pilotOfferId });
    }
    return updated;
  },

  // PILOT RESULTS
  getPilotResult(pilotOfferId) {
    const state = getStoredState();
    const results = state.pilot_results || {};
    return results[pilotOfferId] || null;
  },

  upsertPilotResult(pilotOfferId, payload) {
    const state = getStoredState();
    state.pilot_results = state.pilot_results || {};
    const existing = state.pilot_results[pilotOfferId] || {};

    const merged = {
      ...existing,
      pilot_offer_id: pilotOfferId,
      ...payload,
      updated_at: new Date().toISOString()
    };

    state.pilot_results[pilotOfferId] = merged;
    try {
      localStorage.setItem(`udyam_pilot_result_${pilotOfferId}`, JSON.stringify(merged));
    } catch (_) {}

    saveStoredState(state, { table: "pilot_results", action: "upsert", record: merged, pilotOfferId });
    return merged;
  },

  // NEGOTIATIONS
  getNegotiations(pilotOfferId) {
    const state = getStoredState();
    const neg = state.pilot_negotiations || {};
    return neg[pilotOfferId] || [];
  },

  insertNegotiation(negotiation) {
    const state = getStoredState();
    const pid = negotiation.pilot_offer_id || "demo-pilot-1";
    state.pilot_negotiations = state.pilot_negotiations || {};
    const current = state.pilot_negotiations[pid] || [];

    const newNeg = {
      ...negotiation,
      id: negotiation.id || `neg-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    state.pilot_negotiations[pid] = [...current, newNeg];
    saveStoredState(state, { table: "pilot_negotiations", action: "insert", record: newNeg, pilotOfferId: pid });
    return newNeg;
  },

  // RESET DATABASE
  resetTempDb() {
    const pristine = buildInitialState();
    // Clean up status keys
    try {
      localStorage.removeItem("udyam_pilot_status_demo-pilot-1");
      localStorage.removeItem("udyam_pilot_status_demo-pilot-2");
      localStorage.removeItem("udyam_pilot_result_demo-pilot-1");
      localStorage.removeItem("udyam_pilot_result_demo-pilot-2");
    } catch (_) {}

    saveStoredState(pristine, { table: "all", action: "reset" });
    return pristine;
  }
};

/**
 * Event listener helper for components
 */
export function subscribeTempDb(callback) {
  const handler = (e) => {
    callback(e.detail);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      callback({ table: "storage", action: "sync" });
    }
  });

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}
