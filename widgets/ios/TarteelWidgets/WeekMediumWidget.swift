import SwiftUI
import WidgetKit

// ─── Widget Moyen · Ma semaine (4×2) ─────────────────────────────────────────
// Fidèle à design_handoff_tarteel/Tarteel Widgets.dc.html (bloc "MOYEN · 4×2 — MA SEMAINE").

struct WeekMediumView: View {
    let data: WidgetData
    let days = ["L", "M", "M", "J", "V", "S", "D"]

    var todayIdx: Int {
        let wd = Calendar.current.component(.weekday, from: Date())
        return wd == 1 ? 6 : wd - 2
    }

    var body: some View {
        // La maquette fixe la colonne gauche à 134pt sur une carte de 372pt
        // (36 %). On garde la proportion (largeur réelle du widget variable
        // selon le modèle d'iPhone) plutôt qu'une valeur fixe.
        GeometryReader { outer in
            HStack(spacing: 0) {
            // ── Colonne gauche : Streak hero ──────────────────────────────────
            ZStack {
                // radial-gradient(125% 120% at 72% 0%, #FF9A3D 0%, #F5731F 44%, #E0560E 100%)
                RadialGradient(
                    colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                    center: UnitPoint(x: 0.72, y: 0),
                    startRadius: 0,
                    endRadius: 160
                )

                // right:-26px;bottom:-28px, taille 120, opacité .2
                Image(systemName: "flame.fill")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 120, height: 120)
                    .foregroundColor(.white.opacity(0.2))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .padding(.trailing, -26)
                    .padding(.bottom, -28)

                VStack(spacing: 2) {
                    Image("Otter")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 56, height: 56)
                        .shadow(color: Color(hex: "#962800").opacity(0.35), radius: 5, y: 6)

                    Text("\(data.streak)")
                        .font(.system(size: 42, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)

                    Text("jours de suite")
                        .font(.system(size: 11.5, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                }
                .padding(12)
            }
            .frame(width: max(100, outer.size.width * 0.36))

            // ── Colonne droite ────────────────────────────────────────────────
            VStack(alignment: .leading, spacing: 0) {
                // Titre + XP
                HStack(alignment: .center) {
                    Text("Ma semaine")
                        .font(.system(size: 18, weight: .heavy, design: .rounded))
                        .foregroundColor(Color(hex: "#1B2333"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)

                    Spacer()

                    HStack(spacing: 5) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                        Text("\(data.xp) XP")
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 3)
                    .background(Color(hex: "#EFEBFF"))
                    .clipShape(Capsule())
                }

                Spacer()

                // Timeline : ligne de connexion + pastilles 32pt (38pt aujourd'hui)
                ZStack {
                    // Ligne : orange jusqu'à aujourd'hui, gris clair après.
                    GeometryReader { line in
                        let progress = CGFloat(todayIdx) / 6
                        HStack(spacing: 0) {
                            Rectangle()
                                .fill(Color(hex: "#F0720F"))
                                .frame(width: max(0, line.size.width * progress))
                            Rectangle()
                                .fill(Color(hex: "#E7E2F2"))
                        }
                        .frame(height: 3)
                        .clipShape(RoundedRectangle(cornerRadius: 2))
                    }
                    .frame(height: 3)
                    .padding(.horizontal, 16)

                    HStack(spacing: 0) {
                        ForEach(0..<7, id: \.self) { i in
                            let isActive = data.activeDays.indices.contains(i) && data.activeDays[i]
                            let isToday = i == todayIdx

                            Group {
                                if isToday {
                                    Circle()
                                        .fill(Color.white)
                                        .frame(width: 38, height: 38)
                                        .overlay(Circle().stroke(Color(hex: "#6B4DFF"), lineWidth: 3))
                                        .shadow(color: Color(hex: "#6B4DFF").opacity(0.35), radius: 5, y: 2)
                                        .overlay(
                                            Image(systemName: "play.fill")
                                                .font(.system(size: 13))
                                                .foregroundColor(Color(hex: "#6B4DFF"))
                                        )
                                } else if isActive {
                                    Circle()
                                        .fill(
                                            RadialGradient(
                                                colors: [Color(hex: "#FFB15A"), Color(hex: "#F0720F")],
                                                center: UnitPoint(x: 0.7, y: 0.1),
                                                startRadius: 0,
                                                endRadius: 22
                                            )
                                        )
                                        .frame(width: 32, height: 32)
                                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                        .shadow(color: Color(hex: "#E0560E").opacity(0.35), radius: 3, y: 1)
                                        .overlay(
                                            Image(systemName: "flame.fill")
                                                .font(.system(size: 14))
                                                .foregroundColor(.white)
                                        )
                                } else {
                                    Circle()
                                        .fill(Color(hex: "#EFECF7"))
                                        .frame(width: 30, height: 30)
                                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                        .overlay(
                                            Circle()
                                                .fill(Color(hex: "#C8C3DC"))
                                                .frame(width: 6, height: 6)
                                        )
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .frame(height: 38)

                // Labels des jours
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
                .padding(.top, 4)

                Spacer()

                // Message motivation
                HStack(spacing: 6) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 15))
                        .foregroundColor(Color(hex: "#E0560E"))
                    Text(data.motivationMsg)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(hex: "#B5571A"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .padding(.horizontal, 11)
                .padding(.vertical, 7)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "#FFF2E6"))
                .clipShape(RoundedRectangle(cornerRadius: 11))
            }
            .padding(EdgeInsets(top: 15, leading: 18, bottom: 14, trailing: 18))
            // linear-gradient(168deg, #FFFFFF, #F6F4FC)
            .background(
                LinearGradient(
                    colors: [Color.white, Color(hex: "#F6F4FC")],
                    startPoint: UnitPoint(x: 0.35, y: 0),
                    endPoint: UnitPoint(x: 0.65, y: 1)
                )
            )
            }
            .frame(width: outer.size.width, height: outer.size.height)
        }
    }
}
