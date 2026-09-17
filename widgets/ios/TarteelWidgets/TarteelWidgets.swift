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
                // iOS 17+ peint ceci dans la marge "safe" entre le contenu et
                // les coins arrondis du widget — doit matcher le fond réel de
                // la vue (radial gradient) pour que la transition soit invisible.
                .containerBackground(for: .widget) {
                    RadialGradient(
                        colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                        center: UnitPoint(x: 0.8, y: 0),
                        startRadius: 0,
                        endRadius: 200
                    )
                }
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_streak_label"))
        .description(L.t("w_desc_streak"))
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
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_reminder_label"))
        .description(L.t("w_desc_continue"))
        .supportedFamilies([.systemSmall])
    }
}

// ─── Widget 3 : Moyen · Ma semaine ───────────────────────────────────────────
struct WeekMediumWidget: Widget {
    let kind = "TarteelWeekMedium"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            WeekMediumView(data: entry.data)
                // La marge "safe" ajoutée par containerBackground doit matcher
                // ce qui touche RÉELLEMENT le bord du widget à cet endroit :
                // à gauche la colonne orange (~36% de la largeur, radial
                // gradient), à droite le panneau blanc/lavande. Une seule
                // couleur unie créerait un liseré visible d'un côté ou l'autre.
                .containerBackground(for: .widget) {
                    RadialGradient(
                        colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                        center: UnitPoint(x: 0.72, y: 0),
                        startRadius: 0,
                        endRadius: 160
                    )
                }
        }
        // Supprime le padding interne par défaut que WidgetKit ajoute autour
        // du contenu depuis iOS 17 : c'est CE padding système (pas la marge
        // de containerBackground) qui laissait un liseré visible tout autour
        // de la colonne orange — la vue déclare déjà elle-même tout son
        // padding (colonne gauche pleine hauteur/largeur, colonne droite
        // avec ses propres marges), donc le padding système en plus était
        // superflu et cassait l'alignement au bord.
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_week_title"))
        .description(L.t("w_desc_week"))
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
