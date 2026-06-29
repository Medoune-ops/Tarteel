import SwiftUI
import WidgetKit

// ─── Widget Petit · Reprendre (2×2) ──────────────────────────────────────────

struct ContinueSmallView: View {
    let data: WidgetData

    var body: some View {
        ZStack {
            // Fond violet
            LinearGradient(
                colors: [Color(hex: "#7E62F2"), Color(hex: "#6244DE"), Color(hex: "#4E32C4")],
                startPoint: UnitPoint(x: 0.8, y: -0.05),
                endPoint: UnitPoint(x: 0.2, y: 1)
            )

            // Halo vert en bas-gauche
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: "#34C724").opacity(0.32), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 75
                    )
                )
                .frame(width: 150, height: 150)
                .offset(x: -60, y: 60)

            VStack(spacing: 0) {
                // Header : badge leçon + streak
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "character.cursor.ibeam")
                            .font(.system(size: 11))
                        Text("Leçon \(data.currentLesson)")
                            .font(.system(size: 11, weight: .heavy))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.16))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.18), lineWidth: 1))

                    Spacer()

                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 13))
                            .foregroundColor(Color(hex: "#FFC56B"))
                        Text("\(data.streak)")
                            .font(.system(size: 13, weight: .black))
                            .foregroundColor(.white)
                    }
                }

                Spacer()

                // Otter (icône app en substitut — SF Symbol)
                Image(systemName: "figure.mind.and.body")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 54, height: 54)
                    .foregroundColor(.white.opacity(0.9))
                    .shadow(color: Color(hex: "#1E0A50").opacity(0.4), radius: 8, y: 6)

                Spacer()

                // Barre de progression
                HStack(spacing: 8) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.white.opacity(0.22))
                                .frame(height: 8)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(
                                    LinearGradient(
                                        colors: [Color(hex: "#5BE84A"), Color(hex: "#34C724")],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geo.size.width * CGFloat(data.lessonProgress) / 100, height: 8)
                                .shadow(color: Color(hex: "#46E63C").opacity(0.7), radius: 4)
                        }
                    }
                    .frame(height: 8)

                    Text("\(data.lessonProgress)%")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.white)
                }
                .padding(.bottom, 8)

                // Bouton Continuer
                Link(destination: URL(string: "tarteel://lesson")!) {
                    HStack(spacing: 6) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 13))
                        Text("Continuer")
                            .font(.system(size: 14, weight: .heavy))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "#4BDD38"), Color(hex: "#33C022")],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .shadow(color: Color(hex: "#259416").opacity(0.45), radius: 7, y: 4)
                }
            }
            .padding(14)
        }
        .clipShape(RoundedRectangle(cornerRadius: 26))
    }
}
