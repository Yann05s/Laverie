export const SLOT_MINUTES = 60;
export const DAYS_AHEAD = 7;

export const PRIX_SANS_LESSIVE = 2;
export const PRIX_AVEC_LESSIVE = 2.5;

export interface SlotTemplate {
  start: Date;
  end: Date;
}

interface DayWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// Plage horaire réservable par jour de la semaine (index JS : 0 = dimanche).
// Calée sur l'emploi du temps de cours de Yann : le linge peut être lancé
// pendant les cours et récupéré à la sortie, donc les créneaux courent
// large plutôt que d'être limités aux seuls moments où il est présent.
// À adapter si l'emploi du temps change d'un semestre à l'autre.
const WEEKLY_SCHEDULE: Record<number, DayWindow> = {
  0: { startHour: 8, startMinute: 0, endHour: 22, endMinute: 30 }, // dimanche
  1: { startHour: 17, startMinute: 30, endHour: 22, endMinute: 30 }, // lundi
  2: { startHour: 17, startMinute: 30, endHour: 22, endMinute: 30 }, // mardi
  3: { startHour: 17, startMinute: 30, endHour: 22, endMinute: 30 }, // mercredi
  4: { startHour: 12, startMinute: 0, endHour: 22, endMinute: 30 }, // jeudi (pas cours l'après-midi)
  5: { startHour: 17, startMinute: 30, endHour: 22, endMinute: 30 }, // vendredi
  6: { startHour: 8, startMinute: 0, endHour: 22, endMinute: 30 }, // samedi
};

// Génère les créneaux théoriques (indépendamment des réservations) pour un jour donné.
export function slotsForDay(day: Date): SlotTemplate[] {
  const window = WEEKLY_SCHEDULE[day.getDay()];
  const slots: SlotTemplate[] = [];

  const dayStart = new Date(day);
  dayStart.setHours(window.startHour, window.startMinute, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(window.endHour, window.endMinute, 0, 0);

  let cursor = dayStart;
  while (true) {
    const slotEnd = new Date(cursor);
    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_MINUTES);
    if (slotEnd > dayEnd) break;
    slots.push({ start: cursor, end: slotEnd });
    cursor = slotEnd;
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
