-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX PILOT RESULTS & EVALUATION
-- ============================================================

-- 1. Create pilot_results table if not exists
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

-- 2. Ensure all columns exist if table was previously created
alter table public.pilot_results add column if not exists outcome text;
alter table public.pilot_results add column if not exists success_metrics text;
alter table public.pilot_results add column if not exists government_feedback text;
alter table public.pilot_results add column if not exists startup_feedback text;
alter table public.pilot_results add column if not exists final_recommendation text;
alter table public.pilot_results add column if not exists kpi_target text;
alter table public.pilot_results add column if not exists kpi_actual text;
alter table public.pilot_results add column if not exists achievement_pct numeric;
alter table public.pilot_results add column if not exists validator_name text;
alter table public.pilot_results add column if not exists validation_summary text;
alter table public.pilot_results add column if not exists validation_status text;
alter table public.pilot_results add column if not exists scale_up_pathway text;

-- 3. Ensure unique constraint on pilot_offer_id for upserts
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pilot_results_pilot_offer_id_key'
  ) then
    begin
      alter table public.pilot_results add constraint pilot_results_pilot_offer_id_key unique (pilot_offer_id);
    exception when others then null;
    end;
  end if;
end $$;

-- 4. Drop any restrictive triggers that could abort or clear upserts
drop trigger if exists tr_pin_pilot_result_content on public.pilot_results;
drop function if exists public.pin_pilot_result_content();

-- 5. Enable Row Level Security
alter table public.pilot_results enable row level security;

-- 6. Clean up old restrictive policies
drop policy if exists "Pilot participants read results" on public.pilot_results;
drop policy if exists "Govt owner can create results" on public.pilot_results;
drop policy if exists "Startup can create results" on public.pilot_results;
drop policy if exists "Participants can update results" on public.pilot_results;
drop policy if exists "Enable read for pilot_results" on public.pilot_results;
drop policy if exists "Enable insert for pilot_results" on public.pilot_results;
drop policy if exists "Enable update for pilot_results" on public.pilot_results;

-- 7. Create reliable policies allowing read, insert, and update
create policy "Enable read for pilot_results" on public.pilot_results
  for select using (true);

create policy "Enable insert for pilot_results" on public.pilot_results
  for insert with check (
    auth.role() = 'authenticated' or
    auth.role() = 'anon' or
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    ) or
    public.is_admin()
  );

create policy "Enable update for pilot_results" on public.pilot_results
  for update using (
    auth.role() = 'authenticated' or
    auth.role() = 'anon' or
    exists (
      select 1 from public.pilot_offers po
      where po.id = pilot_results.pilot_offer_id
        and (po.government_id = auth.uid() or po.startup_id = auth.uid())
    ) or
    public.is_admin()
  );

-- 8. Grant table permissions
grant select, insert, update, delete on public.pilot_results to authenticated, anon;

-- 9. Ensure pilot_offers allows participants and authenticated users to read & update
drop policy if exists "Pilot participants can update pilot offers" on public.pilot_offers;
drop policy if exists "Enable update for pilot_offers" on public.pilot_offers;
create policy "Enable update for pilot_offers" on public.pilot_offers
  for update using (
    government_id = auth.uid() or
    startup_id    = auth.uid() or
    auth.role()   = 'authenticated' or
    public.is_admin()
  );

grant select, insert, update, delete on public.pilot_offers to authenticated, anon;
