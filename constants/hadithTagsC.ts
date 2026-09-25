/**
 * Étiquetage du lot C — maladie, mort, deuil.
 *
 * PÉRIMÈTRE : trois chapitres seulement, lus intégralement en français —
 * Bukhari 76 (La médecine, 105 textes), Bukhari 23 (Les funérailles, 160) et
 * Muslim 11 (La prière funéraire, 135), soit 400 hadiths. Les autres chapitres
 * de Bukhari et Muslim sont hors lot et ne figurent pas ici.
 *
 * Clé : `"<recueil>:<numéro>"`, même convention que `hadithTags.ts`. Ce fichier
 * est volontairement séparé : la fusion dans `HADITH_TAGS` est faite ailleurs.
 *
 * ⚠️ CE LOT EST LE PLUS SENSIBLE DU CORPUS. Ce sont les textes que lira
 * quelqu'un qui vient d'enterrer un parent ou qui reçoit un diagnostic. Trois
 * règles ont guidé l'étiquetage :
 *
 * 1. LA PERTINENCE PRIME SUR LA COUVERTURE. Un faux positif ici ne gêne pas :
 *    il blesse. En cas de doute, le hadith n'est pas tagué. Sur 400 textes,
 *    280 sont restés sans étiquette.
 *
 * 2. LE RITUEL PUR N'EST PAS UNE ÉMOTION. Modalités du lavage du corps,
 *    tressage des cheveux de la défunte, nombre de takbirs, matière du
 *    linceul, nivellement de la tombe, interdiction de s'asseoir dessus :
 *    ces textes ne répondent à aucun ressenti et pollueraient les résultats de
 *    quelqu'un qui écrit « j'ai perdu ma mère ». Ils ne sont pas tagués. Même
 *    traitement pour la pharmacopée de Bukhari 76 (miel, saignée, cumin noir,
 *    encens indien, dattes 'Ajwa) : c'est de la médecine du VIIe siècle, pas
 *    une parole de réconfort. Même traitement encore pour les chaînes de
 *    transmission sans contenu (« rapporté par X avec la même chaîne »).
 *
 * 3. `tristesse` EST DONNÉ AVEC PARCIMONIE. C'est le tag qui remonte sur
 *    « je suis triste », la saisie la plus fréquente d'une personne fragile.
 *    Il n'est posé que sur les textes qui CONSOLENT la tristesse ou qui la
 *    légitiment (le Prophète pleure, les larmes sont une miséricorde), jamais
 *    sur ceux qui décrivent l'agonie, le châtiment ou la mort d'un enfant.
 *
 * Voir `SENSITIVE_C` en bas de fichier : les textes durs, à ne pas servir en
 * premier sur une recherche de réconfort — sur le modèle de ce qui est déjà
 * fait pour `qudsi:28` dans `lib/hadithSearch.ts`.
 */
import type { EmotionId } from './hadithEmotions';

export const HADITH_TAGS_C: Record<string, EmotionId[]> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Bukhari 76 — La médecine
  //
  // Chapitre très majoritairement pharmacologique : sur 105 textes, une
  // quinzaine seulement portent une charge humaine (l'espérance de guérison,
  // la douceur envers le malade, la récompense de la souffrance endurée).
  // ─────────────────────────────────────────────────────────────────────────

  // « Il n'y a pas de maladie qu'Allah ait créée sans son remède. » — le
  // hadith d'espérance du chapitre, celui qu'on donne à quelqu'un qui vient
  // d'apprendre un diagnostic.
  'bukhari:5678': ['maladie', 'espoir', 'confiance'],
  // At-Talbina « apaise le cœur du malade et soulage une partie de sa
  // tristesse et de son chagrin » — explicitement recommandé aux malades ET à
  // ceux qui viennent de perdre un proche. Un des rares textes du lot qui
  // nomme le chagrin pour le soulager.
  'bukhari:5689': ['maladie', 'tristesse', 'mort'],
  // « Ne faites pas souffrir vos enfants » en leur pressant la gorge : douceur
  // envers l'enfant malade contre le geste brutal des adultes.
  'bukhari:5713': ['maladie'],
  'bukhari:5715': ['maladie'],
  'bukhari:5718': ['maladie'],
  // La fièvre : invocation d'un compagnon malade, geste simple d'Asma' qui
  // invoque puis rafraîchit la malade. La charge est dans le soin porté.
  'bukhari:5724': ['maladie', 'confiance'],
  // Épidémie : ne pas entrer dans la zone touchée, ne pas fuir si on y est.
  // Texte de conduite dans l'épreuve collective, encore très lisible.
  'bukhari:5728': ['maladie', 'patience'],
  // Umar et l'épidémie du Sham : « nous fuyons ce qu'Allah a décrété vers ce
  // qu'Allah a décrété » — prendre ses précautions n'est pas manquer de
  // confiance. Réponse à « je ne contrôle rien ».
  'bukhari:5729': ['maladie', 'confiance', 'doute'],
  'bukhari:5730': ['maladie', 'confiance'],
  // Celui qui meurt d'une maladie du ventre / de la peste est un martyr : la
  // souffrance endurée n'est pas perdue. Tagué `mort` sans `tristesse`.
  'bukhari:5732': ['maladie', 'mort', 'patience'],
  'bukhari:5733': ['maladie', 'mort', 'patience'],
  // « Aucun croyant ne reste patient dans un pays touché par la peste […] sans
  // qu'Allah ne lui accorde une récompense semblable à celle d'un martyr. »
  // Le texte du chapitre qui donne un sens à l'épreuve subie sans la nier.
  'bukhari:5734': ['maladie', 'patience', 'espoir', 'confiance'],
  // Invocation d'Anas pour Thabit malade : « Toi qui enlèves les difficultés,
  // guéris ce malade. » Texte de chevet, au sens propre.
  'bukhari:5742': ['maladie', 'confiance', 'espoir'],
  // Le Prophète passe sa main sur l'endroit douloureux et invoque la guérison.
  'bukhari:5743': ['maladie', 'confiance', 'espoir'],
  'bukhari:5744': ['maladie', 'confiance'],
  'bukhari:5750': ['maladie', 'confiance', 'espoir'],
  // Les 70 000 qui entrent sans jugement : « ceux qui placent leur confiance
  // uniquement en leur Seigneur ». Tagué pour la confiance, pas pour la
  // maladie — ce n'est pas un conseil de soin.
  'bukhari:5705': ['confiance', 'espoir'],
  'bukhari:5752': ['confiance', 'espoir'],

  // ─────────────────────────────────────────────────────────────────────────
  // Bukhari 23 — Les funérailles
  //
  // Le cœur du lot. Environ un tiers des 160 textes porte une charge humaine ;
  // les deux autres tiers sont du rituel (lavage, linceul, takbirs, tombe) ou
  // du récit historique sans portée émotionnelle.
  // ─────────────────────────────────────────────────────────────────────────

  // Visiter les malades et suivre les cortèges : les devoirs envers celui qui
  // souffre et envers la famille endeuillée. C'est ce qu'on cherche quand on
  // tape « un proche est malade ».
  'bukhari:1239': ['maladie', 'mort', 'fraternite'],
  'bukhari:1240': ['maladie', 'mort', 'fraternite'],
  // Abu Bakr découvre le visage du Prophète mort, l'embrasse et pleure, puis
  // tient debout la communauté : « celui qui adorait Muhammad, Muhammad est
  // mort ; celui qui adorait Allah, Allah est vivant. » Le deuil le plus
  // lourd du corpus, traversé sans effondrement.
  'bukhari:1241': ['mort', 'tristesse', 'patience', 'confiance'],
  'bukhari:1242': ['mort', 'tristesse', 'patience', 'confiance'],
  // Jabir découvre le visage de son père martyrisé et pleure ; le Prophète ne
  // l'en empêche pas. Les larmes du fils sont laissées libres.
  'bukhari:1244': ['mort', 'tristesse'],
  // Les yeux du Prophète se remplissent de larmes à l'annonce de la mort de
  // Zaid, Ja'far et Ibn Rawaha.
  'bukhari:1246': ['mort', 'tristesse'],
  // « Crains Allah et sois patiente », dit à une femme qui pleure sur une
  // tombe. Court, et un peu rude hors contexte — voir bukhari:1283 qui le
  // complète.
  'bukhari:1252': ['mort', 'patience'],
  // La femme qui pleure sur la tombe, ne reconnaît pas le Prophète et lui
  // répond « tu n'as pas été touché par un malheur comme le mien ». Il ne la
  // reprend pas : « la vraie patience, c'est au premier choc. » Un des très
  // rares textes où le chagrin répond durement et n'est pas corrigé.
  'bukhari:1283': ['mort', 'tristesse', 'patience'],
  'bukhari:1302': ['patience', 'mort'],
  // « Ce qu'Allah prend Lui appartient et ce qu'Il donne Lui appartient » :
  // l'enfant de sa fille est mourant, le Prophète vient, ses yeux coulent,
  // « c'est la miséricorde qu'Allah a placée dans le cœur de Ses serviteurs ».
  // Texte de deuil d'enfant : `tristesse` assumé ici, parce qu'il valide les
  // larmes au lieu de les condamner. Reste listé comme sensible.
  'bukhari:1284': ['mort', 'tristesse', 'patience', 'confiance'],
  // Les yeux du Prophète pleurent au bord de la tombe de sa fille.
  'bukhari:1285': ['mort', 'tristesse'],
  'bukhari:1342': ['mort', 'tristesse'],
  // `Aisha corrige la transmission : « nul ne portera le fardeau d'autrui » —
  // le croyant n'est pas puni par les pleurs de ses proches. Contrepoids
  // nécessaire à la série 1286-1292, et c'est pour cela qu'il est tagué.
  'bukhari:1286': ['mort', 'tristesse', 'espoir'],
  'bukhari:1287': ['mort', 'tristesse', 'espoir'],
  'bukhari:1288': ['mort', 'tristesse', 'espoir'],
  // `Abdur-Rahman bin `Auf pleure en se rappelant Mus`ab enterré dans un seul
  // vêtement : la richesse acquise après coup lui pèse. Deuil et rapport aux
  // biens.
  'bukhari:1274': ['mort', 'tristesse', 'argent', 'humilite'],
  'bukhari:1275': ['mort', 'tristesse', 'argent', 'humilite'],
  'bukhari:1276': ['mort', 'argent', 'humilite'],
  // La mort d'Ibrahim, fils du Prophète : « Les yeux pleurent, le cœur est
  // triste, et nous ne disons que ce qui plaît à notre Seigneur. » La phrase
  // la plus juste du lot sur le deuil — elle autorise le chagrin.
  'bukhari:1303': ['mort', 'tristesse', 'patience', 'confiance'],
  // Sa`d bin 'Ubada malade : le Prophète pleure, tous pleurent. « Allah ne
  // punit pas pour les larmes versées ni pour la tristesse du cœur. »
  'bukhari:1304': ['maladie', 'mort', 'tristesse'],
  // Um Sulaim annonce à Abu Talha la mort de leur fils avec une douceur
  // extraordinaire, et le Prophète les bénit. Le deuil d'un couple.
  'bukhari:1301': ['mort', 'tristesse', 'patience', 'fraternite'],
  // « Je ne l'ai jamais vu aussi triste que ce jour-là », à la mort des
  // récitateurs. La tristesse prophétique, nommée telle quelle.
  'bukhari:1300': ['mort', 'tristesse'],
  // Sa`d gravement malade interroge sur le testament : ne pas ruiner ses
  // héritiers, la récompense de ce qu'on dépense pour les siens, la peur de
  // rester seul après le départ des compagnons.
  'bukhari:1295': ['maladie', 'mort', 'argent', 'generosite', 'solitude'],
  // Se lever au passage d'un cortège, même celui d'un juif : « n'est-ce pas
  // un être vivant ? » La dignité de tout mort, sans distinction.
  'bukhari:1311': ['mort', 'fraternite', 'justice'],
  'bukhari:1312': ['mort', 'fraternite', 'justice'],
  'bukhari:1313': ['mort', 'fraternite', 'justice'],
  // Le Prophète va prier sur la tombe de la femme noire qui balayait la
  // mosquée et dont personne n'avait jugé la mort digne d'être annoncée.
  // Réponse à « je me sens de trop », « personne ne me voit ».
  'bukhari:1337': ['mort', 'solitude', 'humilite', 'justice'],
  // Accompagner un cortège : la récompense en qirats. Ce qu'on fait pour une
  // famille endeuillée compte.
  'bukhari:1325': ['mort', 'fraternite'],
  // L'aumône faite au nom d'une mère morte subitement lui profite : réponse
  // directe à « je n'ai pas eu le temps de faire quelque chose pour elle ».
  'bukhari:1388': ['mort', 'generosite', 'espoir'],
  // Le dernier souffle du Prophète, chez `Aisha, le jour de son tour.
  'bukhari:1389': ['mort', 'tristesse'],
  // Abu Bakr mourant : « un vivant a plus besoin de vêtements neufs qu'un
  // mort ». Détachement au seuil de la mort.
  'bukhari:1387': ['mort', 'humilite', 'sens'],
  // « Ne dites pas de mal des morts. »
  'bukhari:1393': ['mort', 'parole', 'fraternite'],
  // Le jeune serviteur juif malade que le Prophète va visiter — la visite au
  // malade, sans condition d'appartenance.
  'bukhari:1356': ['maladie', 'fraternite'],
  // `Aisha refuse d'être enterrée près du Prophète « pour qu'on ne pense pas
  // que je vaux mieux que ce que je suis ».
  'bukhari:1391': ['mort', 'humilite'],
  // Le mourant loué par quatre, trois ou deux témoins : le regard des vivants
  // sur celui qui part.
  'bukhari:1367': ['mort', 'espoir'],
  'bukhari:1368': ['mort', 'espoir'],
  // « Celui qui meurt sans rien associer à Allah entrera au Paradis » — texte
  // d'espérance, servi tel quel à quelqu'un qui s'inquiète pour un défunt.
  'bukhari:1237': ['mort', 'espoir', 'pardon'],
  // Um Al-`Ala' atteste du Paradis d'un mort ; le Prophète la reprend : « je
  // ne sais pas ce qu'Allah fera de moi ». Humilité devant l'inconnu de la
  // mort, plutôt que jugement sur le défunt.
  'bukhari:1243': ['mort', 'humilite', 'doute'],
  // Ibrahim, fils du Prophète, « a une nourrice au Paradis » : consolation
  // explicite pour un enfant mort en bas âge.
  'bukhari:1382': ['mort', 'espoir'],

  // ─────────────────────────────────────────────────────────────────────────
  // Muslim 11 — La prière funéraire
  //
  // Beaucoup de doublons de Bukhari 23 et un très grand nombre de chaînes de
  // transmission vides. Le chapitre apporte cependant deux choses que Bukhari
  // n'a pas : l'invocation d'Umm Salama à la perte d'un conjoint, et les
  // paroles à dire au chevet d'un mourant.
  // ─────────────────────────────────────────────────────────────────────────

  // Souffler la shahada à celui qui meurt : douceur des derniers instants.
  // Tagué `mort` seul — c'est un geste, pas une consolation pour le vivant.
  'muslim:2123': ['mort'],
  'muslim:2125': ['mort'],
  // Umm Salama, veuve : « Ô Allah, récompense-moi pour mon malheur et
  // accorde-moi quelque chose de meilleur en échange » — et elle le reçoit.
  // Le texte du lot qui parle le plus directement à quelqu'un qui vient de
  // perdre un conjoint : l'épreuve nommée, la demande formulée, la suite
  // possible.
  'muslim:2126': ['mort', 'tristesse', 'patience', 'espoir', 'confiance'],
  'muslim:2127': ['mort', 'tristesse', 'patience', 'espoir', 'confiance'],
  'muslim:2128': ['mort', 'patience', 'espoir', 'confiance'],
  // « Quand vous rendez visite à un malade ou à un mourant, invoquez le bien,
  // car les anges disent Amine. » Ce qu'on dit au chevet compte.
  'muslim:2129': ['maladie', 'mort', 'parole', 'espoir'],
  // Le Prophète ferme les yeux d'Abu Salama et invoque pour lui : « élargis sa
  // tombe et accorde-lui de la lumière ». Geste de tendresse envers le mort.
  'muslim:2130': ['mort', 'tristesse', 'espoir'],
  // Usama : « ce qu'Allah a pris Lui appartient » — doublet de bukhari:1284,
  // agonie d'un enfant, larmes du Prophète, « la compassion qu'Allah a placée
  // dans le cœur de Ses serviteurs ». Sensible, voir SENSITIVE_C.
  'muslim:2135': ['mort', 'tristesse', 'patience', 'confiance'],
  // Sa`d malade : « Allah ne punit pas pour les larmes des yeux ni pour la
  // tristesse du cœur. »
  'muslim:2137': ['maladie', 'mort', 'tristesse'],
  // Le Prophète demande des nouvelles de Sa`d malade et part le visiter pieds
  // nus avec dix compagnons. La visite au malade comme mobilisation.
  'muslim:2138': ['maladie', 'fraternite'],
  // « La patience doit être montrée dès le premier choc. »
  'muslim:2139': ['patience', 'mort'],
  // La femme qui pleure son enfant et répond au Prophète qu'il n'a pas été
  // touché comme elle. Doublet de bukhari:1283, avec l'enfant nommé.
  'muslim:2140': ['mort', 'tristesse', 'patience'],
  'muslim:2141': ['mort', 'tristesse', 'patience'],
  // `Aisha rétablit : le mort est puni pour ses propres fautes, pas pour les
  // pleurs des siens. Contrepoids à la série 2142-2158, tagué pour cela.
  'muslim:2153': ['mort', 'tristesse', 'espoir'],
  'muslim:2154': ['mort', 'tristesse', 'espoir'],
  'muslim:2156': ['mort', 'espoir'],
  // Khabbab : Mus`ab enterré dans un manteau trop court, la récompense
  // intacte auprès d'Allah, « et il y en a parmi nous qui profitent déjà des
  // fruits de ce bas-monde ».
  'muslim:2177': ['mort', 'argent', 'humilite', 'sens'],
  // « Lorsque l'un de vous enveloppe son frère, qu'il le fasse correctement » :
  // le soin dû au corps du défunt, rituel mais porteur de dignité.
  'muslim:2185': ['mort', 'fraternite'],
  // Récompense de celui qui accompagne un cortège jusqu'au bout.
  'muslim:2189': ['mort', 'fraternite'],
  'muslim:2196': ['mort', 'fraternite'],
  // Cent musulmans, ou quarante, qui prient pour un mort intercèdent pour
  // lui : ce que la communauté peut encore faire pour celui qui est parti.
  'muslim:2198': ['mort', 'fraternite', 'espoir'],
  'muslim:2199': ['mort', 'fraternite', 'espoir'],
  'muslim:2200': ['mort', 'espoir'],
  // « Le serviteur croyant trouve le soulagement des épreuves de ce monde et
  // entre dans la miséricorde d'Allah. » La mort comme fin de la peine —
  // pertinent pour un long deuil, mais attention : la seconde moitié du texte
  // vise « la mauvaise personne ». Voir SENSITIVE_C.
  'muslim:2202': ['mort', 'patience', 'espoir', 'sens'],
  'muslim:2203': ['mort', 'patience', 'espoir'],
  // Invocation complète pour un défunt : « pardonne-lui, fais-lui miséricorde,
  // accorde-lui une demeure meilleure que la sienne ». Ce qu'on récite quand
  // on ne sait plus quoi dire.
  'muslim:2233': ['mort', 'pardon', 'espoir'],
  // La femme à la peau foncée qui balayait la mosquée ; « ces tombes sont
  // pleines d'obscurité, mais par ma prière Allah les éclaire ».
  'muslim:2215': ['mort', 'solitude', 'humilite', 'espoir'],
  // Se lever au passage d'un cercueil : « la mort est vraiment un événement
  // bouleversant » / « n'avait-il pas une âme ? »
  'muslim:2222': ['mort', 'fraternite', 'sens'],
  'muslim:2226': ['mort', 'fraternite', 'justice'],
  // Salut aux habitants du cimetière : « si Allah le veut, nous vous
  // rejoindrons ». Le lien qui subsiste avec ceux qu'on a perdus.
  'muslim:2255': ['mort', 'fraternite', 'espoir', 'nuit'],
  'muslim:2257': ['mort', 'fraternite', 'espoir'],
  // Le Prophète pleure sur la tombe de sa mère et fait pleurer ceux qui
  // l'entourent. « Visitez les tombes, car cela vous rappelle la mort. »
  // Pleurer sa mère des décennies après : c'est permis.
  'muslim:2258': ['mort', 'tristesse'],
  'muslim:2259': ['mort', 'tristesse', 'sens'],
  'muslim:2260': ['mort', 'sens'],
};

/**
 * Textes durs : à NE PAS servir en premier sur une recherche de réconfort.
 *
 * Même logique que `qudsi:28` dans `lib/hadithSearch.ts` : ces hadiths ne sont
 * pas faux, ils sont mal placés quand quelqu'un écrit « j'ai perdu ma mère »
 * ou « j'en peux plus ». Trois familles :
 *
 *   a) SUICIDE — châtiment éternel décrit en détail. Jamais, pour personne qui
 *      exprime une détresse vitale. C'est exactement le cas qudsi:28.
 *      → bukhari:5778, 1363, 1364, 1365 ; muslim:2262.
 *
 *   b) CHÂTIMENT DE LA TOMBE / AGONIE — le marteau de fer, le cri du mort, la
 *      voix du défunt qui dit « malheur à moi, où m'emmènent-ils ? », les
 *      tombes où l'on est puni. Ces textes sont la première chose qui vient à
 *      l'esprit d'un endeuillé qui s'inquiète pour son mort.
 *      → bukhari:1289, 1314, 1316, 1338, 1361, 1369, 1372, 1373, 1374, 1375,
 *        1376, 1377, 1378, 1379, 1380, 1386 ; muslim:2248.
 *
 *   c) MORT D'ENFANT ET DEUIL CULPABILISANT — la mort de plusieurs enfants
 *      présentée comme un rempart contre le Feu (vrai, mais insoutenable pour
 *      une mère qui vient d'enterrer le sien), le sort des enfants des
 *      polythéistes, le mort puni par les pleurs de sa famille, la pleureuse
 *      vêtue de goudron, le refus de prier pour un proche mort hors de l'islam.
 *      → bukhari:1248, 1249, 1250, 1251, 1381, 1383, 1384, 1290, 1291, 1292,
 *        1294, 1296, 1297, 1298, 1299, 1305, 1315, 1360, 1370 ;
 *        muslim:2134, 2142, 2143, 2145, 2146, 2147, 2148, 2152, 2157, 2160,
 *        2161, 2186, 2188, 2202.
 *
 * La plupart de ces clés ne sont pas dans `HADITH_TAGS_C` — elles n'ont pas
 * été taguées du tout. Elles sont listées ici quand même, pour que la garde
 * tienne si quelqu'un les tague plus tard depuis un autre lot.
 */
export const SENSITIVE_C: string[] = [
  // (a) Suicide — condamnation explicite, à écarter absolument en détresse.
  'bukhari:5778',
  'bukhari:1363',
  'bukhari:1364',
  'bukhari:1365',
  'muslim:2262',

  // (b) Châtiment de la tombe, agonie, interrogatoire des anges.
  'bukhari:1289',
  'bukhari:1314',
  'bukhari:1316',
  'bukhari:1338',
  'bukhari:1361',
  'bukhari:1369',
  'bukhari:1372',
  'bukhari:1373',
  'bukhari:1374',
  'bukhari:1375',
  'bukhari:1376',
  'bukhari:1377',
  'bukhari:1378',
  'bukhari:1379',
  'bukhari:1380',
  'bukhari:1386',
  'muslim:2248',

  // (c) Mort d'enfants, pleurs punis, deuil culpabilisant.
  'bukhari:1248',
  'bukhari:1249',
  'bukhari:1250',
  'bukhari:1251',
  'bukhari:1290',
  'bukhari:1291',
  'bukhari:1292',
  'bukhari:1294',
  'bukhari:1296',
  'bukhari:1297',
  'bukhari:1298',
  'bukhari:1299',
  'bukhari:1305',
  'bukhari:1315',
  'bukhari:1360',
  'bukhari:1370',
  'bukhari:1381',
  'bukhari:1383',
  'bukhari:1384',
  'muslim:2134',
  'muslim:2142',
  'muslim:2143',
  'muslim:2145',
  'muslim:2146',
  'muslim:2147',
  'muslim:2148',
  'muslim:2152',
  'muslim:2157',
  'muslim:2160',
  'muslim:2161',
  'muslim:2186',
  'muslim:2188',
  'muslim:2202',

  // Textes tagués mais à manier avec précaution : ils sont justes et
  // consolants, mais racontent l'agonie d'un enfant. À ne pas servir en
  // premier à quelqu'un dont l'enfant est en réanimation.
  'bukhari:1284',
  'muslim:2135',
];
