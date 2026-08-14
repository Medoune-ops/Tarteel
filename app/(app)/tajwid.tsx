import { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { RECITERS, DEFAULT_RECITER_ID, reciterById } from '../../constants/reciters';
import { playSurates, AUDIO_AVAILABLE, refreshLocalSudaisCache } from '../../constants/trackPlayer';
import { fatihaFirstThenDesc } from '../../constants/sourateOrder';
import { useAudioDownloadStore } from '../../store/audioDownloadStore';
import { useT } from '../../lib/i18n';

const ALL_SOURATE_NUMBERS = Array.from({ length: 114 }, (_, i) => i + 1);

// « Écoute du Coran » (badge Tajwid) — catalogue des 114 sourates en audio
// complet. On choisit un récitateur puis une sourate : la lecture démarre et se
// poursuit en arrière-plan (écran éteint), avec file d'attente et contrôles de
// l'écran verrouillé (react-native-track-player).
export default function TajwidScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID);
  const [starting, setStarting] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const sudaisReady = useAudioDownloadStore((s) => s.sudaisReady);

  const load = useCallback(async () => {
    setError(false);
    try {
      setSourates(await swrFetch('sourates:all', fetchSourates, setSourates));
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    if (sudaisReady) refreshLocalSudaisCache(ALL_SOURATE_NUMBERS);
  }, [load, sudaisReady]));

  // Détection réseau : hors-ligne, seul Sudais (déjà téléchargé) est jouable.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsubscribe();
  }, []);

  // Force Sudais hors-ligne ; le choix normal des 4 récitateurs revient dès
  // que la connexion est détectée à nouveau (pas de dép. reciterId : on ne
  // veut pas re-déclencher ce forçage à chaque changement manuel de l'utilisateur).
  useEffect(() => {
    if (isOffline && sudaisReady && reciterId !== 'sudais') {
      setReciterId('sudais');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, sudaisReady]);

  // Ordre d'affichage : Al-Fatiha en tête, puis décroissant (114 → 2).
  const ordered = useMemo(() => (sourates ? fatihaFirstThenDesc(sourates) : []), [sourates]);

  const onPlay = useCallback(async (index: number) => {
    if (ordered.length === 0 || starting != null) return;
    // En Expo Go, le module audio natif est absent : on explique au lieu de
    // planter, mais la page (liste + récitateurs) reste entièrement visible.
    if (!AUDIO_AVAILABLE) {
      Alert.alert(
        tr('tajwid.audioAlertTitle'),
        tr('tajwid.audioAlertMessage'),
      );
      return;
    }
    setStarting(ordered[index]!.numero);
    try {
      // La file suit l'ordre AFFICHÉ (sourate suivante = suivante à l'écran).
      const lite = ordered.map((s) => ({ numero: s.numero, nom: s.nom, nomArabe: s.nomArabe }));
      await playSurates(lite, reciterById(reciterId), index);
      router.push('/(app)/coran-player');
    } catch {
      setError(true);
    } finally {
      setStarting(null);
    }
  }, [ordered, reciterId, starting, router, tr]);

  const renderRow = useCallback(
    ({ item, index }: { item: SourateListItem; index: number }) => (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          index > 0 && [styles.divider, { borderTopColor: T.divider }],
          pressed && { opacity: 0.6 },
        ]}
        onPress={() => onPlay(index)}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{item.numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nom, { color: T.text }]}>{item.nom}</Text>
          <Text style={[styles.arabe, { color: T.text }]}>{item.nomArabe}</Text>
          <Text style={[styles.versets, { color: T.textTertiary }]}>{tr('tajwid.versetsCount', { n: item.nombreVersets })}</Text>
        </View>
        {starting === item.numero
          ? <ActivityIndicator color="#8A5CF0" />
          : <Feather name="play-circle" size={26} color="#8A5CF0" />}
      </Pressable>
    ),
    [T, onPlay, starting, tr],
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      {/* Header — dégradé + trame géométrique + médaillon */}
      <LinearGradient colors={['#9A6CF5', '#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <HeaderPattern width={width} height={180} variant="arcs" />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <View style={styles.headerMedallion}>
          <Text style={styles.headerEmoji}>🎧</Text>
        </View>
        <Text style={styles.headerTitle}>{tr('tajwid.headerTitle')}</Text>
        <View style={styles.headerRule} />
        <Text style={styles.headerSub}>{tr('tajwid.headerSub')}</Text>
      </LinearGradient>

      {error ? (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('tajwid.loadError')}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryLabel}>{tr('tajwid.retry')}</Text>
          </Pressable>
        </View>
      ) : !sourates ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#8A5CF0" />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('tajwid.loading')}</Text>
        </View>
      ) : (
        <>
          {/* Bannière Expo Go : la page est visible, seule l'écoute réelle
              nécessite un development build. */}
          {!AUDIO_AVAILABLE && (
            <View style={styles.notice}>
              <Feather name="info" size={16} color="#8A5CF0" />
              <Text style={styles.noticeText}>
                {tr('tajwid.previewNotice')}
              </Text>
            </View>
          )}

          {/* Choix du récitateur — hors-ligne, seul Sudais (pré-téléchargé)
              est proposé ; le choix complet revient dès que la connexion est
              détectée à nouveau. */}
          <View style={styles.reciterWrap}>
            <Text style={[styles.reciterLabel, { color: T.textSecondary }]}>
              {isOffline ? tr('tajwid.offlineReciter') : tr('tajwid.reciter')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reciterRow}
            >
              {(isOffline ? RECITERS.filter((r) => r.id === 'sudais') : RECITERS).map((r) => {
                const active = r.id === reciterId;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setReciterId(r.id)}
                    style={[
                      styles.reciterChip,
                      { backgroundColor: active ? '#8A5CF0' : T.cardBg, borderColor: active ? '#8A5CF0' : T.border },
                    ]}
                  >
                    <Text style={[styles.reciterChipText, { color: active ? '#fff' : T.text }]}>{r.nom}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={ordered}
            keyExtractor={(s) => String(s.numero)}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={11}
            removeClippedSubviews
            ListFooterComponent={<View style={{ height: 24 }} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 16, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center',
    overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 2 },
  headerMedallion: {
    width: 68, height: 68, borderRadius: 34, marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.32)',
  },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 12 },
  headerRule: { width: 46, height: 3, borderRadius: 2, marginTop: 8, backgroundColor: '#F6B100' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 8 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#8A5CF0' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFE8FF', marginHorizontal: 18, marginTop: 14,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  noticeText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 12.5, color: '#6B4D9A' },
  reciterWrap: { paddingTop: 14 },
  reciterLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.5, marginLeft: 18, marginBottom: 8, textTransform: 'uppercase' },
  reciterRow: { paddingHorizontal: 18, gap: 8 },
  reciterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  reciterChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  content: { paddingHorizontal: 18, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1 },
  numBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFE8FF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#8A5CF0' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, marginTop: 2, writingDirection: 'rtl' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
