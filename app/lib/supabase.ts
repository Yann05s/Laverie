import { createClient } from "@supabase/supabase-js";

// Fallback pour ne jamais faire planter le build si les variables
// d'environnement Supabase ne sont pas encore configurées.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// prenom/chambre ne sont jamais lus depuis la liste publique des réservations
// (voir fetchReservations) : seule la personne qui réserve les connaît.
export interface Reservation {
  id: string;
  slot_start: string;
  slot_end: string;
  avec_lessive: boolean;
  prix: number;
  created_at: string;
}
