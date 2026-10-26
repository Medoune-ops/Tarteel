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
            StreakSmallEntryView(data: entry.data, flame: FlameState.from(entry.data, now: entry.date))
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
            WeekMediumEntryView(data: entry.data, flame: FlameState.from(entry.data, now: entry.date))
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

// Choisit la vue du widget Série selon la flamme : allumée, éteinte depuis
// moins d'une semaine, ou absence plus longue.
struct StreakSmallEntryView: View {
    let data: WidgetData
    let flame: FlameState
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        switch flame {
        case .burning:
            StreakSmallView(data: data)
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
        case .ember(let lost, _):
            LostSmallView(lost: lost)
                .containerBackground(for: .widget) { flameGradient(FlamePalette(dark: scheme == .dark).ember) }
        case .away(_, let days):
            AwaySmallView(daysAway: days)
                .containerBackground(for: .widget) { flameGradient(FlamePalette(dark: scheme == .dark).night) }
        }
    }
}

struct WeekMediumEntryView: View {
    let data: WidgetData
    let flame: FlameState
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        if flame.isOut {
            RestartMediumView(lost: flame.lost)
                .containerBackground(FlamePalette(dark: scheme == .dark).card, for: .widget)
        } else {
            WeekMediumView(data: data)
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
        // Heures de prière (PrayerWidgets.swift).
        PrayerNextWidget()
        PrayerDayWidget()
        PrayerAllWidget()
        PrayerLargeWidget()
        PrayerLockWidget()
        // Écran verrouillé : la loutre (WordOfDayWidget.swift). Un
        // WidgetBundle accepte jusqu'à 10 widgets : on y est. Pour en ajouter
        // un autre, il faudra regrouper des widgets dans un second bundle.
        OtterLockWidget()
    }
}
