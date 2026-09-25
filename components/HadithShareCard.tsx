/**
 * Visuel de partage d'un hadith — ce qu'on exporte en image.
 *
 * C'est un composant distinct de `HadithCard` : celle-ci sert à lire à
 * l'écran, celui-ci à être vu dans une story ou une conversation. Les
 * contraintes ne sont pas les mêmes.
 *
 *  - FORMAT FIXE. 1080 × 1350 (ratio 4:5), rendu à l'échelle puis capturé en
 *    pleine résolution. Ce ratio passe partout : stories, fil Instagram,
 *    WhatsApp, sans rognage des bords.
 *  - TOUJOURS EN CLAIR. Même si l'app est en mode sombre. Une image partagée
 *    est vue sur l'écran des autres, souvent en plein jour, et un fond noir
 *    ressort mal dans un fil. Le mode sombre sert la lecture, pas l'export.
 *  - PAS DE DÉFILEMENT. Tout doit tenir : la taille de police s'adapte à la
 *    longueur, et au-delà d'un certain seuil le texte est tronqué proprement
 *    avec un « … » plutôt que rogné au milieu d'un mot.
 *
 * Le rendu hors écran est assuré par l'appelant (voir `useHadithShare`), qui
 * positionne ce composant hors du champ visible avant de le capturer.
 */
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderPattern from './HeaderPattern';

/** Dimensions d'export, en pixels. Ratio 4:5. */
export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1350;

/**
 * Échelle de rendu.
 *
 * On dessine à 1/3 puis on capture en `width: SHARE_WIDTH` : react-native-view-shot
 * remet à l'échelle, et on obtient une image nette sans monter une vue de
 * 1080 points de large (que certains appareils refusent de composer).
 */
const SCALE = 1 / 3;

export interface HadithShareCardProps {
  text: string;
  /** Nom lisible du recueil, déjà traduit. */
  collectionLabel: string;
  number: number;
  /** Couleur du thème, pour le dégradé. */
  themeColor: string;
  /** Nom de l'app, affiché en pied de carte. */
  appName: string;
}

/** Ajoute une composante alpha à une couleur hexadécimale #RRGGBB. */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/**
 * Taille de police et troncature selon la longueur.
 *
 * Valeurs exprimées à l'échelle d'export (1080 de large), puis multipliées
 * par SCALE au rendu. `max` est le nombre de caractères au-delà duquel on
 * coupe : un hadith de 4 000 signes ne tiendra jamais sur une image, mieux
 * vaut en montrer le début lisiblement que tout en illisible.
 */
function layoutFor(length: number): { fontSize: number; lineHeight: number; max: number } {
  if (length < 200) return { fontSize: 62, lineHeight: 96, max: 200 };
  if (length < 400) return { fontSize: 52, lineHeight: 82, max: 400 };
  if (length < 700) return { fontSize: 44, lineHeight: 70, max: 700 };
  if (length < 1100) return { fontSize: 37, lineHeight: 59, max: 1100 };
  return { fontSize: 33, lineHeight: 53, max: 1250 };
}

/**
 * Coupe au dernier espace avant la limite, pour ne jamais casser un mot.
 *
 * On coupe toujours sur une frontière de mot, même si cela raccourcit
 * sensiblement : « particulièr… » se lit comme un bug, « particulièrement… »
 * comme une citation abrégée. Seul un texte sans aucun espace avant la
 * limite — un cas qui n'existe pas dans le corpus — est coupé net.
 */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}

export default function HadithShareCard({
  text, collectionLabel, number, themeColor, appName,
}: HadithShareCardProps) {
  const layout = layoutFor(text.length);
  const shown = truncate(text, layout.max);

  const s = (v: number) => v * SCALE;

  return (
    <View
      style={[
        styles.card,
        { width: SHARE_WIDTH * SCALE, height: SHARE_HEIGHT * SCALE },
      ]}
      collapsable={false}
    >
      <LinearGradient
        colors={['#FFFFFF', withAlpha(themeColor, 0.14), withAlpha(themeColor, 0.05)]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Motif en filigrane, comme les en-têtes de l'app. */}
      <View style={styles.pattern} pointerEvents="none">
        <HeaderPattern
          variant="stars"
          color={themeColor}
          width={SHARE_WIDTH * SCALE}
          height={SHARE_HEIGHT * SCALE * 0.45}
        />
      </View>

      <View style={[styles.body, { padding: s(96) }]}>
        {/* Guillemet ouvrant, discret : on annonce une parole rapportée. */}
        <Text style={[styles.quote, { fontSize: s(150), color: withAlpha(themeColor, 0.22), height: s(110) }]}>
          «
        </Text>

        <Text
          style={[
            styles.text,
            { fontSize: s(layout.fontSize), lineHeight: s(layout.lineHeight) },
          ]}
        >
          {shown}
        </Text>

        <View style={[styles.rule, { backgroundColor: withAlpha(themeColor, 0.45), width: s(110), height: s(5), marginTop: s(54) }]} />

        <Text style={[styles.reference, { fontSize: s(34), marginTop: s(36), color: themeColor }]}>
          {collectionLabel} · {number}
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: s(64) }]}>
        <Text style={[styles.brand, { fontSize: s(30), color: withAlpha('#171C26', 0.38) }]}>
          {appName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fond blanc explicite : sans lui, la capture peut sortir transparente.
  card: { backgroundColor: '#FFFFFF', overflow: 'hidden' },

  pattern: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.5 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  quote: { fontFamily: 'Baloo2_800ExtraBold', textAlign: 'center' },

  text: {
    fontFamily: 'Nunito_600SemiBold',
    color: '#171C26',
    textAlign: 'center',
  },

  rule: { borderRadius: 3 },

  reference: {
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.6,
    textAlign: 'center',
  },

  footer: { alignItems: 'center' },
  brand: { fontFamily: 'Baloo2_700Bold', letterSpacing: 1.6 },
});
