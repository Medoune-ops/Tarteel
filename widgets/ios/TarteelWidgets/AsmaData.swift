// ─── Les 99 noms d'Allah (Asmā' ul-Ḥusnā) — copie Swift ────────────────
// Généré depuis constants/asmaulHusna.ts (source de vérité, TS) — garder les
// deux fichiers synchronisés si le contenu religieux est corrigé ou complété.
// ⚠️ CONTENU RELIGIEUX — voir le fichier TS pour la note de relecture.
//
// `traduction` choisit fr/en selon la langue de l'appareil, comme les libellés
// des .lproj : sans ça le widget affichait le nom en français sur un téléphone
// en anglais, alors que la traduction anglaise existait déjà côté TS.

import Foundation

struct AsmaName {
    let numero: Int
    let arabe: String
    let translitteration: String
    let fr: String
    let en: String

    /// Traduction dans la langue de l'appareil (repli français).
    var traduction: String {
        let lang = Bundle.main.preferredLocalizations.first ?? "fr"
        return lang.hasPrefix("en") ? en : fr
    }
}

let ASMA_UL_HUSNA: [AsmaName] = [
    AsmaName(numero: 1, arabe: "ٱلرَّحْمَٰن", translitteration: "Ar-Rahmān", fr: "Le Tout Miséricordieux", en: "The Most Compassionate"),
    AsmaName(numero: 2, arabe: "ٱلرَّحِيم", translitteration: "Ar-Rahīm", fr: "Le Très Miséricordieux", en: "The Most Merciful"),
    AsmaName(numero: 3, arabe: "ٱلْمَلِك", translitteration: "Al-Malik", fr: "Le Souverain", en: "The King"),
    AsmaName(numero: 4, arabe: "ٱلْقُدُّوس", translitteration: "Al-Quddūs", fr: "Le Pur", en: "The Most Holy"),
    AsmaName(numero: 5, arabe: "ٱلسَّلَام", translitteration: "As-Salām", fr: "La Paix", en: "The Source of Peace"),
    AsmaName(numero: 6, arabe: "ٱلْمُؤْمِن", translitteration: "Al-Mu'min", fr: "Le Rassurant", en: "The Granter of Security"),
    AsmaName(numero: 7, arabe: "ٱلْمُهَيْمِن", translitteration: "Al-Muhaymin", fr: "Le Gardien", en: "The Guardian"),
    AsmaName(numero: 8, arabe: "ٱلْعَزِيز", translitteration: "Al-'Azīz", fr: "Le Tout-Puissant", en: "The Almighty"),
    AsmaName(numero: 9, arabe: "ٱلْجَبَّار", translitteration: "Al-Jabbār", fr: "Le Contraignant", en: "The Compeller"),
    AsmaName(numero: 10, arabe: "ٱلْمُتَكَبِّر", translitteration: "Al-Mutakabbir", fr: "Le Suprême", en: "The Supreme"),
    AsmaName(numero: 11, arabe: "ٱلْخَالِق", translitteration: "Al-Khāliq", fr: "Le Créateur", en: "The Creator"),
    AsmaName(numero: 12, arabe: "ٱلْبَارِئ", translitteration: "Al-Bāri'", fr: "Le Producteur", en: "The Maker"),
    AsmaName(numero: 13, arabe: "ٱلْمُصَوِّر", translitteration: "Al-Musawwir", fr: "Le Formateur", en: "The Fashioner"),
    AsmaName(numero: 14, arabe: "ٱلْغَفَّار", translitteration: "Al-Ghaffār", fr: "Le Grand Pardonneur", en: "The Ever-Forgiving"),
    AsmaName(numero: 15, arabe: "ٱلْقَهَّار", translitteration: "Al-Qahhār", fr: "Le Dominateur", en: "The Subduer"),
    AsmaName(numero: 16, arabe: "ٱلْوَهَّاب", translitteration: "Al-Wahhāb", fr: "Le Donateur", en: "The Bestower"),
    AsmaName(numero: 17, arabe: "ٱلرَّزَّاق", translitteration: "Ar-Razzāq", fr: "Le Pourvoyeur", en: "The Provider"),
    AsmaName(numero: 18, arabe: "ٱلْفَتَّاح", translitteration: "Al-Fattāh", fr: "Celui qui ouvre", en: "The Opener"),
    AsmaName(numero: 19, arabe: "ٱلْعَلِيم", translitteration: "Al-'Alīm", fr: "L'Omniscient", en: "The All-Knowing"),
    AsmaName(numero: 20, arabe: "ٱلْقَابِض", translitteration: "Al-Qābid", fr: "Celui qui restreint", en: "The Withholder"),
    AsmaName(numero: 21, arabe: "ٱلْبَاسِط", translitteration: "Al-Bāsit", fr: "Celui qui étend", en: "The Expander"),
    AsmaName(numero: 22, arabe: "ٱلْخَافِض", translitteration: "Al-Khāfid", fr: "Celui qui abaisse", en: "The Abaser"),
    AsmaName(numero: 23, arabe: "ٱلرَّافِع", translitteration: "Ar-Rāfi'", fr: "Celui qui élève", en: "The Exalter"),
    AsmaName(numero: 24, arabe: "ٱلْمُعِزّ", translitteration: "Al-Mu'izz", fr: "Celui qui honore", en: "The Honorer"),
    AsmaName(numero: 25, arabe: "ٱلْمُذِلّ", translitteration: "Al-Mudhill", fr: "Celui qui humilie", en: "The Humiliator"),
    AsmaName(numero: 26, arabe: "ٱلسَّمِيع", translitteration: "As-Samī'", fr: "Celui qui entend tout", en: "The All-Hearing"),
    AsmaName(numero: 27, arabe: "ٱلْبَصِير", translitteration: "Al-Basīr", fr: "Celui qui voit tout", en: "The All-Seeing"),
    AsmaName(numero: 28, arabe: "ٱلْحَكَم", translitteration: "Al-Hakam", fr: "Le Juge", en: "The Judge"),
    AsmaName(numero: 29, arabe: "ٱلْعَدْل", translitteration: "Al-'Adl", fr: "Le Juste", en: "The Utterly Just"),
    AsmaName(numero: 30, arabe: "ٱللَّطِيف", translitteration: "Al-Latīf", fr: "Le Subtil", en: "The Subtle One"),
    AsmaName(numero: 31, arabe: "ٱلْخَبِير", translitteration: "Al-Khabīr", fr: "Le Parfaitement Informé", en: "The All-Aware"),
    AsmaName(numero: 32, arabe: "ٱلْحَلِيم", translitteration: "Al-Halīm", fr: "Le Longanime", en: "The Forbearing"),
    AsmaName(numero: 33, arabe: "ٱلْعَظِيم", translitteration: "Al-'Azīm", fr: "Le Magnifique", en: "The Magnificent"),
    AsmaName(numero: 34, arabe: "ٱلْغَفُور", translitteration: "Al-Ghafūr", fr: "Le Pardonneur", en: "The All-Forgiving"),
    AsmaName(numero: 35, arabe: "ٱلشَّكُور", translitteration: "Ash-Shakūr", fr: "Le Reconnaissant", en: "The Appreciative"),
    AsmaName(numero: 36, arabe: "ٱلْعَلِيّ", translitteration: "Al-'Alī", fr: "Le Très-Haut", en: "The Most High"),
    AsmaName(numero: 37, arabe: "ٱلْكَبِير", translitteration: "Al-Kabīr", fr: "Le Grand", en: "The Most Great"),
    AsmaName(numero: 38, arabe: "ٱلْحَفِيظ", translitteration: "Al-Hafīz", fr: "Le Gardien", en: "The Preserver"),
    AsmaName(numero: 39, arabe: "ٱلْمُقِيت", translitteration: "Al-Muqīt", fr: "Le Nourricier", en: "The Sustainer"),
    AsmaName(numero: 40, arabe: "ٱلْحَسِيب", translitteration: "Al-Hasīb", fr: "Celui qui suffit", en: "The Reckoner"),
    AsmaName(numero: 41, arabe: "ٱلْجَلِيل", translitteration: "Al-Jalīl", fr: "Le Majestueux", en: "The Majestic"),
    AsmaName(numero: 42, arabe: "ٱلْكَرِيم", translitteration: "Al-Karīm", fr: "Le Généreux", en: "The Generous"),
    AsmaName(numero: 43, arabe: "ٱلرَّقِيب", translitteration: "Ar-Raqīb", fr: "Le Vigilant", en: "The Watchful"),
    AsmaName(numero: 44, arabe: "ٱلْمُجِيب", translitteration: "Al-Mujīb", fr: "Celui qui exauce", en: "The Responsive"),
    AsmaName(numero: 45, arabe: "ٱلْوَاسِع", translitteration: "Al-Wāsi'", fr: "L'Immense", en: "The All-Encompassing"),
    AsmaName(numero: 46, arabe: "ٱلْحَكِيم", translitteration: "Al-Hakīm", fr: "Le Sage", en: "The All-Wise"),
    AsmaName(numero: 47, arabe: "ٱلْوَدُود", translitteration: "Al-Wadūd", fr: "L'Aimant", en: "The Loving"),
    AsmaName(numero: 48, arabe: "ٱلْمَجِيد", translitteration: "Al-Majīd", fr: "Le Glorieux", en: "The Most Glorious"),
    AsmaName(numero: 49, arabe: "ٱلْبَاعِث", translitteration: "Al-Bā'ith", fr: "Celui qui ressuscite", en: "The Resurrector"),
    AsmaName(numero: 50, arabe: "ٱلشَّهِيد", translitteration: "Ash-Shahīd", fr: "Le Témoin", en: "The Witness"),
    AsmaName(numero: 51, arabe: "ٱلْحَقّ", translitteration: "Al-Haqq", fr: "La Vérité", en: "The Truth"),
    AsmaName(numero: 52, arabe: "ٱلْوَكِيل", translitteration: "Al-Wakīl", fr: "Le Garant", en: "The Trustee"),
    AsmaName(numero: 53, arabe: "ٱلْقَوِيّ", translitteration: "Al-Qawī", fr: "Le Fort", en: "The Most Strong"),
    AsmaName(numero: 54, arabe: "ٱلْمَتِين", translitteration: "Al-Matīn", fr: "L'Inébranlable", en: "The Firm"),
    AsmaName(numero: 55, arabe: "ٱلْوَلِيّ", translitteration: "Al-Walī", fr: "Le Protecteur", en: "The Protecting Friend"),
    AsmaName(numero: 56, arabe: "ٱلْحَمِيد", translitteration: "Al-Hamīd", fr: "Le Digne de louange", en: "The Praiseworthy"),
    AsmaName(numero: 57, arabe: "ٱلْمُحْصِي", translitteration: "Al-Muhsī", fr: "Celui qui dénombre", en: "The Reckoner of All"),
    AsmaName(numero: 58, arabe: "ٱلْمُبْدِئ", translitteration: "Al-Mubdi'", fr: "Celui qui initie", en: "The Originator"),
    AsmaName(numero: 59, arabe: "ٱلْمُعِيد", translitteration: "Al-Mu'īd", fr: "Celui qui recommence", en: "The Restorer"),
    AsmaName(numero: 60, arabe: "ٱلْمُحْيِي", translitteration: "Al-Muhyī", fr: "Celui qui donne la vie", en: "The Giver of Life"),
    AsmaName(numero: 61, arabe: "ٱلْمُمِيت", translitteration: "Al-Mumīt", fr: "Celui qui donne la mort", en: "The Bringer of Death"),
    AsmaName(numero: 62, arabe: "ٱلْحَيّ", translitteration: "Al-Hayy", fr: "Le Vivant", en: "The Ever-Living"),
    AsmaName(numero: 63, arabe: "ٱلْقَيُّوم", translitteration: "Al-Qayyūm", fr: "Le Subsistant par Soi", en: "The Self-Subsisting"),
    AsmaName(numero: 64, arabe: "ٱلْوَاجِد", translitteration: "Al-Wājid", fr: "Celui qui trouve", en: "The Perceiver"),
    AsmaName(numero: 65, arabe: "ٱلْمَاجِد", translitteration: "Al-Mājid", fr: "Le Noble", en: "The Noble"),
    AsmaName(numero: 66, arabe: "ٱلْوَاحِد", translitteration: "Al-Wāhid", fr: "L'Unique", en: "The One"),
    AsmaName(numero: 67, arabe: "ٱلْأَحَد", translitteration: "Al-Ahad", fr: "L'Un", en: "The Indivisible"),
    AsmaName(numero: 68, arabe: "ٱلصَّمَد", translitteration: "As-Samad", fr: "Le Soutien universel", en: "The Eternal Refuge"),
    AsmaName(numero: 69, arabe: "ٱلْقَادِر", translitteration: "Al-Qādir", fr: "Le Puissant", en: "The Capable"),
    AsmaName(numero: 70, arabe: "ٱلْمُقْتَدِر", translitteration: "Al-Muqtadir", fr: "Le Tout-Déterminant", en: "The Omnipotent"),
    AsmaName(numero: 71, arabe: "ٱلْمُقَدِّم", translitteration: "Al-Muqaddim", fr: "Celui qui avance", en: "The Expediter"),
    AsmaName(numero: 72, arabe: "ٱلْمُؤَخِّر", translitteration: "Al-Mu'akhkhir", fr: "Celui qui recule", en: "The Delayer"),
    AsmaName(numero: 73, arabe: "ٱلْأَوَّل", translitteration: "Al-Awwal", fr: "Le Premier", en: "The First"),
    AsmaName(numero: 74, arabe: "ٱلْآخِر", translitteration: "Al-Ākhir", fr: "Le Dernier", en: "The Last"),
    AsmaName(numero: 75, arabe: "ٱلظَّاهِر", translitteration: "Az-Zāhir", fr: "L'Apparent", en: "The Manifest"),
    AsmaName(numero: 76, arabe: "ٱلْبَاطِن", translitteration: "Al-Bātin", fr: "Le Caché", en: "The Hidden"),
    AsmaName(numero: 77, arabe: "ٱلْوَالِي", translitteration: "Al-Wālī", fr: "Le Maître", en: "The Governor"),
    AsmaName(numero: 78, arabe: "ٱلْمُتَعَالِي", translitteration: "Al-Muta'ālī", fr: "Le Sublime", en: "The Self-Exalted"),
    AsmaName(numero: 79, arabe: "ٱلْبَرّ", translitteration: "Al-Barr", fr: "Le Bienfaisant", en: "The Source of Goodness"),
    AsmaName(numero: 80, arabe: "ٱلتَّوَّاب", translitteration: "At-Tawwāb", fr: "Celui qui accueille le repentir", en: "The Ever-Relenting"),
    AsmaName(numero: 81, arabe: "ٱلْمُنْتَقِم", translitteration: "Al-Muntaqim", fr: "Le Vengeur", en: "The Avenger"),
    AsmaName(numero: 82, arabe: "ٱلْعَفُوّ", translitteration: "Al-'Afū", fr: "Celui qui efface", en: "The Pardoner"),
    AsmaName(numero: 83, arabe: "ٱلرَّؤُوف", translitteration: "Ar-Ra'ūf", fr: "Le Compatissant", en: "The Most Kind"),
    AsmaName(numero: 84, arabe: "مَالِكُ ٱلْمُلْك", translitteration: "Mālik-ul-Mulk", fr: "Le Roi de la royauté", en: "Master of the Kingdom"),
    AsmaName(numero: 85, arabe: "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام", translitteration: "Dhul-Jalāli wal-Ikrām", fr: "Le Détenteur de la majesté et de la générosité", en: "Lord of Majesty and Bounty"),
    AsmaName(numero: 86, arabe: "ٱلْمُقْسِط", translitteration: "Al-Muqsit", fr: "L'Équitable", en: "The Equitable"),
    AsmaName(numero: 87, arabe: "ٱلْجَامِع", translitteration: "Al-Jāmi'", fr: "Celui qui rassemble", en: "The Gatherer"),
    AsmaName(numero: 88, arabe: "ٱلْغَنِيّ", translitteration: "Al-Ghanī", fr: "Celui qui se suffit à Lui-même", en: "The Self-Sufficient"),
    AsmaName(numero: 89, arabe: "ٱلْمُغْنِي", translitteration: "Al-Mughnī", fr: "Celui qui enrichit", en: "The Enricher"),
    AsmaName(numero: 90, arabe: "ٱلْمَانِع", translitteration: "Al-Māni'", fr: "Celui qui empêche", en: "The Withholder"),
    AsmaName(numero: 91, arabe: "ٱلضَّارّ", translitteration: "Ad-Dārr", fr: "Celui qui peut nuire", en: "The Distresser"),
    AsmaName(numero: 92, arabe: "ٱلنَّافِع", translitteration: "An-Nāfi'", fr: "Celui qui est utile", en: "The Benefactor"),
    AsmaName(numero: 93, arabe: "ٱلنُّور", translitteration: "An-Nūr", fr: "La Lumière", en: "The Light"),
    AsmaName(numero: 94, arabe: "ٱلْهَادِي", translitteration: "Al-Hādī", fr: "Le Guide", en: "The Guide"),
    AsmaName(numero: 95, arabe: "ٱلْبَدِيع", translitteration: "Al-Badī'", fr: "Le Novateur", en: "The Incomparable Originator"),
    AsmaName(numero: 96, arabe: "ٱلْبَاقِي", translitteration: "Al-Bāqī", fr: "Le Permanent", en: "The Everlasting"),
    AsmaName(numero: 97, arabe: "ٱلْوَارِث", translitteration: "Al-Wārith", fr: "L'Héritier", en: "The Inheritor"),
    AsmaName(numero: 98, arabe: "ٱلرَّشِيد", translitteration: "Ar-Rashīd", fr: "Le Guide vers le bien", en: "The Guide to the Right Path"),
    AsmaName(numero: 99, arabe: "ٱلصَّبُور", translitteration: "As-Sabūr", fr: "Le Patient", en: "The Most Patient"),
]
