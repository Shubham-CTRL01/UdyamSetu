-- ============================================================
-- UdyamSetu Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can upsert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- BUSINESSES
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
create policy "Users manage own businesses" on public.businesses for all using (auth.uid() = user_id);

-- SCHEMES
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
create policy "Schemes are publicly readable" on public.schemes for select using (true);

-- APPLICATIONS
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
create policy "Users manage own applications" on public.applications for all using (auth.uid() = user_id);

-- SEED SCHEMES
insert into public.schemes (name, description, category, eligibility, benefits, status) values
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
on conflict do nothing;
