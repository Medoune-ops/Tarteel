import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, PanResponder, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useT } from '../lib/i18n';

const SIZE = 72; // un peu plus grand que le coffre quotidien (62px)
const EDGE_MARGIN = 12;
const TAB_BAR_HEIGHT = 76;
const STORAGE_KEY = 'prayerShortcut:position';

// Écrans avec la tab bar visible → le raccourci ne doit pas descendre dessus.
const TAB_ROUTES = new Set(['/parcours', '/revisions', '/ligues', '/coran', '/profil']);

/** Écrans où le raccourci gênerait : exercices, lecture, et la page prières elle-même. */
function isHiddenOn(pathname: string) {
  return (
    pathname === '/prieres' ||
    pathname === '/coran-player' ||
    pathname.startsWith('/lesson/') ||
    pathname.startsWith('/revision/') ||
    pathname.startsWith('/lecture/')
  );
}

type Side = 'left' | 'right';
type Saved = { side: Side; y: number };

/**
 * Raccourci flottant vers les heures de prière : la mascotte en prière dans un
 * petit carré, visible partout dans l'app (sauf écrans ci-dessus). Simple
 * raccourci de navigation — aucun lien avec les horaires ni les notifications.
 * Déplaçable au doigt : au lâcher, il se range contre le bord le plus proche,
 * et sa position est mémorisée d'une ouverture à l'autre.
 */
export default function PrayerShortcut() {
  const router = useRouter();
  const pathname = usePathname();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const hasTabBar = TAB_ROUTES.has(pathname);
  const minY = insets.top + EDGE_MARGIN;
  const maxY = height - insets.bottom - (hasTabBar ? TAB_BAR_HEIGHT : 0) - EDGE_MARGIN - SIZE;
  const xFor = (side: Side) => (side === 'left' ? EDGE_MARGIN : width - SIZE - EDGE_MARGIN);
  const clampY = (y: number) => Math.min(Math.max(y, minY), maxY);

  // Par défaut : à droite, au-dessus de l'emplacement du coffre quotidien.
  const savedRef = useRef<Saved>({ side: 'right', y: maxY - 62 - 24 - 16 });
  const pan = useRef(new Animated.ValueXY({ x: xFor('right'), y: clampY(savedRef.current.y) })).current;

  // Valeurs à jour pour les callbacks du PanResponder (créé une seule fois).
  const layout = useRef({ width, minY, maxY });
  layout.current = { width, minY, maxY };

  const moveTo = (saved: Saved, animated: boolean) => {
    const target = { x: xFor(saved.side), y: clampY(saved.y) };
    if (animated) {
      Animated.spring(pan, { toValue: target, useNativeDriver: false, friction: 7, tension: 60 }).start();
    } else {
      pan.setValue(target);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Saved;
        if ((saved.side === 'left' || saved.side === 'right') && typeof saved.y === 'number') {
          savedRef.current = saved;
          moveTo(saved, false);
        }
      })
      .catch(() => {});
  }, []);

  // Rotation de l'écran ou passage sur un écran avec/sans tab bar : on reste dans les limites.
  useEffect(() => {
    moveTo(savedRef.current, true);
  }, [width, minY, maxY]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Un simple tap reste au Pressable ; on ne prend la main qu'au glissé.
        onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
        onPanResponderGrant: () => {
          pan.extractOffset();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          pan.flattenOffset();
          const { width: w, minY: top, maxY: bottom } = layout.current;
          const start = savedRef.current;
          const startX = start.side === 'left' ? EDGE_MARGIN : w - SIZE - EDGE_MARGIN;
          const x = startX + g.dx;
          const y = Math.min(Math.max(Math.min(Math.max(start.y, top), bottom) + g.dy, top), bottom);
          const saved: Saved = { side: x + SIZE / 2 < w / 2 ? 'left' : 'right', y };
          savedRef.current = saved;
          Animated.spring(pan, {
            toValue: { x: saved.side === 'left' ? EDGE_MARGIN : w - SIZE - EDGE_MARGIN, y },
            useNativeDriver: false,
            friction: 7,
            tension: 60,
          }).start();
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
        },
        onPanResponderTerminate: () => {
          pan.flattenOffset();
          moveTo(savedRef.current, true);
        },
      }),
    [],
  );

  if (isHiddenOn(pathname)) return null;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.floating, { transform: pan.getTranslateTransform() }]}
    >
      <Pressable
        onPress={() => router.push('/(app)/prieres')}
        style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityRole="button"
        accessibilityLabel={tr('prayer.headerTitle')}
      >
        <Image source={require('../assets/priere-mascotte.png')} style={styles.image} resizeMode="contain" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floating: { position: 'absolute', left: 0, top: 0, zIndex: 30 },
  card: {
    width: SIZE, height: SIZE, borderRadius: 18,
    backgroundColor: '#E7F6EF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#26A17B',
    shadowColor: '#1F8A70', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  image: { width: SIZE - 16, height: SIZE - 16 },
});
