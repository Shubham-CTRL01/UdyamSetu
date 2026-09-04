-- ============================================================
-- UdyamSetu Database Schema & Role-Based System with Government Verification
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (Users with role: 'government', 'startup', or 'admin')
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'startup' check (role in ('government', 'startup', 'admin')),
  verification_status text not null default 'verified' check (verification_status in ('pending', 'verified', 'rejected')),
  organization_name text,
  designation text,
  govt_level text,
  sector text,
  description text,
  website text,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safely add/update columns if profiles table already exists:
alter table public.profiles add column if not exists role text not null default 'startup';
alter table public.profiles add column if not exists verification_status text not null default 'verified';
alter table public.profiles add column if not exists organization_name text;
alter table public.profiles add column if not exists designation text;
alter table public.profiles add column if not exists govt_level text;
alter table public.profiles add column if not exists sector text;
alter table public.profiles add column if not exists description text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists rejection_reason text;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Update check constraints for role and verification_status
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('government', 'startup', 'admin'));

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles add constraint profiles_verification_status_check check (verification_status in ('pending', 'verified', 'rejected'));

alter table public.profiles enable row level security;

-- SECURITY DEFINER helper: looks up the caller's admin status by bypassing RLS.
-- Policies MUST call this instead of querying public.profiles directly for an
-- admin check — a policy on public.profiles that queries public.profiles under
-- RLS re-triggers itself and Postgres raises "infinite recursion detected in
-- policy for relation profiles" (and the same error cascades to every other
-- table whose policies also check admin status this way).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- True only for connections with no PostgREST/GoTrue JWT context at all —
-- i.e. a direct Postgres session such as the Supabase SQL Editor or the
-- Management API's /database/query endpoint. Every request that goes through
-- the public REST API (anon or authenticated) always carries a JWT with a
-- 'role' claim, so this can never be spoofed by an app user; it only ever
-- reflects "someone with the project's own database credentials ran this
-- directly," which the admin UI has been removed in favour of.
create or replace function public.is_trusted_direct_access()
returns boolean
language sql
stable
as $$
  select auth.role() is null;
$$;

-- Anti-tampering function & trigger: prevents self-registration privilege escalation
-- (INSERT) and non-admins modifying their own role/verification_status (UPDATE).
--
-- The INSERT policy below only checks `auth.uid() = id` — nothing stops a
-- freshly signed-up user from calling
-- `supabase.from('profiles').insert({ id: session.user.id, role: 'admin',
-- verification_status: 'verified', ... })` directly against the REST API
-- before the app ever runs its own insert, since Postgres RLS/grants don't
-- know or care which client sent the request. Before this fix that request
-- would have succeeded and made every public.is_admin() check on every
-- other table treat that user as an administrator.
create or replace function public.handle_profile_security_update()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if public.is_admin() or public.is_trusted_direct_access() then
      return new; -- admin-initiated or direct-SQL inserts (tooling) pass through untouched
    end if;
    -- Self-registration: role can only be the two self-selectable tracks —
    -- 'admin' is never claimable this way — and verification_status is
    -- always derived server-side from that role, never trusted from the
    -- client (a government account cannot insert itself as 'verified').
    if new.role is distinct from 'government' then
      new.role := 'startup';
    end if;
    new.verification_status := case when new.role = 'government' then 'pending' else 'verified' end;
    new.rejection_reason := null;
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE path: non-admins cannot alter role, verification_status, or rejection_reason.
  -- Direct SQL (SQL Editor / Management API) is trusted since it requires the
  -- project owner's own credentials — this is how government department
  -- verification is approved now that there is no admin dashboard UI.
  if not (public.is_admin() or public.is_trusted_direct_access()) then
    new.role := old.role;
    new.verification_status := old.verification_status;
    new.rejection_reason := old.rejection_reason;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_prevent_role_tampering on public.profiles;
create trigger tr_prevent_role_tampering
  before insert or update on public.profiles
  for each row execute function public.handle_profile_security_update();

-- Profiles RLS policies:
-- Users can view their own profile; Admins can view all profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (
    auth.uid() = id or
    public.is_admin()
  );

drop policy if exists "Users can upsert own profile" on public.profiles;
create policy "Users can upsert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Users can update their own profile; Admins can update any profile (e.g. approve/reject verification)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (
    auth.uid() = id or
    public.is_admin()
  );


-- 2. BUSINESSES (For startups & MSMEs)
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  business_type text,
  category text,
  state text,
  district text,
  address text,
  annual_turnover bigint,
  employee_count int,
  created_at timestamptz default now()
);
alter table public.businesses enable row level security;

drop policy if exists "Users manage own businesses" on public.businesses;
create policy "Users manage own businesses" on public.businesses
  for all using (auth.uid() = user_id);


-- 3. SCHEMES (General Gov schemes catalog)
create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  eligibility text,
  benefits text,
  status text default 'active',
  created_at timestamptz default now()
);
alter table public.schemes enable row level security;

drop policy if exists "Schemes are publicly readable" on public.schemes;
create policy "Schemes are publicly readable" on public.schemes
  for select using (true);


-- 4. CHALLENGES (Proposed by VERIFIED Government Departments)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete cascade,
  title text not null,
  problem_statement text not null,
  description text,
  department text not null,
  sector text not null,
  expected_outcome text,
  eligibility text,
  deadline date,
  budget text,
  location text,
  status text default 'Published' check (status in ('Draft', 'Published', 'Closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.challenges enable row level security;

-- Challenges RLS policies:
-- Anyone can view Published challenges; creator can see drafts/closed; Admins can see all
drop policy if exists "View challenges policy" on public.challenges;
create policy "View challenges policy" on public.challenges
  for select using (
    status = 'Published' or
    auth.uid() = created_by or
    public.is_admin()
  );

-- ONLY VERIFIED government users can create challenges
drop policy if exists "Government users create challenges" on public.challenges;
drop policy if exists "Verified government users create challenges" on public.challenges;
create policy "Verified government users create challenges" on public.challenges
  for insert with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'government'
      and verification_status = 'verified'
    )
  );

-- ONLY VERIFIED government users (or admins) can update their own challenges
drop policy if exists "Government users update own challenges" on public.challenges;
drop policy if exists "Verified government users update own challenges" on public.challenges;
create policy "Verified government users update own challenges" on public.challenges
  for update using (
    (
      auth.uid() = created_by and
      exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role = 'government'
        and verification_status = 'verified'
      )
    ) or
    public.is_admin()
  );

-- ONLY VERIFIED government users can delete their own draft challenges
drop policy if exists "Government users delete draft challenges" on public.challenges;
drop policy if exists "Verified government users delete draft challenges" on public.challenges;
create policy "Verified government users delete draft challenges" on public.challenges
  for delete using (
    auth.uid() = created_by and
    status = 'Draft' and
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'government'
      and verification_status = 'verified'
    )
  );


-- 5. CHALLENGE APPLICATIONS (Submitted by Startups)
create table if not exists public.challenge_applications (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  startup_id uuid references public.profiles(id) on delete cascade not null,
  startup_name text not null,
  contact_person text not null,
  solution_title text not null,
  solution_description text not null,
  technology text,
  expected_impact text,
  timeline text,
  estimated_cost text,
  status text default 'Submitted' check (status in ('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Selected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(challenge_id, startup_id)
);
alter table public.challenge_applications enable row level security;

-- Challenge Applications RLS policies:
-- Startups can apply to challenges
drop policy if exists "Startups can apply to challenges" on public.challenge_applications;
create policy "Startups can apply to challenges" on public.challenge_applications
  for insert with check (
    auth.uid() = startup_id and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'startup')
  );

-- Startups can read their own applications; Verified government creators and admins can view applications
drop policy if exists "Read challenge applications policy" on public.challenge_applications;
create policy "Read challenge applications policy" on public.challenge_applications
  for select using (
    auth.uid() = startup_id or
    exists (
      select 1 from public.challenges c
      join public.profiles p on p.id = c.created_by
      where c.id = challenge_applications.challenge_id
      and c.created_by = auth.uid()
      and p.role = 'government'
      and p.verification_status = 'verified'
    ) or
    public.is_admin()
  );

-- Verified government creators and admins can update application status
drop policy if exists "Government can update application status" on public.challenge_applications;
create policy "Government can update application status" on public.challenge_applications
  for update using (
    exists (
      select 1 from public.challenges c
      join public.profiles p on p.id = c.created_by
      where c.id = challenge_applications.challenge_id
      and c.created_by = auth.uid()
      and p.role = 'government'
      and p.verification_status = 'verified'
    ) or
    public.is_admin()
  );


-- 6. SCHEME APPLICATIONS (Backward Compatibility)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  scheme_id uuid references public.schemes(id) on delete cascade not null,
  status text default 'Submitted',
  submitted_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, scheme_id)
);
alter table public.applications enable row level security;

drop policy if exists "Users manage own applications" on public.applications;
create policy "Users manage own applications" on public.applications
  for all using (auth.uid() = user_id);


-- 7. SEED INITIAL SCHEMES
-- Guarded on an empty table, not "on conflict do nothing" — id is a random
-- uuid on every insert so there is no real conflict target, and re-running
-- this file (safe/expected for every other statement above) would otherwise
-- duplicate the catalog on each run.
insert into public.schemes (name, description, category, eligibility, benefits, status)
select * from (values
(
  'PM Vishwakarma Yojana',
  'A scheme to support traditional artisans and craftspeople with skill upgradation, modern tools, digital empowerment, and market linkage.',
  'Manufacturing',
  'Traditional artisans/craftspeople aged 18+, registered Udyam MSME, annual turnover < ₹1 Cr',
  'Up to ₹3 lakh collateral-free credit, free skill training, modern toolkits worth ₹15,000, digital payment incentives',
  'active'
),
(
  'MSME Samridhi — Working Capital Loan',
  'Subsidized working capital loans for micro and small enterprises to meet day-to-day operational expenses at concessional interest rates.',
  'Finance',
  'Micro/Small enterprises with Udyam registration, operating for minimum 1 year, annual turnover up to ₹5 Cr',
  'Up to ₹50 lakh at 6% interest rate (subsidized), 3-year repayment tenure, no processing fee',
  'active'
),
(
  'GeM Seller Onboarding & Capacity Building',
  'End-to-end support for MSMEs to register as sellers on the Government e-Marketplace (GeM) and secure government procurement orders.',
  'Procurement',
  'Any registered MSME, proprietorship, partnership or private limited company with valid GST and Udyam registration',
  'Free GeM registration assistance, dedicated relationship manager, access to ₹2 lakh+ Cr annual govt procurement, priority listing',
  'active'
),
(
  'Startup India Seed Fund Scheme',
  'Provides financial assistance to early-stage startups for proof of concept, prototype development, product trials, and market entry.',
  'Startup',
  'DPIIT-recognized startup, incorporated for less than 2 years, not received more than ₹10 lakh funding from other schemes',
  'Up to ₹20 lakh for POC and prototype, up to ₹50 lakh for market entry, no equity dilution',
  'active'
),
(
  'Credit Guarantee Fund Scheme (CGTMSE)',
  'Collateral-free credit to micro and small enterprises through Member Lending Institutions with government-backed guarantee cover.',
  'Finance',
  'Micro and small enterprises (non-farm), new or existing, with viable business plan, Udyam registration mandatory',
  'Collateral-free loans up to ₹2 Cr, guarantee cover up to 85% for micro enterprises, tenure up to 7 years',
  'active'
),
(
  'Technology Upgradation Fund Scheme (TUFS)',
  'Capital subsidy for textile and jute MSMEs to upgrade technology, purchase new machinery, and improve energy efficiency.',
  'Technology',
  'Textile, apparel, jute industry MSMEs with Udyam registration, valid GST, and minimum 51% indigenous ownership',
  '15% capital subsidy on eligible machinery, interest reimbursement up to 5%, power tariff concession for 5 years',
  'active'
),
(
  'MSME Cluster Development Programme',
  'Supports formation and development of clusters of MSMEs working in the same sector for shared infrastructure and common facilities.',
  'Infrastructure',
  'Minimum 20 MSMEs in the same sector/geography willing to form a Special Purpose Vehicle (SPV)',
  'Grant of up to ₹15 Cr for common facility centre, ₹5 Cr for soft interventions, ₹10 Cr for infrastructure',
  'active'
),
(
  'Pradhan Mantri MUDRA Yojana',
  'Provides loans to non-corporate, non-farm small and micro enterprises for income-generating activities in manufacturing, trading, and services.',
  'Finance',
  'Non-corporate, non-farm micro/small enterprises, individuals running small businesses, self-employed persons',
  'Shishu: up to ₹50,000 | Kishore: ₹50,000–5 lakh | Tarun: ₹5–10 lakh, no collateral required',
  'active'
)
) as t(name, description, category, eligibility, benefits, status)
where not exists (select 1 from public.schemes);


-- 8. SEED INITIAL PUBLISHED NATIONAL CHALLENGES
-- Same empty-table guard as the schemes seed above, for the same reason.
insert into public.challenges (title, problem_statement, description, department, sector, expected_outcome, eligibility, deadline, budget, location, status)
select * from (values
(
  'AI-Powered Predictive Maintenance for Track Infrastructure',
  'Indian Railways manages over 68,000 route km. Unscheduled rail fractures and track anomalies cause speed restrictions and delays. We require an automated, vehicle-mounted or satellite-linked AI vision and acoustic sensing system to detect sub-surface rail fatigue before structural failure occurs.',
  'Proposals should demonstrate edge-processing capabilities capable of analyzing track geometry data at speeds of 100+ kmph with real-time alerting to divisional control centers.',
  'Ministry of Railways',
  'Deep Tech',
  'Field-tested pilot across 500 km of high-density freight corridor with >95% defect classification accuracy',
  'DPIIT recognized startups with proven capabilities in computer vision, acoustic sensing, or railway telemetry',
  '2026-10-15'::date,
  '₹2.5 Cr Grant + Commercial Pilot',
  'Pan-India (Northern & Eastern Corridors)',
  'Published'
),
(
  'Last-Mile Point-of-Care Diagnostic Solutions for Tier-3 Health Centres',
  'Primary Health Centres (PHCs) and Sub-Centres in remote tribal and hilly regions face shortages of diagnostic equipment, reliable power, and trained laboratory technicians. We invite modular, battery-operated diagnostic devices capable of conducting 20+ blood and urine panel tests.',
  'Must include offline-first cloud syncing via ABHA (Ayushman Bharat Health Account) API and withstand temperature variations between 5°C to 45°C.',
  'Ministry of Health & Family Welfare',
  'HealthTech & Life Sciences',
  'Deployment of 25 prototype kits across 5 aspirational districts with automated telemetry sync',
  'Startups and innovators with CDSCO compliance pathway and indigenous manufacturing capability',
  '2026-11-30'::date,
  '₹80 Lakhs + Pilot Procurement Order',
  'Northeast & Tribal Districts',
  'Published'
),
(
  'Autonomous Drone Swarm Coordination for Border Surveillance',
  'Border surveillance operations require autonomous coordination between 5 to 10 micro-UAVs operating without GPS in contested EW (electronic warfare) environments. System must provide real-time thermal/optical stitching and intrusion classification.',
  'Software algorithms must support decentralized mesh networks where loss of any single node does not degrade swarm reconnaissance capability.',
  'Ministry of Defence (iDEX / DRDO)',
  'Defence & Aerospace',
  'Successful autonomous demonstration of 5-drone perimeter surveillance under GPS-denied conditions',
  'Indian incorporated entities with >51% resident Indian ownership and iDEX eligibility',
  '2026-12-15'::date,
  '₹5.0 Cr Development Grant',
  'High-Altitude Border Test Range',
  'Published'
)
) as t(title, problem_statement, description, department, sector, expected_outcome, eligibility, deadline, budget, location, status)
where not exists (select 1 from public.challenges);


-- ============================================================
-- 10. EXTEND challenge_applications WITH ENRICHED PROPOSAL FIELDS
-- ============================================================

alter table public.challenge_applications
  add column if not exists problem_solving_approach text,
  add column if not exists key_features           text,
  add column if not exists implementation_methodology text,
  add column if not exists current_maturity      text,
  add column if not exists existing_deployments  text,
  add column if not exists team_capabilities     text,
  add column if not exists pitch_summary         text,
  add column if not exists supporting_docs_url   text;

-- Add 'Pilot Offered' status so the startup journey is traceable
alter table public.challenge_applications
  drop constraint if exists challenge_applications_status_check;
alter table public.challenge_applications
  add constraint challenge_applications_status_check
  check (status in ('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Selected', 'Pilot Offered'));

-- Trigger: the government-side UPDATE policy above only re-checks the
-- challenge relationship, not which columns changed — nothing stops a
-- government caller from also rewriting the applicant's own submission
-- (startup_id, solution_description, etc.) in the same request instead of
-- just moving `status`. The app itself (GovernmentDashboard.jsx,
-- GovernmentApplicationReview.jsx) only ever updates `status`, so pinning
-- every other column here matches actual usage and closes that gap.
create or replace function public.pin_application_content()
returns trigger as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.challenge_id               := old.challenge_id;
  new.startup_id                 := old.startup_id;
  new.startup_name               := old.startup_name;
  new.contact_person             := old.contact_person;
  new.solution_title             := old.solution_title;
  new.solution_description       := old.solution_description;
  new.technology                 := old.technology;
  new.expected_impact            := old.expected_impact;
  new.timeline                   := old.timeline;
  new.estimated_cost             := old.estimated_cost;
  new.problem_solving_approach   := old.problem_solving_approach;
  new.key_features                := old.key_features;
  new.implementation_methodology := old.implementation_methodology;
  new.current_maturity           := old.current_maturity;
  new.existing_deployments       := old.existing_deployments;
  new.team_capabilities          := old.team_capabilities;
  new.pitch_summary              := old.pitch_summary;
  new.supporting_docs_url        := old.supporting_docs_url;
  new.created_at                 := old.created_at;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pin_application_content on public.challenge_applications;
create trigger tr_pin_application_content
  before update on public.challenge_applications
  for each row execute function public.pin_application_content();


-- ============================================================
-- 11. AI MATCH SCORES (cached AI-assisted evaluation results)
-- ============================================================
create table if not exists public.ai_match_scores (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid  references public.challenge_applications(id) on delete cascade not null,
  overall_score   int   check (overall_score   between 0 and 100),
  problem_fit     int   check (problem_fit     between 0 and 100),
  technical_fit   int   check (technical_fit   between 0 and 100),
  impact_score    int   check (impact_score    between 0 and 100),
  feasibility_score int check (feasibility_score between 0 and 100),
  timeline_score  int   check (timeline_score  between 0 and 100),
  budget_fit      int   check (budget_fit      between 0 and 100),
  capability_score int check (capability_score between 0 and 100),
  analysis_text   text,
  concerns_text   text,
  scorer_version  text  default 'deterministic-mvp-v1',
  created_at      timestamptz default now(),
  unique(application_id)
);
alter table public.ai_match_scores enable row level security;

-- Verified government owners of the challenge can create/update scores
drop policy if exists "Govt owners can create AI match scores" on public.ai_match_scores;
create policy "Govt owners can create AI match scores" on public.ai_match_scores
  for insert with check (
    exists (
      select 1 from public.challenge_applications ca
      join public.challenges c      on c.id = ca.challenge_id
      join public.profiles p        on p.id = c.created_by
      where ca.id = ai_match_scores.application_id
        and p.id = auth.uid()
        and p.role = 'government'
        and p.verification_status = 'verified'
    )
  );

-- Read: startup (own), govt owner, admin
drop policy if exists "Read AI match scores policy" on public.ai_match_scores;
create policy "Read AI match scores policy" on public.ai_match_scores
  for select using (
    exists (
      select 1 from public.challenge_applications ca
      where ca.id = ai_match_scores.application_id
        and ca.startup_id = auth.uid()
    ) or
    exists (
      select 1 from public.challenge_applications ca
      join public.challenges c on c.id = ca.challenge_id
      join public.profiles p on p.id = c.created_by
      where ca.id = ai_match_scores.application_id
        and p.id = auth.uid()
        and p.role = 'government'
        and p.verification_status = 'verified'
    ) or
    public.is_admin()
  );

-- Update: verified govt owner only
drop policy if exists "Govt owners can update AI match scores" on public.ai_match_scores;
create policy "Govt owners can update AI match scores" on public.ai_match_scores
  for update using (
    exists (
      select 1 from public.challenge_applications ca
      join public.challenges c on c.id = ca.challenge_id
      join public.profiles p on p.id = c.created_by
      where ca.id = ai_match_scores.application_id
        and p.id = auth.uid()
        and p.role = 'government'
        and p.verification_status = 'verified'
    ) or
    public.is_admin()
  );

-- Delete: admin only
drop policy if exists "Admins can delete AI match scores" on public.ai_match_scores;
create policy "Admins can delete AI match scores" on public.ai_match_scores
  for delete using (
    public.is_admin()
  );


-- ============================================================
-- 12. PILOT OFFERS
-- ============================================================
create table if not exists public.pilot_offers (
  id                uuid primary key default gen_random_uuid(),
  challenge_id      uuid references public.challenges(id)               on delete cascade not null,
  application_id    uuid references public.challenge_applications(id)   on delete set null,
  government_id     uuid references public.profiles(id)               on delete cascade not null,
  startup_id        uuid references public.profiles(id)               on delete cascade not null,
  objective         text not null,
  location          text,
  duration          int,
  proposed_budget     numeric,
  start_date         date,
  deliverables        text,
  success_criteria    text,
  beneficiaries       int,
  special_conditions  text,
  additional_notes    text,
  status              text not null default 'proposed'
                      check (status in ('proposed','negotiating','accepted','declined','in_progress','completed','cancelled')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.pilot_offers enable row level security;

-- Status transition trigger — enforces Phase 8 state machine
create or replace function public.validate_pilot_status_transition()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    return new;
  end if;

  if old.status = 'proposed' then
    if new.status not in ('negotiating','accepted','declined') then
      raise exception 'Invalid transition from % to %', old.status, new.status;
    end if;
  elsif old.status = 'negotiating' then
    if new.status not in ('accepted','declined','proposed') then
      raise exception 'Invalid transition from % to %', old.status, new.status;
    end if;
  elsif old.status = 'accepted' then
    if new.status not in ('in_progress','cancelled') then
      raise exception 'Invalid transition from % to %', old.status, new.status;
    end if;
  elsif old.status = 'in_progress' then
    if new.status not in ('completed','cancelled') then
      raise exception 'Invalid transition from % to %', old.status, new.status;
    end if;
  elsif old.status in ('completed','declined','cancelled') then
    raise exception 'Cannot modify a terminal status: %', old.status;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_validate_pilot_status on public.pilot_offers;
create trigger tr_validate_pilot_status
  before update on public.pilot_offers
  for each row execute function public.validate_pilot_status_transition();

-- Auto-stamp updated_at
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_touch_pilot_offers on public.pilot_offers;
create trigger tr_touch_pilot_offers
  before update on public.pilot_offers
  for each row execute function public.touch_updated_at();

-- RLS policies for pilot_offers
-- Insert: verified government owner of the challenge
drop policy if exists "Govt owners can create pilot offers" on public.pilot_offers;
create policy "Govt owners can create pilot offers" on public.pilot_offers
  for insert with check (
    auth.uid() = government_id and
    exists (
      select 1 from public.challenges c
      join public.profiles p on p.id = c.created_by
      where c.id = pilot_offers.challenge_id
        and p.id = auth.uid()
        and p.role = 'government'
        and p.verification_status = 'verified'
    )
  );

-- Select: government owner, assigned startup, or admin
drop policy if exists "Pilot participants can read pilot offers" on public.pilot_offers;
create policy "Pilot participants can read pilot offers" on public.pilot_offers
  for select using (
    government_id = auth.uid() or
    startup_id    = auth.uid() or
    public.is_admin()
  );

-- Update: both participants can update (status transitions via trigger)
drop policy if exists "Pilot participants can update pilot offers" on public.pilot_offers;
create policy "Pilot participants can update pilot offers" on public.pilot_offers
  for update using (
    government_id = auth.uid() or
    startup_id    = auth.uid() or
    public.is_admin()
  );

-- Trigger: the policy above (and tr_validate_pilot_status) only govern who
-- may update a row and which status transitions are legal — neither stops a
-- participant from also rewriting the offer's terms (proposed_budget,
-- deliverables, objective, ...) or even reassigning startup_id/government_id
-- in that same request. The app (NegotiationWorkspace.jsx, PilotManagement.jsx)
-- only ever updates `status`; real term changes go through pilot_negotiations
-- instead. Pin everything but status so this table can't be used to alter an
-- agreed pilot's terms or ownership after the fact.
create or replace function public.pin_pilot_offer_content()
returns trigger as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.challenge_id       := old.challenge_id;
  new.application_id     := old.application_id;
  new.government_id      := old.government_id;
  new.startup_id         := old.startup_id;
  new.objective           := old.objective;
  new.location            := old.location;
  new.duration            := old.duration;
  new.proposed_budget     := old.proposed_budget;
  new.start_date          := old.start_date;
  new.deliverables        := old.deliverables;
  new.success_criteria    := old.success_criteria;
  new.beneficiaries       := old.beneficiaries;
  new.special_conditions  := old.special_conditions;
  new.additional_notes    := old.additional_notes;
  new.created_at          := old.created_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pin_pilot_offer_content on public.pilot_offers;
create trigger tr_pin_pilot_offer_content
  before update on public.pilot_offers
  for each row execute function public.pin_pilot_offer_content();

-- Delete: admin only
drop policy if exists "Admins can delete pilot offers" on public.pilot_offers;
create policy "Admins can delete pilot offers" on public.pilot_offers
  for delete using (
    public.is_admin()
  );


-- ============================================================
-- 13. PILOT NEGOTIATIONS (immutable proposal history)
-- ============================================================
create table if not exists public.pilot_negotiations (
  id                 uuid primary key default gen_random_uuid(),
  pilot_offer_id     uuid references public.pilot_offers(id) on delete cascade not null,
  sender_id          uuid references public.profiles(id)       on delete cascade not null,
  sender_role        text,
  message            text,
  proposed_budget      numeric,
  proposed_duration    int,
  proposed_start_date  date,
  status               text default 'active'
                       check (status in ('active','superseded','accepted','rejected')),
  created_at           timestamptz default now()
);
alter table public.pilot_negotiations enable row level security;

-- When a new proposal is inserted, mark previous active proposals as superseded
create or replace function public.mark_previous_negotiation_superseded()
returns trigger as $$
begin
  update public.pilot_negotiations
  set status = 'superseded'
  where pilot_offer_id = new.pilot_offer_id
    and status = 'active'
    and id <> new.id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_mark_superseded on public.pilot_negotiations;
create trigger tr_mark_superseded
  after insert on public.pilot_negotiations
  for each row execute function public.mark_previous_negotiation_superseded();

-- RLS: both pilot participants can read
drop policy if exists "Pilot participants read negotiations" on public.pilot_negotiations;
create policy "Pilot participants read negotiations" on public.pilot_negotiations
  for select using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_negotiations.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    ) or
    public.is_admin()
  );

-- Insert: only the actual sender who is a participant
drop policy if exists "Pilot participants insert negotiations" on public.pilot_negotiations;
create policy "Pilot participants insert negotiations" on public.pilot_negotiations
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_negotiations.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    )
  );

-- Update: participants can update status of active proposals
drop policy if exists "Participants can update negotiation status" on public.pilot_negotiations;
create policy "Participants can update negotiation status" on public.pilot_negotiations
  for update using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_negotiations.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    )
  );

-- Trigger: this table is documented and relied upon as immutable proposal
-- history, but the UPDATE policy above (needed so tr_mark_superseded can
-- flip status on either party's own prior row) has no column restriction —
-- without this, either participant could call the public REST API directly
-- and rewrite the *content* (message/budget/duration/date) of a proposal
-- that was actually sent by the other side, misrepresenting what was
-- negotiated. Pin every column except status so only status can ever change.
create or replace function public.pin_negotiation_content()
returns trigger as $$
begin
  new.pilot_offer_id    := old.pilot_offer_id;
  new.sender_id          := old.sender_id;
  new.sender_role        := old.sender_role;
  new.message             := old.message;
  new.proposed_budget     := old.proposed_budget;
  new.proposed_duration   := old.proposed_duration;
  new.proposed_start_date := old.proposed_start_date;
  new.created_at          := old.created_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pin_negotiation_content on public.pilot_negotiations;
create trigger tr_pin_negotiation_content
  before update on public.pilot_negotiations
  for each row execute function public.pin_negotiation_content();


-- ============================================================
-- 14. PILOT RESULTS
-- ============================================================
create table if not exists public.pilot_results (
  id                   uuid primary key default gen_random_uuid(),
  pilot_offer_id       uuid references public.pilot_offers(id) on delete cascade not null,
  outcome              text,
  success_metrics        text,
  government_feedback    text,
  startup_feedback       text,
  final_recommendation   text
                         check (final_recommendation in ('scale','extend_pilot','close')),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(pilot_offer_id)
);
alter table public.pilot_results enable row level security;

-- Touch trigger
drop trigger if exists tr_touch_pilot_results on public.pilot_results;
create trigger tr_touch_pilot_results
  before update on public.pilot_results
  for each row execute function public.touch_updated_at();

-- Select: both participants
drop policy if exists "Pilot participants read results" on public.pilot_results;
create policy "Pilot participants read results" on public.pilot_results
  for select using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    ) or
    public.is_admin()
  );

-- Insert: verified government owner
drop policy if exists "Govt owner can create results" on public.pilot_results;
create policy "Govt owner can create results" on public.pilot_results
  for insert with check (
    exists (
      select 1 from public.pilot_offers po
      join public.challenges c on c.id = po.challenge_id
      join public.profiles p on p.id = c.created_by
      where po.id = pilot_results.pilot_offer_id
        and p.id = auth.uid()
        and p.role = 'government'
        and p.verification_status = 'verified'
    ) or
    public.is_admin()
  );

-- Update: admin only. The app (PilotManagement.jsx) only ever inserts a
-- pilot_results row once and never updates it, so a "both participants can
-- update" policy has no legitimate use — it would only let either party
-- silently overwrite the counterparty's outcome/feedback/recommendation
-- after the fact with no authorship protection. Locking updates to admin
-- removes that gap without touching real functionality.
drop policy if exists "Participants can update results" on public.pilot_results;
create policy "Participants can update results" on public.pilot_results
  for update using (
    public.is_admin()
  );


-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  message     text not null,
  type        text not null,
  related_id  uuid,
  related_type text,
  is_read     boolean default false,
  created_at  timestamptz default now()
);
alter table public.notifications enable row level security;

-- Read: own notifications only
drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications
  for select using (recipient_id = auth.uid());

-- Insert: any authenticated user can send notifications (frontend triggers)
drop policy if exists "Users can create notifications" on public.notifications;
create policy "Users can create notifications" on public.notifications
  for insert with check (auth.uid() = recipient_id or public.is_admin());

-- Update: mark own notifications as read
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (recipient_id = auth.uid());

-- Trigger: auto-create notifications on key events

-- 15a. Application status change → notify startup
create or replace function public.notify_on_application_status_change()
returns trigger as $$
declare
  challenge_title text;
begin
  if old.status is distinct from new.status then
    select title into challenge_title from public.challenges where id = new.challenge_id;

    if new.status = 'Shortlisted' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'Your application for "' || challenge_title || '" has been shortlisted.',
              'application_shortlisted', new.id, 'challenge_application');
    elsif new.status = 'Rejected' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'Your application for "' || challenge_title || '" was not selected.',
              'application_rejected', new.id, 'challenge_application');
    elsif new.status = 'Selected' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'Your application for "' || challenge_title || '" has been selected for a pilot offer.',
              'application_selected', new.id, 'challenge_application');
    elsif new.status = 'Pilot Offered' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'A pilot opportunity has been offered for your solution to "' || challenge_title || '".',
              'pilot_offered', new.id, 'challenge_application');
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_app_status on public.challenge_applications;
create trigger tr_notify_app_status
  after update on public.challenge_applications
  for each row execute function public.notify_on_application_status_change();

-- 15b. Pilot offer created → notify startup
create or replace function public.notify_on_pilot_offer_create()
returns trigger as $$
declare
  challenge_title text;
begin
  select title into challenge_title from public.challenges where id = new.challenge_id;
  insert into public.notifications (recipient_id, message, type, related_id, related_type)
  values (new.startup_id, 'You received a pilot offer from the "' || (select organization_name from public.profiles where id = new.government_id) || '" for "' || challenge_title || '".',
          'pilot_offer_received', new.id, 'pilot_offer');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_pilot_created on public.pilot_offers;
create trigger tr_notify_pilot_created
  after insert on public.pilot_offers
  for each row execute function public.notify_on_pilot_offer_create();

-- 15c. Pilot offer status change → notify the other party
create or replace function public.notify_on_pilot_status_change()
returns trigger as $$
declare
  other_party uuid;
  challenge_title text;
  sender_name text;
begin
  if old.status is distinct from new.status then
    select title into challenge_title from public.challenges where id = new.challenge_id;

    if new.status = 'accepted' then
      -- The startup accepted; notify government
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.government_id, 'The startup has accepted the pilot offer for "' || challenge_title || '".',
              'pilot_accepted', new.id, 'pilot_offer');
    elsif new.status = 'declined' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.government_id, 'The startup declined the pilot offer for "' || challenge_title || '".',
              'pilot_declined', new.id, 'pilot_offer');
    elsif new.status = 'negotiating' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.government_id, 'A counter-proposal has been submitted for "' || challenge_title || '".',
              'pilot_negotiating', new.id, 'pilot_offer');
    elsif new.status = 'in_progress' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'Your pilot for "' || challenge_title || '" is now in progress.',
              'pilot_in_progress', new.id, 'pilot_offer');
    elsif new.status = 'completed' then
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (new.startup_id, 'The pilot for "' || challenge_title || '" has been completed.',
              'pilot_completed', new.id, 'pilot_offer');
    elsif new.status = 'cancelled' then
      if (select auth.uid()) = new.startup_id then
        other_party := new.government_id;
      else
        other_party := new.startup_id;
      end if;
      insert into public.notifications (recipient_id, message, type, related_id, related_type)
      values (other_party, 'The pilot for "' || challenge_title || '" has been cancelled.',
              'pilot_cancelled', new.id, 'pilot_offer');
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_pilot_status on public.pilot_offers;
create trigger tr_notify_pilot_status
  after update on public.pilot_offers
  for each row execute function public.notify_on_pilot_status_change();

-- 15d. New negotiation message → notify the other party
create or replace function public.notify_on_negotiation()
returns trigger as $$
declare
  challenge_title text;
  sender_role text;
  recipient uuid;
begin
  select c.title, p.role into challenge_title, sender_role
  from public.pilot_offers po
  join public.challenges c on c.id = po.challenge_id
  join public.profiles p on p.id = po.government_id
  where po.id = new.pilot_offer_id;

  if (select auth.uid()) = (select government_id from public.pilot_offers where id = new.pilot_offer_id) then
    recipient := (select startup_id from public.pilot_offers where id = new.pilot_offer_id);
  else
    recipient := (select government_id from public.pilot_offers where id = new.pilot_offer_id);
  end if;

  insert into public.notifications (recipient_id, message, type, related_id, related_type)
  values (recipient, 'A new counter-proposal was submitted for "' || challenge_title || '".',
          'pilot_negotiating', new.id, 'pilot_negotiation');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_negotiation on public.pilot_negotiations;
create trigger tr_notify_negotiation
  after insert on public.pilot_negotiations
  for each row execute function public.notify_on_negotiation();

-- 15e. Helper RPC: insert a notification programmatically (bypasses RLS via SECURITY DEFINER)
create or replace function public.create_notification(
  p_recipient_id  uuid,
  p_message       text,
  p_type          text,
  p_related_id    uuid default null,
  p_related_type  text default null
)
returns void as $$
begin
  insert into public.notifications (recipient_id, message, type, related_id, related_type)
  values (p_recipient_id, p_message, p_type, p_related_id, p_related_type);
end;
$$ language plpgsql security definer;

grant execute on function public.create_notification to authenticated, anon;


-- ============================================================
-- 18. PILOT MILESTONES
-- ============================================================
create table if not exists public.pilot_milestones (
  id              uuid primary key default gen_random_uuid(),
  pilot_offer_id  uuid references public.pilot_offers(id) on delete cascade not null,
  title           text not null,
  description     text,
  due_date        date,
  deliverable     text,
  kpi             text,
  payment_amount  numeric,
  payment_status  text not null default 'not_due'
                  check (payment_status in ('not_due','pending','approved','released')),
  status          text not null default 'pending'
                  check (status in ('pending','submitted','under_review','approved','rejected')),
  submitted_result text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.pilot_milestones enable row level security;

drop trigger if exists tr_touch_pilot_milestones on public.pilot_milestones;
create trigger tr_touch_pilot_milestones
  before update on public.pilot_milestones
  for each row execute function public.touch_updated_at();

-- Select: both pilot participants
drop policy if exists "Pilot participants read milestones" on public.pilot_milestones;
create policy "Pilot participants read milestones" on public.pilot_milestones
  for select using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_milestones.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    )
  );

-- Insert: government owner only (milestones are proposed by the department)
drop policy if exists "Govt owner creates milestones" on public.pilot_milestones;
create policy "Govt owner creates milestones" on public.pilot_milestones
  for insert with check (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_milestones.pilot_offer_id
        and po.government_id = auth.uid()
    )
  );

-- Update: both participants (columns + status transitions constrained by triggers below)
drop policy if exists "Pilot participants update milestones" on public.pilot_milestones;
create policy "Pilot participants update milestones" on public.pilot_milestones
  for update using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_milestones.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    )
  );

-- Delete: government owner only
drop policy if exists "Govt owner deletes milestones" on public.pilot_milestones;
create policy "Govt owner deletes milestones" on public.pilot_milestones
  for delete using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_milestones.pilot_offer_id
        and po.government_id = auth.uid()
    )
  );

-- Status transition trigger, mirrors validate_pilot_status_transition() above:
-- government can move between pending/under_review/approved/rejected but can't
-- silently reopen a finalized (approved/rejected) milestone; the startup's own
-- update path may only move pending -> submitted.
create or replace function public.validate_milestone_status_transition()
returns trigger as $$
declare
  is_govt boolean;
begin
  if tg_op = 'INSERT' or public.is_trusted_direct_access() then
    return new;
  end if;

  select exists (
    select 1 from public.pilot_offers po
    where po.id = new.pilot_offer_id and po.government_id = auth.uid()
  ) into is_govt;

  if is_govt then
    if old.status in ('approved','rejected') and new.status is distinct from old.status then
      raise exception 'Cannot modify a finalized milestone status: %', old.status;
    end if;
  else
    if new.status is distinct from old.status
       and not (old.status = 'pending' and new.status = 'submitted') then
      raise exception 'Invalid milestone transition from % to % for startup', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_validate_milestone_status on public.pilot_milestones;
create trigger tr_validate_milestone_status
  before update on public.pilot_milestones
  for each row execute function public.validate_milestone_status_transition();

-- Content-pin trigger, mirrors pin_pilot_offer_content() above: the startup's
-- update path may only ever touch submitted_result/status, nothing else.
create or replace function public.pin_milestone_content()
returns trigger as $$
declare
  is_govt boolean;
begin
  if public.is_trusted_direct_access() then
    return new;
  end if;

  select exists (
    select 1 from public.pilot_offers po
    where po.id = new.pilot_offer_id and po.government_id = auth.uid()
  ) into is_govt;

  if not is_govt then
    new.pilot_offer_id  := old.pilot_offer_id;
    new.title           := old.title;
    new.description     := old.description;
    new.due_date        := old.due_date;
    new.deliverable     := old.deliverable;
    new.kpi             := old.kpi;
    new.payment_amount  := old.payment_amount;
    new.payment_status  := old.payment_status;
    new.created_at      := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pin_milestone_content on public.pilot_milestones;
create trigger tr_pin_milestone_content
  before update on public.pilot_milestones
  for each row execute function public.pin_milestone_content();

-- Milestone approved -> notify startup
create or replace function public.notify_on_milestone_status_change()
returns trigger as $$
declare
  startup uuid;
begin
  if old.status is distinct from new.status and new.status = 'approved' then
    select po.startup_id into startup from public.pilot_offers po where po.id = new.pilot_offer_id;
    insert into public.notifications (recipient_id, message, type, related_id, related_type)
    values (startup, 'Milestone "' || new.title || '" has been approved.', 'milestone_approved', new.id, 'pilot_milestone');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_milestone_status on public.pilot_milestones;
create trigger tr_notify_milestone_status
  after update on public.pilot_milestones
  for each row execute function public.notify_on_milestone_status_change();


-- ============================================================
-- 19. PILOT RESULTS — KPI, INDEPENDENT VALIDATION & SCALE-UP FIELDS
-- ============================================================
-- Extends the pilot_results table (section 14) with structured KPI
-- target/actual tracking, an optional independent-validation sub-record, and
-- the scale-up pathway chosen alongside final_recommendation = 'scale'.
alter table public.pilot_results
  add column if not exists kpi_target text,
  add column if not exists kpi_actual text,
  add column if not exists achievement_pct numeric,
  add column if not exists validator_name text,
  add column if not exists validation_summary text,
  add column if not exists validation_status text
    check (validation_status in ('pending','verified','not_applicable')),
  add column if not exists scale_up_pathway text
    check (scale_up_pathway in ('within_department','other_districts','procurement','marketplace','further_pilot'));

-- The original design only let the government owner INSERT and only admins
-- UPDATE (see section 14) — with the admin dashboard removed, nobody could
-- ever write a result. Pilot completion is naturally two-sided (the startup
-- submits evidence/outcome, the government adds feedback/recommendation), so
-- both participants now get insert/update rights, with a column-pin trigger
-- (mirroring pin_pilot_offer_content/pin_milestone_content above) ensuring
-- each side can only ever populate their own columns.
drop policy if exists "Startup can create results" on public.pilot_results;
create policy "Startup can create results" on public.pilot_results
  for insert with check (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and po.startup_id = auth.uid()
    )
  );

drop policy if exists "Participants can update results" on public.pilot_results;
create policy "Participants can update results" on public.pilot_results
  for update using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    )
  );

create or replace function public.pin_pilot_result_content()
returns trigger as $$
declare
  is_govt boolean;
  is_startup boolean;
begin
  if public.is_trusted_direct_access() then
    return new;
  end if;

  select
    exists (select 1 from public.pilot_offers po where po.id = new.pilot_offer_id and po.government_id = auth.uid()),
    exists (select 1 from public.pilot_offers po where po.id = new.pilot_offer_id and po.startup_id = auth.uid())
  into is_govt, is_startup;

  if tg_op = 'INSERT' then
    if is_govt and not is_startup then
      new.outcome := null;
      new.success_metrics := null;
      new.startup_feedback := null;
      new.kpi_actual := null;
    elsif is_startup and not is_govt then
      new.government_feedback := null;
      new.kpi_target := null;
      new.final_recommendation := null;
      new.validation_status := null;
      new.validator_name := null;
      new.validation_summary := null;
      new.scale_up_pathway := null;
      new.achievement_pct := null;
    end if;
    return new;
  end if;

  -- UPDATE: each side may only ever touch their own columns, never overwrite
  -- the counterparty's already-submitted content.
  if is_govt and not is_startup then
    new.outcome := old.outcome;
    new.success_metrics := old.success_metrics;
    new.startup_feedback := old.startup_feedback;
    new.kpi_actual := old.kpi_actual;
  elsif is_startup and not is_govt then
    new.government_feedback := old.government_feedback;
    new.kpi_target := old.kpi_target;
    new.final_recommendation := old.final_recommendation;
    new.validation_status := old.validation_status;
    new.validator_name := old.validator_name;
    new.validation_summary := old.validation_summary;
    new.scale_up_pathway := old.scale_up_pathway;
    new.achievement_pct := old.achievement_pct;
  end if;
  new.pilot_offer_id := old.pilot_offer_id;
  new.created_at := old.created_at;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_pin_pilot_result_content on public.pilot_results;
create trigger tr_pin_pilot_result_content
  before insert or update on public.pilot_results
  for each row execute function public.pin_pilot_result_content();


-- ============================================================
-- 20. APPLICATION ELIGIBILITY SCREENING
-- ============================================================
-- Deterministic, server-computed eligibility verdict — always overwritten by
-- this trigger regardless of what the client sends (same trust model as
-- ai_match_scores: the applicant never gets to author their own verdict).
-- Deliberately minimal per MVP scope: a deadline check and a sector-match
-- check. This is advisory/decision-support only, same as the AI match score —
-- it does not block insertion or hide the application from government.
alter table public.challenge_applications
  add column if not exists eligibility_status text
    check (eligibility_status in ('eligible','not_eligible','needs_review')),
  add column if not exists eligibility_reasons jsonb;

create or replace function public.evaluate_application_eligibility()
returns trigger as $$
declare
  chal_deadline date;
  chal_sector text;
  applicant_sector text;
  reasons jsonb := '[]'::jsonb;
  verdict text := 'eligible';
begin
  select deadline, sector into chal_deadline, chal_sector
    from public.challenges where id = new.challenge_id;
  select sector into applicant_sector
    from public.profiles where id = new.startup_id;

  if chal_deadline is not null and current_date > chal_deadline then
    verdict := 'not_eligible';
    reasons := reasons || jsonb_build_object('ok', false, 'label', 'Challenge application deadline has passed');
  else
    reasons := reasons || jsonb_build_object('ok', true, 'label', 'Within application deadline');
  end if;

  if chal_sector is not null and applicant_sector is not null and chal_sector is distinct from applicant_sector then
    if verdict = 'eligible' then verdict := 'needs_review'; end if;
    reasons := reasons || jsonb_build_object('ok', false, 'label',
      'Startup sector (' || applicant_sector || ') differs from the challenge sector (' || chal_sector || ')');
  else
    reasons := reasons || jsonb_build_object('ok', true, 'label', 'Sector requirement satisfied');
  end if;

  new.eligibility_status := verdict;
  new.eligibility_reasons := reasons;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_evaluate_eligibility on public.challenge_applications;
create trigger tr_evaluate_eligibility
  before insert on public.challenge_applications
  for each row execute function public.evaluate_application_eligibility();


-- ============================================================
-- 21. APPLICATION-SUBMITTED NOTIFICATION
-- ============================================================
-- The existing 15a trigger only fires on UPDATE (status changes) — there was
-- no notification at all when an application is first submitted.
create or replace function public.notify_on_application_submitted()
returns trigger as $$
declare
  challenge_title text;
  gov_owner uuid;
begin
  select title, created_by into challenge_title, gov_owner
    from public.challenges where id = new.challenge_id;
  if gov_owner is not null then
    insert into public.notifications (recipient_id, message, type, related_id, related_type)
    values (gov_owner, 'New application received for "' || challenge_title || '" from ' || new.startup_name || '.',
            'application_submitted', new.id, 'challenge_application');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists tr_notify_app_submitted on public.challenge_applications;
create trigger tr_notify_app_submitted
  after insert on public.challenge_applications
  for each row execute function public.notify_on_application_submitted();


-- ============================================================
-- 16. TABLE-LEVEL GRANTS
-- ============================================================
-- RLS policies above are the real access control — they restrict *which rows*
-- a role can see or touch. But Postgres also requires a base table-level grant
-- before RLS is even consulted; without it every query fails with
-- "permission denied for table X" regardless of how permissive the policies
-- are. A fresh Supabase project grants these automatically, but this schema
-- never did, so anon/authenticated had no privileges on businesses,
-- applications, schemes, or notifications at all.
grant usage on schema public to anon, authenticated;

-- Publicly browsable data (no login required): schemes catalog and
-- published national challenges.
grant select on public.schemes to anon;
grant select on public.challenges to anon;

-- Everything else requires an authenticated session; RLS policies above
-- scope each authenticated user down to their own rows (or their role's
-- permitted rows).
grant select, insert, update, delete on public.profiles              to authenticated;
grant select, insert, update, delete on public.businesses            to authenticated;
grant select, insert, update, delete on public.schemes               to authenticated;
grant select, insert, update, delete on public.challenges            to authenticated;
grant select, insert, update, delete on public.challenge_applications to authenticated;
grant select, insert, update, delete on public.applications          to authenticated;
grant select, insert, update, delete on public.ai_match_scores       to authenticated;
grant select, insert, update, delete on public.pilot_offers          to authenticated;
grant select, insert, update, delete on public.pilot_negotiations    to authenticated;
grant select, insert, update, delete on public.pilot_results         to authenticated;
grant select, insert, update, delete on public.notifications         to authenticated;
grant select, insert, update, delete on public.pilot_milestones      to authenticated;

-- All primary keys use gen_random_uuid() defaults (no serial/identity
-- columns), so no sequence grants are required.


-- ============================================================
-- 17. ADMIN BOOTSTRAP (run manually after your first real sign-up)
-- ============================================================
-- update public.profiles
-- set role = 'admin', verification_status = 'verified'
-- where email = 'your_admin_email@example.com';
