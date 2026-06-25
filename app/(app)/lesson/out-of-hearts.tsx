import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Otter from '../../../components/Otter';
import { useUserStore, HEART_REGEN_MS } from '../../../store/userStore';

/** Formate un nombre de ms en "Xh Ymin". */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Bientôt';
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m} min`;
}

export default function OutOfHeartsScreen() {
  const router = useRouter();
  const syncHearts = useUserStore((s) => s.syncHearts);
  const msUntilNextHeart = useUserStore((s) => s.msUntilNextHeart);
  const hearts = useUserStore((s) => s.hearts);

  const [remaining, setRemaining] = useState(msUntilNextHeart());

  // Tic chaque seconde : met à jour le compte à rebours et régénère si besoin.
  useEffect(() => {
    const id = setInterval(() => {
      syncHearts();
      setRemaining(useUserStore.getState().msUntilNextHeart());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Dès qu'un cœur est régénéré, on peut repartir.
  useEffect(() => {
    if (hearts > 0) router.replace('/(app)/(tabs)/parcours');
  }, [hearts]);

  return (
    <View style={styles.screen}>
      <Pressable style={styles.close} onPress={() => router.replace('/(app)/(tabs)/parcours')} hitSlop={10}>
        <Feather name="x" size={26} color="#9AA0AA" />
      </Pressable>

      <View style={styles.otterWrap}>
        <Otter size={120} />
        <View style={styles.brokenHeart}>
          <Text style={{ fontSize: 34 }}>💔</Text>
        </View>
      </View>

      <Text style={styles.title}>Plus de cœurs !</Text>
      <Text style={styles.subtitle}>
        Tu as fait trop d'erreurs. Attends qu'un cœur se régénère ou passe en Premium pour continuer sans limite.
      </Text>

      {/* Compte à rebours */}
      <View style={styles.timerCard}>
        <Feather name="clock" size={22} color="#FF4B4B" />
        <View>
          <Text style={styles.timerLabel}>Prochain cœur dans</Text>
          <Text style={styles.timerValue}>{formatRemaining(remaining)}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* CTA Premium */}
      <Pressable onPress={() => router.replace('/(app)/subscription')} style={{ width: '100%' }}>
        <LinearGradient colors={['#FFA53D', '#F0820C']} style={styles.premiumCta}>
          <Feather name="star" size={20} color="#fff" />
          <Text style={styles.premiumLabel}>Cœurs illimités avec Premium</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.waitBtn} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
        <Text style={styles.waitLabel}>J'attends</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28, paddingTop: 90, paddingBottom: 36, alignItems: 'center' },
  close: { position: 'absolute', top: 54, right: 24 },
  otterWrap: { alignItems: 'center', justifyContent: 'center' },
  brokenHeart: { position: 'absolute', bottom: -6, right: -10 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: '#1B2333', marginTop: 22 },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: '#7A828F', textAlign: 'center', marginTop: 12, lineHeight: 24 },
  timerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF0F0', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 24, marginTop: 28,
    borderWidth: 1.5, borderColor: '#FFD9D9',
  },
  timerLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#C53A3A' },
  timerValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#FF4B4B' },
  premiumCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 60, borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  premiumLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  waitBtn: { paddingVertical: 16, marginTop: 6 },
  waitLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#8A8F99' },
});
