import { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../../components/StatusBar';
import { useTheme } from '../../../utils/useTheme';

const TOP3 = [
  { rank: 2, initials: 'SB', name: 'Sarah B.',   xp: 1480, height: 86,  size: 62, colors: ['#C4CCD8', '#9AA4B2'] as const, block: ['#EEF0F4', '#E1E5EC'] as const, accent: '#7A8595', ring: 0.78 },
  { rank: 1, initials: 'IM', name: 'Idriss M.',  xp: 1620, height: 120, size: 74, colors: ['#FFD66B', '#F0A41E'] as const, block: ['#FBEAC9', '#F6D89C'] as const, accent: '#E07A0C', ring: 1.0 },
  { rank: 3, initials: 'KN', name: 'Khadija N.', xp: 1320, height: 64,  size: 58, colors: ['#E6B07A', '#C67E3A'] as const, block: ['#F4E3CE', '#EBD3B4'] as const, accent: '#B5701F', ring: 0.66 },
];

const PARTICIPANTS = [
  { rank: 4, initials: 'YA', name: 'Yasmine A. (toi)', xp: 1250, me: true },
  { rank: 5, initials: 'AR', name: 'Amine R.', xp: 1180 },
  { rank: 6, initials: 'LD', name: 'Leïla D.', xp: 1050 },
  { rank: 7, initials: 'OK', name: 'Oussama K.', xp: 990 },
  { rank: 8, initials: 'MT', name: 'Maryam T.', xp: 870 },
  { rank: 9, initials: 'HB', name: 'Hicham B.', xp: 720, releg: true },
];

const ME = PARTICIPANTS.find((p) => p.me)!;

/** Anneau de progression décoratif autour d'un avatar podium (segments). */
function Ring({ size, ratio, color }: { size: number; ratio: number; color: string }) {
  const segs = 28;
  const r = size / 2 + 5;
  const lit = Math.round(segs * ratio);
  return (
    <View style={{ position: 'absolute', width: r * 2, height: r * 2, top: -5, left: -5 }}>
      {Array.from({ length: segs }).map((_, i) => {
        const a = (i / segs) * 2 * Math.PI - Math.PI / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: r + r * Math.cos(a) - 2,
              top: r + r * Math.sin(a) - 2,
              width: 4, height: 4, borderRadius: 2,
              backgroundColor: i < lit ? color : 'rgba(0,0,0,0.06)',
            }}
          />
        );
      })}
    </View>
  );
}

export default function LiguesScreen() {
  const T = useTheme();
  // Animation d'entrée des lignes du classement (cascade).
  const rows = useRef(PARTICIPANTS.map(() => new Animated.Value(0))).current;
  const podium = useRef(TOP3.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      90,
      podium.map((v) =>
        Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 })
      )
    ).start();
    Animated.stagger(
      70,
      rows.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: T.text }]}>Ligues</Text>
          <View style={[styles.infoBtn, { backgroundColor: T.cardBg }]}>
            <Feather name="help-circle" size={20} color="#7A828F" />
          </View>
        </View>

        {/* Carte ligue or */}
        <LinearGradient colors={['#FFC247', '#F0A41E', '#E07A0C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldCard}>
          <View style={styles.goldGlow} />
          <View style={styles.goldGlow2} />
          <View style={styles.goldRow}>
            <View style={styles.trophyBox}>
              <Feather name="award" size={30} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goldTitle}>Ligue Or</Text>
              <Text style={styles.goldSub}>Semaine 23 · 30 participants</Text>
            </View>
            <View style={styles.divisionBadge}>
              <Feather name="star" size={13} color="#fff" />
              <Text style={styles.divisionText}>IV</Text>
            </View>
          </View>
          <View style={styles.goldChip}>
            <View style={styles.goldChipLeft}>
              <View style={styles.goldChipIcon}>
                <Feather name="trending-up" size={15} color="#E07A0C" />
              </View>
              <Text style={styles.goldChipText}>Top 3 → Ligue Émeraude</Text>
            </View>
            <View style={styles.goldChipLeft}>
              <Feather name="clock" size={14} color="#fff" />
              <Text style={styles.goldChipText}>3 j 14 h</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Podium 3D ── */}
        <View style={styles.podium}>
          {TOP3.map((p, i) => {
            const first = p.rank === 1;
            return (
              <Animated.View
                key={p.rank}
                style={[
                  styles.podCol,
                  {
                    opacity: podium[i],
                    transform: [{ translateY: podium[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                  },
                ]}
              >
                {/* confettis / couronne sur le 1er */}
                {first && (
                  <View style={styles.crownRow}>
                    <Text style={styles.confetti}>✨</Text>
                    <Feather name="award" size={26} color="#E07A0C" />
                    <Text style={styles.confetti}>✨</Text>
                  </View>
                )}
                {/* avatar + anneau */}
                <View style={[styles.avatarHolder, { width: p.size, height: p.size }]}>
                  <Ring size={p.size} ratio={p.ring} color={p.accent} />
                  <LinearGradient colors={p.colors} style={[styles.podAvatar, { width: p.size, height: p.size, borderRadius: p.size / 2 }, first && styles.podAvatarGlow]}>
                    <Text style={[styles.podAvatarText, first && { fontSize: 24 }]}>{p.initials}</Text>
                  </LinearGradient>
                  <View style={[styles.medal, { backgroundColor: p.accent }]}>
                    <Text style={styles.medalText}>{p.rank}</Text>
                  </View>
                </View>
                {/* nom + xp */}
                <Text style={[styles.podName, first && { color: '#8A5A0C' }]} numberOfLines={1}>{p.name}</Text>
                <View style={[styles.podXpPill, first && { backgroundColor: '#fff' }]}>
                  <Feather name="zap" size={11} color={p.accent} />
                  <Text style={[styles.podXp, { color: p.accent }]}>{p.xp}</Text>
                </View>
                {/* marche 3D */}
                <View style={[styles.step, { height: p.height }]}>
                  <LinearGradient colors={p.block} style={styles.stepTop} />
                  <View style={[styles.stepFace, { backgroundColor: p.block[1] }]}>
                    <Text style={[styles.stepRank, { color: p.accent }]}>{p.rank}</Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Bandeau promotion */}
        <View style={styles.zoneTag}>
          <View style={[styles.zoneLine, T.isDark && { backgroundColor: '#1E4026' }]} />
          <View style={[styles.zonePill, { backgroundColor: T.isDark ? '#173322' : '#E3F7E6' }]}>
            <Feather name="chevrons-up" size={13} color="#2A9E1C" />
            <Text style={[styles.zoneText, { color: T.isDark ? '#4ED83A' : '#2A9E1C' }]}>ZONE DE PROMOTION</Text>
          </View>
          <View style={[styles.zoneLine, T.isDark && { backgroundColor: '#1E4026' }]} />
        </View>

        {/* Liste participants (animée) */}
        <View style={[styles.list, { backgroundColor: T.cardBg }]}>
          {PARTICIPANTS.map((p, i) => (
            <Animated.View
              key={p.rank}
              style={{
                opacity: rows[i],
                transform: [{ translateX: rows[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}
            >
              <View style={[styles.listRow, p.me && [styles.listRowMe, T.isDark && { backgroundColor: '#241F3D' }], i > 0 && !p.me && !PARTICIPANTS[i - 1].me && [styles.listBorder, { borderTopColor: T.divider }]]}>
                <Text style={[styles.rankNum, p.me && { color: '#6B4DFF' }, p.releg && { color: '#FF4B4B' }]}>{p.rank}</Text>
                <View style={[styles.avatar, { backgroundColor: p.me ? '#6B4DFF' : '#C9C3B4' }]}>
                  <Text style={styles.avatarText}>{p.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: T.text }, p.me && { color: T.text, fontFamily: 'Nunito_800ExtraBold' }]}>{p.name}</Text>
                  {p.releg && <Text style={styles.relegText}>Zone de relégation</Text>}
                </View>
                <View style={[styles.xpRow, p.me && [styles.xpRowMe, T.isDark && { backgroundColor: '#15131F' }]]}>
                  <Feather name="zap" size={15} color={p.me ? '#6B4DFF' : '#9AA0AA'} />
                  <Text style={[styles.xpText, { color: p.me ? '#6B4DFF' : '#6B7280' }]}>{p.xp}</Text>
                </View>
              </View>

              {PARTICIPANTS[i + 1]?.releg && (
                <View style={[styles.zoneTagInline, { backgroundColor: T.cardBg }]}>
                  <View style={[styles.zoneLine, { backgroundColor: T.isDark ? '#4A2330' : '#FBD5D5' }]} />
                  <View style={[styles.zonePill, { backgroundColor: T.isDark ? '#3A1F26' : '#FDE8E8' }]}>
                    <Feather name="chevrons-down" size={13} color="#FF4B4B" />
                    <Text style={[styles.zoneText, { color: '#FF4B4B' }]}>ZONE DE RELÉGATION</Text>
                  </View>
                  <View style={[styles.zoneLine, { backgroundColor: '#FBD5D5' }]} />
                </View>
              )}
            </Animated.View>
          ))}
        </View>

        {/* espace pour la carte sticky */}
        <View style={{ height: 86 }} />
      </ScrollView>

      {/* ── Carte « ta position » fixée au-dessus de la TabBar ── */}
      <LinearGradient colors={['#7A5CFF', '#6B4DFF']} style={styles.myCard}>
        <View style={styles.myRank}>
          <Text style={styles.myRankText}>{ME.rank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.myLabel}>Ta position</Text>
          <Text style={styles.myHint}>Plus que 70 XP pour passer 3e</Text>
        </View>
        <View style={styles.myXp}>
          <Feather name="zap" size={16} color="#fff" />
          <Text style={styles.myXpText}>{ME.xp}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30 },
  infoBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },

  // Carte Or
  goldCard: {
    borderRadius: 24, padding: 22, overflow: 'hidden',
    shadowColor: '#E07A0C', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.34, shadowRadius: 28, elevation: 8,
  },
  goldGlow: { position: 'absolute', top: -50, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.18)' },
  goldGlow2: { position: 'absolute', bottom: -60, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.10)' },
  goldRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trophyBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  goldTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff' },
  goldSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#fff', opacity: 0.92 },
  divisionBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  divisionText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#fff' },
  goldChip: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goldChipLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  goldChipIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  goldChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginTop: 26, marginBottom: 8 },
  podCol: { flex: 1, alignItems: 'center', maxWidth: 120 },
  crownRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  confetti: { fontSize: 13 },
  avatarHolder: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  podAvatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  podAvatarGlow: { shadowColor: '#F0A41E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 14, elevation: 7 },
  podAvatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#fff' },
  medal: { position: 'absolute', bottom: -8, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  medalText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#fff' },
  podName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#1B2333', maxWidth: '100%' },
  podXpPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  podXp: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  // marche 3D
  step: { width: '100%', alignItems: 'center' },
  stepTop: { width: '100%', height: 10, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  stepFace: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6 },
  stepRank: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, opacity: 0.55 },

  // Bandeaux zone
  zoneTag: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 12 },
  zoneTagInline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  zoneLine: { flex: 1, height: 1.5, backgroundColor: '#CDEBD2', borderRadius: 1 },
  zonePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  zoneText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.5 },

  // Liste
  list: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listRowMe: { backgroundColor: '#EFEBFF', borderLeftWidth: 4, borderLeftColor: '#6B4DFF' },
  listBorder: { borderTopWidth: 1 },
  rankNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#9AA0AA', width: 20, textAlign: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  name: { fontFamily: 'Nunito_700Bold', fontSize: 15 },
  relegText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#FF4B4B', marginTop: 1 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpRowMe: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  xpText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },

  // Carte « ta position » sticky
  myCard: {
    position: 'absolute', left: 16, right: 16, bottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  myRank: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  myRankText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  myLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  myHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  myXp: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  myXpText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
