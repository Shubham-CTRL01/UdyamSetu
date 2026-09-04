import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "your_supabase_project_url" ||
  supabaseAnonKey === "your_supabase_anon_key";

if (isPlaceholder) {
  console.warn(
    "⚠️ Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local"
  );
}

export const supabase = createClient(
  isPlaceholder ? "https://placeholder.supabase.co" : supabaseUrl,
  isPlaceholder ? "placeholder" : supabaseAnonKey
);

if (typeof window !== "undefined") {
  window.supabase = supabase;
}
