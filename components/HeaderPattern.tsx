import { StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

// Rub el hizb — l'étoile islamique classique (۞) : deux carrés superposés
// tournés de 45°. Rendu net et reconnaissable, contrairement à une étoile à
// pointes fines qui devient floue en filigrane.
function rubElHizb(cx: number, cy: number, r: number): string {
  const sq = (rot: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + (Math.PI / 2) * i;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  };
  return `${sq(0)} ${sq(Math.PI / 4)}`;
}

export type PatternVariant = 'stars' | 'waves' | 'arcs' | 'grid';

/**
 * Trame décorative en filigrane pour le fond d'un header à dégradé. Plusieurs
 * variantes pour DIVERSIFIER l'identité de chaque écran (pas le même motif
 * partout) :
 *  - 'stars' : étoiles à 8 branches (spirituel — 99 noms d'Allah)
 *  - 'waves' : ondes sonores concentriques (audio — lecture libre)
 *  - 'arcs'  : arcs/vagues fluides (mélodie — tajwid)
 *  - 'grid'  : losanges/points en trame (tuiles — widgets)
 * À rendre EN PREMIER dans le LinearGradient (occupe tout le fond, le contenu
 * passe au-dessus).
 */
export default function HeaderPattern({
  width, height, variant = 'stars', opacity = 0.14, color = '#fff',
}: {
  width: number; height: number; variant?: PatternVariant; opacity?: number; color?: string;
}) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <G opacity={opacity}>
        {variant === 'stars' && <Stars width={width} height={height} color={color} />}
        {variant === 'waves' && <Waves width={width} height={height} color={color} />}
        {variant === 'arcs' && <Arcs width={width} height={height} color={color} />}
        {variant === 'grid' && <Grid width={width} height={height} color={color} />}
      </G>
    </Svg>
  );
}

// ── Rub el hizb (étoiles islamiques) en quinconce + petits points ───────────
function Stars({ width, height, color }: { width: number; height: number; color: string }) {
  const step = 62;
  const nodes = [];
  for (let y = 0; y < height + step; y += step) {
    for (let x = 0; x < width + step; x += step) {
      const offset = (Math.round(y / step) % 2) * (step / 2);
      nodes.push({ x: x + offset, y });
    }
  }
  return (
    <>
      {nodes.map((s, i) => (
        <G key={i}>
          <Path d={rubElHizb(s.x, s.y, 13)} fill="none" stroke={color} strokeWidth={1.3} />
          <Circle cx={s.x + step / 2} cy={s.y + step / 2} r={1.8} fill={color} />
        </G>
      ))}
    </>
  );
}

// ── Ondes sonores : cercles concentriques émis depuis quelques foyers ───────
function Waves({ width, height, color }: { width: number; height: number; color: string }) {
  const foyers = [
    { cx: width * 0.12, cy: height * 0.3 },
    { cx: width * 0.62, cy: height * 0.18 },
    { cx: width * 0.9, cy: height * 0.62 },
    { cx: width * 0.35, cy: height * 0.8 },
  ];
  const rings = [14, 30, 46, 62];
  return (
    <>
      {foyers.map((f, fi) =>
        rings.map((r, ri) => (
          <Circle
            key={`${fi}-${ri}`}
            cx={f.cx} cy={f.cy} r={r}
            fill="none" stroke={color} strokeWidth={1.2}
            opacity={1 - ri * 0.18}
          />
        )),
      )}
    </>
  );
}

// ── Arcs fluides répétés (impression de mélodie / vagues) ───────────────────
function Arcs({ width, height, color }: { width: number; height: number; color: string }) {
  const rows = [];
  const amp = 16;
  const span = 70;
  for (let y = 18; y < height + amp; y += 40) {
    let d = `M -20 ${y}`;
    for (let x = -20; x < width + span; x += span) {
      d += ` q ${span / 2} ${-amp} ${span} 0`;
    }
    rows.push(d);
  }
  return (
    <>
      {rows.map((d, i) => (
        <Path key={i} d={d} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      ))}
    </>
  );
}

// ── Trame de losanges + points (tuiles / widgets) ───────────────────────────
function Grid({ width, height, color }: { width: number; height: number; color: string }) {
  const step = 46;
  const diamonds = [];
  const dots = [];
  for (let y = -10; y < height + step; y += step) {
    for (let x = -10; x < width + step; x += step) {
      const r = 11;
      diamonds.push(`M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`);
      dots.push({ x: x + step / 2, y: y + step / 2 });
    }
  }
  return (
    <>
      {diamonds.map((d, i) => (
        <Path key={i} d={d} fill="none" stroke={color} strokeWidth={1.1} />
      ))}
      {dots.map((p, i) => (
        <Circle key={`d${i}`} cx={p.x} cy={p.y} r={1.6} fill={color} />
      ))}
    </>
  );
}
