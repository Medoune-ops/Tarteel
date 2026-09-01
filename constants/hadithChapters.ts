/**
 * Titres de chapitres traduits et regroupés par thème.
 *
 * La source (hadith-api) livre les hadiths en français mais garde les titres
 * de chapitres en anglais — d'où cette table. Le regroupement par thème
 * évite de présenter 97 chapitres bruts pour Bukhari : on entre par un sujet
 * ("Purification et prière"), puis on choisit son chapitre.
 *
 * ⚠️ CONTENU RELIGIEUX — traductions volontairement proches de l'usage
 * courant, à faire relire par une personne compétente. Les termes techniques
 * arabes sont conservés entre parenthèses quand ils sont plus parlants que
 * leur traduction (Wudu, Zakat, I'tikaf…).
 */

export type ThemeId =
  | 'foi'
  | 'purete'
  | 'jeune'
  | 'social'
  | 'comportement'
  | 'prophete'
  | 'coran'
  | 'droit'
  | 'fin';

/** Thèmes, dans l'ordre d'affichage. */
export const THEMES: { id: ThemeId; emoji: string; color: string }[] = [
  { id: 'foi', emoji: '🕌', color: '#6B4DFF' },
  { id: 'purete', emoji: '💧', color: '#1F8A70' },
  { id: 'jeune', emoji: '🌙', color: '#8A5CF0' },
  { id: 'coran', emoji: '📖', color: '#2A9E1C' },
  { id: 'prophete', emoji: '⭐', color: '#E0A02C' },
  { id: 'comportement', emoji: '🤲', color: '#F0820C' },
  { id: 'social', emoji: '👥', color: '#E0584F' },
  { id: 'droit', emoji: '⚖️', color: '#4C8B3E' },
  { id: 'fin', emoji: '🌅', color: '#7A828F' },
];

/** Un chapitre : son thème et son titre français. */
interface Chapter {
  fr: string;
  theme: ThemeId;
}

/** Bukhari — 97 chapitres. */
export const BUKHARI_CHAPTERS: Record<number, Chapter> = {
  1: { fr: 'La Révélation', theme: 'coran' },
  2: { fr: 'La foi', theme: 'foi' },
  3: { fr: 'La science', theme: 'foi' },
  4: { fr: 'Les ablutions (Wudu)', theme: 'purete' },
  5: { fr: 'Le bain rituel (Ghusl)', theme: 'purete' },
  6: { fr: 'Les menstrues', theme: 'purete' },
  7: { fr: 'L\'ablution sèche (Tayammum)', theme: 'purete' },
  8: { fr: 'La prière (Salat)', theme: 'purete' },
  9: { fr: 'Les heures de prière', theme: 'purete' },
  10: { fr: 'L\'appel à la prière (Adhan)', theme: 'purete' },
  11: { fr: 'La prière du vendredi', theme: 'purete' },
  12: { fr: 'La prière en cas de peur', theme: 'purete' },
  13: { fr: 'Les deux fêtes (Aïd)', theme: 'purete' },
  14: { fr: 'La prière du Witr', theme: 'purete' },
  15: { fr: 'La prière pour la pluie (Istisqa)', theme: 'purete' },
  16: { fr: 'Les éclipses', theme: 'purete' },
  17: { fr: 'La prosternation à la récitation du Coran', theme: 'coran' },
  18: { fr: 'Raccourcir la prière en voyage', theme: 'purete' },
  19: { fr: 'La prière de nuit (Tahajjud)', theme: 'purete' },
  20: { fr: 'Mérites des mosquées de La Mecque et Médine', theme: 'purete' },
  21: { fr: 'Les actes pendant la prière', theme: 'purete' },
  22: { fr: 'L\'oubli dans la prière', theme: 'purete' },
  23: { fr: 'Les funérailles', theme: 'social' },
  24: { fr: 'L\'aumône obligatoire (Zakat)', theme: 'social' },
  25: { fr: 'Le pèlerinage (Hajj)', theme: 'jeune' },
  26: { fr: 'Le petit pèlerinage (Umra)', theme: 'jeune' },
  27: { fr: 'Le pèlerin empêché', theme: 'jeune' },
  28: { fr: 'La chasse pendant le pèlerinage', theme: 'jeune' },
  29: { fr: 'Les mérites de Médine', theme: 'prophete' },
  30: { fr: 'Le jeûne', theme: 'jeune' },
  31: { fr: 'La prière nocturne du Ramadan (Tarawih)', theme: 'jeune' },
  32: { fr: 'Les mérites de la Nuit du Destin', theme: 'jeune' },
  33: { fr: 'La retraite spirituelle (I\'tikaf)', theme: 'jeune' },
  34: { fr: 'Le commerce', theme: 'droit' },
  35: { fr: 'La vente à livraison différée (Salam)', theme: 'droit' },
  36: { fr: 'Le droit de préemption (Shuf\'a)', theme: 'droit' },
  37: { fr: 'La location', theme: 'droit' },
  38: { fr: 'Le transfert de dette (Hawala)', theme: 'droit' },
  39: { fr: 'La caution (Kafala)', theme: 'droit' },
  40: { fr: 'La procuration', theme: 'droit' },
  41: { fr: 'L\'agriculture', theme: 'droit' },
  42: { fr: 'Le partage de l\'eau', theme: 'droit' },
  43: { fr: 'Prêts, dettes et faillite', theme: 'droit' },
  44: { fr: 'Les litiges', theme: 'droit' },
  45: { fr: 'Les objets trouvés', theme: 'droit' },
  46: { fr: 'L\'injustice', theme: 'comportement' },
  47: { fr: 'L\'association (Sharika)', theme: 'droit' },
  48: { fr: 'Le gage', theme: 'droit' },
  49: { fr: 'L\'affranchissement des esclaves', theme: 'social' },
  50: { fr: 'Le contrat d\'affranchissement', theme: 'social' },
  51: { fr: 'Les dons', theme: 'social' },
  52: { fr: 'Les témoignages', theme: 'droit' },
  53: { fr: 'La réconciliation', theme: 'social' },
  54: { fr: 'Les conditions', theme: 'droit' },
  55: { fr: 'Les testaments', theme: 'droit' },
  56: { fr: 'Le combat pour Allah (Jihad)', theme: 'droit' },
  57: { fr: 'Le cinquième du butin', theme: 'droit' },
  58: { fr: 'La capitation et les traités', theme: 'droit' },
  59: { fr: 'Le début de la création', theme: 'foi' },
  60: { fr: 'Les prophètes', theme: 'prophete' },
  61: { fr: 'Mérites du Prophète ﷺ et de ses compagnons', theme: 'prophete' },
  62: { fr: 'Les compagnons du Prophète ﷺ', theme: 'prophete' },
  63: { fr: 'Les mérites des Ansars', theme: 'prophete' },
  64: { fr: 'Les expéditions du Prophète ﷺ', theme: 'prophete' },
  65: { fr: 'Le commentaire du Coran', theme: 'coran' },
  66: { fr: 'Les mérites du Coran', theme: 'coran' },
  67: { fr: 'Le mariage', theme: 'social' },
  68: { fr: 'Le divorce', theme: 'social' },
  69: { fr: 'L\'entretien de la famille', theme: 'social' },
  70: { fr: 'La nourriture et les repas', theme: 'comportement' },
  71: { fr: 'Le sacrifice de naissance (Aqiqa)', theme: 'social' },
  72: { fr: 'La chasse et l\'abattage', theme: 'comportement' },
  73: { fr: 'Le sacrifice de l\'Aïd', theme: 'jeune' },
  74: { fr: 'Les boissons', theme: 'comportement' },
  75: { fr: 'Les malades', theme: 'comportement' },
  76: { fr: 'La médecine', theme: 'comportement' },
  77: { fr: 'L\'habillement', theme: 'comportement' },
  78: { fr: 'Le bon comportement (Adab)', theme: 'comportement' },
  79: { fr: 'Demander la permission', theme: 'comportement' },
  80: { fr: 'Les invocations', theme: 'foi' },
  81: { fr: 'L\'attendrissement des cœurs', theme: 'foi' },
  82: { fr: 'Le destin (Qadar)', theme: 'foi' },
  83: { fr: 'Les serments et les vœux', theme: 'droit' },
  84: { fr: 'L\'expiation des serments', theme: 'droit' },
  85: { fr: 'Les successions', theme: 'droit' },
  86: { fr: 'Les peines légales (Hudud)', theme: 'droit' },
  87: { fr: 'Le prix du sang (Diya)', theme: 'droit' },
  88: { fr: 'Les apostats', theme: 'droit' },
  89: { fr: 'La contrainte', theme: 'droit' },
  90: { fr: 'Les ruses', theme: 'droit' },
  91: { fr: 'L\'interprétation des rêves', theme: 'foi' },
  92: { fr: 'Les troubles et la fin du monde', theme: 'fin' },
  93: { fr: 'Les jugements', theme: 'droit' },
  94: { fr: 'Les souhaits', theme: 'comportement' },
  95: { fr: 'L\'information d\'une personne digne de foi', theme: 'foi' },
  96: { fr: 'S\'attacher au Coran et à la Sunna', theme: 'coran' },
  97: { fr: 'L\'unicité d\'Allah (Tawhid)', theme: 'foi' },
};

/** Muslim — 57 chapitres. */
export const MUSLIM_CHAPTERS: Record<number, Chapter> = {
  0: { fr: 'Introduction', theme: 'foi' },
  1: { fr: 'La foi', theme: 'foi' },
  2: { fr: 'La purification', theme: 'purete' },
  3: { fr: 'Les menstrues', theme: 'purete' },
  4: { fr: 'La prière', theme: 'purete' },
  5: { fr: 'Les mosquées et lieux de prière', theme: 'purete' },
  6: { fr: 'La prière du voyageur', theme: 'purete' },
  7: { fr: 'La prière du vendredi', theme: 'purete' },
  8: { fr: 'La prière des deux Aïd', theme: 'purete' },
  9: { fr: 'La prière pour la pluie', theme: 'purete' },
  10: { fr: 'La prière des éclipses', theme: 'purete' },
  11: { fr: 'La prière funéraire', theme: 'social' },
  12: { fr: 'L\'aumône (Zakat)', theme: 'social' },
  13: { fr: 'Le jeûne', theme: 'jeune' },
  14: { fr: 'La retraite spirituelle (I\'tikaf)', theme: 'jeune' },
  15: { fr: 'Le pèlerinage', theme: 'jeune' },
  16: { fr: 'Le mariage', theme: 'social' },
  17: { fr: 'L\'allaitement', theme: 'social' },
  18: { fr: 'Le divorce', theme: 'social' },
  19: { fr: 'L\'imprécation mutuelle', theme: 'social' },
  20: { fr: 'L\'affranchissement des esclaves', theme: 'social' },
  21: { fr: 'Les transactions', theme: 'droit' },
  22: { fr: 'L\'irrigation (Musaqah)', theme: 'droit' },
  23: { fr: 'Les règles de succession', theme: 'droit' },
  24: { fr: 'Les dons', theme: 'social' },
  25: { fr: 'Les testaments', theme: 'droit' },
  26: { fr: 'Les vœux', theme: 'droit' },
  27: { fr: 'Les serments', theme: 'droit' },
  28: { fr: 'Serments, talion et prix du sang', theme: 'droit' },
  29: { fr: 'Les peines légales', theme: 'droit' },
  30: { fr: 'Les décisions judiciaires', theme: 'droit' },
  31: { fr: 'Les objets trouvés', theme: 'droit' },
  32: { fr: 'Le combat et les expéditions', theme: 'droit' },
  33: { fr: 'Le gouvernement', theme: 'droit' },
  34: { fr: 'Chasse, abattage et nourriture licite', theme: 'comportement' },
  35: { fr: 'Les sacrifices', theme: 'jeune' },
  36: { fr: 'Les boissons', theme: 'comportement' },
  37: { fr: 'Les vêtements et la parure', theme: 'comportement' },
  38: { fr: 'Les bonnes manières', theme: 'comportement' },
  39: { fr: 'Les salutations', theme: 'comportement' },
  40: { fr: 'L\'emploi des mots justes', theme: 'comportement' },
  41: { fr: 'La poésie', theme: 'comportement' },
  42: { fr: 'Les rêves', theme: 'foi' },
  43: { fr: 'Les mérites du Prophète ﷺ', theme: 'prophete' },
  44: { fr: 'Les mérites des compagnons', theme: 'prophete' },
  45: { fr: 'Vertu, bonnes manières et liens de parenté', theme: 'comportement' },
  46: { fr: 'Le destin', theme: 'foi' },
  47: { fr: 'La science', theme: 'foi' },
  48: { fr: 'Rappel d\'Allah, invocation et repentir', theme: 'foi' },
  49: { fr: 'Les récits qui attendrissent les cœurs', theme: 'foi' },
  50: { fr: 'Le repentir', theme: 'foi' },
  51: { fr: 'Les hypocrites', theme: 'fin' },
  52: { fr: 'Le Jour du Jugement, le Paradis et l\'Enfer', theme: 'fin' },
  53: { fr: 'Le Paradis et ses habitants', theme: 'fin' },
  54: { fr: 'Les troubles et les signes de l\'Heure', theme: 'fin' },
  55: { fr: 'L\'ascèse et l\'attendrissement des cœurs', theme: 'foi' },
  56: { fr: 'Le commentaire du Coran', theme: 'coran' },
};

/** Recueils courts : un seul chapitre, pas de regroupement nécessaire. */
export const NAWAWI_CHAPTERS: Record<number, Chapter> = {
  1: { fr: 'Les 40 hadiths de l\'imam an-Nawawi', theme: 'foi' },
};

export const QUDSI_CHAPTERS: Record<number, Chapter> = {
  1: { fr: 'Les 40 hadiths Qudsi', theme: 'foi' },
};

/** Table des chapitres pour un recueil donné. */
export function chaptersFor(collectionId: string): Record<number, Chapter> {
  switch (collectionId) {
    case 'bukhari': return BUKHARI_CHAPTERS;
    case 'muslim': return MUSLIM_CHAPTERS;
    case 'nawawi': return NAWAWI_CHAPTERS;
    case 'qudsi': return QUDSI_CHAPTERS;
    default: return {};
  }
}
