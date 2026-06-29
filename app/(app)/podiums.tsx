import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  PODIUMS_HISTORIQUE, LIGUES, podiumRangLabel, podiumMedaille,
} from '../../constants/ligues';
import { PODIUM_REWARD } from '../../constants/rewards';
import { useUserStore } from '../../store/userStore';
import { playSound } from '../../constants/sounds';

export default function PodiumsScreen() {
  const router = useRouter();
  const entries = PODIUMS_HISTORIQUE;
  const claimPodiumReward = useUserStore((s) => s.claimPodiumReward);
  const isPodiumClaimed = useUserStore((s) => s.isPodiumClaimed);
  // Force le re-render après une réclamation.
  const [, setTick] = useState(0);

  // La récompense réclamable = le podium le plus récent encore non réclamé.
  const claimableId = entries.find((e) => !isPodiumClaimed(e.id))?.id ?? null;

  const claim = (id: string, rang: 1 | 2 | 3) => {
    const gained = claimPodiumReward(id, rang);
    if (gained > 0) {
      playSound('finish');
      Alert.alert('🏆 Récompense récupérée !', `+${gained} XP pour ton podium. Continue comme ça !`);
      setTick((t) => t + 1);
    }
  };

  const total = entries.length;
  const victoires = entries.filter((e) => e.rang === 1).length;
  const meilleureLigue = entries.reduce<typeof entries[number] | null>((best, e) => {
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
        <Text style={styles.headerTitle}>Mes podiums</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>Top 3</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{victoires} 🥇</Text>
            <Text style={styles.summaryLabel}>Victoires</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{meilleureLigue ? LIGUES[meilleureLigue.ligue].emoji : '—'}</Text>
            <Text style={styles.summaryLabel}>Meilleure ligue</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>HISTORIQUE</Text>

        {entries.map((e) => {
          const l = LIGUES[e.ligue];
          const claimable = e.id === claimableId;
          const claimed = isPodiumClaimed(e.id);
          return (
            <View key={e.id} style={[styles.card, claimable && styles.cardClaimable]}>
              <View style={[styles.medalBox, { backgroundColor: l.bg }]}>
                <Text style={styles.medal}>{podiumMedaille(e.rang)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{l.nom}</Text>
                <Text style={styles.cardSub}>Semaine {e.semaine} · {e.date}</Text>
                <View style={[styles.rangPill, { backgroundColor: l.bg, alignSelf: 'flex-start', marginTop: 6 }]}>
                  <Text style={[styles.rangText, { color: l.couleur }]}>{podiumRangLabel(e.rang)}</Text>
                </View>
              </View>

              {claimable ? (
                <Pressable style={styles.claimBtn} onPress={() => claim(e.id, e.rang)}>
                  <Feather name="gift" size={15} color="#fff" />
                  <Text style={styles.claimBtnText}>+{PODIUM_REWARD[e.rang]}</Text>
                </Pressable>
              ) : claimed ? (
                <View style={styles.claimedPill}>
                  <Feather name="check" size={14} color="#2A9E1C" />
                  <Text style={styles.claimedText}>Récupéré</Text>
                </View>
              ) : (
                <View style={styles.rewardPill}>
                  <Text style={styles.rewardPillText}>🎁 +{PODIUM_REWARD[e.rang]}</Text>
                </View>
              )}
            </View>
          );
        })}

        <Text style={styles.note}>
          Finis dans le top 3 chaque semaine pour grimper de ligue 🏆
        </Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
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
