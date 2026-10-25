/**
 * Icônes pleines du lecteur (maquette « Écoute du Coran ») : Feather n'a que
 * des contours, la maquette utilise des formes pleines.
 */
import Svg, { Path, Rect } from 'react-native-svg';

type P = { size: number; color: string };

export function PlayGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: size * 0.1 }}>
      <Path d="M6 3.5 20 12 6 20.5z" fill={color} />
    </Svg>
  );
}

export function PauseGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={4} width={5} height={16} rx={1.5} fill={color} />
      <Rect x={14} y={4} width={5} height={16} rx={1.5} fill={color} />
    </Svg>
  );
}

export function PrevGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M19 4.5 9 12l10 7.5z" fill={color} />
      <Rect x={4.7} y={4.5} width={2.8} height={15} rx={1.2} fill={color} />
    </Svg>
  );
}

export function NextGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 4.5 15 12 5 19.5z" fill={color} />
      <Rect x={16.5} y={4.5} width={2.8} height={15} rx={1.2} fill={color} />
    </Svg>
  );
}

export function MoonGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill={color} />
    </Svg>
  );
}

export function HeartGlyph({ size, color, filled }: P & { filled: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LoopGlyph({ size, color }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 2l4 4-4 4" />
      <Path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <Path d="M7 22l-4-4 4-4" />
      <Path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Svg>
  );
}

/** Égaliseur statique (4 barres) du numéro de la sourate en cours. */
export function EqGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={16} viewBox="0 0 20 16">
      <Rect x={1} y={8} width={3} height={8} rx={1.5} fill={color} />
      <Rect x={6.5} y={0} width={3} height={16} rx={1.5} fill={color} />
      <Rect x={12} y={5} width={3} height={11} rx={1.5} fill={color} />
      <Rect x={17} y={2} width={3} height={14} rx={1.5} fill={color} />
    </Svg>
  );
}
