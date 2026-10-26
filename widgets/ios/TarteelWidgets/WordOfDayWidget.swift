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
        GeometryReader { geo in
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
                    Text(L.t("w_wordofday_title"))
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
                        // Les 99 noms sont très inégaux en longueur : le n°85
                        // (ذُو ٱلْجَلَالِ وَٱلْإِكْرَام) fait 28 caractères
                        // contre 13 pour le suivant. Le facteur d'échelle doit
                        // donc pouvoir descendre bas — il ne s'applique que
                        // quand c'est nécessaire, les autres noms gardent
                        // leur taille pleine.
                        .lineLimit(1)
                        .minimumScaleFactor(0.4)
                    Text(name.translitteration)
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundColor(Color(hex: "#8A7A5C"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text(name.traduction)
                        .font(.system(size: 15, weight: .heavy))
                        .foregroundColor(Color(hex: "#1B2333"))
                        // n°85 : « Le Détenteur de la majesté et de la
                        // générosité » = 46 caractères. 2 lignes à 15pt ne
                        // suffisent pas dans un widget small — on autorise 3
                        // lignes et une réduction plus forte plutôt qu'une
                        // troncature avec points de suspension.
                        .lineLimit(3)
                        .minimumScaleFactor(0.6)
                }

                Spacer()

                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 11))
                    Text(L.t("w_wordofday_badge", name.numero))
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
        .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}

// ─── Écran verrouillé · Nom du jour ──────────────────────────────────────────
// En ligne : « ★ Le Gardien · ٱلْحَفِيظ » au-dessus de l'heure.
// Rectangle : « ★ NOM DU JOUR », le nom, sa signification et l'arabe à droite.
// L'écran verrouillé est monochrome : pas de couleur, seulement des opacités.

struct WordOfDayInlineView: View {
    let name: AsmaName
    var body: some View {
        Text("\(Image(systemName: "star.fill")) \(name.traduction) · \(name.arabe)")
    }
}

struct WordOfDayRectangularView: View {
    let name: AsmaName
    var body: some View {
        HStack(alignment: .center, spacing: 6) {
            VStack(alignment: .leading, spacing: 1) {
                HStack(spacing: 3) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 8, weight: .bold))
                    Text(L.t("w_wordofday_caps"))
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(0.6)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .opacity(0.75)
                Text(name.traduction)
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(name.sens)
                    .font(.system(size: 10.5, weight: .semibold))
                    .opacity(0.8)
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Text(name.arabe)
                .font(.system(size: 22, weight: .semibold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.4)
                .frame(maxWidth: 62)
                .environment(\.layoutDirection, .rightToLeft)
        }
        .padding(.horizontal, 6)
    }
}

/// Choisit la vue selon l'emplacement : écran d'accueil ou écran verrouillé.
struct WordOfDayEntryView: View {
    let name: AsmaName
    @Environment(\.widgetFamily) private var family

    var body: some View {
        switch family {
        case .accessoryInline:
            WordOfDayInlineView(name: name)
                .containerBackground(Color.clear, for: .widget)
        case .accessoryRectangular:
            WordOfDayRectangularView(name: name)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        default:
            WordOfDayView(name: name)
                .containerBackground(Color.white, for: .widget)
        }
    }
}

struct WordOfDayWidget: Widget {
    let kind = "TarteelWordOfDay"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { entry in
            WordOfDayEntryView(name: nameOfTheDay(entry.date))
                .widgetURL(URL(string: "tarteel://asma"))
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_wordofday_title"))
        .description(L.t("w_desc_wordofday"))
        .supportedFamilies([.systemSmall, .accessoryInline, .accessoryRectangular])
    }
}

// ─── Écran verrouillé · Loutre (rond) ────────────────────────────────────────
// La mascotte seule, pour ouvrir l'app d'un geste depuis l'écran verrouillé.

struct OtterLockWidget: Widget {
    let kind = "TarteelOtterLock"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TarteelProvider()) { _ in
            Image("Otter")
                .resizable()
                .scaledToFit()
                .padding(7)
                .widgetAccentable()
                .widgetURL(URL(string: "tarteel://"))
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName(L.t("w_otter_title"))
        .description(L.t("w_desc_otter"))
        .supportedFamilies([.accessoryCircular])
    }
}
