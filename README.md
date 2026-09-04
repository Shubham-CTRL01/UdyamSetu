# UdyamSetu (उद्यम सेतु)

> **Bridging National Governance & High-Growth Startups / MSMEs**
> A unified, interoperable exchange platform enabling public sector departments to pilot, procure, and scale verified indigenous innovations with zero friction.

---

## 🏛️ Overview

**UdyamSetu** is a GovTech and MSME digital gateway built to streamline government scheme discovery, business registration, and application lifecycle tracking for Indian startups and micro, small, and medium enterprises.

### Key Features

- **🏛️ Dual-Track Institutional Gateway:** Dedicated portals for Government & PSU officials and Startup & Innovator tracks.
- **📊 Business Profile Management:** Real-time persistence for enterprise details (CIN/PAN, sector, annual turnover, employee headcount, and registered address).
- **📋 Scheme Discovery Engine:** Comprehensive catalog of government schemes (PM Vishwakarma, Startup India Seed Fund, GeM Onboarding, CGTMSE, MUDRA, etc.) with real-time category filtering.
- **⚡ Application Lifecycle Tracker:** Interactive multi-stage tracking (*Submitted ➔ Under Review ➔ Approved*) with live database synchronization.
- **🔒 Enterprise-Grade Security:** Row Level Security (RLS) policies ensuring complete data isolation between registered entities.

---

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/), [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/udyamsetu.git
cd udyamsetu
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Security Note:** Never commit `.env.local` or any private API keys to GitHub. `.gitignore` is pre-configured to exclude all `.env` files except `.env.example`.

---

## 🗄️ Database Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase project dashboard.
3. Open [`supabase/schema.sql`](./supabase/schema.sql), paste the SQL into the editor, and click **Run**.
4. The script creates:
   - `profiles` table (linked to `auth.users` with RLS)
   - `businesses` table (linked to `profiles` with RLS)
   - `schemes` table (publicly readable catalog + pre-seeded schemes)
   - `applications` table (linked to `profiles`, `businesses`, and `schemes` with RLS)
   - Pre-seeded active national schemes.

*(Optional for development/demo)*: In Supabase Dashboard ➔ **Authentication** ➔ **Providers** ➔ **Email**, toggle **"Confirm email"** OFF to allow immediate sign-in upon registration.

---

## 💻 Development & Build

```bash
# Start local development server
npm run dev

# Run code linter
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Security & Data Isolation

- **Row Level Security (RLS):** All user tables (`profiles`, `businesses`, `applications`) enforce strict `auth.uid() = user_id` policies in PostgreSQL.
- **Client Anon Key:** Only the public anonymous Supabase key is used on the frontend. The `service_role` key must **never** be used in client-side code.
- **Environment Exclusions:** Comprehensive `.gitignore` protects against accidental credential leaks.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
