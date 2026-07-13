import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LIGUES, podiumRangLabel, podiumMedaille } from '../../constants/ligues';
import { fetchPodiums, claimPodium, ApiError, type PodiumEntry } from '../../lib/api';
import { playSound } from '../../constants/sounds';
import { useT } from '../../lib/i18n';

export default function PodiumsScreen() {
  const router = useRouter();
  const tr = useT();

  // Historique RÉEL des podiums (GET /me/podiums). Vide = aucun trophée gagné.
  const [entries, setEntries] = useState<PodiumEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setEntries(await fetchPodiums());
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const claim = async (ref: string) => {
    if (claiming) return;
    setClaiming(ref);
    try {
      const gained = await claimPodium(ref);
      playSound('finish');
      Alert.alert(tr('podiums.claimAlertTitle'), tr('podiums.claimAlertMsg', { n: gained }));
      await load(); // rafraîchit l'état "réclamé"
    } catch (e) {
      Alert.alert(tr('podiums.errorTitle'), e instanceof ApiError ? e.message : tr('podiums.claimError'));
    } finally {
      setClaiming(null);
    }
  };

  // ── États chargement / erreur ──
  if (!entries && !error) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle}>{tr('podiums.headerTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#E0A02C" />
          <Text style={styles.stateText}>{tr('podiums.loading')}</Text>
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle}>{tr('podiums.headerTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerState}>
          <Feather name="wifi-off" size={30} color="#9AA0AA" />
          <Text style={styles.stateText}>{tr('podiums.loadError')}</Text>
          <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryLabel}>{tr('common.retry')}</Text></Pressable>
        </View>
      </View>
    );
  }

  const list = entries!;
  // La récompense réclamable = le podium le plus récent encore non réclamé.
  const claimableId = list.find((e) => !e.claimed)?.id ?? null;

  const total = list.length;
  const victoires = list.filter((e) => e.rang === 1).length;
  const meilleureLigue = list.reduce<PodiumEntry | null>((best, e) => {
    if (!LIGUES[e.ligue]) return best;
    const order: Record<string, number> = { bronze: 1, argent: 2, or: 3, emeraude: 4, diamant: 5 };
    return !best || order[e.ligue] > order[best.ligue] ? e : best;
  }, null);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('podiums.headerTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>{tr('podiums.summaryTop3')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{victoires} 🥇</Text>
            <Text style={styles.summaryLabel}>{tr('podiums.summaryWins')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{meilleureLigue ? LIGUES[meilleureLigue.ligue]?.emoji ?? '—' : '—'}</Text>
            <Text style={styles.summaryLabel}>{tr('podiums.summaryBestLeague')}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{tr('podiums.historyLabel')}</Text>

        {list.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>{tr('podiums.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {tr('podiums.emptyText')}
            </Text>
          </View>
        )}

        {list.map((e) => {
          const l = LIGUES[e.ligue] ?? LIGUES.bronze;
          const claimable = e.id === claimableId;
          return (
            <View key={e.id} style={[styles.card, claimable && styles.cardClaimable]}>
              <View style={[styles.medalBox, { backgroundColor: l.bg }]}>
                <Text style={styles.medal}>{podiumMedaille(e.rang)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{l.nom}</Text>
                <Text style={styles.cardSub}>{tr('podiums.weekLabel', { n: e.semaine })}</Text>
                <View style={[styles.rangPill, { backgroundColor: l.bg, alignSelf: 'flex-start', marginTop: 6 }]}>
                  <Text style={[styles.rangText, { color: l.couleur }]}>{podiumRangLabel(e.rang)}</Text>
                </View>
              </View>

              {claimable ? (
                <Pressable style={styles.claimBtn} disabled={claiming === e.id} onPress={() => claim(e.id)}>
                  {claiming === e.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="gift" size={15} color="#fff" />
                      <Text style={styles.claimBtnText}>+{e.reward}</Text>
                    </>
                  )}
                </Pressable>
              ) : e.claimed ? (
                <View style={styles.claimedPill}>
                  <Feather name="check" size={14} color="#2A9E1C" />
                  <Text style={styles.claimedText}>{tr('podiums.claimedLabel')}</Text>
                </View>
              ) : (
                <View style={styles.rewardPill}>
                  <Text style={styles.rewardPillText}>{tr('podiums.rewardPill', { n: e.reward })}</Text>
                </View>
              )}
            </View>
          );
        })}

        {list.length > 0 && (
          <Text style={styles.note}>
            {tr('podiums.footerNote')}
          </Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#7A828F', textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#E0A02C' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#1B2333' },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', lineHeight: 20 },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  content: { paddingHorizontal: 22, paddingVertical: 18 },

  summary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#FBEFD0', borderRadius: 18, paddingVertical: 18, marginBottom: 6,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#C57A0C' },
  summaryLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#A57A2C', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#EAD49A' },

  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 22, marginBottom: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  medalBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  medal: { fontSize: 26 },
  cardClaimable: { borderWidth: 2, borderColor: '#F0C04C', backgroundColor: '#FFFBF2' },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  cardSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
  rangPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  rangText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  rewardPill: { backgroundColor: '#FFF7E6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  rewardPillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#E0A02C' },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E0A02C', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 3, borderBottomColor: '#B07A1C',
  },
  claimBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
  claimedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E2F5E1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  claimedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#2A9E1C' },

  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 16, paddingHorizontal: 12 },
});
