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
        // Contraint explicitement la ZStack à occuper tout l'espace alloué
        // par WidgetKit — évite de laisser SwiftUI calculer une taille
        // intrinsèque qui pourrait diverger du cadre réel imposé par le
        // système (voir le correctif de WeekMediumWidget.swift).
        GeometryReader { geo in
        ZStack {
            // Fond dégradé orange
            LinearGradient(
                colors: [Color(hex: "#FF9A3D"), Color(hex: "#F5731F"), Color(hex: "#E0560E")],
                startPoint: UnitPoint(x: 0.8, y: 0),
                endPoint: UnitPoint(x: 0.2, y: 1)
            )

            // Flamme fantôme en arrière-plan
            // Valeurs reprises de la maquette de l'app (StreakPreview dans
            // app/(app)/widgets.tsx) : taille 130, opacité 0.18, décalée
            // vers la droite et le bas.
            Image(systemName: "flame.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 130)
                .foregroundColor(.white.opacity(0.18))
                .offset(x: 34, y: 26)

            // Mascotte (loutre) en haut à droite — 60pt et opacité 0.85
            // comme la maquette, collée au coin (top 8 / right 6).
            Image("Otter")
                .resizable()
                .scaledToFit()
                .frame(width: 60, height: 60)
                .opacity(0.85)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(.trailing, 6)
                .padding(.top, 8)

            VStack(alignment: .leading, spacing: 0) {
                // Label "Série"
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#FFE7B0"))
                    Text("Série")
                        .font(.system(size: 11.5, weight: .heavy))
                        .foregroundColor(.white)
                }

                Spacer()

                // Nombre + unité — tailles de la maquette (46 / 11), et non
                // 64 / 13 qui grossissaient nettement le bloc central par
                // rapport à l'aperçu montré dans l'app.
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(data.streak)")
                        .font(.system(size: 46, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text("jours de suite")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                }

                Spacer()

                // Dots semaine
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { i in
                        // Pastilles : 8pt, 10pt pour aujourd'hui, sans contour
                        // ni ombre — la maquette de l'app est volontairement
                        // plus sobre que ce que j'avais dessiné ici.
                        VStack(spacing: 3) {
                            if i == todayIdx {
                                Circle()
                                    .fill(Color.white)
                                    .frame(width: 10, height: 10)
                            } else if data.activeDays.indices.contains(i) && data.activeDays[i] {
                                Circle()
                                    .fill(Color(hex: "#FFE08A"))
                                    .frame(width: 8, height: 8)
                            } else {
                                Circle()
                                    .fill(Color.white.opacity(0.32))
                                    .frame(width: 8, height: 8)
                            }
                            Text(days[i])
                                .font(.system(size: 8, weight: .heavy))
                                .foregroundColor(.white.opacity(i == todayIdx ? 1 : 0.6))
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(14)
        }
        .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}
