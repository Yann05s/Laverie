-- ============================================================
-- Laverie coloc : schéma Supabase
-- À exécuter UNE FOIS dans le SQL Editor du dashboard Supabase
-- (SQL Editor > New query > coller tout ce fichier > Run)
-- ============================================================

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (char_length(prenom) between 1 and 60),
  chambre text not null check (char_length(chambre) between 1 and 20),
  slot_start timestamptz not null unique,
  slot_end timestamptz not null,
  avec_lessive boolean not null default false,
  prix numeric(4,2) not null,
  created_at timestamptz not null default now()
);

create index reservations_slot_start_idx on public.reservations (slot_start);

-- ------------------------------------------------------------
-- Annulation sécurisée : ne supprime que si prénom + chambre
-- correspondent à la réservation (évite qu'un tiers annule
-- la réservation de quelqu'un d'autre au hasard).
-- ------------------------------------------------------------
create or replace function public.cancel_reservation(
  p_id uuid,
  p_prenom text,
  p_chambre text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.reservations
  where id = p_id
    and lower(trim(prenom)) = lower(trim(p_prenom))
    and lower(trim(chambre)) = lower(trim(p_chambre));

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

grant execute on function public.cancel_reservation(uuid, text, text) to anon;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.reservations enable row level security;

-- Tout le monde (résidence) peut voir le planning
create policy "reservations visibles par tous"
  on public.reservations for select
  to anon
  using (true);

-- Tout le monde peut réserver un créneau libre dans le futur
create policy "reservation possible pour un creneau futur"
  on public.reservations for insert
  to anon
  with check (slot_start > now());

-- Pas de delete/update direct : uniquement via cancel_reservation() ci-dessus
-- (aucune policy delete/update = interdit par défaut avec RLS activé)

-- ------------------------------------------------------------
-- Temps réel : tout le monde voit les réservations se mettre à
-- jour en direct sans recharger la page.
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.reservations;

-- ============================================================
-- Fin. Pense à copier l'URL du projet et la clé "anon public"
-- (Project Settings > API) dans le fichier .env.local du site.
-- ============================================================
