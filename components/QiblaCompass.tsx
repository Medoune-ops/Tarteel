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
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import { qiblaDirection, distanceToKaaba, cardinalFor } from '../constants/prayerTimes';
import { useT } from '../lib/i18n';
import { KaabaColorIcon } from './IslamicIcons';

/**
 * Flèche dessinée à la main plutôt que l'icône Feather "navigation" : celle-ci
 * ne pointe PAS plein nord (0°) par défaut — sa pointe est décalée vers le
 * haut-droite — alors que `rotation` (plus bas) suppose une flèche pointant
 * exactement vers le haut à 0°. Résultat : la Qibla s'affichait décalée vers
 * le nord au lieu de sa direction réelle. Ce triangle est garanti pointer
 * plein haut (nord) à 0°, quelle que soit l'icône utilisée par ailleurs dans
 * l'app.
 */
function QiblaArrow({ size = 54, color = '#1F8A70' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2 L19 21 L12 16.5 L5 21 Z"
        fill={color}
      />
    </Svg>
  );
}

interface Props {
  latitude: number;
  longitude: number;
  /** Couleurs du thème courant (clair/sombre). */
  colors: { text: string; textSecondary: string; textTertiary: string; cardBg: string };
}

export default function QiblaCompass({ latitude, longitude, colors }: Props) {
  const tr = useT();
  const [heading, setHeading] = useState<number | null>(null);
  // Diagnostic temporaire : la boussole reste figée sur certains Android sans
  // qu'on sache pourquoi. On expose l'état réel du capteur à l'écran.
  const [diag, setDiag] = useState('capteur : en attente…');

  const qibla = qiblaDirection(latitude, longitude);
  const distance = distanceToKaaba(latitude, longitude);
  const cardinal = cardinalFor(qibla);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    // Le composant peut être démonté pendant l'await ci-dessous : sans ce
    // drapeau, on s'abonnerait APRÈS le cleanup et l'abonnement fuiterait
    // (aiguille figée sur un écran quitté, capteur laissé actif).
    let cancelled = false;

    // Le magnétomètre est absent de certains appareils (et de la plupart des
    // émulateurs) : on retombe alors sur l'affichage du cap seul.
    let count = 0;
    Magnetometer.isAvailableAsync()
      .then((available) => {
        if (cancelled) return;
        if (!available) { setDiag('capteur : isAvailableAsync = false'); return; }
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
          count++;
          if (x === 0 && y === 0) {
            setDiag(`capteur : ${count} mesures, toutes (0,0) — magnétomètre inactif`);
            return;
          }
          let angle = -Math.atan2(x, y) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          setDiag(`capteur OK : ${count} mesures · x=${x.toFixed(1)} y=${y.toFixed(1)} · cap=${Math.round(angle)}°`);
          setHeading(angle);
        });
        setDiag('capteur : listener posé, en attente de mesures…');
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

  // Rotation à appliquer à la flèche. Sans magnétomètre, on pointe simplement
  // le cap absolu (l'utilisateur se repère alors avec une autre boussole).
  const rotation = heading == null ? qibla : (qibla - heading + 360) % 360;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{tr('qibla.title')}</Text>
        <Text style={[styles.distance, { color: colors.textTertiary }]}>
          {tr('qibla.distance', { km: distance.toLocaleString() })}
        </Text>
      </View>

      <View style={styles.compassWrap}>
        {/* Cadran */}
        <View style={styles.dial}>
          {/* Repère fixe : la Kaaba en haut du cadran, à la place du "N".
              Elle ne tourne PAS — seule la flèche pivote pour l'indiquer,
              exactement comme le nord d'une boussole classique reste fixe
              pendant que l'aiguille bouge. */}
          <View style={styles.kaabaFixed}>
            <KaabaColorIcon size={22} color={colors.text} />
          </View>

          {/* Flèche vers la Kaaba */}
          <View style={[styles.needle, { transform: [{ rotate: `${rotation}deg` }] }]}>
            <QiblaArrow size={54} color="#1F8A70" />
          </View>
        </View>
      </View>

      <Text style={[styles.bearing, { color: colors.text }]}>
        {Math.round(qibla)}° · {tr(`qibla.cardinal.${cardinal}`)}
      </Text>

      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        {heading == null ? tr('qibla.noSensor') : tr('qibla.hint')}
      </Text>

      {/* DIAGNOSTIC TEMPORAIRE — à retirer une fois la boussole réparée */}
      <Text style={[styles.hint, { color: colors.textTertiary, fontSize: 10, marginTop: 2 }]}>
        {diag}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
  distance: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },

  compassWrap: { alignItems: 'center', justifyContent: 'center' },
  dial: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 2, borderColor: 'rgba(31,138,112,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  needle: { alignItems: 'center', justifyContent: 'center' },
  kaabaFixed: { position: 'absolute', top: 8, alignItems: 'center', justifyContent: 'center' },

  bearing: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginTop: 14 },
  hint: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 11, textAlign: 'center',
    marginTop: 6, paddingHorizontal: 8, lineHeight: 16,
  },
});
