import SwiftUI
import WidgetKit

// ─── Série éteinte : état + vues ─────────────────────────────────────────────
// Maquette « Tarteel Widgets Retour ». Les widgets Série (petit) et Ma semaine
// (moyen) basculent sur ces vues dès que la flamme s'éteint :
//   - petit : « Série éteinte » pendant 7 jours, puis « Tu nous manques » ;
//   - moyen : « Recommencer » tant que la série n'est pas rallumée.

enum FlameState {
    case burning
    /// Moins de 7 jours après la perte.
    case ember(lost: Int, daysAway: Int)
    /// Au-delà : on parle d'absence plutôt que de série perdue.
    case away(lost: Int, daysAway: Int)

    var isOut: Bool {
        if case .burning = self { return false }
        return true
    }

    var lost: Int {
        switch self {
        case .burning: return 0
        case .ember(let l, _), .away(let l, _): return l
        }
    }

    /// Même règle que utils/flameTracking.ts, rejouée ici : le widget doit
    /// voir la flamme s'éteindre même si l'app n'est pas rouverte.
    static func from(_ data: WidgetData, now: Date = Date()) -> FlameState {
        guard let f = data.flame else { return .burning }
        let cal = Calendar.current
        let today = cal.startOfDay(for: now)
        let lastActive = f.lastActiveDay.flatMap(parseDay)
        let lost: Int
        let lostDay: Date

        if data.streak > 0 {
            guard let la = lastActive else { return .burning }
            // Hier lu (écart 1) : la flamme brûle encore. Chaque gel couvre un
            // jour manqué de plus.
            if daysBetween(la, today) - 1 <= f.freezes { return .burning }
            lost = data.streak
            lostDay = cal.date(byAdding: .day, value: f.freezes + 2, to: la) ?? today
        } else if f.lostStreak > 0 {
            lost = f.lostStreak
            lostDay = f.lostDay.flatMap(parseDay) ?? today
        } else {
            return .burning
        }

        let away = max(1, lastActive.map { daysBetween($0, today) } ?? daysBetween(lostDay, today) + 1)
        return daysBetween(lostDay, today) < 7
            ? .ember(lost: lost, daysAway: away)
            : .away(lost: lost, daysAway: away)
    }
}

private func parseDay(_ s: String) -> Date? {
    let parts = s.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return nil }
    return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
}

private func daysBetween(_ a: Date, _ b: Date) -> Int {
    let cal = Calendar.current
    return cal.dateComponents([.day], from: cal.startOfDay(for: a), to: cal.startOfDay(for: b)).day ?? 0
}

/// Message selon la durée d'absence (paliers de la maquette).
func awayShortText(_ days: Int) -> String {
    switch days {
    case ...1: return L.t("w_away_t1")
    case 2...3: return L.t("w_away_t2")
    case 4...7: return L.t("w_away_t3")
    default: return L.t("w_away_t4")
    }
}

let FLAME_RELIGHT_URL = URL(string: "tarteel://streak")
let FLAME_RESUME_URL = URL(string: "tarteel://")
let FLAME_READ_URL = URL(string: "tarteel://lecture-libre")

// ─── Couleurs (clair / sombre) ───────────────────────────────────────────────

struct FlamePalette {
    let dark: Bool
    var ember: [Color] {
        dark ? [Color(hex: "#2A1F28"), Color(hex: "#1C141B"), Color(hex: "#120C10")]
             : [Color(hex: "#3A2C36"), Color(hex: "#2A1E28"), Color(hex: "#1E1418")]
    }
    var night: [Color] {
        dark ? [Color(hex: "#2E2070"), Color(hex: "#1C1450"), Color(hex: "#100A30")]
             : [Color(hex: "#5B3FD6"), Color(hex: "#3B2A99"), Color(hex: "#221660")]
    }
    var card: Color { dark ? Color(hex: "#17161E") : .white }
    var ink: Color { dark ? Color(hex: "#EFEEF4") : Color(hex: "#1C1A26") }
    var muted: Color { dark ? Color(hex: "#9290A2") : Color(hex: "#6F6C7A") }
    var track: Color { dark ? Color(hex: "#211F29") : Color(hex: "#F4F1EC") }
    var path: Color { dark ? Color(hex: "#3A3646") : Color(hex: "#DCD6E2") }
}

func flameGradient(_ colors: [Color]) -> LinearGradient {
    LinearGradient(colors: colors, startPoint: UnitPoint(x: 0.3, y: 0), endPoint: UnitPoint(x: 0.7, y: 1))
}

private let EMBER_ORANGE = Color(hex: "#F4633A")
private let ORANGE_CTA = [Color(hex: "#FFB24A"), Color(hex: "#FF7A35"), Color(hex: "#E8501E")]
private let PURPLE_CTA = [Color(hex: "#A58CFF"), Color(hex: "#7C5BF0"), Color(hex: "#5B3FD6")]

// ─── Pièces communes ─────────────────────────────────────────────────────────

/// Flamme éteinte : silhouette cendre, cœur sombre et une braise qui rougeoie.
struct DeadFlame: View {
    let size: CGFloat
    var body: some View {
        ZStack(alignment: .bottom) {
            Image(systemName: "flame.fill")
                .resizable().scaledToFit()
                .frame(width: size, height: size)
                .foregroundColor(Color(hex: "#5B4A57"))
            Image(systemName: "flame.fill")
                .resizable().scaledToFit()
                .frame(width: size * 0.52, height: size * 0.52)
                .foregroundColor(Color(hex: "#3E3240"))
                .padding(.bottom, size * 0.06)
            Circle()
                .fill(Color(hex: "#FF8A3D"))
                .frame(width: size * 0.14, height: size * 0.14)
                .shadow(color: Color(hex: "#FF7832").opacity(0.8), radius: size * 0.08)
                .padding(.bottom, size * 0.12)
        }
        .frame(width: size, height: size * 1.12, alignment: .bottom)
    }
}

/// Nombre barré d'un trait orange incliné (l'ancienne série).
struct StruckNumber: View {
    let text: String
    let size: CGFloat
    var body: some View {
        Text(text)
            .font(.system(size: size, weight: .heavy, design: .rounded))
            .foregroundColor(.white.opacity(0.92))
            .lineLimit(1)
            .minimumScaleFactor(0.5)
            .overlay(
                Capsule()
                    .fill(EMBER_ORANGE)
                    .frame(height: max(3, size / 11))
                    .padding(.horizontal, -3)
                    .rotationEffect(.degrees(-12))
            )
    }
}

/// Bouton « bonbon » des maquettes : pastille d'icône, libellé, flèche.
struct FlameCTA: View {
    let label: String
    let icon: String
    let colors: [Color]
    var height: CGFloat = 36

    var body: some View {
        HStack(spacing: 7) {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.white.opacity(0.25))
                .frame(width: height - 12, height: height - 12)
                .overlay(Image(systemName: icon).font(.system(size: 12, weight: .bold)).foregroundColor(.white))
            Text(label)
                .font(.system(size: 13.5, weight: .heavy, design: .rounded))
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Spacer(minLength: 0)
            Circle()
                .fill(Color.white)
                .frame(width: height - 12, height: height - 12)
                .overlay(Image(systemName: "arrow.right").font(.system(size: 11, weight: .black)).foregroundColor(colors[2]))
        }
        .padding(.leading, 6)
        .padding(.trailing, 4)
        .frame(height: height)
        .background(
            RoundedRectangle(cornerRadius: 13)
                .fill(LinearGradient(colors: colors, startPoint: .top, endPoint: .bottom))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 13)
                .stroke(Color.white.opacity(0.35), lineWidth: 1)
        )
        .shadow(color: colors[2].opacity(0.45), radius: 7, y: 4)
    }
}

// ─── Petit · Série éteinte ───────────────────────────────────────────────────

struct LostSmallView: View {
    let lost: Int
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let pal = FlamePalette(dark: scheme == .dark)
        ZStack {
            flameGradient(pal.ember)
            RadialGradient(colors: [EMBER_ORANGE.opacity(0.35), .clear], center: UnitPoint(x: 0.25, y: 1.05), startRadius: 0, endRadius: 110)

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(L.t("w_lost_caps"))
                        .font(.system(size: 9.5, weight: .black))
                        .tracking(1.1)
                        .foregroundColor(.white.opacity(0.65))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Spacer(minLength: 4)
                    Circle().fill(EMBER_ORANGE).frame(width: 6, height: 6)
                        .overlay(Circle().stroke(EMBER_ORANGE.opacity(0.25), lineWidth: 3))
                }
                HStack(alignment: .bottom, spacing: 10) {
                    DeadFlame(size: 54)
                    VStack(alignment: .leading, spacing: 4) {
                        StruckNumber(text: "\(lost)", size: 40)
                        Text(L.t("w_lost_unit"))
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundColor(.white.opacity(0.7))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    .padding(.bottom, 2)
                }
                .padding(.top, 8)
                Spacer(minLength: 6)
                FlameCTA(label: L.t("w_lost_cta"), icon: "flame.fill", colors: ORANGE_CTA)
            }
            .padding(14)
        }
        .widgetURL(FLAME_RELIGHT_URL)
    }
}

// ─── Petit · Tu nous manques ─────────────────────────────────────────────────

struct AwaySmallView: View {
    let daysAway: Int
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let pal = FlamePalette(dark: scheme == .dark)
        ZStack {
            flameGradient(pal.night)
            RadialGradient(colors: [Color(hex: "#BEAAFF").opacity(0.35), .clear], center: UnitPoint(x: 0.95, y: 0), startRadius: 0, endRadius: 90)
            // Quelques étoiles.
            GeometryReader { g in
                ForEach(0..<4, id: \.self) { i in
                    let pos: [(CGFloat, CGFloat, CGFloat)] = [(0.42, 0.20, 3), (0.57, 0.12, 2), (0.34, 0.37, 2), (0.66, 0.34, 3)]
                    Circle()
                        .fill(i == 3 ? Color(hex: "#FFE7A0") : .white)
                        .frame(width: pos[i].2, height: pos[i].2)
                        .opacity(0.75)
                        .position(x: g.size.width * pos[i].0, y: g.size.height * pos[i].1)
                }
            }

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(L.t("w_away_caps"))
                        .font(.system(size: 9.5, weight: .black))
                        .tracking(1.1)
                        .foregroundColor(.white.opacity(0.7))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Spacer(minLength: 4)
                    Image(systemName: "moon.fill")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#FFE7A0"))
                }
                HStack(alignment: .bottom, spacing: 0) {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(alignment: .firstTextBaseline, spacing: 3) {
                            Text("\(daysAway)")
                                .font(.system(size: 44, weight: .heavy, design: .rounded))
                                .lineLimit(1)
                                .minimumScaleFactor(0.5)
                            Text(L.t("w_away_days"))
                                .font(.system(size: 14, weight: .heavy, design: .rounded))
                                .opacity(0.85)
                        }
                        .foregroundColor(.white)
                        Text(awayShortText(daysAway))
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundColor(.white.opacity(0.75))
                            .lineLimit(2)
                            .minimumScaleFactor(0.8)
                    }
                    .padding(.bottom, 4)
                    Spacer(minLength: 0)
                    ZStack(alignment: .topTrailing) {
                        Image("Otter")
                            .resizable().scaledToFit()
                            .frame(width: 62, height: 62)
                            .opacity(0.95)
                        Text("Zz")
                            .font(.system(size: 11, weight: .heavy, design: .rounded))
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 1)
                            .background(RoundedRectangle(cornerRadius: 9).fill(Color.white.opacity(0.18)))
                            .offset(x: 4, y: -10)
                    }
                }
                .padding(.top, 4)
                Spacer(minLength: 6)
                FlameCTA(label: L.t("w_away_cta"), icon: "book.fill", colors: PURPLE_CTA)
            }
            .padding(14)
        }
        .widgetURL(FLAME_RESUME_URL)
    }
}

// ─── Moyen · Recommencer ─────────────────────────────────────────────────────

struct RestartMediumView: View {
    let lost: Int
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let pal = FlamePalette(dark: scheme == .dark)
        GeometryReader { outer in
            HStack(spacing: 0) {
                // ── Ancienne série ──
                ZStack {
                    flameGradient(pal.ember)
                    RadialGradient(colors: [EMBER_ORANGE.opacity(0.35), .clear], center: UnitPoint(x: 0.3, y: 1.05), startRadius: 0, endRadius: 100)
                    VStack(spacing: 0) {
                        Text(L.t("w_restart_old_caps"))
                            .font(.system(size: 8.5, weight: .black))
                            .tracking(1)
                            .foregroundColor(.white.opacity(0.6))
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        Spacer(minLength: 4)
                        DeadFlame(size: 50)
                        StruckNumber(text: L.t("w_days_short", lost), size: 28)
                            .padding(.top, 6)
                        Spacer(minLength: 4)
                    }
                    .padding(12)
                }
                .frame(width: max(100, outer.size.width * 0.33))

                // ── Nouveau départ ──
                VStack(alignment: .leading, spacing: 0) {
                    Text(L.t("w_restart_caps"))
                        .font(.system(size: 9.5, weight: .black))
                        .tracking(1.1)
                        .foregroundColor(EMBER_ORANGE)
                    Text(L.t("w_restart_title"))
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundColor(pal.ink)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .padding(.top, 1)

                    // Chemin J1 → J7
                    HStack(spacing: 0) {
                        Circle()
                            .fill(LinearGradient(colors: [Color(hex: "#FFB24A"), Color(hex: "#E8501E")], startPoint: .top, endPoint: .bottom))
                            .frame(width: 28, height: 28)
                            .shadow(color: EMBER_ORANGE.opacity(0.5), radius: 4, y: 2)
                            .overlay(Image(systemName: "flame.fill").font(.system(size: 14)).foregroundColor(Color(hex: "#FFF3C4")))
                        ForEach(0..<5, id: \.self) { _ in
                            Spacer(minLength: 2)
                            Circle()
                                .fill(pal.card)
                                .frame(width: 22, height: 22)
                                .overlay(Image(systemName: "flame.fill").font(.system(size: 10)).foregroundColor(pal.path))
                        }
                        Spacer(minLength: 2)
                        Circle()
                            .fill(LinearGradient(colors: [Color(hex: "#FFE08A"), Color(hex: "#E0A02C")], startPoint: .top, endPoint: .bottom))
                            .frame(width: 28, height: 28)
                            .overlay(Image(systemName: "trophy.fill").font(.system(size: 13)).foregroundColor(.white))
                    }
                    .padding(4)
                    .background(Capsule().fill(pal.track))
                    .padding(.top, 8)

                    HStack {
                        Text(L.t("w_restart_today")).foregroundColor(EMBER_ORANGE)
                        Spacer(minLength: 4)
                        Text(L.t("w_restart_goal")).foregroundColor(pal.muted)
                    }
                    .font(.system(size: 9, weight: .black))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .padding(.horizontal, 6)
                    .padding(.top, 4)

                    Spacer(minLength: 6)
                    FlameCTA(label: L.t("w_restart_cta"), icon: "book.fill", colors: ORANGE_CTA, height: 34)
                }
                .padding(EdgeInsets(top: 14, leading: 14, bottom: 12, trailing: 14))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(pal.card)
            }
            .frame(width: outer.size.width, height: outer.size.height)
        }
        .widgetURL(FLAME_READ_URL)
    }
}
