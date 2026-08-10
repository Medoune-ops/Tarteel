/**
 * Les 99 noms d'Allah (Asmā' ul-Ḥusnā) — nom arabe, translittération,
 * traduction et signification, en français ET en anglais.
 *
 * ⚠️ CONTENU RELIGIEUX — à faire relire par une personne compétente : les
 * traductions et significations sont volontairement courtes et ne remplacent
 * pas un ouvrage de référence. L'ordre suit la liste traditionnelle la plus
 * répandue (celle d'at-Tirmidhī). Indexé par position (1–99).
 */
export interface AsmaName {
  numero: number;
  arabe: string;
  translitteration: string;
  fr: string;      // traduction courte du nom
  frSens: string;  // signification en une phrase
  en: string;
  enSens: string;
}

export const ASMA_UL_HUSNA: AsmaName[] = [
  { numero: 1, arabe: 'ٱلرَّحْمَٰن', translitteration: 'Ar-Rahmān', fr: 'Le Tout Miséricordieux', frSens: 'Celui dont la miséricorde embrasse toute la création, croyants et non-croyants.', en: 'The Most Compassionate', enSens: 'The One whose mercy embraces all of creation.' },
  { numero: 2, arabe: 'ٱلرَّحِيم', translitteration: 'Ar-Rahīm', fr: 'Le Très Miséricordieux', frSens: 'Celui qui réserve une miséricorde particulière aux croyants.', en: 'The Most Merciful', enSens: 'The One especially merciful to the believers.' },
  { numero: 3, arabe: 'ٱلْمَلِك', translitteration: 'Al-Malik', fr: 'Le Souverain', frSens: 'Le Roi absolu, à qui appartient toute royauté.', en: 'The King', enSens: 'The absolute Sovereign of all dominion.' },
  { numero: 4, arabe: 'ٱلْقُدُّوس', translitteration: 'Al-Quddūs', fr: 'Le Pur', frSens: 'Celui qui est exempt de tout défaut et de toute imperfection.', en: 'The Most Holy', enSens: 'The One free from any flaw or imperfection.' },
  { numero: 5, arabe: 'ٱلسَّلَام', translitteration: 'As-Salām', fr: 'La Paix', frSens: 'La source de la paix et du salut, exempt de tout mal.', en: 'The Source of Peace', enSens: 'The source of peace and safety, free from all evil.' },
  { numero: 6, arabe: 'ٱلْمُؤْمِن', translitteration: 'Al-Mu\'min', fr: 'Le Rassurant', frSens: 'Celui qui accorde la sécurité et confirme la vérité.', en: 'The Granter of Security', enSens: 'The One who grants security and affirms truth.' },
  { numero: 7, arabe: 'ٱلْمُهَيْمِن', translitteration: 'Al-Muhaymin', fr: 'Le Gardien', frSens: 'Celui qui veille et préserve toute chose.', en: 'The Guardian', enSens: 'The One who watches over and safeguards all.' },
  { numero: 8, arabe: 'ٱلْعَزِيز', translitteration: 'Al-\'Azīz', fr: 'Le Tout-Puissant', frSens: 'Le Puissant que rien ne peut vaincre.', en: 'The Almighty', enSens: 'The Mighty whom none can overcome.' },
  { numero: 9, arabe: 'ٱلْجَبَّار', translitteration: 'Al-Jabbār', fr: 'Le Contraignant', frSens: 'Celui qui impose Sa volonté et redresse toute chose.', en: 'The Compeller', enSens: 'The One who enforces His will and sets things right.' },
  { numero: 10, arabe: 'ٱلْمُتَكَبِّر', translitteration: 'Al-Mutakabbir', fr: 'Le Suprême', frSens: 'Celui à qui appartient toute grandeur, au-dessus de toute chose.', en: 'The Supreme', enSens: 'The One to whom all greatness belongs.' },
  { numero: 11, arabe: 'ٱلْخَالِق', translitteration: 'Al-Khāliq', fr: 'Le Créateur', frSens: 'Celui qui crée toute chose à partir du néant.', en: 'The Creator', enSens: 'The One who creates all things from nothing.' },
  { numero: 12, arabe: 'ٱلْبَارِئ', translitteration: 'Al-Bāri\'', fr: 'Le Producteur', frSens: 'Celui qui façonne la création sans modèle préalable.', en: 'The Maker', enSens: 'The One who fashions creation without prior model.' },
  { numero: 13, arabe: 'ٱلْمُصَوِّر', translitteration: 'Al-Musawwir', fr: 'Le Formateur', frSens: 'Celui qui donne à chaque être sa forme propre.', en: 'The Fashioner', enSens: 'The One who gives each being its distinct form.' },
  { numero: 14, arabe: 'ٱلْغَفَّار', translitteration: 'Al-Ghaffār', fr: 'Le Grand Pardonneur', frSens: 'Celui qui pardonne sans cesse les péchés.', en: 'The Ever-Forgiving', enSens: 'The One who forgives sins again and again.' },
  { numero: 15, arabe: 'ٱلْقَهَّار', translitteration: 'Al-Qahhār', fr: 'Le Dominateur', frSens: 'Celui qui domine toute chose par Sa puissance.', en: 'The Subduer', enSens: 'The One who dominates all by His power.' },
  { numero: 16, arabe: 'ٱلْوَهَّاب', translitteration: 'Al-Wahhāb', fr: 'Le Donateur', frSens: 'Celui qui donne sans compter et sans attendre de retour.', en: 'The Bestower', enSens: 'The One who gives freely without expecting return.' },
  { numero: 17, arabe: 'ٱلرَّزَّاق', translitteration: 'Ar-Razzāq', fr: 'Le Pourvoyeur', frSens: 'Celui qui pourvoit à la subsistance de toute créature.', en: 'The Provider', enSens: 'The One who provides sustenance to all.' },
  { numero: 18, arabe: 'ٱلْفَتَّاح', translitteration: 'Al-Fattāh', fr: 'Celui qui ouvre', frSens: 'Celui qui ouvre les portes de la miséricorde et tranche entre les hommes.', en: 'The Opener', enSens: 'The One who opens the gates of mercy and judges between people.' },
  { numero: 19, arabe: 'ٱلْعَلِيم', translitteration: 'Al-\'Alīm', fr: 'L\'Omniscient', frSens: 'Celui qui connaît toute chose, visible et cachée.', en: 'The All-Knowing', enSens: 'The One who knows all things, seen and unseen.' },
  { numero: 20, arabe: 'ٱلْقَابِض', translitteration: 'Al-Qābid', fr: 'Celui qui restreint', frSens: 'Celui qui retient la subsistance et les âmes selon Sa sagesse.', en: 'The Withholder', enSens: 'The One who withholds provision and souls by His wisdom.' },
  { numero: 21, arabe: 'ٱلْبَاسِط', translitteration: 'Al-Bāsit', fr: 'Celui qui étend', frSens: 'Celui qui prodigue largement Ses bienfaits.', en: 'The Expander', enSens: 'The One who bountifully extends His blessings.' },
  { numero: 22, arabe: 'ٱلْخَافِض', translitteration: 'Al-Khāfid', fr: 'Celui qui abaisse', frSens: 'Celui qui abaisse les orgueilleux et les injustes.', en: 'The Abaser', enSens: 'The One who lowers the arrogant and unjust.' },
  { numero: 23, arabe: 'ٱلرَّافِع', translitteration: 'Ar-Rāfi\'', fr: 'Celui qui élève', frSens: 'Celui qui élève en rang qui Il veut.', en: 'The Exalter', enSens: 'The One who raises in rank whom He wills.' },
  { numero: 24, arabe: 'ٱلْمُعِزّ', translitteration: 'Al-Mu\'izz', fr: 'Celui qui honore', frSens: 'Celui qui donne puissance et honneur.', en: 'The Honorer', enSens: 'The One who grants might and honor.' },
  { numero: 25, arabe: 'ٱلْمُذِلّ', translitteration: 'Al-Mudhill', fr: 'Celui qui humilie', frSens: 'Celui qui rabaisse qui Il veut, selon Sa justice.', en: 'The Humiliator', enSens: 'The One who humbles whom He wills, by His justice.' },
  { numero: 26, arabe: 'ٱلسَّمِيع', translitteration: 'As-Samī\'', fr: 'Celui qui entend tout', frSens: 'Celui qui entend chaque son, même le plus secret.', en: 'The All-Hearing', enSens: 'The One who hears every sound, even the most hidden.' },
  { numero: 27, arabe: 'ٱلْبَصِير', translitteration: 'Al-Basīr', fr: 'Celui qui voit tout', frSens: 'Celui qui voit toute chose, dans le visible et l\'invisible.', en: 'The All-Seeing', enSens: 'The One who sees all things, seen and unseen.' },
  { numero: 28, arabe: 'ٱلْحَكَم', translitteration: 'Al-Hakam', fr: 'Le Juge', frSens: 'Celui qui juge avec une justice parfaite.', en: 'The Judge', enSens: 'The One who judges with perfect justice.' },
  { numero: 29, arabe: 'ٱلْعَدْل', translitteration: 'Al-\'Adl', fr: 'Le Juste', frSens: 'Celui qui est équité absolue, exempt de toute injustice.', en: 'The Utterly Just', enSens: 'The One who is absolute justice, free of any wrong.' },
  { numero: 30, arabe: 'ٱللَّطِيف', translitteration: 'Al-Latīf', fr: 'Le Subtil', frSens: 'Celui qui est bienveillant et connaît les subtilités des choses.', en: 'The Subtle One', enSens: 'The One gentle and aware of the finest details.' },
  { numero: 31, arabe: 'ٱلْخَبِير', translitteration: 'Al-Khabīr', fr: 'Le Parfaitement Informé', frSens: 'Celui qui connaît la réalité profonde de toute chose.', en: 'The All-Aware', enSens: 'The One aware of the inner reality of everything.' },
  { numero: 32, arabe: 'ٱلْحَلِيم', translitteration: 'Al-Halīm', fr: 'Le Longanime', frSens: 'Celui qui ne se hâte pas de punir, plein de mansuétude.', en: 'The Forbearing', enSens: 'The One who is not hasty to punish, full of patience.' },
  { numero: 33, arabe: 'ٱلْعَظِيم', translitteration: 'Al-\'Azīm', fr: 'Le Magnifique', frSens: 'Celui dont la grandeur dépasse tout entendement.', en: 'The Magnificent', enSens: 'The One whose greatness is beyond comprehension.' },
  { numero: 34, arabe: 'ٱلْغَفُور', translitteration: 'Al-Ghafūr', fr: 'Le Pardonneur', frSens: 'Celui qui pardonne abondamment.', en: 'The All-Forgiving', enSens: 'The One who forgives abundantly.' },
  { numero: 35, arabe: 'ٱلشَّكُور', translitteration: 'Ash-Shakūr', fr: 'Le Reconnaissant', frSens: 'Celui qui récompense généreusement les bonnes actions, même petites.', en: 'The Appreciative', enSens: 'The One who richly rewards good deeds, however small.' },
  { numero: 36, arabe: 'ٱلْعَلِيّ', translitteration: 'Al-\'Alī', fr: 'Le Très-Haut', frSens: 'Celui qui est au-dessus de toute chose par Son essence et Son rang.', en: 'The Most High', enSens: 'The One above all in essence and rank.' },
  { numero: 37, arabe: 'ٱلْكَبِير', translitteration: 'Al-Kabīr', fr: 'Le Grand', frSens: 'Celui dont la grandeur est absolue.', en: 'The Most Great', enSens: 'The One whose greatness is absolute.' },
  { numero: 38, arabe: 'ٱلْحَفِيظ', translitteration: 'Al-Hafīz', fr: 'Le Gardien', frSens: 'Celui qui préserve et protège toute chose.', en: 'The Preserver', enSens: 'The One who preserves and protects all things.' },
  { numero: 39, arabe: 'ٱلْمُقِيت', translitteration: 'Al-Muqīt', fr: 'Le Nourricier', frSens: 'Celui qui subvient aux besoins de toute créature.', en: 'The Sustainer', enSens: 'The One who supplies the needs of all creatures.' },
  { numero: 40, arabe: 'ٱلْحَسِيب', translitteration: 'Al-Hasīb', fr: 'Celui qui suffit', frSens: 'Celui qui tient compte de toute chose et suffit à Ses serviteurs.', en: 'The Reckoner', enSens: 'The One who accounts for all and suffices His servants.' },
  { numero: 41, arabe: 'ٱلْجَلِيل', translitteration: 'Al-Jalīl', fr: 'Le Majestueux', frSens: 'Celui qui possède la majesté et la sublimité.', en: 'The Majestic', enSens: 'The One who possesses majesty and sublimity.' },
  { numero: 42, arabe: 'ٱلْكَرِيم', translitteration: 'Al-Karīm', fr: 'Le Généreux', frSens: 'Celui dont la générosité est sans limite.', en: 'The Generous', enSens: 'The One whose generosity is boundless.' },
  { numero: 43, arabe: 'ٱلرَّقِيب', translitteration: 'Ar-Raqīb', fr: 'Le Vigilant', frSens: 'Celui qui observe et surveille toute chose.', en: 'The Watchful', enSens: 'The One who observes and watches over all.' },
  { numero: 44, arabe: 'ٱلْمُجِيب', translitteration: 'Al-Mujīb', fr: 'Celui qui exauce', frSens: 'Celui qui répond à l\'invocation de qui L\'implore.', en: 'The Responsive', enSens: 'The One who answers the call of those who pray to Him.' },
  { numero: 45, arabe: 'ٱلْوَاسِع', translitteration: 'Al-Wāsi\'', fr: 'L\'Immense', frSens: 'Celui dont la science et la miséricorde englobent tout.', en: 'The All-Encompassing', enSens: 'The One whose knowledge and mercy encompass all.' },
  { numero: 46, arabe: 'ٱلْحَكِيم', translitteration: 'Al-Hakīm', fr: 'Le Sage', frSens: 'Celui dont chaque acte est empreint d\'une sagesse parfaite.', en: 'The All-Wise', enSens: 'The One whose every act is of perfect wisdom.' },
  { numero: 47, arabe: 'ٱلْوَدُود', translitteration: 'Al-Wadūd', fr: 'L\'Aimant', frSens: 'Celui qui aime Ses serviteurs pieux et en est aimé.', en: 'The Loving', enSens: 'The One who loves His righteous servants and is loved.' },
  { numero: 48, arabe: 'ٱلْمَجِيد', translitteration: 'Al-Majīd', fr: 'Le Glorieux', frSens: 'Celui dont la gloire et la noblesse sont parfaites.', en: 'The Most Glorious', enSens: 'The One of perfect glory and nobility.' },
  { numero: 49, arabe: 'ٱلْبَاعِث', translitteration: 'Al-Bā\'ith', fr: 'Celui qui ressuscite', frSens: 'Celui qui ressuscite les morts au Jour du Jugement.', en: 'The Resurrector', enSens: 'The One who raises the dead on Judgement Day.' },
  { numero: 50, arabe: 'ٱلشَّهِيد', translitteration: 'Ash-Shahīd', fr: 'Le Témoin', frSens: 'Celui qui est témoin de toute chose.', en: 'The Witness', enSens: 'The One who witnesses all things.' },
  { numero: 51, arabe: 'ٱلْحَقّ', translitteration: 'Al-Haqq', fr: 'La Vérité', frSens: 'Celui qui est la Vérité même, dont l\'existence est certaine.', en: 'The Truth', enSens: 'The One who is Truth itself, whose existence is certain.' },
  { numero: 52, arabe: 'ٱلْوَكِيل', translitteration: 'Al-Wakīl', fr: 'Le Garant', frSens: 'Celui à qui l\'on confie toute chose et qui suffit.', en: 'The Trustee', enSens: 'The One to whom all is entrusted and who suffices.' },
  { numero: 53, arabe: 'ٱلْقَوِيّ', translitteration: 'Al-Qawī', fr: 'Le Fort', frSens: 'Celui dont la force est absolue.', en: 'The Most Strong', enSens: 'The One whose strength is absolute.' },
  { numero: 54, arabe: 'ٱلْمَتِين', translitteration: 'Al-Matīn', fr: 'L\'Inébranlable', frSens: 'Celui dont la fermeté et la puissance ne faiblissent jamais.', en: 'The Firm', enSens: 'The One whose firmness and might never waver.' },
  { numero: 55, arabe: 'ٱلْوَلِيّ', translitteration: 'Al-Walī', fr: 'Le Protecteur', frSens: 'Celui qui soutient et protège les croyants.', en: 'The Protecting Friend', enSens: 'The One who supports and protects the believers.' },
  { numero: 56, arabe: 'ٱلْحَمِيد', translitteration: 'Al-Hamīd', fr: 'Le Digne de louange', frSens: 'Celui qui mérite toute louange en toute circonstance.', en: 'The Praiseworthy', enSens: 'The One deserving of all praise in every state.' },
  { numero: 57, arabe: 'ٱلْمُحْصِي', translitteration: 'Al-Muhsī', fr: 'Celui qui dénombre', frSens: 'Celui qui connaît le compte exact de toute chose.', en: 'The Reckoner of All', enSens: 'The One who knows the exact count of all things.' },
  { numero: 58, arabe: 'ٱلْمُبْدِئ', translitteration: 'Al-Mubdi\'', fr: 'Celui qui initie', frSens: 'Celui qui commence la création sans précédent.', en: 'The Originator', enSens: 'The One who begins creation without precedent.' },
  { numero: 59, arabe: 'ٱلْمُعِيد', translitteration: 'Al-Mu\'īd', fr: 'Celui qui recommence', frSens: 'Celui qui redonne vie après la mort.', en: 'The Restorer', enSens: 'The One who brings back to life after death.' },
  { numero: 60, arabe: 'ٱلْمُحْيِي', translitteration: 'Al-Muhyī', fr: 'Celui qui donne la vie', frSens: 'Celui qui donne la vie à toute créature.', en: 'The Giver of Life', enSens: 'The One who gives life to all creatures.' },
  { numero: 61, arabe: 'ٱلْمُمِيت', translitteration: 'Al-Mumīt', fr: 'Celui qui donne la mort', frSens: 'Celui qui décrète la mort de toute âme.', en: 'The Bringer of Death', enSens: 'The One who ordains the death of every soul.' },
  { numero: 62, arabe: 'ٱلْحَيّ', translitteration: 'Al-Hayy', fr: 'Le Vivant', frSens: 'Celui qui vit d\'une vie éternelle, sans début ni fin.', en: 'The Ever-Living', enSens: 'The One who lives eternally, without beginning or end.' },
  { numero: 63, arabe: 'ٱلْقَيُّوم', translitteration: 'Al-Qayyūm', fr: 'Le Subsistant par Soi', frSens: 'Celui qui subsiste par Lui-même et par qui tout subsiste.', en: 'The Self-Subsisting', enSens: 'The One who subsists by Himself and by whom all subsists.' },
  { numero: 64, arabe: 'ٱلْوَاجِد', translitteration: 'Al-Wājid', fr: 'Celui qui trouve', frSens: 'Celui qui ne manque de rien et à qui rien n\'échappe.', en: 'The Perceiver', enSens: 'The One who lacks nothing and to whom nothing is hidden.' },
  { numero: 65, arabe: 'ٱلْمَاجِد', translitteration: 'Al-Mājid', fr: 'Le Noble', frSens: 'Celui dont la gloire et la générosité sont abondantes.', en: 'The Noble', enSens: 'The One of abundant glory and generosity.' },
  { numero: 66, arabe: 'ٱلْوَاحِد', translitteration: 'Al-Wāhid', fr: 'L\'Unique', frSens: 'Celui qui est un, sans associé ni semblable.', en: 'The One', enSens: 'The One who is single, without partner or equal.' },
  { numero: 67, arabe: 'ٱلْأَحَد', translitteration: 'Al-Ahad', fr: 'L\'Un', frSens: 'Celui qui est l\'unicité absolue, indivisible.', en: 'The Indivisible', enSens: 'The One of absolute, indivisible oneness.' },
  { numero: 68, arabe: 'ٱلصَّمَد', translitteration: 'As-Samad', fr: 'Le Soutien universel', frSens: 'Celui vers qui tout se tourne, qui n\'a besoin de rien.', en: 'The Eternal Refuge', enSens: 'The One all turn to, who needs nothing.' },
  { numero: 69, arabe: 'ٱلْقَادِر', translitteration: 'Al-Qādir', fr: 'Le Puissant', frSens: 'Celui qui a pouvoir sur toute chose.', en: 'The Capable', enSens: 'The One who has power over all things.' },
  { numero: 70, arabe: 'ٱلْمُقْتَدِر', translitteration: 'Al-Muqtadir', fr: 'Le Tout-Déterminant', frSens: 'Celui dont la puissance s\'exerce sur tout, sans obstacle.', en: 'The Omnipotent', enSens: 'The One whose power prevails over all, unhindered.' },
  { numero: 71, arabe: 'ٱلْمُقَدِّم', translitteration: 'Al-Muqaddim', fr: 'Celui qui avance', frSens: 'Celui qui met en avant qui Il veut.', en: 'The Expediter', enSens: 'The One who brings forward whom He wills.' },
  { numero: 72, arabe: 'ٱلْمُؤَخِّر', translitteration: 'Al-Mu\'akhkhir', fr: 'Celui qui recule', frSens: 'Celui qui retarde qui Il veut, selon Sa sagesse.', en: 'The Delayer', enSens: 'The One who delays whom He wills, by His wisdom.' },
  { numero: 73, arabe: 'ٱلْأَوَّل', translitteration: 'Al-Awwal', fr: 'Le Premier', frSens: 'Celui qui précède toute chose, sans commencement.', en: 'The First', enSens: 'The One who precedes all, without beginning.' },
  { numero: 74, arabe: 'ٱلْآخِر', translitteration: 'Al-Ākhir', fr: 'Le Dernier', frSens: 'Celui qui demeure après toute chose, sans fin.', en: 'The Last', enSens: 'The One who remains after all, without end.' },
  { numero: 75, arabe: 'ٱلظَّاهِر', translitteration: 'Az-Zāhir', fr: 'L\'Apparent', frSens: 'Celui dont l\'existence est manifeste par Ses signes.', en: 'The Manifest', enSens: 'The One whose existence is evident through His signs.' },
  { numero: 76, arabe: 'ٱلْبَاطِن', translitteration: 'Al-Bātin', fr: 'Le Caché', frSens: 'Celui que les regards ne peuvent atteindre en ce monde.', en: 'The Hidden', enSens: 'The One whom sight cannot reach in this world.' },
  { numero: 77, arabe: 'ٱلْوَالِي', translitteration: 'Al-Wālī', fr: 'Le Maître', frSens: 'Celui qui gouverne et administre toute chose.', en: 'The Governor', enSens: 'The One who rules and administers all things.' },
  { numero: 78, arabe: 'ٱلْمُتَعَالِي', translitteration: 'Al-Muta\'ālī', fr: 'Le Sublime', frSens: 'Celui qui est infiniment au-dessus de toute imperfection.', en: 'The Self-Exalted', enSens: 'The One infinitely above any imperfection.' },
  { numero: 79, arabe: 'ٱلْبَرّ', translitteration: 'Al-Barr', fr: 'Le Bienfaisant', frSens: 'Celui qui comble Ses créatures de bontés.', en: 'The Source of Goodness', enSens: 'The One who bestows goodness upon His creatures.' },
  { numero: 80, arabe: 'ٱلتَّوَّاب', translitteration: 'At-Tawwāb', fr: 'Celui qui accueille le repentir', frSens: 'Celui qui accepte sans cesse le retour du pécheur.', en: 'The Ever-Relenting', enSens: 'The One who continually accepts the sinner\'s return.' },
  { numero: 81, arabe: 'ٱلْمُنْتَقِم', translitteration: 'Al-Muntaqim', fr: 'Le Vengeur', frSens: 'Celui qui châtie avec justice les obstinés dans le mal.', en: 'The Avenger', enSens: 'The One who justly punishes the persistent wrongdoer.' },
  { numero: 82, arabe: 'ٱلْعَفُوّ', translitteration: 'Al-\'Afū', fr: 'Celui qui efface', frSens: 'Celui qui efface les péchés et les fautes.', en: 'The Pardoner', enSens: 'The One who erases sins and faults.' },
  { numero: 83, arabe: 'ٱلرَّؤُوف', translitteration: 'Ar-Ra\'ūf', fr: 'Le Compatissant', frSens: 'Celui qui est plein de bonté et de douceur.', en: 'The Most Kind', enSens: 'The One full of kindness and gentleness.' },
  { numero: 84, arabe: 'مَالِكُ ٱلْمُلْك', translitteration: 'Mālik-ul-Mulk', fr: 'Le Roi de la royauté', frSens: 'Celui qui possède toute souveraineté et en dispose à Sa guise.', en: 'Master of the Kingdom', enSens: 'The One who owns all sovereignty and disposes of it as He wills.' },
  { numero: 85, arabe: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَام', translitteration: 'Dhul-Jalāli wal-Ikrām', fr: 'Le Détenteur de la majesté et de la générosité', frSens: 'Celui qui réunit majesté suprême et générosité infinie.', en: 'Lord of Majesty and Bounty', enSens: 'The One who joins supreme majesty and infinite generosity.' },
  { numero: 86, arabe: 'ٱلْمُقْسِط', translitteration: 'Al-Muqsit', fr: 'L\'Équitable', frSens: 'Celui qui agit avec une équité parfaite.', en: 'The Equitable', enSens: 'The One who acts with perfect fairness.' },
  { numero: 87, arabe: 'ٱلْجَامِع', translitteration: 'Al-Jāmi\'', fr: 'Celui qui rassemble', frSens: 'Celui qui réunira les créatures au Jour du Jugement.', en: 'The Gatherer', enSens: 'The One who will gather all creatures on Judgement Day.' },
  { numero: 88, arabe: 'ٱلْغَنِيّ', translitteration: 'Al-Ghanī', fr: 'Celui qui se suffit à Lui-même', frSens: 'Celui qui n\'a besoin de rien ni de personne.', en: 'The Self-Sufficient', enSens: 'The One who needs nothing and no one.' },
  { numero: 89, arabe: 'ٱلْمُغْنِي', translitteration: 'Al-Mughnī', fr: 'Celui qui enrichit', frSens: 'Celui qui comble Ses serviteurs et les rend indépendants.', en: 'The Enricher', enSens: 'The One who enriches His servants and makes them free of need.' },
  { numero: 90, arabe: 'ٱلْمَانِع', translitteration: 'Al-Māni\'', fr: 'Celui qui empêche', frSens: 'Celui qui retient ce qu\'Il veut, par sagesse.', en: 'The Withholder', enSens: 'The One who withholds what He wills, by wisdom.' },
  { numero: 91, arabe: 'ٱلضَّارّ', translitteration: 'Ad-Dārr', fr: 'Celui qui peut nuire', frSens: 'Celui de qui vient toute épreuve, selon Sa sagesse.', en: 'The Distresser', enSens: 'The One from whom trials come, by His wisdom.' },
  { numero: 92, arabe: 'ٱلنَّافِع', translitteration: 'An-Nāfi\'', fr: 'Celui qui est utile', frSens: 'Celui de qui vient tout bien et tout profit.', en: 'The Benefactor', enSens: 'The One from whom all good and benefit come.' },
  { numero: 93, arabe: 'ٱلنُّور', translitteration: 'An-Nūr', fr: 'La Lumière', frSens: 'Celui qui illumine les cieux, la terre et les cœurs.', en: 'The Light', enSens: 'The One who illuminates the heavens, the earth, and hearts.' },
  { numero: 94, arabe: 'ٱلْهَادِي', translitteration: 'Al-Hādī', fr: 'Le Guide', frSens: 'Celui qui guide vers la vérité qui Il veut.', en: 'The Guide', enSens: 'The One who guides whom He wills to the truth.' },
  { numero: 95, arabe: 'ٱلْبَدِيع', translitteration: 'Al-Badī\'', fr: 'Le Novateur', frSens: 'Celui qui crée sans modèle antérieur, d\'une beauté incomparable.', en: 'The Incomparable Originator', enSens: 'The One who creates without prior model, of matchless beauty.' },
  { numero: 96, arabe: 'ٱلْبَاقِي', translitteration: 'Al-Bāqī', fr: 'Le Permanent', frSens: 'Celui qui demeure éternellement quand tout disparaît.', en: 'The Everlasting', enSens: 'The One who remains eternally when all else perishes.' },
  { numero: 97, arabe: 'ٱلْوَارِث', translitteration: 'Al-Wārith', fr: 'L\'Héritier', frSens: 'Celui à qui tout revient après la disparition des créatures.', en: 'The Inheritor', enSens: 'The One to whom all returns after creatures perish.' },
  { numero: 98, arabe: 'ٱلرَّشِيد', translitteration: 'Ar-Rashīd', fr: 'Le Guide vers le bien', frSens: 'Celui qui dirige toute chose vers sa juste fin.', en: 'The Guide to the Right Path', enSens: 'The One who directs all things to their right end.' },
  { numero: 99, arabe: 'ٱلصَّبُور', translitteration: 'As-Sabūr', fr: 'Le Patient', frSens: 'Celui qui ne se hâte pas et donne à chacun son délai.', en: 'The Most Patient', enSens: 'The One who is never hasty and grants everyone their time.' },
];

/** Traduction et signification d'un nom dans la langue voulue (fr par défaut). */
export function asmaText(name: AsmaName, lang: 'fr' | 'en' | 'ar'): { nom: string; sens: string } {
  return lang === 'en'
    ? { nom: name.en, sens: name.enSens }
    : { nom: name.fr, sens: name.frSens };
}
