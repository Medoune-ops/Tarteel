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
        // Un widget .systemMedium ne fait PAS 329pt de large sur tous les
        // iPhones : sur certains modèles la grille de l'écran d'accueil
        // alloue une largeur réelle plus étroite. Une colonne gauche à
        // largeur FIXE (120pt) laissait alors la colonne droite (avec son
        // padding horizontal de 16pt de chaque côté) déborder du cadre réel
        // du widget — le contenu rendu dépassait visuellement le rectangle
        // arrondi qu'iOS découpe autour. On calcule donc la largeur de la
        // colonne gauche en proportion de l'espace réellement disponible.
        GeometryReader { outer in
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

                // Mascotte 36pt, nombre 30pt, sous-titre 9pt : valeurs de la
                // maquette (WeekPreview). J'avais grossi ces trois éléments
                // (52 / 38 / 11), ce qui déséquilibrait la colonne par
                // rapport à l'aperçu montré dans l'app.
                VStack(spacing: 3) {
                    Image("Otter")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 36, height: 36)

                    Text("\(data.streak)")
                        .font(.system(size: 30, weight: .heavy, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)

                    Text("jours de suite")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundColor(.white.opacity(0.95))
                        .multilineTextAlignment(.center)
                }
                .padding(8)
            }
            // La maquette fixe cette colonne à 108pt sur une carte de 322pt
            // de large, soit 33,5 %. On garde la proportion (plutôt qu'une
            // largeur fixe qui déborderait sur les petits iPhones), avec un
            // plancher pour rester lisible.
            .frame(width: max(92, outer.size.width * 0.335))

            // ── Colonne droite ────────────────────────────────────────────────
            VStack(alignment: .leading, spacing: 0) {
                // Titre + XP — 14pt et pilule 10pt comme la maquette (j'avais
                // 17 et 13, ce qui alourdissait la ligne).
                HStack(alignment: .center) {
                    Text("Ma semaine")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
                        .foregroundColor(Color(hex: "#1B2333"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)

                    Spacer()

                    HStack(spacing: 3) {
                        Image(systemName: "bolt.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                        Text("\(data.xp) XP")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundColor(Color(hex: "#6B4DFF"))
                            // Un XP élevé (facilement > 1000) ne doit pas
                            // faire déborder la pilule sur un petit iPhone.
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .background(Color(hex: "#EFEBFF"))
                    .clipShape(Capsule())
                }
                .padding(.bottom, 10)

                // Semaine : pastille + label dans la MÊME colonne, comme la
                // maquette. J'avais séparé les deux (timeline d'un côté,
                // rangée de labels de l'autre) et ajouté une ligne de
                // connexion dégradée qui n'existe pas dans l'aperçu de l'app.
                HStack(spacing: 0) {
                    ForEach(0..<7, id: \.self) { i in
                        let isActive = data.activeDays.indices.contains(i) && data.activeDays[i]
                        let isToday = i == todayIdx

                        VStack(spacing: 3) {
                            ZStack {
                                if isToday {
                                    Circle()
                                        .fill(Color.white)
                                        .frame(width: 20, height: 20)
                                        .overlay(Circle().stroke(Color(hex: "#6B4DFF"), lineWidth: 2))
                                    Image(systemName: "play.fill")
                                        .font(.system(size: 9))
                                        .foregroundColor(Color(hex: "#6B4DFF"))
                                } else if isActive {
                                    Circle()
                                        .fill(Color(hex: "#F0720F"))
                                        .frame(width: 20, height: 20)
                                    Image(systemName: "flame.fill")
                                        .font(.system(size: 9))
                                        .foregroundColor(.white)
                                } else {
                                    Circle()
                                        .fill(Color(hex: "#EFECF7"))
                                        .frame(width: 20, height: 20)
                                }
                            }

                            Text(days[i])
                                .font(.system(size: 8, weight: .heavy))
                                .foregroundColor(
                                    isToday ? Color(hex: "#6B4DFF") : Color(hex: "#C2C6CE")
                                )
                        }
                        .frame(maxWidth: .infinity)
                    }
                }

                Spacer()

                // Message motivation — 9.5pt et flamme 11pt comme la maquette.
                HStack(spacing: 5) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#E0560E"))
                    Text(data.motivationMsg)
                        .font(.system(size: 9.5, weight: .bold))
                        .foregroundColor(Color(hex: "#B5571A"))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "#FFF2E6"))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .padding(12)
            // Blanc uni comme la maquette — le dégradé blanc → lavande que
            // j'avais mis donnait un fond légèrement teinté absent de l'aperçu.
            .background(Color.white)
            }
            // Contraint explicitement la HStack à la taille réellement
            // allouée par WidgetKit : sans ce cadrage forcé, un contenu trop
            // large pousse la vue au-delà du rectangle que le système
            // découpe, débordant visuellement — même symptôme que la colonne
            // à largeur fixe corrigée ci-dessus, mais pour l'ensemble.
            .frame(width: outer.size.width, height: outer.size.height)
        }
    }
}
