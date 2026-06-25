import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Path, Circle, Ellipse, Line } from 'react-native-svg';
import DeviceStatusBar from '../../../components/StatusBar';
import { MosqueIcon } from '../../../components/IslamicIcons';
import { useUserStore } from '../../../store/userStore';
import {
  PARCOURS_SECTIONS,
  type ParcoursNode,
  type ParcoursSection,
} from '../../../constants/parcours';

// Icônes SVG pros pour les nodes complétés
function IconStar({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M24 6 L28.5 18 L42 18 L31.5 26.5 L35.5 39 L24 31.5 L12.5 39 L16.5 26.5 L6 18 L19.5 18 Z" fill="#fff" opacity={0.95} />
    </Svg>
  );
}

function IconBook({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* couverture gauche */}
      <Path d="M8 10 Q8 8 10 8 L23 8 L23 40 L10 40 Q8 40 8 38 Z" fill="#fff" opacity={0.9} />
      {/* couverture droite */}
      <Path d="M25 8 L38 8 Q40 8 40 10 L40 38 Q40 40 38 40 L25 40 Z" fill="#fff" opacity={0.75} />
      {/* reliure */}
      <Path d="M23 8 L25 8 L25 40 L23 40 Z" fill="#fff" opacity={0.5} />
      {/* lignes texte gauche */}
      <Path d="M12 16 L21 16" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 21 L21 21" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 26 L18 26" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" />
      {/* lignes texte droite */}
      <Path d="M27 16 L36 16" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
      <Path d="M27 21 L36 21" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
      <Path d="M27 26 L32 26" stroke="#34C724" strokeWidth={1.8} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

function IconPen({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* corps du stylo */}
      <Path d="M32 8 L40 16 L18 38 L8 40 L10 30 Z" fill="#fff" opacity={0.92} />
      {/* pointe */}
      <Path d="M36 8 L40 12 L38 14 L34 10 Z" fill="#fff" opacity={0.6} />
      {/* reflet */}
      <Path d="M33 10 L38 15" stroke="#34C724" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      {/* trait d'écriture */}
      <Path d="M10 30 L18 38" stroke="#34C724" strokeWidth={1.2} opacity={0.4} />
      <Path d="M8 40 L14 34" stroke="#34C724" strokeWidth={1} opacity={0.35} />
    </Svg>
  );
}

function IconNote({ size = 48, locked = false }: { size?: number; locked?: boolean }) {
  const col = locked ? '#9AA0AA' : '#fff';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* hampe */}
      <Path d="M20 10 L20 34" stroke={col} strokeWidth={3} strokeLinecap="round" />
      {/* queue note 1 */}
      <Path d="M20 10 L36 7 L36 20 L20 23 Z" fill={col} opacity={0.9} />
      {/* tête note 1 */}
      <Ellipse cx={16} cy={35} rx={6} ry={4.5} fill={col} opacity={0.95} transform="rotate(-15 16 35)" />
      {/* hampe 2 */}
      <Path d="M33 17 L33 38" stroke={col} strokeWidth={3} strokeLinecap="round" />
      {/* tête note 2 */}
      <Ellipse cx={29} cy={39} rx={6} ry={4.5} fill={col} opacity={0.95} transform="rotate(-15 29 39)" />
    </Svg>
  );
}

function IconCrescent({ size = 48, locked = false }: { size?: number; locked?: boolean }) {
  const col = locked ? '#9AA0AA' : '#fff';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* grand croissant bien visible */}
      <Path d="M24 4 A20 20 0 1 0 24 44 A14 14 0 1 1 24 4 Z" fill={col} opacity={0.95} />
      {/* étoile 5 branches */}
      <Path d="M36 8 L37.5 4 L39 8 L43.5 8 L40 11 L41.5 15.5 L37.5 12.8 L33.5 15.5 L35 11 L31.5 8 Z" fill={col} opacity={0.88} />
      {/* petite étoile */}
      <Path d="M40 20 L41 17.5 L42 20 L44.5 20 L42.7 21.6 L43.4 24.2 L41 22.7 L38.6 24.2 L39.3 21.6 L37.5 20 Z" fill={col} opacity={0.65} />
    </Svg>
  );
}

function IconMoon({ size = 48, locked = false }: { size?: number; locked?: boolean }) {
  const col = locked ? '#9AA0AA' : '#fff';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* croissant */}
      <Path d="M28 6 A18 18 0 1 0 28 42 A13 13 0 1 1 28 6 Z" fill={col} opacity={0.95} />
      {/* petite étoile */}
      <Path d="M36 10 L37.2 7 L38.4 10 L41.5 10 L39 12 L40 15 L37.2 13.2 L34.4 15 L35.4 12 L33 10 Z" fill={col} opacity={0.85} />
      {/* étoile plus petite */}
      <Path d="M40 20 L40.8 18 L41.6 20 L43.8 20 L42.2 21.3 L42.9 23.5 L40.8 22.2 L38.7 23.5 L39.4 21.3 L37.8 20 Z" fill={col} opacity={0.7} />
    </Svg>
  );
}

function IconTrophy({ size = 48, locked = false }: { size?: number; locked?: boolean }) {
  const col = locked ? '#9AA0AA' : '#fff';
  const shine = locked ? '#B0B8C4' : '#ffffffcc';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* coupe */}
      <Path d="M14 8 L34 8 L32 26 Q32 34 24 36 Q16 34 16 26 Z" fill={col} opacity={0.95} />
      {/* anses */}
      <Path d="M14 10 Q6 10 6 18 Q6 24 14 24" stroke={col} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M34 10 Q42 10 42 18 Q42 24 34 24" stroke={col} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* pied */}
      <Rect x={20} y={36} width={8} height={5} rx={1} fill={col} opacity={0.85} />
      {/* socle */}
      <Rect x={15} y={41} width={18} height={3} rx={1.5} fill={col} opacity={0.9} />
      {/* reflet */}
      <Path d="M18 12 Q20 10 22 12" stroke={shine} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      {/* étoile sur la coupe */}
      <Path d="M24 14 L25.2 18 L29 18 L26 20.5 L27.2 24.5 L24 22 L20.8 24.5 L22 20.5 L19 18 L22.8 18 Z" fill={locked ? '#B0B8C4' : '#F6B100'} opacity={0.9} />
    </Svg>
  );
}

function Dashed() {
  return <View style={styles.dashed} />;
}

function CompletedNode({ align, icon }: { align: 'left' | 'right' | 'center'; icon?: 'kaaba' | 'mosque' | 'star' | 'book' | 'pen' }) {
  const renderIcon = () => {
    if (icon === 'star') return <IconStar size={52} />;
    if (icon === 'book') return <IconBook size={52} />;
    if (icon === 'pen')  return <IconPen  size={52} />;
    if (icon === 'mosque') return <MosqueIcon size={78} />;
    return <Text style={styles.kaabaEmoji}>🕋</Text>;
  };
  return (
    <View style={[styles.nodeRow, alignStyle(align)]}>
      <View style={styles.completed}>{renderIcon()}</View>
    </View>
  );
}

function LockedNode({ align, icon = 'kaaba' }: { align: 'left' | 'right' | 'center'; icon?: 'kaaba' | 'mosque' | 'note' | 'moon' | 'trophy' | 'crescent' }) {
  const renderIcon = () => {
    if (icon === 'note')     return <IconNote     size={52} locked />;
    if (icon === 'moon')     return <IconMoon     size={52} locked />;
    if (icon === 'trophy')   return <IconTrophy   size={52} locked />;
    if (icon === 'crescent') return <IconCrescent size={52} locked />;
    if (icon === 'mosque')   return <MosqueIcon   size={72} locked />;
    return <Text style={styles.kaabaEmojiLocked}>🕋</Text>;
  };
  return (
    <View style={[styles.nodeRow, alignStyle(align)]}>
      <View style={styles.locked}>{renderIcon()}</View>
    </View>
  );
}

function ActiveNode({ onPress, label = 'Leçon' }: { onPress: () => void; label?: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={[styles.nodeRow, { marginRight: 30 }]}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[styles.activeRing, ringStyle]}>
          <View style={styles.activeInner}>
            <MosqueIcon size={76} />
          </View>
        </Animated.View>
        <Text style={styles.activeLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ─── Panorama de La Mecque en arrière-plan ────────────────────────────────────
function MeccaSkyline({ width, height }: { width: number; height: number }) {
  const c = '#B0B8C4';   // couleur des traits — gris doux
  const op = 0.22;       // opacité globale très légère

  // viewBox 400×700 — on étire sur toute la surface
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 400 700"
      preserveAspectRatio="xMidYMax meet"
      style={StyleSheet.absoluteFillObject}
      opacity={op}
    >
      {/* ══ CIEL — croissants lunaires et étoiles ══ */}

      {/* ── GROSSE LUNE — haut droite ── */}
      {/* halo diffus */}
      <Circle cx={340} cy={90} r={58} fill={c} opacity={0.10} />
      <Circle cx={340} cy={90} r={50} fill={c} opacity={0.15} />
      {/* disque principal */}
      <Circle cx={340} cy={90} r={44} fill={c} opacity={0.72} />
      {/* ombre (cratère lunaire simulé — disque décalé pour effet croissant partiel) */}
      <Circle cx={354} cy={82} r={38} fill="#EDEDF2" opacity={0.85} />
      {/* cratères légers */}
      <Circle cx={318} cy={70}  r={5}   fill={c} opacity={0.25} />
      <Circle cx={326} cy={100} r={3.5} fill={c} opacity={0.20} />
      <Circle cx={308} cy={88}  r={4}   fill={c} opacity={0.22} />
      <Circle cx={322} cy={58}  r={2.5} fill={c} opacity={0.18} />

      {/* ── Croissants (14 total) ── */}
      <Path d="M42 48  A28 28 0 1 0 42 104  A20 20 0 1 1 42 48  Z" fill={c} opacity={0.92} />
      <Path d="M148 32 A16 16 0 1 0 148 64  A11 11 0 1 1 148 32 Z" fill={c} opacity={0.82} />
      <Path d="M310 28 A22 22 0 1 0 310 72  A15 15 0 1 1 310 28 Z" fill={c} opacity={0.88} />
      <Path d="M368 90 A14 14 0 1 0 368 118 A10 10 0 1 1 368 90 Z" fill={c} opacity={0.78} />
      <Path d="M210 10 A18 18 0 1 0 210 46  A12 12 0 1 1 210 10 Z" fill={c} opacity={0.80} />
      <Path d="M264 55 A12 12 0 1 0 264 79  A8  8  0 1 1 264 55 Z" fill={c} opacity={0.75} />
      <Path d="M18  130 A10 10 0 1 0 18  150 A7  7  0 1 1 18  130 Z" fill={c} opacity={0.72} />
      <Path d="M356 140 A13 13 0 1 0 356 166 A9  9  0 1 1 356 140 Z" fill={c} opacity={0.74} />
      {/* nouveaux croissants */}
      <Path d="M88  160 A11 11 0 1 0 88  182 A7.5 7.5 0 1 1 88  160 Z" fill={c} opacity={0.70} />
      <Path d="M320 160 A10 10 0 1 0 320 180 A7  7  0 1 1 320 160 Z" fill={c} opacity={0.68} />
      <Path d="M6   30  A9  9  0 1 0 6   48  A6  6  0 1 1 6   30  Z" fill={c} opacity={0.70} />
      <Path d="M390 170 A9  9  0 1 0 390 188 A6  6  0 1 1 390 170 Z" fill={c} opacity={0.65} />
      <Path d="M176 175 A10 10 0 1 0 176 195 A7  7  0 1 1 176 175 Z" fill={c} opacity={0.65} />
      <Path d="M240 195 A8  8  0 1 0 240 211 A5.5 5.5 0 1 1 240 195 Z" fill={c} opacity={0.60} />

      {/* ── Étoiles à 5 branches (20 total) ── */}
      <Path d="M78  52  L80 46  L82 52  L88 52  L83 56  L85 62  L80 58  L75 62  L77 56  L72 52  Z" fill={c} opacity={0.90} />
      <Path d="M94  78  L95.5 73 L97 78  L102 78 L98 81  L99.5 86 L95.5 83 L91.5 86 L93 81  L89 78  Z" fill={c} opacity={0.78} />
      <Path d="M184 52  L186 47 L188 52 L193 52 L189 55 L190.5 60 L186 57 L181.5 60 L183 55 L179 52 Z" fill={c} opacity={0.76} />
      <Path d="M128 72  L129.5 67 L131 72 L136 72 L132 75 L133.5 80 L129.5 77 L125.5 80 L127 75 L123 72 Z" fill={c} opacity={0.72} />
      <Path d="M342 34  L344 28 L346 34 L352 34 L347 38 L349 44 L344 40 L339 44 L341 38 L336 34 Z" fill={c} opacity={0.82} />
      <Path d="M356 68  L357.5 63 L359 68 L364 68 L360 71 L361.5 76 L357.5 73 L353.5 76 L355 71 L351 68 Z" fill={c} opacity={0.72} />
      <Path d="M196 14  L197.5 9  L199 14 L204 14 L200 17 L201.5 22 L197.5 19 L193.5 22 L195 17 L191 14 Z" fill={c} opacity={0.72} />
      <Path d="M238 30  L239.5 25 L241 30 L246 30 L242 33 L243.5 38 L239.5 35 L235.5 38 L237 33 L233 30 Z" fill={c} opacity={0.68} />
      <Path d="M382 58  L383.5 53 L385 58 L390 58 L386 61 L387.5 66 L383.5 63 L379.5 66 L381 61 L377 58 Z" fill={c} opacity={0.70} />
      <Path d="M36  148 L37.5 143 L39 148 L44 148 L40 151 L41.5 156 L37.5 153 L33.5 156 L35 151 L31 148 Z" fill={c} opacity={0.68} />
      <Path d="M166 110 L167.5 105 L169 110 L174 110 L170 113 L171.5 118 L167.5 115 L163.5 118 L165 113 L161 110 Z" fill={c} opacity={0.65} />
      <Path d="M290 95  L291.5 90 L293 95 L298 95 L294 98 L295.5 103 L291.5 100 L287.5 103 L289 98 L285 95 Z" fill={c} opacity={0.65} />
      {/* nouvelles étoiles */}
      <Path d="M50  170 L51.5 165 L53 170 L58 170 L54 173 L55.5 178 L51.5 175 L47.5 178 L49 173 L45 170 Z" fill={c} opacity={0.65} />
      <Path d="M330 180 L331.5 175 L333 180 L338 180 L334 183 L335.5 188 L331.5 185 L327.5 188 L329 183 L325 180 Z" fill={c} opacity={0.62} />
      <Path d="M112 190 L113.5 185 L115 190 L120 190 L116 193 L117.5 198 L113.5 195 L109.5 198 L111 193 L107 190 Z" fill={c} opacity={0.60} />
      <Path d="M270 165 L271.5 160 L273 165 L278 165 L274 168 L275.5 173 L271.5 170 L267.5 173 L269 168 L265 165 Z" fill={c} opacity={0.62} />
      <Path d="M14  60  L15.5 55  L17 60  L22 60  L18 63  L19.5 68  L15.5 65  L11.5 68  L13 63  L9  60  Z" fill={c} opacity={0.68} />
      <Path d="M394 50  L395.5 45 L397 50 L400 50 L397 53 L398.5 58 L395.5 55 L392 58 L393.5 53 L390 50 Z" fill={c} opacity={0.65} />
      <Path d="M154 140 L155.5 135 L157 140 L162 140 L158 143 L159.5 148 L155.5 145 L151.5 148 L153 143 L149 140 Z" fill={c} opacity={0.60} />
      <Path d="M246 130 L247.5 125 L249 130 L254 130 L250 133 L251.5 138 L247.5 135 L243.5 138 L245 133 L241 130 Z" fill={c} opacity={0.62} />

      {/* ── Points lumineux (45 total) ── */}
      <Circle cx={65}  cy={38}  r={2.8} fill={c} opacity={0.82} />
      <Circle cx={100} cy={44}  r={2.2} fill={c} opacity={0.75} />
      <Circle cx={112} cy={62}  r={1.8} fill={c} opacity={0.70} />
      <Circle cx={54}  cy={122} r={2.0} fill={c} opacity={0.70} />
      <Circle cx={174} cy={38}  r={2.4} fill={c} opacity={0.78} />
      <Circle cx={168} cy={26}  r={1.8} fill={c} opacity={0.72} />
      <Circle cx={300} cy={22}  r={2.6} fill={c} opacity={0.78} />
      <Circle cx={330} cy={16}  r={2.0} fill={c} opacity={0.72} />
      <Circle cx={360} cy={52}  r={2.2} fill={c} opacity={0.70} />
      <Circle cx={372} cy={30}  r={1.8} fill={c} opacity={0.68} />
      <Circle cx={390} cy={96}  r={1.9} fill={c} opacity={0.68} />
      <Circle cx={385} cy={82}  r={2.4} fill={c} opacity={0.72} />
      <Circle cx={218} cy={20}  r={2.2} fill={c} opacity={0.70} />
      <Circle cx={240} cy={50}  r={1.8} fill={c} opacity={0.65} />
      <Circle cx={164} cy={68}  r={1.9} fill={c} opacity={0.65} />
      <Circle cx={130} cy={100} r={1.7} fill={c} opacity={0.62} />
      <Circle cx={262} cy={88}  r={2.0} fill={c} opacity={0.65} />
      <Circle cx={288} cy={110} r={1.6} fill={c} opacity={0.60} />
      <Circle cx={8}   cy={80}  r={1.8} fill={c} opacity={0.65} />
      <Circle cx={28}  cy={52}  r={1.5} fill={c} opacity={0.60} />
      <Circle cx={140} cy={14}  r={2.4} fill={c} opacity={0.70} />
      <Circle cx={188} cy={76}  r={1.7} fill={c} opacity={0.62} />
      <Circle cx={222} cy={95}  r={1.9} fill={c} opacity={0.62} />
      <Circle cx={250} cy={130} r={1.6} fill={c} opacity={0.58} />
      <Circle cx={314} cy={95}  r={2.1} fill={c} opacity={0.65} />
      <Circle cx={340} cy={120} r={1.7} fill={c} opacity={0.60} />
      <Circle cx={395} cy={130} r={1.8} fill={c} opacity={0.60} />
      <Circle cx={74}  cy={160} r={1.6} fill={c} opacity={0.58} />
      <Circle cx={110} cy={140} r={1.9} fill={c} opacity={0.60} />
      <Circle cx={200} cy={160} r={1.7} fill={c} opacity={0.58} />
      {/* supplémentaires */}
      <Circle cx={22}  cy={100} r={1.5} fill={c} opacity={0.58} />
      <Circle cx={46}  cy={200} r={1.4} fill={c} opacity={0.55} />
      <Circle cx={80}  cy={200} r={1.6} fill={c} opacity={0.55} />
      <Circle cx={142} cy={170} r={1.5} fill={c} opacity={0.55} />
      <Circle cx={178} cy={215} r={1.4} fill={c} opacity={0.52} />
      <Circle cx={220} cy={180} r={1.7} fill={c} opacity={0.58} />
      <Circle cx={258} cy={205} r={1.3} fill={c} opacity={0.52} />
      <Circle cx={296} cy={175} r={1.6} fill={c} opacity={0.56} />
      <Circle cx={348} cy={200} r={1.5} fill={c} opacity={0.54} />
      <Circle cx={378} cy={155} r={1.8} fill={c} opacity={0.58} />
      <Circle cx={120} cy={24}  r={1.6} fill={c} opacity={0.65} />
      <Circle cx={56}  cy={8}   r={2.0} fill={c} opacity={0.68} />
      <Circle cx={270} cy={12}  r={1.8} fill={c} opacity={0.65} />
      <Circle cx={350} cy={8}   r={1.5} fill={c} opacity={0.62} />
      <Circle cx={398} cy={20}  r={1.4} fill={c} opacity={0.60} />

      {/* ══ SOL ══ */}
      <Rect x={0} y={640} width={400} height={60} fill={c} />
      {/* esplanade Mataaf */}
      <Ellipse cx={200} cy={645} rx={110} ry={14} fill={c} opacity={0.5} />

      {/* ══ ABRAJ AL-BAIT — Tour de l'Horloge (centre) ══ */}
      {/* socle */}
      <Rect x={170} y={560} width={60} height={80} fill={c} />
      {/* tours latérales du complexe */}
      <Rect x={145} y={580} width={28} height={60} fill={c} opacity={0.7} />
      <Rect x={227} y={580} width={28} height={60} fill={c} opacity={0.7} />
      {/* fût principal */}
      <Rect x={182} y={300} width={36} height={260} fill={c} />
      {/* renforcements horizontaux */}
      <Rect x={178} y={380} width={44} height={6}  fill={c} opacity={0.6} />
      <Rect x={178} y={440} width={44} height={6}  fill={c} opacity={0.6} />
      <Rect x={178} y={500} width={44} height={6}  fill={c} opacity={0.6} />
      {/* bloc horloge */}
      <Rect x={174} y={240} width={52} height={62} fill={c} />
      {/* cadran horloge — cercle */}
      <Circle cx={200} cy={270} r={22} fill="none" stroke={c} strokeWidth={3} />
      {/* aiguilles */}
      <Line x1={200} y1={270} x2={200} y2={252} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={200} y1={270} x2={214} y2={274} stroke={c} strokeWidth={2} strokeLinecap="round" />
      {/* flèche de la tour */}
      <Path d="M192 240 L200 200 L208 240 Z" fill={c} />
      {/* croissant + étoile au sommet */}
      <Path d="M196 196 A6 6 0 1 0 196 207 A4 4 0 1 1 196 196 Z" fill={c} />
      <Circle cx={205} cy={199} r={2} fill={c} />
      {/* fenêtres tour principale */}
      {[320, 350, 390, 420, 460, 490, 520].map((y, i) => (
        <Rect key={i} x={188} y={y} width={8}  height={12} rx={1} fill={c} opacity={0.5} />
      ))}
      {[320, 350, 390, 420, 460, 490, 520].map((y, i) => (
        <Rect key={i} x={204} y={y} width={8}  height={12} rx={1} fill={c} opacity={0.5} />
      ))}

      {/* ══ MINARETS DU MASJID AL-HARAM ══ */}
      {/* minaret 1 — loin gauche */}
      <Rect x={20}  y={490} width={14} height={150} fill={c} opacity={0.6} />
      <Rect x={16}  y={530} width={22} height={5}   fill={c} opacity={0.5} />
      <Rect x={16}  y={570} width={22} height={5}   fill={c} opacity={0.5} />
      <Path d="M20 490 Q27 472 34 490 Z" fill={c} opacity={0.6} />
      <Path d="M23 468 A4 4 0 1 0 23 476 A2.5 2.5 0 1 1 23 468 Z" fill={c} opacity={0.6} />
      <Circle cx={31} cy={470} r={1.5} fill={c} opacity={0.6} />

      {/* minaret 2 — gauche proche */}
      <Rect x={78}  y={460} width={16} height={180} fill={c} opacity={0.75} />
      <Rect x={73}  y={502} width={26} height={5}   fill={c} opacity={0.6} />
      <Rect x={73}  y={548} width={26} height={5}   fill={c} opacity={0.6} />
      <Path d="M78 460 Q86 440 94 460 Z" fill={c} opacity={0.75} />
      <Path d="M81 436 A4.5 4.5 0 1 0 81 445 A3 3 0 1 1 81 436 Z" fill={c} opacity={0.75} />
      <Circle cx={91} cy={438} r={1.8} fill={c} opacity={0.75} />

      {/* minaret 3 — gauche milieu */}
      <Rect x={132} y={430} width={14} height={210} fill={c} opacity={0.65} />
      <Rect x={127} y={470} width={24} height={5}   fill={c} opacity={0.55} />
      <Rect x={127} y={520} width={24} height={5}   fill={c} opacity={0.55} />
      <Path d="M132 430 Q139 412 146 430 Z" fill={c} opacity={0.65} />
      <Path d="M135 408 A4 4 0 1 0 135 416 A2.5 2.5 0 1 1 135 408 Z" fill={c} opacity={0.65} />
      <Circle cx={143} cy={410} r={1.6} fill={c} opacity={0.65} />

      {/* minaret 4 — droite milieu */}
      <Rect x={254} y={430} width={14} height={210} fill={c} opacity={0.65} />
      <Rect x={249} y={470} width={24} height={5}   fill={c} opacity={0.55} />
      <Rect x={249} y={520} width={24} height={5}   fill={c} opacity={0.55} />
      <Path d="M254 430 Q261 412 268 430 Z" fill={c} opacity={0.65} />
      <Path d="M257 408 A4 4 0 1 0 257 416 A2.5 2.5 0 1 1 257 408 Z" fill={c} opacity={0.65} />
      <Circle cx={265} cy={410} r={1.6} fill={c} opacity={0.65} />

      {/* minaret 5 — droite proche */}
      <Rect x={306} y={460} width={16} height={180} fill={c} opacity={0.75} />
      <Rect x={301} y={502} width={26} height={5}   fill={c} opacity={0.6} />
      <Rect x={301} y={548} width={26} height={5}   fill={c} opacity={0.6} />
      <Path d="M306 460 Q314 440 322 460 Z" fill={c} opacity={0.75} />
      <Path d="M309 436 A4.5 4.5 0 1 0 309 445 A3 3 0 1 1 309 436 Z" fill={c} opacity={0.75} />
      <Circle cx={319} cy={438} r={1.8} fill={c} opacity={0.75} />

      {/* minaret 6 — loin droite */}
      <Rect x={366} y={490} width={14} height={150} fill={c} opacity={0.6} />
      <Rect x={362} y={530} width={22} height={5}   fill={c} opacity={0.5} />
      <Rect x={362} y={570} width={22} height={5}   fill={c} opacity={0.5} />
      <Path d="M366 490 Q373 472 380 490 Z" fill={c} opacity={0.6} />
      <Path d="M369 468 A4 4 0 1 0 369 476 A2.5 2.5 0 1 1 369 468 Z" fill={c} opacity={0.6} />
      <Circle cx={377} cy={470} r={1.5} fill={c} opacity={0.6} />

      {/* ══ MASJID AL-HARAM — grande coupole + corps ══ */}
      {/* aile gauche */}
      <Rect x={40}  y={600} width={120} height={40} fill={c} opacity={0.5} />
      {/* aile droite */}
      <Rect x={240} y={600} width={120} height={40} fill={c} opacity={0.5} />
      {/* corps central */}
      <Rect x={120} y={580} width={160} height={60} fill={c} opacity={0.6} />
      {/* grande coupole centrale */}
      <Path d="M150 580 Q200 530 250 580 Z" fill={c} opacity={0.65} />
      {/* petites coupoles */}
      <Path d="M120 600 Q137 582 154 600 Z" fill={c} opacity={0.5} />
      <Path d="M246 600 Q263 582 280 600 Z" fill={c} opacity={0.5} />
      {/* arches façade */}
      {[50, 76, 102, 302, 328, 354].map((x, i) => (
        <Path key={i} d={`M${x} 640 Q${x+13} 622 ${x+26} 640`} fill={c} opacity={0.4} />
      ))}
      {[130, 155, 180, 205, 230].map((x, i) => (
        <Path key={i} d={`M${x} 640 Q${x+13} 618 ${x+26} 640`} fill={c} opacity={0.5} />
      ))}

      {/* ══ IMMEUBLES ENVIRONNANTS ══ */}
      {/* gauche lointain */}
      <Rect x={0}   y={550} width={18} height={90}  fill={c} opacity={0.3} />
      <Rect x={22}  y={570} width={14} height={70}  fill={c} opacity={0.3} />
      {/* droite lointain */}
      <Rect x={382} y={550} width={18} height={90}  fill={c} opacity={0.3} />
      <Rect x={364} y={570} width={14} height={70}  fill={c} opacity={0.3} />
      {/* immeubles hôtels gauche */}
      <Rect x={44}  y={500} width={30} height={140} fill={c} opacity={0.35} />
      <Rect x={78}  y={520} width={22} height={120} fill={c} opacity={0.3} />
      {/* immeubles hôtels droite */}
      <Rect x={326} y={500} width={30} height={140} fill={c} opacity={0.35} />
      <Rect x={300} y={520} width={22} height={120} fill={c} opacity={0.3} />
    </Svg>
  );
}

function alignStyle(align: 'left' | 'right' | 'center') {
  if (align === 'left') return { marginLeft: 120 };
  if (align === 'right') return { marginRight: 120 };
  return {};
}

/** Dispatcher : rend le bon nœud selon son état (completed / active / locked). */
function RenderNode({ node, onPress }: { node: ParcoursNode; onPress: () => void }) {
  if (node.state === 'active') return <ActiveNode label={node.label} onPress={onPress} />;
  if (node.state === 'completed') {
    return <CompletedNode align={node.align} icon={node.icon as 'star' | 'book' | 'pen' | 'mosque' | 'kaaba'} />;
  }
  return <LockedNode align={node.align} icon={node.icon as 'note' | 'moon' | 'trophy' | 'kaaba' | 'crescent' | 'mosque'} />;
}

/** Carte de titre d'une section + ses nœuds reliés par des pointillés. */
function SectionBlock({
  section,
  index,
  onLessonPress,
}: {
  section: ParcoursSection;
  index: number;
  onLessonPress: (n: ParcoursNode) => void;
}) {
  const done = section.nodes.filter((n) => n.state === 'completed').length;
  const total = section.nodes.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View style={styles.sectionWrap}>
      <Animated.View
        entering={FadeInDown.delay(index * 130)
          .duration(550)
          .springify()
          .damping(14)}
      >
        <LinearGradient
          colors={section.degrade}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionCard}
        >
        {/* Pastille d'icône */}
        <View style={styles.sectionIcon}>
          <Feather name={section.headerIcon as any} size={24} color="#fff" />
        </View>

        {/* Textes */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionKicker}>{section.kicker}</Text>
          <Text style={styles.sectionTitre}>{section.titre}</Text>
          {!!section.sousTitre && (
            <Text style={styles.sectionSousTitre} numberOfLines={1}>{section.sousTitre}</Text>
          )}

          {/* Barre de progression */}
          <View style={styles.sectionProgressTrack}>
            <View style={[styles.sectionProgressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.sectionProgressLabel}>{done}/{total} leçons</Text>
        </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.path}>
        {section.nodes.map((node, i) => (
          <View key={node.id} style={{ alignItems: 'center' }}>
            <RenderNode node={node} onPress={() => onLessonPress(node)} />
            {i < section.nodes.length - 1 && <Dashed />}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ParcoursScreen() {
  const router = useRouter();
  const { streak, xp, hearts, isPremium, syncHearts } = useUserStore();
  const { width, height } = useWindowDimensions();

  // Régénère les cœurs à chaque fois qu'on revient sur le parcours.
  useFocusEffect(
    useCallback(() => {
      syncHearts();
    }, [syncHearts]),
  );

  const openLesson = (node: ParcoursNode) => {
    if (node.state === 'locked') return;            // leçon verrouillée
    if (!isPremium && hearts <= 0) {                // plus de cœurs → blocage
      router.push('/(app)/lesson/out-of-hearts');
      return;
    }
    router.push('/(app)/lesson/play');
  };

  return (
    <View style={styles.screen}>
      {/* Panorama La Mecque en fond semi-transparent */}
      <MeccaSkyline width={width} height={height} />
      <View style={styles.statusWrap}>
        <DeviceStatusBar />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={{ fontSize: 22 }}>🔥</Text>
          <Text style={[styles.statText, { color: '#F0820C' }]}>{streak}</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="zap" size={22} color="#E8A800" />
          <Text style={[styles.statText, { color: '#E8A800' }]}>{xp} XP</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="heart" size={22} color="#FF4B4B" />
          <Text style={[styles.statText, { color: '#FF4B4B' }]}>{isPremium ? '∞' : hearts}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {PARCOURS_SECTIONS.map((section, index) => (
          <SectionBlock
            key={section.id}
            section={section}
            index={index}
            onLessonPress={openLesson}
          />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  statusWrap: { backgroundColor: '#fff' },
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingVertical: 14, backgroundColor: '#fff',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21 },
  scroll: { alignItems: 'center' },
  sectionWrap: { width: '100%' },
  sectionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 18, marginTop: 22,
    paddingHorizontal: 18, paddingVertical: 18, borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 6,
  },
  sectionIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionKicker: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.85)',
  },
  sectionTitre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 1 },
  sectionSousTitre: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13,
    color: 'rgba(255,255,255,0.9)', marginTop: 2,
  },
  sectionProgressTrack: {
    height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.18)',
    marginTop: 12, overflow: 'hidden',
  },
  sectionProgressFill: { height: '100%', borderRadius: 4, backgroundColor: '#fff' },
  sectionProgressLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 11,
    color: 'rgba(255,255,255,0.95)', marginTop: 5,
  },
  path: { alignItems: 'center', paddingVertical: 40, width: '100%' },
  nodeRow: { alignItems: 'center' },
  completed: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#2A9E1C',
    borderBottomWidth: 8, borderBottomColor: '#1E7A15',
    shadowColor: '#1E7A15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 6,
  },
  locked: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#D5D8DF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#B0B5BE',
    borderBottomWidth: 8, borderBottomColor: '#9EA3AC',
  },
  activeRing: {
    width: 122, height: 122, borderRadius: 61, backgroundColor: 'rgba(52,199,36,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(52,199,36,0.35)',
  },
  activeInner: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#2A9E1C',
    borderBottomWidth: 8, borderBottomColor: '#1E7A15',
    shadowColor: '#1E7A15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 6,
  },
  activeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#2A9E1C', marginTop: 8 },
  kaabaEmoji: { fontSize: 46 },
  kaabaEmojiLocked: { fontSize: 44, opacity: 0.45 },
  dashed: {
    height: 30, borderLeftWidth: 3, borderColor: '#C9CDD4',
    borderStyle: 'dashed', width: 0,
  },
});
