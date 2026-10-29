/**
 * Avatar composable de l'utilisateur (visage, coiffe, yeux, bouche, détails,
 * tenue, fond).
 *
 * Tout est dessiné en SVG dans un repère 100 × 100 puis mis à l'échelle :
 * un même avatar s'affiche net en 76 px (grille d'options) comme en 190 px
 * (aperçu). Les ovales sont de vraies ellipses — une View à borderRadius
 * donnerait une pilule.
 */
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import Otter from './Otter';
import { useUserStore } from '../store/userStore';

export type AvatarConfig = {
  face: 'rond' | 'ovale';
  skin: string;
  hair: 'aucune' | 'courts' | 'boucles' | 'longs' | 'kufi' | 'hijab' | 'bonnet';
  hairColor: string;
  eyes: 'points' | 'joyeux' | 'grands' | 'clin';
  mouth: 'sourire' | 'rire' | 'calme' | 'surpris';
  acc: 'aucun' | 'joues' | 'lunettes' | 'barbe';
  outfit: 'tshirt' | 'col' | 'qamis';
  outfitColor: string;
  bg: string;
};

export const SKIN_COLORS = ['#f6d7bf', '#e9b98f', '#c98b5e', '#a86a3f', '#7b4a2a', '#55331d'];
export const HAIR_COLORS = ['#2a1d17', '#5a3a22', '#a0662f', '#e2b04a', '#f4f3fa', '#7357ff', '#2fb524', '#e0457b'];
export const OUTFIT_COLORS = ['#7357ff', '#3fcb2f', '#f08a1c', '#17a8bd', '#e0457b', '#16142b', '#f4f3fa'];
export const BG_COLORS = ['#c9bfff', '#bdf0b5', '#ffd9a8', '#b8e6f2', '#ffc6d6', '#ece9f6', '#ffe58a', '#2b2850'];

export type AvatarTab = {
  key: 'face' | 'hair' | 'eyes' | 'mouth' | 'acc' | 'outfit' | 'bg';
  options: string[];
  /** Champ de couleur réglé par l'onglet, s'il y en a un. */
  colorKey?: 'skin' | 'hairColor' | 'outfitColor';
  colors?: string[];
};

export const AVATAR_TABS: AvatarTab[] = [
  { key: 'face', options: ['rond', 'ovale'], colorKey: 'skin', colors: SKIN_COLORS },
  { key: 'hair', options: ['aucune', 'courts', 'boucles', 'longs', 'kufi', 'hijab', 'bonnet'], colorKey: 'hairColor', colors: HAIR_COLORS },
  { key: 'eyes', options: ['points', 'joyeux', 'grands', 'clin'] },
  { key: 'mouth', options: ['sourire', 'rire', 'calme', 'surpris'] },
  { key: 'acc', options: ['aucun', 'joues', 'lunettes', 'barbe'] },
  { key: 'outfit', options: ['tshirt', 'col', 'qamis'], colorKey: 'outfitColor', colors: OUTFIT_COLORS },
  { key: 'bg', options: BG_COLORS },
];

export const DEFAULT_AVATAR: AvatarConfig = {
  face: 'rond', skin: '#c98b5e', hair: 'kufi', hairColor: '#f4f3fa', eyes: 'joyeux',
  mouth: 'sourire', acc: 'joues', outfit: 'qamis', outfitColor: '#17a8bd', bg: '#b8e6f2',
};

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]!;

export function randomAvatar(): AvatarConfig {
  const opts = (k: AvatarTab['key']) => AVATAR_TABS.find((t) => t.key === k)!.options;
  return {
    face: pick(opts('face')) as AvatarConfig['face'],
    skin: pick(SKIN_COLORS),
    hair: pick(opts('hair')) as AvatarConfig['hair'],
    hairColor: pick(HAIR_COLORS),
    eyes: pick(opts('eyes')) as AvatarConfig['eyes'],
    mouth: pick(opts('mouth')) as AvatarConfig['mouth'],
    acc: pick(opts('acc')) as AvatarConfig['acc'],
    outfit: pick(opts('outfit')) as AvatarConfig['outfit'],
    outfitColor: pick(OUTFIT_COLORS),
    bg: pick(BG_COLORS),
  };
}

/** Assombrit une couleur hex (f < 1), comme le `brightness()` CSS. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(Math.min(255, v * f)).toString(16).padStart(2, '0');
  return `#${c(n >> 16)}${c((n >> 8) & 0xff)}${c(n & 0xff)}`;
}

/**
 * Rectangle à coins arrondis indépendants (haut-gauche, haut-droit, bas-droit,
 * bas-gauche). Les rayons trop grands sont réduits ensemble, comme en CSS.
 */
function rr(x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number): string {
  const f = Math.min(1, w / (tl + tr || 1), w / (bl + br || 1), h / (tl + bl || 1), h / (tr + br || 1));
  [tl, tr, br, bl] = [tl * f, tr * f, br * f, bl * f];
  return `M${x + tl} ${y}H${x + w - tr}A${tr} ${tr} 0 0 1 ${x + w} ${y + tr}V${y + h - br}`
    + `A${br} ${br} 0 0 1 ${x + w - br} ${y + h}H${x + bl}A${bl} ${bl} 0 0 1 ${x} ${y + h - bl}`
    + `V${y + tl}A${tl} ${tl} 0 0 1 ${x + tl} ${y}Z`;
}

const DARK = '#2a1d17';
const MOUTH = '#7a2e2e';

/** Le dessin lui-même, dans le repère 100 × 100. */
function Parts({ c }: { c: AvatarConfig }) {
  const hc = c.hairColor;
  const sk = c.skin;
  const ov = c.face === 'ovale';
  const ht = ov ? 48 : 44;
  const tp = ov ? 20 : 22;
  const my = c.acc === 'barbe' ? 54 : 52;

  const eye = (x: number, kind: 'points' | 'joyeux' | 'grands', key: string) => {
    if (kind === 'joyeux') {
      return <Path key={key} d={`M${x - 0.5} 44.5A3.5 3 0 0 1 ${x + 5.5} 44.5`} stroke={DARK} strokeWidth={2} strokeLinecap="round" fill="none" />;
    }
    if (kind === 'grands') {
      return (
        <G key={key}>
          <Ellipse cx={x + 2.5} cy={42.75} rx={3.5} ry={4.25} fill={DARK} />
          <Circle cx={x + 1.8} cy={40.8} r={1.3} fill="#fff" />
        </G>
      );
    }
    return <Ellipse key={key} cx={x + 2.5} cy={43.25} rx={2.5} ry={2.75} fill={DARK} />;
  };

  return (
    <G>
      {c.hair === 'longs' && <Path d={rr(25, 19, 50, 58, 25, 25, 8, 8)} fill={hc} />}
      {c.hair === 'hijab' && <Ellipse cx={50} cy={45} rx={29.5} ry={33} fill={hc} />}

      {/* Tenue */}
      <Path d={rr(15, 72, 70, 40, 35, 35, 0, 0)} fill={c.outfitColor} />
      {c.outfit === 'col' && <Path d="M41 71H59L50 81Z" fill="#ffffff" fillOpacity={0.8} />}
      {c.outfit === 'qamis' && (
        <G>
          <Rect x={49} y={78} width={2} height={22} fill="#ffffff" fillOpacity={0.33} />
          <Circle cx={53.7} cy={83.2} r={1.2} fill="#ffffff" fillOpacity={0.67} />
          <Circle cx={53.7} cy={90.2} r={1.2} fill="#ffffff" fillOpacity={0.67} />
        </G>
      )}

      {/* Cou */}
      <Path d={rr(43, 60, 14, 15, 5, 5, 5, 5)} fill={shade(sk, 0.9)} />
      {c.hair === 'hijab' && <Path d={rr(17, 63, 66, 24, 33, 33, 12, 12)} fill={hc} />}

      {/* Oreilles et visage */}
      {c.hair !== 'hijab' && (
        <G>
          <Ellipse cx={29.75} cy={44.5} rx={3.25} ry={4.5} fill={sk} />
          <Ellipse cx={70.25} cy={44.5} rx={3.25} ry={4.5} fill={sk} />
        </G>
      )}
      <Ellipse cx={50} cy={tp + ht / 2} rx={20} ry={ht / 2} fill={sk} />
      {c.acc === 'barbe' && (
        <Path d={rr(31, 49, 38, tp + ht - 49, 4, 4, 19, 19)} fill={hc === '#f4f3fa' ? '#d9d6e6' : hc} />
      )}

      {/* Yeux */}
      {c.eyes === 'clin'
        ? [eye(38.5, 'points', 'l'), eye(56.5, 'joyeux', 'r')]
        : [eye(38.5, c.eyes, 'l'), eye(56.5, c.eyes, 'r')]}

      {/* Bouche */}
      {c.mouth === 'sourire' && (
        <Path d={`M44.5 ${my + 0.8}A5.5 4.2 0 0 0 55.5 ${my + 0.8}`} stroke={DARK} strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
      {c.mouth === 'rire' && <Path d={rr(44, my, 12, 7, 1, 1, 6, 6)} fill={MOUTH} />}
      {c.mouth === 'calme' && (
        <Line x1={45.5} y1={my + 3} x2={54.5} y2={my + 3} stroke={DARK} strokeWidth={1.8} strokeLinecap="round" />
      )}
      {c.mouth === 'surpris' && <Ellipse cx={50} cy={my + 3} rx={2.5} ry={3} fill={MOUTH} />}

      {/* Détails */}
      {c.acc === 'joues' && (
        <G opacity={0.6}>
          <Ellipse cx={36.25} cy={50.25} rx={3.75} ry={2.25} fill="#ff8fa3" />
          <Ellipse cx={63.75} cy={50.25} rx={3.75} ry={2.25} fill="#ff8fa3" />
        </G>
      )}
      {c.acc === 'lunettes' && (
        <G>
          <Rect x={34.8} y={38.3} width={11.4} height={9.4} rx={3.2} fill="#ffffff" fillOpacity={0.19} stroke="#16142b" strokeWidth={1.6} />
          <Rect x={53.8} y={38.3} width={11.4} height={9.4} rx={3.2} fill="#ffffff" fillOpacity={0.19} stroke="#16142b" strokeWidth={1.6} />
          <Rect x={47} y={41.5} width={6} height={1.6} fill="#16142b" />
        </G>
      )}

      {/* Coiffes (par-dessus le visage) */}
      {(c.hair === 'courts' || c.hair === 'longs') && <Path d={rr(29, tp - 3, 42, 18, 21, 21, 5, 5)} fill={hc} />}
      {c.hair === 'boucles' && (
        <G>
          {[[28, 24, 10], [31, 17, 12], [38, 14, 12], [45.5, 13, 12], [53, 14, 12], [60, 17, 12], [63, 24, 10]].map(([x, y, s], i) => (
            <Circle key={i} cx={x! + s! / 2} cy={y! + s! / 2} r={s! / 2} fill={hc} />
          ))}
        </G>
      )}
      {c.hair === 'kufi' && (
        <G>
          <Path d={rr(31, tp - 7, 38, 13, 19, 19, 2, 2)} fill={hc} />
          <Rect x={31} y={tp + 3} width={38} height={2.5} fill="#000000" fillOpacity={0.13} />
        </G>
      )}
      {c.hair === 'hijab' && <Path d={rr(29.5, tp - 3, 41, 10, 20, 20, 0, 0)} fill={hc} />}
      {c.hair === 'bonnet' && (
        <G>
          <Path d={rr(30, tp - 8, 40, 17, 20, 20, 3, 3)} fill={hc} />
          <Path d={rr(29, tp + 5, 42, 5, 2, 2, 2, 2)} fill={shade(hc, 0.82)} />
          <Circle cx={50} cy={tp - 8} r={4} fill={shade(hc, 0.82)} />
        </G>
      )}
    </G>
  );
}

export default function Avatar({ config, size }: { config: AvatarConfig; size: number }) {
  // Identifiant de découpe propre à chaque avatar : plusieurs cohabitent à l'écran.
  const clip = `av${useId().replace(/\W/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clip}>
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clip})`}>
        <Rect x={0} y={0} width={100} height={100} fill={config.bg} />
        <Parts c={config} />
      </G>
    </Svg>
  );
}

/**
 * Avatar du compte courant : celui créé par l'utilisateur, sinon la loutre
 * Tarteel sur fond bleu (l'avatar par défaut d'avant).
 */
export function UserAvatar({ size }: { size: number }) {
  const style = useUserStore((s) => s.avatarStyle);
  if (style) return <Avatar config={style} size={size} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#B8E6F2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Otter size={size * 0.78} />
    </View>
  );
}
