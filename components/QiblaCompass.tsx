/**
 * Boussole Qibla — flèche qui pointe vers La Mecque en tournant avec le
 * téléphone.
 *
 * Deux angles se combinent :
 *  - la direction de la Qibla depuis la position (fixe, calculée par `adhan`) ;
 *  - le cap du téléphone, lu en continu sur le magnétomètre.
 * La flèche affiche la différence, donc elle pointe toujours vers la Kaaba
 * quelle que soit l'orientation de l'appareil.
 *
 * Le cap vient en priorité du SYSTÈME (`Location.watchHeadingAsync`) : il
 * est calibré, compensé quand le téléphone est penché, et corrigé de la
 * déclinaison (nord géographique). Le magnétomètre brut n'est qu'un repli
 * quand la localisation n'est pas autorisée (ville choisie à la main) : il
 * donne le nord MAGNÉTIQUE, sans compensation d'inclinaison — l'affichage
 * reste indicatif, et l'écran le dit.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, type SharedValue,
} from 'react-native-reanimated';
import { qiblaDirection, distanceToKaaba, cardinalFor } from '../constants/prayerTimes';
import { useT } from '../lib/i18n';

/** Écart (en degrés) en deçà duquel on considère le téléphone aligné. */
const ALIGN_TOLERANCE = 4;
const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const CARDINALS = [
  { l: 'N', a: 0 }, { l: 'E', a: 90 }, { l: 'S', a: 180 }, { l: 'W', a: 270 },
];

/** Écart signé le plus court pour aller de `from` à `to`, en degrés, dans [-180, 180[. */
function shortestDelta(from: number, to: number): number {
  return ((to - from) % 360 + 540) % 360 - 180;
}

/**
 * Cap du téléphone, lissé.
 *
 * Les mesures brutes tremblent de plusieurs degrés à chaque échantillon : les
 * afficher telles quelles faisait gigoter l'aiguille en permanence. On les
 * filtre (moyenne exponentielle) sur un angle DÉROULÉ, qui peut dépasser 360°
 * ou passer sous 0 : sans ça, franchir le nord (359° → 1°) faisait faire un
 * tour complet au cadran dans le mauvais sens.
 *
 * - `smooth` : cap déroulé, animé côté UI (rotations du cadran et de l'aiguille) ;
 * - `heading` : même cap ramené à [0, 360[, pour les textes (rafraîchi ~10 fois/s) ;
 * - `lowAccuracy` : le système signale une boussole mal calibrée.
 */
function useHeading(): { heading: number | null; lowAccuracy: boolean; smooth: SharedValue<number> } {
  const [heading, setHeading] = useState<number | null>(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const smooth = useSharedValue(0);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    // Le composant peut être démonté pendant un await : sans ce drapeau, on
    // s'abonnerait APRÈS le cleanup et l'abonnement fuiterait (capteur laissé
    // actif sur un écran quitté).
    let cancelled = false;
    let current: number | null = null; // cap lissé, déroulé
    let lastTextUpdate = 0;

    const push = (raw: number, alpha: number) => {
      if (!Number.isFinite(raw) || raw < 0) return;
      if (current == null) {
        current = raw;
        smooth.value = raw;
      } else {
        const delta = shortestDelta(current, raw);
        // Bruit de fond du capteur : on ne bouge pas pour moins d'un demi-degré.
        if (Math.abs(delta) < 0.5) return;
        current += delta * alpha;
        smooth.value = withTiming(current, { duration: 150, easing: Easing.linear });
      }
      const now = Date.now();
      if (now - lastTextUpdate > 100) {
        lastTextUpdate = now;
        setHeading(((current % 360) + 360) % 360);
      }
    };

    /** Repli : magnétomètre brut (nord magnétique, téléphone à plat). */
    const startMagnetometer = async () => {
      // Le magnétomètre est absent de nombreux appareils d'entrée de gamme (et
      // de la plupart des émulateurs) : on retombe alors sur l'affichage du cap
      // seul. Constaté par exemple sur Galaxy A03 (aucun capteur de champ
      // magnétique). L'aiguille figée n'est donc pas un bug.
      if (!(await Magnetometer.isAvailableAsync()) || cancelled) return;
      // ⚠️ NE JAMAIS mettre 200 ms ici sur Android — l'aiguille se fige.
      // expo-sensors écoute à SENSOR_DELAY_NORMAL (~200 ms) puis filtre avec
      // `currentTime - lastUpdate > updateInterval` : demander 200 ms rejette
      // quasiment toutes les mesures (constaté sur appareil, build 17).
      // 120 ms laisse passer chaque évènement reçu.
      Magnetometer.setUpdateInterval(120);
      subscription = Magnetometer.addListener(({ x, y }) => {
        // Capteur pas encore calibré (fréquent au démarrage sur Android) : il
        // émet des (0,0), qui donneraient un faux « plein nord ».
        if (x === 0 && y === 0) return;
        // Téléphone à plat en portrait : Y vers le haut de l'écran, X vers la
        // droite. Cap compté depuis le nord dans le sens horaire, et signe
        // négatif car le champ mesuré pointe à l'opposé du cap (constaté sur
        // appareil : sans lui, la flèche tournait à l'envers).
        push((-Math.atan2(x, y) * (180 / Math.PI) + 360) % 360, 0.2);
      });
    };

    (async () => {
      try {
        // Le cap système exige la permission de localisation. Si l'utilisateur
        // a choisi sa ville à la main, on ne la redemande pas : repli capteur.
        const perm = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm.granted) {
          const sub = await Location.watchHeadingAsync((h) => {
            // trueHeading vaut -1 tant que le nord géographique n'est pas connu.
            push(h.trueHeading >= 0 ? h.trueHeading : h.magHeading, 0.35);
            setLowAccuracy(h.accuracy <= 1);
          });
          if (cancelled) sub.remove();
          else subscription = sub;
          return;
        }
      } catch (e) {
        console.warn('[qibla] cap système indisponible, repli magnétomètre :', e);
      }
      try {
        await startMagnetometer();
      } catch (e) {
        // Un catch muet rendait le bug indiagnosticable à distance : la cause
        // est tracée, l'affichage statique reste le comportement de repli.
        console.warn('[qibla] magnétomètre indisponible — aiguille figée :', e);
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { heading, lowAccuracy, smooth };
}

interface Props {
  latitude: number;
  longitude: number;
  /** Couleurs du thème courant (clair/sombre). */
  colors: { text: string; textSecondary: string; textTertiary: string; cardBg: string };
  /** Mode sombre : cadran et halo de la Kaaba adaptés. */
  dark?: boolean;
}

export default function QiblaCompass({ latitude, longitude, colors, dark = false }: Props) {
  const tr = useT();
  const { width } = useWindowDimensions();
  const { heading, lowAccuracy, smooth } = useHeading();

  const qibla = qiblaDirection(latitude, longitude);
  const distance = distanceToKaaba(latitude, longitude);
  const cardinal = cardinalFor(qibla);

  // Écart signé entre la Qibla et l'avant du téléphone, ramené à [-180, 180[.
  // Sans magnétomètre, l'aiguille montre le cap absolu (repère fixe).
  const diff = heading == null ? null : shortestDelta(heading, qibla);
  const live = heading != null;
  // Rotations animées sur le cap DÉROULÉ (pas ramené à 0–360) : passer de
  // 359° à 1° tourne de 2°, pas d'un tour complet dans l'autre sens.
  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${live ? -smooth.value : 0}deg` }],
  }), [live]);
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${live ? qibla - smooth.value : qibla}deg` }],
  }), [live, qibla]);
  const aligned = diff != null && Math.abs(diff) <= ALIGN_TOLERANCE;

  const accent = dark ? '#3DCB98' : '#1A8F69';
  const needle = aligned ? '#1FB07E' : heading == null ? '#9AA0AA' : accent;
  const dialBg = dark ? '#101513' : '#F5F7F4';
  const tick = dark ? '#2C3532' : '#C9CFCB';
  const tickMaj = dark ? '#59645F' : '#8A948F';
  const line = dark ? '#222A27' : '#ECEEEA';

  const pill = heading == null
    ? { label: tr('qibla.noCompass'), bg: dark ? '#1D2421' : '#EFF1EE', fg: colors.textSecondary }
    : aligned
      ? { label: tr('qibla.aligned'), bg: '#1FB07E', fg: '#fff' }
      : {
        label: tr(diff! > 0 ? 'qibla.turnRight' : 'qibla.turnLeft'),
        bg: dark ? 'rgba(61,203,152,0.13)' : 'rgba(26,143,105,0.12)',
        fg: accent,
      };

  // Cadran de 270 px sur la maquette ; réduit sur les petits écrans.
  const D = Math.min(270, width - 110);
  const R = D / 2;
  const k = D / 270;
  const dir = tr(`qibla.cardinal.${cardinal}`);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{tr('qibla.title')}</Text>
          <Text style={[styles.distance, { color: colors.textSecondary }]}>
            {tr('qibla.subtitle', {
              km: distance.toLocaleString('fr-FR'),
              deg: Math.round(qibla),
              dir: dir.charAt(0).toUpperCase() + dir.slice(1),
            })}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text>
        </View>
      </View>

      <View style={{ width: D, height: D, marginTop: 22 }}>
        {/* Cadran : tourne avec le téléphone pour garder le nord au nord. */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { borderRadius: R, backgroundColor: dialBg }, dialStyle]}
        >
          {TICKS.map((a) => {
            const maj = a % 30 === 0;
            const w = maj ? 2.5 : 1.5;
            const h = maj ? 12 : 6;
            return (
              <View
                key={a}
                style={{
                  position: 'absolute', left: R - w / 2, top: R - h / 2, width: w, height: h,
                  borderRadius: 1, backgroundColor: maj ? tickMaj : tick,
                  transform: [{ rotate: `${a}deg` }, { translateY: -122 * k }],
                }}
              />
            );
          })}
          {CARDINALS.map((c) => (
            <View
              key={c.l}
              style={{
                position: 'absolute', left: R - 12, top: R - 12, width: 24, height: 24,
                alignItems: 'center', justifyContent: 'center',
                transform: [{ rotate: `${c.a}deg` }, { translateY: -98 * k }, { rotate: `${-c.a}deg` }],
              }}
            >
              <Text style={[styles.cardinal, { color: c.l === 'N' ? '#E0584F' : colors.textSecondary }]}>
                {c.l === 'W' ? tr('qibla.westLetter') : c.l}
              </Text>
            </View>
          ))}
          {/* La Kaaba, posée sur le bord du cadran à l'azimut de la Qibla. */}
          <View
            style={{
              position: 'absolute', left: R - 15, top: R - 15, width: 30, height: 30,
              alignItems: 'center', justifyContent: 'center',
              transform: [{ rotate: `${qibla}deg` }, { translateY: -148 * k }, { rotate: `${-qibla}deg` }],
            }}
          >
            <View
              style={[
                styles.kaaba,
                dark
                  ? { borderWidth: 2, borderColor: '#E8B84A', shadowColor: '#E8B84A', shadowOpacity: 0.6, shadowRadius: 9, elevation: 6 }
                  : { borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, elevation: 3 },
              ]}
            >
              <View style={styles.kaabaBand} />
            </View>
          </View>
        </Animated.View>

        {/* Aiguille vers la Kaaba, relative à l'avant du téléphone. */}
        <Animated.View style={[StyleSheet.absoluteFill, needleStyle]} pointerEvents="none">
          <View style={{ position: 'absolute', left: R - 2, top: R - 112 * k, width: 4, height: 112 * k, borderRadius: 2, backgroundColor: needle }} />
          <View
            style={{
              position: 'absolute', left: R - 13, top: R - 126 * k, width: 0, height: 0,
              borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 24,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: needle,
            }}
          />
        </Animated.View>

        {/* Moyeu : l'écart restant en degrés. */}
        <View style={[styles.hub, { left: R - 29, top: R - 29, backgroundColor: colors.cardBg, borderColor: line }]}>
          <Text style={[styles.hubText, { color: colors.text }]}>
            {Math.abs(Math.round(diff ?? qibla))}°
          </Text>
        </View>

        {/* Repère fixe : l'avant du téléphone. */}
        <View style={[styles.lubber, { left: R - 1.5, backgroundColor: colors.text }]} />
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {heading == null
          ? tr('qibla.noSensor')
          : aligned
            ? tr('qibla.alignedHint')
            : lowAccuracy ? tr('qibla.calibrate') : tr('qibla.hint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, paddingHorizontal: 18, paddingVertical: 22, alignItems: 'center',
    shadowColor: '#14281E', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 4, gap: 10 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  distance: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 1 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  cardinal: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  kaaba: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#1B1D1C', overflow: 'hidden' },
  kaabaBand: { height: 4, marginTop: 6, backgroundColor: '#E8B84A' },
  hub: {
    position: 'absolute', width: 58, height: 58, borderRadius: 29, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  hubText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, lineHeight: 22 },
  lubber: { position: 'absolute', top: -14, width: 3, height: 14, borderRadius: 2 },
  hint: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center',
    marginTop: 20, lineHeight: 19, maxWidth: 290,
  },
});
