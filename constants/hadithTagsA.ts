/**
 * Étiquetage du lot A — cœur, comportement, invocations.
 *
 * PÉRIMÈTRE : cinq chapitres, lus hadith par hadith en français avant d'être
 * tagués.
 *   - bukhari 81 — L'attendrissement des cœurs (ar-Riqaq)
 *   - bukhari 78 — Le bon comportement (al-Adab)
 *   - bukhari 80 — Les invocations (ad-Da'awat)
 *   - muslim 48  — Rappel d'Allah, invocation et repentir
 *   - muslim 55  — L'ascèse et l'attendrissement des cœurs
 *
 * Ce fichier ne contient QUE ces chapitres. Les lots B (famille, mariage) et C
 * (maladie, mort) vivent ailleurs ; la fusion dans `hadithTags.ts` est faite
 * par ailleurs.
 *
 * MÉTHODE — on tague ce dont le texte PARLE, jamais ce qu'il « prescrit ».
 * Sont volontairement laissés hors table :
 *   - les chaînes de transmission seules (« rapporté avec la même chaîne »),
 *     très nombreuses dans Muslim, qui ne portent aucun texte ;
 *   - les doublons de chaîne qui ne répètent qu'une variante de mot ;
 *   - l'eschatologie descriptive (dimensions du Bassin, topographie du
 *     Rassemblement, Ad-Dajjal, Ibn Saiyad) : décrire l'au-delà n'est pas
 *     parler d'espoir ni de peur à quelqu'un qui ouvre l'app un mauvais jour ;
 *   - les règles de convenance sans portée émotionnelle (choix des prénoms,
 *     kunya, éternuement, bâillement, serments, poésie licite) ;
 *   - le contexte historique et biographique (Hijra, Khaybar, Ta'if, Badr,
 *     délégations, magie subie par le Prophète).
 *
 * ⚠️ CONTENU RELIGIEUX — en cas de doute sur le sens, le hadith n'a pas été
 * tagué plutôt que d'être tordu. Plusieurs textes de ces chapitres sont durs
 * (châtiment, Feu, comptes du Jour dernier) : ils ne sont pas rattachés à
 * `peur` ou `espoir` quand leur propos est le châtiment lui-même, pour ne pas
 * les servir à quelqu'un qui cherche du réconfort.
 */
import type { EmotionId } from './hadithEmotions';

export const HADITH_TAGS_A: Record<string, EmotionId[]> = {
  // — Bukhari 81 : L'attendrissement des cœurs —

  // « Deux bienfaits dont beaucoup se laissent tromper : la santé et le temps libre. »
  'bukhari:6412': ['gratitude', 'sens', 'maladie'],
  // « Il n'y a de vraie vie que celle de l'au-delà. »
  'bukhari:6413': ['sens'],
  'bukhari:6414': ['sens', 'travail'],
  // Un espace du Paradis vaut mieux que le monde entier.
  'bukhari:6415': ['sens', 'espoir'],
  // « Sois dans ce monde comme un étranger ou un voyageur » ; profite de ta
  // santé avant la maladie, de ta vie avant la mort. (cf. nawawi:40)
  'bukhari:6416': ['sens', 'mort', 'maladie', 'solitude', 'gratitude', 'matin', 'nuit'],
  // Le carré de la vie, la ligne de l'espoir, les petites lignes des malheurs.
  'bukhari:6417': ['sens', 'espoir', 'mort', 'patience'],
  // Les lignes de l'espoir et de la mort.
  'bukhari:6418': ['sens', 'espoir', 'mort'],
  // « Le cœur du vieil homme reste jeune : l'amour du monde et l'espoir. »
  'bukhari:6420': ['sens', 'argent', 'espoir'],
  // L'homme vieillit, deux désirs vieillissent avec lui : richesse et longévité.
  'bukhari:6421': ['sens', 'argent', 'mort'],
  // Qui dit l'attestation sincèrement, Allah lui interdit le Feu.
  'bukhari:6423': ['intention', 'espoir'],
  // « Je n'ai d'autre récompense que le Paradis pour qui patiente quand Je fais
  // mourir son ami proche. » Le hadith du deuil. (cf. qudsi:29)
  'bukhari:6424': ['tristesse', 'mort', 'patience', 'amour', 'fraternite', 'espoir'],
  // « Je ne crains pas votre pauvreté, je crains que le monde vous soit ouvert
  // et que vous rivalisiez pour lui. »
  'bukhari:6425': ['argent', 'jalousie', 'pauvrete', 'sens'],
  'bukhari:6426': ['argent', 'jalousie', 'sens'],
  // La richesse : fruit vert et sucré, excellent soutien si gagnée licitement.
  'bukhari:6427': ['argent', 'travail', 'sens', 'gratitude'],
  // Générations : gens qui trahissent, ne tiennent pas leurs promesses.
  'bukhari:6428': ['parole', 'injustice'],
  // Khabbab : les compagnons partis sans récompense ici-bas, nous avons accumulé.
  'bukhari:6430': ['mort', 'argent', 'sens', 'patience'],
  'bukhari:6431': ['argent', 'sens'],
  // Les ablutions parfaites et la prière : les péchés pardonnés — « ne soyez
  // pas orgueilleux » pour autant.
  'bukhari:6433': ['pardon', 'orgueil', 'espoir'],
  // « Malheur à l'esclave du dinar et du dirham : s'il reçoit il est content,
  // sinon il est mécontent. »
  'bukhari:6435': ['argent', 'gratitude', 'sens'],
  // « Deux vallées d'argent, il en voudrait une troisième… et Allah pardonne à
  // celui qui se repent. »
  'bukhari:6436': ['argent', 'repentir', 'pardon', 'sens'],
  'bukhari:6437': ['argent', 'repentir', 'pardon', 'sens'],
  'bukhari:6438': ['argent', 'repentir', 'pardon', 'sens'],
  'bukhari:6439': ['argent', 'repentir', 'pardon', 'sens'],
  // « Celui qui prend la richesse sans avidité, Allah la bénit… et la main qui
  // donne vaut mieux que celle qui reçoit. »
  'bukhari:6441': ['argent', 'generosite', 'gratitude', 'humilite'],
  // « Sa richesse, c'est ce qu'il dépense de son vivant. »
  'bukhari:6442': ['argent', 'generosite', 'mort', 'sens'],
  // Abu Dhar dans la nuit : les riches seront les pauvres du Jour dernier, sauf
  // qui donne ; et la bonne nouvelle de l'unicité.
  'bukhari:6443': ['argent', 'generosite', 'nuit', 'espoir', 'pardon'],
  'bukhari:6444': ['argent', 'generosite', 'nuit', 'espoir', 'pardon'],
  'bukhari:6445': ['argent', 'generosite'],
  // « La vraie richesse est celle du cœur satisfait. »
  'bukhari:6446': ['argent', 'gratitude', 'pauvrete', 'humilite'],
  // Le pauvre qui vaut mieux qu'une terre pleine de notables.
  'bukhari:6447': ['pauvrete', 'humilite', 'injustice', 'espoir'],
  // Khabbab malade : Mus'ab enterré dans un seul drap trop court.
  'bukhari:6448': ['pauvrete', 'mort', 'patience', 'maladie'],
  // Le Prophète n'a jamais mangé à une table ni de pain fin.
  'bukhari:6450': ['pauvrete', 'humilite'],
  // À sa mort, il ne restait qu'un peu d'orge sur l'étagère de `Aisha.
  'bukhari:6451': ['pauvrete', 'humilite', 'mort'],
  // Abu Huraira, la pierre sur le ventre à cause de la faim, et le bol de lait
  // partagé avec les gens de la Suffa.
  'bukhari:6452': ['pauvrete', 'generosite', 'fraternite', 'patience', 'confiance'],
  // Sa`d : nous n'avions que les feuilles des arbres à manger.
  'bukhari:6453': ['pauvrete', 'patience'],
  'bukhari:6454': ['pauvrete', 'humilite'],
  'bukhari:6455': ['pauvrete', 'humilite'],
  // Le matelas du Prophète : du cuir rempli de fibres de palmier.
  'bukhari:6456': ['pauvrete', 'humilite'],
  'bukhari:6457': ['pauvrete', 'humilite'],
  // Un mois sans feu pour cuisiner : des dattes et de l'eau.
  'bukhari:6458': ['pauvrete', 'patience', 'humilite'],
  'bukhari:6459': ['pauvrete', 'patience', 'fraternite'],
  // « Ô Allah, accorde à la famille de Muhammad de quoi se nourrir. »
  'bukhari:6460': ['pauvrete', 'humilite', 'confiance'],
  // L'action la plus aimée est la plus régulière ; il se levait au chant du coq.
  'bukhari:6461': ['travail', 'nuit', 'patience'],
  'bukhari:6462': ['travail', 'patience'],
  // « Vos actions ne vous sauveront pas du Feu, sauf la miséricorde d'Allah. »
  // Agissez avec modération.
  'bukhari:6463': ['espoir', 'humilite', 'patience', 'orgueil'],
  'bukhari:6464': ['espoir', 'humilite', 'patience'],
  // « Ne vous engagez que dans ce que vous pouvez accomplir. »
  'bukhari:6465': ['patience', 'travail', 'humilite'],
  'bukhari:6466': ['patience', 'travail'],
  'bukhari:6467': ['espoir', 'humilite', 'pardon'],
  // La miséricorde divisée en cent parts : « le mécréant ne désespérerait pas ».
  'bukhari:6469': ['espoir', 'pardon', 'peur'],
  // « Celui qui se contente, Allah le rend autonome ; il n'y a pas de cadeau
  // plus vaste que la patience. »
  'bukhari:6470': ['patience', 'pauvrete', 'generosite', 'gratitude', 'confiance'],
  // Il priait jusqu'à en avoir les pieds enflés : « ne serais-je pas un
  // serviteur reconnaissant ? »
  'bukhari:6471': ['gratitude', 'nuit'],
  // Les soixante-dix mille qui placent leur confiance en leur Seigneur.
  'bukhari:6472': ['confiance', 'espoir'],
  // Interdiction des paroles inutiles, du gaspillage, de l'ingratitude envers
  // les mères.
  'bukhari:6473': ['parole', 'argent', 'fraternite'],
  // « Qui me garantit sa langue et ses parties intimes, je lui garantis le Paradis. »
  'bukhari:6474': ['parole', 'intention', 'espoir'],
  // « Qu'il dise du bien ou se taise » ; ne pas nuire au voisin ; honorer l'invité.
  'bukhari:6475': ['parole', 'fraternite', 'generosite'],
  'bukhari:6476': ['generosite', 'fraternite', 'parole'],
  // Une parole prononcée sans réfléchir peut faire tomber dans le Feu.
  'bukhari:6477': ['parole'],
  'bukhari:6478': ['parole'],
  // Les sept à l'ombre : celui qui se souvient d'Allah et dont les yeux pleurent.
  'bukhari:6479': ['tristesse', 'espoir', 'solitude'],
  // L'homme qui demanda à être brûlé par crainte, et à qui il fut pardonné.
  // (cf. qudsi:32)
  'bukhari:6480': ['peur', 'pardon', 'repentir', 'espoir'],
  'bukhari:6481': ['peur', 'pardon', 'repentir', 'espoir', 'mort'],
  // L'homme qui avertit son peuple de l'ennemi : un groupe l'écoute, l'autre périt.
  'bukhari:6482': ['sens', 'doute'],
  // Les papillons qui se jettent dans le feu et celui qui les retient par la ceinture.
  'bukhari:6483': ['sens', 'amour'],
  // « Le musulman est celui qui ne nuit à personne, ni par sa langue ni par ses mains. »
  'bukhari:6484': ['parole', 'fraternite', 'justice'],
  // « Si vous saviez ce que je sais, vous ririez peu et pleureriez beaucoup. »
  'bukhari:6485': ['tristesse', 'sens'],
  'bukhari:6486': ['tristesse', 'sens'],
  // Le Feu entouré de désirs, le Paradis entouré de difficultés. (cf. qudsi:38)
  'bukhari:6487': ['patience', 'sens', 'espoir'],
  // « Le Paradis est plus proche de vous que la lanière de votre chaussure. »
  'bukhari:6488': ['espoir', 'sens'],
  // « Tout, sauf Allah, est voué à disparaître. »
  'bukhari:6489': ['sens', 'mort'],
  // « Regarde celui qui a moins que toi. » L'antidote à la comparaison.
  'bukhari:6490': ['jalousie', 'gratitude', 'argent', 'humilite'],
  // Les bonnes intentions inscrites même non réalisées ; le mal non commis
  // compte comme un bien. (cf. nawawi:37)
  'bukhari:6491': ['intention', 'espoir', 'repentir', 'pardon'],
  // Anas : « Vous faites des actions qui vous semblent plus petites qu'un cheveu. »
  'bukhari:6492': ['repentir', 'doute'],
  // Le combattant courageux qui se donne la mort ; « les actions valent par
  // leur fin ».
  // ⚠️ Texte sévère sur le suicide — volontairement NON tagué `mort` ni
  // `espoir` pour qu'il ne remonte jamais sur une recherche de détresse.
  'bukhari:6493': ['intention', 'doute'],
  // Le meilleur des gens : celui qui lutte, et celui qui vit seul sur une
  // montagne pour adorer et préserver les gens de son mal.
  'bukhari:6494': ['solitude', 'intention', 'humilite'],
  // L'homme qui fuit avec son troupeau pour protéger sa religion des épreuves.
  'bukhari:6495': ['solitude', 'patience', 'doute'],
  // Quand la confiance disparaît et que le pouvoir est confié à qui ne le mérite pas.
  'bukhari:6496': ['injustice', 'doute'],
  // La confiance retirée des cœurs ; « à peine une personne digne de confiance ».
  'bukhari:6497': ['injustice', 'doute', 'solitude'],
  // Celui qui montre ses bonnes actions pour être loué : Allah dévoile son
  // intention. (cf. qudsi:5-6)
  'bukhari:6499': ['intention', 'orgueil'],
  // Mu`adh : « le droit des serviteurs sur Allah est qu'Il ne les punisse pas ».
  'bukhari:6500': ['espoir', 'confiance'],
  // « Rien n'est élevé dans ce monde sans qu'Allah ne l'abaisse ensuite. »
  'bukhari:6501': ['orgueil', 'humilite', 'sens', 'tristesse'],
  // « Je deviens son ouïe… s'il cherche Ma protection, Je le protège » ; et
  // « Je n'hésite sur rien autant qu'à prendre l'âme du croyant ».
  // (cf. nawawi:38, qudsi:25)
  'bukhari:6502': ['amour', 'confiance', 'peur', 'solitude', 'mort'],
  // « Celui qui aime rencontrer Allah… » avec l'explication de `Aisha : il
  // s'agit du moment de la mort, pas de l'aversion naturelle pour elle.
  'bukhari:6507': ['mort', 'peur', 'espoir', 'amour'],
  'bukhari:6508': ['mort', 'espoir', 'amour'],
  // Les derniers instants du Prophète : « Ô Allah, avec les plus hauts compagnons. »
  'bukhari:6509': ['mort', 'tristesse'],
  // « La mort a vraiment ses souffrances. »
  'bukhari:6510': ['mort', 'maladie', 'tristesse'],
  // « Si celui-ci vit jusqu'à un âge avancé, votre Heure arrivera » — leur mort.
  'bukhari:6511': ['mort', 'sens'],
  // « Soulagé ou soulageant » : le croyant est soulagé des peines de ce monde.
  'bukhari:6512': ['mort', 'espoir', 'tristesse', 'patience'],
  'bukhari:6513': ['mort', 'espoir'],
  // Trois choses suivent le défunt ; deux repartent, ses actions restent.
  'bukhari:6514': ['mort', 'sens', 'argent', 'fraternite'],
  // « Ne dites pas de mal des morts. »
  'bukhari:6516': ['parole', 'mort'],
  // « Qui a fait du tort à son frère doit lui demander pardon avant sa mort,
  // car là-bas il n'y aura ni dinar ni dirham. »
  'bukhari:6534': ['pardon', 'injustice', 'justice', 'repentir', 'fraternite'],
  // Le pont où les croyants règlent entre eux leurs injustices et se
  // débarrassent de leurs rancunes avant d'entrer.
  'bukhari:6535': ['pardon', 'injustice', 'justice', 'colere', 'espoir'],
  // « Protégez-vous du Feu, même avec une demi-datte, sinon par une bonne
  // parole. » (cf. qudsi:13)
  'bukhari:6539': ['generosite', 'pauvrete', 'parole', 'espoir'],
  'bukhari:6540': ['generosite', 'pauvrete', 'parole'],
  'bukhari:6563': ['generosite', 'pauvrete', 'parole'],
  // La mère de Haritha, tué à Badr : « il est dans le plus haut Paradis ».
  // Le texte du deuil d'un enfant.
  'bukhari:6550': ['tristesse', 'mort', 'espoir', 'amour', 'patience'],
  'bukhari:6567': ['tristesse', 'mort', 'espoir', 'amour'],
  'bukhari:6568': ['tristesse', 'mort', 'espoir', 'amour'],
  // Sortir du Feu avec un atome de foi, et repousser comme une graine.
  // (cf. qudsi:36)
  'bukhari:6560': ['espoir', 'pardon', 'repentir'],
  // Le dernier à entrer au Paradis : Allah sourit et lui donne dix fois le monde.
  'bukhari:6571': ['espoir', 'pardon', 'humilite'],
  'bukhari:6573': ['espoir', 'pardon', 'peur'],
  // « Personne n'entrera au Paradis sans qu'on lui montre sa place au Feu, pour
  // qu'il soit plus reconnaissant. »
  'bukhari:6569': ['gratitude', 'espoir'],
  // « La personne la plus chanceuse à bénéficier de mon intercession : celle
  // qui aura dit l'attestation sincèrement, du fond du cœur. »
  'bukhari:6570': ['intention', 'espoir'],

  // — Bukhari 78 : Le bon comportement (Adab) —

  // L'action la plus aimée : la prière à l'heure, puis la bonté envers les parents.
  'bukhari:5970': ['fraternite', 'amour'],
  // « Ta mère », trois fois, puis « ton père ».
  'bukhari:5971': ['fraternite', 'amour'],
  // « Fais le jihad en prenant soin de tes parents. »
  'bukhari:5972': ['fraternite', 'amour', 'travail'],
  // Insulter le père d'un autre revient à insulter le sien.
  'bukhari:5973': ['parole', 'colere', 'fraternite'],
  // Les trois hommes enfermés dans la grotte : le lait offert aux parents, la
  // cousine épargnée, le salaire de l'ouvrier rendu multiplié.
  'bukhari:5974': ['confiance', 'intention', 'justice', 'travail', 'peur', 'fraternite'],
  // Interdits : ingratitude envers les mères, retenir ce qu'on doit, réclamer
  // ce qui ne revient pas, parler trop des autres, gaspiller.
  'bukhari:5975': ['justice', 'parole', 'argent', 'fraternite'],
  // Les plus grands péchés : l'association, le manque de respect aux parents,
  // le faux témoignage.
  'bukhari:5976': ['justice', 'parole', 'fraternite'],
  'bukhari:5977': ['justice', 'parole', 'fraternite'],
  // Asma et sa mère encore polythéiste : « oui, sois bonne envers ta mère ».
  'bukhari:5978': ['fraternite', 'amour', 'doute'],
  'bukhari:5979': ['fraternite', 'amour', 'doute'],
  // « Il nous ordonne la prière, l'aumône, la chasteté et de maintenir les
  // liens avec nos proches. »
  'bukhari:5980': ['fraternite', 'generosite'],
  // « Celui qui coupe les liens de parenté n'entrera pas au Paradis. »
  'bukhari:5984': ['fraternite', 'pardon', 'colere'],
  // « Qui veut plus de richesse et une vie plus longue, qu'il entretienne les
  // liens avec sa famille. »
  'bukhari:5985': ['fraternite', 'argent'],
  'bukhari:5986': ['fraternite', 'argent'],
  // Ar-Rahm : Allah garde le lien avec qui garde le lien.
  'bukhari:5987': ['fraternite', 'pardon', 'amour'],
  'bukhari:5988': ['fraternite', 'pardon', 'amour'],
  'bukhari:5989': ['fraternite', 'pardon', 'amour'],
  // « Celui qui maintient les liens n'est pas celui qui rend ce qu'on lui
  // donne, mais celui qui garde le lien avec ceux qui l'ont coupé. »
  'bukhari:5991': ['fraternite', 'pardon', 'patience', 'generosite'],
  // « Tu es devenu musulman avec toutes ces bonnes actions » — le passé compte.
  'bukhari:5992': ['espoir', 'repentir', 'generosite'],
  // La femme aux deux filles, à qui une seule datte a été donnée et qu'elle a
  // partagée : la protection contre le Feu.
  'bukhari:5995': ['generosite', 'pauvrete', 'amour', 'espoir'],
  // Le Prophète priant en portant sa petite-fille.
  'bukhari:5996': ['amour', 'humilite'],
  // « Celui qui n'est pas miséricordieux envers les autres ne recevra pas de
  // miséricorde. »
  'bukhari:5997': ['amour', 'pardon', 'fraternite'],
  'bukhari:6013': ['amour', 'pardon', 'fraternite'],
  'bukhari:5998': ['amour', 'fraternite'],
  // La captive qui allaite l'enfant retrouvé : « Allah est plus miséricordieux
  // envers Ses serviteurs que cette femme envers son enfant ».
  'bukhari:5999': ['amour', 'espoir', 'pardon', 'tristesse'],
  // La miséricorde en cent parts, dont une sur terre : la jument qui lève son
  // sabot pour ne pas blesser son petit.
  'bukhari:6000': ['amour', 'espoir', 'fraternite'],
  // Prendre soin d'un orphelin : « lui et moi comme ces deux doigts ».
  'bukhari:6005': ['generosite', 'fraternite', 'solitude', 'espoir'],
  // S'occuper d'une veuve et d'un pauvre vaut le combat dans la voie d'Allah.
  'bukhari:6006': ['generosite', 'pauvrete', 'solitude', 'travail'],
  'bukhari:6007': ['generosite', 'pauvrete', 'solitude'],
  // « Retournez auprès de vos familles » — il les savait inquiets pour elles.
  'bukhari:6008': ['fraternite', 'amour'],
  // L'homme qui donne à boire au chien assoiffé et à qui il est pardonné :
  // « il y a une récompense pour toute créature vivante ».
  'bukhari:6009': ['generosite', 'pardon', 'espoir'],
  // Le bédouin qui limite la miséricorde à deux personnes : « tu as limité
  // quelque chose de très vaste ».
  'bukhari:6010': ['espoir', 'pardon'],
  // « Les croyants sont comme un seul corps : si un membre souffre, tout le
  // corps partage l'insomnie et la fièvre. »
  'bukhari:6011': ['fraternite', 'amour', 'maladie', 'solitude'],
  // Planter : ce qu'en mangent les hommes et les bêtes compte comme aumône.
  'bukhari:6012': ['generosite', 'travail'],
  // Gabriel n'a cessé de recommander le voisin.
  'bukhari:6014': ['fraternite', 'generosite'],
  'bukhari:6015': ['fraternite', 'generosite'],
  // « Il ne croit pas, celui dont le voisin n'est pas à l'abri de son mal. »
  'bukhari:6016': ['fraternite', 'justice'],
  // « Qu'aucune voisine ne méprise le cadeau de sa voisine, même les sabots
  // d'une brebis. »
  'bukhari:6017': ['generosite', 'fraternite', 'pauvrete', 'humilite'],
  'bukhari:6018': ['fraternite', 'generosite', 'parole'],
  'bukhari:6019': ['generosite', 'fraternite', 'parole'],
  // « À quel voisin envoyer mes cadeaux ? — À celui dont la porte est la plus
  // proche. »
  'bukhari:6020': ['generosite', 'fraternite'],
  // « Encourager tout ce qui est bien est une aumône. »
  'bukhari:6021': ['generosite', 'parole'],
  // La chaîne de l'aumône quand on n'a rien : travailler, aider l'opprimé,
  // dire le bien, et au minimum s'abstenir de nuire. (cf. nawawi:26)
  'bukhari:6022': ['generosite', 'pauvrete', 'travail', 'parole', 'injustice'],
  'bukhari:6023': ['generosite', 'pauvrete', 'parole'],
  // « Allah aime qu'on soit doux et indulgent dans toutes les situations. »
  'bukhari:6024': ['colere', 'parole', 'patience', 'pardon'],
  'bukhari:6030': ['colere', 'parole', 'patience'],
  'bukhari:6395': ['colere', 'parole', 'patience'],
  'bukhari:6401': ['colere', 'parole', 'patience'],
  // Le bédouin qui urine dans la mosquée : ne pas l'interrompre, verser de l'eau.
  'bukhari:6025': ['colere', 'patience', 'pardon'],
  // « Le croyant est pour le croyant comme un bâtiment dont les parties se
  // soutiennent » ; et « aidez celui qui demande ».
  'bukhari:6026': ['fraternite', 'generosite', 'solitude', 'pauvrete'],
  'bukhari:6027': ['fraternite', 'generosite', 'solitude', 'pauvrete'],
  'bukhari:6028': ['generosite', 'pauvrete', 'fraternite'],
  // « Les meilleurs d'entre vous sont ceux qui ont le meilleur comportement. »
  'bukhari:6029': ['parole', 'fraternite', 'humilite'],
  'bukhari:6035': ['parole', 'fraternite', 'humilite'],
  // Il n'insultait pas, ne maudissait pas.
  'bukhari:6031': ['parole', 'colere'],
  'bukhari:6046': ['parole', 'colere'],
  // L'homme mal jugé à qui il parle poliment : « les pires sont ceux que les
  // gens évitent à cause de leur méchanceté ».
  'bukhari:6032': ['parole', 'fraternite', 'patience'],
  'bukhari:6054': ['parole', 'fraternite', 'patience'],
  'bukhari:6131': ['parole', 'fraternite', 'patience'],
  // La nuit de peur à Médine : « n'ayez pas peur, n'ayez pas peur ».
  'bukhari:6033': ['peur', 'generosite', 'fraternite'],
  'bukhari:6212': ['peur', 'fraternite'],
  // Il n'a jamais refusé de donner quand on lui demandait.
  'bukhari:6034': ['generosite'],
  // Le burda demandé alors qu'il en avait besoin : il le donne quand même.
  'bukhari:6036': ['generosite', 'humilite', 'mort'],
  // « L'avarice s'installera dans les cœurs et le harj augmentera. »
  'bukhari:6037': ['argent', 'injustice', 'sens'],
  // Dix ans de service sans un mot d'impatience.
  'bukhari:6038': ['patience', 'colere', 'travail', 'parole'],
  // Chez lui, il servait sa famille.
  'bukhari:6039': ['humilite', 'fraternite', 'travail'],
  // Quand Allah aime quelqu'un, Il le fait aimer du ciel puis de la terre.
  // (cf. qudsi:24)
  'bukhari:6040': ['amour', 'fraternite', 'solitude'],
  // « Personne ne goûtera la douceur de la foi tant qu'il n'aimera pas
  // quelqu'un uniquement pour Allah. »
  'bukhari:6041': ['amour', 'intention', 'fraternite'],
  // Le sang, les biens et l'honneur rendus sacrés les uns pour les autres.
  'bukhari:6043': ['justice', 'injustice', 'parole'],
  // « Insulter un musulman est une mauvaise action. »
  'bukhari:6044': ['parole', 'colere'],
  // Traiter quelqu'un de pervers : l'accusation retombe sur l'accusateur.
  'bukhari:6045': ['parole', 'colere', 'injustice'],
  'bukhari:6103': ['parole', 'colere'],
  'bukhari:6104': ['parole', 'colere'],
  // Maudire un croyant équivaut à le tuer.
  // (Le hadith mentionne aussi le suicide ; non tagué `mort` à dessein.)
  'bukhari:6047': ['parole', 'colere'],
  'bukhari:6105': ['parole', 'colere'],
  // L'homme dont le visage a enflé de colère : « je connais une parole qui le
  // calmerait ».
  'bukhari:6048': ['colere', 'parole'],
  'bukhari:6115': ['colere', 'parole'],
  // La dispute qui fait retirer la connaissance de la Nuit du Destin.
  'bukhari:6049': ['colere', 'nuit'],
  // Abu Dhar qui insulte la mère d'un homme : « tu as encore des traits de
  // l'ignorance » ; nourrir et habiller son serviteur de ce qu'on a.
  'bukhari:6050': ['parole', 'orgueil', 'justice', 'travail', 'fraternite'],
  // La prière raccourcie et Dhul-Yadain : reconnaître son oubli devant tous.
  'bukhari:6051': ['humilite', 'doute'],
  // Les deux punis dans leurs tombes, dont l'un colportait des rumeurs.
  'bukhari:6052': ['parole'],
  'bukhari:6055': ['parole'],
  // « Celui qui colporte des rumeurs n'entrera pas au Paradis. »
  'bukhari:6056': ['parole'],
  // « Qui ne renonce pas au mensonge et aux paroles blessantes… »
  'bukhari:6057': ['parole', 'intention'],
  // « Les pires sont ceux qui ont deux visages. »
  'bukhari:6058': ['parole', 'intention'],
  // L'accusation blessante et la réponse : « Moïse a subi pire, et il a patienté ».
  'bukhari:6059': ['colere', 'patience', 'injustice', 'parole'],
  'bukhari:6100': ['colere', 'patience', 'injustice', 'parole'],
  'bukhari:6336': ['colere', 'patience', 'injustice'],
  // L'éloge excessif : « tu as coupé le cou de ton ami ».
  'bukhari:6060': ['parole', 'orgueil'],
  'bukhari:6061': ['parole', 'orgueil'],
  'bukhari:6162': ['parole', 'orgueil'],
  // L'izar d'Abu Bakr qui tombe : « tu ne fais pas partie de ceux qui le font
  // par orgueil ».
  'bukhari:6062': ['orgueil', 'intention', 'doute'],
  // « Méfiez-vous des soupçons… ne vous enviez pas, ne vous détestez pas, soyez
  // frères. » (cf. nawawi:35)
  'bukhari:6064': ['jalousie', 'fraternite', 'colere', 'parole', 'doute'],
  'bukhari:6066': ['jalousie', 'fraternite', 'colere', 'parole', 'doute'],
  // Idem, avec l'interdiction de couper les liens plus de trois jours.
  'bukhari:6065': ['jalousie', 'fraternite', 'colere', 'pardon'],
  'bukhari:6076': ['jalousie', 'fraternite', 'colere', 'pardon'],
  'bukhari:6077': ['pardon', 'fraternite', 'colere'],
  // « Tous les péchés de mes compagnons seront pardonnés, sauf de ceux qui les
  // exposent » — Allah avait couvert, il se découvre lui-même.
  'bukhari:6069': ['repentir', 'pardon', 'parole', 'humilite'],
  // An-Najwa : Allah fait avouer, puis : « Je les ai cachés pour toi, et
  // aujourd'hui Je te les pardonne ».
  'bukhari:6070': ['pardon', 'repentir', 'espoir'],
  // Les gens du Paradis : simples, modestes, peu reconnus ; ceux du Feu : durs,
  // orgueilleux, arrogants. (cf. qudsi:39)
  'bukhari:6071': ['humilite', 'orgueil', 'pauvrete', 'espoir'],
  // N'importe quelle servante pouvait le prendre par la main.
  'bukhari:6072': ['humilite', 'fraternite'],
  // `Aisha et Ibn Az-Zubair : le vœu de rupture, les larmes, la réconciliation
  // et l'expiation. Le texte de la brouille familiale qui dure.
  'bukhari:6073': ['pardon', 'colere', 'fraternite', 'tristesse', 'repentir'],
  'bukhari:6074': ['pardon', 'colere', 'fraternite', 'tristesse', 'repentir'],
  'bukhari:6075': ['pardon', 'colere', 'fraternite', 'tristesse', 'repentir'],
  // « Je sais si tu es en colère ou satisfaite » — la douceur conjugale.
  'bukhari:6078': ['colere', 'amour'],
  // Il rendait visite le matin et le soir chez Abu Bakr.
  'bukhari:6079': ['fraternite', 'matin'],
  // Il partage un repas chez des Ansar et invoque la bénédiction pour ses hôtes.
  'bukhari:6080': ['generosite', 'fraternite'],
  // La fraternisation entre Ansar et Muhajirun.
  'bukhari:6082': ['fraternite'],
  'bukhari:6083': ['fraternite'],
  // Les femmes qui se couvrent à l'arrivée de `Umar, et le sourire du Prophète.
  'bukhari:6085': ['peur', 'humilite'],
  // L'homme qui a rompu son jeûne : le panier de dattes lui revient car il est
  // le plus pauvre ; le Prophète sourit.
  'bukhari:6087': ['repentir', 'pauvrete', 'espoir', 'generosite', 'pardon'],
  'bukhari:6164': ['repentir', 'pauvrete', 'espoir', 'generosite', 'pardon'],
  // Le bédouin qui tire violemment sur son manteau : il sourit et ordonne qu'on
  // lui donne.
  'bukhari:6088': ['colere', 'patience', 'generosite'],
  // Jarir : il l'accueillait toujours avec un sourire.
  'bukhari:6089': ['fraternite', 'amour', 'confiance'],
  'bukhari:6090': ['fraternite', 'amour', 'confiance'],
  // Il ne riait jamais aux éclats, il souriait.
  'bukhari:6092': ['humilite'],
  // « La véracité mène à la droiture… le mensonge mène à la perversité. »
  'bukhari:6094': ['parole', 'intention'],
  // Les trois signes de l'hypocrite : mentir, ne pas tenir sa promesse, trahir.
  'bukhari:6095': ['parole', 'intention', 'injustice'],
  // Le menteur dont la joue est déchirée.
  'bukhari:6096': ['parole'],
  // « Personne n'est plus patient qu'Allah face aux paroles blessantes. »
  'bukhari:6099': ['patience', 'parole', 'gratitude'],
  // Le Prophète plus pudique qu'une jeune fille.
  'bukhari:6102': ['humilite'],
  'bukhari:6119': ['humilite'],
  // « Le fort n'est pas celui qui l'emporte par sa force, mais celui qui sait
  // se maîtriser dans la colère. »
  'bukhari:6114': ['colere', 'patience'],
  // « Ne te mets pas en colère », répété. (cf. nawawi:16)
  'bukhari:6116': ['colere', 'patience'],
  // « La pudeur n'apporte que du bien. »
  'bukhari:6117': ['humilite'],
  // « La pudeur fait partie de la foi. »
  'bukhari:6118': ['humilite'],
  // « Si tu n'as pas honte, fais ce que tu veux. » (cf. nawawi:20)
  'bukhari:6120': ['humilite', 'repentir'],
  // Ibn `Umar, jeune, n'ose pas répondre devant les anciens.
  'bukhari:6122': ['humilite', 'doute'],
  'bukhari:6144': ['humilite', 'doute'],
  // « Facilitez la vie aux gens, ne leur compliquez pas les choses, annoncez-
  // leur de bonnes nouvelles. »
  'bukhari:6124': ['espoir', 'fraternite', 'patience'],
  'bukhari:6125': ['espoir', 'fraternite', 'patience'],
  'bukhari:6128': ['espoir', 'patience', 'colere'],
  // Il choisissait toujours la voie la plus facile, et ne se vengeait jamais
  // pour lui-même.
  'bukhari:6126': ['pardon', 'colere', 'patience', 'humilite'],
  // Abu Barza interrompt sa prière pour son cheval : la douceur du Prophète.
  'bukhari:6127': ['patience', 'doute'],
  // Il jouait avec le petit frère d'Anas et son oiseau.
  'bukhari:6129': ['amour', 'fraternite'],
  'bukhari:6203': ['amour', 'fraternite', 'humilite'],
  // Il appelait les amies de `Aisha pour qu'elles jouent avec elle.
  'bukhari:6130': ['amour', 'solitude'],
  // Le manteau mis de côté pour Makhrama, au caractère difficile.
  'bukhari:6132': ['generosite', 'patience', 'fraternite'],
  // « Un croyant ne se fait pas piquer deux fois par le même trou. »
  'bukhari:6133': ['doute', 'patience'],
  // « Ton corps a des droits sur toi, tes yeux, ton invité, ta femme. »
  // Le hadith de l'excès de zèle et de l'épuisement.
  'bukhari:6134': ['travail', 'patience', 'maladie', 'fraternite', 'humilite'],
  'bukhari:6139': ['travail', 'patience', 'fraternite', 'humilite', 'nuit'],
  // Le droit de l'invité, sans le mettre en difficulté.
  'bukhari:6135': ['generosite', 'fraternite', 'parole'],
  'bukhari:6136': ['generosite', 'fraternite', 'parole'],
  'bukhari:6138': ['generosite', 'fraternite', 'parole'],
  // Si l'hôte ne vous accueille pas, prenez votre droit d'invité.
  'bukhari:6137': ['generosite', 'fraternite', 'justice'],
  // Abu Bakr furieux contre son fils à cause des invités, puis : « la première
  // colère venait de Satan ».
  'bukhari:6140': ['colere', 'generosite', 'pardon', 'fraternite'],
  'bukhari:6141': ['colere', 'generosite', 'pardon', 'fraternite'],
  // L'affaire d'`Abdullah bin Sahl : faute de preuve, le Prophète paie
  // lui-même le prix du sang.
  'bukhari:6142': ['justice', 'injustice', 'generosite'],
  'bukhari:6143': ['justice', 'injustice', 'generosite'],
  // « Certains poèmes contiennent de la sagesse. »
  'bukhari:6145': ['parole'],
  // « Tout sauf Allah est voué à disparaître. »
  'bukhari:6147': ['sens', 'mort'],
  // Anjasha et « les récipients fragiles » : la douceur envers les plus faibles.
  'bukhari:6149': ['amour', 'patience'],
  'bukhari:6161': ['amour', 'patience'],
  'bukhari:6202': ['amour', 'patience'],
  'bukhari:6209': ['amour', 'patience'],
  'bukhari:6210': ['amour', 'patience'],
  'bukhari:6211': ['amour', 'patience'],
  // Hassan défendait le Prophète : « ne l'insulte pas ».
  'bukhari:6150': ['parole', 'fraternite'],
  // « Sois juste ! — Qui serait juste si je ne le suis pas ? » et le refus de
  // tuer l'insolent.
  'bukhari:6163': ['justice', 'colere', 'patience', 'injustice'],
  // Le bédouin qui paie la zakat de ses chameaux : « continue ainsi, Allah ne
  // laissera pas tes bonnes actions se perdre ».
  'bukhari:6165': ['generosite', 'espoir', 'travail', 'confiance'],
  // « Ne devenez pas mécréants après moi en vous entre-tuant. »
  'bukhari:6166': ['colere', 'fraternite', 'injustice'],
  // « Qu'as-tu préparé pour l'Heure ? — Je n'ai rien préparé, mais j'aime Allah
  // et Son Messager. — Tu seras avec ceux que tu aimes. » Le grand texte de
  // celui qui se sent indigne.
  'bukhari:6167': ['amour', 'espoir', 'repentir', 'doute'],
  'bukhari:6168': ['amour', 'espoir'],
  'bukhari:6169': ['amour', 'espoir', 'repentir', 'doute'],
  'bukhari:6170': ['amour', 'espoir', 'repentir', 'doute'],
  'bukhari:6171': ['amour', 'espoir', 'repentir', 'doute'],
  // Le drapeau du traître, dressé et nommé.
  'bukhari:6177': ['injustice', 'parole'],
  'bukhari:6178': ['injustice', 'parole'],
  // « Ne dites pas : mon âme est mauvaise. » Ne pas se maudire soi-même.
  'bukhari:6179': ['parole', 'repentir', 'tristesse'],
  'bukhari:6180': ['parole', 'repentir', 'tristesse'],
  // « Les fils d'Adam insultent le Temps, or c'est Moi le Temps. » (cf. qudsi:4)
  'bukhari:6181': ['confiance', 'colere', 'patience'],
  'bukhari:6182': ['confiance', 'colere', 'patience'],
  // « Al-Karm, c'est le cœur du croyant. »
  'bukhari:6183': ['generosite', 'humilite'],
  // Le nom le plus détesté : « roi des rois ».
  'bukhari:6205': ['orgueil', 'humilite'],
  'bukhari:6206': ['orgueil', 'humilite'],
  // Sa`d intercède pour `Abdullah bin Ubai : « pardonne-lui et excuse-le » ; la
  // patience devant les vexations.
  'bukhari:6207': ['pardon', 'patience', 'colere', 'injustice'],
  // Les devins « ne sont rien » : cent mensonges pour une parole volée.
  'bukhari:6213': ['doute', 'parole', 'confiance'],
  // La nuit chez Maymuna : le dernier tiers, le regard vers le ciel.
  'bukhari:6215': ['nuit'],
  // `Uthman à qui on annonce le Paradis et une épreuve : « c'est à Allah seul
  // que je demande de l'aide face à cette épreuve ».
  'bukhari:6216': ['patience', 'confiance', 'espoir', 'peur'],
  // « Continuez à faire de bonnes actions, car chacun trouvera facile ce qui le
  // mènera à sa destination. »
  'bukhari:6217': ['travail', 'confiance', 'doute', 'mort'],
  // La nuit : « combien de trésors révélés, combien d'épreuves descendues ! Qui
  // ira réveiller les dormeuses ? »
  'bukhari:6218': ['nuit', 'patience', 'sens'],
  // « Satan circule dans le corps du fils d'Adam comme le sang » — couper court
  // au soupçon avant qu'il ne naisse.
  'bukhari:6219': ['doute', 'parole', 'jalousie'],

  // — Bukhari 80 : Les invocations —

  // Chaque prophète a une invocation exaucée ; il garde la sienne pour
  // intercéder en faveur des siens.
  'bukhari:6304': ['espoir', 'amour'],
  'bukhari:6305': ['espoir', 'amour'],
  // Sayyid al-Istighfar : « Tu es mon Seigneur… pardonne-moi, car nul ne
  // pardonne les péchés sauf Toi. »
  'bukhari:6306': ['repentir', 'pardon', 'confiance', 'espoir'],
  'bukhari:6323': ['repentir', 'pardon', 'confiance', 'espoir'],
  // « Je demande pardon à Allah plus de soixante-dix fois par jour. »
  'bukhari:6307': ['repentir', 'pardon', 'humilite'],
  // Le croyant voit ses péchés comme une montagne ; et la joie d'Allah au
  // repentir de Son serviteur, plus grande que celle de l'homme qui retrouve sa
  // monture perdue dans le désert.
  'bukhari:6308': ['repentir', 'pardon', 'espoir', 'peur'],
  'bukhari:6309': ['repentir', 'pardon', 'espoir'],
  // Onze rak`at dans la dernière partie de la nuit.
  'bukhari:6310': ['nuit'],
  // L'invocation du coucher : « je remets mon affaire entre Tes mains… il n'y a
  // de refuge que vers Toi ».
  'bukhari:6311': ['nuit', 'confiance', 'peur', 'mort'],
  'bukhari:6313': ['nuit', 'confiance', 'mort'],
  'bukhari:6315': ['nuit', 'confiance', 'mort'],
  // « En Ton nom je meurs et je vis » ; au réveil : « louange à Allah qui nous
  // a redonné la vie ».
  'bukhari:6312': ['nuit', 'matin', 'gratitude', 'mort'],
  'bukhari:6314': ['nuit', 'matin', 'gratitude', 'mort'],
  'bukhari:6324': ['nuit', 'matin', 'gratitude', 'mort'],
  'bukhari:6325': ['nuit', 'matin', 'gratitude', 'mort'],
  // « Ô Allah, mets de la lumière dans mon cœur, dans ma vue, dans mon ouïe… »
  'bukhari:6316': ['nuit', 'confiance', 'espoir'],
  // L'invocation du lever de nuit : « à Toi la louange… pardonne-moi ce que
  // j'ai fait avant et après, ce que j'ai caché et ce que j'ai montré ».
  'bukhari:6317': ['nuit', 'repentir', 'pardon', 'confiance'],
  // Fatima demande un serviteur ; on lui enseigne le tasbih du coucher :
  // « c'est mieux pour vous qu'un serviteur ».
  'bukhari:6318': ['nuit', 'travail', 'pauvrete', 'patience'],
  // Les deux sourates de protection soufflées dans les mains avant de dormir.
  'bukhari:6319': ['nuit', 'peur', 'confiance'],
  // « Si Tu retiens mon âme, fais-lui miséricorde ; si Tu la laisses, protège-la. »
  'bukhari:6320': ['nuit', 'confiance', 'mort', 'peur'],
  // La descente au dernier tiers de la nuit : « qui M'invoque pour que Je lui
  // réponde ? » Le hadith de l'insomnie. (cf. qudsi:35)
  'bukhari:6321': ['nuit', 'confiance', 'espoir', 'solitude', 'pardon'],
  // Abu Bakr : « Ô Allah, je me suis fait beaucoup de tort à moi-même. »
  'bukhari:6326': ['repentir', 'pardon', 'humilite', 'confiance'],
  // Les pauvres compagnons à qui les riches semblent avoir tout pris : le dhikr
  // après chaque prière comme égaliseur. (cf. nawawi:25)
  'bukhari:6329': ['pauvrete', 'jalousie', 'argent', 'espoir', 'gratitude'],
  // « Nul ne peut empêcher ce que Tu donnes, ni donner ce que Tu retiens. »
  'bukhari:6330': ['confiance', 'gratitude'],
  // « Demandez avec détermination, sans dire : si Tu veux. »
  'bukhari:6338': ['confiance', 'espoir', 'doute'],
  'bukhari:6339': ['confiance', 'espoir', 'doute'],
  // « L'invocation est exaucée tant qu'on ne s'impatiente pas en disant :
  // j'ai invoqué et rien n'est venu. »
  'bukhari:6340': ['confiance', 'patience', 'espoir', 'doute'],
  // L'invocation pour la pluie, exaucée puis modérée.
  'bukhari:6342': ['confiance', 'espoir', 'gratitude'],
  'bukhari:6093': ['confiance', 'espoir', 'gratitude'],
  // L'invocation des moments de détresse : « La ilaha illa-llah al-`Azim,
  // al-Halim… »
  'bukhari:6345': ['peur', 'confiance', 'patience', 'espoir'],
  'bukhari:6346': ['peur', 'confiance', 'patience', 'espoir'],
  // Protection contre les moments difficiles de l'épreuve, la destruction
  // soudaine, la mauvaise fin, la joie malveillante des ennemis.
  'bukhari:6347': ['peur', 'confiance', 'patience', 'injustice'],
  // Les derniers mots : « Ô Allah, avec les plus hauts compagnons. »
  'bukhari:6348': ['mort', 'tristesse', 'espoir'],
  // Khabbab, marqué par sept brûlures : « s'il ne nous l'avait pas interdit,
  // j'aurais demandé la mort ».
  // ⚠️ Non tagué `mort` : servi à quelqu'un en détresse, ce serait ambigu.
  'bukhari:6349': ['maladie', 'patience'],
  'bukhari:6350': ['maladie', 'patience'],
  // « Qu'aucun de vous ne souhaite la mort à cause d'un malheur ; qu'il dise :
  // fais-moi vivre tant que la vie est meilleure pour moi. »
  // ⚠️ Le texte central sur le désir de mourir face au malheur. Rattaché à la
  // patience et à l'espoir, jamais à `mort`.
  'bukhari:6351': ['patience', 'espoir', 'confiance', 'maladie'],
  // L'enfant malade sur qui il passe la main et invoque.
  'bukhari:6352': ['maladie', 'confiance', 'espoir'],
  // Protection contre le châtiment de la tombe.
  'bukhari:6364': ['peur', 'mort'],
  'bukhari:6366': ['peur', 'mort'],
  // « Contre les soucis et la tristesse, l'incapacité et la paresse, l'avarice
  // et la lâcheté, le poids des dettes et la domination des hommes. »
  // L'invocation la plus directement utile à qui va mal.
  'bukhari:6363': ['tristesse', 'peur', 'argent', 'travail', 'injustice', 'confiance'],
  'bukhari:6369': ['tristesse', 'peur', 'argent', 'travail', 'injustice', 'confiance'],
  // Protection contre l'avarice, la lâcheté, la vieillesse, les épreuves.
  'bukhari:6365': ['peur', 'argent', 'maladie', 'confiance'],
  'bukhari:6370': ['peur', 'argent', 'maladie', 'confiance'],
  'bukhari:6374': ['peur', 'argent', 'maladie', 'confiance'],
  'bukhari:6390': ['peur', 'argent', 'maladie', 'confiance'],
  'bukhari:6367': ['peur', 'maladie', 'mort', 'confiance'],
  'bukhari:6371': ['peur', 'argent', 'maladie', 'confiance'],
  // « Efface mes péchés avec l'eau, la neige et la grêle… contre l'épreuve de
  // la richesse et l'épreuve de la pauvreté. »
  'bukhari:6368': ['repentir', 'pardon', 'argent', 'pauvrete', 'peur', 'confiance'],
  'bukhari:6375': ['repentir', 'pardon', 'argent', 'pauvrete', 'peur', 'confiance'],
  'bukhari:6376': ['peur', 'argent', 'pauvrete', 'confiance'],
  'bukhari:6377': ['repentir', 'pardon', 'peur', 'pauvrete', 'argent', 'confiance'],
  // Sa`d malade et proche de la mort : « laisser tes héritiers riches vaut
  // mieux que de les laisser pauvres à demander ».
  'bukhari:6373': ['maladie', 'mort', 'argent', 'generosite', 'fraternite'],
  // L'istikhara : « Ô Allah, si cette affaire est un bien pour moi, décrète-la ;
  // sinon, détourne-la de moi. » Le texte du choix difficile.
  'bukhari:6382': ['doute', 'confiance', 'travail'],
  // « Soyez doux avec vous-mêmes : vous n'invoquez pas un sourd ni un absent. »
  // Et « la hawla wa la quwwata illa billah », trésor du Paradis.
  'bukhari:6384': ['confiance', 'espoir', 'solitude', 'humilite'],
  'bukhari:6409': ['confiance', 'espoir', 'solitude', 'humilite'],
  // Le retour de voyage : « repentants, adorateurs, louant notre Seigneur ».
  'bukhari:6385': ['repentir', 'gratitude'],
  'bukhari:6185': ['repentir', 'gratitude'],
  // « Qu'Allah te bénisse dans ton mariage. »
  'bukhari:6386': ['amour', 'fraternite'],
  // Jabir qui épouse une femme mûre pour s'occuper de ses sœurs orphelines.
  'bukhari:6387': ['amour', 'generosite', 'fraternite', 'mort'],
  // « Ô Allah, accorde-nous le bien ici-bas et le bien dans l'au-delà. »
  // L'invocation la plus répétée.
  'bukhari:6389': ['espoir', 'confiance', 'gratitude', 'sens'],
  // « Si je venais à insulter un croyant, fais que cela lui soit un moyen de se
  // rapprocher de Toi. »
  'bukhari:6361': ['parole', 'pardon', 'justice'],
  // Les Qurra tués : la tristesse du Prophète et le qunut d'un mois.
  'bukhari:6394': ['tristesse', 'mort', 'colere'],
  // « Ô Allah, guide la tribu de Daus » au lieu de l'invocation contre eux.
  'bukhari:6397': ['pardon', 'colere', 'espoir'],
  // « Pardonne-moi mes fautes, mon ignorance, mes excès… mes plaisanteries et
  // mon sérieux, mes erreurs et mes actes délibérés. »
  'bukhari:6398': ['repentir', 'pardon', 'humilite'],
  'bukhari:6399': ['repentir', 'pardon', 'humilite'],
  // Le moment du vendredi où l'invocation est exaucée.
  'bukhari:6400': ['espoir', 'confiance'],
  // Le « Amin » qui coïncide avec celui des anges : les péchés pardonnés.
  'bukhari:6402': ['pardon', 'espoir'],
  // Cent fois le tahlil : cent bonnes actions, cent péchés effacés, une
  // protection jusqu'au soir.
  'bukhari:6403': ['pardon', 'espoir', 'matin', 'peur'],
  'bukhari:6404': ['pardon', 'espoir'],
  // « Subhan Allah wa bihamdihi cent fois : les péchés pardonnés, seraient-ils
  // aussi nombreux que l'écume de la mer. »
  'bukhari:6405': ['pardon', 'repentir', 'espoir'],
  // « Deux expressions légères sur la langue, lourdes dans la balance. »
  'bukhari:6406': ['gratitude', 'parole', 'espoir'],
  // Celui qui loue son Seigneur et celui qui ne le fait pas : le vivant et le mort.
  'bukhari:6407': ['gratitude', 'sens'],
  // Les anges des assemblées de rappel : même celui qui n'a fait que passer est
  // pardonné. (cf. qudsi:14)
  'bukhari:6408': ['fraternite', 'pardon', 'solitude', 'espoir', 'peur'],
  // Les rappels espacés « de peur que nous ne nous lassions ».
  'bukhari:6411': ['patience', 'humilite'],

  // — Muslim 48 : Rappel d'Allah, invocation et repentir —

  // « Je suis proche de la pensée que Mon serviteur a de Moi… s'il vient en
  // marchant, Je viens en courant. » (cf. qudsi:15)
  'muslim:6805': ['confiance', 'espoir', 'amour', 'solitude', 'repentir'],
  'muslim:6807': ['confiance', 'espoir', 'amour', 'solitude'],
  'muslim:6829': ['confiance', 'espoir', 'solitude'],
  'muslim:6830': ['confiance', 'espoir', 'amour', 'solitude'],
  'muslim:6832': ['confiance', 'espoir', 'amour', 'solitude', 'repentir'],
  // Les Mufarradun : ceux et celles qui se rappellent beaucoup d'Allah.
  'muslim:6808': ['solitude', 'espoir'],
  // « Demandez avec détermination, sans dire : si Tu veux. »
  'muslim:6811': ['confiance', 'espoir', 'doute'],
  'muslim:6812': ['confiance', 'espoir', 'doute'],
  'muslim:6813': ['confiance', 'espoir', 'doute'],
  // « Qu'aucun de vous ne demande la mort à cause des difficultés… qu'il dise :
  // fais-moi vivre tant que la vie est un bien pour moi. »
  // ⚠️ Rattaché à la patience et à l'espoir, jamais à `mort`.
  'muslim:6814': ['patience', 'espoir', 'confiance'],
  'muslim:6816': ['patience', 'espoir'],
  'muslim:6817': ['maladie', 'patience'],
  // « Ne demandez pas la mort et ne l'appelez pas avant qu'elle ne vienne ; la
  // vie du croyant n'est prolongée que pour le bien. »
  'muslim:6819': ['patience', 'espoir', 'sens'],
  // « Celui qui aime rencontrer Allah… » avec l'explication de `Aisha : il
  // s'agit de l'agonie, pas de l'aversion naturelle pour la mort.
  'muslim:6820': ['mort', 'espoir', 'amour'],
  'muslim:6822': ['mort', 'peur', 'espoir', 'amour'],
  'muslim:6824': ['mort', 'espoir', 'amour'],
  'muslim:6826': ['mort', 'peur', 'espoir', 'amour'],
  'muslim:6828': ['mort', 'espoir', 'amour'],
  // « Une bonne action vaut dix… et qui Me rencontre avec des péchés remplissant
  // la terre, sans rien M'associer, Je le rencontre avec autant de pardon. »
  'muslim:6833': ['pardon', 'espoir', 'repentir'],
  // Le malade devenu faible comme un poussin, qui demandait à être puni
  // ici-bas : « tu n'as pas la force d'endurer Son châtiment ». On lui apprend
  // à demander le bien des deux mondes.
  'muslim:6835': ['maladie', 'repentir', 'espoir', 'peur', 'confiance'],
  'muslim:6837': ['maladie', 'repentir', 'peur'],
  // Les anges qui cherchent les assemblées de rappel ; le passant pardonné :
  // « ce sont des gens dont la compagnie n'apporte que du bien ».
  'muslim:6839': ['fraternite', 'pardon', 'solitude', 'espoir'],
  // « Notre Seigneur, accorde-nous le bien ici-bas et dans l'au-delà. »
  'muslim:6840': ['espoir', 'confiance', 'sens'],
  'muslim:6841': ['espoir', 'confiance', 'sens'],
  // Cent fois le tahlil et le tasbih : péchés effacés, protection jusqu'au soir.
  'muslim:6842': ['pardon', 'espoir', 'matin'],
  'muslim:6843': ['pardon', 'espoir', 'matin'],
  // « Deux expressions légères sur la langue, lourdes dans la balance. »
  'muslim:6846': ['gratitude', 'parole', 'espoir'],
  'muslim:6847': ['gratitude', 'parole'],
  // Le bédouin : « tout cela glorifie mon Seigneur, mais qu'en est-il de moi ? »
  // — « Ô Allah, pardonne-moi, fais-moi miséricorde, guide-moi et accorde-moi
  // ma subsistance. »
  'muslim:6848': ['repentir', 'pardon', 'doute', 'pauvrete', 'confiance'],
  'muslim:6849': ['repentir', 'pardon', 'doute', 'pauvrete', 'confiance'],
  'muslim:6850': ['repentir', 'pardon', 'doute', 'pauvrete', 'confiance'],
  'muslim:6851': ['repentir', 'pardon', 'pauvrete', 'confiance', 'espoir'],
  // Mille bonnes actions par jour : cent tasbih.
  'muslim:6852': ['espoir', 'pardon'],
  // « Qui soulage un frère d'une difficulté… Allah aide le serviteur tant que
  // celui-ci aide son frère. » (cf. nawawi:36)
  'muslim:6853': ['generosite', 'fraternite', 'tristesse', 'pardon', 'espoir', 'pauvrete'],
  // Le cercle assis « pour se souvenir d'Allah », dont Allah parle aux anges.
  'muslim:6857': ['fraternite', 'solitude', 'espoir', 'intention'],
  // « Il y a parfois comme un voile sur mon cœur, et je demande pardon cent
  // fois par jour. »
  'muslim:6858': ['repentir', 'pardon', 'humilite', 'tristesse'],
  'muslim:6859': ['repentir', 'pardon', 'humilite'],
  // « Celui qui se repent avant que le soleil ne se lève de l'ouest, Allah lui
  // accorde Sa miséricorde. » La porte reste ouverte.
  'muslim:6861': ['repentir', 'pardon', 'espoir'],
  // « Vous invoquez Celui qui entend tout, qui est proche et qui est avec
  // vous » ; « la hawla wa la quwwata illa billah ».
  'muslim:6862': ['confiance', 'espoir', 'solitude', 'humilite'],
  'muslim:6864': ['confiance', 'espoir', 'solitude', 'humilite'],
  'muslim:6867': ['confiance', 'solitude', 'espoir'],
  'muslim:6868': ['confiance', 'espoir'],
  // Abu Bakr : « je me suis fait beaucoup de tort à moi-même ; nul ne pardonne
  // les péchés sauf Toi ».
  'muslim:6869': ['repentir', 'pardon', 'humilite', 'confiance'],
  'muslim:6870': ['repentir', 'pardon', 'humilite'],
  // « Contre l'épreuve de la richesse et l'épreuve de la pauvreté… lave mes
  // péchés avec l'eau, la neige et la grêle. »
  'muslim:6871': ['repentir', 'pardon', 'argent', 'pauvrete', 'peur', 'confiance'],
  // Contre l'incapacité, la paresse, la lâcheté, la vieillesse, l'avarice.
  'muslim:6873': ['peur', 'argent', 'maladie', 'mort', 'confiance'],
  'muslim:6875': ['peur', 'argent', 'confiance'],
  'muslim:6876': ['peur', 'argent', 'maladie', 'confiance'],
  // Contre le mal du décret, la misère, la moquerie des ennemis, les grandes
  // épreuves.
  'muslim:6877': ['peur', 'patience', 'injustice', 'pauvrete', 'confiance'],
  // « Je cherche refuge dans la Parole parfaite d'Allah contre le mal de ce
  // qu'Il a créé » : rien ne pourra lui nuire à cet endroit.
  'muslim:6878': ['peur', 'confiance'],
  'muslim:6880': ['peur', 'confiance', 'maladie'],
  // L'invocation du coucher : « je remets mon affaire entre Tes mains, avec
  // espoir en Toi et crainte de Toi ».
  'muslim:6882': ['nuit', 'confiance', 'peur', 'espoir', 'mort'],
  'muslim:6883': ['nuit', 'confiance', 'espoir'],
  'muslim:6884': ['nuit', 'confiance', 'peur', 'mort'],
  'muslim:6885': ['nuit', 'confiance', 'espoir', 'mort'],
  // « En Ton nom je vis et je meurs » ; au réveil, la louange.
  'muslim:6887': ['nuit', 'matin', 'gratitude', 'mort'],
  // « Tu as créé mon âme et c'est à Toi de la reprendre… si Tu la fais mourir,
  // pardonne-lui. »
  'muslim:6888': ['nuit', 'confiance', 'mort', 'pardon'],
  // « Tu es le Premier, rien n'est avant Toi… débarrasse-nous de nos dettes et
  // libère-nous du besoin. »
  'muslim:6889': ['nuit', 'confiance', 'argent', 'pauvrete', 'peur'],
  'muslim:6890': ['nuit', 'confiance', 'peur'],
  // Fatima venue demander un serviteur.
  'muslim:6891': ['nuit', 'travail', 'pauvrete', 'confiance'],
  'muslim:6915': ['nuit', 'travail', 'pauvrete', 'patience', 'humilite'],
  'muslim:6917': ['nuit', 'patience'],
  // « Si Tu retiens mon âme, pardonne-lui ; si Tu la laisses, protège-la. »
  'muslim:6892': ['nuit', 'confiance', 'mort', 'pardon'],
  'muslim:6893': ['nuit', 'confiance', 'pardon'],
  // « Louange à Allah qui nous a nourris, abreuvés et abrités, car beaucoup
  // n'ont personne pour les aider ni les abriter. »
  'muslim:6894': ['gratitude', 'nuit', 'pauvrete', 'solitude'],
  // « Contre le mal de ce que j'ai fait et de ce que je n'ai pas fait. »
  'muslim:6895': ['repentir', 'peur', 'confiance'],
  'muslim:6896': ['repentir', 'peur', 'confiance'],
  'muslim:6898': ['repentir', 'peur', 'confiance'],
  // « C'est à Toi que je me soumets… Tu es le Vivant qui ne meurt jamais. »
  'muslim:6899': ['confiance', 'repentir', 'peur', 'mort'],
  // L'invocation du départ au matin.
  'muslim:6900': ['matin', 'confiance', 'gratitude', 'patience'],
  // « Pardonne-moi mes fautes, mon ignorance, mes excès… ce que j'ai fait en
  // secret et en public. »
  'muslim:6901': ['repentir', 'pardon', 'humilite'],
  // « Améliore ma religion, ma vie d'ici-bas où est ma subsistance, mon
  // au-delà ; fais de la vie une abondance de bien et de la mort un
  // soulagement de tout mal. »
  'muslim:6903': ['confiance', 'espoir', 'sens', 'mort', 'travail'],
  // « Je Te demande la bonne direction, la protection contre le mal, la
  // chasteté et l'indépendance. »
  'muslim:6904': ['doute', 'confiance', 'pauvrete', 'humilite'],
  // « Accorde à mon âme la piété et purifie-la… contre le cœur qui ne craint
  // pas, l'âme jamais satisfaite et l'invocation non exaucée. »
  'muslim:6906': ['repentir', 'peur', 'argent', 'maladie', 'confiance', 'gratitude'],
  // L'invocation du soir : « je Te demande le bien de cette nuit… contre la
  // paresse et le mal de l'orgueil ».
  'muslim:6907': ['nuit', 'confiance', 'orgueil', 'peur'],
  'muslim:6908': ['nuit', 'matin', 'confiance', 'orgueil', 'peur'],
  'muslim:6909': ['nuit', 'confiance', 'orgueil', 'peur', 'maladie'],
  // « Guide-moi vers le droit chemin et fais-moi persévérer sur la voie droite. »
  'muslim:6911': ['doute', 'confiance', 'patience'],
  'muslim:6912': ['doute', 'confiance', 'patience'],
  // Juwairiya et les quatre paroles qui pèsent plus que toute une matinée.
  'muslim:6913': ['gratitude', 'matin', 'espoir'],
  'muslim:6914': ['gratitude', 'matin'],
  // « Allah est satisfait de Son serviteur qui dit al-hamdu lillah en mangeant
  // une bouchée. » La gratitude des petites choses.
  'muslim:6932': ['gratitude', 'pauvrete'],
  // L'invocation pour un frère en son absence : l'ange dit « amin, et que ce
  // soit aussi pour toi ».
  'muslim:6927': ['fraternite', 'amour', 'generosite'],
  'muslim:6928': ['fraternite', 'amour', 'generosite'],
  'muslim:6930': ['fraternite', 'amour', 'generosite'],
  // « L'invocation est exaucée tant qu'on ne s'impatiente pas. »
  'muslim:6934': ['confiance', 'patience', 'espoir', 'doute'],
  'muslim:6935': ['confiance', 'patience', 'espoir', 'doute'],
  // « Tant qu'il ne demande pas un péché ni la rupture des liens familiaux, et
  // tant qu'il ne se décourage pas. »
  'muslim:6936': ['confiance', 'patience', 'espoir', 'doute', 'fraternite'],

  // — Muslim 55 : L'ascèse et l'attendrissement des cœurs —

  // « La vie d'ici-bas est une prison pour le croyant. »
  'muslim:7417': ['patience', 'sens', 'espoir'],
  // L'agneau mort dont personne ne voudrait : ce monde vaut moins encore.
  'muslim:7418': ['sens', 'argent', 'humilite'],
  // « Mon bien, mon bien » : tu n'as que ce que tu as mangé, usé ou donné.
  'muslim:7420': ['argent', 'generosite', 'sens', 'mort'],
  'muslim:7422': ['argent', 'generosite', 'sens', 'mort'],
  // Trois choses accompagnent le cercueil ; seules les actions restent.
  'muslim:7424': ['mort', 'sens', 'argent', 'fraternite'],
  // « Ce n'est pas la pauvreté que je crains pour vous, mais la richesse et la
  // rivalité. »
  'muslim:7425': ['argent', 'jalousie', 'pauvrete', 'sens'],
  // « Vous rivaliserez, puis vous deviendrez jaloux, puis vos liens se
  // briseront. »
  'muslim:7427': ['jalousie', 'argent', 'fraternite', 'colere'],
  // « Regardez ceux qui ont moins que vous » : ne pas mépriser les bienfaits.
  'muslim:7428': ['jalousie', 'gratitude', 'argent', 'humilite'],
  'muslim:7430': ['jalousie', 'gratitude', 'argent', 'humilite'],
  // Le lépreux, le chauve et l'aveugle : deux oublient d'où ils viennent, le
  // troisième donne. Le grand récit de la gratitude après la guérison.
  'muslim:7431': ['gratitude', 'maladie', 'argent', 'generosite', 'orgueil', 'pauvrete'],
  // « Allah aime le serviteur pieux, détaché et discret. »
  'muslim:7432': ['humilite', 'solitude', 'intention'],
  // Sa`d : nous n'avions que des feuilles d'arbre à manger.
  'muslim:7433': ['pauvrete', 'patience'],
  // `Utba ibn Ghazwan : nous n'avions rien, et aujourd'hui chacun est
  // gouverneur ; « je demande à Allah de ne pas me croire important alors que
  // je suis insignifiant à Ses yeux ».
  'muslim:7435': ['pauvrete', 'orgueil', 'humilite', 'sens', 'patience'],
  'muslim:7437': ['pauvrete', 'patience'],
  // « Ô Allah, accorde à la famille de Muhammad juste de quoi subsister. »
  'muslim:7440': ['pauvrete', 'humilite', 'confiance'],
  'muslim:7441': ['pauvrete', 'humilite', 'confiance'],
  // La famille de Muhammad n'a jamais mangé du pain de blé à sa faim trois
  // jours de suite.
  'muslim:7443': ['pauvrete', 'humilite', 'patience'],
  'muslim:7444': ['pauvrete', 'humilite', 'patience'],
  'muslim:7445': ['pauvrete', 'humilite', 'patience'],
  'muslim:7446': ['pauvrete', 'humilite', 'patience'],
  // Les demeures de Thamud : n'y entrez qu'en pleurant.
  'muslim:7464': ['tristesse', 'peur', 'injustice'],
  'muslim:7465': ['tristesse', 'peur', 'injustice'],
  // S'occuper d'une veuve et d'un pauvre, prendre soin d'un orphelin.
  'muslim:7468': ['generosite', 'pauvrete', 'solitude', 'travail'],
  'muslim:7469': ['generosite', 'solitude', 'fraternite', 'espoir'],
  // Construire une mosquée : Allah construit une maison au Paradis.
  'muslim:7470': ['generosite', 'espoir', 'intention'],
  'muslim:7471': ['generosite', 'espoir', 'intention'],
  // Le nuage qui arrose le jardin de celui qui en donne un tiers en aumône.
  'muslim:7473': ['generosite', 'confiance', 'travail', 'gratitude'],
  'muslim:7474': ['generosite', 'travail', 'pauvrete'],
  // « Si quelqu'un associe un autre à Moi dans une action, Je le laisse avec
  // celui qu'il M'a associé. » (cf. qudsi:5)
  'muslim:7475': ['intention'],
  // Celui qui veut se faire voir : Allah dévoile sa réalité. (cf. bukhari:6499)
  'muslim:7476': ['intention', 'orgueil'],
  'muslim:7477': ['intention', 'orgueil'],
  // Une parole qui fait tomber en Enfer plus loin que d'est en ouest.
  'muslim:7481': ['parole'],
  'muslim:7482': ['parole'],
  // Celui qui ordonnait le bien sans le faire et interdisait le mal en le
  // faisant : ses entrailles au Jour dernier.
  'muslim:7483': ['intention', 'parole', 'repentir'],
  // « Tous seront pardonnés sauf ceux qui exposent leurs péchés. »
  'muslim:7485': ['repentir', 'pardon', 'parole', 'humilite'],
  // « Les affaires du croyant sont étonnantes : s'il lui arrive du bien il
  // remercie, s'il lui arrive un malheur il patiente. » Le hadith le plus utile
  // du chapitre pour un mauvais jour.
  'muslim:7500': ['patience', 'gratitude', 'espoir', 'tristesse', 'confiance'],
  // L'éloge excessif : « tu as brisé le cou de ton ami ».
  'muslim:7501': ['parole', 'orgueil'],
  'muslim:7502': ['parole', 'orgueil'],
  'muslim:7504': ['parole', 'orgueil'],
  'muslim:7505': ['parole', 'orgueil'],
  'muslim:7506': ['parole', 'orgueil'],
  // Le récit du jeune garçon, du moine et du roi : la patience jusqu'au bout,
  // et « sois patiente, car c'est la vérité ».
  'muslim:7511': ['patience', 'peur', 'confiance', 'espoir', 'injustice'],
  // Abu Yasar : le débiteur en difficulté à qui la dette est annulée ; et
  // « nourrissez vos serviteurs et habillez-les comme vous ». (cf. qudsi:12)
  'muslim:7520': ['argent', 'pauvrete', 'generosite', 'pardon', 'justice', 'travail'],
};
