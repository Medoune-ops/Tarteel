import SwiftUI
import WidgetKit

// ─── Widget Petit · Mot du jour (2×2) ────────────────────────────────────────
// Fait défiler les 99 noms d'Allah un par un, un nom par jour calendaire,
// et boucle indéfiniment (jour 100 -> nom n°1). Calcul déterministe à partir
// de la date : aucune synchronisation via l'App Group n'est nécessaire ici.
// Le même calcul existe côté JS dans utils/nameOfDay.ts (ANCHOR identique)
// pour que l'app et le widget affichent toujours le même nom le même jour.

/// 1er janvier 2024, minuit UTC — jour où l'on affiche le nom n°1.
private let asmaAnchor: Date = {
    var c = DateComponents()
    c.year = 2024; c.month = 1; c.day = 1
    var utc = Calendar(identifier: .gregorian)
    utc.timeZone = TimeZone(identifier: "UTC")!
    return utc.date(from: c)!
}()

func nameOfTheDay(_ date: Date = Date()) -> AsmaName {
    var utc = Calendar(identifier: .gregorian)
    utc.timeZone = TimeZone(identifier: "UTC")!
    let today = utc.startOfDay(for: date)
    let daysSinceAnchor = utc.dateComponents([.day], from: asmaAnchor, to: today).day ?? 0
    let index = ((daysSinceAnchor % 99) + 99) % 99
    return ASMA_UL_HUSNA[index]
}

struct WordOfDayView: View {
    let name: AsmaName

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.white, Color(hex: "#FFF7EA")],
                startPoint: UnitPoint(x: 0.5, y: -0.2),
                endPoint: UnitPoint(x: 0.5, y: 1.2)
            )

            // Étoile décorative en filigrane
            Image(systemName: "sparkle")
                .resizable()
                .scaledToFit()
                .frame(width: 90)
                .foregroundColor(Color(hex: "#C2860C").opacity(0.12))
                .offset(x: 46, y: 46)

            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 5) {
                    Image(systemName: "sparkle")
                        .font(.system(size: 12))
                    Text("Mot du jour")
                        .font(.system(size: 11.5, weight: .heavy))
                }
                .foregroundColor(Color(hex: "#C2860C"))

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text(name.arabe)
                        // Police système : la police custom Scheherazade New n'est
                        // pas embarquée dans le bundle de l'extension widget.
                        .font(.system(size: 34, weight: .semibold, design: .serif))
                        .foregroundColor(Color(hex: "#1B2333"))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .environment(\.layoutDirection, .rightToLeft)
                    Text(name.translitteration)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundColor(Color(hex: "#8A7A5C"))
                    Text(name.fr)
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundColor(Color(hex: "#1B2333"))
                        .lineLimit(2)
                        .minimumScaleFactor(0.75)
                }

                Spacer()

                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 11))
                    Text("Nom n° \(name.numero) sur 99")
                        .font(.system(size: 10.5, weight: .heavy))
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .foregroundColor(Color(hex: "#96660A"))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color(hex: "#FFF1D6"))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(16)
        }
    }
}

struct WordOfDayWidget: Widget {
    let kind = "TarteelWordOfDay"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            WordOfDayView(name: nameOfTheDay(entry.date))
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("Mot du jour")
        .description("Un nom d'Allah différent chaque jour.")
        .supportedFamilies([.systemSmall])
    }
}
