import SwiftUI
import WidgetKit

// ─── Widgets « Heures de prière » ────────────────────────────────────────────
// Fidèles à la maquette « Tarteel Widgets Priere » : petit (prochaine prière),
// petit (arc du jour), moyen (toutes les prières), grand (journée + Qibla) et
// écran verrouillé (en ligne, circulaire, rectangulaire).
//
// Le widget ne calcule PAS les horaires : la librairie `adhan` est en JS.
// L'app écrit 7 jours de créneaux dans le JSON partagé (champ `prayer`, voir
// utils/widgetData.ts) et le widget se contente de choisir, selon l'heure, la
// prière en cours et la suivante. Il reste donc juste une semaine sans que
// l'app soit rouverte.

// MARK: - Modèle

private let PRAYER_AR: [String: String] = [
    "fajr": "الفجر", "sunrise": "الشروق", "dhuhr": "الظهر",
    "asr": "العصر", "maghrib": "المغرب", "isha": "العشاء",
]

private let PRAYER_SHORT: [String: String] = [
    "fajr": "FAJR", "sunrise": "SHUR", "dhuhr": "DHUHR",
    "asr": "ASR", "maghrib": "MAGH", "isha": "ISHA",
]

/// Fond des pastilles de la liste (grand widget) : le ciel à l'heure de la prière.
private let PRAYER_SKY: [String: [String]] = [
    "fajr": ["#3B3F8C", "#C77A9A"], "sunrise": ["#F6B26B", "#F7D88A"],
    "dhuhr": ["#5BB8F0", "#FFE08A"], "asr": ["#E9A94B", "#F7D27A"],
    "maghrib": ["#D9564A", "#F29A5B"], "isha": ["#141C3E", "#3A4A8A"],
]

struct PrayerSlotW: Identifiable {
    let key: String
    let date: Date
    var id: Double { date.timeIntervalSince1970 }
    /// Le chourouq est affiché mais n'est jamais « la prochaine prière ».
    var isMain: Bool { key != "sunrise" }
    var name: String { L.t("w_p_\(key)") }
    var arabic: String { PRAYER_AR[key] ?? "" }
    var short: String { PRAYER_SHORT[key] ?? key.uppercased() }
    var time: String { prayerTimeFormatter.string(from: date) }
}

private let prayerTimeFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "HH:mm"
    return f
}()

/// Ce que tous les widgets prière affichent à un instant donné.
struct PrayerState {
    let now: Date
    let city: String
    let qibla: Double
    /// Les 6 créneaux du jour (5 prières + chourouq), dans l'ordre.
    let today: [PrayerSlotW]
    /// Prochaine prière (jamais le chourouq) — peut être le Fajr du lendemain.
    let next: PrayerSlotW
    /// Prière qui suit `next`.
    let after: PrayerSlotW?
    /// Dernier créneau passé (chourouq compris) : début de la barre de progression.
    let previous: PrayerSlotW?

    var mainToday: [PrayerSlotW] { today.filter { $0.isMain } }

    /// Nombre de prières du jour pas encore passées (la prochaine comprise).
    var remainingToday: Int { mainToday.filter { $0.date > now }.count }

    /// Avancée entre le créneau précédent et la prochaine prière (0…1).
    var segmentProgress: Double {
        let start = previous?.date ?? next.date.addingTimeInterval(-6 * 3600)
        let span = next.date.timeIntervalSince(start)
        guard span > 0 else { return 0 }
        return min(1, max(0, now.timeIntervalSince(start) / span))
    }

    /// Temps restant avant la prochaine prière : « 2 h 11 » / « 11 min ».
    var countdown: String {
        let minutes = max(0, Int((next.date.timeIntervalSince(now) / 60).rounded(.up)))
        let h = minutes / 60, m = minutes % 60
        if L.isEnglish { return h > 0 ? "\(h)h \(m)m" : "\(m) min" }
        return h > 0 ? "\(h) h \(String(format: "%02d", m))" : "\(m) min"
    }

    var countdownLabel: String { L.t("w_p_in", countdown) }

    static func make(_ data: PrayerWidgetData, now: Date) -> PrayerState? {
        let cal = Calendar.current
        let slots = data.slots
            .map { PrayerSlotW(key: $0.k, date: Date(timeIntervalSince1970: $0.t)) }
            .sorted { $0.date < $1.date }
        let today = slots.filter { cal.isDate($0.date, inSameDayAs: now) }
        let mains = slots.filter { $0.isMain }
        // Plus de prière à venir dans les données : l'app n'a pas été ouverte
        // depuis une semaine. On affiche l'état vide plutôt qu'un horaire faux.
        guard !today.isEmpty, let nextIdx = mains.firstIndex(where: { $0.date > now }) else { return nil }
        let next = mains[nextIdx]
        let after = nextIdx + 1 < mains.count ? mains[nextIdx + 1] : nil
        let previous = slots.last { $0.date <= now }
        let city = (data.city?.isEmpty == false ? data.city : nil) ?? L.t("w_p_my_location")
        return PrayerState(now: now, city: city, qibla: data.qibla, today: today,
                           next: next, after: after, previous: previous)
    }
}

/// Date de l'Hégire du jour (« 12 joum. I 1448 »).
private func hijriString(_ date: Date) -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .islamicUmmAlQura)
    f.locale = Locale(identifier: L.isEnglish ? "en" : "fr")
    f.dateFormat = "d MMM y"
    return f.string(from: date)
}

/// Point cardinal de la Qibla (« E », « NE »…), lettres françaises ou anglaises.
private func cardinal(_ deg: Double) -> String {
    let fr = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"]
    let en = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    let i = Int(((deg.truncatingRemainder(dividingBy: 360) + 360 + 22.5) / 45)) % 8
    return (L.isEnglish ? en : fr)[i]
}

/// Données d'exemple pour l'aperçu (galerie de widgets, placeholder) : les
/// horaires de Dakar, calés sur la journée en cours.
private func samplePrayerData(_ now: Date) -> PrayerWidgetData {
    let cal = Calendar.current
    let base = cal.startOfDay(for: now)
    let mins: [(String, Int)] = [("fajr", 351), ("sunrise", 423), ("dhuhr", 775),
                                 ("asr", 974), ("maghrib", 1125), ("isha", 1193)]
    var slots: [PrayerWidgetData.Slot] = []
    for d in 0..<2 {
        for (k, m) in mins {
            let date = base.addingTimeInterval(Double(d * 86400 + m * 60))
            slots.append(.init(k: k, t: date.timeIntervalSince1970))
        }
    }
    return PrayerWidgetData(city: "Dakar", qibla: 74, slots: slots)
}

// MARK: - Timeline

struct PrayerEntry: TimelineEntry {
    let date: Date
    let state: PrayerState?
}

struct PrayerProvider: TimelineProvider {
    private func sampleEntry() -> PrayerEntry {
        // 10:44 : la maquette (Dhuhr dans 2 h 11).
        let now = Calendar.current.startOfDay(for: Date()).addingTimeInterval(644 * 60)
        return PrayerEntry(date: now, state: PrayerState.make(samplePrayerData(now), now: now))
    }

    func placeholder(in context: Context) -> PrayerEntry { sampleEntry() }

    func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
        guard let data = loadWidgetData().prayer, let state = PrayerState.make(data, now: Date()) else {
            // Galerie de widgets : montrer à quoi ressemble le widget plutôt
            // qu'un état vide, même si aucune ville n'est encore choisie.
            completion(context.isPreview ? sampleEntry() : PrayerEntry(date: Date(), state: nil))
            return
        }
        completion(PrayerEntry(date: Date(), state: state))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
        let now = Date()
        guard let data = loadWidgetData().prayer else {
            // Sans position : l'app rechargera les timelines dès qu'une ville
            // sera choisie (WidgetCenter.reloadAllTimelines dans Module.swift).
            completion(Timeline(entries: [PrayerEntry(date: now, state: nil)],
                                policy: .after(now.addingTimeInterval(6 * 3600))))
            return
        }
        // Une entrée par minute sur 3 h : le compte à rebours reste juste à la
        // minute près. Ces entrées sont calculées d'avance et ne consomment pas
        // le budget de rafraîchissement ; seul le rechargement toutes les 3 h
        // en consomme (≈ 8 par jour, bien sous la limite).
        let start = Calendar.current.dateInterval(of: .minute, for: now)?.start ?? now
        let entries = (0..<180).map { i -> PrayerEntry in
            let d = start.addingTimeInterval(Double(i * 60))
            return PrayerEntry(date: d, state: PrayerState.make(data, now: d))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Palette (clair / sombre)

private struct PrayerPalette {
    let card: Color, ink: Color, muted: Color, line: Color
    let accent: Color, accentSoft: Color, arcTrack: Color, nextBg: Color
    let hero: [Color]
    let pastOpacity: Double

    static func of(_ scheme: ColorScheme) -> PrayerPalette {
        scheme == .dark
            ? PrayerPalette(card: Color(hex: "#151C1A"), ink: Color(hex: "#EDF3F0"), muted: Color(hex: "#8C9893"),
                            line: Color(hex: "#232C29"), accent: Color(hex: "#3DCB98"),
                            accentSoft: Color(hex: "#3DCB98").opacity(0.14), arcTrack: Color(hex: "#2E3A36"),
                            nextBg: Color(hex: "#3DCB98").opacity(0.13),
                            hero: [Color(hex: "#08201A"), Color(hex: "#0D3328"), Color(hex: "#13503E")],
                            pastOpacity: 0.4)
            : PrayerPalette(card: .white, ink: Color(hex: "#16201C"), muted: Color(hex: "#6E7873"),
                            line: Color(hex: "#ECEEEA"), accent: Color(hex: "#1A8F69"),
                            accentSoft: Color(hex: "#E2F2EA"), arcTrack: Color(hex: "#C9D6D0"),
                            nextBg: Color(hex: "#E6F4EC"),
                            hero: [Color(hex: "#166F55"), Color(hex: "#1E8E6A"), Color(hex: "#2BA47D")],
                            pastOpacity: 0.45)
    }

    var heroGradient: LinearGradient {
        LinearGradient(colors: hero, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

private let SUN = Color(hex: "#FFD66B")
private let SUN_INK = Color(hex: "#1C1A26")

/// Halo doré décoratif des en-têtes verts.
private struct SunGlow: View {
    let size: CGFloat
    var body: some View {
        Circle()
            .fill(RadialGradient(colors: [SUN.opacity(0.35), SUN.opacity(0)],
                                 center: .center, startRadius: 0, endRadius: size * 0.65))
            .frame(width: size, height: size)
    }
}

private func locationPin(_ size: CGFloat = 9) -> some View {
    Image(systemName: "mappin.and.ellipse").font(.system(size: size, weight: .bold))
}

// MARK: - État vide

private struct PrayerEmptyView: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let p = PrayerPalette.of(scheme)
        ZStack {
            p.heroGradient
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: "moon.stars.fill").font(.system(size: 20)).foregroundColor(SUN)
                Spacer()
                Text(L.t("w_p_empty_title"))
                    .font(.system(size: 16, weight: .heavy, design: .rounded))
                    .foregroundColor(.white)
                Text(L.t("w_p_empty_body"))
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white.opacity(0.85))
                    .lineLimit(2)
            }
            .padding(15)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}

// MARK: - Petit · Prochaine prière

private struct PrayerNextSmallView: View {
    let s: PrayerState
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let p = PrayerPalette.of(scheme)
        ZStack(alignment: .topTrailing) {
            p.heroGradient
            SunGlow(size: 130).offset(x: 40, y: -40)
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(L.t("w_p_next")).font(.system(size: 11, weight: .heavy)).opacity(0.9)
                    Spacer()
                    Text(s.next.arabic).font(.system(size: 15, design: .serif))
                }
                Text(s.next.name)
                    .font(.system(size: 22, weight: .heavy, design: .rounded))
                    .lineLimit(1).minimumScaleFactor(0.7)
                    .padding(.top, 6)
                Text(s.next.time)
                    .font(.system(size: 42, weight: .heavy, design: .rounded))
                    .lineLimit(1).minimumScaleFactor(0.6)
                Spacer(minLength: 0)
                HStack {
                    Text(s.countdownLabel)
                        .font(.system(size: 11, weight: .black))
                        .padding(.horizontal, 9).padding(.vertical, 4)
                        .background(Color.white.opacity(0.2), in: RoundedRectangle(cornerRadius: 10))
                    Spacer(minLength: 4)
                    HStack(spacing: 3) {
                        locationPin(9)
                        Text(s.city).font(.system(size: 10, weight: .heavy)).lineLimit(1)
                    }
                    .opacity(0.85)
                }
            }
            .foregroundColor(.white)
            .padding(15)
        }
    }
}

// MARK: - Petit · Arc du jour

/// Arc du soleil, de peu avant le Fajr à peu après l'Isha.
private struct SunArc: View {
    let s: PrayerState
    let p: PrayerPalette

    /// Fenêtre de l'arc : 20 min avant le Fajr → 20 min après l'Isha.
    private var window: (Date, Date) {
        let mains = s.mainToday
        return ((mains.first?.date ?? s.now).addingTimeInterval(-20 * 60),
                (mains.last?.date ?? s.now).addingTimeInterval(20 * 60))
    }

    private func fraction(_ d: Date) -> Double {
        let (t0, t1) = window
        let span = t1.timeIntervalSince(t0)
        return span > 0 ? min(1, max(0, d.timeIntervalSince(t0) / span)) : 0
    }

    /// Point de l'arc (demi-ellipse) pour une avancée 0…1, de gauche à droite.
    private func point(_ f: Double, in size: CGSize) -> CGPoint {
        let a = Double.pi * (1 - f)
        let rx = Double(size.width) / 2 - 4, ry = Double(size.height) - 10
        return CGPoint(x: Double(size.width) / 2 + rx * cos(a), y: Double(size.height) - 4 - ry * sin(a))
    }

    private func arc(upTo: Double, in size: CGSize) -> Path {
        var path = Path()
        let steps = 48
        for i in 0...steps {
            let pt = point(upTo * Double(i) / Double(steps), in: size)
            if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
        }
        return path
    }

    private func baseline(in size: CGSize) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: size.height - 4))
        path.addLine(to: CGPoint(x: size.width, y: size.height - 4))
        return path
    }

    private func dotColor(_ slot: PrayerSlotW) -> Color {
        if slot.date == s.next.date { return p.card }
        return slot.date < s.now ? p.accent : p.arcTrack
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                baseline(in: geo.size).stroke(p.line, lineWidth: 1)
                arc(upTo: 1, in: geo.size)
                    .stroke(p.arcTrack, style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [2, 4]))
                arc(upTo: fraction(s.now), in: geo.size)
                    .stroke(p.accent, style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
                ForEach(s.mainToday) { slot in
                    Circle()
                        .fill(dotColor(slot))
                        .overlay(Circle().stroke(slot.date == s.next.date ? p.accent : Color.clear, lineWidth: 2.5))
                        .frame(width: slot.date == s.next.date ? 10 : 6, height: slot.date == s.next.date ? 10 : 6)
                        .position(point(fraction(slot.date), in: geo.size))
                }
                Circle()
                    .fill(SUN)
                    .frame(width: 14, height: 14)
                    .shadow(color: SUN.opacity(0.6), radius: 6)
                    .position(point(fraction(s.now), in: geo.size))
            }
        }
    }
}

private struct PrayerArcSmallView: View {
    let s: PrayerState
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let p = PrayerPalette.of(scheme)
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(L.t("w_p_today"))
                Spacer()
                Text(s.city).lineLimit(1)
            }
            .font(.system(size: 11, weight: .heavy))
            .foregroundColor(p.muted)
            SunArc(s: s, p: p)
                .frame(height: 66)
                .padding(.top, 10)
            Spacer(minLength: 0)
            HStack(alignment: .firstTextBaseline) {
                Text(s.next.name).foregroundColor(p.ink)
                    .lineLimit(1).minimumScaleFactor(0.7)
                Spacer(minLength: 4)
                Text(s.next.time).foregroundColor(p.accent)
            }
            .font(.system(size: 20, weight: .heavy, design: .rounded))
            Text("\(s.countdownLabel) · \(L.t("w_p_left", s.remainingToday))")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(p.muted)
                .lineLimit(1).minimumScaleFactor(0.8)
                .padding(.top, 3)
        }
        .padding(15)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(p.card)
    }
}

// MARK: - Moyen · Toutes les prières

/// Barre d'avancée entre le créneau précédent et la prochaine prière.
private struct SegmentBar: View {
    let progress: Double
    let p: PrayerPalette
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack(alignment: .leading) {
                Capsule().fill(p.line).frame(height: 8)
                Capsule()
                    .fill(LinearGradient(colors: [p.accentSoft, p.accent], startPoint: .leading, endPoint: .trailing))
                    .frame(width: max(8, w * progress), height: 8)
                Circle()
                    .fill(SUN)
                    .overlay(Circle().stroke(p.card, lineWidth: 3))
                    .frame(width: 16, height: 16)
                    .offset(x: min(max(0, w * progress - 8), w - 16))
            }
            .frame(height: 16)
        }
        .frame(height: 16)
    }
}

private struct PrayerMediumView: View {
    let s: PrayerState
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let p = PrayerPalette.of(scheme)
        HStack(spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                p.heroGradient
                SunGlow(size: 150).offset(x: -30, y: 50)
                VStack(alignment: .leading, spacing: 0) {
                    Text(L.t("w_p_next_caps")).font(.system(size: 10, weight: .heavy)).opacity(0.8)
                    HStack(alignment: .firstTextBaseline) {
                        Text(s.next.name).font(.system(size: 19, weight: .heavy, design: .rounded))
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Spacer(minLength: 2)
                        Text(s.next.arabic).font(.system(size: 16, design: .serif)).opacity(0.85)
                    }
                    .padding(.top, 4)
                    Text(s.next.time)
                        .font(.system(size: 38, weight: .heavy, design: .rounded))
                        .lineLimit(1).minimumScaleFactor(0.6)
                    Spacer(minLength: 0)
                    HStack(spacing: 4) {
                        Image(systemName: "bell.fill").font(.system(size: 9))
                        Text(s.countdownLabel).font(.system(size: 11, weight: .black)).lineLimit(1)
                    }
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color.white.opacity(0.2), in: RoundedRectangle(cornerRadius: 9))
                }
                .foregroundColor(.white)
                .padding(14)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(width: 128)

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    HStack(spacing: 3) { locationPin(9); Text(s.city).lineLimit(1) }
                    Spacer(minLength: 4)
                    Text(hijriString(s.now)).lineLimit(1)
                }
                .font(.system(size: 10, weight: .heavy))
                .foregroundColor(p.muted)

                if let prev = s.previous {
                    HStack {
                        Text("\(prev.name) \(prev.time)").foregroundColor(p.muted)
                        Spacer(minLength: 2)
                        Text("\(s.next.name) \(s.next.time)").foregroundColor(p.accent)
                    }
                    .font(.system(size: 10, weight: .heavy))
                    .lineLimit(1).minimumScaleFactor(0.8)
                    .padding(.top, 12)
                }
                SegmentBar(progress: s.segmentProgress, p: p).padding(.top, 5)
                Text(L.t("w_p_elapsed", Int((s.segmentProgress * 100).rounded())))
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(p.muted)
                    .padding(.top, 3)

                Spacer(minLength: 0)

                HStack(spacing: 2) {
                    ForEach(s.mainToday) { slot in
                        let isNext = slot.date == s.next.date
                        VStack(spacing: 2) {
                            Text(slot.short)
                                .font(.system(size: 9.5, weight: .black))
                                .foregroundColor(isNext ? .white.opacity(0.85) : p.muted)
                            Text(slot.time)
                                .font(.system(size: 14, weight: .heavy, design: .rounded))
                                .foregroundColor(isNext ? .white : p.ink)
                                .lineLimit(1).minimumScaleFactor(0.7)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                        .background(isNext ? p.accent : .clear, in: RoundedRectangle(cornerRadius: 12))
                        .opacity(slot.date < s.now && !isNext ? p.pastOpacity : 1)
                    }
                }
            }
            .padding(.horizontal, 14).padding(.top, 13).padding(.bottom, 12)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(p.card)
        }
    }
}

// MARK: - Grand · Journée + Qibla

/// Cadran de la Qibla : aiguille fixe (direction depuis le nord géographique).
/// Pas de boussole ici — un widget n'a pas accès au magnétomètre.
private struct QiblaDial: View {
    let degrees: Double
    var body: some View {
        ZStack {
            Circle().fill(Color.white.opacity(0.12))
            ForEach(0..<24, id: \.self) { i in
                let major = i % 6 == 0
                Capsule()
                    .fill(Color.white.opacity(major ? 0.9 : 0.4))
                    .frame(width: major ? 2 : 1.2, height: major ? 6 : 3)
                    .offset(y: major ? -33 : -33.5)
                    .rotationEffect(.degrees(Double(i) * 15))
            }
            ZStack {
                Capsule().fill(SUN).frame(width: 2.6, height: 20).offset(y: -10)
                Capsule().fill(Color.white.opacity(0.4)).frame(width: 2.6, height: 12).offset(y: 6)
                // Kaaba au bout de l'aiguille, gardée droite.
                ZStack(alignment: .top) {
                    RoundedRectangle(cornerRadius: 2).fill(SUN_INK)
                        .overlay(RoundedRectangle(cornerRadius: 2).stroke(SUN, lineWidth: 1.2))
                    Rectangle().fill(SUN).frame(height: 2).padding(.top, 3)
                }
                .frame(width: 13, height: 13)
                .rotationEffect(.degrees(-degrees))
                .offset(y: -25)
            }
            .rotationEffect(.degrees(degrees))
            Circle().fill(Color.white).frame(width: 8, height: 8)
            Text("N").font(.system(size: 8, weight: .black)).offset(y: -24)
            Text("\(Int(degrees.rounded()))° \(cardinal(degrees))")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .offset(y: 24)
        }
        .foregroundColor(.white)
        .frame(width: 80, height: 80)
    }
}

private struct PrayerLargeView: View {
    let s: PrayerState
    @Environment(\.colorScheme) private var scheme

    /// Avancée de la journée, du Fajr à l'Isha.
    private var dayProgress: Double {
        guard let first = s.mainToday.first?.date, let last = s.mainToday.last?.date else { return 0 }
        let span = last.timeIntervalSince(first)
        return span > 0 ? min(1, max(0, s.now.timeIntervalSince(first) / span)) : 0
    }

    var body: some View {
        let p = PrayerPalette.of(scheme)
        VStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Image(systemName: "moon.fill").font(.system(size: 11)).foregroundColor(SUN)
                                Text(L.t("w_p_next_city_caps", s.city.uppercased()))
                                    .font(.system(size: 10, weight: .black)).opacity(0.85).lineLimit(1)
                            }
                            HStack(alignment: .firstTextBaseline, spacing: 8) {
                                Text(s.next.name).font(.system(size: 22, weight: .heavy, design: .rounded))
                                Text(s.next.arabic).font(.system(size: 20, weight: .bold, design: .serif)).opacity(0.85)
                            }
                            Text(s.next.time)
                                .font(.system(size: 44, weight: .heavy, design: .rounded))
                                .lineLimit(1).minimumScaleFactor(0.6)
                        }
                        Spacer(minLength: 0)
                        QiblaDial(degrees: s.qibla)
                    }
                    HStack(spacing: 8) {
                        Text(L.t("w_p_fajr")).font(.system(size: 10, weight: .black)).opacity(0.75)
                        GeometryReader { geo in
                            let w = geo.size.width
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.2)).frame(height: 6)
                                Capsule()
                                    .fill(LinearGradient(colors: [Color.white.opacity(0.7), SUN],
                                                         startPoint: .leading, endPoint: .trailing))
                                    .frame(width: max(6, w * dayProgress), height: 6)
                                Circle().fill(SUN).frame(width: 12, height: 12)
                                    .shadow(color: SUN.opacity(0.4), radius: 3)
                                    .offset(x: min(max(0, w * dayProgress - 6), w - 12))
                            }
                            .frame(height: 12)
                        }
                        .frame(height: 12)
                        Text(s.countdownLabel)
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(SUN_INK)
                            .lineLimit(1)
                            .padding(.horizontal, 9).padding(.vertical, 3)
                            .background(SUN, in: RoundedRectangle(cornerRadius: 9))
                    }
                }
                .foregroundColor(.white)
                .padding(.leading, 18).padding(.trailing, 16).padding(.vertical, 14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    ZStack(alignment: .topTrailing) {
                        p.heroGradient
                        SunGlow(size: 200).offset(x: 40, y: -60)
                    }
                )
                .clipped()

            VStack(spacing: 0) {
                ForEach(s.today) { slot in
                    let isNext = slot.date == s.next.date
                    HStack(spacing: 10) {
                        RoundedRectangle(cornerRadius: 7)
                            .fill(LinearGradient(colors: (PRAYER_SKY[slot.key] ?? ["#888888", "#AAAAAA"]).map { Color(hex: $0) },
                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 22, height: 22)
                        Text(slot.name)
                            .font(.system(size: 13, weight: .black))
                            .foregroundColor(isNext ? p.accent : p.ink)
                        Spacer(minLength: 4)
                        Text(slot.arabic).font(.system(size: 15, design: .serif)).foregroundColor(p.muted)
                        Text(slot.time)
                            .font(.system(size: 16, weight: .heavy, design: .rounded))
                            .foregroundColor(isNext ? p.accent : p.ink)
                            .frame(width: 50, alignment: .trailing)
                    }
                    .padding(.horizontal, 8).padding(.vertical, 5)
                    .background(isNext ? p.nextBg : .clear, in: RoundedRectangle(cornerRadius: 12))
                    .opacity(slot.date < s.now && !isNext ? p.pastOpacity : 1)
                    .frame(maxHeight: .infinity)
                }
            }
            .padding(.horizontal, 12).padding(.top, 6).padding(.bottom, 10)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(p.card)
        }
    }
}

// MARK: - Écran verrouillé

private struct PrayerLockView: View {
    let s: PrayerState?
    @Environment(\.widgetFamily) private var family

    var body: some View {
        if let s = s {
            switch family {
            case .accessoryInline:
                Label("\(s.next.name) \(s.next.time) · \(s.countdownLabel)", systemImage: "moon.fill")
            case .accessoryCircular:
                Gauge(value: s.segmentProgress) {
                    Image(systemName: "moon.fill")
                } currentValueLabel: {
                    Text(s.next.time).font(.system(size: 13, weight: .heavy, design: .rounded))
                }
                .gaugeStyle(.accessoryCircularCapacity)
            default:
                HStack(spacing: 4) {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack(spacing: 4) {
                            Image(systemName: "moon.fill").font(.system(size: 10))
                            Text("Tarteel").font(.system(size: 12, weight: .black))
                        }
                        .opacity(0.85)
                        Text("\(s.next.name) · \(s.next.time)")
                            .font(.system(size: 17, weight: .heavy, design: .rounded))
                            .lineLimit(1).minimumScaleFactor(0.7)
                        Text(s.after.map { "\(s.countdownLabel) · \(L.t("w_p_then", $0.name))" } ?? s.countdownLabel)
                            .font(.system(size: 12, weight: .bold))
                            .lineLimit(1).minimumScaleFactor(0.7)
                            .opacity(0.85)
                    }
                    Spacer(minLength: 0)
                    Image("Otter").resizable().scaledToFit().frame(width: 44, height: 44)
                }
            }
        } else {
            switch family {
            case .accessoryInline:
                Label(L.t("w_p_empty_title"), systemImage: "moon.fill")
            case .accessoryCircular:
                Image(systemName: "moon.stars.fill").font(.system(size: 22))
            default:
                VStack(alignment: .leading, spacing: 2) {
                    Text(L.t("w_p_empty_title")).font(.system(size: 15, weight: .heavy))
                    Text(L.t("w_p_empty_body")).font(.system(size: 12, weight: .bold)).opacity(0.85)
                }
            }
        }
    }
}

// MARK: - Widgets

/// Lien commun : un tap ouvre l'écran Prières de l'app.
private let PRAYER_URL = URL(string: "tarteel://prieres")

/// Conteneur commun aux widgets de l'écran d'accueil.
private struct PrayerHomeContainer<Content: View>: View {
    let state: PrayerState?
    @ViewBuilder let content: (PrayerState) -> Content
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Group {
            if let state = state { content(state) } else { PrayerEmptyView() }
        }
        .widgetURL(PRAYER_URL)
        .containerBackground(PrayerPalette.of(scheme).card, for: .widget)
    }
}

struct PrayerNextWidget: Widget {
    let kind = "TarteelPrayerNext"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerHomeContainer(state: entry.state) { PrayerNextSmallView(s: $0) }
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_p_next"))
        .description(L.t("w_desc_p_next"))
        .supportedFamilies([.systemSmall])
    }
}

struct PrayerDayWidget: Widget {
    let kind = "TarteelPrayerDay"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerHomeContainer(state: entry.state) { PrayerArcSmallView(s: $0) }
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_p_today"))
        .description(L.t("w_desc_p_day"))
        .supportedFamilies([.systemSmall])
    }
}

struct PrayerAllWidget: Widget {
    let kind = "TarteelPrayerAll"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerHomeContainer(state: entry.state) { PrayerMediumView(s: $0) }
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_p_title"))
        .description(L.t("w_desc_p_all"))
        .supportedFamilies([.systemMedium])
    }
}

struct PrayerLargeWidget: Widget {
    let kind = "TarteelPrayerLarge"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerHomeContainer(state: entry.state) { PrayerLargeView(s: $0) }
        }
        .contentMarginsDisabled()
        .configurationDisplayName(L.t("w_p_title"))
        .description(L.t("w_desc_p_large"))
        .supportedFamilies([.systemLarge])
    }
}

struct PrayerLockWidget: Widget {
    let kind = "TarteelPrayerLock"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PrayerProvider()) { entry in
            PrayerLockView(s: entry.state)
                .widgetURL(PRAYER_URL)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName(L.t("w_p_next"))
        .description(L.t("w_desc_p_lock"))
        .supportedFamilies([.accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}
