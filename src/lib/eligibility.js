/**
 * Client-side eligibility PREVIEW only — mirrors the two checks the database
 * always recomputes authoritatively in evaluate_application_eligibility()
 * (supabase/schema.sql, section 20) at insert time. This never gets trusted
 * or stored as-is; it only lets an applicant see the checklist before they
 * submit. The real, stored eligibility_status/eligibility_reasons always
 * come back from the server on the row returned after insert.
 */
export function previewEligibility(challenge, startupProfile) {
  const reasons = [];
  let verdict = "eligible";

  const deadline = challenge?.deadline ? new Date(challenge.deadline) : null;
  if (deadline && new Date() > deadline) {
    verdict = "not_eligible";
    reasons.push({ ok: false, label: "Challenge application deadline has passed" });
  } else {
    reasons.push({ ok: true, label: "Within application deadline" });
  }

  const challengeSector = challenge?.sector;
  const applicantSector = startupProfile?.sector;
  if (challengeSector && applicantSector && challengeSector !== applicantSector) {
    if (verdict === "eligible") verdict = "needs_review";
    reasons.push({
      ok: false,
      label: `Startup sector (${applicantSector}) differs from the challenge sector (${challengeSector})`,
    });
  } else {
    reasons.push({ ok: true, label: "Sector requirement satisfied" });
  }

  return { status: verdict, reasons };
}

export const ELIGIBILITY_LABELS = {
  eligible: "Eligible",
  not_eligible: "Not Eligible",
  needs_review: "Needs Review",
};

export const ELIGIBILITY_COLORS = {
  eligible: "bg-emerald-100 text-emerald-800 border-emerald-200",
  not_eligible: "bg-rose-100 text-rose-800 border-rose-200",
  needs_review: "bg-amber-100 text-amber-800 border-amber-200",
};
