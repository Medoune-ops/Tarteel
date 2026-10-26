// ─── Les 99 noms d'Allah (Asmā' ul-Ḥusnā) — copie Swift ────────────────
// Généré depuis constants/asmaulHusna.ts (source de vérité, TS) — garder les
// deux fichiers synchronisés si le contenu religieux est corrigé ou complété.
// ⚠️ CONTENU RELIGIEUX — voir le fichier TS pour la note de relecture.
//
// `traduction` choisit fr/en selon la langue de l'appareil, comme les libellés
// de Localization.swift (L.isEnglish) : sans ça le widget affichait le nom en français sur un téléphone
// en anglais, alors que la traduction anglaise existait déjà côté TS.

import Foundation

struct AsmaName {
    let numero: Int
    let arabe: String
    let translitteration: String
    let fr: String
    let en: String
    /// Signification en une phrase (widgets de l'écran verrouillé).
    let frSens: String
    let enSens: String

    /// Traduction dans la langue de l'appareil (repli français).
    var traduction: String {
        L.isEnglish ? en : fr
    }

    /// Signification dans la langue de l'appareil (repli français).
    var sens: String {
        L.isEnglish ? enSens : frSens
    }
}

let ASMA_UL_HUSNA: [AsmaName] = [
    AsmaName(numero: 1, arabe: "ٱلرَّحْمَٰن", translitteration: "Ar-Rahmān", fr: "Le Tout Miséricordieux", en: "The Most Compassionate", frSens: "Celui dont la miséricorde embrasse toute la création, croyants et non-croyants.", enSens: "The One whose mercy embraces all of creation."),
    AsmaName(numero: 2, arabe: "ٱلرَّحِيم", translitteration: "Ar-Rahīm", fr: "Le Très Miséricordieux", en: "The Most Merciful", frSens: "Celui qui réserve une miséricorde particulière aux croyants.", enSens: "The One especially merciful to the believers."),
    AsmaName(numero: 3, arabe: "ٱلْمَلِك", translitteration: "Al-Malik", fr: "Le Souverain", en: "The King", frSens: "Le Roi absolu, à qui appartient toute royauté.", enSens: "The absolute Sovereign of all dominion."),
    AsmaName(numero: 4, arabe: "ٱلْقُدُّوس", translitteration: "Al-Quddūs", fr: "Le Pur", en: "The Most Holy", frSens: "Celui qui est exempt de tout défaut et de toute imperfection.", enSens: "The One free from any flaw or imperfection."),
    AsmaName(numero: 5, arabe: "ٱلسَّلَام", translitteration: "As-Salām", fr: "La Paix", en: "The Source of Peace", frSens: "La source de la paix et du salut, exempt de tout mal.", enSens: "The source of peace and safety, free from all evil."),
    AsmaName(numero: 6, arabe: "ٱلْمُؤْمِن", translitteration: "Al-Mu'min", fr: "Le Rassurant", en: "The Granter of Security", frSens: "Celui qui accorde la sécurité et confirme la vérité.", enSens: "The One who grants security and affirms truth."),
    AsmaName(numero: 7, arabe: "ٱلْمُهَيْمِن", translitteration: "Al-Muhaymin", fr: "Le Gardien", en: "The Guardian", frSens: "Celui qui veille et préserve toute chose.", enSens: "The One who watches over and safeguards all."),
    AsmaName(numero: 8, arabe: "ٱلْعَزِيز", translitteration: "Al-'Azīz", fr: "Le Tout-Puissant", en: "The Almighty", frSens: "Le Puissant que rien ne peut vaincre.", enSens: "The Mighty whom none can overcome."),
    AsmaName(numero: 9, arabe: "ٱلْجَبَّار", translitteration: "Al-Jabbār", fr: "Le Contraignant", en: "The Compeller", frSens: "Celui qui impose Sa volonté et redresse toute chose.", enSens: "The One who enforces His will and sets things right."),
    AsmaName(numero: 10, arabe: "ٱلْمُتَكَبِّر", translitteration: "Al-Mutakabbir", fr: "Le Suprême", en: "The Supreme", frSens: "Celui à qui appartient toute grandeur, au-dessus de toute chose.", enSens: "The One to whom all greatness belongs."),
    AsmaName(numero: 11, arabe: "ٱلْخَالِق", translitteration: "Al-Khāliq", fr: "Le Créateur", en: "The Creator", frSens: "Celui qui crée toute chose à partir du néant.", enSens: "The One who creates all things from nothing."),
    AsmaName(numero: 12, arabe: "ٱلْبَارِئ", translitteration: "Al-Bāri'", fr: "Le Producteur", en: "The Maker", frSens: "Celui qui façonne la création sans modèle préalable.", enSens: "The One who fashions creation without prior model."),
    AsmaName(numero: 13, arabe: "ٱلْمُصَوِّر", translitteration: "Al-Musawwir", fr: "Le Formateur", en: "The Fashioner", frSens: "Celui qui donne à chaque être sa forme propre.", enSens: "The One who gives each being its distinct form."),
    AsmaName(numero: 14, arabe: "ٱلْغَفَّار", translitteration: "Al-Ghaffār", fr: "Le Grand Pardonneur", en: "The Ever-Forgiving", frSens: "Celui qui pardonne sans cesse les péchés.", enSens: "The One who forgives sins again and again."),
    AsmaName(numero: 15, arabe: "ٱلْقَهَّار", translitteration: "Al-Qahhār", fr: "Le Dominateur", en: "The Subduer", frSens: "Celui qui domine toute chose par Sa puissance.", enSens: "The One who dominates all by His power."),
    AsmaName(numero: 16, arabe: "ٱلْوَهَّاب", translitteration: "Al-Wahhāb", fr: "Le Donateur", en: "The Bestower", frSens: "Celui qui donne sans compter et sans attendre de retour.", enSens: "The One who gives freely without expecting return."),
    AsmaName(numero: 17, arabe: "ٱلرَّزَّاق", translitteration: "Ar-Razzāq", fr: "Le Pourvoyeur", en: "The Provider", frSens: "Celui qui pourvoit à la subsistance de toute créature.", enSens: "The One who provides sustenance to all."),
    AsmaName(numero: 18, arabe: "ٱلْفَتَّاح", translitteration: "Al-Fattāh", fr: "Celui qui ouvre", en: "The Opener", frSens: "Celui qui ouvre les portes de la miséricorde et tranche entre les hommes.", enSens: "The One who opens the gates of mercy and judges between people."),
    AsmaName(numero: 19, arabe: "ٱلْعَلِيم", translitteration: "Al-'Alīm", fr: "L'Omniscient", en: "The All-Knowing", frSens: "Celui qui connaît toute chose, visible et cachée.", enSens: "The One who knows all things, seen and unseen."),
    AsmaName(numero: 20, arabe: "ٱلْقَابِض", translitteration: "Al-Qābid", fr: "Celui qui restreint", en: "The Withholder", frSens: "Celui qui retient la subsistance et les âmes selon Sa sagesse.", enSens: "The One who withholds provision and souls by His wisdom."),
    AsmaName(numero: 21, arabe: "ٱلْبَاسِط", translitteration: "Al-Bāsit", fr: "Celui qui étend", en: "The Expander", frSens: "Celui qui prodigue largement Ses bienfaits.", enSens: "The One who bountifully extends His blessings."),
    AsmaName(numero: 22, arabe: "ٱلْخَافِض", translitteration: "Al-Khāfid", fr: "Celui qui abaisse", en: "The Abaser", frSens: "Celui qui abaisse les orgueilleux et les injustes.", enSens: "The One who lowers the arrogant and unjust."),
    AsmaName(numero: 23, arabe: "ٱلرَّافِع", translitteration: "Ar-Rāfi'", fr: "Celui qui élève", en: "The Exalter", frSens: "Celui qui élève en rang qui Il veut.", enSens: "The One who raises in rank whom He wills."),
    AsmaName(numero: 24, arabe: "ٱلْمُعِزّ", translitteration: "Al-Mu'izz", fr: "Celui qui honore", en: "The Honorer", frSens: "Celui qui donne puissance et honneur.", enSens: "The One who grants might and honor."),
    AsmaName(numero: 25, arabe: "ٱلْمُذِلّ", translitteration: "Al-Mudhill", fr: "Celui qui humilie", en: "The Humiliator", frSens: "Celui qui rabaisse qui Il veut, selon Sa justice.", enSens: "The One who humbles whom He wills, by His justice."),
    AsmaName(numero: 26, arabe: "ٱلسَّمِيع", translitteration: "As-Samī'", fr: "Celui qui entend tout", en: "The All-Hearing", frSens: "Celui qui entend chaque son, même le plus secret.", enSens: "The One who hears every sound, even the most hidden."),
    AsmaName(numero: 27, arabe: "ٱلْبَصِير", translitteration: "Al-Basīr", fr: "Celui qui voit tout", en: "The All-Seeing", frSens: "Celui qui voit toute chose, dans le visible et l'invisible.", enSens: "The One who sees all things, seen and unseen."),
    AsmaName(numero: 28, arabe: "ٱلْحَكَم", translitteration: "Al-Hakam", fr: "Le Juge", en: "The Judge", frSens: "Celui qui juge avec une justice parfaite.", enSens: "The One who judges with perfect justice."),
    AsmaName(numero: 29, arabe: "ٱلْعَدْل", translitteration: "Al-'Adl", fr: "Le Juste", en: "The Utterly Just", frSens: "Celui qui est équité absolue, exempt de toute injustice.", enSens: "The One who is absolute justice, free of any wrong."),
    AsmaName(numero: 30, arabe: "ٱللَّطِيف", translitteration: "Al-Latīf", fr: "Le Subtil", en: "The Subtle One", frSens: "Celui qui est bienveillant et connaît les subtilités des choses.", enSens: "The One gentle and aware of the finest details."),
    AsmaName(numero: 31, arabe: "ٱلْخَبِير", translitteration: "Al-Khabīr", fr: "Le Parfaitement Informé", en: "The All-Aware", frSens: "Celui qui connaît la réalité profonde de toute chose.", enSens: "The One aware of the inner reality of everything."),
    AsmaName(numero: 32, arabe: "ٱلْحَلِيم", translitteration: "Al-Halīm", fr: "Le Longanime", en: "The Forbearing", frSens: "Celui qui ne se hâte pas de punir, plein de mansuétude.", enSens: "The One who is not hasty to punish, full of patience."),
    AsmaName(numero: 33, arabe: "ٱلْعَظِيم", translitteration: "Al-'Azīm", fr: "Le Magnifique", en: "The Magnificent", frSens: "Celui dont la grandeur dépasse tout entendement.", enSens: "The One whose greatness is beyond comprehension."),
    AsmaName(numero: 34, arabe: "ٱلْغَفُور", translitteration: "Al-Ghafūr", fr: "Le Pardonneur", en: "The All-Forgiving", frSens: "Celui qui pardonne abondamment.", enSens: "The One who forgives abundantly."),
    AsmaName(numero: 35, arabe: "ٱلشَّكُور", translitteration: "Ash-Shakūr", fr: "Le Reconnaissant", en: "The Appreciative", frSens: "Celui qui récompense généreusement les bonnes actions, même petites.", enSens: "The One who richly rewards good deeds, however small."),
    AsmaName(numero: 36, arabe: "ٱلْعَلِيّ", translitteration: "Al-'Alī", fr: "Le Très-Haut", en: "The Most High", frSens: "Celui qui est au-dessus de toute chose par Son essence et Son rang.", enSens: "The One above all in essence and rank."),
    AsmaName(numero: 37, arabe: "ٱلْكَبِير", translitteration: "Al-Kabīr", fr: "Le Grand", en: "The Most Great", frSens: "Celui dont la grandeur est absolue.", enSens: "The One whose greatness is absolute."),
    AsmaName(numero: 38, arabe: "ٱلْحَفِيظ", translitteration: "Al-Hafīz", fr: "Le Gardien", en: "The Preserver", frSens: "Celui qui préserve et protège toute chose.", enSens: "The One who preserves and protects all things."),
    AsmaName(numero: 39, arabe: "ٱلْمُقِيت", translitteration: "Al-Muqīt", fr: "Le Nourricier", en: "The Sustainer", frSens: "Celui qui subvient aux besoins de toute créature.", enSens: "The One who supplies the needs of all creatures."),
    AsmaName(numero: 40, arabe: "ٱلْحَسِيب", translitteration: "Al-Hasīb", fr: "Celui qui suffit", en: "The Reckoner", frSens: "Celui qui tient compte de toute chose et suffit à Ses serviteurs.", enSens: "The One who accounts for all and suffices His servants."),
    AsmaName(numero: 41, arabe: "ٱلْجَلِيل", translitteration: "Al-Jalīl", fr: "Le Majestueux", en: "The Majestic", frSens: "Celui qui possède la majesté et la sublimité.", enSens: "The One who possesses majesty and sublimity."),
    AsmaName(numero: 42, arabe: "ٱلْكَرِيم", translitteration: "Al-Karīm", fr: "Le Généreux", en: "The Generous", frSens: "Celui dont la générosité est sans limite.", enSens: "The One whose generosity is boundless."),
    AsmaName(numero: 43, arabe: "ٱلرَّقِيب", translitteration: "Ar-Raqīb", fr: "Le Vigilant", en: "The Watchful", frSens: "Celui qui observe et surveille toute chose.", enSens: "The One who observes and watches over all."),
    AsmaName(numero: 44, arabe: "ٱلْمُجِيب", translitteration: "Al-Mujīb", fr: "Celui qui exauce", en: "The Responsive", frSens: "Celui qui répond à l'invocation de qui L'implore.", enSens: "The One who answers the call of those who pray to Him."),
    AsmaName(numero: 45, arabe: "ٱلْوَاسِع", translitteration: "Al-Wāsi'", fr: "L'Immense", en: "The All-Encompassing", frSens: "Celui dont la science et la miséricorde englobent tout.", enSens: "The One whose knowledge and mercy encompass all."),
    AsmaName(numero: 46, arabe: "ٱلْحَكِيم", translitteration: "Al-Hakīm", fr: "Le Sage", en: "The All-Wise", frSens: "Celui dont chaque acte est empreint d'une sagesse parfaite.", enSens: "The One whose every act is of perfect wisdom."),
    AsmaName(numero: 47, arabe: "ٱلْوَدُود", translitteration: "Al-Wadūd", fr: "L'Aimant", en: "The Loving", frSens: "Celui qui aime Ses serviteurs pieux et en est aimé.", enSens: "The One who loves His righteous servants and is loved."),
    AsmaName(numero: 48, arabe: "ٱلْمَجِيد", translitteration: "Al-Majīd", fr: "Le Glorieux", en: "The Most Glorious", frSens: "Celui dont la gloire et la noblesse sont parfaites.", enSens: "The One of perfect glory and nobility."),
    AsmaName(numero: 49, arabe: "ٱلْبَاعِث", translitteration: "Al-Bā'ith", fr: "Celui qui ressuscite", en: "The Resurrector", frSens: "Celui qui ressuscite les morts au Jour du Jugement.", enSens: "The One who raises the dead on Judgement Day."),
    AsmaName(numero: 50, arabe: "ٱلشَّهِيد", translitteration: "Ash-Shahīd", fr: "Le Témoin", en: "The Witness", frSens: "Celui qui est témoin de toute chose.", enSens: "The One who witnesses all things."),
    AsmaName(numero: 51, arabe: "ٱلْحَقّ", translitteration: "Al-Haqq", fr: "La Vérité", en: "The Truth", frSens: "Celui qui est la Vérité même, dont l'existence est certaine.", enSens: "The One who is Truth itself, whose existence is certain."),
    AsmaName(numero: 52, arabe: "ٱلْوَكِيل", translitteration: "Al-Wakīl", fr: "Le Garant", en: "The Trustee", frSens: "Celui à qui l'on confie toute chose et qui suffit.", enSens: "The One to whom all is entrusted and who suffices."),
    AsmaName(numero: 53, arabe: "ٱلْقَوِيّ", translitteration: "Al-Qawī", fr: "Le Fort", en: "The Most Strong", frSens: "Celui dont la force est absolue.", enSens: "The One whose strength is absolute."),
    AsmaName(numero: 54, arabe: "ٱلْمَتِين", translitteration: "Al-Matīn", fr: "L'Inébranlable", en: "The Firm", frSens: "Celui dont la fermeté et la puissance ne faiblissent jamais.", enSens: "The One whose firmness and might never waver."),
    AsmaName(numero: 55, arabe: "ٱلْوَلِيّ", translitteration: "Al-Walī", fr: "Le Protecteur", en: "The Protecting Friend", frSens: "Celui qui soutient et protège les croyants.", enSens: "The One who supports and protects the believers."),
    AsmaName(numero: 56, arabe: "ٱلْحَمِيد", translitteration: "Al-Hamīd", fr: "Le Digne de louange", en: "The Praiseworthy", frSens: "Celui qui mérite toute louange en toute circonstance.", enSens: "The One deserving of all praise in every state."),
    AsmaName(numero: 57, arabe: "ٱلْمُحْصِي", translitteration: "Al-Muhsī", fr: "Celui qui dénombre", en: "The Reckoner of All", frSens: "Celui qui connaît le compte exact de toute chose.", enSens: "The One who knows the exact count of all things."),
    AsmaName(numero: 58, arabe: "ٱلْمُبْدِئ", translitteration: "Al-Mubdi'", fr: "Celui qui initie", en: "The Originator", frSens: "Celui qui commence la création sans précédent.", enSens: "The One who begins creation without precedent."),
    AsmaName(numero: 59, arabe: "ٱلْمُعِيد", translitteration: "Al-Mu'īd", fr: "Celui qui recommence", en: "The Restorer", frSens: "Celui qui redonne vie après la mort.", enSens: "The One who brings back to life after death."),
    AsmaName(numero: 60, arabe: "ٱلْمُحْيِي", translitteration: "Al-Muhyī", fr: "Celui qui donne la vie", en: "The Giver of Life", frSens: "Celui qui donne la vie à toute créature.", enSens: "The One who gives life to all creatures."),
    AsmaName(numero: 61, arabe: "ٱلْمُمِيت", translitteration: "Al-Mumīt", fr: "Celui qui donne la mort", en: "The Bringer of Death", frSens: "Celui qui décrète la mort de toute âme.", enSens: "The One who ordains the death of every soul."),
    AsmaName(numero: 62, arabe: "ٱلْحَيّ", translitteration: "Al-Hayy", fr: "Le Vivant", en: "The Ever-Living", frSens: "Celui qui vit d'une vie éternelle, sans début ni fin.", enSens: "The One who lives eternally, without beginning or end."),
    AsmaName(numero: 63, arabe: "ٱلْقَيُّوم", translitteration: "Al-Qayyūm", fr: "Le Subsistant par Soi", en: "The Self-Subsisting", frSens: "Celui qui subsiste par Lui-même et par qui tout subsiste.", enSens: "The One who subsists by Himself and by whom all subsists."),
    AsmaName(numero: 64, arabe: "ٱلْوَاجِد", translitteration: "Al-Wājid", fr: "Celui qui trouve", en: "The Perceiver", frSens: "Celui qui ne manque de rien et à qui rien n'échappe.", enSens: "The One who lacks nothing and to whom nothing is hidden."),
    AsmaName(numero: 65, arabe: "ٱلْمَاجِد", translitteration: "Al-Mājid", fr: "Le Noble", en: "The Noble", frSens: "Celui dont la gloire et la générosité sont abondantes.", enSens: "The One of abundant glory and generosity."),
    AsmaName(numero: 66, arabe: "ٱلْوَاحِد", translitteration: "Al-Wāhid", fr: "L'Unique", en: "The One", frSens: "Celui qui est un, sans associé ni semblable.", enSens: "The One who is single, without partner or equal."),
    AsmaName(numero: 67, arabe: "ٱلْأَحَد", translitteration: "Al-Ahad", fr: "L'Un", en: "The Indivisible", frSens: "Celui qui est l'unicité absolue, indivisible.", enSens: "The One of absolute, indivisible oneness."),
    AsmaName(numero: 68, arabe: "ٱلصَّمَد", translitteration: "As-Samad", fr: "Le Soutien universel", en: "The Eternal Refuge", frSens: "Celui vers qui tout se tourne, qui n'a besoin de rien.", enSens: "The One all turn to, who needs nothing."),
    AsmaName(numero: 69, arabe: "ٱلْقَادِر", translitteration: "Al-Qādir", fr: "Le Puissant", en: "The Capable", frSens: "Celui qui a pouvoir sur toute chose.", enSens: "The One who has power over all things."),
    AsmaName(numero: 70, arabe: "ٱلْمُقْتَدِر", translitteration: "Al-Muqtadir", fr: "Le Tout-Déterminant", en: "The Omnipotent", frSens: "Celui dont la puissance s'exerce sur tout, sans obstacle.", enSens: "The One whose power prevails over all, unhindered."),
    AsmaName(numero: 71, arabe: "ٱلْمُقَدِّم", translitteration: "Al-Muqaddim", fr: "Celui qui avance", en: "The Expediter", frSens: "Celui qui met en avant qui Il veut.", enSens: "The One who brings forward whom He wills."),
    AsmaName(numero: 72, arabe: "ٱلْمُؤَخِّر", translitteration: "Al-Mu'akhkhir", fr: "Celui qui recule", en: "The Delayer", frSens: "Celui qui retarde qui Il veut, selon Sa sagesse.", enSens: "The One who delays whom He wills, by His wisdom."),
    AsmaName(numero: 73, arabe: "ٱلْأَوَّل", translitteration: "Al-Awwal", fr: "Le Premier", en: "The First", frSens: "Celui qui précède toute chose, sans commencement.", enSens: "The One who precedes all, without beginning."),
    AsmaName(numero: 74, arabe: "ٱلْآخِر", translitteration: "Al-Ākhir", fr: "Le Dernier", en: "The Last", frSens: "Celui qui demeure après toute chose, sans fin.", enSens: "The One who remains after all, without end."),
    AsmaName(numero: 75, arabe: "ٱلظَّاهِر", translitteration: "Az-Zāhir", fr: "L'Apparent", en: "The Manifest", frSens: "Celui dont l'existence est manifeste par Ses signes.", enSens: "The One whose existence is evident through His signs."),
    AsmaName(numero: 76, arabe: "ٱلْبَاطِن", translitteration: "Al-Bātin", fr: "Le Caché", en: "The Hidden", frSens: "Celui que les regards ne peuvent atteindre en ce monde.", enSens: "The One whom sight cannot reach in this world."),
    AsmaName(numero: 77, arabe: "ٱلْوَالِي", translitteration: "Al-Wālī", fr: "Le Maître", en: "The Governor", frSens: "Celui qui gouverne et administre toute chose.", enSens: "The One who rules and administers all things."),
    AsmaName(numero: 78, arabe: "ٱلْمُتَعَالِي", translitteration: "Al-Muta'ālī", fr: "Le Sublime", en: "The Self-Exalted", frSens: "Celui qui est infiniment au-dessus de toute imperfection.", enSens: "The One infinitely above any imperfection."),
    AsmaName(numero: 79, arabe: "ٱلْبَرّ", translitteration: "Al-Barr", fr: "Le Bienfaisant", en: "The Source of Goodness", frSens: "Celui qui comble Ses créatures de bontés.", enSens: "The One who bestows goodness upon His creatures."),
    AsmaName(numero: 80, arabe: "ٱلتَّوَّاب", translitteration: "At-Tawwāb", fr: "Celui qui accueille le repentir", en: "The Ever-Relenting", frSens: "Celui qui accepte sans cesse le retour du pécheur.", enSens: "The One who continually accepts the sinner's return."),
    AsmaName(numero: 81, arabe: "ٱلْمُنْتَقِم", translitteration: "Al-Muntaqim", fr: "Le Vengeur", en: "The Avenger", frSens: "Celui qui châtie avec justice les obstinés dans le mal.", enSens: "The One who justly punishes the persistent wrongdoer."),
    AsmaName(numero: 82, arabe: "ٱلْعَفُوّ", translitteration: "Al-'Afū", fr: "Celui qui efface", en: "The Pardoner", frSens: "Celui qui efface les péchés et les fautes.", enSens: "The One who erases sins and faults."),
    AsmaName(numero: 83, arabe: "ٱلرَّؤُوف", translitteration: "Ar-Ra'ūf", fr: "Le Compatissant", en: "The Most Kind", frSens: "Celui qui est plein de bonté et de douceur.", enSens: "The One full of kindness and gentleness."),
    AsmaName(numero: 84, arabe: "مَالِكُ ٱلْمُلْك", translitteration: "Mālik-ul-Mulk", fr: "Le Roi de la royauté", en: "Master of the Kingdom", frSens: "Celui qui possède toute souveraineté et en dispose à Sa guise.", enSens: "The One who owns all sovereignty and disposes of it as He wills."),
    AsmaName(numero: 85, arabe: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام", translitteration: "Dhul-Jalāli wal-Ikrām", fr: "Le Détenteur de la majesté et de la générosité", en: "Lord of Majesty and Bounty", frSens: "Celui qui réunit majesté suprême et générosité infinie.", enSens: "The One who joins supreme majesty and infinite generosity."),
    AsmaName(numero: 86, arabe: "ٱلْمُقْسِط", translitteration: "Al-Muqsit", fr: "L'Équitable", en: "The Equitable", frSens: "Celui qui agit avec une équité parfaite.", enSens: "The One who acts with perfect fairness."),
    AsmaName(numero: 87, arabe: "ٱلْجَامِع", translitteration: "Al-Jāmi'", fr: "Celui qui rassemble", en: "The Gatherer", frSens: "Celui qui réunira les créatures au Jour du Jugement.", enSens: "The One who will gather all creatures on Judgement Day."),
    AsmaName(numero: 88, arabe: "ٱلْغَنِيّ", translitteration: "Al-Ghanī", fr: "Celui qui se suffit à Lui-même", en: "The Self-Sufficient", frSens: "Celui qui n'a besoin de rien ni de personne.", enSens: "The One who needs nothing and no one."),
    AsmaName(numero: 89, arabe: "ٱلْمُغْنِي", translitteration: "Al-Mughnī", fr: "Celui qui enrichit", en: "The Enricher", frSens: "Celui qui comble Ses serviteurs et les rend indépendants.", enSens: "The One who enriches His servants and makes them free of need."),
    AsmaName(numero: 90, arabe: "ٱلْمَانِع", translitteration: "Al-Māni'", fr: "Celui qui empêche", en: "The Withholder", frSens: "Celui qui retient ce qu'Il veut, par sagesse.", enSens: "The One who withholds what He wills, by wisdom."),
    AsmaName(numero: 91, arabe: "ٱلضَّارّ", translitteration: "Ad-Dārr", fr: "Celui qui peut nuire", en: "The Distresser", frSens: "Celui de qui vient toute épreuve, selon Sa sagesse.", enSens: "The One from whom trials come, by His wisdom."),
    AsmaName(numero: 92, arabe: "ٱلنَّافِع", translitteration: "An-Nāfi'", fr: "Celui qui est utile", en: "The Benefactor", frSens: "Celui de qui vient tout bien et tout profit.", enSens: "The One from whom all good and benefit come."),
    AsmaName(numero: 93, arabe: "ٱلنُّور", translitteration: "An-Nūr", fr: "La Lumière", en: "The Light", frSens: "Celui qui illumine les cieux, la terre et les cœurs.", enSens: "The One who illuminates the heavens, the earth, and hearts."),
    AsmaName(numero: 94, arabe: "ٱلْهَادِي", translitteration: "Al-Hādī", fr: "Le Guide", en: "The Guide", frSens: "Celui qui guide vers la vérité qui Il veut.", enSens: "The One who guides whom He wills to the truth."),
    AsmaName(numero: 95, arabe: "ٱلْبَدِيع", translitteration: "Al-Badī'", fr: "Le Novateur", en: "The Incomparable Originator", frSens: "Celui qui crée sans modèle antérieur, d'une beauté incomparable.", enSens: "The One who creates without prior model, of matchless beauty."),
    AsmaName(numero: 96, arabe: "ٱلْبَاقِي", translitteration: "Al-Bāqī", fr: "Le Permanent", en: "The Everlasting", frSens: "Celui qui demeure éternellement quand tout disparaît.", enSens: "The One who remains eternally when all else perishes."),
    AsmaName(numero: 97, arabe: "ٱلْوَارِث", translitteration: "Al-Wārith", fr: "L'Héritier", en: "The Inheritor", frSens: "Celui à qui tout revient après la disparition des créatures.", enSens: "The One to whom all returns after creatures perish."),
    AsmaName(numero: 98, arabe: "ٱلرَّشِيد", translitteration: "Ar-Rashīd", fr: "Le Guide vers le bien", en: "The Guide to the Right Path", frSens: "Celui qui dirige toute chose vers sa juste fin.", enSens: "The One who directs all things to their right end."),
    AsmaName(numero: 99, arabe: "ٱلصَّبُور", translitteration: "As-Sabūr", fr: "Le Patient", en: "The Most Patient", frSens: "Celui qui ne se hâte pas et donne à chacun son délai.", enSens: "The One who is never hasty and grants everyone their time."),
]
