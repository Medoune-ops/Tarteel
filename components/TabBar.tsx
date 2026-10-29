import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, useDerivedValue, withSpring, interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useT, type I18nKey } from '../lib/i18n';

const META: Record<string, { labelKey: I18nKey; icon: keyof typeof Feather.glyphMap; activeColor: string }> = {
  parcours: { labelKey: 'tabs.parcours', icon: 'home', activeColor: '#2FA81F' },
  revisions: { labelKey: 'tabs.revisions', icon: 'repeat', activeColor: '#6B4DFF' },
  ligues: { labelKey: 'tabs.ligues', icon: 'shield', activeColor: '#F0820C' },
  coran: { labelKey: 'tabs.coran', icon: 'book-open', activeColor: '#6B4DFF' },
  profil: { labelKey: 'tabs.profil', icon: 'user', activeColor: '#6B4DFF' },
};

const ORDER = ['parcours', 'revisions', 'ligues', 'coran', 'profil'];

/** Couleurs actives dans l'ordre de ORDER — sert à teinter la pastille au vol. */
const COLORS = ORDER.map((n) => META[n]!.activeColor);
/** Positions d'entrée de l'interpolation de couleur : un index par onglet. */
const STOPS = ORDER.map((_, i) => i);

/** Pastille posée derrière l'icône de l'onglet actif. */
const PILL_W = 52;
const PILL_H = 32;
/** Padding horizontal de la barre. */
const PAD_X = 8;

/**
 * Barre d'onglets : une pastille teintée entoure l'icône de l'onglet actif.
 *
 * La pastille GLISSE d'un onglet à l'autre au lieu d'apparaître sèchement, et
 * sa teinte passe de la couleur d'un onglet à l'autre pendant le trajet (vert
 * pour Apprendre, violet pour Réviser, orange pour Ligues).
 */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();

  // Les onglets se partagent la largeur à parts égales (`flex: 1`), moins le
  // padding horizontal de la barre.
  const tabW = (width - PAD_X * 2) / ORDER.length;

  // Index de l'onglet actif selon ORDER (≠ state.index, qui suit l'ordre des
  // routes déclarées, pas l'ordre d'affichage).
  const actif = ORDER.indexOf(state.routes[state.index]?.name ?? '');

  // damping 18 / stiffness 140 : la pastille arrive vite mais dépasse très
  // légèrement, ce qui donne le poids sans donner l'impression que l'app rame.
  const pos = useDerivedValue(
    () => withSpring(Math.max(actif, 0), { damping: 18, stiffness: 140, mass: 0.6 }),
    [actif],
  );

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * tabW }],
    backgroundColor: interpolateColor(pos.value, STOPS, COLORS),
  }));

  return (
    <View style={[styles.bar, { backgroundColor: T.tabBarBg, borderTopColor: T.tabBarBorder }]}>
      {/* La pastille, sous les icônes. On la teinte à pleine couleur puis on
          baisse l'opacité : la couleur ne s'anime pas sur un `color + alpha`. */}
      <View style={[styles.pillTrack, { width: tabW }]} pointerEvents="none">
        <Animated.View style={[styles.pill, { opacity: T.isDark ? 0.16 : 0.1 }, pillStyle]} />
      </View>

      {ORDER.map((name) => {
        const route = state.routes.find((r: { name: string }) => r.name === name);
        if (!route) return null;
        const meta = META[name];
        const isActive = state.routes[state.index]?.name === name;
        const color = isActive ? meta.activeColor : T.textSecondary;

        return (
          <Pressable
            key={name}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
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
            <View style={styles.iconBox}>
              <Feather name={meta.icon} size={21} color={color} />
            </View>
            <Text
              style={[
                styles.label,
                { color, fontFamily: isActive ? 'Nunito_900Black' : 'Nunito_700Bold' },
              ]}
              numberOfLines={1}
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
    height: 78,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: PAD_X,
    paddingTop: 8,
    paddingBottom: 12,
  },
  // Colonne de la largeur d'un onglet, alignée sur le premier ; la pastille
  // y est centrée puis translatée sur l'onglet actif.
  pillTrack: { position: 'absolute', top: 8, left: PAD_X, alignItems: 'center' },
  pill: { width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2 },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  iconBox: { width: PILL_W, height: PILL_H, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
});
