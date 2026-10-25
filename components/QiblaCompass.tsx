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
 * ⚠️ Le magnétomètre donne le nord MAGNÉTIQUE, pas le nord géographique. Sans
 * correction de déclinaison, l'écart va de quelques degrés (Sénégal, Europe de
 * l'Ouest) à beaucoup plus ailleurs. L'affichage est donc indicatif, et l'écran
 * le dit.
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { qiblaDirection, distanceToKaaba, cardinalFor } from '../constants/prayerTimes';
import { useT } from '../lib/i18n';

/** Écart (en degrés) en deçà duquel on considère le téléphone aligné. */
const ALIGN_TOLERANCE = 4;
const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const CARDINALS = [
  { l: 'N', a: 0 }, { l: 'E', a: 90 }, { l: 'S', a: 180 }, { l: 'W', a: 270 },
];

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
  const [heading, setHeading] = useState<number | null>(null);

  const qibla = qiblaDirection(latitude, longitude);
  const distance = distanceToKaaba(latitude, longitude);
  const cardinal = cardinalFor(qibla);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    // Le composant peut être démonté pendant l'await ci-dessous : sans ce
    // drapeau, on s'abonnerait APRÈS le cleanup et l'abonnement fuiterait
    // (aiguille figée sur un écran quitté, capteur laissé actif).
    let cancelled = false;

    // Le magnétomètre est absent de nombreux appareils d'entrée de gamme (et
    // de la plupart des émulateurs) : on retombe alors sur l'affichage du cap
    // seul. Constaté par exemple sur Galaxy A03 (`dumpsys sensorservice` ne
    // liste que accéléromètre, luminosité, proximité et podomètre — aucun
    // capteur de champ magnétique, et `pm list features` ne déclare pas
    // android.hardware.sensor.compass). L'aiguille figée n'est donc pas un
    // bug : c'est le seul comportement possible sans capteur.
    Magnetometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return;
        if (!available) return;
        // ⚠️ NE JAMAIS mettre 200 ms ici sur Android — l'aiguille se fige.
        //
        // expo-sensors n'impose pas cet intervalle au capteur : il enregistre
        // le listener à SENSOR_DELAY_NORMAL (~200 ms) faute de la permission
        // HIGH_SAMPLING_RATE_SENSORS, puis filtre en JS natif avec
        //     if (currentTime - lastUpdate > updateInterval)
        // Demander 200 ms revient donc à exiger un écart STRICTEMENT supérieur
        // à 200 ms sur des évènements qui arrivent toutes les ~200 ms : la
        // condition échoue quasiment à chaque fois et plus aucune mesure ne
        // passe. C'est exactement ce qui a figé la boussole (constaté sur
        // appareil, build 17).
        //
        // 120 ms laisse au contraire passer chaque évènement reçu. On ne gagne
        // pas en fluidité au-delà de la cadence matérielle, mais on ne perd
        // aucune mesure — et aucune permission supplémentaire n'est requise.
        Magnetometer.setUpdateInterval(120);
        subscription = Magnetometer.addListener(({ x, y }) => {
          // Téléphone tenu à plat, portrait : l'axe Y du magnétomètre pointe
          // vers le haut de l'écran (« devant soi »), l'axe X vers la droite.
          // Un cap de boussole se compte depuis le nord, dans le sens
          // horaire — d'où atan2(x, y) plutôt que atan2(y, x) (convention
          // mathématique standard, sens antihoraire).
          //
          // Le capteur renvoie la direction du champ magnétique AMBIANT, qui
          // pointe à l'opposé du cap réel de l'appareil (le champ « rentre »
          // par le pôle nord magnétique) : sans ce signe négatif, la flèche
          // tournait dans le bon référentiel mais dans le mauvais sens — un
          // virage à droite du téléphone la faisait tourner à gauche
          // (constaté sur appareil).
          // Capteur pas encore calibré (fréquent au démarrage sur Android) :
          // il émet des (0,0). `atan2(0, 0)` vaut 0, ce qui donnerait un cap
          // « plein nord » parfaitement crédible — l'aiguille se figeait donc
          // sur une valeur FAUSSE au lieu d'afficher « pas de capteur ». On
          // ignore ces mesures : `heading` reste null tant qu'aucune lecture
          // exploitable n'arrive.
          if (x === 0 && y === 0) return;
          let angle = -Math.atan2(x, y) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          setHeading(angle);
        });
      })
      .catch((e) => {
        // Un catch muet ici rendait le bug indiagnosticable à distance :
        // l'aiguille restait figée sans la moindre trace. L'affichage
        // statique reste le comportement de repli, mais la cause est tracée.
        console.warn('[qibla] magnétomètre indisponible — aiguille figée :', e);
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  // Écart signé entre la Qibla et l'avant du téléphone, ramené à [-180, 180[.
  // Sans magnétomètre, l'aiguille montre le cap absolu (repère fixe).
  const diff = heading == null ? null : ((qibla - heading) % 360 + 540) % 360 - 180;
  const needleRot = diff ?? qibla;
  const dialRot = heading == null ? 0 : -heading;
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
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: R, backgroundColor: dialBg, transform: [{ rotate: `${dialRot}deg` }] },
          ]}
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
        </View>

        {/* Aiguille vers la Kaaba, relative à l'avant du téléphone. */}
        <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${needleRot}deg` }] }]} pointerEvents="none">
          <View style={{ position: 'absolute', left: R - 2, top: R - 112 * k, width: 4, height: 112 * k, borderRadius: 2, backgroundColor: needle }} />
          <View
            style={{
              position: 'absolute', left: R - 13, top: R - 126 * k, width: 0, height: 0,
              borderLeftWidth: 13, borderRightWidth: 13, borderBottomWidth: 24,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: needle,
            }}
          />
        </View>

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
        {heading == null ? tr('qibla.noSensor') : aligned ? tr('qibla.alignedHint') : tr('qibla.hint')}
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
