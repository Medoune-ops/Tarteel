/**
 * Étiquetage émotionnel des hadiths : entrer par ce qu'on ressent.
 *
 * Les chapitres de `hadithChapters.ts` répondent à « où est le hadith sur le
 * jeûne ? ». Ici on répond à « j'ai peur, qu'est-ce que je lis ? ». Ce sont
 * deux entrées différentes dans le même corpus : l'une bibliographique,
 * l'autre par situation de vie.
 *
 * Les tags sont volontairement LARGES et peu nombreux (~30) : un utilisateur
 * qui tape « je stresse » ne doit pas tomber sur un écran vide. Chaque tag a
 * au moins 2 hadiths dans `hadithTags.ts`, sinon il a été fusionné avec son
 * voisin le plus proche.
 *
 * ⚠️ CONTENU RELIGIEUX — un tag n'est pas une fatwa : il dit « ce texte parle
 * de ça », pas « voici la réponse à ton problème ». En cas de doute sur le
 * sens d'un hadith, il n'a pas été tagué plutôt que d'être tordu.
 */

export type EmotionId =
  | 'peur'
  | 'tristesse'
  | 'colere'
  | 'doute'
  | 'gratitude'
  | 'pardon'
  | 'repentir'
  | 'amour'
  | 'fraternite'
  | 'famille'
  | 'parents'
  | 'couple'
  | 'solitude'
  | 'maladie'
  | 'mort'
  | 'argent'
  | 'pauvrete'
  | 'generosite'
  | 'travail'
  | 'injustice'
  | 'orgueil'
  | 'jalousie'
  | 'patience'
  | 'espoir'
  | 'confiance'
  | 'matin'
  | 'nuit'
  | 'intention'
  | 'parole'
  | 'humilite'
  | 'justice'
  | 'sens';

/**
 * Émotions dans l'ordre d'affichage : d'abord les états difficiles (ce pour
 * quoi on ouvre l'app un mauvais jour), puis les élans positifs, puis les
 * moments de la journée et les questions de fond.
 *
 * Les couleurs reprennent la palette des THEMES de `hadithChapters.ts` pour
 * que les deux entrées du même corpus se ressemblent visuellement.
 */
export const EMOTIONS: {
  id: EmotionId;
  emoji: string;
  color: string;
  fr: string;
  en: string;
}[] = [
  { id: 'peur', emoji: '😰', color: '#6B4DFF', fr: 'Peur et anxiété', en: 'Fear and anxiety' },
  { id: 'tristesse', emoji: '😔', color: '#7A828F', fr: 'Tristesse et chagrin', en: 'Sadness and grief' },
  { id: 'colere', emoji: '😤', color: '#E0584F', fr: 'Colère', en: 'Anger' },
  { id: 'doute', emoji: '🤔', color: '#8A5CF0', fr: 'Doute et hésitation', en: 'Doubt and hesitation' },
  { id: 'solitude', emoji: '🌑', color: '#4A5568', fr: 'Solitude', en: 'Loneliness' },
  { id: 'injustice', emoji: '⚖️', color: '#4C8B3E', fr: 'Injustice subie', en: 'Being wronged' },
  { id: 'jalousie', emoji: '👀', color: '#B5651D', fr: 'Jalousie et envie', en: 'Jealousy and envy' },
  { id: 'orgueil', emoji: '🪞', color: '#A0522D', fr: 'Orgueil', en: 'Pride' },
  { id: 'repentir', emoji: '🙇', color: '#5B7CB8', fr: 'Culpabilité et repentir', en: 'Guilt and repentance' },
  { id: 'maladie', emoji: '🤒', color: '#1F8A70', fr: 'Maladie et souffrance', en: 'Illness and suffering' },
  { id: 'mort', emoji: '🕊️', color: '#7A828F', fr: 'La mort', en: 'Death' },
  { id: 'pauvrete', emoji: '🍞', color: '#8B6F47', fr: 'Manque et pauvreté', en: 'Need and poverty' },
  { id: 'argent', emoji: '💰', color: '#E0A02C', fr: 'Argent et richesse', en: 'Money and wealth' },
  { id: 'travail', emoji: '🛠️', color: '#3E7CB1', fr: 'Travail et effort', en: 'Work and effort' },
  { id: 'patience', emoji: '⏳', color: '#2A9E1C', fr: 'Patience et épreuve', en: 'Patience and hardship' },
  { id: 'espoir', emoji: '🌤️', color: '#F0820C', fr: 'Espoir', en: 'Hope' },
  { id: 'confiance', emoji: '🤲', color: '#6B4DFF', fr: 'Confiance en Dieu', en: 'Trust in God' },
  { id: 'pardon', emoji: '🤍', color: '#5B9BD5', fr: 'Pardon', en: 'Forgiveness' },
  { id: 'amour', emoji: '❤️', color: '#D9534F', fr: 'Amour', en: 'Love' },
  { id: 'fraternite', emoji: '👥', color: '#E0584F', fr: 'Amitié et proches', en: 'Friends and loved ones' },
  { id: 'parents', emoji: '🫂', color: '#B8703F', fr: 'Mes parents', en: 'My parents' },
  { id: 'famille', emoji: '🏠', color: '#C9705B', fr: 'Famille et proches', en: 'Family and relatives' },
  { id: 'couple', emoji: '💞', color: '#C45B7C', fr: 'Couple et mariage', en: 'Marriage and partner' },
  { id: 'generosite', emoji: '🎁', color: '#F0820C', fr: 'Générosité', en: 'Generosity' },
  { id: 'gratitude', emoji: '🙏', color: '#2A9E1C', fr: 'Gratitude', en: 'Gratitude' },
  { id: 'humilite', emoji: '🌱', color: '#4C8B3E', fr: 'Humilité', en: 'Humility' },
  { id: 'justice', emoji: '🤝', color: '#4C8B3E', fr: 'Être juste', en: 'Being fair' },
  { id: 'parole', emoji: '💬', color: '#3E7CB1', fr: 'Parole et langue', en: 'Speech and the tongue' },
  { id: 'intention', emoji: '🎯', color: '#6B4DFF', fr: 'Intention et sincérité', en: 'Intention and sincerity' },
  { id: 'matin', emoji: '🌅', color: '#E0A02C', fr: 'Commencer sa journée', en: 'Starting the day' },
  { id: 'nuit', emoji: '🌙', color: '#8A5CF0', fr: 'La nuit', en: 'Night time' },
  { id: 'sens', emoji: '🧭', color: '#7A828F', fr: 'Sens de la vie', en: 'Meaning of life' },
];

/**
 * Formulations naturelles qui mènent à chaque émotion, en français et en
 * anglais.
 *
 * C'est ce qui permet de se passer d'API : plutôt que de « comprendre » la
 * phrase, on la compare à une liste large de tournures réelles. On y met donc
 * le familier (« j'en peux plus », « i'm fed up »), les mots isolés que les
 * gens tapent (« stress », « deuil ») et les formes sans accent, la
 * normalisation de `hadithSearch.ts` s'occupant du reste (casse, accents,
 * ponctuation, apostrophes).
 *
 * Les entrées sont écrites en minuscules et sans ponctuation : elles sont
 * normalisées à la même moulinette que la saisie utilisateur.
 */
export const SYNONYMS: Record<EmotionId, { fr: string[]; en: string[] }> = {
  peur: {
    fr: [
      'peur', "j'ai peur", 'ca me fait peur', 'angoisse', "je suis angoisse", 'anxiete',
      'je suis anxieux', 'je suis anxieuse', 'stress', 'je stresse', 'je suis stresse',
      'inquiet', 'inquiete', 'je suis inquiet', 'je m inquiete', "j'appprehende", "j'apprehende",
      'je panique', 'panique', 'crise d angoisse', "j'ai pas l'esprit tranquille",
      'je n arrive pas a me calmer', 'je me sens pas bien', 'terrifie', 'effraye',
      'nerveux', 'tendu', 'ca m angoisse', 'boule au ventre',
    ],
    en: [
      'fear', 'afraid', "i'm afraid", 'scared', "i'm scared", 'anxiety', 'anxious',
      "i'm anxious", 'stress', 'stressed', "i'm stressed", 'worried', "i'm worried",
      'worry', 'panic', "i'm panicking", 'panic attack', "i can't calm down",
      'nervous', 'uneasy', 'terrified', 'dread', 'on edge', 'restless',
    ],
  },
  tristesse: {
    fr: [
      'triste', 'je suis triste', 'tristesse', 'chagrin', 'peine', "j'ai de la peine",
      'deprime', 'je deprime', 'je suis deprime', 'le moral a zero', 'pas le moral',
      'je pleure', 'envie de pleurer', 'deuil', 'je suis en deuil', 'malheureux',
      'malheureuse', 'je vais mal', "j'en peux plus", 'desespere', 'cafard',
      'coeur lourd', 'abattu', 'melancolie',
      "j'ai perdu un proche", 'perdre quelqu un qu on aime', 'perte',
    ],
    en: [
      'sad', "i'm sad", 'sadness', 'sorrow', 'grief', 'grieving', 'i am grieving',
      'depressed', "i'm depressed", 'down', 'feeling down', 'heartbroken',
      'i want to cry', 'crying', 'mourning', 'unhappy', 'miserable', 'hopeless',
      'low', 'i feel awful', 'broken', 'i lost a loved one', 'loss',
    ],
  },
  colere: {
    fr: [
      'colere', 'je suis en colere', 'je suis enerve', 'enerve', 'ca m enerve',
      'je suis furieux', 'furieux', 'rage', "j'ai la haine", 'je suis vener',
      'je m emporte', 'je perds mon calme', 'irrite', 'agace', 'je bous',
      'je vois rouge', 'ressentiment', 'rancune', 'je lui en veux', 'je suis remonte',
    ],
    en: [
      'angry', "i'm angry", 'anger', 'mad', "i'm mad", 'furious', 'rage', 'enraged',
      'irritated', 'annoyed', 'i lost my temper', 'i lose my temper', 'fed up',
      'i hold a grudge', 'grudge', 'resentment', 'pissed off', 'upset with someone',
    ],
  },
  doute: {
    fr: [
      'doute', 'je doute', "j'ai des doutes", 'je sais pas quoi faire', 'hesitation',
      "j'hesite", 'je suis perdu', 'je suis perdue', 'confus', 'je sais plus',
      'incertain', 'je me pose des questions', 'dilemme', 'choix difficile',
      'est ce que je dois', 'je suis partage', 'trouble',
    ],
    en: [
      'doubt', 'i doubt', 'doubts', 'unsure', "i don't know what to do", 'hesitating',
      'hesitation', 'confused', "i'm confused", 'lost', "i'm lost", 'uncertain',
      'torn', 'dilemma', 'hard choice', 'second guessing', 'questioning',
    ],
  },
  gratitude: {
    fr: [
      'gratitude', 'reconnaissance', 'merci', 'je suis reconnaissant', 'remercier',
      'dire merci', 'compter ses benedictions', 'bienfaits', 'je suis chanceux',
      "j'ai de la chance", 'je me sens beni', 'alhamdoulillah', 'louange',
      'apprecier ce que j ai', 'content de ce que j ai',
    ],
    en: [
      'gratitude', 'grateful', "i'm grateful", 'thankful', 'thank you', 'thanks',
      'blessings', 'blessed', 'count my blessings', 'appreciate', 'appreciation',
      'praise', 'alhamdulillah', 'lucky', 'content with what i have',
    ],
  },
  pardon: {
    fr: [
      'pardon', 'pardonner', 'je veux pardonner', "j'arrive pas a pardonner",
      'demander pardon', 'se faire pardonner', 'se reconcilier', 'reconciliation',
      'oublier une offense', 'passer l eponge', 'brouille', 'on est fache',
      'rancune', 'garder rancune', 'excuses', "m'excuser", 'clemence', 'misericorde',
    ],
    en: [
      'forgive', 'forgiveness', 'i want to forgive', "i can't forgive", 'forgive me',
      'ask forgiveness', 'make up', 'reconcile', 'reconciliation', 'let it go',
      'we fell out', 'grudge', 'holding a grudge', 'apologise', 'apologize',
      'apology', 'mercy', 'pardon',
    ],
  },
  repentir: {
    fr: [
      'culpabilite', 'je culpabilise', 'je me sens coupable', 'remords', 'regret',
      'je regrette', 'repentir', 'me repentir', 'faire tawba', 'tawba', 'peche',
      "j'ai fait une erreur", "j'ai mal agi", 'honte', "j'ai honte", 'recommencer a zero',
      'me racheter', 'me corriger', 'je suis nul', 'je merite pas',
    ],
    en: [
      'guilt', 'i feel guilty', 'guilty', 'remorse', 'regret', 'i regret',
      'repent', 'repentance', 'tawba', 'sin', 'i sinned', 'i made a mistake',
      'i messed up', 'ashamed', 'shame', 'start over', 'make amends', 'i feel worthless',
    ],
  },
  amour: {
    fr: [
      'amour', "j'aime quelqu'un", 'je suis amoureux', 'je suis amoureuse',
      'aimer', 'etre aime', 'personne que j aime', 'sentiment', 'affection',
      'attachement', 'coup de coeur', 'je tiens a quelqu un', 'etre aime de dieu',
      'amour de dieu', 'chagrin d amour',
    ],
    en: [
      'love', 'i love someone', "i'm in love", 'loving', 'being loved', 'beloved',
      'affection', 'i care about someone', 'attachment', 'crush', 'feelings for someone',
      "god's love", 'loved by god', 'heartbreak',
    ],
  },
  fraternite: {
    fr: [
      'amitie', 'ami', 'mes amis', 'fraternite', 'frere', 'freres', 'entraide',
      'aider un ami', 'compagnie', 'entourage', 'communaute', 'voisin', 'voisins',
      'lien social', 'me reconcilier avec un ami', 'conflit avec un ami',
      'relations', 'bien s entendre', 'invite', 'hospitalite',
      // « famille », « mes parents » et leurs variantes appartiennent
      // désormais au tag `famille` : Bukhari et Muslim ont apporté 91 hadiths
      // spécifiquement familiaux, là où an-Nawawi et al-Qudsi n'en avaient
      // aucun. Les laisser ici ferait se disputer les deux tags.
    ],
    en: [
      'friendship', 'friend', 'friends', 'brotherhood', 'brother', 'brothers',
      'helping a friend', 'community', 'neighbour', 'neighbor', 'neighbours',
      'company', 'relationships', 'getting along', 'guest', 'hospitality',
      'fell out with a friend', 'support each other', 'loved ones',
      // Voir la note côté FR : les formulations familiales sont passées au
      // tag `famille`.
    ],
  },
  parents: {
    /*
     * Extrait de `famille`, pour la même raison que `couple`.
     *
     * `famille` couvrait parents, enfants, fratrie et conjoint dans un seul
     * tag de ~100 hadiths triés par numéro : « mes parents vieillissent »
     * tombait sur les premiers hadiths du chapitre du mariage, pendant que
     * « ta mère, ta mère, ta mère, puis ton père » (muslim:6500) attendait en
     * fin de liste. Les formulations parentales sont donc ici, et retirées
     * de `famille`.
     */
    fr: [
      'mes parents', 'parents', 'ma mere', 'maman', 'mon pere', 'papa',
      'mon pere vieillit', 'ma mere vieillit', 'mes parents vieillissent',
      'mes parents sont ages', 'mes parents sont vieux', 'prendre soin de mes parents',
      'je m occupe de mes parents', 'respect des parents', 'obeir a ses parents',
      'honorer ses parents', 'etre bon avec ses parents', 'ma mere est malade',
      'mon pere est malade', 'ma mere me manque', 'mon pere me manque',
      'dispute avec mes parents', 'conflit avec mes parents',
      'je parle plus a mes parents', 'renouer avec mes parents',
      'ma mere est morte', 'mon pere est mort', "j'ai perdu ma mere",
      "j'ai perdu mon pere", 'liens de parente', 'ma famille me rejette',
      'ma famille rompt les liens',
    ],
    en: [
      'my parents', 'parents', 'my mother', 'mum', 'mom', 'my father', 'dad',
      'my father is getting old', 'my mother is getting old',
      'my parents are ageing', 'my parents are aging', 'my parents are old',
      'caring for my parents', 'looking after my parents',
      'honour my parents', 'honor my parents', 'be good to my parents',
      'my mother is ill', 'my father is ill', 'i miss my mother',
      'i miss my father', 'argument with my parents', 'conflict with my parents',
      'my mother died', 'my father died', 'i lost my mother', 'i lost my father',
      'family ties', 'kinship', 'my family cut me off',
    ],
  },
  famille: {
    /*
     * Saisies familiales LARGES : enfants, fratrie, foyer, proches.
     *
     * Les parents ont leur tag (`parents`) et le conjoint aussi (`couple`) —
     * voir les notes de ces deux entrées. Ce qui reste ici, ce sont les
     * saisies qui ne visent ni l'un ni l'autre.
     */
    fr: [
      'famille', 'ma famille', 'me marier', 'le mariage', 'je veux me marier',
      'mes enfants', 'mon fils', 'ma fille', 'mes filles', 'elever mes enfants',
      'etre parent', 'devenir pere', 'devenir mere', 'perdre un enfant',
      'mon frere', 'ma soeur', 'mes freres et soeurs', 'mes proches', 'proches',
      'lien familial', 'brouille familiale',
      'conflit familial', 'conflit avec ma famille', 'ma famille me parle plus',
      'je parle plus a ma famille', 'renouer avec ma famille', 'orphelin',
      'foyer', 'a la maison', 'chez moi',
    ],
    en: [
      'family', 'my family', 'getting married', 'i want to get married',
      'my kids', 'my children', 'my son', 'my daughter', 'my daughters',
      'raising children', 'raising kids', 'being a parent', 'becoming a father',
      'becoming a mother', 'losing a child',
      'my brother', 'my sister', 'my siblings', 'relatives', 'my relatives',
      // « family ties » / « kinship » sont au tag `parents` : ce sont les
      // liens de parenté que les hadiths de Muslim 45 traitent.
      'family feud', 'family conflict',
      'estranged from my family', 'reconnect with my family', 'orphan',
      'home', 'household',
    ],
  },
  couple: {
    /*
     * Extrait de `famille` : ce tag ne répond qu'à la réalité conjugale.
     *
     * `famille` mélangeait parents, enfants, fratrie et couple — 102 hadiths
     * dans lesquels « mon couple va mal » tombait sur des textes qui
     * encouragent à se marier. Les formulations conjugales ont donc été
     * RETIRÉES de `famille` : laissées aux deux tags, le résultat aurait
     * dépendu du seul score de longueur.
     *
     * ⚠️ Les textes unilatéraux, culpabilisants pour l'un des conjoints ou
     * décrivant une violence sont écartés par `COUPLE_EXCLUDE`
     * (`hadithTagsCouple.ts`), pas par ce tag.
     */
    fr: [
      'mon couple', 'mon couple va mal', 'couple', 'vie de couple',
      'problemes de couple', 'probleme de couple', 'crise de couple',
      'ma femme', 'mon mari', 'mon epouse', 'mon epoux', 'mon conjoint',
      'ma conjointe', 'ma femme me mene la vie dure',
      'mon mari me mene la vie dure', 'dispute avec ma femme',
      'dispute avec mon mari', 'je me suis dispute avec ma femme',
      'je me suis disputee avec mon mari', 'on se dispute tout le temps',
      'mon mariage bat de l aile', 'mon mariage va mal',
      'ma vie conjugale', 'conjugal', 'on s entend plus',
      'elle me parle plus', 'il me parle plus', 'on se parle plus',
      'je supporte plus mon mari', 'je supporte plus ma femme',
      'ma femme et moi', 'mon mari et moi', 'divorce', 'on va divorcer',
      'je veux divorcer', 'separation', 'on se separe',
      'me reconcilier avec ma femme', 'me reconcilier avec mon mari',
      'jalousie dans le couple', 'mon mari est jaloux', 'ma femme est jalouse',
      'droits de mon epouse', 'droits de mon mari', 'devoirs envers ma femme',
      "j'ai perdu ma femme", "j'ai perdu mon mari", 'veuf', 'veuve',
      'deuil de mon mari', 'deuil de ma femme',
    ],
    en: [
      'my marriage', 'my marriage is falling apart', 'marriage problems',
      'marriage trouble', 'married life', 'my relationship',
      'my wife', 'my husband', 'my spouse', 'my partner',
      'my wife is giving me a hard time', 'my husband is giving me a hard time',
      'argument with my wife', 'argument with my husband',
      'i argued with my wife', 'i argued with my husband',
      'we fight all the time', 'we keep fighting', 'we argue a lot',
      "we're not talking", 'she stopped talking to me',
      'he stopped talking to me', "i can't stand my husband",
      "i can't stand my wife", 'trouble at home with my wife',
      'divorce', 'getting divorced', 'i want a divorce', 'separation',
      "we're separating", 'make up with my wife', 'make up with my husband',
      'jealous husband', 'jealous wife', 'jealousy in marriage',
      "my wife's rights", "my husband's rights", 'duties to my wife',
      'i lost my wife', 'i lost my husband', 'widow', 'widower',
      'mourning my husband', 'mourning my wife',
    ],
  },
  solitude: {
    fr: [
      'solitude', 'je suis seul', 'je suis seule', 'je me sens seul', 'personne',
      "j'ai personne", 'isole', 'isolement', 'abandonne', 'delaisse', 'exclu',
      'incompris', 'personne me comprend', 'loin des miens', 'expatrie', 'etranger',
      'je me sens de trop',
    ],
    en: [
      'lonely', "i'm lonely", 'loneliness', 'alone', 'i feel alone', 'no one',
      'i have no one', 'isolated', 'isolation', 'abandoned', 'left out', 'excluded',
      'nobody understands me', 'far from home', 'stranger', 'outsider',
    ],
  },
  maladie: {
    fr: [
      'maladie', 'je suis malade', 'malade', 'souffrance', 'je souffre', 'douleur',
      "j'ai mal", 'hopital', 'un proche est malade', 'visiter un malade', 'sante',
      'diagnostic', 'je vais pas bien physiquement', 'fatigue', 'epuise', 'handicap',
      'guerison', 'en convalescence',
    ],
    en: [
      'illness', 'sick', "i'm sick", 'ill', 'disease', 'suffering', "i'm suffering",
      'pain', "i'm in pain", 'hospital', 'someone is ill', 'visit the sick', 'health',
      'diagnosis', 'exhausted', 'unwell', 'healing', 'recovery', 'disability',
    ],
  },
  mort: {
    fr: [
      'mort', 'la mort', 'peur de la mort', 'mourir', 'deces', 'quelqu un est mort',
      "j'ai perdu quelqu'un", 'enterrement', 'funerailles', 'au dela', 'apres la mort',
      'tombe', 'martyr', 'fin de vie', 'esperance de vie', 'mon heure',
    ],
    en: [
      'death', 'dying', 'fear of death', 'i lost someone', 'someone died',
      'passed away', 'funeral', 'afterlife', 'after death', 'grave', 'martyr',
      'end of life', 'my time',
    ],
  },
  argent: {
    fr: [
      'argent', 'richesse', 'riche', 'les riches', 'biens', 'fortune', 'materiel',
      'je pense qu a l argent', 'gagner de l argent', 'salaire', 'depenser',
      'consommation', 'avidite', 'cupidite', 'attachement aux biens', 'heritage',
      'dette', 'dettes', 'je dois de l argent',
    ],
    en: [
      'money', 'wealth', 'rich', 'the rich', 'riches', 'possessions', 'fortune',
      'material', 'materialistic', 'earning money', 'salary', 'spending', 'greed',
      'greedy', 'attached to money', 'inheritance', 'debt', 'i owe money',
    ],
  },
  pauvrete: {
    fr: [
      'pauvrete', 'je suis pauvre', 'pauvre', 'je manque de tout', 'manque',
      "j'ai pas d'argent", 'fin de mois', 'galere', 'je galere', 'precaire',
      'difficulte financiere', 'faim', "j'ai faim", 'besoin', 'necessiteux',
      'je peux pas payer', 'demunis', 'sans rien',
    ],
    en: [
      'poverty', "i'm poor", 'poor', 'broke', "i'm broke", 'no money', 'struggling',
      'struggling financially', 'hard up', 'in need', 'needy', 'hunger', "i'm hungry",
      'hungry', "can't pay", 'destitute', 'making ends meet',
    ],
  },
  generosite: {
    fr: [
      'generosite', 'donner', 'faire un don', 'aumone', 'sadaqa', 'zakat', 'charite',
      'aider les autres', 'aider quelqu un', 'partager', 'etre genereux',
      'rendre service', 'benevolat', 'nourrir quelqu un', 'soulager quelqu un',
      'faire du bien', 'offrir',
    ],
    en: [
      'generosity', 'giving', 'give', 'donate', 'donation', 'charity', 'sadaqa',
      'zakat', 'alms', 'help others', 'help someone', 'share', 'sharing',
      'be generous', 'volunteering', 'feed someone', 'do good', 'kindness',
    ],
  },
  travail: {
    fr: [
      'travail', 'mon boulot', 'boulot', 'job', 'emploi', 'employeur', 'patron',
      'salarie', 'collegue', 'effort', 'je bosse', 'surmene', 'burn out',
      'on me paie pas', 'salaire impaye', 'chomage', 'entretien', 'reussir',
      'carriere', 'je travaille dur',
    ],
    en: [
      'work', 'my job', 'job', 'employment', 'employer', 'boss', 'employee',
      'worker', 'colleague', 'effort', 'hard work', 'working hard', 'overworked',
      'burnout', 'unpaid', "they didn't pay me", 'wages', 'unemployed', 'career',
      'interview',
    ],
  },
  injustice: {
    fr: [
      'injustice', 'on m a fait du tort', 'je suis victime', 'victime',
      'on m a trahi', 'trahison', 'on m a menti', 'on m a vole', 'oppresse',
      'oppression', 'maltraite', 'harcele', 'harcelement', 'discrimination',
      'c est pas juste', 'on m a humilie', 'abuse', 'on profite de moi',
    ],
    en: [
      'injustice', 'i was wronged', 'wronged', "it's not fair", 'unfair', 'victim',
      'betrayed', 'betrayal', 'they lied to me', 'robbed', 'oppressed', 'oppression',
      'mistreated', 'abused', 'harassed', 'harassment', 'discrimination',
      'humiliated', 'taken advantage of',
    ],
  },
  orgueil: {
    fr: [
      'orgueil', 'orgueilleux', 'arrogance', 'arrogant', 'je me crois superieur',
      'hautain', 'mepris', 'je meprise', 'vanite', 'vaniteux', 'pretentieux',
      'frimer', 'me vanter', 'ego', 'trop d ego', 'je regarde les gens de haut',
      'condescendant',
    ],
    en: [
      'pride', 'proud', 'arrogance', 'arrogant', 'i feel superior', 'haughty',
      'contempt', 'i look down on people', 'vanity', 'vain', 'boasting', 'showing off',
      'ego', 'big ego', 'condescending', 'self important',
    ],
  },
  jalousie: {
    fr: [
      'jalousie', 'je suis jaloux', 'jaloux', 'jalouse', 'envie', "j'envie",
      'je suis envieux', 'comparaison', 'je me compare', 'les autres ont mieux',
      'pourquoi pas moi', 'frustration', 'rivalite', 'competition', 'concurrence',
      'reseaux sociaux', 'ca me ronge',
    ],
    en: [
      'jealousy', 'jealous', "i'm jealous", 'envy', 'envious', 'i envy',
      'comparing myself', 'comparison', 'others have more', 'why not me',
      'frustration', 'rivalry', 'competition', 'social media', 'it eats me up',
      'resentful of others',
    ],
  },
  patience: {
    fr: [
      'patience', 'patienter', 'sabr', 'etre patient', 'epreuve', "j'ai pas la patience",
      'je suis a bout', 'difficulte', 'moment difficile', 'ca dure', 'attendre',
      "j'attends depuis longtemps", 'tenir bon', 'endurer', 'perseverer',
      'resilience', 'traverser une epreuve', 'j en peux plus',
      // Détresse vitale — voir la note sur `espoir`.
      'plus envie de vivre', 'envie de mourir', 'en finir', 'a quoi bon',
    ],
    en: [
      'patience', 'be patient', 'sabr', 'patient', 'trial', 'hardship',
      'difficult time', 'going through a lot', "i can't take it anymore",
      'waiting', "i've been waiting", 'endure', 'hold on', 'persevere',
      'resilience', 'tough times', 'struggle',
      // Détresse vitale — voir la note sur `espoir`.
      "i don't want to live", 'i want to die', 'end it all', "what's the point",
    ],
  },
  espoir: {
    /*
     * ⚠️ DÉTRESSE VITALE — « suicide », « plus envie de vivre » et leurs
     * équivalents sont rattachés ici, et surtout PAS au tag `mort`.
     *
     * Le tag `mort` contient qudsi:28, le récit d'un homme qui met fin à ses
     * jours et à qui le Paradis est interdit. Servir ce texte à quelqu'un qui
     * écrit « j'ai plus envie de vivre », ce serait lui renvoyer une
     * condamnation au pire moment. `espoir` sert au contraire les hadiths sur
     * la miséricorde divine — ce que ces personnes doivent lire d'abord.
     *
     * Ces formulations sont également présentes dans `patience` et
     * `confiance` : trois tags de réconfort, aucun de jugement.
     */
    fr: [
      'espoir', "j'espere", 'esperer', 'garder espoir', 'optimisme', 'positif',
      'lueur', 'ca ira mieux', 'avenir', 'demain sera mieux', 'je desespere pas',
      'desespoir', "j'ai perdu espoir", 'retrouver espoir', 'motivation', 'encourage',
      'attendre du bien', 'bonne nouvelle',
      'plus envie de vivre', 'envie de mourir', 'je veux mourir', 'suicide',
      'me suicider', 'en finir', 'a quoi bon', 'la vie vaut elle la peine',
      'pourquoi vivre', 'je sers a rien', 'je vaux rien',
    ],
    en: [
      'hope', 'i hope', 'hopeful', 'keep hoping', 'optimism', 'optimistic',
      'positive', 'it will get better', 'future', 'better days', 'lost hope',
      'hopeless', 'despair', 'find hope again', 'motivation', 'encouragement',
      'good news',
      "i don't want to live", 'i want to die', 'suicide', 'kill myself',
      'end it all', "what's the point", 'is life worth it', 'why live',
      "i'm worthless", 'no reason to live',
    ],
  },
  confiance: {
    fr: [
      'confiance en dieu', 'tawakkul', 'je me remets a dieu', 'lacher prise',
      'destin', 'qadar', 'c etait ecrit', 'accepter le destin', 'ce qui doit arriver',
      'je controle rien', 'je maitrise pas', 'invoquer', 'dou a', 'priere exaucee',
      'demander a dieu', "j'ai besoin d'aide", 'je me sens depasse', 'se confier',
      // Détresse vitale — voir la note sur `espoir`.
      'plus envie de vivre', 'je veux mourir', 'pourquoi vivre', 'je sers a rien',
    ],
    en: [
      'trust in god', 'tawakkul', 'rely on god', 'let go', 'letting go', 'destiny',
      'fate', 'qadar', 'it was written', 'accept fate', 'meant to be',
      "i can't control it", 'out of my control', 'supplication', 'dua', 'prayer answered',
      'ask god', 'i need help', 'overwhelmed', 'surrender',
      // Détresse vitale — voir la note sur `espoir`.
      "i don't want to live", 'i want to die', 'why live', "i'm worthless",
    ],
  },
  matin: {
    fr: [
      'matin', 'ce matin', 'le matin', 'debut de journee', 'commencer la journee',
      'me lever', 'reveil', 'aube', 'fajr', 'bien commencer', 'nouvelle journee',
      'chaque jour', 'routine du matin', 'demarrer',
    ],
    en: [
      'morning', 'this morning', 'in the morning', 'start of the day', 'start my day',
      'waking up', 'wake up', 'dawn', 'fajr', 'new day', 'every day',
      'morning routine', 'get going',
    ],
  },
  nuit: {
    fr: [
      'nuit', 'la nuit', 'le soir', 'avant de dormir', 'dormir', 'sommeil',
      'insomnie', 'je dors pas', "j'arrive pas a dormir", 'je me reveille la nuit',
      'nuit blanche', 'priere de nuit', 'tahajjud', 'dernier tiers de la nuit',
      'seul la nuit', 'ruminer la nuit',
    ],
    en: [
      'night', 'at night', 'evening', 'before sleeping', 'sleep', 'sleeping',
      'insomnia', "i can't sleep", 'i wake up at night', 'sleepless',
      'night prayer', 'tahajjud', 'last third of the night', 'up at night',
      'overthinking at night',
    ],
  },
  intention: {
    fr: [
      'intention', 'niyya', 'sincerite', 'etre sincere', 'pour qui je fais ca',
      'je le fais pour les autres', 'regard des autres', 'paraitre', 'apparence',
      'hypocrisie', 'hypocrite', 'faux semblant', 'ostentation', 'riya',
      'je cherche l approbation', 'authenticite', 'faire pour dieu',
    ],
    en: [
      'intention', 'niyyah', 'sincerity', 'be sincere', 'why am i doing this',
      'doing it for others', 'what people think', 'showing off', 'appearances',
      'hypocrisy', 'hypocrite', 'fake', 'ostentation', 'riya', 'seeking approval',
      'authenticity', 'do it for god',
    ],
  },
  parole: {
    fr: [
      'parole', 'ma langue', 'je parle trop', 'dire du mal', 'medisance', 'ragots',
      'commerage', 'mensonge', 'mentir', "j'ai menti", 'insulte', 'mots blessants',
      "j'ai dit une betise", 'me taire', 'savoir se taire', 'bonne parole',
      'ce que je dis', 'promesse', 'tenir parole',
    ],
    en: [
      'speech', 'my tongue', 'i talk too much', 'gossip', 'backbiting', 'slander',
      'rumours', 'lying', 'i lied', 'lie', 'insult', 'hurtful words',
      'i said something stupid', 'stay silent', 'hold my tongue', 'kind word',
      'what i say', 'promise', 'keep my word',
    ],
  },
  humilite: {
    fr: [
      'humilite', 'etre humble', 'humble', 'modestie', 'modeste', 'rester simple',
      'discret', 'sans me montrer', 'ne pas me mettre en avant', 'simplicite',
      'je suis rien', 'me remettre a ma place', 'accepter ma place', 'pudeur',
      'reconnaitre mes limites',
    ],
    en: [
      'humility', 'be humble', 'humble', 'modesty', 'modest', 'keep it simple',
      'stay low key', 'not show off', 'simplicity', 'unknown', 'know my place',
      'modest life', 'shyness', 'bashfulness', 'admit my limits',
    ],
  },
  justice: {
    fr: [
      'etre juste', 'justice', 'equite', 'traiter les gens equitablement',
      'trancher un litige', 'litige', 'preuve', 'temoignage', 'regler un conflit',
      'arbitrer', 'reconcilier deux personnes', 'droits des autres', 'rendre son du',
      'payer ce que je dois', 'ne pas leser',
    ],
    en: [
      'be fair', 'fairness', 'justice', 'equity', 'treat people fairly',
      'settle a dispute', 'dispute', 'evidence', 'proof', 'testimony',
      'resolve a conflict', 'arbitrate', 'reconcile two people', "others' rights",
      'give people their due', 'pay what i owe',
    ],
  },
  sens: {
    fr: [
      'sens de la vie', 'a quoi ca sert', 'pourquoi je suis la', 'but dans la vie',
      'vie ici bas', 'ce monde', 'passage sur terre', 'ephemere', 'priorites',
      'je me sens vide', 'vide', 'perdu dans ma vie', 'que faire de ma vie',
      'au dela', 'apres', 'bilan', 'ce qui compte vraiment', 'detachement',
    ],
    en: [
      'meaning of life', 'what is the point', 'why am i here', 'purpose',
      'purpose in life', 'this world', 'worldly life', 'temporary', 'priorities',
      'i feel empty', 'empty', 'lost in life', 'what to do with my life',
      'hereafter', 'what really matters', 'detachment', 'big picture',
    ],
  },
};
