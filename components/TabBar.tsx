import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle, useDerivedValue, withSpring, interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useT, type I18nKey } from '../lib/i18n';

const META: Record<string, { labelKey: I18nKey; icon: keyof typeof Feather.glyphMap; activeColor: string }> = {
  parcours: { labelKey: 'tabs.parcours', icon: 'home', activeColor: '#2A9E1C' },
  revisions: { labelKey: 'tabs.revisions', icon: 'book', activeColor: '#6B4DFF' },
  ligues: { labelKey: 'tabs.ligues', icon: 'award', activeColor: '#E07A0C' },
  coran: { labelKey: 'tabs.coran', icon: 'book-open', activeColor: '#6B4DFF' },
  profil: { labelKey: 'tabs.profil', icon: 'user', activeColor: '#6B4DFF' },
};

const ORDER = ['parcours', 'revisions', 'ligues', 'coran', 'profil'];

/** Couleurs actives dans l'ordre de ORDER — sert à teinter le spot au vol. */
const COLORS = ORDER.map((n) => META[n]!.activeColor);
/** Positions d'entrée de l'interpolation de couleur : un index par onglet. */
const STOPS = ORDER.map((_, i) => i);

/** Largeur du trait lumineux, et de la lueur qui en descend. */
const TRAIT_W = 34;
const LUEUR_W = 64;
const LUEUR_H = 34;

/**
 * Barre d'onglets avec un projecteur qui suit l'onglet actif.
 *
 * Un trait coloré est posé en haut de la barre, surmonté d'une lueur qui
 * descend sur l'icône. L'ensemble GLISSE d'un onglet à l'autre au lieu
 * d'apparaître sèchement : c'est le mouvement qui fait l'effet, pas la forme.
 *
 * La teinte suit elle aussi — chaque onglet a sa couleur (vert pour le
 * parcours, violet pour les révisions, orange pour les ligues), et le spot
 * passe de l'une à l'autre pendant le trajet via `interpolateColor`.
 */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();

  // Les onglets se partagent la largeur à parts égales (`flex: 1`), moins le
  // padding horizontal de la barre.
  const tabW = (width - 8) / ORDER.length;

  // Index de l'onglet actif selon ORDER (≠ state.index, qui suit l'ordre des
  // routes déclarées, pas l'ordre d'affichage).
  const actif = ORDER.indexOf(state.routes[state.index]?.name ?? '');

  /*
   * Position animée. `useDerivedValue` relance le ressort à chaque
   * changement d'onglet, sans effet de bord ni useEffect.
   *
   * damping 18 / stiffness 140 : le spot arrive vite mais dépasse très
   * légèrement, ce qui donne le poids. Un ressort plus mou traîne derrière le
   * doigt et donne l'impression que l'app rame.
   */
  const pos = useDerivedValue(
    () => withSpring(Math.max(actif, 0), { damping: 18, stiffness: 140, mass: 0.6 }),
    [actif],
  );

  const spotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * tabW }],
  }));

  const traitStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pos.value, STOPS, COLORS),
  }));

  // La lueur reprend la couleur du trait, très diluée. On l'applique au
  // conteneur plutôt qu'au dégradé, dont les `colors` ne s'animent pas.
  const lueurStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pos.value, STOPS, COLORS),
    opacity: T.isDark ? 0.26 : 0.17,
  }));

  return (
    <View style={[styles.bar, { backgroundColor: T.tabBarBg, borderTopColor: T.tabBarBorder }]}>
      {/* Le projecteur, sous les onglets. `pointerEvents` à none : il ne doit
          jamais intercepter un appui destiné à un onglet. */}
      <Animated.View style={[styles.spot, { width: tabW }, spotStyle]} pointerEvents="none">
        <Animated.View style={[styles.trait, traitStyle]} />
        {/* La lueur : un bloc teinté que le dégradé éteint vers le bas.
            Un disque arrondi donnait une tache rectangulaire une fois rogné
            — le dégradé, lui, s'évanouit vraiment. */}
        <View style={styles.lueurWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, lueurStyle]} />
          <LinearGradient
            colors={['transparent', T.tabBarBg]}
            locations={[0, 0.95]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
      </Animated.View>

      {ORDER.map((name) => {
        const route = state.routes.find((r: { name: string }) => r.name === name);
        if (!route) return null;
        const meta = META[name];
        const isActive = state.routes[state.index]?.name === name;

        return (
          <Pressable
            key={name}
            style={styles.tab}
            onPress={() => {
              if (isActive) {
                // Onglet déjà actif : on redemande le scroll-to-top au lieu
                // de re-naviguer (sinon rien ne se passe visuellement).
                // @ts-expect-error événement custom, pas dans BottomTabNavigationEventMap
                navigation.emit({ type: 'scrollToActive', target: route.key });
              } else {
                navigation.navigate(route.name);
              }
            }}
          >
            <Feather
              name={meta.icon}
              size={23}
              color={isActive ? meta.activeColor : (T.isDark ? '#8E8CB0' : '#44505F')}
              style={!isActive && { opacity: T.isDark ? 0.8 : 0.55 }}
            />
            <Text
              style={[
                styles.label,
                { color: T.textSecondary },
                isActive
                  ? { color: meta.activeColor, fontFamily: 'Nunito_800ExtraBold' }
                  : { opacity: T.isDark ? 0.85 : 0.55 },
              ]}
            >
              {tr(meta.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 76,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 8,
    // Le spot déborde en haut de la barre : il doit être rogné, sinon le
    // trait se dessine par-dessus le contenu de l'écran.
    overflow: 'hidden',
  },
  // Colonne de la largeur d'un onglet, translatée sur l'onglet actif.
  spot: {
    position: 'absolute', top: 0, left: 4,
    alignItems: 'center',
  },
  trait: { width: TRAIT_W, height: 3.5, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  // Porte la lueur et son dégradé d'extinction. Les coins hauts sont
  // arrondis pour que le halo épouse la largeur du trait au lieu de partir
  // d'un angle droit.
  lueurWrap: {
    width: LUEUR_W, height: LUEUR_H, overflow: 'hidden',
    borderTopLeftRadius: LUEUR_W / 2, borderTopRightRadius: LUEUR_W / 2,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#8A8F99' },
});
