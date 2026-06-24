import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../../components/StatusBar';

const PARTICIPANTS = [
  { rank: 4, initials: 'YA', name: 'Yasmine A. (toi)', xp: 1250, me: true },
  { rank: 5, initials: 'AR', name: 'Amine R.', xp: 1180 },
  { rank: 6, initials: 'LD', name: 'Leïla D.', xp: 1050 },
  { rank: 7, initials: 'OK', name: 'Oussama K.', xp: 990 },
  { rank: 8, initials: 'MT', name: 'Maryam T.', xp: 870 },
  { rank: 9, initials: 'HB', name: 'Hicham B.', xp: 720, releg: true },
];

export default function LiguesScreen() {
  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ligues</Text>
          <View style={styles.infoBtn}>
            <Feather name="help-circle" size={20} color="#7A828F" />
          </View>
        </View>

        {/* Carte ligue or */}
        <LinearGradient colors={['#F0A41E', '#E07A0C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldCard}>
          <View style={styles.goldRow}>
            <View style={styles.trophyBox}>
              <Feather name="award" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.goldTitle}>Ligue Or</Text>
              <Text style={styles.goldSub}>Semaine 23 · 30 participants</Text>
            </View>
          </View>
          <View style={styles.goldChip}>
            <View style={styles.goldChipLeft}>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.goldChipText}>Top 3 → Ligue Émeraude</Text>
            </View>
            <Text style={styles.goldChipText}>3 j 14 h</Text>
          </View>
        </LinearGradient>

        {/* Podium */}
        <View style={styles.crownWrap}>
          <Feather name="award" size={26} color="#E0A02C" />
        </View>
        <View style={styles.podium}>
          {/* 2e */}
          <View style={[styles.podCol, { width: 100 }]}>
            <View style={[styles.podAvatar, { backgroundColor: '#AEB6C2', width: 60, height: 60 }]}>
              <Text style={styles.podAvatarText}>SB</Text>
            </View>
            <View style={[styles.podBlock, { backgroundColor: '#E6E8EE', paddingTop: 18 }]}>
              <Text style={[styles.podRank, { color: '#6B7280', fontSize: 22 }]}>2</Text>
              <Text style={styles.podName}>Sarah B.</Text>
              <Text style={styles.podXp}>1480 XP</Text>
            </View>
          </View>
          {/* 1er */}
          <View style={[styles.podCol, { width: 108 }]}>
            <View style={[styles.podAvatar, { backgroundColor: '#F0A41E', width: 66, height: 66 }]}>
              <Text style={[styles.podAvatarText, { fontSize: 20 }]}>IM</Text>
            </View>
            <View style={[styles.podBlock, { backgroundColor: '#FBEAC9', paddingTop: 22 }]}>
              <Text style={[styles.podRank, { color: '#E07A0C', fontSize: 26 }]}>1</Text>
              <Text style={styles.podName}>Idriss M.</Text>
              <Text style={styles.podXp}>1620 XP</Text>
            </View>
          </View>
          {/* 3e */}
          <View style={[styles.podCol, { width: 100 }]}>
            <View style={[styles.podAvatar, { backgroundColor: '#D79A2B', width: 58, height: 58 }]}>
              <Text style={styles.podAvatarText}>KN</Text>
            </View>
            <View style={[styles.podBlock, { backgroundColor: '#F4E4C4', paddingTop: 14 }]}>
              <Text style={[styles.podRank, { color: '#B07A1C', fontSize: 20 }]}>3</Text>
              <Text style={styles.podName}>Khadija N.</Text>
              <Text style={styles.podXp}>1320 XP</Text>
            </View>
          </View>
        </View>

        {/* Liste participants */}
        <View style={styles.list}>
          {PARTICIPANTS.map((p, i) => (
            <View
              key={p.rank}
              style={[
                styles.listRow,
                p.me && { backgroundColor: '#EFEBFF' },
                i > 0 && !p.me && styles.listBorder,
              ]}
            >
              <Text style={[styles.rankNum, p.me && { color: '#6B4DFF' }, p.releg && { color: '#FF4B4B' }]}>
                {p.rank}
              </Text>
              <View style={[styles.avatar, { backgroundColor: p.me ? '#6B4DFF' : '#D7D2C4' }]}>
                <Text style={styles.avatarText}>{p.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, p.me && { color: '#1B2333', fontFamily: 'Nunito_800ExtraBold' }]}>
                  {p.name}
                </Text>
                {p.releg && <Text style={styles.relegText}>Zone de relégation</Text>}
              </View>
              <View style={styles.xpRow}>
                <Feather name="zap" size={17} color={p.me ? '#6B4DFF' : '#6B7280'} />
                <Text style={[styles.xpText, { color: p.me ? '#6B4DFF' : '#6B7280' }]}>{p.xp}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { paddingHorizontal: 22, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333' },
  infoBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  goldCard: {
    borderRadius: 22, padding: 22,
    shadowColor: '#E07A0C', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.32, shadowRadius: 28, elevation: 8,
  },
  goldRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trophyBox: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  goldTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff' },
  goldSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff', opacity: 0.9 },
  goldChip: {
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  goldChipLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goldChipText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff' },
  crownWrap: { alignItems: 'center', marginTop: 18, marginBottom: 4 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18 },
  podCol: { alignItems: 'center' },
  podAvatar: {
    borderRadius: 33, alignItems: 'center', justifyContent: 'center',
    marginBottom: -12, zIndex: 2,
  },
  podAvatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#fff' },
  podBlock: { width: '100%', borderTopLeftRadius: 14, borderTopRightRadius: 14, paddingBottom: 14, paddingHorizontal: 6, alignItems: 'center' },
  podRank: { fontFamily: 'Baloo2_800ExtraBold' },
  podName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#1B2333', marginTop: 6 },
  podXp: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99' },
  list: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listBorder: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  rankNum: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#9AA0AA', width: 18 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  name: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#1B2333' },
  relegText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#FF4B4B' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpText: { fontFamily: 'Nunito_700Bold', fontSize: 15 },
});
