import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, ScrollView, Alert, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { readPersisted, writePersisted, SOURATES_CACHE_KEY } from '../../lib/api/persistentCache';
import { RECITERS, reciterById } from '../../constants/reciters';
import {
  playSurates,
  changeReciter,
  getCurrentReciterId,
  getCurrentSourates,
  useActiveTrack,
  useProgress,
  useIsPlaying,
  audioControls,
  AUDIO_AVAILABLE,
  AUDIO_UNEXPECTEDLY_MISSING,
  AUDIO_LOAD_ERROR,
  refreshLocalSudaisCache,
} from '../../constants/trackPlayer';
import { fatihaFirstThenDesc } from '../../constants/sourateOrder';
import { sourateMeaning } from '../../constants/sourateMeaning';
import { fetchSudaisTotalMb } from '../../constants/audioDownload';
import {
  LISTEN_LIGHT, LISTEN_DARK, G160, G140, G150, RECITER_AVATAR,
} from '../../constants/coranListenTheme';
import { PlayGlyph, PauseGlyph, PrevGlyph, NextGlyph, MoonGlyph, EqGlyph } from '../../components/ListenIcons';
import { useAudioDownloadStore } from '../../store/audioDownloadStore';
import { useCoranListenStore } from '../../store/coranListenStore';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

const ALL_SOURATE_NUMBERS = Array.from({ length: 114 }, (_, i) => i + 1);

// Minuscules + suppression des accents → recherche tolérante.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// « Écoute du Coran » (badge Tajwid) — catalogue des 114 sourates en audio
// complet. On choisit un récitateur puis une sourate : la lecture démarre et se
// poursuit en arrière-plan (écran éteint). Le mini-lecteur en bas de l'écran
// ouvre le lecteur plein écran (coran-player.tsx).
export default function TajwidScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const P = T.isDark ? LISTEN_DARK : LISTEN_LIGHT;
  const language = useUserStore((s) => s.language);

  const track = useActiveTrack();
  const { position, duration } = useProgress(500);
  const { playing } = useIsPlaying();
  const currentNumero = track?.id ? Number(track.id) : null;

  const reciterId = useCoranListenStore((s) => s.reciterId);
  const setReciterId = useCoranListenStore((s) => s.setReciterId);

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [query, setQuery] = useState('');
  const sudaisReady = useAudioDownloadStore((s) => s.sudaisReady);

  const load = useCallback(async () => {
    setError(false);
    try {
      const fresh = await swrFetch('sourates:all', fetchSourates, (list) => {
        setSourates(list);
        writePersisted(SOURATES_CACHE_KEY, list);
      });
      setSourates(fresh);
      // Les 114 sourates ne changent jamais : on les garde sur le disque pour
      // pouvoir rouvrir cet écran sans réseau.
      writePersisted(SOURATES_CACHE_KEY, fresh);
    } catch (e) {
      // Hors-ligne : le cache mémoire (swr.ts) est vide après un redémarrage,
      // mais le disque, lui, a survécu — c'est ce qui rend les récitations
      // déjà téléchargées réellement écoutables sans connexion.
      console.warn('[tajwid] chargement des sourates échoué, repli sur le cache disque :', e);
      const cached = await readPersisted<SourateListItem[]>(SOURATES_CACHE_KEY);
      if (cached && cached.length > 0) setSourates(cached);
      else setError(true);
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
  // que la connexion est détectée à nouveau.
  useEffect(() => {
    if (isOffline && sudaisReady && reciterId !== 'sudais') {
      setReciterId('sudais');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, sudaisReady]);

  // Ordre d'affichage : Al-Fatiha en tête, puis décroissant (114 → 2).
  const ordered = useMemo(() => (sourates ? fatihaFirstThenDesc(sourates) : []), [sourates]);

  // Filtrage live (nom sans accents, numéro en préfixe, ou nom arabe).
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ordered;
    return ordered.filter(
      (s) => normalize(s.nom).includes(q) || String(s.numero).startsWith(q) || s.nomArabe.includes(query.trim()),
    );
  }, [ordered, query]);

  /** Choisit un récitateur ; si une sourate joue, on bascule sans perdre la position. */
  const onPickReciter = useCallback((id: string) => {
    setReciterId(id);
    if (track && getCurrentReciterId() !== id) {
      changeReciter(reciterById(id)).catch((e) => {
        console.error('[audio] changement de récitateur impossible', e);
      });
    }
  }, [setReciterId, track]);

  const onPlay = useCallback(async (item: SourateListItem) => {
    if (ordered.length === 0 || starting != null) return;
    // Module audio natif absent : on explique au lieu de planter, la page
    // (liste + récitateurs) reste entièrement visible.
    if (!AUDIO_AVAILABLE) {
      Alert.alert(
        tr('tajwid.audioAlertTitle'),
        AUDIO_UNEXPECTEDLY_MISSING
          ? tr('tajwid.audioBrokenMessage') + (AUDIO_LOAD_ERROR ? `\n\n(${AUDIO_LOAD_ERROR})` : '')
          : tr('tajwid.audioAlertMessage'),
      );
      return;
    }
    // La sourate en cours : on bascule lecture/pause plutôt que de la relancer.
    if (currentNumero === item.numero) {
      if (playing) audioControls.pause(); else audioControls.play();
      return;
    }
    setStarting(item.numero);
    try {
      // La file suit l'ordre COMPLET affiché (sourate suivante = suivante à
      // l'écran), même quand une recherche filtre la liste.
      const index = ordered.findIndex((s) => s.numero === item.numero);
      const lite = ordered.map((s) => ({
        numero: s.numero, nom: s.nom, nomArabe: s.nomArabe,
        nombreVersets: s.nombreVersets, revelation: s.revelation ?? undefined,
      }));
      await playSurates(lite, reciterById(reciterId), Math.max(0, index));
    } catch (e) {
      // Un échec de lecture ne doit PAS remplacer la liste par l'écran
      // d'erreur : hors-ligne, les sourates déjà téléchargées restent
      // écoutables. L'erreur reste visible dans les logs pour le diagnostic.
      console.error('[audio] échec de lecture de la sourate', item.numero, e);
      Alert.alert(tr('tajwid.audioAlertTitle'), tr('tajwid.playError'));
    } finally {
      setStarting(null);
    }
  }, [ordered, reciterId, starting, currentNumero, playing, tr]);

  const shadow = T.isDark ? styles.borderDark : styles.shadow;
  const lastIndex = filtered.length - 1;
  const reciters = isOffline ? RECITERS.filter((r) => r.id === 'sudais') : RECITERS;
  const reciterName = reciterById(reciterId).nom;

  const renderRow = ({ item, index }: { item: SourateListItem; index: number }) => {
    const cur = currentNumero === item.numero;
    const fr = sourateMeaning(item.numero, language);
    const meta = [fr, tr('tajwid.versetsCount', { n: item.nombreVersets })].filter(Boolean).join(' · ');
    return (
      <View
        style={[
          styles.listCard,
          { backgroundColor: P.card },
          index === 0 && styles.listFirst,
          index === lastIndex && styles.listLast,
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: cur ? P.accentSoft : 'transparent' },
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => onPlay(item)}
        >
          <View style={[styles.numBadge, { backgroundColor: cur ? P.accent : P.accentSoft }]}>
            {starting === item.numero ? (
              <ActivityIndicator size="small" color={P.accent} />
            ) : cur ? (
              <EqGlyph color="#fff" />
            ) : (
              <Text style={[styles.numText, { color: P.accent }]}>{item.numero}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.nom, { color: cur ? P.accent : P.ink }]} numberOfLines={1}>{item.nom}</Text>
            <Text style={[styles.meta, { color: P.muted }]} numberOfLines={1}>{meta}</Text>
          </View>
          <Text style={[styles.arabe, { color: P.ink }]} numberOfLines={1}>{item.nomArabe}</Text>
        </Pressable>
      </View>
    );
  };

  const header = (
    <View>
      <LinearGradient colors={P.hero} locations={[0, 0.6, 1]} {...G160} style={styles.hero}>
        <DeviceStatusBar />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#3B2A99" />
          </Pressable>
          <View style={styles.bgPill}>
            <MoonGlyph size={14} color="#fff" />
            <Text style={styles.bgPillText}>{tr('tajwid.background')}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{tr('tajwid.headerTitle')}</Text>
        <Text style={styles.heroSub}>{tr('tajwid.headerSub')}</Text>

        <View style={styles.search}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.75)" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={tr('tajwid.searchPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.75)"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.85)" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* Bannière : la page reste visible, seule l'écoute est indisponible. */}
      {!AUDIO_AVAILABLE && (
        <View style={[styles.notice, { backgroundColor: P.accentSoft }]}>
          <Feather name="info" size={16} color={P.accent} />
          <Text style={[styles.noticeText, { color: P.accent }]}>
            {AUDIO_UNEXPECTEDLY_MISSING ? tr('tajwid.previewNoticeBroken') : tr('tajwid.previewNotice')}
          </Text>
        </View>
      )}

      {/* Choix du récitateur — hors-ligne, seul Sudais (pré-téléchargé). */}
      <Text style={[styles.section, { color: P.muted }]}>
        {(isOffline ? tr('tajwid.offlineReciter') : tr('tajwid.reciter')).toUpperCase()}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
        {reciters.map((r) => {
          const sel = r.id === reciterId;
          const av = RECITER_AVATAR[r.id] ?? { ini: r.nom.slice(0, 2).toUpperCase(), colors: ['#7C5BF0', '#4F35C9'] as const };
          return (
            <Pressable
              key={r.id}
              onPress={() => onPickReciter(r.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              style={[
                styles.recCard,
                { backgroundColor: sel ? P.recSel : P.card, borderColor: sel ? P.accent : 'transparent' },
              ]}
            >
              <View style={[styles.recRing, sel && { borderColor: P.accent }]}>
                <LinearGradient colors={av.colors} {...G140} style={styles.recAvatar}>
                  <Text style={styles.recIni}>{av.ini}</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.recName, { color: P.ink }]} numberOfLines={2}>{r.nom}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Téléchargement pour l'écoute sans connexion — masqué hors-ligne tant
          qu'il n'a pas abouti (il ne pourrait de toute façon pas progresser). */}
      {(!isOffline || sudaisReady) && <OfflineCard P={P} shadowStyle={shadow} />}

      {sourates ? (
        <Text style={[styles.section, { color: P.muted, paddingTop: 24 }]}>{tr('tajwid.sectionTitle')}</Text>
      ) : null}
    </View>
  );

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const curLite = currentNumero != null ? getCurrentSourates().find((s) => s.numero === currentNumero) : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      {error ? (
        <>
          {header}
          <View style={styles.stateBox}>
            <Feather name="wifi-off" size={32} color={P.muted} />
            <Text style={[styles.stateText, { color: P.muted }]}>{tr('tajwid.loadError')}</Text>
            <Pressable style={[styles.retryBtn, { backgroundColor: P.accent }]} onPress={load}>
              <Text style={styles.retryLabel}>{tr('tajwid.retry')}</Text>
            </Pressable>
          </View>
        </>
      ) : !sourates ? (
        <>
          {header}
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={P.accent} />
            <Text style={[styles.stateText, { color: P.muted }]}>{tr('tajwid.loading')}</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.numero)}
          renderItem={renderRow}
          extraData={[currentNumero, starting, lastIndex, P, language]}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={[styles.listCard, styles.listFirst, styles.listLast, { backgroundColor: P.card }]}>
              <Text style={[styles.empty, { color: P.muted }]}>{tr('tajwid.noResultsFor', { q: query.trim() })}</Text>
            </View>
          }
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={11}
        />
      )}

      {/* Mini-lecteur de la maquette — remplace ici le MiniPlayer global. */}
      {track ? (
        <Pressable
          onPress={() => router.push('/(app)/coran-player')}
          accessibilityLabel={tr('tajwid.openPlayer')}
          style={[styles.mini, { backgroundColor: P.mini, bottom: 14 + insets.bottom }]}
        >
          <View style={[styles.miniTrack, { backgroundColor: P.line }]}>
            <View style={[styles.miniFill, { width: `${progress * 100}%`, backgroundColor: P.accent }]} />
          </View>
          <View style={styles.miniRow}>
            <LinearGradient colors={P.art} {...G150} style={styles.miniArt}>
              <Text style={styles.miniArtText} numberOfLines={1} adjustsFontSizeToFit>{curLite?.nomArabe ?? ''}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.miniTitle, { color: P.ink }]} numberOfLines={1}>{track.title ?? ''}</Text>
              <Text style={[styles.miniArtist, { color: P.muted }]} numberOfLines={1}>{track.artist ?? reciterName}</Text>
            </View>
            <Pressable
              hitSlop={6}
              style={styles.miniCtl}
              accessibilityLabel={tr('coranPlayer.prev')}
              onPress={(e) => { e?.stopPropagation?.(); audioControls.skipToPrevious(); }}
            >
              <PrevGlyph size={22} color={P.ink} />
            </Pressable>
            <Pressable
              style={[styles.miniPlay, { backgroundColor: P.accent }]}
              accessibilityLabel={playing ? tr('lectureNumero.pause') : tr('lectureNumero.play')}
              onPress={(e) => { e?.stopPropagation?.(); if (playing) audioControls.pause(); else audioControls.play(); }}
            >
              {playing ? <PauseGlyph size={18} color="#fff" /> : <PlayGlyph size={18} color="#fff" />}
            </Pressable>
            <Pressable
              hitSlop={6}
              style={styles.miniCtl}
              accessibilityLabel={tr('coranPlayer.next')}
              onPress={(e) => { e?.stopPropagation?.(); audioControls.skipToNext(); }}
            >
              <NextGlyph size={22} color={P.ink} />
            </Pressable>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Carte « Mode hors-ligne » : téléchargement des récitations de Cheikh Sudais
 * (seul récitateur disponible hors-ligne côté serveur).
 *
 * La maquette propose « Pause » pendant le téléchargement : le store ne sait
 * pas encore suspendre un téléchargement, le bouton est donc désactivé
 * pendant qu'il tourne (il reprend là où il s'est arrêté après un échec).
 */
function OfflineCard({ P, shadowStyle }: { P: typeof LISTEN_LIGHT; shadowStyle: object }) {
  const tr = useT();
  const sudaisReady = useAudioDownloadStore((s) => s.sudaisReady);
  const isDownloading = useAudioDownloadStore((s) => s.isDownloading);
  const downloadedCount = useAudioDownloadStore((s) => s.downloadedCount);
  const totalCount = useAudioDownloadStore((s) => s.totalCount);
  const lastError = useAudioDownloadStore((s) => s.lastError);
  const startDownload = useAudioDownloadStore((s) => s.startDownload);

  // Poids annoncé avant de lancer : engager ~600 Mo sans le savoir est le
  // genre de surprise qui fait désinstaller une app.
  const [totalMb, setTotalMb] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchSudaisTotalMb().then((mb) => { if (!cancelled) setTotalMb(mb); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const pct = totalCount > 0 ? Math.round((downloadedCount / totalCount) * 100) : 0;
  const name = reciterById('sudais').nom;
  const unavailable = lastError === 'unavailable';

  const sub = sudaisReady
    ? totalMb != null ? tr('offlineAudio.subDone', { mb: totalMb }) : tr('offlineAudio.subDoneNoSize')
    : isDownloading ? tr('offlineAudio.subProgress', { pct })
    : unavailable ? tr('offlineAudio.unavailable')
    : lastError === 'failed' ? tr('offlineAudio.subFailed')
    : totalMb != null ? tr('offlineAudio.subIdle', { mb: totalMb, name }) : tr('offlineAudio.subIdleNoSize', { name });

  const btn = sudaisReady ? tr('offlineAudio.btnDone')
    : isDownloading ? tr('offlineAudio.btnBusy')
    : lastError === 'failed' ? tr('offlineAudio.btnRetry')
    : tr('offlineAudio.btnDownload');
  const disabled = sudaisReady || isDownloading || unavailable;

  return (
    <View style={[styles.offCard, { backgroundColor: P.card }, shadowStyle]}>
      <View style={[styles.offIcon, { backgroundColor: P.accentSoft }]}>
        <Feather name="download" size={20} color={P.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.offTitle, { color: P.ink }]}>{tr('offlineAudio.title')}</Text>
        <Text style={[styles.offSub, { color: P.muted }]} numberOfLines={2}>{sub}</Text>
        {isDownloading ? (
          <View style={[styles.offTrack, { backgroundColor: P.line }]}>
            <View style={[styles.offFill, { width: `${pct}%`, backgroundColor: P.accent }]} />
          </View>
        ) : null}
      </View>
      {unavailable ? null : (
        <Pressable
          onPress={startDownload}
          disabled={disabled}
          style={[styles.offBtn, { backgroundColor: P.accent, opacity: disabled ? 0.5 : 1 }]}
        >
          <Text style={styles.offBtnText}>{btn}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shadow: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  borderDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  hero: {
    paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  heroTop: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  bgPill: {
    height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  bgPillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: '#fff', marginTop: 20 },
  heroSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  search: {
    marginTop: 18, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#fff', paddingVertical: 0 },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  noticeText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 12.5 },

  section: {
    fontFamily: 'Nunito_900Black', fontSize: 12, letterSpacing: 1,
    paddingTop: 22, paddingBottom: 10, paddingHorizontal: 22,
  },

  recRow: { paddingHorizontal: 18, paddingBottom: 4, gap: 10 },
  recCard: {
    width: 96, paddingTop: 12, paddingBottom: 10, paddingHorizontal: 8, borderRadius: 20, borderWidth: 2,
    alignItems: 'center', gap: 8,
  },
  // Anneau de sélection (box-shadow 3px fond + 2px accent de la maquette).
  recRing: { padding: 3, borderRadius: 32, borderWidth: 2, borderColor: 'transparent' },
  recAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  recIni: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  recName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, lineHeight: 15, textAlign: 'center' },

  offCard: {
    marginHorizontal: 18, marginTop: 14, paddingVertical: 14, paddingLeft: 16, paddingRight: 14, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  offIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  offTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  offSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 1 },
  offTrack: { height: 4, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  offFill: { height: '100%' },
  offBtn: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12 },
  offBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },

  // La liste forme une seule carte : la première et la dernière ligne
  // arrondissent les coins.
  listCard: { marginHorizontal: 18, paddingHorizontal: 6 },
  listFirst: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 6 },
  listLast: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, paddingBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 16,
  },
  numBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  meta: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 1 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, lineHeight: 34, writingDirection: 'rtl' },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  empty: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center', paddingVertical: 26, paddingHorizontal: 10 },

  mini: {
    position: 'absolute', left: 10, right: 10, borderRadius: 22, overflow: 'hidden',
    shadowColor: '#140A32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 10,
  },
  miniTrack: { height: 3 },
  miniFill: { height: '100%' },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 12, paddingLeft: 12, paddingRight: 10 },
  miniArt: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  miniArtText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 15, color: '#fff' },
  miniTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  miniArtist: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  miniCtl: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  miniPlay: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
