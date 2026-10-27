/**
 * Visuel de partage de la série — ce qu'on exporte en image (format story 9:16).
 *
 * Toujours sur fond sombre et chaud, quel que soit le thème de l'app : c'est
 * une image destinée à une story ou à WhatsApp, elle doit ressortir pareil
 * chez tout le monde.
 *
 * On dessine à 1/4 (270×480) puis on capture en `width: SHARE_WIDTH` :
 * react-native-view-shot remet à l'échelle, le rendu reste net.
 */
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Otter from './Otter';
import { StaticFlame } from './StreakFlame';

/** Dimensions d'export, en pixels. Ratio 9:16. */
export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1920;
export const CARD_WIDTH = 270;
export const CARD_HEIGHT = 480;

export interface WeekDay {
  /** Initiale du jour (L, M, M…). */
  label: string;
  done: boolean;
  today: boolean;
}

export interface StreakShareCardProps {
  streak: number;
  /** Libellé sous le nombre (« jours de suite »). */
  unitLabel: string;
  dateLabel: string;
  tagline: string;
  week: WeekDay[];
}

export default function StreakShareCard({ streak, unitLabel, dateLabel, tagline, week }: StreakShareCardProps) {
  return (
    <LinearGradient
      colors={['#2A1A12', '#4A2414', '#8A3A18']}
      locations={[0, 0.55, 1]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.card}
    >
      <Svg width={340} height={340} style={styles.glow} pointerEvents="none">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFC23D" stopOpacity={0.38} />
            <Stop offset="0.62" stopColor="#FFC23D" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={170} cy={170} r={170} fill="url(#g)" />
      </Svg>

      <View style={styles.header}>
        <Text style={styles.brand}>Tarteel</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      <View style={{ marginTop: 26 }}>
        <StaticFlame size={110} />
      </View>

      <Text style={styles.count}>{streak}</Text>
      <Text style={styles.unit}>{unitLabel}</Text>

      <View style={styles.week}>
        {week.map((d, i) => {
          const prev = week[i - 1]?.done && d.done;
          const next = week[i + 1]?.done && d.done;
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, { color: d.today ? '#FFD36B' : 'rgba(255,255,255,0.6)' }]}>{d.label}</Text>
              <View style={{ alignSelf: 'stretch', paddingLeft: prev ? 0 : 2, paddingRight: next ? 0 : 2 }}>
                <View
                  style={[
                    styles.dayPill,
                    d.done
                      ? {
                          backgroundColor: '#F4633A',
                          borderTopLeftRadius: prev ? 0 : 11,
                          borderBottomLeftRadius: prev ? 0 : 11,
                          borderTopRightRadius: next ? 0 : 11,
                          borderBottomRightRadius: next ? 0 : 11,
                        }
                      : { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 11 },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <Otter size={34} />
        <Text style={styles.tagline}>{tagline}</Text>
      </View>
      <Text style={styles.site}>tarteel.sn</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24, overflow: 'hidden',
    alignItems: 'center', paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16,
  },
  glow: { position: 'absolute', top: 40, left: (CARD_WIDTH - 340) / 2 },
  header: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#fff' },
  date: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  count: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 72, lineHeight: 80, color: '#FFB13D', marginTop: 6,
    textShadowColor: 'rgba(244,99,58,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  unit: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff', marginTop: -6 },
  week: { alignSelf: 'stretch', flexDirection: 'row', marginTop: 18 },
  dayCol: { flex: 1, alignItems: 'center', gap: 5 },
  dayLabel: { fontFamily: 'Nunito_900Black', fontSize: 9 },
  dayPill: { height: 22, alignSelf: 'stretch' },
  footer: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  tagline: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 10, lineHeight: 13.5, color: '#fff' },
  site: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
});
