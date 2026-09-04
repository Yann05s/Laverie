"use client";

import { useEffect, useMemo, useState } from "react";
import AccessGate from "./AccessGate";
import { supabase, type Reservation } from "../lib/supabase";
import {
  DAYS_AHEAD,
  PRIX_AVEC_LESSIVE,
  PRIX_SANS_LESSIVE,
  formatDayLabel,
  formatTimeRange,
  slotsForDay,
  upcomingDays,
} from "../lib/slots";

const IDENTITY_KEY = "laverie_identity";

interface Identity {
  prenom: string;
  chambre: string;
  code: string;
}

const EMPTY_IDENTITY: Identity = { prenom: "", chambre: "", code: "" };

function loadIdentity(): Identity {
  if (typeof window === "undefined") return EMPTY_IDENTITY;
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? { ...EMPTY_IDENTITY, ...JSON.parse(raw) } : EMPTY_IDENTITY;
  } catch {
    return EMPTY_IDENTITY;
  }
}

export default function PlanningApp() {
  return (
    <AccessGate>
      <Planning />
    </AccessGate>
  );
}

function Planning() {
  const days = useMemo(() => upcomingDays(), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<Identity>(() => loadIdentity());
  const [modalSlot, setModalSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  async function fetchReservations() {
    setLoading(true);
    const from = days[0].toISOString();
    const to = new Date(days[days.length - 1]);
    to.setDate(to.getDate() + 1);
    // On ne récupère volontairement ni le prénom ni la chambre : cette liste
    // est publique, personne ne doit pouvoir lire qui a réservé quoi.
    const { data, error } = await supabase
      .from("reservations")
      .select("id, slot_start, slot_end, avec_lessive, prix, created_at")
      .gte("slot_start", from)
      .lt("slot_start", to.toISOString())
      .order("slot_start", { ascending: true });

    if (!error && data) setReservations(data as Reservation[]);
    setLoading(false);
  }

  useEffect(() => {
    // Chargement initial + abonnement temps réel : effet légitime de
    // synchronisation avec la base Supabase, pas un simple miroir de state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReservations();

    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => fetchReservations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDay = days[selectedDayIndex];
  const daySlots = useMemo(() => slotsForDay(selectedDay), [selectedDay]);

  function reservationFor(start: Date): Reservation | undefined {
    return reservations.find((r) => new Date(r.slot_start).getTime() === start.getTime());
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🧺</span>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Laverie de la résidence</h1>
          </div>
          <p className="mt-1 text-sm font-medium text-brand">Moins cher, plus proche.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 text-neutral-400 ring-1 ring-neutral-200 line-through">
              3,60 €
            </span>
            <span className="rounded-full bg-brand px-3 py-1 font-semibold text-white">
              {PRIX_SANS_LESSIVE.toFixed(2)} € sans lessive
            </span>
            <span className="rounded-full bg-teal px-3 py-1 font-semibold text-white">
              {PRIX_AVEC_LESSIVE.toFixed(2)} € avec lessive
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Paiement à la main lors du créneau.</p>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDayIndex(i)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                i === selectedDayIndex
                  ? "bg-brand text-white shadow-sm shadow-brand/30"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {i === 0 ? "Aujourd'hui" : formatDayLabel(day)}
            </button>
          ))}
        </div>

        <h2 className="mb-3 text-sm font-medium text-neutral-500">{formatDayLabel(selectedDay)}</h2>

        {loading ? (
          <p className="text-sm text-neutral-500">Chargement du planning...</p>
        ) : (
          <div className="space-y-2">
            {daySlots.map((slot, i) => {
              const res = reservationFor(slot.start);
              // eslint-disable-next-line react-hooks/purity -- "passé" dépend forcément de l'heure actuelle
              const isPast = slot.start.getTime() < Date.now();
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl border-l-4 border-y border-r p-4 ${
                    res
                      ? "border-y-teal/20 border-r-teal/20 border-l-teal bg-teal/5"
                      : isPast
                        ? "border-y-neutral-100 border-r-neutral-100 border-l-neutral-200 bg-neutral-50"
                        : "border-y-neutral-200 border-r-neutral-200 border-l-brand bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {formatTimeRange(slot.start, slot.end)}
                    </p>
                    {res ? (
                      <p className="mt-0.5 text-xs text-teal">
                        Réservé · {res.avec_lessive ? "avec lessive" : "sans lessive"} ·{" "}
                        {res.prix.toFixed(2)} €
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {isPast ? "Passé" : "Libre"}
                      </p>
                    )}
                  </div>

                  {res ? (
                    <button
                      onClick={() => setCancelTarget(res)}
                      className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-white"
                    >
                      Annuler
                    </button>
                  ) : !isPast ? (
                    <button
                      onClick={() => setModalSlot(slot)}
                      className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      Réserver
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-neutral-400">
          Planning affiché pour les {DAYS_AHEAD} prochains jours.
        </p>
      </main>

      {modalSlot && (
        <ReservationModal
          slot={modalSlot}
          identity={identity}
          onClose={() => setModalSlot(null)}
          onBooked={(id) => {
            setIdentity(id);
            localStorage.setItem(IDENTITY_KEY, JSON.stringify(id));
            setModalSlot(null);
            fetchReservations();
          }}
        />
      )}

      {cancelTarget && (
        <CancelModal
          reservation={cancelTarget}
          identity={identity}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            setCancelTarget(null);
            fetchReservations();
          }}
        />
      )}
    </div>
  );
}

function ReservationModal({
  slot,
  identity,
  onClose,
  onBooked,
}: {
  slot: { start: Date; end: Date };
  identity: Identity;
  onClose: () => void;
  onBooked: (identity: Identity) => void;
}) {
  const [prenom, setPrenom] = useState(identity.prenom);
  const [chambre, setChambre] = useState(identity.chambre);
  const [code, setCode] = useState(identity.code);
  const [avecLessive, setAvecLessive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prix = avecLessive ? PRIX_AVEC_LESSIVE : PRIX_SANS_LESSIVE;
  const codeValide = /^\d{3}$/.test(code);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prenom.trim() || !chambre.trim() || !codeValide) return;
    setSubmitting(true);
    setError(null);

    const { error } = await supabase.from("reservations").insert({
      prenom: prenom.trim(),
      chambre: chambre.trim(),
      code,
      slot_start: slot.start.toISOString(),
      slot_end: slot.end.toISOString(),
      avec_lessive: avecLessive,
      prix,
    });

    setSubmitting(false);

    if (error) {
      setError(
        error.code === "23505"
          ? "Ce créneau vient d'être réservé par quelqu'un d'autre."
          : "Impossible de réserver ce créneau."
      );
      return;
    }

    onBooked({ prenom: prenom.trim(), chambre: chambre.trim(), code });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/40 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <span>🧺</span> Réserver ce créneau
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {formatTimeRange(slot.start, slot.end)}
        </p>

        <label className="mt-4 block text-xs font-medium text-neutral-500">Prénom</label>
        <input
          autoFocus
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        <label className="mt-3 block text-xs font-medium text-neutral-500">
          Chambre / appart
        </label>
        <input
          value={chambre}
          onChange={(e) => setChambre(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        <label className="mt-3 block text-xs font-medium text-neutral-500">
          Code à 3 chiffres (à retenir pour annuler)
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
          inputMode="numeric"
          pattern="[0-9]{3}"
          maxLength={3}
          placeholder="ex. 427"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        <div className="mt-4 space-y-2">
          <label
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
              !avecLessive ? "border-brand bg-neutral-100" : "border-neutral-200"
            }`}
          >
            <span className="font-medium text-ink">💧 Sans lessive</span>
            <span className="flex items-center gap-2">
              <span className="text-neutral-500">{PRIX_SANS_LESSIVE.toFixed(2)} €</span>
              <input
                type="radio"
                name="lessive"
                checked={!avecLessive}
                onChange={() => setAvecLessive(false)}
                className="accent-brand"
              />
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
              avecLessive ? "border-teal bg-teal/10" : "border-neutral-200"
            }`}
          >
            <span className="font-medium text-ink">🧴 Avec lessive fournie</span>
            <span className="flex items-center gap-2">
              <span className="text-neutral-500">{PRIX_AVEC_LESSIVE.toFixed(2)} €</span>
              <input
                type="radio"
                name="lessive"
                checked={avecLessive}
                onChange={() => setAvecLessive(true)}
                className="accent-teal"
              />
            </span>
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting || !codeValide}
            className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-neutral-300"
          >
            {submitting ? "..." : `Confirmer (${prix.toFixed(2)} €)`}
          </button>
        </div>
      </form>
    </div>
  );
}

function CancelModal({
  reservation,
  identity,
  onClose,
  onCancelled,
}: {
  reservation: Reservation;
  identity: Identity;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [prenom, setPrenom] = useState(identity.prenom);
  const [chambre, setChambre] = useState(identity.chambre);
  const [code, setCode] = useState(identity.code);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeValide = /^\d{3}$/.test(code);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prenom.trim() || !chambre.trim() || !codeValide) return;
    setSubmitting(true);
    setError(null);

    const { data, error } = await supabase.rpc("cancel_reservation", {
      p_id: reservation.id,
      p_prenom: prenom.trim(),
      p_chambre: chambre.trim(),
      p_code: code,
    });

    setSubmitting(false);

    if (error || !data) {
      setError("Prénom, chambre ou code incorrects pour cette réservation.");
      return;
    }

    onCancelled();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/40 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-ink">Annuler la réservation</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {formatTimeRange(new Date(reservation.slot_start), new Date(reservation.slot_end))}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Confirme ton prénom, ta chambre et ton code pour annuler.
        </p>

        <label className="mt-4 block text-xs font-medium text-neutral-500">Prénom</label>
        <input
          autoFocus
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        <label className="mt-3 block text-xs font-medium text-neutral-500">
          Chambre / appart
        </label>
        <input
          value={chambre}
          onChange={(e) => setChambre(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        <label className="mt-3 block text-xs font-medium text-neutral-500">Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
          inputMode="numeric"
          pattern="[0-9]{3}"
          maxLength={3}
          placeholder="ex. 427"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          required
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={submitting || !codeValide}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
          >
            {submitting ? "..." : "Confirmer l'annulation"}
          </button>
        </div>
      </form>
    </div>
  );
}
