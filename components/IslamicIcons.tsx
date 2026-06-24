import Svg, { Rect, Path, Circle } from 'react-native-svg';

/** Kaaba — nœud complété (sur fond vert). */
export function KaabaIcon({ size = 46 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Rect x={9} y={16} width={28} height={24} rx={2} fill="#fff" opacity={0.95} />
      <Rect x={9} y={16} width={28} height={6} rx={1} fill="#FFD97A" />
      <Rect x={9} y={22} width={28} height={3} fill="#B8963E" opacity={0.7} />
      <Path d="M7 16 L23 8 L39 16" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" fill="none" />
      <Rect x={19} y={27} width={8} height={13} rx={1.5} fill="#B8963E" opacity={0.85} />
      <Rect x={18} y={26} width={10} height={15} rx={2} stroke="#FFD97A" strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

/** Mosquée — nœud actif (sur fond vert). */
export function MosqueIcon({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <Path d="M11 30 Q11 14 26 14 Q41 14 41 30 Z" fill="#fff" opacity={0.95} />
      <Path d="M5 30 Q5 22 13 22 Q11 30 11 30 Z" fill="#fff" opacity={0.8} />
      <Path d="M47 30 Q47 22 39 22 Q41 30 41 30 Z" fill="#fff" opacity={0.8} />
      <Rect x={5} y={30} width={42} height={10} rx={1.5} fill="#fff" opacity={0.9} />
      <Rect x={22} y={6} width={8} height={10} rx={1} fill="#FFD97A" />
      <Path d="M22 6 Q26 2 30 6" fill="#FFD97A" />
      <Path d="M25 3 A2.5 2.5 0 1 1 27 3" stroke="#FFD97A" strokeWidth={1.4} fill="none" />
      <Rect x={8} y={20} width={4} height={10} rx={1} fill="#fff" opacity={0.7} />
      <Rect x={40} y={20} width={4} height={10} rx={1} fill="#fff" opacity={0.7} />
      <Path d="M21 40 L21 33 Q26 29 31 33 L31 40" fill="#B8963E" opacity={0.8} />
    </Svg>
  );
}

/** Minaret — nœud verrouillé (sur fond gris). */
export function MinaretIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={13} y={12} width={6} height={14} rx={1} fill="#9AA0AA" />
      <Path d="M10 26 L22 26" stroke="#9AA0AA" strokeWidth={2} strokeLinecap="round" />
      <Path d="M13 12 Q16 8 19 12" fill="#9AA0AA" />
      <Circle cx={16} cy={7} r={2} fill="#9AA0AA" />
      <Path d="M15 5.5 A2 2 0 1 1 17 5.5" stroke="#C0C4CC" strokeWidth={1} fill="none" />
    </Svg>
  );
}
