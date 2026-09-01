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
import { Feather } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import { qiblaDirection, distanceToKaaba, cardinalFor } from '../constants/prayerTimes';
import { useT } from '../lib/i18n';

interface Props {
  latitude: number;
  longitude: number;
  /** Couleurs du thème courant (clair/sombre). */
  colors: { text: string; textSecondary: string; textTertiary: string; cardBg: string };
}

export default function QiblaCompass({ latitude, longitude, colors }: Props) {
  const tr = useT();
  const [heading, setHeading] = useState<number | null>(null);

  const qibla = qiblaDirection(latitude, longitude);
  const distance = distanceToKaaba(latitude, longitude);
  const cardinal = cardinalFor(qibla);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    // Le magnétomètre est absent de certains appareils (et de la plupart des
    // émulateurs) : on retombe alors sur l'affichage du cap seul.
    Magnetometer.isAvailableAsync()
      .then((available) => {
        if (!available) return;
        Magnetometer.setUpdateInterval(120); // ~8 fois/s : fluide sans surcharger
        subscription = Magnetometer.addListener(({ x, y }) => {
          // atan2 donne l'angle du champ magnétique ; on le ramène en degrés
          // 0–360 depuis le nord.
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          setHeading(angle);
        });
      })
      .catch(() => { /* capteur indisponible : on garde l'affichage statique */ });

    return () => subscription?.remove();
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
          <Text style={[styles.dialLabel, styles.dialN, { color: colors.textTertiary }]}>
            {tr('qibla.north')}
          </Text>

          {/* Flèche vers la Kaaba */}
          <View style={[styles.needle, { transform: [{ rotate: `${rotation}deg` }] }]}>
            <Feather name="navigation" size={54} color="#1F8A70" />
          </View>
        </View>
      </View>

      <Text style={[styles.bearing, { color: colors.text }]}>
        {Math.round(qibla)}° · {tr(`qibla.cardinal.${cardinal}`)}
      </Text>

      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        {heading == null ? tr('qibla.noSensor') : tr('qibla.hint')}
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
  dialLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, position: 'absolute' },
  dialN: { top: 8 },
  needle: { alignItems: 'center', justifyContent: 'center' },

  bearing: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginTop: 14 },
  hint: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 11, textAlign: 'center',
    marginTop: 6, paddingHorizontal: 8, lineHeight: 16,
  },
});
