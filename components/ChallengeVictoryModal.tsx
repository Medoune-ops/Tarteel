import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Confetti from './Confetti';
import { useTheme } from '../utils/useTheme';
import { useT } from '../lib/i18n';
import type { ChallengeView } from '../lib/api';

interface Props {
  challenge: ChallengeView | null;
  onClose: () => void;
}

/** Célébration de victoire de défi — montrée une fois par défi gagné. */
export default function ChallengeVictoryModal({ challenge, onClose }: Props) {
  const tr = useT();
  const T = useTheme();
  if (!challenge) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Confetti count={64} />
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <LinearGradient
            colors={['#FFD66B', '#F0A41E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Feather name="award" size={44} color="#FDF6E3" />
          </LinearGradient>

          <Text style={[styles.title, { color: T.text }]}>{tr('friends.challengeVictoryTitle')}</Text>
          <Text style={[styles.sub, { color: T.textSecondary }]}>
            {tr('friends.challengeVictorySub', { title: challenge.title })}
          </Text>

          <View style={styles.winners}>
            {challenge.winnerIds.map((id) => {
              const p = challenge.participants.find((x) => x.user.id === id);
              return p ? (
                <View key={id} style={[styles.winnerRow, { backgroundColor: T.pageBg }]}>
                  <Text style={styles.trophy}>🏆</Text>
                  <Text style={[styles.winnerName, { color: T.text }]}>
                    {p.user.displayName}
                    {p.isMe ? ` (${tr('friends.player')})` : ''}
                  </Text>
                </View>
              ) : null;
            })}
          </View>

          <Pressable style={styles.cta} onPress={onClose}>
            <Text style={styles.ctaLabel}>{tr('friends.challengeVictoryClose')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 380, borderRadius: 26, padding: 26,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  badge: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, marginTop: 18, textAlign: 'center' },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  winners: { alignSelf: 'stretch', gap: 8, marginTop: 20 },
  winnerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
  },
  trophy: { fontSize: 18 },
  winnerName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, flex: 1 },
  cta: {
    alignSelf: 'stretch', height: 56, borderRadius: 16, marginTop: 22,
    backgroundColor: '#6B4DFF', alignItems: 'center', justifyContent: 'center',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
});