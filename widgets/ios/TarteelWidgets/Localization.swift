import Foundation

/**
 Textes localisés des widgets.

 Un widget iOS tourne dans son propre process, hors de React Native : il ne peut
 pas lire l'i18n JavaScript de l'app. Les libellés fixes vivent donc ici.

 Pourquoi des tables Swift et pas des `*.lproj/Localizable.strings` : expo-widget
 n'embarque pas correctement les .lproj dans l'extension (il ajoute les deux
 `Localizable.strings` à plat, hors de la phase Resources du target widget).
 `NSLocalizedString` ne trouvait donc aucun fichier et renvoyait la clé brute :
 les widgets affichaient « w_week_title » au lieu de « Ma semaine ». Des tables
 compilées dans le binaire ne dépendent d'aucune ressource à embarquer.

 La langue suit celle de l'appareil, comme Android choisit entre `res/values/`
 et `res/values-en/` : anglais si l'appareil est en anglais, français sinon.
 `Locale.preferredLanguages` est la liste réglée par l'utilisateur ; elle ne
 dépend pas des langues déclarées par le bundle, contrairement à
 `Bundle.preferredLocalizations`.

 Les clés reprennent celles d'Android (w_*) pour que les deux plateformes
 restent comparables d'un coup d'œil.
 */
enum L {
    /// `true` si l'appareil est réglé en anglais.
    static var isEnglish: Bool {
        (Locale.preferredLanguages.first ?? "fr").hasPrefix("en")
    }

    private static let fr: [String: String] = [
        "w_streak_label":      "Série",
        "w_streak_unit":       "jours de suite",
        "w_week_title":        "Ma semaine",
        "w_reminder_label":    "Rappel",
        "w_reminder_message":  "Ta série t'attend",
        "w_reminder_duration": "3 min suffisent",
        "w_day_mon":           "L",
        "w_day_tue":           "M",
        "w_day_wed":           "M",
        "w_day_thu":           "J",
        "w_day_fri":           "V",
        "w_day_sat":           "S",
        "w_day_sun":           "D",
        "w_wordofday_title":   "Mot du jour",
        "w_wordofday_badge":   "Nom n° %d sur 99",
        "w_desc_streak":       "Ta série de jours consécutifs.",
        "w_desc_continue":     "Un petit rappel pour garder ta série.",
        "w_desc_week":         "Ta progression sur les 7 derniers jours.",
        "w_desc_wordofday":    "Un nom d'Allah différent chaque jour.",
    ]

    private static let en: [String: String] = [
        "w_streak_label":      "Streak",
        "w_streak_unit":       "days in a row",
        "w_week_title":        "My week",
        "w_reminder_label":    "Reminder",
        "w_reminder_message":  "Your streak is waiting",
        "w_reminder_duration": "3 min is enough",
        "w_day_mon":           "M",
        "w_day_tue":           "T",
        "w_day_wed":           "W",
        "w_day_thu":           "T",
        "w_day_fri":           "F",
        "w_day_sat":           "S",
        "w_day_sun":           "S",
        "w_wordofday_title":   "Word of the day",
        "w_wordofday_badge":   "Name #%d of 99",
        "w_desc_streak":       "Your day streak.",
        "w_desc_continue":     "A little nudge to keep your streak alive.",
        "w_desc_week":         "Your learning week.",
        "w_desc_wordofday":    "A different name of Allah every day.",
    ]

    /// Texte localisé pour `key`. Repli : français, puis la clé elle-même —
    /// un libellé affiché « w_xxx » signale une clé absente des deux tables.
    static func t(_ key: String) -> String {
        (isEnglish ? en[key] : nil) ?? fr[key] ?? key
    }

    /// Texte localisé avec arguments (`%d`, `%@`…).
    static func t(_ key: String, _ args: CVarArg...) -> String {
        String(format: t(key), arguments: args)
    }
}
