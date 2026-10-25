/**
 * Date hégirienne — calendrier islamique TABULAIRE (algorithme « koweïtien »).
 *
 * Calcul arithmétique local, sans dépendance à `Intl` (Hermes ne gère pas
 * partout `calendar: 'islamic'`). Il peut différer d'un jour de l'annonce
 * officielle, qui dépend de l'observation du croissant : c'est un repère
 * d'affichage, pas une source pour fixer le début du Ramadan.
 *
 * TODO(backend) : si le serveur expose un jour le calendrier hégirien officiel
 * (observation locale, ex. `GET /calendrier/hijri?date=`), le préférer ici.
 */
export interface HijriDate {
  day: number;
  /** 1 = Mouharram … 12 = Dhou al-Hijja. */
  month: number;
  year: number;
}

function julianDayNumber(date: Date): number {
  const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
  const y = date.getFullYear() + 4800 - a;
  const m = date.getMonth() + 1 + 12 * a - 3;
  return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function toHijri(date: Date = new Date()): HijriDate {
  let l = julianDayNumber(date) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719)
    + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year };
}
