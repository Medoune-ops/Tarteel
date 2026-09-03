import SwiftUI
import WidgetKit

// ─── Widget Petit · Rappel (2×2) ─────────────────────────────────────────────

struct ContinueSmallView: View {
    let data: WidgetData

    var body: some View {
        GeometryReader { geo in
        ZStack {
            // Fond violet
            RadialGradient(
                colors: [Color(hex: "#8A6BFF"), Color(hex: "#6244DE"), Color(hex: "#4A2FBE")],
                center: UnitPoint(x: 0.22, y: 0),
                startRadius: 0,
                endRadius: 220
            )

            // Halo décoratif en haut-droite
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color.white.opacity(0.2), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 70
                    )
                )
                .frame(width: 140, height: 140)
                .offset(x: 64, y: -60)

            VStack(alignment: .leading, spacing: 0) {
                // En-tête : "Rappel" + heure
                HStack {
                    HStack(spacing: 5) {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#FFD37A"))
                        Text("Rappel")
                            .font(.system(size: 11.5, weight: .heavy))
                    }
                    .foregroundColor(.white)

                    Spacer()

                    Text(String(format: "%02d:00", data.reminderHour))
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundColor(.white.opacity(0.7))
                }

                Spacer()

                // Mascotte + message
                HStack(spacing: 11) {
                    Image("Otter")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 46, height: 46)
                        .shadow(color: Color(hex: "#1E0A50").opacity(0.4), radius: 6, y: 4)

                    Text("Ta série t'attend")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .minimumScaleFactor(0.85)
                }

                Spacer()

                // Pied : "3 min suffisent"
                HStack(spacing: 6) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#FFD37A"))
                    Text("3 min suffisent")
                        .font(.system(size: 12.5, weight: .heavy))
                        .foregroundColor(.white)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.16))
                .overlay(Capsule().stroke(Color.white.opacity(0.2), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(16)
        }
        .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}
