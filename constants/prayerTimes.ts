/**
 * Heures de prière — calcul 100 % LOCAL (librairie `adhan`).
 *
 * Aucun appel réseau : les horaires sont dérivés de la position du soleil pour
 * une latitude/longitude et une date. C'est volontaire — une app qui affiche
 * l'heure du Maghreb ne doit pas dépendre d'une connexion, et le reste de
 * l'app souffre déjà assez du hors-ligne.
 *
 * ⚠️ CONTENU RELIGIEUX — la méthode de calcul change les heures (surtout Fajr
 * et Isha, dont l'angle solaire varie d'une école à l'autre). On expose donc le
 * choix à l'utilisateur plutôt que d'imposer un réglage : des horaires « faux »
 * de 15 minutes par rapport à la mosquée du quartier ruinent la confiance.
 */
import {
  CalculationMethod,
  Coordinates,
  PrayerTimes,
  Qibla,
  type CalculationParameters,
} from 'adhan';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/** Une prière : son nom technique et son heure locale. */
export interface PrayerSlot {
  name: PrayerName;
  time: Date;
}

/** Méthodes de calcul proposées (libellé affiché côté écran via i18n). */
export type MethodId = 'muslimWorldLeague' | 'egyptian' | 'karachi' | 'ummAlQura' | 'moonsightingCommittee';

export const METHOD_IDS: MethodId[] = [
  'muslimWorldLeague',
  'egyptian',
  'karachi',
  'ummAlQura',
  'moonsightingCommittee',
];

/**
 * Défaut : Muslim World League, la plus répandue en Afrique de l'Ouest et en
 * Europe. L'utilisateur peut en changer dans les réglages.
 */
export const DEFAULT_METHOD: MethodId = 'muslimWorldLeague';

function paramsFor(method: MethodId): CalculationParameters {
  switch (method) {
    case 'egyptian': return CalculationMethod.Egyptian();
    case 'karachi': return CalculationMethod.Karachi();
    case 'ummAlQura': return CalculationMethod.UmmAlQura();
    case 'moonsightingCommittee': return CalculationMethod.MoonsightingCommittee();
    case 'muslimWorldLeague':
    default: return CalculationMethod.MuslimWorldLeague();
  }
}

/** Les 5 prières du jour pour une position donnée. */
export function computePrayerTimes(
  latitude: number,
  longitude: number,
  method: MethodId = DEFAULT_METHOD,
  date: Date = new Date(),
): PrayerSlot[] {
  const times = new PrayerTimes(new Coordinates(latitude, longitude), date, paramsFor(method));
  return [
    { name: 'fajr', time: times.fajr },
    { name: 'dhuhr', time: times.dhuhr },
    { name: 'asr', time: times.asr },
    { name: 'maghrib', time: times.maghrib },
    { name: 'isha', time: times.isha },
  ];
}

/**
 * La prochaine prière à venir. Après l'Isha, renvoie le Fajr du LENDEMAIN —
 * sans ça, l'écran afficherait « prochaine : Fajr » avec l'heure de ce matin,
 * déjà passée.
 */
export function nextPrayer(slots: PrayerSlot[], now: Date = new Date()): PrayerSlot | null {
  const upcoming = slots.find((s) => s.time.getTime() > now.getTime());
  return upcoming ?? null;
}

/** Formate une heure en "HH:MM" dans le fuseau local de l'appareil. */
export function formatPrayerTime(date: Date, localeTag = 'fr-FR'): string {
  return date.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Durée restante avant `target`, en "1 h 23" ou "23 min". */
export function timeUntil(target: Date, now: Date = new Date()): { hours: number; minutes: number } {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// ─── Qibla ───────────────────────────────────────────────────────────────────

/** Coordonnées de la Kaaba — référence de la direction de prière. */
const KAABA = { latitude: 21.4225, longitude: 39.8262 };

/**
 * Direction de la Qibla, en degrés depuis le NORD GÉOGRAPHIQUE
 * (0 = nord, 90 = est, 180 = sud, 270 = ouest).
 *
 * ⚠️ Une boussole de téléphone mesure le nord MAGNÉTIQUE, qui diffère du nord
 * géographique selon l'endroit (déclinaison magnétique). L'écart est faible au
 * Sénégal et en Europe de l'Ouest (quelques degrés), mais l'affichage reste
 * indicatif — c'est pourquoi l'écran le précise.
 */
export function qiblaDirection(latitude: number, longitude: number): number {
  return Qibla(new Coordinates(latitude, longitude));
}

/**
 * Distance jusqu'à La Mecque en kilomètres (formule de haversine, Terre
 * sphérique — l'écart avec un calcul ellipsoïdal est négligeable à l'échelle
 * d'un affichage arrondi au kilomètre).
 */
export function distanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // rayon moyen de la Terre en km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(KAABA.latitude - latitude);
  const dLon = toRad(KAABA.longitude - longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/** Les 8 points cardinaux, pour dire "nord-est" plutôt que "74°" seul. */
export type CardinalKey = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** Point cardinal le plus proche d'un cap donné. */
export function cardinalFor(degrees: number): CardinalKey {
  const keys: CardinalKey[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  // 360/8 = 45° par secteur, décalé de 22.5° pour centrer chaque point.
  const idx = Math.round(((degrees % 360) + 360) % 360 / 45) % 8;
  return keys[idx]!;
}

/**
 * Villes de repli quand la géolocalisation est refusée ou indisponible.
 * Volontairement courte et centrée sur les utilisateurs attendus : une liste
 * mondiale exhaustive appelle une recherche, donc un service tiers — hors
 * périmètre pour l'instant.
 */
export interface City {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
}

export const FALLBACK_CITIES: City[] = [
  { id: 'dakar', nom: 'Dakar', latitude: 14.6928, longitude: -17.4467 },
  { id: 'thies', nom: 'Thiès', latitude: 14.7910, longitude: -16.9256 },
  { id: 'touba', nom: 'Touba', latitude: 14.8500, longitude: -15.8833 },
  { id: 'saint-louis', nom: 'Saint-Louis', latitude: 16.0179, longitude: -16.4896 },
  { id: 'ziguinchor', nom: 'Ziguinchor', latitude: 12.5833, longitude: -16.2719 },
  { id: 'kaolack', nom: 'Kaolack', latitude: 14.1652, longitude: -16.0726 },
  { id: 'paris', nom: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { id: 'marseille', nom: 'Marseille', latitude: 43.2965, longitude: 5.3698 },
  { id: 'bruxelles', nom: 'Bruxelles', latitude: 50.8503, longitude: 4.3517 },
  { id: 'montreal', nom: 'Montréal', latitude: 45.5019, longitude: -73.5674 },
  { id: 'casablanca', nom: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { id: 'abidjan', nom: 'Abidjan', latitude: 5.3600, longitude: -4.0083 },
  { id: 'bamako', nom: 'Bamako', latitude: 12.6392, longitude: -8.0029 },
  { id: 'conakry', nom: 'Conakry', latitude: 9.6412, longitude: -13.5784 },
  { id: 'nouakchott', nom: 'Nouakchott', latitude: 18.0735, longitude: -15.9582 },
  { id: 'makkah', nom: 'La Mecque', latitude: 21.4225, longitude: 39.8262 },
  { id: 'madinah', nom: 'Médine', latitude: 24.4686, longitude: 39.6142 },
];
