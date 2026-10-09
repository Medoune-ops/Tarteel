/**
 * En-tête qui se comprime au défilement.
 *
 * Sur mobile, un grand en-tête fixe mange en permanence le tiers supérieur de
 * l'écran. Ici il se réduit à une barre fine dès qu'on descend : le titre et
 * le retour restent accessibles — on ne perd jamais la navigation — mais le
 * contenu récupère la place.
 *
 * COMMENT L'UTILISER. Le composant fournit le `onScroll` à brancher sur la
 * liste, et un espace réservé à poser en tête du contenu :
 *
 *   const header = useCollapsingHeader({ expanded: 132, collapsed: 64 });
 *
 *   <CollapsingHeader {...header.props} title="Réglages" onBack={router.back} />
 *   <Animated.ScrollView {...header.scrollProps}>
 *     <View style={{ height: header.contentInset }} />
 *     …le contenu…
 *   </Animated.ScrollView>
 *
 * L'animation tourne sur le thread natif (Reanimated) : elle suit le doigt
 * sans passer par le JS, donc sans à-coups pendant un défilement rapide.
 */
import { type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../utils/useTheme';

export interface CollapsingHeaderConfig {
  /** Hauteur au repos, hors encoche. */
  expanded?: number;
  /** Hauteur une fois comprimé, hors encoche. */
  collapsed?: number;
}

export interface CollapsingHeaderProps {
  /** Position de défilement, partagée avec le thread natif. */
  scrollY: SharedValue<number>;
  expanded: number;
  collapsed: number;
}

export interface UseCollapsingHeader {
  /** À étaler sur `<CollapsingHeader {...props} />`. */
  props: CollapsingHeaderProps;
  /** À étaler sur l'`Animated.ScrollView` ou l'`Animated.FlatList`. */
  scrollProps: {
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    scrollEventThrottle: number;
  };
  /**
   * Hauteur à réserver en tête du contenu, encoche comprise.
   *
   * L'en-tête étant posé par-dessus le contenu (`position: absolute`), sans
   * cet espace les premières lignes passeraient dessous.
   */
  contentInset: number;
}

const DEFAULT_EXPANDED = 128;
const DEFAULT_COLLAPSED = 60;

export function useCollapsingHeader(
  config: CollapsingHeaderConfig = {},
): UseCollapsingHeader {
  const insets = useSafeAreaInsets();
  const expanded = config.expanded ?? DEFAULT_EXPANDED;
  const collapsed = config.collapsed ?? DEFAULT_COLLAPSED;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  return {
    props: { scrollY, expanded, collapsed },
    // 16 ms : un événement par image à 60 Hz. Au-delà l'animation saccade,
    // en deçà on envoie des événements que personne ne voit.
    scrollProps: { onScroll, scrollEventThrottle: 16 },
    contentInset: expanded + insets.top,
  };
}

export interface HeaderContentProps extends CollapsingHeaderProps {
  title: string;
  /** Sous-titre, affiché au repos et effacé à la compression. */
  subtitle?: string;
  onBack?: () => void;
  /** Libellé du bouton retour pour les lecteurs d'écran. */
  backLabel?: string;
  /** Actions à droite du titre — restent visibles dans les deux états. */
  right?: ReactNode;
  /** Fond de l'en-tête. Par défaut, celui des cartes. */
  background?: string;
  /** Décor posé derrière le titre, effacé à la compression (motif, dégradé). */
  decoration?: ReactNode;
}

export default function CollapsingHeader({
  scrollY, expanded, collapsed,
  title, subtitle, onBack, backLabel, right, background, decoration,
}: HeaderContentProps) {
  const T = useTheme();
  const insets = useSafeAreaInsets();

  /** Distance de défilement sur laquelle la compression s'étale. */
  const course = Math.max(expanded - collapsed, 1);

  const container = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, course],
      [expanded + insets.top, collapsed + insets.top],
      Extrapolation.CLAMP,
    ),
  }));

  /*
   * Le décor et le sous-titre s'effacent AVANT la fin de la compression
   * (à 60 % de la course) : les voir se faire écraser jusqu'au dernier pixel
   * donne une impression de désordre, alors qu'un fondu plus tôt laisse la
   * barre fine se poser proprement.
   */
  const fading = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, course * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  /*
   * Le titre rétrécit et se recentre verticalement. On ne descend pas sous
   * 0.82 : en dessous, la police devient floue sur les écrans peu denses.
   */
  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [0, course], [1, 0.82], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.header,
        { backgroundColor: background ?? T.cardBg, paddingTop: insets.top },
        container,
      ]}
    >
      {decoration && (
        <Animated.View style={[StyleSheet.absoluteFill, fading]} pointerEvents="none">
          {decoration}
        </Animated.View>
      )}

      <View style={styles.row}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={backLabel ?? title}
            style={styles.back}
          >
            <Feather name="chevron-left" size={26} color="#6B4DFF" />
          </Pressable>
        )}

        <View style={styles.titles}>
          <Animated.Text
            style={[styles.title, { color: T.text }, titleStyle]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text
              style={[styles.subtitle, { color: T.textSecondary }, fading]}
              numberOfLines={1}
            >
              {subtitle}
            </Animated.Text>
          )}
        </View>

        {right}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingBottom: 14,
  },
  back: { marginLeft: -4 },
  // `transformOrigin` à gauche : le titre rétrécit vers son bord gauche au
  // lieu de glisser vers le centre, ce qui garderait mal l'alignement avec la
  // flèche de retour.
  titles: { flex: 1, minWidth: 0, transformOrigin: 'left center' },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, transformOrigin: 'left center' },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
