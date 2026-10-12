import type { ReactElement } from 'react';
import Svg, { Rect, Path, Circle, Ellipse, Polygon } from 'react-native-svg';
import { ProphetsIcon } from './IslamicIcons';

/**
 * Icônes des 25 prophètes (pages « Prophètes » de la section Coran).
 *
 * Elles remplacent les emojis, dont le rendu varie selon la police système et
 * le fabricant. Chaque icône reprend un SYMBOLE de l'histoire du prophète
 * (l'arche, le calame, la balance…) — jamais une figure humaine : on ne
 * représente pas les prophètes.
 *
 * Même convention que les icônes de thème d'IslamicIcons.tsx : viewBox 28,
 * une seule couleur (`color`), les aplats secondaires passent par l'opacité.
 */
type IconProps = { size?: number; color?: string };
export type ProphetIcon = (p: IconProps) => ReactElement;

/** Adam — la Terre, où descend le premier homme. */
function AdamIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={10} fill={color} opacity={0.3} />
      <Circle cx={14} cy={14} r={10} stroke={color} strokeWidth={1.5} />
      <Ellipse cx={14} cy={14} rx={4.3} ry={10} stroke={color} strokeWidth={1.2} />
      <Path d="M4 14 H24" stroke={color} strokeWidth={1.2} />
      <Path d="M5.6 9 Q14 11.2 22.4 9" stroke={color} strokeWidth={1.1} />
      <Path d="M5.6 19 Q14 16.8 22.4 19" stroke={color} strokeWidth={1.1} />
    </Svg>
  );
}

/** Idris — le calame, premier à écrire. */
function IdrisIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M20.5 3 L25 7.5 L12 20.5 L7.5 16 Z" fill={color} />
      <Path d="M7.5 16 L12 20.5 L4.5 23.5 Z" fill={color} opacity={0.6} />
      <Path d="M4 26 Q10 24 15 25.6 Q19 26.8 24 25.2" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
    </Svg>
  );
}

/** Nuh — l'arche sur les flots. */
function NuhIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M8 9.5 L14 5.5 L20 9.5 Z" fill={color} />
      <Rect x={9.5} y={9.5} width={9} height={5} fill={color} opacity={0.6} />
      <Path d="M2.5 14.5 L25.5 14.5 Q23.5 21.5 18 21.5 L10 21.5 Q4.5 21.5 2.5 14.5 Z" fill={color} />
      <Path d="M2 25 Q5 23.4 8 25 Q11 26.6 14 25 Q17 23.4 20 25 Q23 26.6 26 25" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

/** Hud — le vent sur les dunes des ʿÂd. */
function HudIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M4 6.5 H15.5 Q19 6.5 19 4.4 Q19 2.6 17.2 2.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M3 11 H21 Q24.5 11 24.5 8.8 Q24.5 7 22.7 7" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <Path d="M2 25 Q8 15.5 14 21 Q19 14.5 26 25 Z" fill={color} />
    </Svg>
  );
}

/** Salih — la chamelle, signe donné aux Thamûd. */
function SalihIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M6 22 L6 15.5 Q6 12.5 9 12.5 Q10.5 8.5 13 8.5 Q15.5 8.5 16.5 12.5 Q18.5 12.5 19 10.5 L20 5.5 Q20.3 4 21.8 4 L24.5 4.6 Q25.3 5 24.8 6 L22.6 6.6 L22 12 Q21.5 15.5 19.5 16.5 L19.5 22 L17.6 22 L17.6 17.2 L8 17.2 L8 22 Z"
        fill={color}
      />
      <Path d="M6 14.5 Q4.2 16 4.6 18.5" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
      <Rect x={4} y={23.4} width={19} height={1.3} rx={0.65} fill={color} opacity={0.5} />
    </Svg>
  );
}

/** Ibrahim — la Kaaba, qu'il éleva avec Ismâʿîl. */
function IbrahimIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={5} y={6.5} width={18} height={18} rx={1.6} fill={color} opacity={0.35} />
      <Rect x={5} y={6.5} width={18} height={18} rx={1.6} stroke={color} strokeWidth={1.3} />
      <Rect x={5} y={10.5} width={18} height={3} fill={color} />
      <Path d="M11.5 24.5 L11.5 19.5 Q14 17 16.5 19.5 L16.5 24.5 Z" fill={color} />
    </Svg>
  );
}

/** Lut — le châtiment de feu tombé sur la cité. */
function LutIcon({ size = 28, color = '#fff' }: IconProps) {
  const flame = 'M14 2.5 Q21.5 10 21.5 16.5 A7.5 7.5 0 0 1 6.5 16.5 Q6.5 12.5 9.5 9.5 Q10 13 12 13.5 Q11.5 7.5 14 2.5 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={flame} fill={color} opacity={0.4} />
      <Path d={flame} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M14 14 Q17.5 17.5 17.5 19.8 A3.5 3.5 0 0 1 10.5 19.8 Q10.5 17.5 14 14 Z" fill={color} />
    </Svg>
  );
}

/** Ismâʿîl — la source de Zamzam qui jaillit. */
function IsmailIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 2.5 Q18.2 8.5 18.2 11 A4.2 4.2 0 0 1 9.8 11 Q9.8 8.5 14 2.5 Z" fill={color} />
      <Path d="M14 17 V22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10.5 17.5 Q6 17.5 5 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
      <Path d="M17.5 17.5 Q22 17.5 23 22" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
      <Rect x={3} y={23.4} width={22} height={2.2} rx={1.1} fill={color} />
    </Svg>
  );
}

/** Ishâq — l'étoile de la bonne nouvelle annoncée à Ibrahim. */
function IshaqIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon
        points="12.50,6.00 14.85,12.26 21.54,12.56 16.30,16.74 18.08,23.19 12.50,19.50 6.92,23.19 8.70,16.74 3.46,12.56 10.15,12.26"
        fill={color}
      />
      <Path d="M22.5 2 L23.4 4.6 L26 5.5 L23.4 6.4 L22.5 9 L21.6 6.4 L19 5.5 L21.6 4.6 Z" fill={color} opacity={0.75} />
    </Svg>
  );
}

/** Yaʿqûb — la tente du patriarche. */
function YaqubIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 2 V5" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M14 5 L25 23 L3 23 Z" fill={color} opacity={0.4} />
      <Path d="M14 5 L25 23 L3 23 Z" stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M14 12 L18 23 L10 23 Z" fill={color} />
      <Path d="M2 24.6 H26" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/** Yûsuf — l'épi de blé des greniers d'Égypte. */
function YusufIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 26 V9" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M14 9.5 Q11.6 6.5 14 2 Q16.4 6.5 14 9.5 Z" fill={color} />
      <Path d="M14 14 Q9.5 13.5 9 8.8 Q13.5 9.4 14 14 Z" fill={color} />
      <Path d="M14 14 Q18.5 13.5 19 8.8 Q14.5 9.4 14 14 Z" fill={color} />
      <Path d="M14 18.8 Q9.5 18.3 9 13.6 Q13.5 14.2 14 18.8 Z" fill={color} opacity={0.85} />
      <Path d="M14 18.8 Q18.5 18.3 19 13.6 Q14.5 14.2 14 18.8 Z" fill={color} opacity={0.85} />
      <Path d="M14 23.6 Q9.5 23.1 9 18.4 Q13.5 19 14 23.6 Z" fill={color} opacity={0.7} />
      <Path d="M14 23.6 Q18.5 23.1 19 18.4 Q14.5 19 14 23.6 Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

/** Ayyûb — le sablier de la patience dans l'épreuve. */
function AyyubIcon({ size = 28, color = '#fff' }: IconProps) {
  const glass = 'M9 5.4 L19 5.4 Q19 11 14.8 14 Q19 17 19 22.6 L9 22.6 Q9 17 13.2 14 Q9 11 9 5.4 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={7} y={3} width={14} height={2.4} rx={1.2} fill={color} />
      <Path d={glass} fill={color} opacity={0.3} />
      <Path d={glass} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M11.2 9 L16.8 9 Q15.8 11.6 14 12.6 Q12.2 11.6 11.2 9 Z" fill={color} />
      <Path d="M10.2 22.6 Q10.8 18.8 14 18 Q17.2 18.8 17.8 22.6 Z" fill={color} />
      <Rect x={7} y={22.6} width={14} height={2.4} rx={1.2} fill={color} />
    </Svg>
  );
}

/** Shuʿayb — la balance juste, contre la fraude des Madyan. */
function ShuaybIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={4.2} r={1.7} fill={color} />
      <Path d="M14 5 V23" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M5 8 H23" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M5 8 L2.5 15 M5 8 L7.5 15" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Path d="M23 8 L20.5 15 M23 8 L25.5 15" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Path d="M1.6 15 H8.4 Q8.4 18.8 5 18.8 Q1.6 18.8 1.6 15 Z" fill={color} />
      <Path d="M19.6 15 H26.4 Q26.4 18.8 23 18.8 Q19.6 18.8 19.6 15 Z" fill={color} />
      <Rect x={9} y={22.8} width={10} height={2.4} rx={1.2} fill={color} />
    </Svg>
  );
}

/** Mûsâ — le bâton et la mer fendue en deux murailles d'eau. */
function MusaIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M1.5 25 V13 Q3 10.6 4.5 13 Q6 15.4 7.5 13 Q9 10.6 10.5 13 V25 Z" fill={color} opacity={0.5} />
      <Path d="M26.5 25 V13 Q25 10.6 23.5 13 Q22 15.4 20.5 13 Q19 10.6 17.5 13 V25 Z" fill={color} opacity={0.5} />
      <Path d="M3 19 Q4.5 17.6 6 19 Q7.5 20.4 9 19" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M19 19 Q20.5 17.6 22 19 Q23.5 20.4 25 19" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M14 25.5 V6 Q14 2.8 17 3" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

/** Hârûn — la parole éloquente, porte-voix de Mûsâ. */
function HarunIcon({ size = 28, color = '#fff' }: IconProps) {
  const bubble = 'M5 4.5 H23 Q25.5 4.5 25.5 7 V16 Q25.5 18.5 23 18.5 H13.5 L8 23.5 V18.5 H5 Q2.5 18.5 2.5 16 V7 Q2.5 4.5 5 4.5 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={bubble} fill={color} opacity={0.35} />
      <Path d={bubble} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Rect x={7} y={8.6} width={14} height={1.5} rx={0.75} fill={color} />
      <Rect x={7} y={12.4} width={9.5} height={1.5} rx={0.75} fill={color} />
    </Svg>
  );
}

/** Dhûl-Kifl — le sceau de l'engagement tenu. */
function DhulKiflIcon({ size = 28, color = '#fff' }: IconProps) {
  const seal =
    '14.00,2.50 17.44,5.69 22.13,5.87 22.31,10.56 25.50,14.00 22.31,17.44 22.13,22.13 17.44,22.31 14.00,25.50 10.56,22.31 5.87,22.13 5.69,17.44 2.50,14.00 5.69,10.56 5.87,5.87 10.56,5.69';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points={seal} fill={color} opacity={0.35} />
      <Polygon points={seal} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M9.3 14.3 L12.7 17.6 L18.9 10.8" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Dâwûd — les montagnes et les oiseaux qui glorifiaient avec lui. */
function DawudIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M13 6.5 Q14.6 4.4 16.2 6.5 Q17.8 4.4 19.4 6.5" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M20.4 10.4 Q21.6 8.9 22.8 10.4 Q24 8.9 25.2 10.4" stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity={0.75} />
      <Path d="M2 25 L10 10 L14.5 17.5 L18 13 L26 25 Z" fill={color} />
    </Svg>
  );
}

/** Sulaymân — la couronne du roi-prophète. */
function SulaymanIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M4.5 20.5 L3.5 9.5 L9 14 L14 6.5 L19 14 L24.5 9.5 L23.5 20.5 Z" fill={color} />
      <Circle cx={3.5} cy={8} r={1.6} fill={color} />
      <Circle cx={14} cy={4.8} r={1.7} fill={color} />
      <Circle cx={24.5} cy={8} r={1.6} fill={color} />
      <Rect x={4.5} y={21.8} width={19} height={2.6} rx={1.3} fill={color} opacity={0.75} />
    </Svg>
  );
}

/** Ilyâs — l'éclair de l'avertissement. */
function IlyasIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points="16.5,2 6,15.5 12.5,15.5 10.5,26 22,11.5 15.5,11.5" fill={color} />
    </Svg>
  );
}

/** Al-Yasaʿ — la feuille, la droiture qui se transmet. */
function AlyasaIcon({ size = 28, color = '#fff' }: IconProps) {
  const leaf = 'M6 22 Q3 8 22.5 5 Q25 21 10 23 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={leaf} fill={color} opacity={0.4} />
      <Path d={leaf} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M4 25.5 L19 9.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 19 L10.4 13.6 M14 14.8 L14.2 10.2 M10 19 L15.6 19.4 M14 14.8 L19 15" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

/** Yûnus — la baleine. */
function YunusIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M9.5 6.5 Q9.5 4 7.3 3.4 M9.5 6.5 Q9.5 4 11.7 3.4" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path
        d="M2.5 15 Q2.5 8.5 10.5 8.5 Q16.5 8.5 19 13 Q20.6 15.6 22.4 13 L20.6 8 Q23.4 10 25.8 7.4 Q27 14 23.6 18 Q20 22 11.5 21.5 Q2.5 21 2.5 15 Z"
        fill={color}
      />
      <Path d="M3 25.4 Q6 24 9 25.4 Q12 26.8 15 25.4 Q18 24 21 25.4" stroke={color} strokeWidth={1.3} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/** Zakariyyâ — le mihrab où il invoquait son Seigneur. */
function ZakariyaIcon({ size = 28, color = '#fff' }: IconProps) {
  const arch = 'M6 24.5 V12 Q6 6 14 2.5 Q22 6 22 12 V24.5 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={arch} fill={color} opacity={0.35} />
      <Path d={arch} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      <Path d="M10 24.5 V14 Q10 10.5 14 8 Q18 10.5 18 14 V24.5 Z" fill={color} />
      <Rect x={3.5} y={23.8} width={21} height={2} rx={1} fill={color} />
    </Svg>
  );
}

/** Yahyâ — la bougie, lumière de pureté et de sagesse. */
function YahyaIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 2.5 Q17.4 6.8 14 10.4 Q10.6 6.8 14 2.5 Z" fill={color} />
      <Path d="M14 10.4 V12.2" stroke={color} strokeWidth={1} />
      <Path d="M8.2 5.2 Q7 7.4 8.2 9.6 M19.8 5.2 Q21 7.4 19.8 9.6" stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
      <Rect x={10.5} y={12.2} width={7} height={11} rx={1.2} fill={color} />
      <Rect x={7} y={23} width={14} height={2.4} rx={1.2} fill={color} opacity={0.75} />
    </Svg>
  );
}

/** ʿÎsâ — le palmier sous lequel Maryam lui donna naissance. */
function IsaIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M13 25.5 Q12 18 14.5 11" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path
        d="M14.5 11 Q9 6 3.5 9 M14.5 11 Q8 9.8 5 15.2 M14.5 11 Q20 6 25 9.5 M14.5 11 Q21 10.2 23.5 15.6 M14.5 11 Q14 5.5 10 3 M14.5 11 Q16 5.5 20 3.5"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
      <Circle cx={12.6} cy={13.6} r={1.25} fill={color} />
      <Circle cx={16} cy={13.8} r={1.25} fill={color} />
      <Path d="M6.5 26 H21.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

/** Muhammad ﷺ — le dôme de sa mosquée à Médine, surmonté du croissant.
 *  Croissant = disque r=2 centré (14,3.4) évidé par un r=1.7 centré (15,3.4) ;
 *  les deux points du tracé sont leurs intersections réelles (voir
 *  CrescentStarIcon pour la contrainte sur les rayons d'arc). */
function MuhammadIcon({ size = 28, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M15.06 1.7 A2 2 0 1 0 15.06 5.1 A1.7 1.7 0 0 1 15.06 1.7 Z" fill={color} />
      <Path d="M14 5.4 V8" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <Path d="M7 18 Q7 10 14 7.6 Q21 10 21 18 Z" fill={color} />
      <Rect x={6} y={18.6} width={16} height={2.6} rx={0.8} fill={color} opacity={0.7} />
      <Rect x={4} y={21.8} width={20} height={3.6} rx={1} fill={color} />
    </Svg>
  );
}

const ICONS: Record<string, ProphetIcon> = {
  adam: AdamIcon,
  idris: IdrisIcon,
  nuh: NuhIcon,
  hud: HudIcon,
  salih: SalihIcon,
  ibrahim: IbrahimIcon,
  lut: LutIcon,
  ismail: IsmailIcon,
  ishaq: IshaqIcon,
  yaqub: YaqubIcon,
  yusuf: YusufIcon,
  ayyub: AyyubIcon,
  shuayb: ShuaybIcon,
  musa: MusaIcon,
  harun: HarunIcon,
  dhulkifl: DhulKiflIcon,
  dawud: DawudIcon,
  sulayman: SulaymanIcon,
  ilyas: IlyasIcon,
  alyasa: AlyasaIcon,
  yunus: YunusIcon,
  zakariya: ZakariyaIcon,
  yahya: YahyaIcon,
  isa: IsaIcon,
  muhammad: MuhammadIcon,
};

/** Icône d'un prophète par son `id` (_prophetes-data.ts) ; lanterne par défaut. */
export function prophetIcon(id: string): ProphetIcon {
  return ICONS[id] ?? ProphetsIcon;
}
