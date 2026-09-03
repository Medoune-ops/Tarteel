import SwiftUI
import WidgetKit

// ─── Helper Color(hex:) ───────────────────────────────────────────────────────
extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        let r = Double((rgb >> 16) & 0xFF) / 255
        let g = Double((rgb >> 8)  & 0xFF) / 255
        let b = Double(rgb         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// ─── Widget 1 : Petit · Série ────────────────────────────────────────────────
struct StreakSmallWidget: Widget {
    let kind = "TarteelStreakSmall"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            StreakSmallView(data: entry.data)
                // iOS 17+ peint cette couleur dans la marge "safe" entre le
                // contenu et les coins arrondis du widget. En .clear, cette
                // marge laissait voir le fond d'écran d'accueil à travers —
                // d'où l'impression que le widget ne remplissait pas son
                // cadre. On reprend la couleur de départ du dégradé de la vue
                // pour que la transition soit invisible.
                .containerBackground(Color(hex: "#FF9A3D"), for: .widget)
        }
        .configurationDisplayName("Série")
        .description("Ta série de jours consécutifs.")
        .supportedFamilies([.systemSmall])
    }
}

// ─── Widget 2 : Petit · Rappel ───────────────────────────────────────────────
struct ContinueSmallWidget: Widget {
    let kind = "TarteelContinueSmall"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            ContinueSmallView(data: entry.data)
                .containerBackground(Color(hex: "#6244DE"), for: .widget)
        }
        .configurationDisplayName("Rappel")
        .description("Un petit rappel pour garder ta série.")
        .supportedFamilies([.systemSmall])
    }
}

// ─── Widget 3 : Moyen · Ma semaine ───────────────────────────────────────────
struct WeekMediumWidget: Widget {
    let kind = "TarteelWeekMedium"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            WeekMediumView(data: entry.data)
                // La vue mêle deux fonds (colonne orange à gauche, panneau
                // blanc à droite) : blanc reste le compromis le moins visible
                // sur la marge système, la colonne orange étant la plus
                // étroite des deux.
                .containerBackground(Color.white, for: .widget)
        }
        .configurationDisplayName("Ma semaine")
        .description("Ta progression sur les 7 derniers jours.")
        .supportedFamilies([.systemMedium])
    }
}

// ─── Bundle ───────────────────────────────────────────────────────────────────
@main
struct TarteelWidgetBundle: WidgetBundle {
    var body: some Widget {
        StreakSmallWidget()
        ContinueSmallWidget()
        WeekMediumWidget()
        WordOfDayWidget()
    }
}
