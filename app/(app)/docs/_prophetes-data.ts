import { useUserStore } from '../../../store/userStore';

export type Prophete = {
  id: string;
  nom: string;        // nom arabe francisé
  arabe: string;      // nom en arabe
  fr?: string;        // équivalent biblique connu
  emoji: string;
  titreFr: string;      // accroche courte (fr)
  titreEn: string;      // accroche courte (en)
  histoireFr: string[]; // paragraphes (fr)
  histoireEn: string[]; // paragraphes (en)
  // Verset coranique cité dans l'histoire (optionnel — seuls certains prophètes
  // ont une invocation/parole directement citée dans le récit). `versetFr`/
  // `versetEn` reprennent la traduction + référence, comme les autres citations
  // de l'app (ex: docCoran.s2Quote).
  versetFr?: string;
  versetEn?: string;
  versetArabe?: string;
};

const PROPHETES_DATA: Prophete[] = [
  {
    id: 'adam', nom: 'Adam', arabe: 'آدم', fr: 'Adam', emoji: '🌍',
    titreFr: "Le premier homme et le premier prophète",
    titreEn: 'The first man and the first prophet',
    histoireFr: [
      "Adam (paix sur lui) est le premier être humain et le premier prophète créé par Allah, façonné de terre puis animé par le souffle divin.",
      "Allah lui enseigna le nom de toutes choses et ordonna aux anges de se prosterner devant lui. Tous obéirent sauf Iblîs (Satan), par orgueil.",
      "Adam et son épouse Hawwa (Ève) vécurent au Paradis, mais furent éprouvés par Iblîs et durent descendre sur Terre. Ils se repentirent, et Allah accepta leur repentir : ils devinrent les parents de toute l'humanité.",
    ],
    histoireEn: [
      "Adam (peace be upon him) is the first human being and the first prophet created by Allah, shaped from clay and then given life by the divine breath.",
      "Allah taught him the names of all things and ordered the angels to prostrate before him. All obeyed except Iblis (Satan), out of pride.",
      "Adam and his wife Hawwa (Eve) lived in Paradise, but were tested by Iblis and had to descend to Earth. They repented, and Allah accepted their repentance: they became the parents of all humanity.",
    ],
  },
  {
    id: 'idris', nom: 'Idris', arabe: 'إدريس', fr: 'Hénoch', emoji: '✒️',
    titreFr: "Le sage qui maîtrisa l'écriture",
    titreEn: 'The sage who mastered writing',
    histoireFr: [
      "Idris (paix sur lui) est connu pour sa grande sagesse et sa piété. La tradition rapporte qu'il fut le premier à écrire avec le calame (la plume).",
      "Allah le décrit dans le Coran comme un homme véridique et un prophète, qu'Il éleva à un rang élevé.",
    ],
    histoireEn: [
      "Idris (peace be upon him) is known for his great wisdom and piety. Tradition reports that he was the first to write with the qalam (reed pen).",
      "Allah describes him in the Quran as a truthful man and a prophet, whom He raised to a high station.",
    ],
  },
  {
    id: 'nuh', nom: 'Nuh', arabe: 'نوح', fr: 'Noé', emoji: '🚢',
    titreFr: "Le prophète de l'arche et du déluge",
    titreEn: 'The prophet of the ark and the flood',
    histoireFr: [
      "Nuh (paix sur lui) prêcha à son peuple pendant 950 ans pour qu'il abandonne l'idolâtrie, mais peu le suivirent.",
      "Sur ordre d'Allah, il construisit une immense arche. Lorsque le déluge arriva, il y embarqua les croyants et un couple de chaque espèce animale.",
      "Le déluge engloutit les mécréants, y compris son propre fils qui refusa de croire. Nuh fait partie des cinq plus grands prophètes (Ulul ʿAzm).",
    ],
    histoireEn: [
      "Nuh (peace be upon him) preached to his people for 950 years to abandon idolatry, but few followed him.",
      "By Allah's command, he built a massive ark. When the flood came, he boarded the believers and a pair of every animal species.",
      "The flood engulfed the disbelievers, including his own son who refused to believe. Nuh is one of the five greatest prophets (Ulul Azm).",
    ],
  },
  {
    id: 'hud', nom: 'Hud', arabe: 'هود', emoji: '🏜️',
    titreFr: "Envoyé au peuple de ʿÂd",
    titreEn: 'Sent to the people of Aad',
    histoireFr: [
      "Hud (paix sur lui) fut envoyé au peuple de ʿÂd, des géants puissants et orgueilleux qui adoraient des idoles.",
      "Malgré ses avertissements, ils refusèrent de croire. Allah les châtia par un vent dévastateur, et seuls Hud et les croyants furent sauvés.",
    ],
    histoireEn: [
      "Hud (peace be upon him) was sent to the people of Aad, powerful and proud giants who worshipped idols.",
      "Despite his warnings, they refused to believe. Allah punished them with a devastating wind, and only Hud and the believers were saved.",
    ],
  },
  {
    id: 'salih', nom: 'Salih', arabe: 'صالح', emoji: '🐪',
    titreFr: "Le prophète de la chamelle miraculeuse",
    titreEn: 'The prophet of the miraculous she-camel',
    histoireFr: [
      "Salih (paix sur lui) fut envoyé au peuple de Thamûd. Comme preuve, Allah fit sortir d'un rocher une chamelle miraculeuse.",
      "Il leur ordonna de ne pas lui faire de mal, mais ils la tuèrent par défi. Un cri terrible et un séisme détruisirent alors le peuple injuste.",
    ],
    histoireEn: [
      "Salih (peace be upon him) was sent to the people of Thamud. As proof, Allah brought forth a miraculous she-camel from a rock.",
      "He ordered them not to harm her, but they killed her out of defiance. A terrible cry and an earthquake then destroyed the unjust people.",
    ],
  },
  {
    id: 'ibrahim', nom: 'Ibrahim', arabe: 'إبراهيم', fr: 'Abraham', emoji: '🕋',
    titreFr: "L'ami d'Allah, père des prophètes",
    titreEn: "Allah's friend, father of the prophets",
    histoireFr: [
      "Ibrahim (paix sur lui) est appelé « Khalîl Allah », l'ami intime d'Allah. Dès son jeune âge, il rejeta l'idolâtrie de son peuple et brisa leurs idoles.",
      "Jeté dans un feu immense, Allah le sauva : le feu devint frais et paisible pour lui.",
      "Avec son fils Ismâʿîl, il reconstruisit la Kaaba à La Mecque. Sa soumission totale, lorsqu'il accepta de sacrifier son fils (remplacé par un bélier), est commémorée chaque année à l'Aïd al-Adha. Il fait partie des Ulul ʿAzm.",
    ],
    histoireEn: [
      "Ibrahim (peace be upon him) is called \"Khalil Allah\", the intimate friend of Allah. From a young age, he rejected the idolatry of his people and broke their idols.",
      "Thrown into a huge fire, Allah saved him: the fire became cool and peaceful for him.",
      "With his son Ismail, he rebuilt the Kaaba in Mecca. His total submission, when he agreed to sacrifice his son (replaced by a ram), is commemorated every year at Eid al-Adha. He is one of the Ulul Azm.",
    ],
  },
  {
    id: 'lut', nom: 'Lut', arabe: 'لوط', fr: 'Loth', emoji: '🔥',
    titreFr: "Envoyé à Sodome",
    titreEn: 'Sent to Sodom',
    histoireFr: [
      "Lut (paix sur lui), neveu d'Ibrahim, fut envoyé à un peuple plongé dans l'immoralité et les pratiques contre nature.",
      "Ils refusèrent ses avertissements. Allah sauva Lut et les croyants, puis détruisit la cité injuste.",
    ],
    histoireEn: [
      "Lut (peace be upon him), Ibrahim's nephew, was sent to a people steeped in immorality and unnatural practices.",
      "They rejected his warnings. Allah saved Lut and the believers, then destroyed the unjust city.",
    ],
  },
  {
    id: 'ismail', nom: 'Ismâʿîl', arabe: 'إسماعيل', fr: 'Ismaël', emoji: '💦',
    titreFr: "Le fils patient d'Ibrahim",
    titreEn: "Ibrahim's patient son",
    histoireFr: [
      "Ismâʿîl (paix sur lui) est le fils aîné d'Ibrahim. Enfant, abandonné avec sa mère Hâjar dans la vallée aride de La Mecque, l'eau de Zamzam jaillit miraculeusement sous ses pieds.",
      "Il accepta avec patience d'être sacrifié par amour pour Allah, avant qu'Allah ne le rachète. Il aida son père à bâtir la Kaaba.",
    ],
    histoireEn: [
      "Ismail (peace be upon him) is Ibrahim's eldest son. As a child, left with his mother Hajar in the arid valley of Mecca, the water of Zamzam miraculously sprang forth under his feet.",
      "He patiently agreed to be sacrificed out of love for Allah, before Allah ransomed him. He helped his father build the Kaaba.",
    ],
  },
  {
    id: 'ishaq', nom: 'Ishâq', arabe: 'إسحاق', fr: 'Isaac', emoji: '🌟',
    titreFr: "Le fils béni d'Ibrahim",
    titreEn: "Ibrahim's blessed son",
    histoireFr: [
      "Ishâq (paix sur lui) est le second fils d'Ibrahim, annoncé à lui et à son épouse Sâra dans leur vieillesse comme une bonne nouvelle.",
      "Il fut un prophète juste, père de Yaʿqûb, et de sa descendance vinrent de nombreux prophètes.",
    ],
    histoireEn: [
      "Ishaq (peace be upon him) is Ibrahim's second son, announced to him and his wife Sarah in their old age as good news.",
      "He was a righteous prophet, father of Yaqub, and from his lineage came many prophets.",
    ],
  },
  {
    id: 'yaqub', nom: 'Yaʿqûb', arabe: 'يعقوب', fr: 'Jacob', emoji: '👨‍👦',
    titreFr: "Le père des douze tribus",
    titreEn: 'The father of the twelve tribes',
    histoireFr: [
      "Yaʿqûb (paix sur lui), aussi appelé Israël, est le fils d'Ishâq. Il eut douze fils, à l'origine des douze tribus.",
      "Il endura avec une patience exemplaire la longue séparation d'avec son fils bien-aimé Yûsuf, jusqu'à leurs émouvantes retrouvailles.",
    ],
    histoireEn: [
      "Yaqub (peace be upon him), also called Israel, is the son of Ishaq. He had twelve sons, at the origin of the twelve tribes.",
      "He endured with exemplary patience the long separation from his beloved son Yusuf, until their moving reunion.",
    ],
  },
  {
    id: 'yusuf', nom: 'Yûsuf', arabe: 'يوسف', fr: 'Joseph', emoji: '👑',
    titreFr: "Le prophète à la belle histoire",
    titreEn: 'The prophet of the beautiful story',
    histoireFr: [
      "Yûsuf (paix sur lui), fils de Yaʿqûb, fut jeté dans un puits par ses frères jaloux, puis vendu comme esclave en Égypte.",
      "Doté du don d'interpréter les rêves, il fut emprisonné injustement, avant de devenir ministre des réserves d'Égypte.",
      "Lors d'une famine, il retrouva et pardonna à ses frères. Sa sourate est appelée « la plus belle des récits ».",
    ],
    histoireEn: [
      "Yusuf (peace be upon him), son of Yaqub, was thrown into a well by his jealous brothers, then sold as a slave in Egypt.",
      "Gifted with the ability to interpret dreams, he was unjustly imprisoned, before becoming minister of Egypt's stores.",
      "During a famine, he found and forgave his brothers. His surah is called \"the most beautiful of stories\".",
    ],
  },
  {
    id: 'ayyub', nom: 'Ayyûb', arabe: 'أيوب', fr: 'Job', emoji: '🤲',
    titreFr: "Le modèle de patience",
    titreEn: 'The model of patience',
    histoireFr: [
      "Ayyûb (paix sur lui) était un homme riche et pieux, qu'Allah éprouva par la perte de ses biens, de ses enfants et par une longue maladie.",
      "Il endura tout sans jamais cesser de remercier Allah. En récompense de sa patience (sabr), Allah lui rendit la santé et bien plus encore.",
    ],
    histoireEn: [
      "Ayyub (peace be upon him) was a rich and pious man, whom Allah tested with the loss of his wealth, his children, and a long illness.",
      "He endured everything without ever ceasing to thank Allah. As a reward for his patience (sabr), Allah restored his health and much more.",
    ],
  },
  {
    id: 'shuayb', nom: 'Shuʿayb', arabe: 'شعيب', emoji: '⚖️',
    titreFr: "Le prophète de la justice commerciale",
    titreEn: 'The prophet of commercial fairness',
    histoireFr: [
      "Shuʿayb (paix sur lui) fut envoyé au peuple de Madyan, qui trichait sur les poids et les mesures.",
      "Il les appela à l'honnêteté dans le commerce et à l'adoration d'Allah seul. Ceux qui persistèrent dans l'injustice furent châtiés.",
    ],
    histoireEn: [
      "Shuayb (peace be upon him) was sent to the people of Madyan, who cheated with weights and measures.",
      "He called them to honesty in trade and to the worship of Allah alone. Those who persisted in injustice were punished.",
    ],
  },
  {
    id: 'musa', nom: 'Mûsâ', arabe: 'موسى', fr: 'Moïse', emoji: '🌊',
    titreFr: "Celui à qui Allah parla",
    titreEn: 'The one to whom Allah spoke',
    histoireFr: [
      "Mûsâ (paix sur lui) est l'un des plus grands prophètes (Ulul ʿAzm). Sauvé bébé des eaux du Nil, il grandit dans le palais de Pharaon.",
      "Allah lui parla directement et lui confia des miracles : son bâton se transformant en serpent, sa main devenant lumineuse.",
      "Il défia Pharaon, libéra les Enfants d'Israël, et la mer s'ouvrit pour les laisser passer tandis que Pharaon fut englouti. Il reçut la Torah.",
    ],
    histoireEn: [
      "Musa (peace be upon him) is one of the greatest prophets (Ulul Azm). Saved as a baby from the waters of the Nile, he grew up in Pharaoh's palace.",
      "Allah spoke to him directly and entrusted him with miracles: his staff turning into a serpent, his hand becoming radiant.",
      "He defied Pharaoh, freed the Children of Israel, and the sea parted to let them through while Pharaoh was drowned. He received the Torah.",
    ],
  },
  {
    id: 'harun', nom: 'Hârûn', arabe: 'هارون', fr: 'Aaron', emoji: '🗣️',
    titreFr: "Le frère et soutien de Mûsâ",
    titreEn: "Musa's brother and support",
    histoireFr: [
      "Hârûn (paix sur lui), frère de Mûsâ, fut désigné prophète pour l'assister, car il était éloquent.",
      "Ensemble, ils affrontèrent Pharaon et guidèrent les Enfants d'Israël avec sagesse et patience.",
    ],
    histoireEn: [
      "Harun (peace be upon him), Musa's brother, was appointed prophet to assist him, as he was eloquent.",
      "Together, they confronted Pharaoh and guided the Children of Israel with wisdom and patience.",
    ],
  },
  {
    id: 'dhulkifl', nom: 'Dhûl-Kifl', arabe: 'ذو الكفل', emoji: '🕊️',
    titreFr: "L'homme de parole",
    titreEn: 'The man of his word',
    histoireFr: [
      "Dhûl-Kifl (paix sur lui) est mentionné dans le Coran parmi les hommes patients et bons.",
      "Il tenait toujours ses engagements et jugeait avec justice, ce qui lui valut ce nom signifiant « celui qui garantit ».",
    ],
    histoireEn: [
      "Dhul-Kifl (peace be upon him) is mentioned in the Quran among the patient and righteous men.",
      "He always kept his commitments and judged with fairness, which earned him this name meaning \"the one who guarantees\".",
    ],
  },
  {
    id: 'dawud', nom: 'Dâwûd', arabe: 'داود', fr: 'David', emoji: '🎵',
    titreFr: "Le roi prophète à la belle voix",
    titreEn: 'The king-prophet with the beautiful voice',
    histoireFr: [
      "Dâwûd (paix sur lui) était prophète et roi. Jeune, il vainquit le géant Jâlût (Goliath) avec une simple fronde.",
      "Allah lui donna une voix magnifique pour louer Son nom, au point que les montagnes et les oiseaux répétaient ses louanges. Il reçut les Psaumes (Zabûr) et savait façonner le fer.",
    ],
    histoireEn: [
      "Dawud (peace be upon him) was a prophet and king. As a young man, he defeated the giant Jalut (Goliath) with a simple sling.",
      "Allah gave him a magnificent voice to praise His name, to the point that the mountains and birds echoed his praises. He received the Psalms (Zabur) and knew how to shape iron.",
    ],
  },
  {
    id: 'sulayman', nom: 'Sulaymân', arabe: 'سليمان', fr: 'Salomon', emoji: '👑',
    titreFr: "Le roi qui commandait le vent et les djinns",
    titreEn: 'The king who commanded the wind and the jinn',
    histoireFr: [
      "Sulaymân (paix sur lui), fils de Dâwûd, reçut un royaume immense et des dons uniques : comprendre le langage des animaux, commander le vent et les djinns.",
      "Sage et juste, il guida la reine de Saba vers la foi. Son règne reste un exemple de sagesse et de gratitude envers Allah.",
    ],
    histoireEn: [
      "Sulayman (peace be upon him), son of Dawud, received an immense kingdom and unique gifts: understanding the language of animals, commanding the wind and the jinn.",
      "Wise and just, he guided the Queen of Sheba to faith. His reign remains an example of wisdom and gratitude towards Allah.",
    ],
  },
  {
    id: 'ilyas', nom: 'Ilyâs', arabe: 'إلياس', fr: 'Élie', emoji: '⚡',
    titreFr: "Le défenseur du monothéisme",
    titreEn: 'The defender of monotheism',
    histoireFr: [
      "Ilyâs (paix sur lui) appela son peuple à abandonner l'idole Baʿl et à n'adorer qu'Allah.",
      "Malgré le rejet de beaucoup, il resta ferme dans sa mission. Le Coran le compte parmi les bienfaisants.",
    ],
    histoireEn: [
      "Ilyas (peace be upon him) called his people to abandon the idol Baal and worship only Allah.",
      "Despite rejection by many, he remained firm in his mission. The Quran counts him among the righteous.",
    ],
  },
  {
    id: 'alyasa', nom: 'Al-Yasaʿ', arabe: 'اليسع', fr: 'Élisée', emoji: '🌿',
    titreFr: "Le successeur d'Ilyâs",
    titreEn: "Ilyas's successor",
    histoireFr: [
      "Al-Yasaʿ (paix sur lui) poursuivit la mission d'Ilyâs, appelant les gens à la foi en Allah unique.",
      "Il est mentionné dans le Coran parmi les élus et les meilleurs.",
    ],
    histoireEn: [
      "Al-Yasa (peace be upon him) continued Ilyas's mission, calling people to faith in the one Allah.",
      "He is mentioned in the Quran among the chosen and the best.",
    ],
  },
  {
    id: 'yunus', nom: 'Yûnus', arabe: 'يونس', fr: 'Jonas', emoji: '🐋',
    titreFr: "Le prophète de la baleine",
    titreEn: 'The prophet of the whale',
    histoireFr: [
      "Yûnus (paix sur lui) quitta son peuple, déçu de son refus de croire, sans la permission d'Allah.",
      "En mer, il fut avalé par une énorme baleine. Dans l'obscurité, il invoqua Allah : « Il n'y a de divinité que Toi, gloire à Toi, j'ai été parmi les injustes. »",
      "Allah le sauva et le rendit à son peuple, qui finit par croire. C'est un exemple du pouvoir du repentir.",
    ],
    histoireEn: [
      "Yunus (peace be upon him) left his people, disappointed by their refusal to believe, without Allah's permission.",
      "At sea, he was swallowed by an enormous whale. In the darkness, he called upon Allah: \"There is no god but You, glory to You, I have been among the wrongdoers.\"",
      "Allah saved him and returned him to his people, who eventually believed. This is an example of the power of repentance.",
    ],
    versetFr: '« Il n\'y a de divinité que Toi, gloire à Toi, j\'ai été parmi les injustes. » (Sourate Al-Anbiyâ, 21:87)',
    versetEn: '"There is no god but You, glory to You, I have been among the wrongdoers." (Surah Al-Anbiya, 21:87)',
    versetArabe: 'لَّآ إِلَـٰهَ إِلَّآ أَنتَ سُبْحَـٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّـٰلِمِينَ',
  },
  {
    id: 'zakariya', nom: 'Zakariyyâ', arabe: 'زكريا', fr: 'Zacharie', emoji: '🤍',
    titreFr: "Le gardien de Maryam",
    titreEn: "Maryam's guardian",
    histoireFr: [
      "Zakariyyâ (paix sur lui) était un prophète âgé et sans enfant qui prit soin de Maryam (Marie).",
      "Voyant les bienfaits d'Allah sur elle, il implora un héritier. Allah exauça sa prière en lui accordant son fils Yahyâ, malgré son grand âge.",
    ],
    histoireEn: [
      "Zakariyya (peace be upon him) was an elderly, childless prophet who took care of Maryam (Mary).",
      "Seeing Allah's blessings upon her, he pleaded for an heir. Allah answered his prayer by granting him his son Yahya, despite his old age.",
    ],
  },
  {
    id: 'yahya', nom: 'Yahyâ', arabe: 'يحيى', fr: 'Jean-Baptiste', emoji: '🕯️',
    titreFr: "Le prophète pur et pieux",
    titreEn: 'The pure and pious prophet',
    histoireFr: [
      "Yahyâ (paix sur lui), fils de Zakariyyâ, fut un prophète dès l'enfance, connu pour sa sagesse, sa douceur et sa pureté.",
      "Il confirma la venue de ʿÎsâ (Jésus) et appela les gens à la dévotion. Le Coran fait son éloge pour sa piété exemplaire.",
    ],
    histoireEn: [
      "Yahya (peace be upon him), son of Zakariyya, was a prophet from childhood, known for his wisdom, gentleness, and purity.",
      "He confirmed the coming of Isa (Jesus) and called people to devotion. The Quran praises him for his exemplary piety.",
    ],
  },
  {
    id: 'isa', nom: 'ʿÎsâ', arabe: 'عيسى', fr: 'Jésus', emoji: '🤲',
    titreFr: "Le Messie, né de Maryam",
    titreEn: 'The Messiah, born of Maryam',
    histoireFr: [
      "ʿÎsâ (paix sur lui) naquit miraculeusement de Maryam (Marie) la vierge, par la volonté d'Allah, sans père.",
      "Bébé, il parla pour défendre sa mère. Par la permission d'Allah, il accomplit des miracles : guérir les aveugles et les lépreux, redonner vie aux morts.",
      "Il reçut l'Évangile (Injîl) et fait partie des cinq grands prophètes (Ulul ʿAzm). Les musulmans croient qu'il ne fut pas tué mais élevé auprès d'Allah.",
    ],
    histoireEn: [
      "Isa (peace be upon him) was miraculously born of Maryam (Mary) the virgin, by the will of Allah, without a father.",
      "As a baby, he spoke to defend his mother. By Allah's permission, he performed miracles: healing the blind and the lepers, bringing the dead back to life.",
      "He received the Gospel (Injil) and is one of the five great prophets (Ulul Azm). Muslims believe he was not killed but raised up to Allah.",
    ],
  },
  {
    id: 'muhammad', nom: 'Muhammad ﷺ', arabe: 'محمد', emoji: '🌙',
    titreFr: "Le sceau des prophètes",
    titreEn: 'The seal of the prophets',
    histoireFr: [
      "Muhammad ﷺ (paix et salut sur lui) est le dernier des prophètes, né à La Mecque vers l'an 570. Orphelin, il était connu pour son honnêteté, surnommé « Al-Amîn » (le digne de confiance).",
      "À 40 ans, il reçut la première révélation du Coran par l'ange Jibril. Pendant 23 ans, il transmit le message de l'Islam avec patience face à l'adversité.",
      "Il unifia l'Arabie autour de la foi en Allah unique, par la douceur et la miséricorde. Il est le sceau des prophètes : aucun ne viendra après lui. Le Coran est son miracle éternel.",
    ],
    histoireEn: [
      "Muhammad ﷺ (peace and blessings be upon him) is the last of the prophets, born in Mecca around the year 570. An orphan, he was known for his honesty, nicknamed \"Al-Amin\" (the trustworthy).",
      "At age 40, he received the first revelation of the Quran through the angel Jibril. For 23 years, he conveyed the message of Islam with patience in the face of adversity.",
      "He unified Arabia around faith in the one Allah, through gentleness and mercy. He is the seal of the prophets: none will come after him. The Quran is his eternal miracle.",
    ],
  },
];

/** Sélectionne titre/histoire/verset cité selon la langue courante de l'app (fr par défaut). */
export function usePropheteLocalized(p: Prophete) {
  const language = useUserStore((s) => s.language);
  const en = language === 'en' || language === 'ar'; // arabe UI pas encore traduit → fallback anglais, comme lib/i18n.ts
  return {
    titre: en ? p.titreEn : p.titreFr,
    histoire: en ? p.histoireEn : p.histoireFr,
    verset: en ? p.versetEn : p.versetFr,
  };
}

export const PROPHETES = PROPHETES_DATA;
