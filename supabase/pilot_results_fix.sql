-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX PILOT RESULTS & EVALUATION
-- ============================================================

create table if not exists public.pilot_results (
  id                     uuid primary key default gen_random_uuid(),
  pilot_offer_id         uuid references public.pilot_offers(id) on delete cascade not null,
  outcome                text,
  success_metrics        text,
  government_feedback    text,
  startup_feedback       text,
  final_recommendation   text
                         check (final_recommendation in ('scale','extend_pilot','close')),
  kpi_target             text,
  kpi_actual             text,
  achievement_pct        numeric,
  validator_name         text,
  validation_summary     text,
  validation_status      text
                         check (validation_status in ('pending','verified','not_applicable')),
  scale_up_pathway       text
                         check (scale_up_pathway in ('within_department','other_districts','procurement','marketplace','further_pilot')),
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),
  unique(pilot_offer_id)
);

-- Ensure all columns exist if table was already created
alter table public.pilot_results add column if not exists kpi_target text;
alter table public.pilot_results add column if not exists kpi_actual text;
alter table public.pilot_results add column if not exists achievement_pct numeric;
alter table public.pilot_results add column if not exists validator_name text;
alter table public.pilot_results add column if not exists validation_summary text;
alter table public.pilot_results add column if not exists validation_status text;
alter table public.pilot_results add column if not exists scale_up_pathway text;

-- Drop any restrictive triggers that could abort upserts
drop trigger if exists tr_pin_pilot_result_content on public.pilot_results;
drop function if exists public.pin_pilot_result_content();

alter table public.pilot_results enable row level security;

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

-- Insert: government owner
drop policy if exists "Govt owner can create results" on public.pilot_results;
create policy "Govt owner can create results" on public.pilot_results
  for insert with check (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and po.government_id = auth.uid()
    ) or
    public.is_admin()
  );

-- Insert: startup owner
drop policy if exists "Startup can create results" on public.pilot_results;
create policy "Startup can create results" on public.pilot_results
  for insert with check (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and po.startup_id = auth.uid()
    ) or
    public.is_admin()
  );

-- Update: both participants can update results
drop policy if exists "Participants can update results" on public.pilot_results;
create policy "Participants can update results" on public.pilot_results
  for update using (
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    ) or
    public.is_admin()
  );

grant select, insert, update, delete on public.pilot_results to authenticated;

-- Ensure pilot_offers allows participants to update status
drop policy if exists "Pilot participants can update pilot offers" on public.pilot_offers;
create policy "Pilot participants can update pilot offers" on public.pilot_offers
  for update using (
    government_id = auth.uid() or
    startup_id    = auth.uid() or
    public.is_admin()
  );

grant select, insert, update, delete on public.pilot_offers to authenticated;
