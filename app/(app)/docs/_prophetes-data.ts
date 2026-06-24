export type Prophete = {
  id: string;
  nom: string;        // nom arabe francisé
  arabe: string;      // nom en arabe
  fr?: string;        // équivalent biblique connu
  emoji: string;
  titre: string;      // accroche courte
  histoire: string[]; // paragraphes
};

export const PROPHETES: Prophete[] = [
  {
    id: 'adam', nom: 'Adam', arabe: 'آدم', fr: 'Adam', emoji: '🌍',
    titre: "Le premier homme et le premier prophète",
    histoire: [
      "Adam (paix sur lui) est le premier être humain et le premier prophète créé par Allah, façonné de terre puis animé par le souffle divin.",
      "Allah lui enseigna le nom de toutes choses et ordonna aux anges de se prosterner devant lui. Tous obéirent sauf Iblîs (Satan), par orgueil.",
      "Adam et son épouse Hawwa (Ève) vécurent au Paradis, mais furent éprouvés par Iblîs et durent descendre sur Terre. Ils se repentirent, et Allah accepta leur repentir : ils devinrent les parents de toute l'humanité.",
    ],
  },
  {
    id: 'idris', nom: 'Idris', arabe: 'إدريس', fr: 'Hénoch', emoji: '✒️',
    titre: "Le sage qui maîtrisa l'écriture",
    histoire: [
      "Idris (paix sur lui) est connu pour sa grande sagesse et sa piété. La tradition rapporte qu'il fut le premier à écrire avec le calame (la plume).",
      "Allah le décrit dans le Coran comme un homme véridique et un prophète, qu'Il éleva à un rang élevé.",
    ],
  },
  {
    id: 'nuh', nom: 'Nuh', arabe: 'نوح', fr: 'Noé', emoji: '🚢',
    titre: "Le prophète de l'arche et du déluge",
    histoire: [
      "Nuh (paix sur lui) prêcha à son peuple pendant 950 ans pour qu'il abandonne l'idolâtrie, mais peu le suivirent.",
      "Sur ordre d'Allah, il construisit une immense arche. Lorsque le déluge arriva, il y embarqua les croyants et un couple de chaque espèce animale.",
      "Le déluge engloutit les mécréants, y compris son propre fils qui refusa de croire. Nuh fait partie des cinq plus grands prophètes (Ulul ʿAzm).",
    ],
  },
  {
    id: 'hud', nom: 'Hud', arabe: 'هود', emoji: '🏜️',
    titre: "Envoyé au peuple de ʿÂd",
    histoire: [
      "Hud (paix sur lui) fut envoyé au peuple de ʿÂd, des géants puissants et orgueilleux qui adoraient des idoles.",
      "Malgré ses avertissements, ils refusèrent de croire. Allah les châtia par un vent dévastateur, et seuls Hud et les croyants furent sauvés.",
    ],
  },
  {
    id: 'salih', nom: 'Salih', arabe: 'صالح', emoji: '🐪',
    titre: "Le prophète de la chamelle miraculeuse",
    histoire: [
      "Salih (paix sur lui) fut envoyé au peuple de Thamûd. Comme preuve, Allah fit sortir d'un rocher une chamelle miraculeuse.",
      "Il leur ordonna de ne pas lui faire de mal, mais ils la tuèrent par défi. Un cri terrible et un séisme détruisirent alors le peuple injuste.",
    ],
  },
  {
    id: 'ibrahim', nom: 'Ibrahim', arabe: 'إبراهيم', fr: 'Abraham', emoji: '🕋',
    titre: "L'ami d'Allah, père des prophètes",
    histoire: [
      "Ibrahim (paix sur lui) est appelé « Khalîl Allah », l'ami intime d'Allah. Dès son jeune âge, il rejeta l'idolâtrie de son peuple et brisa leurs idoles.",
      "Jeté dans un feu immense, Allah le sauva : le feu devint frais et paisible pour lui.",
      "Avec son fils Ismâʿîl, il reconstruisit la Kaaba à La Mecque. Sa soumission totale, lorsqu'il accepta de sacrifier son fils (remplacé par un bélier), est commémorée chaque année à l'Aïd al-Adha. Il fait partie des Ulul ʿAzm.",
    ],
  },
  {
    id: 'lut', nom: 'Lut', arabe: 'لوط', fr: 'Loth', emoji: '🔥',
    titre: "Envoyé à Sodome",
    histoire: [
      "Lut (paix sur lui), neveu d'Ibrahim, fut envoyé à un peuple plongé dans l'immoralité et les pratiques contre nature.",
      "Ils refusèrent ses avertissements. Allah sauva Lut et les croyants, puis détruisit la cité injuste.",
    ],
  },
  {
    id: 'ismail', nom: 'Ismâʿîl', arabe: 'إسماعيل', fr: 'Ismaël', emoji: '💦',
    titre: "Le fils patient d'Ibrahim",
    histoire: [
      "Ismâʿîl (paix sur lui) est le fils aîné d'Ibrahim. Enfant, abandonné avec sa mère Hâjar dans la vallée aride de La Mecque, l'eau de Zamzam jaillit miraculeusement sous ses pieds.",
      "Il accepta avec patience d'être sacrifié par amour pour Allah, avant qu'Allah ne le rachète. Il aida son père à bâtir la Kaaba.",
    ],
  },
  {
    id: 'ishaq', nom: 'Ishâq', arabe: 'إسحاق', fr: 'Isaac', emoji: '🌟',
    titre: "Le fils béni d'Ibrahim",
    histoire: [
      "Ishâq (paix sur lui) est le second fils d'Ibrahim, annoncé à lui et à son épouse Sâra dans leur vieillesse comme une bonne nouvelle.",
      "Il fut un prophète juste, père de Yaʿqûb, et de sa descendance vinrent de nombreux prophètes.",
    ],
  },
  {
    id: 'yaqub', nom: 'Yaʿqûb', arabe: 'يعقوب', fr: 'Jacob', emoji: '👨‍👦',
    titre: "Le père des douze tribus",
    histoire: [
      "Yaʿqûb (paix sur lui), aussi appelé Israël, est le fils d'Ishâq. Il eut douze fils, à l'origine des douze tribus.",
      "Il endura avec une patience exemplaire la longue séparation d'avec son fils bien-aimé Yûsuf, jusqu'à leurs émouvantes retrouvailles.",
    ],
  },
  {
    id: 'yusuf', nom: 'Yûsuf', arabe: 'يوسف', fr: 'Joseph', emoji: '👑',
    titre: "Le prophète à la belle histoire",
    histoire: [
      "Yûsuf (paix sur lui), fils de Yaʿqûb, fut jeté dans un puits par ses frères jaloux, puis vendu comme esclave en Égypte.",
      "Doté du don d'interpréter les rêves, il fut emprisonné injustement, avant de devenir ministre des réserves d'Égypte.",
      "Lors d'une famine, il retrouva et pardonna à ses frères. Sa sourate est appelée « la plus belle des récits ».",
    ],
  },
  {
    id: 'ayyub', nom: 'Ayyûb', arabe: 'أيوب', fr: 'Job', emoji: '🤲',
    titre: "Le modèle de patience",
    histoire: [
      "Ayyûb (paix sur lui) était un homme riche et pieux, qu'Allah éprouva par la perte de ses biens, de ses enfants et par une longue maladie.",
      "Il endura tout sans jamais cesser de remercier Allah. En récompense de sa patience (sabr), Allah lui rendit la santé et bien plus encore.",
    ],
  },
  {
    id: 'shuayb', nom: 'Shuʿayb', arabe: 'شعيب', emoji: '⚖️',
    titre: "Le prophète de la justice commerciale",
    histoire: [
      "Shuʿayb (paix sur lui) fut envoyé au peuple de Madyan, qui trichait sur les poids et les mesures.",
      "Il les appela à l'honnêteté dans le commerce et à l'adoration d'Allah seul. Ceux qui persistèrent dans l'injustice furent châtiés.",
    ],
  },
  {
    id: 'musa', nom: 'Mûsâ', arabe: 'موسى', fr: 'Moïse', emoji: '🌊',
    titre: "Celui à qui Allah parla",
    histoire: [
      "Mûsâ (paix sur lui) est l'un des plus grands prophètes (Ulul ʿAzm). Sauvé bébé des eaux du Nil, il grandit dans le palais de Pharaon.",
      "Allah lui parla directement et lui confia des miracles : son bâton se transformant en serpent, sa main devenant lumineuse.",
      "Il défia Pharaon, libéra les Enfants d'Israël, et la mer s'ouvrit pour les laisser passer tandis que Pharaon fut englouti. Il reçut la Torah.",
    ],
  },
  {
    id: 'harun', nom: 'Hârûn', arabe: 'هارون', fr: 'Aaron', emoji: '🗣️',
    titre: "Le frère et soutien de Mûsâ",
    histoire: [
      "Hârûn (paix sur lui), frère de Mûsâ, fut désigné prophète pour l'assister, car il était éloquent.",
      "Ensemble, ils affrontèrent Pharaon et guidèrent les Enfants d'Israël avec sagesse et patience.",
    ],
  },
  {
    id: 'dhulkifl', nom: 'Dhûl-Kifl', arabe: 'ذو الكفل', emoji: '🕊️',
    titre: "L'homme de parole",
    histoire: [
      "Dhûl-Kifl (paix sur lui) est mentionné dans le Coran parmi les hommes patients et bons.",
      "Il tenait toujours ses engagements et jugeait avec justice, ce qui lui valut ce nom signifiant « celui qui garantit ».",
    ],
  },
  {
    id: 'dawud', nom: 'Dâwûd', arabe: 'داود', fr: 'David', emoji: '🎵',
    titre: "Le roi prophète à la belle voix",
    histoire: [
      "Dâwûd (paix sur lui) était prophète et roi. Jeune, il vainquit le géant Jâlût (Goliath) avec une simple fronde.",
      "Allah lui donna une voix magnifique pour louer Son nom, au point que les montagnes et les oiseaux répétaient ses louanges. Il reçut les Psaumes (Zabûr) et savait façonner le fer.",
    ],
  },
  {
    id: 'sulayman', nom: 'Sulaymân', arabe: 'سليمان', fr: 'Salomon', emoji: '👑',
    titre: "Le roi qui commandait le vent et les djinns",
    histoire: [
      "Sulaymân (paix sur lui), fils de Dâwûd, reçut un royaume immense et des dons uniques : comprendre le langage des animaux, commander le vent et les djinns.",
      "Sage et juste, il guida la reine de Saba vers la foi. Son règne reste un exemple de sagesse et de gratitude envers Allah.",
    ],
  },
  {
    id: 'ilyas', nom: 'Ilyâs', arabe: 'إلياس', fr: 'Élie', emoji: '⚡',
    titre: "Le défenseur du monothéisme",
    histoire: [
      "Ilyâs (paix sur lui) appela son peuple à abandonner l'idole Baʿl et à n'adorer qu'Allah.",
      "Malgré le rejet de beaucoup, il resta ferme dans sa mission. Le Coran le compte parmi les bienfaisants.",
    ],
  },
  {
    id: 'alyasa', nom: 'Al-Yasaʿ', arabe: 'اليسع', fr: 'Élisée', emoji: '🌿',
    titre: "Le successeur d'Ilyâs",
    histoire: [
      "Al-Yasaʿ (paix sur lui) poursuivit la mission d'Ilyâs, appelant les gens à la foi en Allah unique.",
      "Il est mentionné dans le Coran parmi les élus et les meilleurs.",
    ],
  },
  {
    id: 'yunus', nom: 'Yûnus', arabe: 'يونس', fr: 'Jonas', emoji: '🐋',
    titre: "Le prophète de la baleine",
    histoire: [
      "Yûnus (paix sur lui) quitta son peuple, déçu de son refus de croire, sans la permission d'Allah.",
      "En mer, il fut avalé par une énorme baleine. Dans l'obscurité, il invoqua Allah : « Il n'y a de divinité que Toi, gloire à Toi, j'ai été parmi les injustes. »",
      "Allah le sauva et le rendit à son peuple, qui finit par croire. C'est un exemple du pouvoir du repentir.",
    ],
  },
  {
    id: 'zakariya', nom: 'Zakariyyâ', arabe: 'زكريا', fr: 'Zacharie', emoji: '🤍',
    titre: "Le gardien de Maryam",
    histoire: [
      "Zakariyyâ (paix sur lui) était un prophète âgé et sans enfant qui prit soin de Maryam (Marie).",
      "Voyant les bienfaits d'Allah sur elle, il implora un héritier. Allah exauça sa prière en lui accordant son fils Yahyâ, malgré son grand âge.",
    ],
  },
  {
    id: 'yahya', nom: 'Yahyâ', arabe: 'يحيى', fr: 'Jean-Baptiste', emoji: '🕯️',
    titre: "Le prophète pur et pieux",
    histoire: [
      "Yahyâ (paix sur lui), fils de Zakariyyâ, fut un prophète dès l'enfance, connu pour sa sagesse, sa douceur et sa pureté.",
      "Il confirma la venue de ʿÎsâ (Jésus) et appela les gens à la dévotion. Le Coran fait son éloge pour sa piété exemplaire.",
    ],
  },
  {
    id: 'isa', nom: 'ʿÎsâ', arabe: 'عيسى', fr: 'Jésus', emoji: '🤲',
    titre: "Le Messie, né de Maryam",
    histoire: [
      "ʿÎsâ (paix sur lui) naquit miraculeusement de Maryam (Marie) la vierge, par la volonté d'Allah, sans père.",
      "Bébé, il parla pour défendre sa mère. Par la permission d'Allah, il accomplit des miracles : guérir les aveugles et les lépreux, redonner vie aux morts.",
      "Il reçut l'Évangile (Injîl) et fait partie des cinq grands prophètes (Ulul ʿAzm). Les musulmans croient qu'il ne fut pas tué mais élevé auprès d'Allah.",
    ],
  },
  {
    id: 'muhammad', nom: 'Muhammad ﷺ', arabe: 'محمد', emoji: '🌙',
    titre: "Le sceau des prophètes",
    histoire: [
      "Muhammad ﷺ (paix et salut sur lui) est le dernier des prophètes, né à La Mecque vers l'an 570. Orphelin, il était connu pour son honnêteté, surnommé « Al-Amîn » (le digne de confiance).",
      "À 40 ans, il reçut la première révélation du Coran par l'ange Jibril. Pendant 23 ans, il transmit le message de l'Islam avec patience face à l'adversité.",
      "Il unifia l'Arabie autour de la foi en Allah unique, par la douceur et la miséricorde. Il est le sceau des prophètes : aucun ne viendra après lui. Le Coran est son miracle éternel.",
    ],
  },
];
