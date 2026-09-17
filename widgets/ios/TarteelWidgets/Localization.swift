import Foundation

/**
 Accès aux textes localisés des widgets.

 Un widget iOS tourne dans son propre process, hors de React Native : il ne peut
 pas lire l'i18n JavaScript de l'app. Les libellés vivent donc dans les
 `*.lproj/Localizable.strings` de cette extension, et iOS choisit le fichier
 selon la langue de l'appareil — exactement comme Android choisit entre
 `res/values/` et `res/values-en/`.

 `Bundle(for:)` vise le bundle de l'EXTENSION, pas celui de l'app hôte : c'est
 ici que les .strings sont embarqués (expo-widget les ajoute à la phase
 Resources du target widget). Passer par `Bundle.main` chercherait dans l'app et
 renverrait la clé brute.

 Une clé absente renvoie la clé elle-même (comportement standard de
 `NSLocalizedString`) : un libellé qui s'afficherait « w_streak_unit » signale
 une clé manquante dans le .strings, pas un plantage.
 */
private final class WidgetsBundleToken {}

enum L {
    private static let bundle = Bundle(for: WidgetsBundleToken.self)

    /// Texte localisé pour `key`.
    static func t(_ key: String) -> String {
        NSLocalizedString(key, bundle: bundle, comment: "")
    }

    /// Texte localisé avec arguments (`%d`, `%@`…).
    static func t(_ key: String, _ args: CVarArg...) -> String {
        String(format: NSLocalizedString(key, bundle: bundle, comment: ""), arguments: args)
    }
}
