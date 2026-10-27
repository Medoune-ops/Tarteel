/**
 * Flamme de la série, en trois couches (extérieur jaune, cœur orange, noyau
 * blanc) superposées dans le même repère : l'écran de célébration anime chaque
 * couche séparément, la carte de partage les affiche figées.
 */
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// Repère carré commun aux trois couches (les chemins viennent du logo Tarteel).
const VIEW_BOX = '29 17 64 64';

export type FlamePart = 'outer' | 'inner' | 'core';

export function FlameLayer({ part, size }: { part: FlamePart; size: number }) {
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      {part === 'outer' && (
        <Path
          d="M60 22c18 18 24 32 16 46-5 9-24 11-30 0-6-9 0-19 5-22-1 9 4 11 8 8 4-9-5-20 1-32z"
          fill="#FFC23D"
        />
      )}
      {part === 'inner' && (
        <Path
          d="M60 46c10 11 12.5 19 7.5 26.5-3.7 6-13.7 6-17.5 0-3.7-5 0-10 3.7-12.5 0 5 2.5 6.2 5 5 2.5-6.2-1.2-12.5 1.3-19z"
          fill="#F4633A"
        />
      )}
      {part === 'core' && <Circle cx={60} cy={70} r={4.6} fill="#FFF6E4" />}
    </Svg>
  );
}

/** Flamme complète, sans animation (carte de partage). */
export function StaticFlame({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute' }}><FlameLayer part="outer" size={size} /></View>
      <View style={{ position: 'absolute' }}><FlameLayer part="inner" size={size} /></View>
      <View style={{ position: 'absolute' }}><FlameLayer part="core" size={size} /></View>
    </View>
  );
}
