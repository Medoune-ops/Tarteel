import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FriendAvatar from './FriendAvatar';
import { useTheme } from '../utils/useTheme';
import { fetchFriends, type FriendView, type FriendUser } from '../lib/api';
import { useT } from '../lib/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (friend: FriendUser) => void;
}

/** Sélectionne un ami (pour partager un hadith, une réussite, etc.). */
export default function FriendPickerModal({ visible, onClose, onPick }: Props) {
  const tr = useT();
  const T = useTheme();
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchFriends()
      .then(setFriends)
      .catch(() => setFriends([]))
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: T.pageBg }]}>
          <LinearGradient colors={['#8B5CF6', '#6B4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
          <View style={styles.handle} />
          <View style={[styles.sheetHeader, { borderBottomColor: T.divider }]}>
            <Text style={[styles.sheetTitle, { color: T.text }]}>{tr('friends.addButton')}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={T.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#6B4DFF" />
              </View>
            ) : friends.length === 0 ? (
              <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.noFriends')}</Text>
            ) : (
              <View style={[styles.listCard, { backgroundColor: T.cardBg }]}>
                {friends.map((f, i) => (
                  <Pressable key={f.friendshipId} onPress={() => onPick(f.user)}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
                    <View style={styles.friendRow}>
                      <FriendAvatar name={f.user.displayName} id={f.user.id} size={44} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.friendName, { color: T.text }]}>{f.user.displayName}</Text>
                        {f.user.username ? <Text style={[styles.friendUser, { color: T.textSecondary }]}>@{f.user.username}</Text> : null}
                      </View>
                      <Feather name="chevron-right" size={18} color="#C2C6CE" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, maxHeight: '80%', overflow: 'hidden' },
  accent: { height: 5, width: '100%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#C9CCD4', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
  sheetBody: { padding: 18 },
  center: { paddingVertical: 30 },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  listCard: { borderRadius: 18, overflow: 'hidden' },
  divider: { height: 1, marginLeft: 60 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  friendName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  friendUser: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 1 },
});