import SwiftUI
import WidgetKit

// ─── Widget Petit · Série (2×2) ──────────────────────────────────────────────

struct StreakSmallView: View {
    let data: WidgetData
    let days = ["L", "M", "M", "J", "V", "S", "D"]

    // Indice du jour actuel (0=lun … 6=dim)
    var todayIdx: Int {
        let wd = Calendar.current.component(.weekday, from: Date())
        return wd == 1 ? 6 : wd - 2
    }

    var body: some View {
        ZStack {
            // Fond dégradé orange
            LinearGradient(
                colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                startPoint: UnitPoint(x: 0.8, y: 0),
                endPoint: UnitPoint(x: 0.2, y: 1)
            )

            // Flamme fantôme en arrière-plan
            Image(systemName: "flame.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 110)
                .foregroundColor(.white.opacity(0.18))
                .offset(x: 30, y: 28)

            VStack(alignment: .leading, spacing: 0) {
                // Label "Série"
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#FFE7B0"))
                    Text("Série")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundColor(.white)
                }

                Spacer()

                // Nombre + unité
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(data.streak)")
                        .font(.system(size: 64, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text("jours de suite")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                }

                Spacer()

                // Dots semaine
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { i in
                        VStack(spacing: 3) {
                            if i == todayIdx {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 11, height: 11)
                                    .overlay(Circle().stroke(Color.white.opacity(0.35), lineWidth: 2.5))
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
                                .foregroundColor(.white.opacity(i == todayIdx ? 1 : (data.activeDays.indices.contains(i) && data.activeDays[i] ? 0.8 : 0.55)))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 26))
    }
}
