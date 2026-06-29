import Foundation
import WidgetKit

let APP_GROUP = "group.com.tarteel.app"

struct WidgetData: Codable {
    var streak: Int
    var xp: Int
    var currentLesson: Int
    var lessonProgress: Int  // 0-100
    var lessonSection: String
    var activeDays: [Bool]   // 7 jours lun-dim
    var motivationMsg: String
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
            motivationMsg: "Commence ta première leçon !"
        )
    }
    return decoded
}
