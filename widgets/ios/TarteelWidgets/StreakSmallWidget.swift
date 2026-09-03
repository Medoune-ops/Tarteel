import SwiftUI
import WidgetKit

// ─── Widget Petit · Série (2×2) ──────────────────────────────────────────────
// Fidèle à design_handoff_tarteel/Tarteel Widgets.dc.html (bloc "PETIT · 2×2 — SÉRIE").

struct StreakSmallView: View {
    let data: WidgetData
    let days = ["L", "M", "M", "J", "V", "S", "D"]

    // Indice du jour actuel (0=lun … 6=dim)
    var todayIdx: Int {
        let wd = Calendar.current.component(.weekday, from: Date())
        return wd == 1 ? 6 : wd - 2
    }

    var body: some View {
        GeometryReader { geo in
        ZStack {
            // Fond : radial-gradient(130% 110% at 80% 0%, #FF9A3D 0%, #F5731F 42%, #E0560E 100%)
            RadialGradient(
                colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                center: UnitPoint(x: 0.8, y: 0),
                startRadius: 0,
                endRadius: 200
            )

            // Flamme fantôme : right:-30px;bottom:-26px, taille 140, opacité .18
            Image(systemName: "flame.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 140, height: 140)
                .foregroundColor(.white.opacity(0.18))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding(.trailing, -30)
                .padding(.bottom, -26)

            // Mascotte : right:6px;top:34px, taille 72
            Image("Otter")
                .resizable()
                .scaledToFit()
                .frame(width: 72, height: 72)
                .shadow(color: Color(hex: "#962800").opacity(0.35), radius: 6, y: 6)
                .frame(maxWidth: .infinity, alignment: .topTrailing)
                .padding(.trailing, 6)
                .padding(.top, 34)

            VStack(alignment: .leading, spacing: 0) {
                // Label "Série"
                HStack(spacing: 6) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 16))
                        .foregroundColor(Color(hex: "#FFE7B0"))
                    Text("Série")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundColor(.white)
                }

                Spacer()

                // Nombre 72pt + "jours de suite" 13.5pt
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(data.streak)")
                        .font(.system(size: 72, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    Text("jours de suite")
                        .font(.system(size: 13.5, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                }

                Spacer()

                // Dots semaine : 9pt (12pt + halo pour aujourd'hui)
                HStack(spacing: 6) {
                    ForEach(0..<7, id: \.self) { i in
                        VStack(spacing: 4) {
                            if i == todayIdx {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 12, height: 12)
                                    .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 3))
                            } else if data.activeDays.indices.contains(i) && data.activeDays[i] {
                                Circle()
                                    .fill(Color(hex: "#FFE08A"))
                                    .frame(width: 9, height: 9)
                                    .shadow(color: Color(hex: "#FFE08A").opacity(0.9), radius: 3)
                            } else {
                                Circle()
                                    .fill(Color.white.opacity(0.32))
                                    .frame(width: 9, height: 9)
                            }
                            Text(days[i])
                                .font(.system(size: 9, weight: i == todayIdx ? .black : .heavy))
                                .foregroundColor(.white.opacity(i == todayIdx ? 1 : 0.55))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(17)
        }
        .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}
