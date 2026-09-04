import { createClient } from "@supabase/supabase-js";

// Fallback pour ne jamais faire planter le build si les variables
// d'environnement Supabase ne sont pas encore configurées.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Reservation {
  id: string;
  prenom: string;
  chambre: string;
  slot_start: string;
  slot_end: string;
  avec_lessive: boolean;
  prix: number;
  created_at: string;
}
