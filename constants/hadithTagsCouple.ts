/**
 * Extraction d'un tag `couple` hors du tag `famille`.
 *
 * POURQUOI. Le tag `famille` (102 hadiths) mélange quatre relations qui n'ont
 * rien à voir entre elles : les parents, les enfants, la fratrie et le couple.
 * Comme `hadithsForQuery` ne sert QUE les hadiths du premier ressenti reconnu
 * (voir la note de `lib/hadithSearch.ts`), quelqu'un qui écrit « mon couple va
 * mal » reçoit aujourd'hui l'ensemble du sac : des encouragements à se marier,
 * des barèmes de dot, et jusqu'à des textes sur la mort d'un enfant. C'est
 * l'échec produit que ce tag corrige.
 *
 * CE QUI ENTRE DANS `couple`. Seuls les textes qui répondent à une difficulté
 * ou à une réalité conjugale vécue : patience dans le couple, douceur envers
 * l'épouse ou l'époux, réconciliation, droits mutuels, affection, jalousie,
 * deuil du conjoint, secret du couple. Les hadiths qui parlent du mariage sans
 * répondre à une difficulté (encouragement à se marier, choix du conjoint,
 * dot, repas de noces, récits biographiques) restent sur `famille` seul : ils
 * ne sont pas mauvais, ils sont simplement hors sujet quand ça va mal.
 *
 * ⚠️ CONTENU RELIGIEUX — on ne juge pas les textes sur le fond. On décide
 * seulement lesquels peuvent être servis AUTOMATIQUEMENT, sans accompagnement
 * humain, à quelqu'un qui vient de se disputer avec son conjoint. Critère
 * retenu : le texte aide-t-il aussi bien la femme que l'homme, ou en accuse-t-il
 * un ? En cas de doute, on écarte.
 */
import type { EmotionId } from './hadithEmotions';

/**
 * Hadiths à taguer `couple`, EN PLUS de leurs tags actuels.
 *
 * On n'enlève rien : `famille` reste juste sur ces textes (un couple est une
 * famille). On ajoute une porte d'entrée plus fine.
 */
export const COUPLE_TAGS: string[] = [
  // « Bien traiter les femmes » — la version complète du hadith de la côte,
  // qui s'ouvre ET se ferme sur la recommandation de douceur. C'est le texte
  // central du tag : il s'adresse à celui qui s'agace de son épouse.
  'bukhari:5185',
  'bukhari:5186',
  // « Ton corps a des droits sur toi, tes yeux ont des droits sur toi, et ta
  // femme a des droits sur toi. » Le conjoint négligé au profit de la dévotion.
  'bukhari:5199',
  // Le retrait du Prophète pendant un mois, les épouses en pleurs, la question
  // « as-tu divorcé ? » — la crise conjugale traversée puis dépassée.
  'bukhari:5203',
  // Aïsha et Hafsa échangent leurs montures ; Aïsha, peinée de l'absence,
  // dit ne rien pouvoir reprocher au Prophète. La jalousie conjugale nommée.
  'bukhari:5211',
  // La maladie mortelle : « où serai-je demain ? », et sa mort chez Aïsha.
  // Le deuil du conjoint, et l'attachement jusqu'au bout.
  'bukhari:5217',
  // Le plat cassé par jalousie : le Prophète ramasse, répare, et dit
  // seulement « votre mère a été jalouse ». La désescalade d'une scène.
  'bukhari:5225',
  // « Je n'ai jamais été aussi jalouse que de Khadija » — la jalousie du
  // conjoint envers un amour passé, dite sans être condamnée.
  'bukhari:5229',
  // « Je ne reproche rien à Thabit, mais je ne peux pas vivre avec lui. »
  // La séparation demandée sans accusation : elle légitime l'impasse.
  'bukhari:5275',
  // Mughith pleurant derrière Barira, le Prophète intercédant sans ordonner.
  // Le chagrin d'un conjoint quitté, et le refus de forcer l'autre.
  'bukhari:5283',
  // Ma'qil empêche sa sœur de reprendre son ex-mari par orgueil, puis cède.
  // La réconciliation d'un couple contre l'orgueil de l'entourage.
  'bukhari:5331',
  // Le deuil du mari, quatre mois et dix jours — la seule perte pour laquelle
  // le deuil long est prescrit. Sert la veuve.
  'bukhari:5335',
  'bukhari:5339',
  // Asma' et Zubair : les années de pauvreté partagées, la pudeur de l'un,
  // la fatigue de l'autre, le soulagement quand ça s'allège. La vie conjugale
  // ordinaire et difficile, sans reproche adressé à personne.
  'bukhari:5224',
  'muslim:5692',
  // « La personne la plus mauvaise le Jour du Jugement est celui qui révèle
  // les secrets de son couple. » Vise l'intimité trahie, dans les deux sens.
  'muslim:3542',
  'muslim:3543',
  // Le talbina servi à la famille en deuil, « il apaise le cœur affligé ».
  // Aïsha le prépare pour les siens ; sert aussi le conjoint endeuillé.
  'muslim:5769',
];

/**
 * Hadiths à retirer entièrement des résultats (y compris de `famille`).
 *
 * Même logique que `SENSITIVE_C` de `hadithTagsC.ts` : ces textes ne sont pas
 * contestés, ils sont simplement inservables sans accompagnement à quelqu'un
 * dont le couple va mal. Chacun est soit unilatéral (il donne tort à un seul
 * des deux conjoints), soit il décrit une violence conjugale, soit il demande
 * à l'un de renoncer à ses droits.
 */
export const COUPLE_EXCLUDE: string[] = [
  // « La femme ressemble à une côte ; si tu essaies de la redresser, elle se
  // cassera. » Version courte, sans la recommandation de douceur qui encadre
  // 5185/5186. Servie à une femme en conflit, elle la décrit comme tordue.
  'bukhari:5184',
  // « Aucun de vous ne doit frapper sa femme comme il frappe un esclave, puis
  // avoir des relations avec elle. » Le texte limite un geste ; remonté sur
  // « mon couple va mal », il installe la violence comme cadre de la réponse.
  'bukhari:5204',
  // La femme qui renonce à sa pension et à ses nuits pour ne pas être
  // divorcée. Servi à quelqu'un en conflit, cela revient à conseiller
  // l'effacement de soi.
  'bukhari:5206',
  // « Celle qui fait semblant d'avoir reçu ce qui ne lui a pas été donné est
  // comme celle qui porte deux vêtements de mensonge. » Réprimande adressée à
  // une seule épouse, dans un contexte de rivalité entre co-épouses.
  'bukhari:5219',
  // « Il n'est pas permis à une femme de demander le divorce de sa sœur pour
  // tout avoir pour elle seule. » Unilatéral, et sans rapport avec une
  // difficulté de couple vécue au quotidien.
  'bukhari:5152',
  // Le jeune marié qui se précipite sur sa femme avec sa lance par jalousie.
  // Le récit porte sur les serpents de Médine, mais l'image qui reste est
  // celle d'un mari armé devant son épouse.
  'muslim:5839',
  // « Une femme est la gardienne de la maison de son mari. » Texte de
  // répartition des rôles, pas de réconfort : en pleine dispute, il tranche
  // en faveur d'un seul camp.
  'bukhari:5188',
];

/**
 * Garde de type : les identifiants ci-dessus sont des clés de `HADITH_TAGS`,
 * pas des `EmotionId`. Cette annotation ne sert qu'à documenter le tag visé.
 */
export const COUPLE_EMOTION: EmotionId = 'couple';
