import { View, Text, type StyleProp, type TextStyle } from 'react-native';

// Harakat et autres diacritiques arabes combinants (U+064B–U+0652, U+0670,
// U+06D6–U+06ED) — fatha, damma, kasra, soukoun, tanwin, shadda, madda...
// Ces signes sont dessinés minuscules par la plupart des polices : on les
// rend dans un fontSize plus grand pour qu'ils restent lisibles pendant
// l'apprentissage/révision, sans toucher à la taille des lettres.
const HARAKAT_RE = /[ً-ْٰۖ-ۭ]/;
// Un diacritique combinant SANS lettre porteuse ne s'affiche pas du tout
// (comportement Unicode standard) — ex: une carte de révision qui montre
// juste "fatha" seule serait totalement invisible. On insère alors le
// cercle pointillé U+25CC, convention standard pour visualiser un
// diacritique isolé (◌َ), juste avant lui.
const DOTTED_CIRCLE = '◌';
// Signes qui se dessinent SOUS la lettre porteuse (kasra U+0650, kasratan
// U+064D). Tous les autres harakat se placent au-dessus. Cette distinction
// change le sens du débordement à compenser sur les cartes « signe seul ».
const HARAKAT_BELOW_RE = /[ٍِ]/;

interface ArabicTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  /** Multiplicateur appliqué au fontSize de `style` pour les harakat (défaut ×2.2). */
  harakatScale?: number;
  /** Couleur des harakat — défaut : violet accent, bien contrasté sur fond clair ou sombre. */
  harakatColor?: string;
}

// Affiche du texte arabe en isolant visuellement les harakat (voyelles courtes,
// soukoun...) dans une taille et une couleur bien plus visibles que les lettres —
// utilisé dans les leçons et révisions d'alphabet où ces signes doivent être
// identifiables au premier coup d'œil, y compris quand le signe apparaît seul.
export default function ArabicText({ children, style, harakatScale = 2.2, harakatColor = '#8A5CF0' }: ArabicTextProps) {
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
  const baseSize = (flatStyle as TextStyle | undefined)?.fontSize ?? 24;

  // Cas « signe seul » : la chaîne ne contient QUE des harakat (aucune vraie
  // lettre) — typique des cartes d'apprentissage/révision d'un signe isolé
  // (Fatha, Kasra…). Empiler un petit harakat sur un cercle minuscule le rend
  // décentré et illisible ; on l'affiche donc en très grand, centré, avec un
  // cercle porteur à la même échelle pour que l'ensemble soit net et gros.
  const onlyHarakat = children.length > 0 && [...children].every((ch) => HARAKAT_RE.test(ch));
  if (onlyHarakat) {
    const soloSize = baseSize * Math.max(harakatScale, 3.2);
    // La kasra (et les autres signes du dessous) s'affichait DÉJÀ correctement :
    // on garde son rendu tel quel. Ce sont uniquement les signes du DESSUS
    // (fatha, damma, soukoun, shadda…) qui débordaient vers le haut et étaient
    // rognés — on ne leur ajoute de l'espace vertical que dans ce cas, sans
    // toucher à ce qui marchait déjà.
    const isBelow = [...children].some((ch) => HARAKAT_BELOW_RE.test(ch));
    if (isBelow) {
      return (
        <Text
          style={[
            style,
            { fontSize: soloSize, lineHeight: soloSize * 1.4, color: harakatColor, fontWeight: '900', textAlign: 'center' },
          ]}
        >
          {DOTTED_CIRCLE}{children}
        </Text>
      );
    }
    // Signe du dessus : padding + grand lineHeight pour laisser respirer le
    // glyphe vers le haut et le garder centré dans la carte.
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: soloSize * 0.5, alignSelf: 'stretch' }}>
        <Text
          style={[
            style,
            {
              fontSize: soloSize,
              lineHeight: soloSize * 1.8,
              color: harakatColor,
              fontWeight: '900',
              textAlign: 'center',
              includeFontPadding: false,
            },
          ]}
        >
          {DOTTED_CIRCLE}{children}
        </Text>
      </View>
    );
  }

  // Cas normal : texte contenant de VRAIES lettres (avec ou sans harakat).
  //
  // IMPORTANT : on NE découpe PAS les harakat dans des <Text> séparés. Un
  // diacritique combinant (ب + َ = « بَ ») doit rester dans le MÊME run de
  // texte que sa lettre porteuse, sinon le moteur de shaping ne les compose
  // plus : le signe se détache, rapetisse ou se positionne mal, et « ba/bou/
  // bi » perd son harakat voyant. On rend donc le texte tel quel, en un seul
  // <Text> — c'est la police (ScheherazadeNew) qui dessine déjà les harakat
  // lisiblement à cette taille. On garantit juste un lineHeight suffisant.
  const lineHeight = Math.max((flatStyle as TextStyle | undefined)?.lineHeight ?? 0, baseSize * 1.3);
  return <Text style={[style, { lineHeight }]}>{children}</Text>;
}
