/**
 * Boussole Qibla — flèche qui pointe vers La Mecque en tournant avec le
 * téléphone.
 *
 * Deux angles se combinent :
 *  - la direction de la Qibla depuis la position (fixe, calculée par `adhan`) ;
 *  - le cap du téléphone, lu en continu sur la boussole.
 * La flèche affiche la différence, donc elle pointe toujours vers la Kaaba
 * quelle que soit l'orientation de l'appareil.
 *
 * ⚠️ Les corrections ci-dessous (déclinaison, inclinaison, lissage, ressort)
 * ne concernent qu'ANDROID. Sur iOS, le cap système d'expo est déjà correct
 * — CLLocationManager renvoie toujours un `trueHeading` valide, alors que
 * l'implémentation Android peut le renvoyer négatif — et le comportement
 * d'origine est conservé à l'identique. L'app iOS est déjà publiée : on n'y
 * touche pas.
 *
 * Sur Android, le cap vient en priorité du SYSTÈME
 * (`Location.watchHeadingAsync`) : il est calibré, compensé quand le
 * téléphone est penché, et corrigé de la déclinaison (nord géographique).
 * Le repli, quand la localisation n'est pas autorisée (ville choisie à la
 * main), combine MAGNÉTOMÈTRE et ACCÉLÉROMÈTRE : le magnétomètre seul ne
 * donne un cap juste que si le téléphone est à plat — penché, l'aiguille part
 * en vrille. Ce repli donne le nord MAGNÉTIQUE, sans compensation de
 * déclinaison : l'affichage reste indicatif, et l'écran le dit.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, type SharedValue,
} from 'react-native-reanimated';
import { qiblaDirection, distanceToKaaba, cardinalFor } from '../constants/prayerTimes';
import { useT } from '../lib/i18n';

/** Écart (en degrés) en deçà duquel on considère le téléphone aligné. */
const ALIGN_TOLERANCE = 4;
/**
 * Les correctifs de cap ne s'appliquent qu'à Android (voir l'en-tête du
 * fichier). Sur iOS, tout se passe comme avant.
 *
 * Lu à chaque appel (et non une constante de module) : la plateforme ne
 * change pas en production, mais les tests basculent `Platform.OS`.
 */
const isAndroid = () => Platform.OS === 'android';
/** Constante de temps du filtre passe-bas sur le cap (ms) — Android. */
const HEADING_TAU = 200;
/** Bruit de fond du capteur : en dessous, l'aiguille ne bouge pas. */
const HEADING_NOISE = 0.4;
/** Au-delà de cet écart, on recale d'un coup : animer 180° fait « tourner » l'aiguille. */
const SNAP_THRESHOLD = 45;
/**
 * Projection horizontale minimale du haut de l'écran (entre 0 et 1).
 * En dessous, le téléphone est presque vertical : le cap devient du bruit, on
 * le gèle et on demande de le poser à plat.
 */
const MIN_HORIZONTAL = 0.2;

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const CARDINALS = [
  { l: 'N', a: 0 }, { l: 'E', a: 90 }, { l: 'S', a: 180 }, { l: 'W', a: 270 },
];

/** Écart signé le plus court pour aller de `from` à `to`, en degrés, dans [-180, 180[. */
function shortestDelta(from: number, to: number): number {
  return ((to - from) % 360 + 540) % 360 - 180;
}

type Vec3 = { x: number; y: number; z: number };

/** Vecteur unitaire, ou null s'il est nul ou indéfini. */
function normalize(v: Vec3): Vec3 | null {
  const n = Math.hypot(v.x, v.y, v.z);
  if (!Number.isFinite(n) || n < 1e-9) return null;
  return { x: v.x / n, y: v.y / n, z: v.z / n };
}

/** Produit vectoriel. */
function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Produit scalaire. */
function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Cap magnétique compensé de l'inclinaison, en degrés depuis le nord.
 *
 * Le magnétomètre seul ne donne un cap juste que si le téléphone est À PLAT :
 * penché, les composantes x/y du champ sont faussées par la composante
 * verticale et l'aiguille part en vrille. On lui adjoint l'accéléromètre :
 *  - l'accéléromètre donne le vecteur « haut » (opposé à la gravité) ;
 *  - est = champ × haut, puis nord = haut × est ;
 *  - le cap est l'azimut du HAUT DE L'ÉCRAN (axe Y) dans le plan horizontal.
 *
 * `upIsNegative` : iOS et Android n'ont pas la même convention pour
 * l'accéléromètre (iOS mesure l'accélération *avec* la pesanteur — z = -1 à
 * plat ; Android mesure l'accélération propre — z = +1). Sans cette
 * correction, le cap serait décalé de 180°. Seul Android utilise cette
 * fonction pour l'instant (le chemin iOS garde son comportement d'origine).
 *
 * Renvoie null quand le téléphone est presque vertical : le haut de l'écran
 * est alors projeté sur presque rien et le cap ne serait que du bruit.
 */
export function tiltedHeading(field: Vec3, accel: Vec3, upIsNegative: boolean): number | null {
  const up = normalize(upIsNegative ? { x: -accel.x, y: -accel.y, z: -accel.z } : accel);
  const mag = normalize(field);
  if (!up || !mag) return null;
  const east = normalize(cross(mag, up));
  if (!east) return null;
  const north = normalize(cross(up, east));
  if (!north) return null;
  // Le haut de l'écran de l'appareil (portrait).
  const screenUp: Vec3 = { x: 0, y: 1, z: 0 };
  const e = dot(east, screenUp);
  const n = dot(north, screenUp);
  if (Math.hypot(e, n) < MIN_HORIZONTAL) return null;
  return ((Math.atan2(e, n) * 180) / Math.PI + 360) % 360;
}

/**
 * Cap à afficher à partir d'une mesure du cap SYSTÈME, et déclinaison apprise.
 *
 * ⚠️ Android (expo-location, `LocationModule.kt`) calcule le nord vrai par
 * `(magnétique + déclinaison) % 360` en Kotlin : le signe suit le dividende,
 * donc le résultat peut être NÉGATIF. expo renvoie alors `trueHeading = -1`,
 * et l'application se rabattait sur le nord magnétique — ce qui faisait
 * SAUTER l'aiguille de toute la déclinaison (~14° au Sénégal) au passage du
 * nord. iOS, lui, renvoie toujours un `trueHeading` correct.
 *
 * On n'utilise donc jamais `trueHeading` tel quel : on en déduit la
 * déclinaison, et on recale TOUJOURS le nord magnétique dessus. Une seule
 * référence, donc aucune rupture — et le cap reste le nord géographique.
 */
export function resolveSystemHeading(
  magHeading: number,
  trueHeading: number,
  declination: number | null,
): { value: number | null; declination: number | null } {
  let decl = declination;
  if (magHeading >= 0 && trueHeading >= 0) decl = shortestDelta(magHeading, trueHeading);
  if (decl != null && magHeading >= 0) return { value: magHeading + decl, declination: decl };
  if (trueHeading >= 0) return { value: trueHeading, declination: decl };
  if (magHeading >= 0) return { value: magHeading, declination: decl };
  return { value: null, declination: decl };
}

/**
 * Cap du téléphone, lissé.
 *
 * Les mesures brutes tremblent de plusieurs degrés à chaque échantillon : les
 * afficher telles quelles faisait gigoter l'aiguille en permanence. On les
 * filtre (passe-bas à constante de temps) sur un angle DÉROULÉ, qui peut
 * dépasser 360° ou passer sous 0 : sans ça, franchir le nord (359° → 1°)
 * faisait faire un tour complet au cadran dans le mauvais sens.
 *
 * - `smooth` : cap déroulé, animé côté UI (rotations du cadran et de l'aiguille) ;
 * - `heading` : même cap ramené à [0, 360[, pour les textes (rafraîchi ~10 fois/s) ;
 * - `lowAccuracy` : le système signale une boussole mal calibrée ;
 * - `tooTilted` : le téléphone est tenu presque vertical, la mesure n'est pas
 *   fiable (repli magnétomètre uniquement).
 */
function useHeading(): {
  heading: number | null;
  lowAccuracy: boolean;
  tooTilted: boolean;
  smooth: SharedValue<number>;
} {
  const [heading, setHeading] = useState<number | null>(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const [tooTilted, setTooTilted] = useState(false);
  const smooth = useSharedValue(0);

  useEffect(() => {
    const subscriptions: { remove: () => void }[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Le composant peut être démonté pendant un await : sans ce drapeau, on
    // s'abonnerait APRÈS le cleanup et l'abonnement fuiterait (capteur laissé
    // actif sur un écran quitté).
    let cancelled = false;
    let current: number | null = null; // cap lissé, déroulé
    let lastSampleAt = 0;
    let lastTextUpdate = 0;
    let lastTextDegree = -1;
    /** Déclinaison (nord vrai − nord magnétique), déduite du cap système. */
    let declination: number | null = null;
    /** Source active du cap : le système prime, le magnétomètre ne sert que de repli. */
    let source: 'system' | 'magnetometer' | null = null;

    /**
     * Un nouveau cap brut : on le filtre, puis on anime l'aiguille.
     *
     * ANDROID : filtre passe-bas à constante de temps FIXE (HEADING_TAU) — son
     * atténuation dépend de l'écart entre deux mesures, pas de leur nombre.
     * Sans ça, le lissage changeait d'intensité selon la cadence du capteur
     * (5 Hz pour le magnétomètre, jusqu'à 20 Hz pour le cap système) et
     * l'aiguille accélérait ou ralentissait selon la source.
     *
     * iOS : comportement d'origine, inchangé (filtre à facteur fixe et
     * `withTiming`).
     */
    const push = (raw: number, alpha: number) => {
      if (!Number.isFinite(raw)) return;
      const now = Date.now();
      if (current == null) {
        current = raw;
        lastSampleAt = now;
        smooth.value = raw;
      } else {
        const delta = shortestDelta(current, raw);
        if (isAndroid()) {
          const dt = Math.min(500, Math.max(1, now - lastSampleAt));
          lastSampleAt = now;
          // Bruit de fond du capteur : on ne bouge pas pour moins de 0,4°.
          if (Math.abs(delta) < HEADING_NOISE) return;
          if (Math.abs(delta) > SNAP_THRESHOLD) {
            // Recalage (source qui change, lecture aberrante) : on saute d'un
            // coup, sinon l'aiguille fait un tour complet pour rien.
            current += delta;
            smooth.value = current;
          } else {
            current += delta * (1 - Math.exp(-dt / HEADING_TAU));
            // ⚠️ Un RESSORT, pas un `withTiming` : le cap arrive en cadence
            // (jusqu'à 20 mesures/s sur Android), et `withTiming` relancé à
            // chaque mesure repart de VITESSE NULLE — l'aiguille avançait par
            // à-coups, c'est-à-dire qu'elle TREMBLAIT. Reanimated conserve la
            // vitesse du ressort interrompu (spring.ts : `previousAnimation
            // ?.velocity`) : le mouvement reste continu d'une mesure à
            // l'autre. `dampingRatio: 1` = amorti critique, donc aucun rebond.
            smooth.value = withSpring(current, { duration: 180, dampingRatio: 1 });
          }
        } else {
          // iOS : filtre à facteur fixe + animation lineaire (comme avant).
          if (Math.abs(delta) < 0.5) return;
          current += delta * alpha;
          smooth.value = withTiming(current, { duration: 150, easing: Easing.linear });
        }
      }
      // ANDROID : le texte n'est rafraîchi que si le degré affiché change —
      // inutile de re-rendre 10 fois/s pour un nombre identique (et le
      // nombre au centre du cadran scintille moins). iOS : comme avant.
      if (now - lastTextUpdate > 100) {
        lastTextUpdate = now;
        const value = ((current % 360) + 360) % 360;
        const rounded = Math.round(value);
        if (!isAndroid() || rounded !== lastTextDegree) {
          lastTextDegree = rounded;
          setHeading(value);
        }
      }
    };

    /**
     * Cap SYSTÈME : calibré, compensé de l'inclinaison, nord géographique.
     *
     * ANDROID : expo-location peut renvoyer un `trueHeading` NÉGATIF (voir
     * `resolveSystemHeading`), on ne l'utilise donc jamais tel quel.
     *
     * iOS : le `trueHeading` d'Apple est toujours valide — comportement
     * d'origine, inchangé.
     */
    const startSystemHeading = async () => {
      const sub = await Location.watchHeadingAsync((h) => {
        // Le repli magnétomètre a pris le relais : on ne mélange pas les deux.
        if (source === 'magnetometer') return;
        source = 'system';
        setLowAccuracy(h.accuracy <= 1);
        if (isAndroid()) {
          const resolved = resolveSystemHeading(h.magHeading, h.trueHeading, declination);
          declination = resolved.declination;
          if (resolved.value != null) push(resolved.value, 0.35);
        } else {
          // iOS : comportement d'origine (le trueHeading d'iOS est toujours
          // valide). Le garde `raw >= 0` reprend celui d'avant : une mesure
          // négative n'est pas un cap.
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (raw >= 0) push(raw, 0.35);
        }
      });
      if (cancelled) sub.remove();
      else subscriptions.push(sub);
    };

    /**
     * Repli : magnétomètre (+ accéléromètre sur Android).
     *
     * ANDROID : on combine les deux capteurs, le cap est correct quelle que
     * soit l'inclinaison du téléphone.
     *
     * iOS : comportement d'origine (magnétomètre seul, formule valable
     * téléphone à plat), inchangé.
     */
    const startMagnetometer = async () => {
      if (!(await Magnetometer.isAvailableAsync()) || cancelled) return;
      // ⚠️ NE JAMAIS mettre 200 ms ici sur Android — l'aiguille se fige.
      // expo-sensors écoute à SENSOR_DELAY_NORMAL (~200 ms) puis filtre avec
      // `currentTime - lastUpdate > updateInterval` : demander 200 ms rejette
      // quasiment toutes les mesures (constaté sur appareil, build 17).
      // 120 ms laisse passer chaque évènement reçu.
      Magnetometer.setUpdateInterval(120);

      let accel: Vec3 | null = null;
      if (isAndroid()) {
        if (!(await Accelerometer.isAvailableAsync()) || cancelled) return;
        Accelerometer.setUpdateInterval(120);
        const accSub = Accelerometer.addListener(({ x, y, z }) => {
          accel = { x, y, z };
        });
        if (cancelled) {
          accSub.remove();
          return;
        }
        subscriptions.push(accSub);
      }

      const magSub = Magnetometer.addListener(({ x, y, z }) => {
        // Le cap système fonctionne : il est calibré et donne le nord
        // géographique, on ne le mixes pas avec le nord magnétique.
        if (source === 'system') return;
        source = 'magnetometer';
        // Capteur pas encore calibré (fréquent au démarrage sur Android) : il
        // émet des (0,0), qui donneraient un faux « plein nord ».
        if (x === 0 && y === 0) return;

        if (!isAndroid()) {
          // iOS : magnétomètre seul, téléphone à plat (comme avant).
          push((-Math.atan2(x, y) * (180 / Math.PI) + 360) % 360, 0.2);
          return;
        }

        if (!accel) return;
        const h = tiltedHeading({ x, y, z }, accel, false);
        if (h == null) {
          // Téléphone presque vertical : le cap n'est que du bruit. On gèle
          // l'aiguille (plutôt que de la laisser foller) et on le dit.
          setTooTilted(true);
          return;
        }
        setTooTilted(false);
        push(h, 0.2);
      });
      if (cancelled) {
        magSub.remove();
        return;
      }
      subscriptions.push(magSub);
    };

    (async () => {
      try {
        // Le cap système exige la permission de localisation. Si l'utilisateur
        // a choisi sa ville à la main, on ne la redemande pas : repli capteur.
        const perm = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm.granted) {
          await startSystemHeading();
          if (isAndroid()) {
            // Filet de sécurité (Android) : si le cap système reste muet
            // (capteur de champ qui ne répond pas), on bascule sur le
            // magnétomètre plutôt que de laisser l'aiguille figée.
            timers.push(setTimeout(() => {
              if (!cancelled && source === null) void startMagnetometer();
            }, 3000));
          }
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
      timers.forEach((t) => clearTimeout(t));
      subscriptions.forEach((s) => s.remove());
    };
  }, []);

  return { heading, lowAccuracy, tooTilted, smooth };
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
  const { heading, lowAccuracy, tooTilted, smooth } = useHeading();

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
        {tooTilted
          ? tr('qibla.tooTilted')
          : heading == null
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
