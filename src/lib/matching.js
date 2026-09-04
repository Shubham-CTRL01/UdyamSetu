/**
 * AI-Assisted Match Scoring Engine
 *
 * Deterministic fallback algorithm for the MVP. Designed to be cleanly
 * replaceable with an LLM-based scorer when an AI API key is provisioned.
 *
 * The engine performs real text-analysis: tokenisation, stop-word removal,
 * Jaccard keyword-overlap similarity, sector keyword matching, budget parsing,
 * and timeline feasibility heuristics. No scores are hardcoded.
 *
 * Scorer version 'deterministic-mvp-v1' is reported so callers can detect
 * which algorithm produced a given result.
 */

export const SCORER_VERSION = "deterministic-mvp-v1";

export const SCORING_WEIGHTS = {
  problemFit: 0.20,
  technicalFit: 0.18,
  impact: 0.15,
  feasibility: 0.12,
  timeline: 0.10,
  budgetFit: 0.10,
  capability: 0.15,
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "shall", "this", "that",
  "these", "those", "it", "its", "as", "if", "then", "than", "so",
  "such", "all", "any", "some", "no", "not", "only", "also", "across",
  "through", "into", "out", "up", "down", "over", "under", "again",
  "further", "once", "here", "there", "when", "where", "why", "how",
  "what", "which", "who", "whom", "whose", "am", "i", "you", "we", "they",
  "them", "their", "our", "your", "his", "her", "its", "their", "theirs",
  "ours", "yours", "hers", "ourselves", "yourselves", "themselves",
  "each", "few", "more", "most", "other", "very", "just", "should",
]);

const SECTOR_TECH_KEYWORDS = {
  "Deep Tech": ["ai", "ml", "machine learning", "computer vision", "nlp", "neural", "edge", "iot", "sensor", "blockchain", "quantum", "predictive", "algorithm"],
  "Defence & Aerospace": ["drone", "surveillance", "radar", "stealth", "satellite", "aerospace", "defence", "comms", "electronic", "warfare", "swarm", "mesh"],
  "HealthTech & Life Sciences": ["diagnostic", "biotech", "medical", "patient", "health", "biometric", "telemedicine", "wearable", "cdsco", "abha"],
  "CleanTech & Renewable Energy": ["solar", "wind", "energy", "waste", "recycling", "carbon", "emission", "renewable", "clean", "sustainability"],
  "AgriTech & Food Processing": ["agriculture", "farm", "crop", "yield", "soil", "irrigation", "precision", "livestock", "harvest"],
  "Smart Cities & Infrastructure": ["smart", "urban", "infrastructure", "iot", "sensor", "city", "traffic", "mobility", "smartcity", "surveillance"],
  "Cybersecurity & AI": ["security", "cyber", "attack", "encryption", "threat", "firewall", "zero-trust", "identity", "ai", "ml"],
  "FinTech & GovTech": ["payment", "transaction", "digital", "banking", "govtech", "api", "integration", "settlement", "ledger"],
  "Manufacturing & Robotics": ["robotics", "automation", "manufacturing", "assembly", "cnc", "industrial", "iot", "cobot", "industry 4.0"],
};

const MATURITY_SCORES = {
  "Concept / Ideation": 20,
  "Proof of Concept": 35,
  "Prototype": 50,
  "TRL-4 / Validation": 55,
  "TRL-5 / Lab Tested": 60,
  "TRL-6 / Prototype Tested": 65,
  "TRL-7 / Demo": 70,
  "TRL-8 / Actual System": 85,
  "TRL-9 / Deployed": 100,
  "Deployed / Production": 100,
};

const INDIAN_NUMERIC_WORDS = {
  k: 1000, thousand: 1000, thousands: 1000,
  lakh: 100000, lakhs: 100000,
  crore: 10000000, crores: 10000000,
  million: 1000000, millions: 1000000,
  billion: 1000000000, billions: 1000000000,
};

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const combined = lower.replace(/[/&]/g, " ");
  const raw = combined.match(/\b[\w\s]+\b/g) || [];
  return raw
    .flatMap((w) => w.trim().split(/\s+/).filter(Boolean))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccard(setA, setB) {
  if (setA.length === 0 && setB.length === 0) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  if (union === 0) return 0;
  return inter / union;
}

function ngramJaccard(textA, textB, n = 2) {
  const a = textA || "";
  const b = textB || "";
  const gramsA = new Set();
  const gramsB = new Set();
  for (let i = 0; i <= a.length - n; i++) gramsA.add(a.slice(i, i + n));
  for (let i = 0; i <= b.length - n; i++) gramsB.add(b.slice(i, i + n));
  if (gramsA.size === 0 && gramsB.size === 0) return 0;
  const inter = [...gramsA].filter((g) => gramsB.has(g)).length;
  const union = new Set([...gramsA, ...gramsB]).size;
  if (union === 0) return 0;
  return inter / union;
}

function keywordOverlap(challengeText, appText) {
  const cTokens = new Set(tokenize(challengeText));
  const appTokens = tokenize(appText);
  if (cTokens.size === 0 || appTokens.length === 0) return 0;
  let matches = 0;
  for (const tok of appTokens) {
    if (cTokens.has(tok)) matches++;
  }
  return matches / appTokens.length;
}

function parseBudgetToNumber(raw) {
  if (!raw) return null;
  const lower = String(raw).toLowerCase().replace(/,/g, " ");
  const singleMatch = lower.match(/(\d+(?:\.\d+)?)\s*(lakh|crore|million|billion|k| thousand)?/i);
  if (!singleMatch) return null;
  const num = parseFloat(singleMatch[1]);
  const word = singleMatch[2]?.trim().toLowerCase();
  if (word && word in INDIAN_NUMERIC_WORDS) return num * INDIAN_NUMERIC_WORDS[word];
  if (/^\d+$/.test(lower.trim())) return parseFloat(lower.trim());
  return num;
}

function parseTimelineToDays(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  const daysMatch = lower.match(/(\d+)\s*days?/);
  const weeksMatch = lower.match(/(\d+)\s*weeks?/);
  const monthsMatch = lower.match(/(\d+)\s*months?/);
  const yearsMatch = lower.match(/(\d+)\s*years?/);
  if (monthsMatch) return parseInt(monthsMatch[1]) * 30;
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;
  if (yearsMatch) return parseInt(yearsMatch[1]) * 365;
  if (daysMatch) return parseInt(daysMatch[1]);
  return null;
}

function sectorKeywordScore(challengeSector, appTechText) {
  const kwList = SECTOR_TECH_KEYWORDS[challengeSector] || [];
  if (kwList.length === 0) return 50;
  const appTokens = tokenize(appTechText);
  const techTokens = new Set(appTokens);
  let matches = 0;
  const total = kwList.length;
  for (const kw of kwList) {
    const kwTokens = tokenize(kw);
    if (kwTokens.length === 1) {
      if (techTokens.has(kw)) matches++;
    } else {
      if (appTechText.toLowerCase().includes(kw)) matches++;
    }
  }
  return clamp((matches / total) * 100, 0, 100);
}

function maturityScore(text) {
  if (!text) return 30;
  const lower = String(text).toLowerCase();
  for (const [key, score] of Object.entries(MATURITY_SCORES)) {
    if (lower.includes(key.toLowerCase())) return score;
  }
  return 30;
}

function computeProblemFit(challenge, application) {
  const challengeText = [
    challenge.problem_statement || "",
    challenge.description || "",
    challenge.expected_outcome || "",
  ].join(" ");
  const appText = [
    application.solution_description || "",
    application.problem_solving_approach || "",
    application.pitch_summary || "",
  ].join(" ");

  const jaccardScore = jaccard(tokenize(challengeText), appText) * 100;
  const kwScore = keywordOverlap(challengeText, appText) * 100;

  const combined = jaccardScore * 0.5 + kwScore * 0.5;
  return clamp(combined);
}

function computeTechnicalFit(challenge, application) {
  const techText = [
    application.technology || "",
    application.key_features || "",
  ].join(" ");
  const sectorScore = sectorKeywordScore(challenge.sector, techText);
  const kwScore = keywordOverlap(
    [challenge.problem_statement, challenge.description].join(" "),
    techText
  ) * 100;
  const combined = sectorScore * 0.6 + kwScore * 0.4;
  return clamp(combined);
}

function computeImpact(challenge, application) {
  const challengeText = challenge.expected_outcome || challenge.description || "";
  const appText = application.expected_impact || "";
  const jaccardScore = jaccard(tokenize(challengeText), appText) * 100;
  const kwScore = keywordOverlap(challengeText, appText) * 100;
  const combined = jaccardScore * 0.5 + kwScore * 0.5;
  return clamp(combined);
}

function computeFeasibility(application) {
  const mScore = maturityScore(application.current_maturity);
  let descScore = 50;
  if (application.implementation_methodology) {
    const tokens = tokenize(application.implementation_methodology);
    descScore = clamp(tokens.length > 5 ? 70 : 40);
  }
  return clamp(mScore * 0.7 + descScore * 0.3);
}

function computeTimeline(challenge, application) {
  const appDays = parseTimelineToDays(application.timeline);
  const challengeBudget = challenge.budget || "";
  if (!appDays) return 60;
  const budgetLower = challengeBudget.toLowerCase();
  let expectedMax = 180;
  if (budgetLower.includes("pilot")) expectedMax = 120;
  if (budgetLower.includes("prototype")) expectedMax = 180;
  if (budgetLower.includes("grant")) expectedMax = 365;
  let score;
  if (appDays <= 30) score = 85;
  else if (appDays <= 60) score = 80;
  else if (appDays <= 90) score = 75;
  else if (appDays <= 120) score = 70;
  else if (appDays <= expectedMax) score = 60;
  else score = 40;
  if (budgetLower.includes("rapid") || budgetLower.includes("fast")) score += 10;
  return clamp(score);
}

function computeBudgetFit(challenge, application) {
  const govBudget = parseBudgetToNumber(challenge.budget);
  const appBudget = parseBudgetToNumber(application.estimated_cost);
  if (govBudget && appBudget) {
    const ratio = appBudget / govBudget;
    let score;
    if (ratio <= 0.5) score = 90;
    else if (ratio <= 0.75) score = 85;
    else if (ratio <= 1.0) score = 80;
    else if (ratio <= 1.25) score = 70;
    else if (ratio <= 1.5) score = 55;
    else score = 30;
    return clamp(score);
  }
  return 55;
}

function computeCapability(application, profile) {
  const teamText = [
    application.team_capabilities || "",
    application.existing_deployments || "",
    profile?.sector || "",
    profile?.description || "",
  ].join(" ");
  const tokens = tokenize(teamText);
  let score = 40;
  if (tokens.length > 10) score += 20;
  if (tokens.length > 25) score += 15;
  const lower = teamText.toLowerCase();
  if (lower.includes("deployment") || lower.includes("pilot")) score += 10;
  if (lower.includes("customer") || lower.includes("client") || lower.includes("production")) score += 10;
  const maturity = maturityScore(application.current_maturity || "");
  score = score * 0.5 + maturity * 0.5;
  return clamp(score);
}

function generateAnalysis(challenge, application, scores) {
  const challengeSector = challenge.sector || "general";
  const startupName = application.startup_name || "This startup";
  let parts = [];

  parts.push(
    `${startupName} proposes a solution that ${scores.problemFit >= 80 ? "directly addresses" : scores.problemFit >= 60 ? "moderately addresses" : "only loosely addresses"} the challenge's problem statement. ${startupName}'s approach shows ${scores.technicalFit >= 80 ? "strong alignment" : scores.technicalFit >= 60 ? "moderate alignment" : "limited alignment"} with the ${challengeSector} domain requirements.`
  );

  parts.push(
    `The proposed impact of "${application.expected_impact || "the solution"}" ${scores.impact >= 80 ? "strongly matches" : scores.impact >= 60 ? "partially aligns" : "differs from"} the expected outcome of "${challenge.expected_outcome || "the challenge"}".`
  );

  parts.push(
    `Implementation feasibility is rated ${scores.feasibility >= 80 ? "high" : scores.feasibility >= 60 ? "moderate" : "low"} based on the stated maturity level of "${application.current_maturity || "not specified"}" and the proposed methodology.`
  );

  parts.push(
    `The proposed timeline (${application.timeline || "unspecified"}) ${scores.timeline >= 70 ? "fits within" : scores.timeline >= 50 ? "is reasonable for" : "may exceed"} typical government pilot expectations for this sector.`
  );

  return parts.join(" ");
}

function generateConcerns(challenge, application, scores) {
  let concerns = [];

  if (scores.problemFit < 60) {
    concerns.push(
      `The solution may not fully address the core problem: "${challenge.problem_statement?.substring(0, 200)}${challenge.problem_statement?.length > 200 ? "..." : ""}".`
    );
  }
  if (scores.technicalFit < 50) {
    concerns.push(
      `The technology stack ("${application.technology || "unspecified"}") may lack the required capabilities for the ${challenge.sector} domain.`
    );
  }
  if (scores.impact < 50) {
    concerns.push(
      `The expected impact ("${application.expected_impact || "unspecified"}") does not clearly demonstrate achievement of the challenge's desired outcome.`
    );
  }
  if (scores.feasibility < 50) {
    concerns.push(
      `The solution maturity ("${application.current_maturity || "not specified"}") may be too early for a government pilot deployment.`
    );
  }
  if (scores.budgetFit < 55) {
    concerns.push(
      `The proposed budget (${application.estimated_cost || "unspecified"}) may be ${scores.budgetFit < 40 ? "significantly above" : "above"} the challenge's stated budget (${challenge.budget || "unspecified"}).`
    );
  }
  if (scores.capability < 50) {
    concerns.push(
      `The startup's demonstrated capability and deployment history may be insufficient for the scale of this challenge.`
    );
  }
  if (scores.timeline < 50) {
    concerns.push(`The proposed timeline (${application.timeline || "unspecified"}) may not align with project deadlines.`);
  }

  if (concerns.length === 0) {
    concerns.push(
      "No significant concerns were identified. However, the AI analysis is based on automated text analysis and should be reviewed alongside human judgment."
    );
  }

  concerns.push(
    "This analysis is AI-assisted and provides decision-support only — final evaluation rests with the reviewing government department."
  );

  return concerns.join(" ");
}

/**
 * Main analysis entry point.
 *
 * @param {object} challenge      — row from public.challenges
 * @param {object} application    — row from public.challenge_applications
 * @param {object} startupProfile — row from public.profiles (startup)
 * @returns {Promise<object>} analysis result
 */
export async function analyzeApplication(challenge, application, startupProfile) {
  const s = {
    problemFit: clamp(computeProblemFit(challenge, application)),
    technicalFit: clamp(computeTechnicalFit(challenge, application)),
    impact: clamp(computeImpact(challenge, application)),
    feasibility: clamp(computeFeasibility(application)),
    timeline: clamp(computeTimeline(challenge, application)),
    budgetFit: clamp(computeBudgetFit(challenge, application)),
  };
  s.capability = clamp(computeCapability(application, startupProfile));

  const weightedSum = Object.entries(SCORING_WEIGHTS).reduce((total, [key, weight]) => {
    return total + (s[key] || 0) * weight;
  }, 0);
  s.overall = clamp(weightedSum);

  const analysisText = generateAnalysis(challenge, application, s);
  const concernsText = generateConcerns(challenge, application, s);

  return {
    overallScore: s.overall,
    scores: {
      problemFit: s.problemFit,
      technicalFit: s.technicalFit,
      impact: s.impact,
      feasibility: s.feasibility,
      timeline: s.timeline,
      budgetFit: s.budgetFit,
      capability: s.capability,
    },
    analysisText,
    concernsText,
    scorerVersion: SCORER_VERSION,
  };
}

/**
 * Persist the analysis result to the ai_match_scores table.
 * Only the verified government owner of the challenge can write.
 *
 * @param {object} supabaseClient — Supabase client instance
 * @param {string} applicationId — challenge_applications.id
 * @param {object} result — return value of analyzeApplication
 * @returns {Promise<{error}>}
 */
export async function saveMatchScore(supabaseClient, applicationId, result) {
  const { error } = await supabaseClient.from("ai_match_scores").upsert({
    application_id: applicationId,
    overall_score: result.overallScore,
    problem_fit: result.scores.problemFit,
    technical_fit: result.scores.technicalFit,
    impact_score: result.scores.impact,
    feasibility_score: result.scores.feasibility,
    timeline_score: result.scores.timeline,
    budget_fit: result.scores.budgetFit,
    capability_score: result.scores.capability,
    analysis_text: result.analysisText,
    concerns_text: result.concernsText,
    scorer_version: result.scorerVersion,
  });
  return { error };
}

/**
 * Fetch a cached match score from the database.
 *
 * @param {object} supabaseClient
 * @param {string} applicationId
 * @returns {Promise<{data}>}
 */
export async function fetchMatchScore(supabaseClient, applicationId) {
  const { data } = await supabaseClient
    .from("ai_match_scores")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();
  return { data };
}

/**
 * Trigger (or retrieve cached) AI analysis for an application.
 *
 * @param {object} supabaseClient
 * @param {string} applicationId
 * @param {object} challenge
 * @param {object} application
 * @param {object} startupProfile
 * @returns {Promise<{data, fromCache, error}>}
 */
export async function getOrCreateMatchScore(supabaseClient, applicationId, challenge, application, startupProfile) {
  try {
    const { data: cached } = await fetchMatchScore(supabaseClient, applicationId);
    if (cached) {
      return { data: cached, fromCache: true, error: null };
    }
    const result = await analyzeApplication(challenge, application, startupProfile);
    const { error } = await saveMatchScore(supabaseClient, applicationId, result);
    if (error) return { data: result, fromCache: false, error };
    return { data: result, fromCache: false, error: null };
  } catch (err) {
    return { data: null, fromCache: false, error: err.message };
  }
}
