/**
 * Carte de hadith plein écran — brique du flux de lecture (app/(app)/hadiths.tsx).
 *
 * Parti pris : c'est un ESPACE DE LECTURE, pas une épreuve. Aucun score, aucune
 * progression, aucune animation gadget. Du contenu religieux mérite un
 * traitement sobre : beaucoup d'air, un fond très doux, et un texte qui
 * respire assez pour qu'on puisse rester dessus longtemps.
 *
 * Trois points d'attention :
 *  - LISIBILITÉ DES TEXTES LONGS. Certains hadiths de Bukhari dépassent
 *    2 000 caractères. La taille de police s'adapte à la longueur, et le
 *    contenu défile à l'intérieur de la carte : jamais de texte coupé.
 *  - MODE SOMBRE. Beaucoup liront au lit. Le dégradé s'assombrit fortement
 *    (la couleur de thème n'est plus qu'une teinte posée sur le fond nuit) et
 *    le texte reste sur un blanc cassé, jamais un blanc pur qui éblouit.
 *  - LE CŒUR EST UN MARQUE-PAGE. Rien à voir avec les vies/cœurs du parcours
 *    Coran : mettre un hadith de côté ne coûte ni ne rapporte rien.
 */
import { useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../utils/useTheme';
import { useT } from '../lib/i18n';
import type { ThemeId } from '../constants/hadithChapters';

export interface HadithCardProps {
  /** Texte du hadith, dans la langue du recueil chargé. */
  text: string;
  /** Nom lisible du recueil, déjà traduit (ex. « 40 an-Nawawi »). */
  collectionLabel: string;
  /** Numéro du hadith dans son recueil. */
  number: number;
  /** Thème du hadith — donne sa couleur à la carte. */
  theme: ThemeId;
  /** Couleur du thème (palette THEMES de constants/hadithChapters). */
  themeColor: string;
  /** Hauteur allouée à la carte (une page du flux vertical). */
  height: number;
  /** Le hadith est-il déjà mis de côté ? */
  favorite?: boolean;
  /** Marque-page — optionnel tant que l'action n'est pas branchée. */
  onFavorite?: () => void;
  /** Partage — optionnel tant que l'action n'est pas branchée. */
  onShare?: () => void;
  /** Espace à réserver en haut (encoche) et en bas (barre d'onglets). */
  insetTop?: number;
  insetBottom?: number;
}

/**
 * Taille de police selon la longueur du texte.
 *
 * Un hadith de trois lignes mérite d'être présenté en grand ; un hadith de
 * 2 000 caractères doit tenir sans que le lecteur passe son temps à faire
 * défiler. On ne descend jamais sous 16 px — en dessous, la lecture longue
 * devient pénible.
 */
function fontFor(length: number): { fontSize: number; lineHeight: number } {
  if (length < 220) return { fontSize: 25, lineHeight: 40 };
  if (length < 450) return { fontSize: 22, lineHeight: 36 };
  if (length < 800) return { fontSize: 19, lineHeight: 31 };
  if (length < 1400) return { fontSize: 17, lineHeight: 28 };
  return { fontSize: 16, lineHeight: 26 };
}

/** Ajoute une composante alpha à une couleur hexadécimale #RRGGBB. */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export default function HadithCard({
  text, collectionLabel, number, theme, themeColor, height,
  favorite = false, onFavorite, onShare,
  insetTop = 0, insetBottom = 0,
}: HadithCardProps) {
  const T = useTheme();
  const tr = useT();

  const font = useMemo(() => fontFor(text.length), [text.length]);

  /**
   * Dégradé de fond. En clair, la couleur du thème est diluée à quelques
   * pourcents sur du blanc : la teinte se devine, elle n'agresse pas. En
   * sombre, on part du fond nuit et on y dépose la même teinte, encore plus
   * discrète — un fond lumineux au lit est insupportable.
   */
  const gradient: [string, string, string] = T.isDark
    ? [T.pageBg, withAlpha(themeColor, 0.13), T.pageBg]
    : ['#FFFFFF', withAlpha(themeColor, 0.1), '#FFFFFF'];

  // Texte : blanc cassé en sombre (jamais #FFF pur), encre profonde en clair.
  const textColor = T.isDark ? '#EDEAF5' : '#171C26';
  // Accents (numéro, filet, icônes) : la couleur de thème éclaircie en sombre
  // pour tenir le contraste sur fond nuit, telle quelle en clair.
  const accent = T.isDark ? withAlpha(themeColor, 0.95) : themeColor;
  const meta = T.isDark ? T.textSecondary : '#7A828F';

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, { height }]}
    >
      {/* Filet de couleur en haut : signale le thème sans l'écrire. */}
      <View
        style={[
          styles.themeRule,
          { top: insetTop + 8, backgroundColor: withAlpha(themeColor, T.isDark ? 0.55 : 0.4) },
        ]}
      />

      <View style={[styles.body, { paddingTop: insetTop + 44, paddingBottom: insetBottom + 92 }]}>
        <Text style={[styles.themeLabel, { color: accent }]}>
          {tr(`hadiths.theme.${theme}`)}
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          /* Le flux parent pagine verticalement : on laisse le geste au
             parent tant que le texte tient à l'écran, et on ne le capte que
             pour les hadiths réellement longs. */
          nestedScrollEnabled
        >
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: font.fontSize, lineHeight: font.lineHeight },
            ]}
          >
            {text}
          </Text>
        </ScrollView>
      </View>

      {/* Pied : référence discrète à gauche, actions à droite. */}
      <View style={[styles.footer, { bottom: insetBottom + 22 }]}>
        <View style={styles.reference}>
          <View style={[styles.refDot, { backgroundColor: withAlpha(themeColor, 0.7) }]} />
          <Text style={[styles.refText, { color: meta }]} numberOfLines={1}>
            {tr('hadiths.reference', { collection: collectionLabel, n: number })}
          </Text>
        </View>

        <View style={styles.actions}>
          {onFavorite && (
            <Pressable
              onPress={onFavorite}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? tr('hadiths.flow.unsaveA11y') : tr('hadiths.flow.saveA11y')
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor: favorite
                    ? withAlpha(themeColor, T.isDark ? 0.28 : 0.14)
                    : T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,28,38,0.04)',
                },
              ]}
            >
              <Feather
                name="bookmark"
                size={19}
                color={favorite ? accent : meta}
              />
            </Pressable>
          )}

          {onShare && (
            <Pressable
              onPress={onShare}
              hitSlop={14}
              accessibilityRole="button"
              accessibilityLabel={tr('hadiths.flow.shareA11y')}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: T.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(23,28,38,0.04)',
                },
              ]}
            >
              <Feather name="share-2" size={18} color={meta} />
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', overflow: 'hidden' },

  themeRule: {
    position: 'absolute', alignSelf: 'center',
    width: 44, height: 3, borderRadius: 2,
  },

  // Marges généreuses : le texte ne touche jamais les bords de l'écran.
  body: { flex: 1, paddingHorizontal: 30 },

  themeLabel: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 11,
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: 20, textAlign: 'center',
  },

  scroll: { flex: 1 },
  // `justifyContent: center` centre les textes courts et laisse les longs
  // partir du haut (flexGrow sans hauteur fixe).
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 8 },

  text: { fontFamily: 'Nunito_600SemiBold', textAlign: 'left' },

  footer: {
    position: 'absolute', left: 30, right: 30,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14,
  },
  reference: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  refDot: { width: 6, height: 6, borderRadius: 3 },
  refText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 12.5, letterSpacing: 0.2 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
});
