import SwiftUI
import WidgetKit

// ─── Widget Moyen · Ma semaine (4×2) ─────────────────────────────────────────

struct WeekMediumView: View {
    let data: WidgetData
    let days = ["L", "M", "M", "J", "V", "S", "D"]

    var todayIdx: Int {
        let wd = Calendar.current.component(.weekday, from: Date())
        return wd == 1 ? 6 : wd - 2
    }

    var body: some View {
        HStack(spacing: 0) {
            // ── Colonne gauche : Streak hero ──────────────────────────────────
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                    startPoint: UnitPoint(x: 0.72, y: 0),
                    endPoint: UnitPoint(x: 0.2, y: 1)
                )

                Image(systemName: "flame.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100)
                    .foregroundColor(.white.opacity(0.2))
                    .offset(x: 20, y: 24)

                VStack(spacing: 2) {
                    Image(systemName: "figure.mind.and.body")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 40, height: 40)
                        .foregroundColor(.white.opacity(0.9))
                        .shadow(color: Color(hex: "#960028").opacity(0.35), radius: 6, y: 4)

                    Text("\(data.streak)")
                        .font(.system(size: 38, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)

                    Text("jours de suite")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                }
            }
            .frame(width: 120)

            // ── Colonne droite ────────────────────────────────────────────────
            VStack(alignment: .leading, spacing: 0) {
                // Titre + XP
                HStack(alignment: .firstTextBaseline) {
                    Text("Ma semaine")
                        .font(.system(size: 17, weight: .heavy, design: .rounded))
                        .foregroundColor(Color(hex: "#1B2333"))

                    Spacer()

                    HStack(spacing: 4) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                        Text("\(data.xp) XP")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                    }
                    .padding(.horizontal, 9)
                    .padding(.vertical, 3)
                    .background(Color(hex: "#EFEBFF"))
                    .clipShape(Capsule())
                }

                Spacer()

                // Timeline des 7 jours
                GeometryReader { geo in
                    let dotSize: CGFloat = 30
                    let activeDotSize: CGFloat = 36
                    ZStack(alignment: .leading) {
                        // Ligne de connexion
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [Color(hex: "#F0720F"), Color(hex: "#F0720F"), Color(hex: "#E7E2F2")],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(height: 3)
                            .padding(.horizontal, dotSize / 2)

                        HStack(spacing: 0) {
                            ForEach(0..<7, id: \.self) { i in
                                let isActive = data.activeDays.indices.contains(i) && data.activeDays[i]
                                let isToday = i == todayIdx

                                ZStack {
                                    if isToday {
                                        Circle()
                                            .fill(Color.white)
                                            .frame(width: activeDotSize, height: activeDotSize)
                                            .overlay(
                                                Circle()
                                                    .stroke(Color(hex: "#6B4DFF"), lineWidth: 3)
                                            )
                                            .shadow(color: Color(hex: "#6B4DFF").opacity(0.35), radius: 5, y: 2)

                                        Image(systemName: "play.fill")
                                            .font(.system(size: 13))
                                            .foregroundColor(Color(hex: "#6B4DFF"))
                                    } else if isActive {
                                        Circle()
                                            .fill(
                                                RadialGradient(
                                                    colors: [Color(hex: "#FFB15A"), Color(hex: "#F0720F")],
                                                    center: UnitPoint(x: 0.7, y: 0.1),
                                                    startRadius: 0,
                                                    endRadius: 16
                                                )
                                            )
                                            .frame(width: dotSize, height: dotSize)
                                            .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                            .shadow(color: Color(hex: "#E0560E").opacity(0.35), radius: 3, y: 1)

                                        Image(systemName: "flame.fill")
                                            .font(.system(size: 14))
                                            .foregroundColor(.white)
                                    } else {
                                        Circle()
                                            .fill(Color(hex: "#EFECF7"))
                                            .frame(width: dotSize, height: dotSize)
                                            .overlay(Circle().stroke(Color.white, lineWidth: 3))

                                        Circle()
                                            .fill(Color(hex: "#C8C3DC"))
                                            .frame(width: 7, height: 7)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                            }
                        }
                    }
                    .frame(height: activeDotSize)
                    .frame(maxWidth: .infinity)
                }
                .frame(height: 38)

                Spacer()

                // Labels jours
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { i in
                        Text(days[i])
                            .font(.system(size: 11, weight: i == todayIdx ? .black : .heavy))
                            .foregroundColor(
                                i == todayIdx ? Color(hex: "#6B4DFF") :
                                (i < todayIdx ? Color(hex: "#9AA0AA") : Color(hex: "#C2C6CE"))
                            )
                            .frame(maxWidth: .infinity)
                    }
                }

                Spacer()

                // Message motivation
                HStack(spacing: 6) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: "#E0560E"))
                    Text(data.motivationMsg)
                        .font(.system(size: 11.5, weight: .bold))
                        .foregroundColor(Color(hex: "#B5571A"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color(hex: "#FFF2E6"))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [Color.white, Color(hex: "#F6F4FC")],
                    startPoint: UnitPoint(x: 0, y: 0.2),
                    endPoint: .bottomTrailing
                )
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: 26))
        .shadow(color: Color(hex: "#503290").opacity(0.1), radius: 10, y: 4)
    }
}
