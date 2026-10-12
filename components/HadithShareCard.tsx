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
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderPattern from './HeaderPattern';

/**
 * L'icône de l'app, posée à côté du nom au bas du visuel partagé.
 *
 * On prend la variante « sun » : la mascotte sur fond orange ressort mieux
 * sur le fond clair du visuel que la variante nuit, qui s'y fondrait.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_ICON = require('../assets/icon-sun.png');

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
  if (length < 1000) return { fontSize: 37, lineHeight: 59, max: 1000 };
  // Plafond abaissé depuis que la signature occupe une hauteur fixe en bas :
  // au-delà, le texte réclamait l'espace du pied et le poussait dehors.
  return { fontSize: 33, lineHeight: 53, max: 1080 };
}

/**
 * Nombre de lignes que le texte peut occuper, à un interlignage donné.
 *
 * C'est le garde-fou décisif : la troncature par caractères ignore la largeur
 * réelle du rendu, donc un texte peut tenir sous `max` et occuper quand même
 * trop de lignes — auquel cas la référence du hadith remontait par-dessus la
 * signature de l'app.
 *
 * Hauteur disponible = la carte, moins les marges du corps (96 × 2), le
 * guillemet ouvrant (110), le filet et la référence (~140), et la zone de
 * signature (190).
 */
function maxLines(lineHeight: number): number {
  const dispo = SHARE_HEIGHT - 96 * 2 - 110 - 140 - 190;
  return Math.max(4, Math.floor(dispo / lineHeight));
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

        {/*
          `numberOfLines` est le vrai garde-fou : la troncature par caractères
          ne connaît pas la largeur réelle du rendu, donc un texte peut tenir
          sous `max` et occuper quand même trop de lignes. En bornant les
          lignes, le bloc ne peut plus pousser la référence sur la signature.
        */}
        <Text
          numberOfLines={maxLines(layout.lineHeight)}
          ellipsizeMode="tail"
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

      {/*
        Signature : le logo à côté du nom, pour qu'on reconnaisse l'app d'un
        coup d'œil quand l'image circule sur WhatsApp ou en story.

        Hauteur FIXE et zone séparée du corps : la référence du hadith vit
        au-dessus, dans `body`, et un texte long ne peut plus venir se
        superposer au nom de l'app.
      */}
      <View style={[styles.footer, { height: s(190), paddingBottom: s(70) }]}>
        <Image
          source={APP_ICON}
          style={[styles.logo, { width: s(62), height: s(62), borderRadius: s(16) }]}
          accessibilityIgnoresInvertColors
        />
        <Text style={[styles.brand, { fontSize: s(32), color: withAlpha('#171C26', 0.45) }]}>
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

  /*
   * `minHeight: 0` autorise le corps à se comprimer sous sa taille naturelle.
   * Le débordement est évité à la source par `maxLines`, qui borne le nombre
   * de lignes du texte — rogner ici masquerait la référence du hadith.
   */
  body: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },

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

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 14,
  },
  // L'icône est carrée et déjà cadrée : `cover` évite toute déformation si
  // l'asset change un jour de proportions.
  logo: { resizeMode: 'cover' },
  brand: { fontFamily: 'Baloo2_700Bold', letterSpacing: 1.6 },
});
