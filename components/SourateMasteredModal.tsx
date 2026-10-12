import { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Confetti from './Confetti';
import { useTheme } from '../utils/useTheme';
import { useT } from '../lib/i18n';
import { useAppConfigStore } from '../store/appConfigStore';
import FriendPickerModal from './FriendPickerModal';
import FriendSendModal from './FriendSendModal';
import type { FriendUser } from '../lib/api';

interface Props {
  visible: boolean;
  sourate: { numero: number; nom: string } | null;
  onContinue: () => void;
}

/** Célébration « sourate maîtrisée » à la fin d'une leçon. */
export default function SourateMasteredModal({ visible, sourate, onContinue }: Props) {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const friendsEnabled = useAppConfigStore((s) => s.friendsEnabled);
  const [friendPick, setFriendPick] = useState(false);
  const [send, setSend] = useState(false);
  const [friend, setFriend] = useState<FriendUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (visible) setReady(true);
    else {
      setReady(false);
      setFriendPick(false);
      setSend(false);
      setFriend(null);
    }
  }, [visible]);

  if (!sourate) return null;

  return (
    <Modal visible={ready && visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Confetti count={56} />
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <LinearGradient
            colors={['#8B5CF6', '#6B4DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Feather name="award" size={46} color="#fff" />
          </LinearGradient>

          <Text style={[styles.title, { color: T.text }]}>{tr('finish.sourateMasteredTitle')}</Text>
          <Text style={[styles.sub, { color: T.textSecondary }]}>سُورَةُ {sourate.nom} · Sourate {sourate.numero}</Text>

          <ScrollView contentContainerStyle={styles.actions}>
            {friendsEnabled && (
              <>
                <Pressable
                  style={[styles.btn, styles.btnGhost, { borderColor: T.divider }]}
                  onPress={() => setFriendPick(true)}
                >
                  <Feather name="send" size={18} color={T.text} />
                  <Text style={[styles.btnLabel, { color: T.text }]}>{tr('friends.sendSuccess')}</Text>
                </Pressable>

                <FriendPickerModal
                  visible={friendPick}
                  onClose={() => setFriendPick(false)}
                  onPick={(f) => {
                    setFriend(f);
                    setFriendPick(false);
                    setSend(true);
                  }}
                />
                <FriendSendModal
                  visible={send}
                  friend={friend}
                  initialType="success"
                  successSourateNumero={sourate.numero}
                  onClose={() => setSend(false)}
                />
              </>
            )}

            <Pressable style={[styles.btn, styles.btnSolid]} onPress={onContinue}>
              <Feather name="arrow-right" size={18} color="#fff" />
              <Text style={[styles.btnLabel, { color: '#fff' }]}>{tr('feedback.continue')}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: {
    width: '100%', maxWidth: 420, borderRadius: 28, padding: 28,
    alignItems: 'center',
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 26, elevation: 12,
  },
  badge: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, marginTop: 18, textAlign: 'center' },
  sub: { fontFamily: 'Nunito_700Bold', fontSize: 14, marginTop: 6, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 22 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: 16,
  },
  btnSolid: { backgroundColor: '#6B4DFF' },
  btnGhost: { backgroundColor: 'rgba(107,77,255,0.08)', borderWidth: 1 },
  btnLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
});