/**
 * Données du parcours d'apprentissage.
 *
 * ⚠️ STRUCTURE MIROIR DE L'API.
 * Ce fichier reproduit exactement le format que renverra l'endpoint backend
 * `GET /sections`. Au branchement de l'API, il suffira de remplacer
 * `PARCOURS_SECTIONS` par le résultat du fetch — les composants ne changent pas.
 *
 * Organisation décidée :
 *   Section 1  = Alphabet Arabe
 *   Section 2  = Hizb 60
 *   Section 3  = Hizb 59
 *   Section 4  = Hizb 58
 *   ...
 *   Section N  = Hizb (62 − N)        (on décrémente : on commence par la fin du Coran)
 *
 * À l'intérieur d'un hizb, les sourates sont dans l'ordre du Mushaf.
 */

export type LessonState = 'completed' | 'active' | 'locked';

/** Icônes disponibles pour un nœud du parcours. */
export type NodeIcon =
  | 'star' | 'book' | 'pen'              // nœuds verts (complétés)
  | 'mosque' | 'kaaba'                   // gros nœuds spéciaux
  | 'note' | 'moon' | 'trophy' | 'crescent'; // nœuds gris (verrouillés)

export type NodeAlign = 'left' | 'right' | 'center';

/** Un nœud = une leçon (ou un palier) sur le chemin. */
export interface ParcoursNode {
  id: string;
  /** Référence vers la leçon backend (sera l'id Lesson de l'API). */
  lessonId: string | null;
  label?: string;          // ex: "Leçon 4" — affiché sous le nœud actif
  icon: NodeIcon;
  align: NodeAlign;
  state: LessonState;
}

/** Une sourate rattachée à une section (info contextuelle / badge). */
export interface ParcoursSourate {
  numero: number;          // 1–114
  nom: string;
  nomArabe: string;
  nombreVersets: number;
}

/** Une section du parcours (Alphabet, puis un hizb par section). */
export interface ParcoursSection {
  id: string;
  ordre: number;           // 1, 2, 3, …
  /** null pour l'alphabet, sinon le numéro de hizb (1–60). */
  hizb: number | null;
  /** Surtitre affiché en petit ("SECTION 1", "HIZB 60"…). */
  kicker: string;
  titre: string;           // titre principal, ex: "Hizb 60" / "Alphabet Arabe"
  /** Sous-titre listant les sourates / le contenu de la section. */
  sousTitre: string;
  couleur: string;         // couleur d'accent de la section
  /** Dégradé du bandeau [début, fin]. */
  degrade: [string, string];
  /** Icône Feather affichée dans la pastille du bandeau. */
  headerIcon: string;
  sourates: ParcoursSourate[];
  nodes: ParcoursNode[];
}

// ─── Palette par section (cycle visuel comme Duolingo) ───────────────────────
const SECTION_COLORS = ['#34C724', '#6B4DFF', '#F0820C', '#1CB0C7', '#E0398B'];

/** Dégradés assortis aux couleurs d'accent (même ordre que SECTION_COLORS). */
const SECTION_GRADIENTS: [string, string][] = [
  ['#3FD831', '#22A015'], // vert
  ['#7C5CFF', '#5A38E6'], // violet
  ['#FF9B3D', '#E06D00'], // orange
  ['#27C3DC', '#108EA3'], // cyan
  ['#F25BA6', '#C82270'], // rose
];

/** Construit le sous-titre d'un hizb à partir de ses sourates. */
function sousTitreSourates(sourates: ParcoursSourate[]): string {
  if (sourates.length === 0) return '';
  const noms = sourates.map((s) => s.nom);
  if (noms.length <= 3) return noms.join(' · ');
  return `${noms.slice(0, 3).join(' · ')} +${noms.length - 3}`;
}

// ─── Sourates par hizb (Juz Amma — du hizb 60 vers le 57) ────────────────────
// On ne référence que les premières sections : assez pour voir le design.
// Le backend fournira la liste complète des 60 hizbs.
const HIZB_SOURATES: Record<number, ParcoursSourate[]> = {
  60: [
    { numero: 105, nom: 'Al-Fil',      nomArabe: 'الفيل',   nombreVersets: 5 },
    { numero: 106, nom: 'Quraych',     nomArabe: 'قريش',    nombreVersets: 4 },
    { numero: 107, nom: 'Al-Maun',     nomArabe: 'الماعون', nombreVersets: 7 },
    { numero: 108, nom: 'Al-Kawthar',  nomArabe: 'الكوثر',  nombreVersets: 3 },
    { numero: 109, nom: 'Al-Kafirun',  nomArabe: 'الكافرون',nombreVersets: 6 },
    { numero: 110, nom: 'An-Nasr',     nomArabe: 'النصر',   nombreVersets: 3 },
    { numero: 111, nom: 'Al-Masad',    nomArabe: 'المسد',   nombreVersets: 5 },
    { numero: 112, nom: 'Al-Ikhlas',   nomArabe: 'الإخلاص', nombreVersets: 4 },
    { numero: 113, nom: 'Al-Falaq',    nomArabe: 'الفلق',   nombreVersets: 5 },
    { numero: 114, nom: 'An-Nas',      nomArabe: 'الناس',   nombreVersets: 6 },
  ],
  59: [
    { numero: 100, nom: 'Al-Adiyat',   nomArabe: 'العاديات',nombreVersets: 11 },
    { numero: 101, nom: 'Al-Qaria',    nomArabe: 'القارعة', nombreVersets: 11 },
    { numero: 102, nom: 'At-Takathur', nomArabe: 'التكاثر', nombreVersets: 8 },
    { numero: 103, nom: 'Al-Asr',      nomArabe: 'العصر',   nombreVersets: 3 },
    { numero: 104, nom: 'Al-Humaza',   nomArabe: 'الهمزة',  nombreVersets: 9 },
  ],
  58: [
    { numero: 93, nom: 'Ad-Duha',      nomArabe: 'الضحى',   nombreVersets: 11 },
    { numero: 94, nom: 'Ash-Sharh',    nomArabe: 'الشرح',   nombreVersets: 8 },
    { numero: 95, nom: 'At-Tin',       nomArabe: 'التين',   nombreVersets: 8 },
    { numero: 96, nom: 'Al-Alaq',      nomArabe: 'العلق',   nombreVersets: 19 },
    { numero: 97, nom: 'Al-Qadr',      nomArabe: 'القدر',   nombreVersets: 5 },
    { numero: 98, nom: 'Al-Bayyina',   nomArabe: 'البينة',  nombreVersets: 8 },
    { numero: 99, nom: 'Az-Zalzala',   nomArabe: 'الزلزلة', nombreVersets: 8 },
  ],
  57: [
    { numero: 87, nom: 'Al-Ala',       nomArabe: 'الأعلى',  nombreVersets: 19 },
    { numero: 88, nom: 'Al-Ghashiya',  nomArabe: 'الغاشية', nombreVersets: 26 },
    { numero: 89, nom: 'Al-Fajr',      nomArabe: 'الفجر',   nombreVersets: 30 },
    { numero: 90, nom: 'Al-Balad',     nomArabe: 'البلد',   nombreVersets: 20 },
    { numero: 91, nom: 'Ash-Shams',    nomArabe: 'الشمس',   nombreVersets: 15 },
    { numero: 92, nom: 'Al-Layl',      nomArabe: 'الليل',   nombreVersets: 21 },
  ],
};

// ─── Générateurs de nœuds ────────────────────────────────────────────────────

const COMPLETED_ICONS: NodeIcon[] = ['star', 'book', 'pen'];
const LOCKED_ICONS: NodeIcon[] = ['note', 'moon', 'trophy', 'kaaba', 'crescent'];
const ALIGNS: NodeAlign[] = ['left', 'right', 'center'];

/**
 * Construit la liste de nœuds d'une section.
 * `completed` = nb de leçons déjà faites, `activeIndex` = leçon en cours (-1 si aucune).
 */
function buildNodes(
  sectionId: string,
  total: number,
  completed: number,
  activeIndex: number,
): ParcoursNode[] {
  return Array.from({ length: total }, (_, i) => {
    let state: LessonState = 'locked';
    if (i < completed) state = 'completed';
    else if (i === activeIndex) state = 'active';

    let icon: NodeIcon;
    if (state === 'completed') icon = COMPLETED_ICONS[i % COMPLETED_ICONS.length];
    else if (state === 'active') icon = 'mosque';
    else icon = LOCKED_ICONS[i % LOCKED_ICONS.length];

    return {
      id: `${sectionId}-n${i + 1}`,
      lessonId: state === 'locked' ? null : `${sectionId}-lesson-${i + 1}`,
      label: state === 'active' ? `Leçon ${i + 1}` : undefined,
      icon,
      align: state === 'active' ? 'center' : ALIGNS[i % ALIGNS.length],
      state,
    };
  });
}

// ─── Construction des sections ───────────────────────────────────────────────

/** Section 1 — Alphabet Arabe (3 faites, la 4e active, le reste verrouillé). */
const SECTION_ALPHABET: ParcoursSection = {
  id: 'sec-alphabet',
  ordre: 1,
  hizb: null,
  kicker: 'SECTION 1',
  titre: 'Alphabet Arabe',
  sousTitre: 'Apprends à lire les 28 lettres',
  couleur: SECTION_COLORS[0],
  degrade: SECTION_GRADIENTS[0],
  headerIcon: 'type',
  sourates: [],
  nodes: buildNodes('sec-alphabet', 10, 3, 3),
};

/** Hizbs à afficher, dans l'ordre du parcours (60 → 57). */
const HIZB_ORDER = [60, 59, 58, 57];

const HIZB_SECTIONS: ParcoursSection[] = HIZB_ORDER.map((hizb, idx) => {
  const ordre = idx + 2; // section 2, 3, 4, …
  const id = `sec-hizb-${hizb}`;
  const sourates = HIZB_SOURATES[hizb] ?? [];
  // 1 leçon par sourate du hizb.
  const total = sourates.length;
  const colorIdx = ordre % SECTION_COLORS.length;
  // Toutes verrouillées tant que l'alphabet n'est pas fini (cohérent avec le mock).
  return {
    id,
    ordre,
    hizb,
    kicker: `SECTION ${ordre}`,
    titre: `Hizb ${hizb}`,
    sousTitre: sousTitreSourates(sourates),
    couleur: SECTION_COLORS[colorIdx],
    degrade: SECTION_GRADIENTS[colorIdx],
    headerIcon: 'book-open',
    sourates,
    nodes: buildNodes(id, total, 0, -1),
  };
});

export const PARCOURS_SECTIONS: ParcoursSection[] = [
  SECTION_ALPHABET,
  ...HIZB_SECTIONS,
];
