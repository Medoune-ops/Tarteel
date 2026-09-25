/**
 * Étiquettes émotionnelles, hadith par hadith.
 *
 * PÉRIMÈTRE : uniquement les deux recueils courts, an-Nawawi (42 hadiths) et
 * al-Qudsi (40 hadiths), soit 82 hadiths. Bukhari et Muslim (14 000+) restent
 * à faire : la clé étant préfixée par le recueil, ils s'ajouteront ici sans
 * rien casser.
 *
 * Clé : `"<recueil>:<numéro>"`, le numéro étant le champ `n` du recueil. Les
 * numéros sont alignés entre les éditions FR et EN, un tag vaut donc pour les
 * deux langues.
 *
 * Chaque hadith a été lu en français avant d'être tagué, et porte plusieurs
 * étiquettes quand il le mérite : le hadith sur la richesse de l'âme parle à
 * la fois d'argent, de gratitude et d'humilité.
 *
 * ⚠️ CONTENU RELIGIEUX — on tague ce dont le texte PARLE, jamais ce qu'il
 * « prescrit » à quelqu'un dans telle situation. Les hadiths purement
 * doctrinaux (piliers de l'islam, unicité divine, innovation en religion) ne
 * sont volontairement pas rattachés à une émotion : les forcer dans « doute »
 * ou « peur » donnerait des résultats trompeurs.
 */
import type { EmotionId } from './hadithEmotions';

export const HADITH_TAGS: Record<string, EmotionId[]> = {
  // — An-Nawawi (42) —

  // Les actions ne valent que par les intentions.
  'nawawi:1': ['intention', 'sens'],
  // Hadith de Jibril : islam, foi, excellence, croyance au destin favorable ou non.
  'nawawi:2': ['confiance', 'doute'],
  // Les cinq piliers — doctrinal, pas d'émotion forcée.
  // Destin écrit dans le ventre de la mère ; nul ne connaît sa fin.
  'nawawi:4': ['confiance', 'espoir', 'doute'],
  // Innovation en religion — doctrinal.
  // Le licite est clair, l'illicite est clair, entre les deux le douteux ; le cœur.
  'nawawi:6': ['doute', 'intention'],
  // « La religion, c'est le conseil sincère » envers Dieu et les gens.
  'nawawi:7': ['intention', 'fraternite', 'parole'],
  // Combattre jusqu'à l'attestation — contexte historique/juridique, non tagué.
  // « Faites ce que je vous ordonne autant que vous le pouvez » : pas d'excès.
  'nawawi:9': ['patience', 'doute'],
  // Le voyageur épuisé dont l'invocation n'est pas exaucée car il vit de l'illicite.
  'nawawi:10': ['confiance', 'argent', 'travail'],
  // « Laisse ce qui te met dans le doute pour ce qui ne te fait pas douter. »
  'nawawi:11': ['doute', 'intention'],
  // « Délaisser ce qui ne te regarde pas » : ne pas se mêler des affaires d'autrui.
  'nawawi:12': ['parole', 'fraternite', 'jalousie'],
  // « Aimer pour son frère ce qu'on aime pour soi-même » — l'antidote à l'envie.
  'nawawi:13': ['fraternite', 'amour', 'jalousie', 'justice'],
  // Les trois cas où le sang est licite — juridique, non tagué.
  // « Qu'il dise du bien ou se taise », générosité envers le voisin et l'invité.
  'nawawi:15': ['parole', 'fraternite', 'generosite'],
  // « Ne te mets pas en colère », répété trois fois.
  'nawawi:16': ['colere', 'patience'],
  // « Allah a prescrit la bienfaisance en toute chose » — y compris envers l'animal.
  'nawawi:17': ['justice', 'travail'],
  // Crains Allah où que tu sois, efface le mal par le bien, bon comportement.
  'nawawi:18': ['repentir', 'espoir', 'fraternite'],
  // « Préserve Allah, Il te préservera » : la victoire avec la patience,
  // la facilité avec la difficulté. Le grand hadith du réconfort.
  'nawawi:19': ['confiance', 'patience', 'espoir', 'peur', 'tristesse'],
  // « Si tu n'as pas de pudeur, fais ce que tu veux. »
  'nawawi:20': ['humilite', 'repentir'],
  // « Dis : je crois en Allah, puis sois droit. »
  'nawawi:21': ['confiance', 'doute'],
  // « J'accomplis le minimum, entrerai-je au Paradis ? — Oui. » Rassurant.
  'nawawi:22': ['espoir', 'doute'],
  // La pureté, la louange qui remplit la balance, la patience illumination,
  // et « chaque personne commence sa journée en marchand de son âme ».
  'nawawi:23': ['gratitude', 'patience', 'matin', 'sens'],
  // « Ô Mes serviteurs, Je Me suis interdit l'injustice… demandez-Moi, Je donne. »
  'nawawi:24': ['injustice', 'pardon', 'confiance', 'pauvrete', 'espoir', 'repentir'],
  // « Les riches ont emporté les récompenses ! » — chaque parole est une aumône.
  'nawawi:25': ['pauvrete', 'argent', 'jalousie', 'generosite', 'espoir'],
  // Chaque articulation doit une aumône chaque jour : réconcilier, aider,
  // une bonne parole, ôter un obstacle de la route.
  'nawawi:26': ['generosite', 'matin', 'justice', 'parole', 'fraternite'],
  // « Consulte ton cœur » : la droiture apaise l'âme, le péché la trouble.
  'nawawi:27': ['doute', 'repentir', 'intention'],
  // Le sermon d'adieu qui fit couler les larmes ; s'accrocher à la Sounnah.
  'nawawi:28': ['tristesse', 'doute'],
  // Les portes du bien : le jeûne bouclier, l'aumône qui éteint les péchés,
  // la prière au milieu de la nuit, et « retiens ta langue ».
  'nawawi:29': ['parole', 'nuit', 'generosite', 'espoir', 'repentir'],
  // « Il s'est tu sur certaines choses par miséricorde, ne les cherchez pas. »
  'nawawi:30': ['doute'],
  // « Détache-toi du monde, Allah t'aimera ; détache-toi de ce que possèdent
  // les gens, les gens t'aimeront. » — la réponse directe à l'envie.
  'nawawi:31': ['amour', 'jalousie', 'argent', 'sens', 'humilite'],
  // « Ni préjudice, ni riposte au préjudice. »
  'nawawi:32': ['injustice', 'justice', 'colere'],
  // La preuve au demandeur, le serment à celui qui nie : régler un litige.
  'nawawi:33': ['justice', 'injustice', 'argent'],
  // « Qui voit un mal, qu'il le corrige de sa main, sinon sa parole, sinon son cœur. »
  'nawawi:34': ['injustice', 'justice', 'parole'],
  // « Ne vous enviez pas, ne vous détestez pas… soyez des frères. »
  'nawawi:35': ['jalousie', 'fraternite', 'colere', 'orgueil', 'injustice'],
  // « Qui soulage une peine ici-bas, Allah lui en soulagera une au Jour dernier » ;
  // qui couvre un musulman, qui aide son frère, la tranquillité qui descend.
  'nawawi:36': ['generosite', 'fraternite', 'tristesse', 'pardon', 'espoir', 'pauvrete'],
  // La bonne intention non réalisée compte quand même comme une bonne action.
  'nawawi:37': ['intention', 'espoir', 'repentir'],
  // « Je deviens l'ouïe par laquelle il entend… s'il cherche refuge, Je le protège. »
  'nawawi:38': ['amour', 'confiance', 'peur', 'solitude'],
  // « Allah a excusé l'erreur, l'oubli et la contrainte. »
  'nawawi:39': ['pardon', 'repentir', 'espoir'],
  // « Sois dans ce monde comme un étranger ou un voyageur » ; profite de ta
  // santé avant la maladie et de ta vie avant la mort.
  // (« Quand tu es le soir, n'attends pas le matin » : d'où matin et nuit.)
  'nawawi:40': ['sens', 'mort', 'maladie', 'solitude', 'gratitude', 'matin', 'nuit'],
  // Conformer ses désirs à la révélation — doctrinal.
  // « Tant que tu M'invoques et espères en Moi, Je te pardonne. »
  'nawawi:42': ['pardon', 'repentir', 'espoir', 'confiance'],

  // — Al-Qudsi (40) —

  // « Ma miséricorde l'emporte sur Ma colère. »
  'qudsi:1': ['espoir', 'pardon', 'peur'],
  // Le démenti de la résurrection et l'attribution d'un fils — doctrinal.
  // La pluie attribuée à Allah ou aux étoiles : à qui on attribue ce qu'on reçoit.
  'qudsi:3': ['gratitude', 'matin'],
  // « Les fils d'Adam critiquent le temps, or c'est Moi le Temps. »
  'qudsi:4': ['confiance', 'colere', 'patience'],
  // « Celui qui agit pour Moi et pour un autre, Je renonce à cette action. »
  'qudsi:5': ['intention'],
  // Les trois premiers jugés : le martyr, le savant et le riche généreux —
  // tous trois l'ont fait pour la réputation.
  'qudsi:6': ['intention', 'orgueil', 'generosite', 'argent'],
  // Le berger seul au sommet d'une montagne qui appelle à la prière.
  'qudsi:7': ['solitude', 'humilite', 'espoir'],
  // Al-Fatiha partagée entre Allah et Son serviteur ; « il aura ce qu'il demande ».
  'qudsi:8': ['confiance', 'espoir'],
  // Le premier acte jugé sera la prière ; les surérogatoires comblent les manques.
  'qudsi:9': ['espoir', 'repentir'],
  // « Le jeûne est à Moi » : deux joies pour le jeûneur, un bouclier.
  'qudsi:10': ['patience', 'espoir'],
  // « Dépense, ô fils d'Adam, et Je dépenserai pour toi. »
  'qudsi:11': ['generosite', 'argent', 'confiance', 'pauvrete'],
  // L'homme qui n'avait rien d'autre que d'accorder des délais à ses débiteurs.
  'qudsi:12': ['pardon', 'argent', 'travail', 'pauvrete', 'generosite'],
  // Les deux plaignants : la pauvreté et le banditisme ; « protégez-vous du
  // Feu ne serait-ce qu'avec une demi-datte, sinon par une bonne parole ».
  'qudsi:13': ['pauvrete', 'generosite', 'peur', 'espoir', 'parole'],
  // Les anges des assemblées de rappel : même celui qui n'a fait que passer
  // est pardonné. « Celui qui s'assied avec eux ne sera pas malheureux. »
  'qudsi:14': ['fraternite', 'pardon', 'solitude', 'espoir', 'peur'],
  // « Je suis tel que Mon serviteur pense de Moi… s'il vient en marchant,
  // Je viens en courant. »
  'qudsi:15': ['confiance', 'espoir', 'amour', 'solitude'],
  // Comme nawawi:37 — la bonne intention compte même non réalisée.
  'qudsi:16': ['intention', 'espoir', 'repentir'],
  // Comme nawawi:24 — l'injustice interdite, la demande toujours entendue.
  'qudsi:17': ['injustice', 'pardon', 'confiance', 'pauvrete', 'espoir', 'repentir'],
  // « J'étais malade et tu ne M'as pas rendu visite… J'avais faim et tu ne
  // M'as pas nourri. »
  'qudsi:18': ['maladie', 'generosite', 'pauvrete', 'fraternite', 'solitude'],
  // « L'orgueil est Mon manteau et la grandeur Mon habit. »
  'qudsi:19': ['orgueil', 'humilite'],
  // Les portes du Paradis ouvertes lundi et jeudi, sauf pour qui garde rancune
  // envers son frère : « différez-les jusqu'à ce qu'ils se réconcilient ».
  'qudsi:20': ['pardon', 'colere', 'fraternite'],
  // Les trois adversaires : le parjure, le marchand d'hommes libres, et celui
  // qui n'a pas versé son salaire au travailleur.
  'qudsi:21': ['injustice', 'travail', 'justice', 'argent'],
  // « Qu'aucun de vous ne se sous-estime » : se taire par crainte des gens.
  'qudsi:22': ['peur', 'parole', 'injustice', 'humilite'],
  // « Où sont ceux qui se sont aimés en Ma majesté ? » — l'ombre du Jour dernier.
  'qudsi:23': ['amour', 'fraternite', 'espoir'],
  // Quand Allah aime un serviteur, Il le fait aimer des habitants du ciel puis
  // de la terre ; l'inverse pour celui qu'Il déteste.
  'qudsi:24': ['amour', 'fraternite', 'solitude'],
  // Comme nawawi:38, avec en plus : « Je n'hésite sur rien autant qu'à prendre
  // l'âme de Mon serviteur croyant : il déteste la mort et Je déteste lui nuire. »
  'qudsi:25': ['amour', 'confiance', 'mort', 'peur', 'solitude'],
  // Le serviteur aimé : modeste, discret, dont la subsistance suffit à peine
  // et qui l'endure ; peu de biens et peu de pleureurs à sa mort.
  'qudsi:26': ['humilite', 'pauvrete', 'patience', 'solitude', 'mort'],
  // Les âmes des tués dans le sentier d'Allah, vivantes auprès de leur Seigneur.
  'qudsi:27': ['mort', 'espoir'],
  // L'homme blessé qui, ne supportant plus la douleur, a mis fin à ses jours.
  // Tagué avec retenue : c'est le hadith le plus grave du corpus.
  'qudsi:28': ['maladie', 'mort', 'patience'],
  // « Si J'ai pris la personne qu'il aimait le plus et qu'il a patienté,
  // sa récompense n'est rien d'autre que le Paradis. » Le hadith du deuil.
  'qudsi:29': ['tristesse', 'mort', 'patience', 'amour', 'fraternite', 'espoir'],
  // « Si Mon serviteur aime Me rencontrer, J'aime le rencontrer » ; la
  // détestation de la mort n'est pas en cause, mais ce qu'on attend après.
  'qudsi:30': ['mort', 'peur', 'espoir', 'amour'],
  // L'homme qui jura qu'Allah ne pardonnerait pas à untel, et vit ses propres
  // œuvres annulées.
  'qudsi:31': ['pardon', 'orgueil', 'espoir'],
  // L'homme qui demanda à être brûlé et dispersé par crainte du châtiment,
  // et à qui il fut pardonné à cause de cette crainte même.
  'qudsi:32': ['peur', 'pardon', 'repentir', 'espoir', 'mort'],
  // Le serviteur qui pèche, demande pardon, recommence, redemande — trois
  // fois : « Fais ce que tu veux, Je t'ai pardonné. »
  'qudsi:33': ['repentir', 'pardon', 'espoir', 'doute'],
  // Comme nawawi:42 — « si tes péchés atteignaient les nuages du ciel ».
  'qudsi:34': ['pardon', 'repentir', 'espoir', 'confiance'],
  // La descente au dernier tiers de la nuit : « Qui M'invoque pour que Je lui
  // réponde ? » Le hadith de l'insomnie et de la prière de nuit.
  'qudsi:35': ['nuit', 'confiance', 'espoir', 'solitude', 'pardon'],
  // L'intercession au Jour dernier, jusqu'à ce que sorte de l'Enfer quiconque
  // a un atome de foi.
  'qudsi:36': ['espoir', 'peur', 'doute'],
  // « Ce qu'aucun œil n'a vu, aucune oreille entendu, nul cœur imaginé. »
  'qudsi:37': ['espoir', 'sens'],
  // Le Paradis entouré de difficultés, l'Enfer entouré de passions.
  'qudsi:38': ['patience', 'sens', 'espoir'],
  // La dispute du Paradis et de l'Enfer : « chez moi les puissants et les
  // orgueilleux » / « chez moi les faibles et les pauvres ».
  'qudsi:39': ['pauvrete', 'orgueil', 'humilite', 'espoir'],
  // « Êtes-vous satisfaits ? — Je répands Mon agrément sur vous et Je ne serai
  // jamais fâché contre vous. »
  'qudsi:40': ['espoir', 'gratitude', 'amour'],
};
