/**
 * Badges des réussites d'amis : une fleur à 8 pétales en dégradé (grille de
 * badges du profil) et une pastille carrée (fil d'activité). La couleur et
 * l'icône dépendent du type de réussite.
 */
import { useId } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import type { FriendActivityType } from '../lib/api';

type Meta = {
  icon: keyof typeof Feather.glyphMap;
  /** Clair → principal → foncé, puis tranche (relief sous la fleur). */
  light: string;
  main: string;
  dark: string;
  side: string;
};

export const BADGE_META: Record<FriendActivityType, Meta> = {
  sourate_mastered: { icon: 'book-open', light: '#A8EE8C', main: '#2FA81F', dark: '#1F8414', side: '#16650E' },
  streak_milestone: { icon: 'zap', light: '#FFC08A', main: '#F2702A', dark: '#D04E12', side: '#A93C0B' },
  section_completed: { icon: 'flag', light: '#C9B8FF', main: '#6B4DFF', dark: '#4A2FC4', side: '#3218B8' },
  challenge_won: { icon: 'award', light: '#FFE08A', main: '#E5A400', dark: '#B87F00', side: '#8F6300' },
  league_promoted: { icon: 'trending-up', light: '#A9CBFF', main: '#2F7BE8', dark: '#1C5CC0', side: '#14459A' },
};

const FALLBACK = BADGE_META.section_completed;

/** Contour d'une fleur : N arcs de rayon r reliant des points sur un cercle Rc. */
function flowerPath(c: number, rc: number, r: number, n = 8): string {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + Math.PI / n;
    return [c + rc * Math.cos(a), c + rc * Math.sin(a)];
  });
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i <= n; i++) {
    const q = pts[i % n];
    d += ` A${r} ${r} 0 0 1 ${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

// Repère 58 × 58 (comme la maquette), mis à l'échelle par `size`.
const FLOWER = flowerPath(29, 21, 9.8);

export function BadgeFlower({ type, size = 58, ring = false }: { type: FriendActivityType; size?: number; ring?: boolean }) {
  const m = BADGE_META[type] ?? FALLBACK;
  const gid = `bf${useId().replace(/\W/g, '')}`;
  const depth = size * 0.07;
  return (
    <View style={{ width: size, height: size + depth }}>
      <Svg width={size} height={size + depth} viewBox={`0 0 58 ${58 + 4}`}>
        <Defs>
          <SvgGradient id={gid} x1="0.2" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor={m.light} />
            <Stop offset="0.5" stopColor={m.main} />
            <Stop offset="1" stopColor={m.dark} />
          </SvgGradient>
        </Defs>
        <Path d={FLOWER} transform="translate(0 4)" fill={m.side} />
        <Path d={FLOWER} fill={`url(#${gid})`} />
        {ring && <Circle cx={29} cy={29} r={16.5} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={1.2} strokeDasharray="2 3" />}
      </Svg>
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={m.icon} size={size * 0.38} color="#fff" />
      </View>
    </View>
  );
}

/** Pastille carrée posée sur l'avatar dans le fil d'activité. */
export function BadgeChip({ type, size = 24, border }: { type: FriendActivityType; size?: number; border: string }) {
  const m = BADGE_META[type] ?? FALLBACK;
  return (
    <LinearGradient
      colors={[m.light, m.main]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={{
        width: size, height: size, borderRadius: size / 3, borderWidth: 2.5, borderColor: border,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Feather name={m.icon} size={size * 0.5} color="#fff" />
    </LinearGradient>
  );
}
