package com.tarteel.sn

import java.util.Calendar
import java.util.TimeZone

// ─── Les 99 noms d'Allah (Asmā' ul-Ḥusnā) — copie Kotlin ────────────────────
// Généré depuis constants/asmaulHusna.ts (source de vérité, TS) — garder les
// fichiers synchronisés si le contenu religieux est corrigé ou complété.
// ⚠️ CONTENU RELIGIEUX — voir le fichier TS pour la note de relecture.

data class AsmaName(val numero: Int, val arabe: String, val translitteration: String, val fr: String)

val ASMA_UL_HUSNA: List<AsmaName> = listOf(
    AsmaName(1, "ٱلرَّحْمَٰن", "Ar-Rahmān", "Le Tout Miséricordieux"),
    AsmaName(2, "ٱلرَّحِيم", "Ar-Rahīm", "Le Très Miséricordieux"),
    AsmaName(3, "ٱلْمَلِك", "Al-Malik", "Le Souverain"),
    AsmaName(4, "ٱلْقُدُّوس", "Al-Quddūs", "Le Pur"),
    AsmaName(5, "ٱلسَّلَام", "As-Salām", "La Paix"),
    AsmaName(6, "ٱلْمُؤْمِن", "Al-Mu'min", "Le Rassurant"),
    AsmaName(7, "ٱلْمُهَيْمِن", "Al-Muhaymin", "Le Gardien"),
    AsmaName(8, "ٱلْعَزِيز", "Al-'Azīz", "Le Tout-Puissant"),
    AsmaName(9, "ٱلْجَبَّار", "Al-Jabbār", "Le Contraignant"),
    AsmaName(10, "ٱلْمُتَكَبِّر", "Al-Mutakabbir", "Le Suprême"),
    AsmaName(11, "ٱلْخَالِق", "Al-Khāliq", "Le Créateur"),
    AsmaName(12, "ٱلْبَارِئ", "Al-Bāri'", "Le Producteur"),
    AsmaName(13, "ٱلْمُصَوِّر", "Al-Musawwir", "Le Formateur"),
    AsmaName(14, "ٱلْغَفَّار", "Al-Ghaffār", "Le Grand Pardonneur"),
    AsmaName(15, "ٱلْقَهَّار", "Al-Qahhār", "Le Dominateur"),
    AsmaName(16, "ٱلْوَهَّاب", "Al-Wahhāb", "Le Donateur"),
    AsmaName(17, "ٱلرَّزَّاق", "Ar-Razzāq", "Le Pourvoyeur"),
    AsmaName(18, "ٱلْفَتَّاح", "Al-Fattāh", "Celui qui ouvre"),
    AsmaName(19, "ٱلْعَلِيم", "Al-'Alīm", "L'Omniscient"),
    AsmaName(20, "ٱلْقَابِض", "Al-Qābid", "Celui qui restreint"),
    AsmaName(21, "ٱلْبَاسِط", "Al-Bāsit", "Celui qui étend"),
    AsmaName(22, "ٱلْخَافِض", "Al-Khāfid", "Celui qui abaisse"),
    AsmaName(23, "ٱلرَّافِع", "Ar-Rāfi'", "Celui qui élève"),
    AsmaName(24, "ٱلْمُعِزّ", "Al-Mu'izz", "Celui qui honore"),
    AsmaName(25, "ٱلْمُذِلّ", "Al-Mudhill", "Celui qui humilie"),
    AsmaName(26, "ٱلسَّمِيع", "As-Samī'", "Celui qui entend tout"),
    AsmaName(27, "ٱلْبَصِير", "Al-Basīr", "Celui qui voit tout"),
    AsmaName(28, "ٱلْحَكَم", "Al-Hakam", "Le Juge"),
    AsmaName(29, "ٱلْعَدْل", "Al-'Adl", "Le Juste"),
    AsmaName(30, "ٱللَّطِيف", "Al-Latīf", "Le Subtil"),
    AsmaName(31, "ٱلْخَبِير", "Al-Khabīr", "Le Parfaitement Informé"),
    AsmaName(32, "ٱلْحَلِيم", "Al-Halīm", "Le Longanime"),
    AsmaName(33, "ٱلْعَظِيم", "Al-'Azīm", "Le Magnifique"),
    AsmaName(34, "ٱلْغَفُور", "Al-Ghafūr", "Le Pardonneur"),
    AsmaName(35, "ٱلشَّكُور", "Ash-Shakūr", "Le Reconnaissant"),
    AsmaName(36, "ٱلْعَلِيّ", "Al-'Alī", "Le Très-Haut"),
    AsmaName(37, "ٱلْكَبِير", "Al-Kabīr", "Le Grand"),
    AsmaName(38, "ٱلْحَفِيظ", "Al-Hafīz", "Le Gardien"),
    AsmaName(39, "ٱلْمُقِيت", "Al-Muqīt", "Le Nourricier"),
    AsmaName(40, "ٱلْحَسِيب", "Al-Hasīb", "Celui qui suffit"),
    AsmaName(41, "ٱلْجَلِيل", "Al-Jalīl", "Le Majestueux"),
    AsmaName(42, "ٱلْكَرِيم", "Al-Karīm", "Le Généreux"),
    AsmaName(43, "ٱلرَّقِيب", "Ar-Raqīb", "Le Vigilant"),
    AsmaName(44, "ٱلْمُجِيب", "Al-Mujīb", "Celui qui exauce"),
    AsmaName(45, "ٱلْوَاسِع", "Al-Wāsi'", "L'Immense"),
    AsmaName(46, "ٱلْحَكِيم", "Al-Hakīm", "Le Sage"),
    AsmaName(47, "ٱلْوَدُود", "Al-Wadūd", "L'Aimant"),
    AsmaName(48, "ٱلْمَجِيد", "Al-Majīd", "Le Glorieux"),
    AsmaName(49, "ٱلْبَاعِث", "Al-Bā'ith", "Celui qui ressuscite"),
    AsmaName(50, "ٱلشَّهِيد", "Ash-Shahīd", "Le Témoin"),
    AsmaName(51, "ٱلْحَقّ", "Al-Haqq", "La Vérité"),
    AsmaName(52, "ٱلْوَكِيل", "Al-Wakīl", "Le Garant"),
    AsmaName(53, "ٱلْقَوِيّ", "Al-Qawī", "Le Fort"),
    AsmaName(54, "ٱلْمَتِين", "Al-Matīn", "L'Inébranlable"),
    AsmaName(55, "ٱلْوَلِيّ", "Al-Walī", "Le Protecteur"),
    AsmaName(56, "ٱلْحَمِيد", "Al-Hamīd", "Le Digne de louange"),
    AsmaName(57, "ٱلْمُحْصِي", "Al-Muhsī", "Celui qui dénombre"),
    AsmaName(58, "ٱلْمُبْدِئ", "Al-Mubdi'", "Celui qui initie"),
    AsmaName(59, "ٱلْمُعِيد", "Al-Mu'īd", "Celui qui recommence"),
    AsmaName(60, "ٱلْمُحْيِي", "Al-Muhyī", "Celui qui donne la vie"),
    AsmaName(61, "ٱلْمُمِيت", "Al-Mumīt", "Celui qui donne la mort"),
    AsmaName(62, "ٱلْحَيّ", "Al-Hayy", "Le Vivant"),
    AsmaName(63, "ٱلْقَيُّوم", "Al-Qayyūm", "Le Subsistant par Soi"),
    AsmaName(64, "ٱلْوَاجِد", "Al-Wājid", "Celui qui trouve"),
    AsmaName(65, "ٱلْمَاجِد", "Al-Mājid", "Le Noble"),
    AsmaName(66, "ٱلْوَاحِد", "Al-Wāhid", "L'Unique"),
    AsmaName(67, "ٱلْأَحَد", "Al-Ahad", "L'Un"),
    AsmaName(68, "ٱلصَّمَد", "As-Samad", "Le Soutien universel"),
    AsmaName(69, "ٱلْقَادِر", "Al-Qādir", "Le Puissant"),
    AsmaName(70, "ٱلْمُقْتَدِر", "Al-Muqtadir", "Le Tout-Déterminant"),
    AsmaName(71, "ٱلْمُقَدِّم", "Al-Muqaddim", "Celui qui avance"),
    AsmaName(72, "ٱلْمُؤَخِّر", "Al-Mu'akhkhir", "Celui qui recule"),
    AsmaName(73, "ٱلْأَوَّل", "Al-Awwal", "Le Premier"),
    AsmaName(74, "ٱلْآخِر", "Al-Ākhir", "Le Dernier"),
    AsmaName(75, "ٱلظَّاهِر", "Az-Zāhir", "L'Apparent"),
    AsmaName(76, "ٱلْبَاطِن", "Al-Bātin", "Le Caché"),
    AsmaName(77, "ٱلْوَالِي", "Al-Wālī", "Le Maître"),
    AsmaName(78, "ٱلْمُتَعَالِي", "Al-Muta'ālī", "Le Sublime"),
    AsmaName(79, "ٱلْبَرّ", "Al-Barr", "Le Bienfaisant"),
    AsmaName(80, "ٱلتَّوَّاب", "At-Tawwāb", "Celui qui accueille le repentir"),
    AsmaName(81, "ٱلْمُنْتَقِم", "Al-Muntaqim", "Le Vengeur"),
    AsmaName(82, "ٱلْعَفُوّ", "Al-'Afū", "Celui qui efface"),
    AsmaName(83, "ٱلرَّؤُوف", "Ar-Ra'ūf", "Le Compatissant"),
    AsmaName(84, "مَالِكُ ٱلْمُلْك", "Mālik-ul-Mulk", "Le Roi de la royauté"),
    AsmaName(85, "ذُو ٱلْجَلَالِ وَٱلْإِكْرَام", "Dhul-Jalāli wal-Ikrām", "Le Détenteur de la majesté et de la générosité"),
    AsmaName(86, "ٱلْمُقْسِط", "Al-Muqsit", "L'Équitable"),
    AsmaName(87, "ٱلْجَامِع", "Al-Jāmi'", "Celui qui rassemble"),
    AsmaName(88, "ٱلْغَنِيّ", "Al-Ghanī", "Celui qui se suffit à Lui-même"),
    AsmaName(89, "ٱلْمُغْنِي", "Al-Mughnī", "Celui qui enrichit"),
    AsmaName(90, "ٱلْمَانِع", "Al-Māni'", "Celui qui empêche"),
    AsmaName(91, "ٱلضَّارّ", "Ad-Dārr", "Celui qui peut nuire"),
    AsmaName(92, "ٱلنَّافِع", "An-Nāfi'", "Celui qui est utile"),
    AsmaName(93, "ٱلنُّور", "An-Nūr", "La Lumière"),
    AsmaName(94, "ٱلْهَادِي", "Al-Hādī", "Le Guide"),
    AsmaName(95, "ٱلْبَدِيع", "Al-Badī'", "Le Novateur"),
    AsmaName(96, "ٱلْبَاقِي", "Al-Bāqī", "Le Permanent"),
    AsmaName(97, "ٱلْوَارِث", "Al-Wārith", "L'Héritier"),
    AsmaName(98, "ٱلرَّشِيد", "Ar-Rashīd", "Le Guide vers le bien"),
    AsmaName(99, "ٱلصَّبُور", "As-Sabūr", "Le Patient"),
)

/**
 * Nom d'Allah du jour : avance de 1 par jour calendaire (UTC), boucle sur
 * les 99 noms indéfiniment. Calcul identique à utils/nameOfDay.ts et
 * widgets/ios/TarteelWidgets/WordOfDayWidget.swift (même date d'ancrage).
 */
fun nameOfTheDay(): AsmaName {
    val utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    val anchor = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
        set(2024, Calendar.JANUARY, 1, 0, 0, 0)
        set(Calendar.MILLISECOND, 0)
    }
    utc.set(Calendar.HOUR_OF_DAY, 0)
    utc.set(Calendar.MINUTE, 0)
    utc.set(Calendar.SECOND, 0)
    utc.set(Calendar.MILLISECOND, 0)
    val daysSinceAnchor = ((utc.timeInMillis - anchor.timeInMillis) / 86400000L).toInt()
    val index = ((daysSinceAnchor % 99) + 99) % 99
    return ASMA_UL_HUSNA[index]
}
