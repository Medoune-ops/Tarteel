import Foundation
import WidgetKit

// Doit rester identique à APP_GROUP dans utils/widgetData.ts : c'est par cet
// App Group que l'app et le widget partagent leurs données. Le suffixe
// `.expowidgets` est imposé par expo-widget, qui construit l'identifiant en dur
// (`group.${bundleIdentifier}.expowidgets`) et l'inscrit dans les entitlements.
let APP_GROUP = "group.com.tarteel.app.expowidgets"

struct WidgetData: Codable {
    var streak: Int
    var xp: Int
    var currentLesson: Int
    var lessonProgress: Int  // 0-100
    var lessonSection: String
    var activeDays: [Bool]   // 7 jours lun-dim
    var motivationMsg: String
    /// Heure locale (0-23) du rappel quotidien — miroir de userStore.reminderHour
    /// côté app, affichée sur le widget "Rappel".
    var reminderHour: Int

    init(streak: Int, xp: Int, currentLesson: Int, lessonProgress: Int, lessonSection: String, activeDays: [Bool], motivationMsg: String, reminderHour: Int) {
        self.streak = streak
        self.xp = xp
        self.currentLesson = currentLesson
        self.lessonProgress = lessonProgress
        self.lessonSection = lessonSection
        self.activeDays = activeDays
        self.motivationMsg = motivationMsg
        self.reminderHour = reminderHour
    }

    // Décodage tolérant : reminderHour est absent des données déjà stockées
    // par une version de l'app antérieure à son ajout — on retombe sur 19h
    // (même défaut que userStore.ts) plutôt que d'échouer tout le décodage.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        streak = try c.decode(Int.self, forKey: .streak)
        xp = try c.decode(Int.self, forKey: .xp)
        currentLesson = try c.decode(Int.self, forKey: .currentLesson)
        lessonProgress = try c.decode(Int.self, forKey: .lessonProgress)
        lessonSection = try c.decode(String.self, forKey: .lessonSection)
        activeDays = try c.decode([Bool].self, forKey: .activeDays)
        motivationMsg = try c.decode(String.self, forKey: .motivationMsg)
        reminderHour = try c.decodeIfPresent(Int.self, forKey: .reminderHour) ?? 19
    }
}

func loadWidgetData() -> WidgetData {
    let defaults = UserDefaults(suiteName: APP_GROUP)
    guard
        let json = defaults?.string(forKey: "tarteel_widget_data"),
        let data = json.data(using: .utf8),
        let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
    else {
        return WidgetData(
            streak: 0,
            xp: 0,
            currentLesson: 1,
            lessonProgress: 0,
            lessonSection: "Alphabet",
            activeDays: Array(repeating: false, count: 7),
            motivationMsg: "Commence ta première leçon !",
            reminderHour: 19
        )
    }
    return decoded
}
