/**
 * Étiquetage émotionnel du lot B — famille, mariage, liens.
 *
 * PÉRIMÈTRE : bukhari ch.67 (Le mariage, 5063–5250), bukhari ch.68 (Le divorce,
 * 5251–5350), muslim ch.16 (Le mariage, 3398–3567), muslim ch.45 (Vertu, bonnes
 * manières et liens de parenté, 6500–6722) et muslim ch.39 (Les salutations,
 * 5646–5861). Aucun autre chapitre n'est touché ici.
 *
 * Les 875 hadiths du lot ont été lus en français. La très grande majorité n'est
 * PAS étiquetée, volontairement : le contenu juridique pur (montant de la dot,
 * degrés de parenté interdits, procédure du lian, mariage temporaire, comptage
 * de la ‘idda, validité du contrat, règles d'héritage) ne répond à aucun
 * ressenti. Le tagger un mènerait quelqu'un qui écrit « ma mère vieillit » vers
 * un barème de dot. Les chaînes de transmission seules (« hadith similaire
 * rapporté par une autre chaîne ») ne sont pas taguées non plus : elles ne
 * portent pas de texte.
 *
 * ⚠️ Le tag 'famille' est PROPOSÉ ici mais n'existe pas encore dans
 * `hadithEmotions.ts` : `tsc` le signalera tant qu'il n'y est pas ajouté. Voir
 * le rapport joint pour les blocs EMOTIONS et SYNONYMS correspondants.
 *
 * ⚠️ CONTENU RELIGIEUX — on tague ce dont le texte PARLE, jamais ce qu'il
 * « prescrit » à quelqu'un dans telle situation. Sur le divorce et la
 * polygamie, seule la charge humaine du récit est retenue (tristesse, patience,
 * jalousie, réconciliation), jamais une lecture orientée dans un sens ou
 * l'autre.
 */
import type { EmotionId } from './hadithEmotions';

export const HADITH_TAGS_B: Record<string, EmotionId[]> = {
  // — Bukhari 67 : Le mariage —

  // Les trois hommes qui voulaient prier toute la nuit, jeûner toujours et ne
  // jamais se marier : « je dors, je romps mon jeûne et je me marie aussi. »
  'bukhari:5063': ['famille', 'sens', 'patience'],
  // « Ô jeunes gens, que celui qui en a les moyens se marie » — et que celui
  // qui ne le peut pas jeûne. La question, très concrète, du célibat subi.
  'bukhari:5066': ['famille', 'patience', 'doute'],
  // L'émigration vaut par l'intention : pour Allah, ou pour épouser une femme.
  'bukhari:5070': ['intention', 'famille'],
  // Sa`d offre à `Abdur-Rahman la moitié de ses biens ; celui-ci demande
  // seulement le chemin du marché, se marie, et le Prophète dit : fais un repas.
  'bukhari:5072': ['fraternite', 'generosite', 'travail', 'famille', 'humilite'],
  // « J'ai peur de commettre l'interdit et je n'ai pas les moyens de me marier. »
  // « La plume a séché sur ce que tu vas affronter. »
  'bukhari:5076': ['peur', 'confiance', 'patience', 'famille'],
  // L'homme sans rien, pas même une bague en fer, marié pour ce qu'il connaît
  // du Coran. Le hadith de celui qui n'a pas les moyens de fonder un foyer.
  'bukhari:5087': ['pauvrete', 'famille', 'espoir', 'generosite'],
  // « On épouse une femme pour quatre raisons… choisis la pieuse. »
  'bukhari:5090': ['famille', 'doute', 'intention'],
  // L'homme pauvre vaut mieux qu'une terre pleine d'hommes comme le premier —
  // le mépris social à l'égard d'un prétendant sans fortune.
  'bukhari:5091': ['pauvrete', 'humilite', 'injustice', 'famille'],
  // La fille de Khidam mariée sans son accord : le Prophète annule le mariage.
  'bukhari:5138': ['injustice', 'famille', 'justice'],
  // « Méfiez-vous des soupçons… soyez frères » ; et ne pas demander la main
  // d'une fiancée de son frère.
  'bukhari:5143': ['fraternite', 'justice', 'parole', 'jalousie'],
  // Idem.
  'bukhari:5144': ['fraternite', 'justice', 'parole', 'jalousie'],
  // Les petites filles qui chantent en mémoire du père tué à Badr, le soir des
  // noces ; le Prophète les laisse chanter.
  'bukhari:5147': ['famille', 'tristesse', 'amour'],
  // La joie du mariage lue sur le visage de `Abdur-Rahman.
  'bukhari:5148': ['famille', 'espoir'],
  // « Épouse, même avec une bague en fer comme dot. »
  'bukhari:5150': ['pauvrete', 'famille', 'espoir'],
  // « Qu'aucune femme ne demande le divorce de sa sœur (coépouse) pour tout
  // avoir : elle n'aura que ce qui lui est destiné. » La jalousie et le qadar.
  'bukhari:5152': ['jalousie', 'confiance', 'famille'],
  // Les femmes des Ansar accueillent `Aisha : « que tu sois heureuse, bénie ».
  'bukhari:5156': ['famille', 'amour', 'espoir'],
  // La mère d'Anas qui prépare un plat pour les noces, et le repas partagé par
  // groupes de dix ; la maison pleine.
  'bukhari:5163': ['famille', 'generosite', 'fraternite'],
  // Le repas de noces : « même avec un seul mouton. »
  'bukhari:5167': ['famille', 'generosite', 'fraternite'],
  // Répondre à l'invitation d'un mariage.
  'bukhari:5173': ['fraternite', 'famille'],
  // Libérer les captifs, accepter l'invitation, visiter les malades.
  'bukhari:5174': ['fraternite', 'generosite', 'maladie'],
  // Les sept choses ordonnées : visiter les malades, suivre les funérailles,
  // soutenir les opprimés, saluer, accepter l'invitation.
  'bukhari:5175': ['fraternite', 'maladie', 'mort', 'injustice', 'generosite'],
  // « Le pire repas est celui où seuls les riches sont invités. »
  'bukhari:5177': ['pauvrete', 'injustice', 'generosite', 'orgueil'],
  // Le Prophète voit des femmes et des enfants revenant d'un mariage : « vous
  // êtes les gens que j'aime le plus ».
  'bukhari:5180': ['amour', 'famille', 'fraternite'],
  // « La femme est comme une côte ; si tu veux la redresser, elle se casse. »
  // Lu ici comme un appel à la patience dans le couple, pas à la résignation.
  'bukhari:5184': ['famille', 'patience', 'colere'],
  // Ne pas nuire à son voisin, et « je vous recommande de bien traiter les
  // femmes » — répété deux fois dans le même hadith.
  'bukhari:5185': ['famille', 'patience', 'fraternite', 'justice'],
  // Idem.
  'bukhari:5186': ['famille', 'patience', 'fraternite', 'justice'],
  // « Chacun de vous est un gardien » : l'homme de sa famille, la femme du
  // foyer. Le hadith de la responsabilité domestique.
  'bukhari:5188': ['famille', 'travail', 'justice'],
  // Les onze femmes qui décrivent leurs maris, et Abu Zar` ; « je suis pour toi
  // comme Abu Zar` l'était pour Oum Zar ». Un des rares textes sur ce que les
  // épouses ressentent de leur vie conjugale, dans toute son ambivalence.
  'bukhari:5189': ['famille', 'amour', 'tristesse', 'parole'],
  // La longue crise conjugale du Prophète : Hafsa en pleurs, `Umar terrifié,
  // la rumeur du divorce, les vingt-neuf jours de retrait, puis le retour.
  'bukhari:5191': ['famille', 'tristesse', 'colere', 'jalousie', 'peur', 'patience'],
  // « Ton corps a des droits sur toi, tes yeux ont des droits, ta femme a des
  // droits sur toi. » Le hadith de l'équilibre entre dévotion et vie de famille.
  'bukhari:5199': ['famille', 'patience', 'travail', 'sens'],
  // Comme 5188 : chacun est un gardien, la femme de la maison et des enfants.
  'bukhari:5200': ['famille', 'travail', 'justice'],
  // Les épouses en pleurs au matin, chacune chez sa famille, pendant le retrait.
  'bukhari:5203': ['famille', 'tristesse', 'peur'],
  // « Aucun de vous ne doit frapper sa femme comme il frappe un esclave. »
  'bukhari:5204': ['famille', 'colere', 'injustice', 'justice'],
  // La femme qui craint l'abandon de son mari et propose un arrangement pour
  // ne pas être répudiée : « un accord à l'amiable est meilleur ».
  'bukhari:5206': ['famille', 'tristesse', 'peur', 'patience', 'pardon'],
  // `Aisha peinée de l'absence du Prophète, au point d'appeler un scorpion sur
  // elle ; « je ne peux rien reprocher au Prophète ».
  'bukhari:5211': ['jalousie', 'tristesse', 'amour', 'famille'],
  // Sauda cède son tour à `Aisha.
  'bukhari:5212': ['generosite', 'famille', 'amour'],
  // La maladie mortelle : « Où serai-je demain ? » ; il meurt chez `Aisha, la
  // tête contre elle. Le hadith le plus intime du corpus conjugal.
  'bukhari:5217': ['famille', 'amour', 'mort', 'tristesse'],
  // `Umar met en garde sa fille Hafsa contre la jalousie envers `Aisha.
  'bukhari:5218': ['jalousie', 'famille', 'amour'],
  // « Mon mari a une autre épouse : puis-je prétendre qu'il m'a donné ce qu'il
  // ne m'a pas donné ? » — « celle qui fait semblant porte deux vêtements de
  // mensonge ». La jalousie entre coépouses et le mensonge qu'elle inspire.
  'bukhari:5219': ['jalousie', 'parole', 'famille'],
  // Asma' qui puise l'eau, pétrit, porte les noyaux sur sa tête ; la pudeur de
  // Zubair ; le soulagement quand une servante arrive. Le poids du foyer.
  'bukhari:5224': ['famille', 'travail', 'patience', 'pauvrete', 'humilite'],
  // Le plat cassé par jalousie : « ta mère a été jalouse », et le Prophète
  // répare sans humilier.
  'bukhari:5225': ['jalousie', 'famille', 'colere', 'pardon'],
  // `Aisha : « je n'ai jamais été aussi jalouse que de Khadija », tant il la
  // mentionnait — la jalousie envers une morte.
  'bukhari:5229': ['jalousie', 'amour', 'tristesse', 'famille'],
  // « Fatima fait partie de moi : ce qui lui fait du mal me fait du mal. »
  // Le hadith du père et de sa fille.
  'bukhari:5230': ['famille', 'amour', 'tristesse'],
  // Rentrer chez soi après une longue absence : ne pas arriver de nuit.
  'bukhari:5244': ['famille', 'fraternite'],
  // Jabir pressé de rentrer, « je viens de me marier » ; « cherchez à avoir des
  // enfants ».
  'bukhari:5246': ['famille', 'amour', 'espoir'],
  // Fatima lavant le sang du visage de son père à Uhud, `Ali portant l'eau.
  'bukhari:5248': ['famille', 'amour', 'maladie', 'tristesse'],

  // — Bukhari 68 : Le divorce —
  // (Presque entièrement procédural : lian, ‘idda, nombre de répudiations,
  // récupération de la dot. Seuls les textes à charge humaine sont retenus.)

  // La femme de Thabit : « je ne lui reproche rien, mais je ne peux pas vivre
  // avec lui ». Le texte du couple qui se défait sans faute.
  'bukhari:5275': ['famille', 'tristesse', 'doute', 'patience'],
  // Mughith suivant Barira dans les rues de Médine, les larmes sur sa barbe ;
  // « n'es-tu pas étonné de son amour et du rejet de Barira ? » — « Je
  // n'ordonne pas, j'intercède seulement. » L'amour non partagé.
  'bukhari:5283': ['amour', 'tristesse', 'famille', 'solitude'],
  // « Moi et celui qui prend soin d'un orphelin, ainsi au Paradis. »
  'bukhari:5304': ['famille', 'generosite', 'amour', 'espoir'],
  // Ma'qil refuse par orgueil de remarier sa sœur à son ex-mari ; le verset
  // descend, il abandonne sa fierté et accepte. La réconciliation arrachée à
  // l'amour-propre.
  'bukhari:5331': ['famille', 'orgueil', 'pardon', 'colere'],
  // Um Habiba se parfume à la mort de son père : le deuil n'excède pas trois
  // jours, sauf pour un mari.
  'bukhari:5334': ['tristesse', 'mort', 'famille', 'patience'],
  // Zainab bint Jahsh à la mort de son frère — même enseignement.
  'bukhari:5335': ['tristesse', 'mort', 'famille', 'patience'],
  // La femme dont le mari est mort et qui souffre des yeux ; « ce n'est que
  // quatre mois et dix jours », et le rappel de ce qu'on infligeait aux veuves
  // avant l'islam.
  'bukhari:5336': ['tristesse', 'mort', 'famille', 'patience'],
  // Le deuil du mari : quatre mois et dix jours.
  'bukhari:5339': ['tristesse', 'mort', 'famille', 'patience'],

  // — Muslim 16 : Le mariage —

  // « Ô jeunes gens, que celui qui en a les moyens se marie ; celui qui ne le
  // peut pas, qu'il jeûne. »
  'muslim:3400': ['famille', 'patience', 'doute'],
  // Les compagnons qui voulaient renoncer au mariage, à la viande, au lit :
  // « qui se détourne de ma tradition n'a rien à voir avec moi ».
  'muslim:3403': ['famille', 'sens', 'patience'],
  // Le mariage de `Aisha vu par elle : sa mère l'arrache à la balançoire, les
  // femmes des Ansar la bénissent, « rien ne m'a effrayée ».
  'muslim:3479': ['famille', 'amour'],
  // « Aucune des épouses ne m'était plus chère. »
  'muslim:3483': ['amour', 'famille'],
  // « Qu'Allah te bénisse ! Organise un repas de mariage, même avec un mouton. »
  'muslim:3490': ['famille', 'generosite', 'espoir'],
  // La joie du mariage sur le visage de `Abd al-Rahman.
  'muslim:3494': ['famille', 'espoir'],
  // Les noces de Zaynab : le Prophète fait le tour des appartements de ses
  // épouses en les saluant, « comment allez-vous, gens de la maison ? ».
  'muslim:3502': ['famille', 'fraternite', 'generosite'],
  // Zaynab à qui l'on transmet la demande : « je ne fais rien sans consulter
  // mon Seigneur », et elle se lève pour prier.
  'muslim:3503': ['famille', 'confiance', 'doute', 'intention'],
  // Répondre à l'invitation d'un repas de noces.
  'muslim:3511': ['fraternite', 'famille'],
  // Accepter l'invitation même en jeûnant ; invoquer pour les hôtes.
  'muslim:3520': ['fraternite', 'generosite'],
  // « Le pire repas est celui où l'on invite les riches et pas les pauvres. »
  'muslim:3521': ['pauvrete', 'injustice', 'generosite', 'orgueil'],
  // Invoquer avant d'aller vers son épouse : protection pour l'enfant à naître.
  'muslim:3533': ['famille', 'confiance', 'espoir'],
  // « Le pire des gens est celui qui va vers sa femme, puis révèle ses
  // secrets. » La confidentialité du couple.
  'muslim:3542': ['famille', 'parole', 'injustice'],
  // Idem, formulé comme une trahison de la confiance.
  'muslim:3543': ['famille', 'parole', 'injustice'],
  // « Ce qui est décrété pour elle lui arrivera » — l'enfant qu'on ne voulait
  // pas, et le destin.
  'muslim:3556': ['confiance', 'famille', 'doute'],
  // « Je crains un mal pour son enfant. » — La peur pour ses enfants.
  'muslim:3567': ['famille', 'peur', 'confiance'],

  // — Muslim 45 : Vertu, bonnes manières et liens de parenté —

  // « Qui mérite le plus ma bonne conduite ? — Ta mère. Ta mère. Ta mère. Puis
  // ton père. » Le hadith central du lot.
  'muslim:6500': ['famille', 'amour', 'generosite'],
  // Idem, avec « puis les plus proches parents selon leur degré ».
  'muslim:6501': ['famille', 'amour', 'generosite'],
  // « Tes parents sont-ils vivants ? Alors efforce-toi de bien t'occuper
  // d'eux. » Le jihad renvoyé au chevet des parents.
  'muslim:6504': ['famille', 'amour', 'sens', 'patience'],
  // « Retourne auprès de tes parents et traite-les avec bonté. »
  'muslim:6507': ['famille', 'amour', 'sens', 'patience'],
  // Juraij qui choisit sa prière contre l'appel de sa mère, et l'invocation de
  // celle-ci. Le conflit entre dévotion et devoir filial.
  'muslim:6508': ['famille', 'repentir', 'doute', 'injustice'],
  // Même récit, augmenté du nourrisson qui parle ; l'enfant qu'on accuse à
  // tort et qui dit « Allah me suffit ».
  'muslim:6509': ['famille', 'injustice', 'confiance', 'repentir'],
  // « Qu'il soit humilié : celui qui voit ses parents atteindre la vieillesse
  // et n'entre pas au Paradis. » Le hadith des parents qui vieillissent.
  'muslim:6510': ['famille', 'amour', 'patience', 'repentir'],
  // Idem.
  'muslim:6511': ['famille', 'amour', 'patience', 'repentir'],
  // Ibn `Umar donne son âne et son turban à un bédouin : « le meilleur acte de
  // bonté d'un fils est de bien traiter les amis de son père ».
  'muslim:6513': ['famille', 'generosite', 'amour', 'fraternite'],
  // « Le meilleur acte de bonté : traiter avec bienveillance les amis de son
  // père. »
  'muslim:6514': ['famille', 'generosite', 'fraternite'],
  // Idem, « après sa mort » — la fidélité à un parent disparu.
  'muslim:6515': ['famille', 'generosite', 'fraternite', 'mort'],
  // « La vertu, c'est une bonne attitude ; le vice, ce qui te trouble le cœur
  // et que tu n'aimes pas que les gens découvrent. »
  'muslim:6516': ['doute', 'intention', 'repentir'],
  // Idem.
  'muslim:6517': ['doute', 'intention', 'repentir'],
  // Les liens de parenté qui cherchent refuge auprès d'Allah contre leur
  // rupture : « Je maintiens avec qui te maintient. »
  'muslim:6518': ['famille', 'pardon', 'amour'],
  // « Le lien de parenté est suspendu au Trône. »
  'muslim:6519': ['famille', 'pardon', 'amour'],
  // « Celui qui rompt les liens de parenté n'entrera pas au Paradis. »
  'muslim:6520': ['famille', 'pardon', 'colere'],
  // Idem.
  'muslim:6521': ['famille', 'pardon', 'colere'],
  // « Que celui qui veut sa subsistance élargie maintienne ses liens de
  // parenté. »
  'muslim:6523': ['famille', 'argent', 'espoir'],
  // Idem.
  'muslim:6524': ['famille', 'argent', 'espoir'],
  // « J'ai des proches : je garde le lien, ils le rompent ; je suis doux, ils
  // sont durs. » La réponse exacte à la famille toxique.
  'muslim:6525': ['famille', 'patience', 'injustice', 'tristesse', 'pardon'],
  // « Ne nourrissez ni haine ni jalousie ; pas plus de trois jours fâchés. »
  'muslim:6526': ['colere', 'jalousie', 'pardon', 'fraternite'],
  // « Le meilleur des deux est celui qui salue l'autre en premier. »
  'muslim:6532': ['pardon', 'colere', 'fraternite', 'humilite'],
  // Pas plus de trois jours de brouille.
  'muslim:6534': ['pardon', 'colere', 'fraternite'],
  // Idem.
  'muslim:6535': ['pardon', 'colere', 'fraternite'],
  // « Évitez les soupçons… ne vous enviez pas, ne vous espionnez pas. »
  'muslim:6536': ['jalousie', 'fraternite', 'parole', 'colere'],
  // « Ne restez pas fâchés les uns avec les autres. »
  'muslim:6537': ['pardon', 'colere', 'fraternite'],
  // « Ne gardez pas de rancune, ne vous détestez pas. »
  'muslim:6538': ['colere', 'jalousie', 'pardon', 'fraternite'],
  // « Ne coupez pas les liens de parenté, ne vous haïssez pas. »
  'muslim:6539': ['famille', 'colere', 'jalousie', 'fraternite'],
  // « Ne vous détestez pas, ne soyez pas jaloux. »
  'muslim:6540': ['jalousie', 'colere', 'fraternite'],
  // Le musulman frère du musulman : ni oppression, ni mépris ; « la piété est
  // ici », la poitrine ; sang, biens et honneur sacrés.
  'muslim:6541': ['fraternite', 'orgueil', 'injustice', 'humilite', 'intention'],
  // « Allah ne regarde pas vos corps ni vos visages, mais vos cœurs. »
  'muslim:6542': ['intention', 'humilite', 'orgueil'],
  // Idem, « vos cœurs et vos actions ».
  'muslim:6543': ['intention', 'humilite', 'orgueil'],
  // Le pardon du lundi et du jeudi différé pour qui garde rancune : « laissez-
  // les jusqu'à ce qu'ils se réconcilient ».
  'muslim:6546': ['pardon', 'colere', 'fraternite', 'espoir'],
  // Idem.
  'muslim:6547': ['pardon', 'colere', 'fraternite', 'espoir'],
  // « Où sont ceux qui se sont aimés pour Ma Gloire ? »
  'muslim:6548': ['amour', 'fraternite', 'espoir'],
  // L'homme qui traverse la ville pour voir son frère sans rien en attendre ;
  // l'ange : « Allah t'aime comme tu l'aimes. »
  'muslim:6549': ['amour', 'fraternite', 'espoir', 'solitude'],
  // Visiter un malade : « dans un jardin du Paradis jusqu'à son retour ».
  'muslim:6551': ['maladie', 'fraternite', 'generosite'],
  // Idem.
  'muslim:6552': ['maladie', 'fraternite', 'generosite'],
  // Idem, « quand un musulman rend visite à son frère ».
  'muslim:6553': ['maladie', 'fraternite', 'generosite'],
  // Idem, avec l'explication de Khurfat-ul-jannah.
  'muslim:6554': ['maladie', 'fraternite', 'generosite'],
  // « J'étais malade et tu ne M'as pas rendu visite ; J'avais faim… »
  'muslim:6556': ['maladie', 'pauvrete', 'generosite', 'fraternite', 'solitude'],
  // La maladie qui efface les péchés comme les feuilles tombent en automne.
  'muslim:6559': ['maladie', 'patience', 'espoir'],
  // `Aisha reprend des jeunes qui rient d'une chute : l'épine qui blesse
  // élève d'un rang.
  'muslim:6561': ['maladie', 'patience', 'espoir'],
  // « Un croyant ne subit pas la douleur d'une épine sans qu'Allah l'élève. »
  'muslim:6562': ['maladie', 'patience', 'espoir'],
  // Idem.
  'muslim:6563': ['maladie', 'patience', 'espoir'],
  // « Aucun malheur n'atteint un croyant sans que cela efface ses péchés. »
  'muslim:6565': ['patience', 'maladie', 'espoir', 'repentir'],
  // Idem.
  'muslim:6566': ['patience', 'maladie', 'espoir', 'repentir'],
  // Idem.
  'muslim:6567': ['patience', 'maladie', 'espoir', 'repentir'],
  // « Ni gêne, ni difficulté, ni maladie, ni chagrin, ni même une inquiétude
  // sans que ses péchés ne soient expiés. » Le hadith de l'angoisse ordinaire.
  'muslim:6568': ['patience', 'tristesse', 'peur', 'maladie', 'espoir'],
  // Les musulmans effrayés par « quiconque fait le mal en sera rétribué » :
  // « restez modérés et tenez bon dans l'épreuve ».
  'muslim:6569': ['peur', 'patience', 'espoir', 'repentir'],
  // « Ne maudis pas la fièvre : elle efface les péchés comme le four purifie
  // le fer. »
  'muslim:6570': ['maladie', 'patience', 'colere', 'espoir'],
  // La femme épileptique : « si tu patientes, tu auras le Paradis » — et elle
  // choisit de patienter. Le texte de la maladie chronique.
  'muslim:6571': ['maladie', 'patience', 'espoir', 'confiance'],
  // « Ô Mes serviteurs, Je Me suis interdit l'injustice… demandez-Moi. »
  'muslim:6572': ['injustice', 'pardon', 'confiance', 'pauvrete', 'espoir', 'repentir'],
  // Idem, abrégé.
  'muslim:6575': ['injustice', 'pardon', 'confiance', 'espoir'],
  // « Méfiez-vous de l'injustice… et de l'avarice, qui a détruit ceux d'avant. »
  'muslim:6576': ['injustice', 'argent', 'orgueil'],
  // « L'injustice sera une obscurité le Jour de la Résurrection. »
  'muslim:6577': ['injustice', 'peur'],
  // « Qui soulage un musulman d'une difficulté… qui couvre ses défauts. »
  'muslim:6578': ['generosite', 'fraternite', 'tristesse', 'pardon', 'espoir'],
  // Le « pauvre » qui arrive avec ses prières mais a insulté et lésé : ses
  // bonnes actions passent à ses victimes.
  'muslim:6579': ['injustice', 'parole', 'peur', 'justice', 'repentir'],
  // Les droits rendus jusqu'entre les brebis.
  'muslim:6580': ['justice', 'injustice', 'espoir'],
  // « Allah accorde un délai à l'injuste, mais quand Il le saisit… »
  'muslim:6581': ['injustice', 'patience', 'espoir'],
  // « Aidez votre frère, qu'il soit injuste ou victime » — en l'empêchant
  // d'être injuste.
  'muslim:6582': ['injustice', 'fraternite', 'colere', 'justice'],
  // « Le croyant est pour le croyant comme une brique soutenant une autre. »
  'muslim:6585': ['fraternite', 'solitude', 'amour'],
  // « Les croyants, dans leur amour et leur compassion, sont comme un seul
  // corps : si un membre souffre, tout le corps souffre. »
  'muslim:6586': ['fraternite', 'amour', 'maladie', 'solitude'],
  // Idem.
  'muslim:6588': ['fraternite', 'amour', 'maladie', 'solitude'],
  // Idem.
  'muslim:6589': ['fraternite', 'amour', 'maladie'],
  // « Quand deux personnes s'insultent, le péché est sur la première. »
  'muslim:6591': ['colere', 'parole', 'patience', 'injustice'],
  // « L'aumône ne diminue pas la richesse ; qui pardonne, Allah l'honore ;
  // qui s'humilie, Allah l'élève. »
  'muslim:6592': ['generosite', 'pardon', 'humilite', 'argent'],
  // La définition de la médisance : « parler de ton frère d'une manière qu'il
  // n'aime pas » — même si c'est vrai.
  'muslim:6593': ['parole', 'fraternite', 'repentir'],
  // « Qui cache les fautes d'autrui ici-bas, Allah cachera les siennes. »
  'muslim:6594': ['pardon', 'fraternite', 'espoir', 'parole'],
  // Idem.
  'muslim:6595': ['pardon', 'fraternite', 'espoir', 'parole'],
  // Le Prophète accueille aimablement un homme dont il vient de dire du mal ;
  // « le pire est celui que les gens évitent par crainte de sa méchanceté ».
  'muslim:6596': ['parole', 'fraternite', 'colere', 'patience'],
  // « Celui qui est privé de douceur est privé de tout bien. »
  'muslim:6598': ['colere', 'patience', 'humilite', 'fraternite'],
  // Idem.
  'muslim:6599': ['colere', 'patience', 'humilite', 'fraternite'],
  // Idem.
  'muslim:6600': ['colere', 'patience', 'humilite', 'fraternite'],
  // « Aïsha, Allah est doux et Il aime la douceur ; Il accorde par la douceur
  // ce qu'Il n'accorde pas par la violence. »
  'muslim:6601': ['colere', 'patience', 'amour', 'fraternite'],
  // « La douceur n'est jamais dans une chose sans l'embellir. »
  'muslim:6602': ['colere', 'patience', 'fraternite'],
  // « Il ne convient pas à un véridique d'invoquer la malédiction. »
  'muslim:6608': ['colere', 'parole', 'patience'],
  // « Celui qui maudit ne sera ni intercesseur ni témoin. »
  'muslim:6610': ['colere', 'parole', 'repentir'],
  // Idem.
  'muslim:6612': ['colere', 'parole', 'repentir'],
  // « Je n'ai pas été envoyé pour maudire, mais comme une miséricorde. »
  'muslim:6613': ['colere', 'pardon', 'amour', 'espoir'],
  // « Je suis un être humain : si je maudis un musulman, fais-en pour lui une
  // purification. » La colère reconnue comme humaine.
  'muslim:6614': ['colere', 'pardon', 'humilite', 'espoir'],
  // Idem.
  'muslim:6616': ['colere', 'pardon', 'humilite', 'espoir'],
  // Idem, avec l'engagement pris auprès d'Allah.
  'muslim:6619': ['colere', 'pardon', 'humilite', 'espoir'],
  // « Muhammad est un être humain, je me mets en colère comme tout être
  // humain. »
  'muslim:6622': ['colere', 'humilite', 'pardon', 'espoir'],
  // L'orpheline qui pleure d'avoir cru être maudite, et Um Sulaim qui court
  // défendre sa fille ; le Prophète sourit et explique.
  'muslim:6627': ['famille', 'tristesse', 'pardon', 'espoir'],
  // « Les pires sont ceux qui ont deux visages. »
  'muslim:6630': ['intention', 'parole', 'fraternite'],
  // Idem.
  'muslim:6631': ['intention', 'parole', 'fraternite'],
  // Idem.
  'muslim:6632': ['intention', 'parole', 'fraternite'],
  // « N'est pas menteur celui qui réconcilie les gens » — et ce qu'un mari
  // rapporte à sa femme pour ramener la paix entre eux.
  'muslim:6633': ['pardon', 'parole', 'famille', 'fraternite', 'justice'],
  // La médisance qui crée des divisions ; la vérité qui inscrit véridique.
  'muslim:6636': ['parole', 'fraternite', 'intention'],
  // « La vérité mène à la vertu et la vertu au Paradis. »
  'muslim:6637': ['parole', 'intention', 'espoir'],
  // Idem.
  'muslim:6638': ['parole', 'intention', 'espoir'],
  // Idem, « méfiez-vous du mensonge ».
  'muslim:6639': ['parole', 'intention', 'espoir', 'repentir'],
  // Le « Raqub » n'est pas celui qui n'a pas d'enfants, mais celui qui n'en a
  // pas envoyé devant lui ; et le fort est celui qui se maîtrise en colère.
  'muslim:6641': ['famille', 'mort', 'colere', 'patience', 'espoir'],
  // « Le fort n'est pas celui qui lutte, mais celui qui se maîtrise en
  // colère. »
  'muslim:6643': ['colere', 'patience'],
  // Idem.
  'muslim:6644': ['colere', 'patience'],
  // Les yeux rouges de colère ; « je connais une parole qui la ferait
  // disparaître ».
  'muslim:6646': ['colere', 'patience', 'parole'],
  // Idem.
  'muslim:6647': ['colere', 'patience', 'parole'],
  // « Quand l'un de vous se bat avec son frère, qu'il épargne son visage. »
  'muslim:6651': ['colere', 'fraternite', 'injustice'],
  // Idem.
  'muslim:6653': ['colere', 'fraternite', 'injustice'],
  // « Allah punira ceux qui tourmentent les gens en ce monde. »
  'muslim:6657': ['injustice', 'colere'],
  // Idem ; et le gouverneur qui libère les gens en entendant le hadith.
  'muslim:6659': ['injustice', 'justice', 'espoir'],
  // « Celui qui pointe une arme vers son frère, les anges le maudissent — même
  // s'il s'agit de son vrai frère. »
  'muslim:6666': ['colere', 'fraternite', 'famille', 'injustice'],
  // La branche épineuse écartée du chemin, et le pardon accordé pour cela.
  'muslim:6669': ['generosite', 'fraternite', 'espoir', 'pardon'],
  // Idem : « je vais les enlever pour qu'elles ne nuisent pas aux musulmans ».
  'muslim:6670': ['generosite', 'fraternite', 'espoir'],
  // « Écarte ce qui gêne sur les chemins des musulmans. »
  'muslim:6673': ['generosite', 'fraternite', 'travail'],
  // « Je ne sais pas si je vivrai après toi : donne-moi un conseil. »
  'muslim:6674': ['generosite', 'sens', 'mort', 'fraternite'],
  // La femme punie pour un chat qu'elle a laissé mourir de faim.
  'muslim:6675': ['generosite', 'injustice', 'peur'],
  // Idem.
  'muslim:6679': ['generosite', 'injustice', 'peur'],
  // « La Gloire est Mon vêtement et la Majesté Mon manteau. »
  'muslim:6680': ['orgueil', 'humilite'],
  // L'homme qui jura qu'Allah ne pardonnerait pas à untel, et vit ses œuvres
  // annulées.
  'muslim:6681': ['pardon', 'orgueil', 'espoir'],
  // Les gens ébouriffés et repoussés des portes, dont le serment est exaucé.
  'muslim:6682': ['pauvrete', 'humilite', 'espoir', 'injustice'],
  // « Quand une personne dit que les gens sont perdus, c'est elle la perdue. »
  'muslim:6683': ['orgueil', 'parole', 'humilite'],
  // « Gabriel m'a tant recommandé le voisin que j'ai cru qu'il hériterait. »
  'muslim:6685': ['fraternite', 'generosite'],
  // Idem.
  'muslim:6687': ['fraternite', 'generosite'],
  // « Quand tu prépares un bouillon, ajoute de l'eau et offres-en à ton
  // voisin. »
  'muslim:6688': ['generosite', 'fraternite', 'pauvrete'],
  // Idem, « pense aux membres de la famille de tes voisins ».
  'muslim:6689': ['generosite', 'fraternite', 'famille'],
  // « Ne considère aucun bien comme insignifiant, même rencontrer ton frère
  // avec le sourire. »
  'muslim:6690': ['generosite', 'fraternite', 'pauvrete', 'espoir'],
  // Intercéder pour la personne dans le besoin.
  'muslim:6691': ['generosite', 'pauvrete', 'fraternite'],
  // Le vendeur de musc et le forgeron : la bonne et la mauvaise compagnie.
  'muslim:6692': ['fraternite', 'doute', 'intention'],
  // La femme qui partage son unique datte entre ses deux filles sans rien
  // manger : « qui élève des filles et les traite bien sera protégé du Feu ».
  'muslim:6693': ['famille', 'generosite', 'pauvrete', 'amour', 'espoir'],
  // Idem, les trois dattes partagées.
  'muslim:6694': ['famille', 'generosite', 'pauvrete', 'amour', 'espoir'],
  // « Celui qui élève correctement deux filles, lui et moi serons ainsi » —
  // les doigts entrelacés.
  'muslim:6695': ['famille', 'amour', 'generosite', 'espoir'],
  // « Tout musulman qui perd trois enfants et patiente… »
  'muslim:6696': ['famille', 'mort', 'tristesse', 'patience', 'espoir'],
  // « Et même deux ? — Même deux. »
  'muslim:6698': ['famille', 'mort', 'tristesse', 'patience', 'espoir'],
  // Les femmes qui demandent un jour d'enseignement ; « même pour deux, et
  // deux, et deux ».
  'muslim:6699': ['famille', 'mort', 'tristesse', 'patience', 'espoir'],
  // La mère qui vient avec son enfant : « j'en ai déjà enterré trois ».
  'muslim:6703': ['famille', 'mort', 'tristesse', 'patience', 'espoir'],
  // « Il est malade et j'ai peur qu'il meure, car j'en ai déjà enterré trois. »
  // Le texte le plus direct de la peur pour un enfant malade.
  'muslim:6704': ['famille', 'maladie', 'peur', 'mort', 'tristesse', 'espoir'],
  // Quand Allah aime un serviteur, Il le fait aimer du ciel puis de la terre.
  'muslim:6705': ['amour', 'fraternite', 'solitude'],
  // « Les âmes sont des groupes rassemblés : celles qui se connaissaient
  // s'entendent ici-bas. » L'affinité qu'on ne s'explique pas.
  'muslim:6708': ['fraternite', 'amour', 'solitude'],
  // Idem, avec « les gens sont comme des mines d'or et d'argent ».
  'muslim:6709': ['fraternite', 'amour', 'solitude'],
  // « Qu'as-tu préparé pour l'Heure ? — L'amour d'Allah et de Son Messager. »
  // « Tu seras avec celui que tu aimes. »
  'muslim:6710': ['amour', 'espoir', 'sens'],
  // Idem : « rien ne nous a rendus plus heureux » ; « j'espère être avec eux
  // même si je n'ai pas agi comme eux ».
  'muslim:6713': ['amour', 'espoir', 'sens', 'repentir'],
  // « Je n'ai pas fait beaucoup de prières ni d'aumônes, mais j'aime Allah et
  // Son Messager. » — « Tu seras avec celui que tu aimes. »
  'muslim:6715': ['amour', 'espoir', 'repentir', 'doute'],
  // « Que penses-tu de celui qui aime des gens sans agir comme eux ? »
  'muslim:6718': ['amour', 'espoir', 'repentir', 'doute'],
  // Celui qu'on loue pour ses bonnes actions : « c'est une bonne nouvelle
  // anticipée pour le croyant ».
  'muslim:6721': ['espoir', 'intention', 'humilite'],

  // — Muslim 39 : Les salutations —

  // Qui salue qui : le cavalier le piéton, le petit groupe le grand.
  'muslim:5646': ['fraternite', 'humilite'],
  // Les droits du chemin : baisser le regard, saluer, parler correctement.
  'muslim:5647': ['fraternite', 'parole', 'justice'],
  // Idem, avec « ne pas nuire aux autres ».
  'muslim:5648': ['fraternite', 'parole', 'justice'],
  // Les droits du musulman : répondre au salut, visiter le malade, suivre le
  // cortège funéraire.
  'muslim:5650': ['fraternite', 'maladie', 'mort'],
  // Les six droits : saluer, accepter l'invitation, conseiller, visiter le
  // malade, accompagner le cortège.
  'muslim:5651': ['fraternite', 'maladie', 'mort', 'generosite', 'parole'],
  // Le Prophète saluait les enfants quand il les croisait.
  'muslim:5663': ['famille', 'fraternite', 'humilite'],
  // Idem, la chaîne de ceux qui ont continué à le faire.
  'muslim:5665': ['famille', 'fraternite', 'humilite'],
  // Aïsha répond durement aux Juifs : « Allah aime la douceur en toute chose ».
  'muslim:5656': ['colere', 'patience', 'parole'],
  // Idem : « ne sois pas dure dans tes paroles ».
  'muslim:5658': ['colere', 'patience', 'parole'],
  // Asma' qui s'occupe du cheval, va chercher l'eau, pétrit ; la jalousie de
  // Zubair ; la servante qui la soulage. (Parallèle de bukhari:5224.)
  'muslim:5692': ['famille', 'travail', 'patience', 'pauvrete', 'humilite'],
  // Asma' encore, et l'homme pauvre à qui elle laisse faire commerce à l'ombre
  // de sa maison ; l'argent qu'elle veut donner en aumône.
  'muslim:5693': ['famille', 'travail', 'generosite', 'pauvrete'],
  // « Quand vous êtes trois, deux ne doivent pas parler à part » — l'exclusion.
  'muslim:5694': ['solitude', 'fraternite', 'tristesse'],
  // Idem : « jusqu'à ce que d'autres le rejoignent, car cela pourrait lui faire
  // de la peine ».
  'muslim:5696': ['solitude', 'fraternite', 'tristesse'],
  // Idem : « car cela lui fait du mal ».
  'muslim:5697': ['solitude', 'fraternite', 'tristesse'],
  // L'invocation de Jibril au chevet du Prophète malade.
  'muslim:5699': ['maladie', 'confiance', 'espoir'],
  // Idem : « Allah te guérira ».
  'muslim:5700': ['maladie', 'confiance', 'espoir'],
  // « Seigneur des gens, guéris-le, Tu es le Grand Guérisseur » ; puis la mort
  // du Prophète, la main retirée, « fais-moi rejoindre la compagnie suprême ».
  'muslim:5707': ['maladie', 'mort', 'confiance', 'tristesse', 'espoir'],
  // L'invocation faite au chevet d'un malade.
  'muslim:5709': ['maladie', 'confiance', 'espoir'],
  // Idem.
  'muslim:5710': ['maladie', 'confiance', 'espoir'],
  // Quand un membre de la famille tombait malade, il soufflait sur lui.
  'muslim:5714': ['maladie', 'famille', 'confiance'],
  // « Que celui qui sait faire du bien à son frère le fasse. »
  'muslim:5727': ['maladie', 'fraternite', 'generosite'],
  // Idem.
  'muslim:5731': ['maladie', 'fraternite', 'generosite'],
  // « Pour chaque maladie il existe un remède, avec la permission d'Allah. »
  'muslim:5741': ['maladie', 'espoir', 'confiance'],
  // La blessure que même le contact d'une mouche fait souffrir, et le soin
  // finalement accepté.
  'muslim:5743': ['maladie', 'peur', 'patience'],
  // Le talbina servi à la famille en deuil : « il apaise le cœur affligé et
  // diminue la tristesse ». Le geste concret pour quelqu'un qui pleure.
  'muslim:5769': ['tristesse', 'mort', 'famille', 'generosite', 'maladie'],
  // L'épidémie : ne pas y entrer, ne pas en fuir.
  'muslim:5773': ['maladie', 'peur', 'confiance', 'patience'],
  // `Umar rebroussant chemin devant la peste : « nous fuyons le décret d'Allah
  // vers le décret d'Allah ». Le hadith de la décision prise dans la peur.
  'muslim:5784': ['maladie', 'peur', 'confiance', 'doute'],
  // Pas de mauvais présage ; « la meilleure forme est le bon présage : une
  // bonne parole qu'on entend ».
  'muslim:5798': ['espoir', 'parole', 'doute'],
  // « J'aime le bon présage, c'est-à-dire une bonne parole. »
  'muslim:5800': ['espoir', 'parole', 'doute'],
  // « C'est juste une idée personnelle : que cela ne t'empêche pas d'agir. »
  'muslim:5813': ['doute', 'peur', 'confiance'],
  // Les devins : « une parole de vérité à laquelle on ajoute cent mensonges ».
  'muslim:5816': ['doute', 'parole', 'confiance'],
  // Idem.
  'muslim:5817': ['doute', 'parole', 'confiance'],
  // Le jeune marié tué par le serpent, sa jalousie soudaine, la lance levée ;
  // « demandez pardon pour votre compagnon ». Récit grave.
  'muslim:5839': ['famille', 'jalousie', 'mort', 'colere', 'tristesse'],
  // L'homme assoiffé qui redescend dans le puits pour faire boire un chien :
  // « il y a une récompense pour chaque être vivant que l'on aide ».
  'muslim:5859': ['generosite', 'pardon', 'espoir', 'pauvrete'],
  // La prostituée qui abreuve un chien et à qui il est pardonné.
  'muslim:5860': ['pardon', 'generosite', 'espoir', 'repentir'],
  // Idem.
  'muslim:5861': ['pardon', 'generosite', 'espoir', 'repentir'],
};
