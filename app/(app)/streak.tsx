import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { fetchGems, fetchMe, repairStreak, type GemLedgerEntry, type CheckoutSession } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { askPaymentProvider } from '../../utils/askPaymentProvider';
import { useT } from '../../lib/i18n';

// Évènements du ledger de gemmes liés à la SÉRIE (flammes). On ne garde que
// ceux-là pour bâtir « l'historique des flammes ». Construit avec `tr` dans le
// composant (au lieu d'une constante module-level) pour rester réactif au
// changement de langue.
const STREAK_REASON_EMOJIS: Record<string, string> = {
  daily_streak: '🔥',
  streak_bonus: '🎁',
  streak_freeze: '❄️',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Page « Ma série » — ouverte en appuyant sur le compteur 🔥 du parcours.
// Montre la série actuelle, l'objectif, les gels, et TOUT l'historique des
// flammes (évènements de série tirés du ledger de gemmes).
export default function StreakScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const streak = useUserStore((s) => s.streak);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const streakFreezes = useUserStore((s) => s.streakFreezes);
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);

  const STREAK_REASONS: Record<string, { emoji: string; label: string }> = {
    daily_streak: { emoji: STREAK_REASON_EMOJIS.daily_streak, label: tr('streak.reasonDaily') },
    streak_bonus: { emoji: STREAK_REASON_EMOJIS.streak_bonus, label: tr('streak.reasonBonus') },
    streak_freeze: { emoji: STREAK_REASON_EMOJIS.streak_freeze, label: tr('streak.reasonFreeze') },
  };

  const [history, setHistory] = useState<GemLedgerEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [repairing, setRepairing] = useState(false);
  // Jours de série récupérés en payant la restauration (= lastStreakValue).
  const [recoverable, setRecoverable] = useState(0);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [g, me] = await Promise.all([fetchGems(), fetchMe()]);
      setHistory(g.transactions.filter((t) => t.reason in STREAK_REASON_EMOJIS));
      setRecoverable(me.lastStreakValue ?? 0);
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Restaure la série cassée en payant — ouvre le checkout DexPay (carte).
  const onRepair = useCallback(async () => {
    if (repairing) return;
    const provider = await askPaymentProvider();
    if (!provider) return;
    setRepairing(true);
    try {
      const s = await repairStreak(provider);
      setSession(s);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status !== 0
          ? e.message
          : tr('streak.repairFailMsg');
      Alert.alert(tr('streak.repairFailTitle'), msg);
    } finally {
      setRepairing(false);
    }
  }, [repairing, tr]);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      {/* Header */}
      <LinearGradient colors={['#FF9A3D', '#F0820C']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.flameBig}>🔥</Text>
        <Text style={styles.headerCount}>{streak}</Text>
        <Text style={styles.headerTitle}>{tr('streak.headerTitle')}</Text>
        <Text style={styles.headerSub}>
          {streak === 0 ? tr('streak.headerSubZero') : streak > 1 ? tr('streak.headerSubMany', { n: streak }) : tr('streak.headerSubOne', { n: streak })}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats série */}
        <View style={[styles.statsCard, { backgroundColor: T.cardBg }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: T.text }]}>{streak}</Text>
            <Text style={styles.statLabel}>{tr('streak.statDays')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.divider }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: T.text }]}>{streakGoal ?? '—'}</Text>
            <Text style={styles.statLabel}>{tr('streak.statGoal')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: T.divider }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: T.text }]}>{streakFreezes}</Text>
            <Text style={styles.statLabel}>{tr('streak.statFreezes')}</Text>
          </View>
        </View>

        {/* Objectif de série */}
        <Pressable style={[styles.goalBtn, { backgroundColor: T.cardBg }]} onPress={() => router.push('/(app)/streak-goal')}>
          <Feather name="target" size={20} color="#F0820C" />
          <Text style={[styles.goalText, { color: T.text }]}>
            {streakGoal ? tr('streak.goalEdit') : tr('streak.goalSet')}
          </Text>
          <Feather name="chevron-right" size={20} color="#F0820C" />
        </Pressable>

        {/* Restaurer la série cassée en payant — masqué si les paiements sont
            désactivés (ex: revue store en cours). */}
        {paymentsEnabled && (
          <Pressable
            style={[styles.repairBtn, { backgroundColor: T.cardBg }, (repairing || recoverable === 0) && { opacity: 0.6 }]}
            onPress={onRepair}
            disabled={repairing || recoverable === 0}
          >
            <View style={styles.repairIcon}>
              <Feather name="credit-card" size={20} color="#FF4B4B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.repairTitle, { color: T.text }]}>{tr('streak.repairTitle')}</Text>
              <Text style={styles.repairHint}>
                {recoverable > 0
                  ? (recoverable > 1 ? tr('streak.repairHintMany', { n: recoverable }) : tr('streak.repairHintOne', { n: recoverable }))
                  : tr('streak.repairHintNone')}
              </Text>
            </View>
            {repairing ? (
              <ActivityIndicator color="#FF4B4B" />
            ) : (
              <View style={[styles.repairCta, recoverable === 0 && { backgroundColor: '#B0B5BE' }]}>
                <Text style={styles.repairCtaText}>{recoverable > 0 ? tr('streak.repairCtaPay', { n: recoverable }) : tr('streak.repairCtaPayDefault')}</Text>
              </View>
            )}
          </Pressable>
        )}

        <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('streak.historyTitle')}</Text>

        {error ? (
          <View style={styles.stateBox}>
            <Feather name="wifi-off" size={28} color={T.textTertiary} />
            <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('streak.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('common.retry')}</Text>
            </Pressable>
          </View>
        ) : !history ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#F0820C" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={{ fontSize: 34 }}>🔥</Text>
            <Text style={[styles.stateText, { color: T.textSecondary }]}>
              {tr('streak.historyEmpty')}
            </Text>
          </View>
        ) : (
          <View style={[styles.list, { backgroundColor: T.cardBg }]}>
            {history.map((h, i) => {
              const r = STREAK_REASONS[h.reason]!;
              return (
                <View key={h.id} style={[styles.row, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}>
                  <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: T.text }]}>{r.label}</Text>
                    <Text style={styles.rowDate}>{formatDate(h.createdAt)}</Text>
                  </View>
                  {h.amount !== 0 && (
                    <Text style={[styles.rowAmount, { color: h.amount > 0 ? '#2A9E1C' : '#FF4B4B' }]}>
                      {h.amount > 0 ? '+' : ''}{h.amount} 💎
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={(outcome) => {
            setSession(null);
            if (outcome === 'success') {
              load();
              Alert.alert(tr('streak.repairOkTitle'), tr('streak.repairOkMsg'));
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 22, alignItems: 'center' },
  back: { position: 'absolute', top: 16, left: 18, padding: 4, zIndex: 2 },
  flameBig: { fontSize: 44, marginTop: 8 },
  headerCount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: '#fff', marginTop: 2 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 6 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  body: { padding: 18 },
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderRadius: 18, paddingVertical: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', marginTop: 2 },
  statDivider: { width: 1, height: 34 },

  goalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  goalText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },

  repairBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1.5, borderColor: '#FF4B4B55',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  repairIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FF4B4B1A', alignItems: 'center', justifyContent: 'center' },
  repairTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  repairHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#8A8F99', marginTop: 2 },
  repairCta: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#FF4B4B' },
  repairCtaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 24, marginBottom: 12 },
  stateBox: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 36, paddingHorizontal: 20 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F0820C' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  list: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  divider: { borderTopWidth: 1 },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  rowDate: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#8A8F99', marginTop: 2 },
  rowAmount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },
});
