import Svg, { Rect, Path, Circle, Ellipse, Polygon } from 'react-native-svg';

/** Kaaba — nœud complété (vert) ou verrouillé (gris). */
export function KaabaIcon({ size = 46, locked = false }: { size?: number; locked?: boolean }) {
  const body1   = locked ? '#6B7280' : '#0d0d0d';
  const body2   = locked ? '#8A9099' : '#1c1c1c';
  const roof    = locked ? '#555C66' : '#161616';
  const gold1   = locked ? '#9AA0AA' : '#B8963E';
  const gold2   = locked ? '#7A8290' : '#9A7A2E';
  const goldHi  = locked ? '#B0B8C4' : '#FFE680';
  const calli   = locked ? '#C0C8D4' : '#FFE17A';
  const calli2  = locked ? '#A8B0BC' : '#FFC840';
  const door    = locked ? '#8A9099' : '#C9A84C';
  const doorSh  = locked ? '#6B7280' : '#9A7A30';
  const panel1  = locked ? '#555C66' : '#7A5706';
  const panel2  = locked ? '#4A5060' : '#6B4C04';
  const joint   = locked ? '#3A4048' : '#4a3003';
  const rivet   = locked ? '#9AA0AA' : '#C9A84C';
  const thresh  = locked ? '#7A8290' : '#A8893A';
  const hajar   = locked ? '#888' : '#909090';
  const stone   = locked ? '#3A4048' : '#110800';
  const edge1   = locked ? '#9AA0AA' : '#C9A84C';
  const ghilaf  = locked ? '#C0C8D4' : '#e8e0c8';
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">

      {/* ── ombre portée sous la Kaaba ── */}
      <Ellipse cx={26} cy={48} rx={18} ry={3} fill="#000" opacity={0.18} />

      {/* ══ TOIT ══ */}
      <Path d="M4 18 L16 12 L48 12 L36 18 Z" fill={roof} />
      <Path d="M4 18 L16 12 L48 12" stroke={gold1} strokeWidth={0.7} fill="none" />
      <Path d="M16 12 L48 12 L36 18" stroke={gold1} strokeWidth={0.5} fill="none" opacity={0.5} />
      <Path d="M6 17.5 L17 12.8 L46 12.8 L35 17.5 Z" fill={ghilaf} opacity={0.22} />

      {/* ══ FACE AVANT ══ */}
      <Path d="M4 18 L36 18 L36 46 L4 46 Z" fill={body1} />

      {/* ══ FACE DROITE ══ */}
      <Path d="M36 18 L48 12 L48 40 L36 46 Z" fill={body2} />

      {/* ══ HIZAM ══ */}
      <Path d="M4 25 L36 25 L36 30 L4 30 Z" fill={gold1} />
      <Path d="M36 21.5 L48 16 L48 21 L36 26.5 Z" fill={gold2} />
      <Path d="M4 25 L36 25 L36 26 L4 26 Z" fill={goldHi} opacity={0.45} />
      <Rect x={6}  y={26.2} width={5}  height={2.2} rx={0.5} fill={calli}  opacity={0.75} />
      <Rect x={13} y={26.2} width={7}  height={2.2} rx={0.5} fill={calli}  opacity={0.75} />
      <Rect x={22} y={26.2} width={4}  height={2.2} rx={0.5} fill={calli}  opacity={0.75} />
      <Rect x={28} y={26.2} width={6}  height={2.2} rx={0.5} fill={calli}  opacity={0.75} />
      <Rect x={8}  y={27.8} width={3}  height={1.3} rx={0.4} fill={calli2} opacity={0.5} />
      <Rect x={16} y={27.8} width={5}  height={1.3} rx={0.4} fill={calli2} opacity={0.5} />
      <Rect x={25} y={27.8} width={3}  height={1.3} rx={0.4} fill={calli2} opacity={0.5} />

      {/* ══ PORTE ══ */}
      <Rect x={13} y={31} width={15} height={15} rx={1} fill={door} />
      <Path d="M13 36 Q20.5 27.5 28 36 Z" fill={door} />
      <Path d="M14.5 36 Q20.5 29 26.5 36 Z" fill={doorSh} />
      <Rect x={14.5} y={36} width={5.5} height={9.5} rx={0.6} fill={panel1} />
      <Rect x={20.5} y={36} width={5.5} height={9.5} rx={0.6} fill={panel2} />
      <Rect x={19.8} y={36} width={1}   height={9.5} fill={joint} />
      <Circle cx={16.5} cy={38}  r={0.75} fill={rivet} />
      <Circle cx={18.5} cy={38}  r={0.75} fill={rivet} />
      <Circle cx={16.5} cy={41}  r={0.75} fill={rivet} />
      <Circle cx={18.5} cy={41}  r={0.75} fill={rivet} />
      <Circle cx={22}   cy={38}  r={0.75} fill={rivet} />
      <Circle cx={24}   cy={38}  r={0.75} fill={rivet} />
      <Circle cx={22}   cy={41}  r={0.75} fill={rivet} />
      <Circle cx={24}   cy={41}  r={0.75} fill={rivet} />
      <Rect x={13} y={45} width={15} height={1.5} rx={0.5} fill={thresh} />

      {/* ══ HAJARUL ASWAD ══ */}
      <Ellipse cx={5.5} cy={35} rx={3}   ry={2.2} fill={hajar} />
      <Ellipse cx={5.5} cy={35} rx={2}   ry={1.5} fill={stone} />
      <Ellipse cx={4.9} cy={34.4} rx={0.6} ry={0.4} fill={hajar} opacity={0.4} />

      {/* ══ ARÊTES VERTICALES DORÉES ══ */}
      {/* coin gauche avant */}
      <Rect x={4}  y={18} width={1}  height={28} rx={0.5} fill="#C9A84C" opacity={0.55} />
      {/* coin droit avant / arête jonction */}
      <Rect x={35.5} y={18} width={1} height={28} rx={0.5} fill="#C9A84C" opacity={0.35} />
      {/* base dorée avant */}
      <Path d="M4 46 L36 46 L48 40 L48 41.5 L36 47.5 L4 47.5 Z" fill="#C9A84C" opacity={0.45} />

    </Svg>
  );
}

/** Mosquée (Masjid al-Haram) — nœud actif (vert) ou verrouillé (gris). */
export function MosqueIcon({ size = 52, locked = false }: { size?: number; locked?: boolean }) {
  const wall   = locked ? '#8A9099' : '#fff';
  const wallD  = locked ? '#6B7280' : '#f0f0f0';
  const nerve  = locked ? '#6B7280' : '#e0e0e0';
  const accent = locked ? '#9AA0AA' : '#FFD97A';
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      {/* corps principal */}
      <Rect x={6} y={30} width={40} height={16} rx={1.5} fill={wall} opacity={0.95} />

      {/* grande coupole centrale */}
      <Path d="M16 30 Q16 14 26 14 Q36 14 36 30 Z" fill={wall} opacity={0.95} />
      <Path d="M26 14 Q26 22 26 30" stroke={nerve} strokeWidth={0.8} opacity={0.6} />
      <Path d="M21 15.5 Q21 23 21 30" stroke={nerve} strokeWidth={0.6} opacity={0.4} />
      <Path d="M31 15.5 Q31 23 31 30" stroke={nerve} strokeWidth={0.6} opacity={0.4} />
      <Rect x={18} y={28} width={16} height={4} rx={0.5} fill={wall} opacity={0.9} />

      {/* minaret gauche */}
      <Rect x={7} y={16} width={5} height={20} rx={1} fill={wall} opacity={0.92} />
      <Rect x={5.5} y={23} width={8} height={1.8} rx={0.9} fill={accent} />
      <Path d="M7 16 Q9.5 11 12 16 Z" fill={wall} opacity={0.9} />
      <Path d="M8.8 10.5 A2 2 0 1 0 8.8 13.5 A1.2 1.2 0 1 1 8.8 10.5 Z" fill={accent} />
      <Circle cx={11.2} cy={11.5} r={0.8} fill={accent} />

      {/* minaret droit */}
      <Rect x={40} y={16} width={5} height={20} rx={1} fill={wall} opacity={0.92} />
      <Rect x={38.5} y={23} width={8} height={1.8} rx={0.9} fill={accent} />
      <Path d="M40 16 Q42.5 11 45 16 Z" fill={wall} opacity={0.9} />
      <Path d="M41.8 10.5 A2 2 0 1 0 41.8 13.5 A1.2 1.2 0 1 1 41.8 10.5 Z" fill={accent} />
      <Circle cx={44.2} cy={11.5} r={0.8} fill={accent} />

      {/* petites coupoles latérales */}
      <Path d="M6 30 Q6 24 11 24 Q16 24 16 30 Z" fill={wall} opacity={0.8} />
      <Path d="M36 30 Q36 24 41 24 Q46 24 46 30 Z" fill={wall} opacity={0.8} />

      {/* arches façade */}
      <Path d="M10 46 L10 38 Q14 33 18 38 L18 46" fill={wallD} opacity={0.7} />
      <Path d="M22 46 L22 38 Q26 33 30 38 L30 46" fill={wallD} opacity={0.7} />
      <Path d="M34 46 L34 38 Q38 33 42 38 L42 46" fill={wallD} opacity={0.7} />

      {/* croissant + étoile sommet */}
      <Path d="M23.5 12.5 A3 3 0 1 0 23.5 17 A1.8 1.8 0 1 1 23.5 12.5 Z" fill={accent} />
      <Circle cx={27.5} cy={13.8} r={1.1} fill={accent} />
    </Svg>
  );
}

/** Coran ouvert — badge Al-Fatiha / Sourates. */
export function QuranIcon({ size = 28, color = '#F6B100' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* page gauche */}
      <Path d="M3 6 Q3 4 5 4 L13 4 L13 24 L5 24 Q3 24 3 22 Z" fill={color} opacity={0.9} />
      {/* page droite */}
      <Path d="M25 6 Q25 4 23 4 L15 4 L15 24 L23 24 Q25 24 25 22 Z" fill={color} opacity={0.75} />
      {/* reliure */}
      <Rect x={12.5} y={3} width={3} height={22} rx={1.5} fill={color} />
      {/* lignes de texte gauche */}
      <Rect x={5.5} y={8}  width={5.5} height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
      <Rect x={5.5} y={11} width={5.5} height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
      <Rect x={5.5} y={14} width={4}   height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
      {/* lignes droite */}
      <Rect x={17} y={8}  width={5.5} height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
      <Rect x={17} y={11} width={5.5} height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
      <Rect x={17} y={14} width={4}   height={1.2} rx={0.6} fill="#fff" opacity={0.6} />
    </Svg>
  );
}

/** Croissant + étoile — badge 7 jours streak, thème Islam.
 *
 *  Le croissant est la différence de deux disques : l'externe r=10 centré
 *  (13.4,14), évidé par un r=9.4 centré (17,14). Les deux points du tracé sont
 *  leurs INTERSECTIONS réelles (16.82, 4.6) et (16.82, 23.4) — un arc SVG exige
 *  un rayon ≥ la demi-distance entre ses extrémités (ici 9.398), sinon le
 *  moteur l'agrandit d'office et les deux arcs se confondent : le croissant
 *  disparaît alors complètement. L'étoile tient entière dans le creux. */
export function CrescentStarIcon({ size = 28, color = '#F0820C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* croissant — épaisseur 15.8 sur 28 */}
      <Path
        d="M16.82 4.6 A10 10 0 1 0 16.82 23.4 A9.4 9.4 0 0 1 16.82 4.6 Z"
        fill={color}
      />
      {/* étoile à 5 branches, centrée (20.6,14), rayon 4.4 */}
      <Polygon
        points="20.60,9.60 21.59,12.64 24.78,12.64 22.20,14.52 23.19,17.56 20.60,15.68 18.01,17.56 19.00,14.52 16.42,12.64 19.61,12.64"
        fill={color}
      />
    </Svg>
  );
}

/** Étoile islamique à 8 branches — badge Ligue Or. */
export function StarIslamIcon({ size = 28, color = '#E0A02C' }: { size?: number; color?: string }) {
  const cx = 14, cy = 14, r1 = 10, r2 = 5.5, n = 8;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const angle = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon points={pts.join(' ')} fill={color} />
      <Circle cx={cx} cy={cy} r={3.5} fill="#fff" opacity={0.5} />
    </Svg>
  );
}

/** Lettre arabe ب stylisée — badge Alphabet. */
export function ArabicLetterIcon({ size = 28, color = '#6B4DFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* corps de la lettre Ba */}
      <Path d="M4 16 Q4 10 14 10 Q24 10 24 16 L22 18 Q14 20 6 18 Z" fill={color} />
      {/* point sous la lettre */}
      <Circle cx={14} cy={22} r={2} fill={color} />
    </Svg>
  );
}

/** Minaret stylisé — badge Tajwid. */
export function TajwidIcon({ size = 28, color = '#8A5CF0' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* tour centrale */}
      <Rect x={11} y={10} width={6} height={14} rx={1} fill={color} />
      {/* dôme */}
      <Path d="M9 10 Q14 3 19 10 Z" fill={color} />
      {/* croissant au sommet */}
      <Path d="M13 4.5 A2.5 2.5 0 1 0 13 8 A1.5 1.5 0 1 1 13 4.5 Z" fill={color} opacity={0.8} />
      {/* base */}
      <Rect x={6} y={23} width={16} height={2.5} rx={1.2} fill={color} />
      {/* balcons */}
      <Rect x={8}  y={17} width={4} height={1.5} rx={0.7} fill={color} opacity={0.7} />
      <Rect x={16} y={17} width={4} height={1.5} rx={0.7} fill={color} opacity={0.7} />
    </Svg>
  );
}

/** Kaaba grande — badge Al-Fatiha (réutilisée avec couleur). */
export function KaabaColorIcon({ size = 28, color = '#2A9E1C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* corps */}
      <Rect x={5} y={10} width={18} height={15} rx={1.5} fill={color} />
      {/* bandeau doré */}
      <Rect x={5} y={10} width={18} height={4} rx={1} fill="#FFD97A" opacity={0.9} />
      <Rect x={5} y={14} width={18} height={2} fill="#B8963E" opacity={0.6} />
      {/* toit / drapé */}
      <Path d="M3 10 L14 4 L25 10" stroke={color} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
      {/* porte */}
      <Rect x={11} y={17} width={6} height={8} rx={1.2} fill="#FFD97A" opacity={0.8} />
    </Svg>
  );
}

/** Lanterne / flambeau de guidance — thème Prophètes. */
export function ProphetsIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* anneau de suspension */}
      <Path d="M12.5 4 Q14 1.5 15.5 4" stroke={color} strokeWidth={1.2} fill="none" strokeLinecap="round" />
      {/* chapeau */}
      <Path d="M8 8 L14 4.5 L20 8 Z" fill={color} />
      <Rect x={7.5} y={7.6} width={13} height={1.6} rx={0.8} fill={color} />
      {/* corps en verre */}
      <Path d="M9 9.5 L19 9.5 L20 19 Q14 22 8 19 Z" fill={color} opacity={0.35} />
      <Path d="M9 9.5 L19 9.5 L20 19 Q14 22 8 19 Z" stroke={color} strokeWidth={1.1} fill="none" strokeLinejoin="round" />
      {/* flamme intérieure */}
      <Path d="M14 12 Q16.5 14.5 14 18 Q11.5 14.5 14 12 Z" fill={color} />
      {/* base */}
      <Rect x={9.5} y={20.5} width={9} height={2} rx={1} fill={color} />
      <Rect x={11} y={22.8} width={6} height={1.6} rx={0.8} fill={color} opacity={0.7} />
    </Svg>
  );
}

/** Goutte d'eau sur une aiguière — thème Ablutions. */
export function AblutionsIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* grande goutte */}
      <Path d="M14 3 Q20.5 11 20.5 15.5 A6.5 6.5 0 1 1 7.5 15.5 Q7.5 11 14 3 Z" fill={color} />
      {/* reflet */}
      <Path d="M11 15.5 A3 3 0 0 1 13 12.8" stroke="#fff" strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.55} />
      {/* ondes sous la goutte */}
      <Path d="M6 24 Q9 22.6 12 24 Q15 25.4 18 24" stroke={color} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M10 26.2 Q13 24.9 16 26.2" stroke={color} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.45} />
    </Svg>
  );
}

/** Parchemin déroulé — thème Hadiths. */
export function HadithIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* rouleau supérieur */}
      <Rect x={4} y={4} width={20} height={3.2} rx={1.6} fill={color} />
      {/* corps du parchemin */}
      <Rect x={6} y={7} width={16} height={14} rx={1} fill={color} opacity={0.35} />
      <Rect x={6} y={7} width={16} height={14} rx={1} stroke={color} strokeWidth={1.1} fill="none" />
      {/* lignes de texte */}
      <Rect x={9} y={10.5} width={10} height={1.2} rx={0.6} fill={color} opacity={0.85} />
      <Rect x={9} y={13.4} width={10} height={1.2} rx={0.6} fill={color} opacity={0.85} />
      <Rect x={9} y={16.3} width={6.5} height={1.2} rx={0.6} fill={color} opacity={0.85} />
      {/* rouleau inférieur */}
      <Rect x={4} y={20.8} width={20} height={3.2} rx={1.6} fill={color} />
    </Svg>
  );
}

/** Tapis de prière et son mihrab — pilier As-Salât. */
export function PrayerMatIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* tapis */}
      <Rect x={7} y={3} width={14} height={22} rx={1.5} fill={color} opacity={0.3} />
      <Rect x={7} y={3} width={14} height={22} rx={1.5} stroke={color} strokeWidth={1.3} />
      {/* mihrab */}
      <Path d="M10.5 20 V11.5 Q10.5 8.2 14 6.4 Q17.5 8.2 17.5 11.5 V20 Z" fill={color} />
      {/* franges */}
      <Path
        d="M9 1 V3 M12.3 1 V3 M15.7 1 V3 M19 1 V3 M9 25 V27 M12.3 25 V27 M15.7 25 V27 M19 25 V27"
        stroke={color} strokeWidth={1.1} strokeLinecap="round"
      />
    </Svg>
  );
}

/** Bourse et pièce — pilier Az-Zakât. */
export function ZakatIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  const bag = 'M9.5 9.5 L7.5 5.5 Q14 3 20.5 5.5 L18.5 9.5 Q25 14 25 19.5 Q25 25.5 14 25.5 Q3 25.5 3 19.5 Q3 14 9.5 9.5 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={bag} fill={color} opacity={0.3} />
      <Path d={bag} stroke={color} strokeWidth={1.3} strokeLinejoin="round" />
      {/* lien */}
      <Rect x={8.5} y={8.6} width={11} height={2} rx={1} fill={color} />
      {/* pièce */}
      <Circle cx={14} cy={18} r={3.6} fill={color} />
    </Svg>
  );
}

/** Minaret élancé (style mecquois) — nœud verrouillé. */
export function MinaretIcon({ size = 32 }: { size?: number }) {
  const c = '#9AA0AA';
  const cd = '#7A8290';
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* base large */}
      <Rect x={10} y={26} width={12} height={4} rx={1} fill={cd} />
      {/* corps bas */}
      <Rect x={12} y={19} width={8} height={9} rx={0.8} fill={c} />
      {/* premier balcon */}
      <Rect x={9.5} y={18} width={13} height={2} rx={1} fill={cd} />
      {/* corps milieu — plus étroit */}
      <Rect x={13} y={12} width={6} height={8} rx={0.7} fill={c} />
      {/* second balcon */}
      <Rect x={10.5} y={11} width={11} height={1.8} rx={0.9} fill={cd} />
      {/* corps haut — encore plus étroit */}
      <Rect x={14} y={6} width={4} height={7} rx={0.6} fill={c} />
      {/* flèche pointue */}
      <Path d="M14 6 Q16 2 18 6 Z" fill={cd} />
      {/* croissant + étoile au sommet */}
      <Path d="M14.8 1.8 A1.6 1.6 0 1 0 14.8 4.8 A1 1 0 1 1 14.8 1.8 Z" fill={cd} />
      <Circle cx={17.2} cy={2.8} r={0.65} fill={cd} />
      {/* fenêtres décoratives */}
      <Rect x={14.5} y={21} width={3} height={4} rx={0.8} fill={cd} opacity={0.5} />
      <Path d="M14.5 21 Q16 19.5 17.5 21" fill={cd} opacity={0.5} />
    </Svg>
  );
}

/** Flamme — série de jours consécutifs.
 *
 *  Deux flammes imbriquées : la grande en `color`, la petite au cœur en
 *  clair, ce qui donne la profondeur qu'un aplat unique n'a pas. Les deux
 *  partent de la même base pour que le dégradé visuel reste lisible même à
 *  20 px, taille à laquelle l'emoji 🔥 devient illisible. */
export function FlameIcon({ size = 28, color = '#F0820C', inner = '#FFD95E' }: { size?: number; color?: string; inner?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* flamme externe */}
      <Path
        d="M14 2 Q15 7 11.5 10.5 Q7.5 14.5 7.5 18 A6.5 6.5 0 0 0 20.5 18 Q20.5 13.5 17 10 Q16.5 12 15 13 Q16.5 8.5 14 2 Z"
        fill={color}
      />
      {/* cœur de flamme */}
      <Path
        d="M14 13 Q15 16 13.3 17.8 Q11.5 19.6 11.5 21 A3 3 0 0 0 17 22.4 Q17.2 18.5 14 13 Z"
        fill={inner}
      />
    </Svg>
  );
}

/** Coupe de trophée — podiums et classements. */
export function TrophyIcon({ size = 28, color = '#E0A02C' }: { size?: number; color?: string }) {
  const cd = color;
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* anses */}
      <Path d="M8 7 Q4 7 4 10.5 Q4 14 8 14.5" stroke={cd} strokeWidth={2} fill="none" opacity={0.75} />
      <Path d="M20 7 Q24 7 24 10.5 Q24 14 20 14.5" stroke={cd} strokeWidth={2} fill="none" opacity={0.75} />
      {/* coupe */}
      <Path d="M8 4 L20 4 L20 12 A6 6 0 0 1 8 12 Z" fill={cd} />
      {/* tige */}
      <Rect x={12.6} y={18} width={2.8} height={4} rx={0.6} fill={cd} opacity={0.85} />
      {/* socle */}
      <Rect x={8.5} y={22} width={11} height={2.6} rx={1.3} fill={cd} />
      {/* étoile gravée */}
      <Polygon points="14,7 15.1,9.6 17.9,9.8 15.7,11.6 16.4,14.3 14,12.8 11.6,14.3 12.3,11.6 10.1,9.8 12.9,9.6" fill="#fff" opacity={0.55} />
    </Svg>
  );
}

/** Pièce de puzzle — widgets d'écran d'accueil. */
export function PuzzleIcon({ size = 28, color = '#F0820C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* corps avec un téton à droite et une encoche en bas */}
      <Path
        d="M4 5.5 Q4 4 5.5 4 L11 4 Q11 1.6 13 1.6 Q15 1.6 15 4 L20.5 4 Q22 4 22 5.5 L22 11 Q24.4 11 24.4 13 Q24.4 15 22 15 L22 20.5 Q22 22 20.5 22 L15 22 Q15 24.4 13 24.4 Q11 24.4 11 22 L5.5 22 Q4 22 4 20.5 Z"
        fill={color}
      />
      {/* reflet haut, pour le relief */}
      <Path d="M4 5.5 Q4 4 5.5 4 L11 4 Q11 1.6 13 1.6 Q15 1.6 15 4 L20.5 4 Q22 4 22 5.5 L22 9 L4 9 Z" fill="#fff" opacity={0.22} />
    </Svg>
  );
}

/** Gemme — monnaie de l'app. Facettes marquées pour rester lisible en petit. */
export function GemIcon({ size = 28, color = '#1CB0F6' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* corps */}
      <Path d="M7 5 L21 5 L25.5 11 L14 24.5 L2.5 11 Z" fill={color} />
      {/* facette gauche, plus claire */}
      <Path d="M7 5 L14 5 L14 24.5 L2.5 11 Z" fill="#fff" opacity={0.18} />
      {/* table du haut */}
      <Path d="M7 5 L21 5 L25.5 11 L2.5 11 Z" fill="#fff" opacity={0.26} />
      {/* arêtes */}
      <Path d="M2.5 11 L25.5 11" stroke="#fff" strokeWidth={0.9} opacity={0.4} />
      <Path d="M11 5 L9 11 L14 24.5" stroke="#fff" strokeWidth={0.9} opacity={0.3} fill="none" />
      <Path d="M17 5 L19 11 L14 24.5" stroke="#fff" strokeWidth={0.9} opacity={0.3} fill="none" />
    </Svg>
  );
}

/** Cœur plein — vies restantes dans une leçon.
 *
 *  Le tracé est en un seul morceau (deux arcs qui se rejoignent en pointe),
 *  ce qui donne une silhouette nette dès 14 px là où un cœur en courbes de
 *  Bézier s'épaissit et perd sa pointe. Le reflet n'est pas décoratif : sans
 *  lui, l'aplat rouge se lit comme une tache une fois posé sur un fond
 *  coloré, le cas du héros de la page « Mes cœurs ». */
export function HeartIcon({
  size = 28, color = '#FF4B4B', glare = true, outline = false, strokeWidth = 1.6,
}: { size?: number; color?: string; glare?: boolean; outline?: boolean; strokeWidth?: number }) {
  const D = 'M14 25.2 L4.1 15.1 A6.3 6.3 0 0 1 14 7.3 A6.3 6.3 0 0 1 23.9 15.1 Z';
  // En mode contour, le cœur n'est qu'un trait : c'est lui qui rend lisible
  // une jauge de remplissage, dont la coupe franche se lirait sinon comme un
  // bug plutôt que comme un niveau.
  if (outline) {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <Path d={D} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d={D} fill={color} />
      {/* reflet en haut à gauche — donne le galbe */}
      {glare && (
        <Path d="M8.4 8.6 A5.4 5.4 0 0 1 13.2 7.4 A7.4 7.4 0 0 0 7.2 12.4 A4.6 4.6 0 0 1 8.4 8.6 Z" fill="#fff" opacity={0.42} />
      )}
    </Svg>
  );
}

/** Flocon — gel de série (le jour manqué ne casse pas la flamme).
 *
 *  Six branches avec leurs barbes, plutôt qu'un flocon détaillé : à la taille
 *  où on l'affiche (16-20 px dans une pastille), les cristaux fins se
 *  referment en une bouillie grise. Les barbes suffisent à dire « givre ». */
export function FreezeIcon({ size = 28, color = '#1CB0F6' }: { size?: number; color?: string }) {
  const branches = [0, 60, 120];
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {branches.map((a) => (
        <Path
          key={a}
          d="M14 3.2 L14 24.8"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          transform={`rotate(${a} 14 14)`}
        />
      ))}
      {/* barbes : deux par demi-branche, en haut et en bas */}
      {branches.map((a) => (
        <Path
          key={`b${a}`}
          d="M14 6.4 L10.9 4.2 M14 6.4 L17.1 4.2 M14 21.6 L10.9 23.8 M14 21.6 L17.1 23.8"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          transform={`rotate(${a} 14 14)`}
        />
      ))}
      {/* noyau — masque le croisement des trois traits, qui épaississait le centre */}
      <Circle cx={14} cy={14} r={2.6} fill={color} />
    </Svg>
  );
}
