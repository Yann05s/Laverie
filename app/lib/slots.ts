export const START_HOUR = 7;
export const END_HOUR = 22;
export const SLOT_MINUTES = 90;
export const DAYS_AHEAD = 14;

export const PRIX_SANS_LESSIVE = 2;
export const PRIX_AVEC_LESSIVE = 2.5;

export interface SlotTemplate {
  start: Date;
  end: Date;
}

// Génère les créneaux théoriques (indépendamment des réservations) pour un jour donné.
export function slotsForDay(day: Date): SlotTemplate[] {
  const slots: SlotTemplate[] = [];
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const count = Math.floor(totalMinutes / SLOT_MINUTES);

  for (let i = 0; i < count; i++) {
    const start = new Date(day);
    start.setHours(START_HOUR, 0, 0, 0);
    start.setMinutes(start.getMinutes() + i * SLOT_MINUTES);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SLOT_MINUTES);

    slots.push({ start, end });
  }

  return slots;
}

// Liste des DAYS_AHEAD prochains jours (aujourd'hui inclus), à minuit local.
export function upcomingDays(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return days;
}

export function formatDayLabel(day: Date): string {
  const label = day.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function isSameSlot(a: Date, b: string): boolean {
  return a.getTime() === new Date(b).getTime();
}
