import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import DeviceStatusBar from '../../components/StatusBar';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { useTheme } from '../../utils/useTheme';
import { fatihaFirstThenDesc } from '../../constants/sourateOrder';
import { sourateMeaningLine } from '../../constants/sourateMeaning';
import { useUserStore } from '../../store/userStore';
import { useLectureProgressStore } from '../../store/lectureProgressStore';
import { useT } from '../../lib/i18n';
import OfflineState from '../../components/OfflineState';
import { readPersisted, writePersisted, SOURATES_CACHE_KEY } from '../../lib/api/persistentCache';

// Minuscules + suppression des accents → recherche tolérante ("fatiha" trouve
// "Al-Fâtiha", "nas" trouve "An-Nâs"…).
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ─── Palette de la maquette (Tarteel Lecture Libre) ────────────────────────
type Palette = {
  bg: string; card: string; ink: string; muted: string; track: string; chip: string;
  accent: string; accentSoft: string;
  hero: readonly [string, string, string];
  art: readonly [string, string, string];
};
const LIGHT: Palette = {
  bg: '#F4F3F8', card: '#FFFFFF', ink: '#1A1730', muted: '#6F6B84', track: '#E3DFF0', chip: '#F2F0F7',
  accent: '#6B4DFF', accentSoft: '#EEEAFF',
  hero: ['#4A31C2', '#6B4DFF', '#8A6CFF'], art: ['#9A7DFF', '#6B4DFF', '#4A31C2'],
};
const DARK: Palette = {
  bg: '#0C0B12', card: '#17151F', ink: '#EEEDF5', muted: '#918DA6', track: '#2A2638', chip: '#211E2B',
  accent: '#9A82FF', accentSoft: 'rgba(139,112,255,0.16)',
  hero: ['#130D2C', '#22165A', '#33227E'], art: ['#7A5CF5', '#5034C8', '#2E1D7A'],
};
const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };
const G150 = { start: { x: 0.25, y: 0 }, end: { x: 0.75, y: 1 } };

function PlayIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
      <Path d="M6 3.5 20 12 6 20.5z" fill={color} />
    </Svg>
  );
}

// « Lecture libre » — catalogue COMPLET des 114 sourates du Coran, indépendant
// de la progression du parcours. Recherche dans l'en-tête (nom, numéro, nom
// arabe), carte « Reprendre la lecture » (dernière sourate ouverte), puis la
// liste. Chaque ligne ouvre le lecteur de la sourate.
export default function LectureLibreScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const P = T.isDark ? DARK : LIGHT;
  const language = useUserStore((s) => s.language);
  const last = useLectureProgressStore((s) => s.last);

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      // Le catalogue ne change jamais → SWR (affichage instantané au retour).
      const fresh = await swrFetch('sourates:all', fetchSourates, (list) => {
        setSourates(list);
        writePersisted(SOURATES_CACHE_KEY, list);
      });
      setSourates(fresh);
      writePersisted(SOURATES_CACHE_KEY, fresh);
    } catch (e) {
      // Même contenu que l'écran Tajwid (les 114 sourates, immuables) : on
      // réutilise son cache disque plutôt que d'afficher une erreur.
      const cached = await readPersisted<SourateListItem[]>(SOURATES_CACHE_KEY);
      if (cached && cached.length > 0) setSourates(cached);
      else setError(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Ordre : Al-Fatiha en tête, puis décroissant (114 → 2), puis filtrage live
  // (nom sans accents, numéro en préfixe, ou nom arabe).
  const filtered = useMemo(() => {
    if (!sourates) return [];
    const ordered = fatihaFirstThenDesc(sourates);
    const q = normalize(query.trim());
    if (!q) return ordered;
    return ordered.filter(
      (s) =>
        normalize(s.nom).includes(q) ||
        String(s.numero).startsWith(q) ||
        s.nomArabe.includes(query.trim()),
    );
  }, [sourates, query]);

  const shadow = T.isDark ? styles.borderDark : styles.shadow;
  const lastIndex = filtered.length - 1;

  const renderRow = ({ item, index }: { item: SourateListItem; index: number }) => {
    const cur = last?.numero === item.numero;
    const sens = sourateMeaningLine(item.numero, language);
    const place =
      item.revelation === 'madinah' ? tr('lectureLibre.medinan')
        : item.revelation === 'makkah' ? tr('lectureLibre.meccan') : null;
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
          onPress={() => router.push(`/(app)/lecture/${item.numero}` as never)}
        >
          {/* Étoile à 8 branches : deux carrés superposés, l'un tourné de 45°. */}
          <View style={styles.star}>
            <View style={[styles.starSq, { backgroundColor: cur ? P.accent : P.accentSoft }]} />
            <View style={[styles.starSq, { backgroundColor: cur ? P.accent : P.accentSoft, transform: [{ rotate: '45deg' }] }]} />
            <Text style={[styles.starNum, { color: cur ? '#fff' : P.accent }]}>{item.numero}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowTop}>
              <Text style={[styles.nom, { color: P.ink }]} numberOfLines={1}>{item.nom}</Text>
              <Text style={[styles.arabe, { color: P.ink }]} numberOfLines={1}>{item.nomArabe}</Text>
            </View>
            {sens ? <Text style={[styles.sens, { color: P.muted }]}>{sens}</Text> : null}
            <View style={styles.chips}>
              <Text style={[styles.chip, { backgroundColor: P.chip, color: P.muted }]}>
                {tr('lectureLibre.versetsCount', { n: item.nombreVersets })}
              </Text>
              {place ? (
                <Text style={[styles.chip, { backgroundColor: P.chip, color: P.muted }]}>{place}</Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  const resumePct = last ? Math.min(100, (last.verset / Math.max(1, last.total)) * 100) : 0;

  const header = (
    <View>
      <LinearGradient colors={P.hero} locations={[0, 0.6, 1]} {...G160} style={styles.hero}>
        <View style={styles.circleBig} />
        <View style={styles.circleSmall} />
        <DeviceStatusBar />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#3B2A99" />
        </Pressable>
        <Text style={styles.heroTitle}>{tr('lectureLibre.headerTitle')}</Text>
        <Text style={styles.heroSub}>{tr('lectureLibre.headerSub')}</Text>

        <View style={styles.search}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.85)" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={tr('lectureLibre.searchPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.6)"
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

      {last && sourates ? (
        <Pressable
          onPress={() => router.push(`/(app)/lecture/${last.numero}?verset=${last.verset}` as never)}
          style={({ pressed }) => [styles.resume, { backgroundColor: P.card }, shadow, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient colors={P.art} {...G150} style={styles.resumeArt}>
            <Text style={styles.resumeArtText} numberOfLines={1} adjustsFontSizeToFit>{last.nomArabe}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.resumeLabel, { color: P.muted }]}>{tr('lectureLibre.resumeLabel')}</Text>
            <Text style={[styles.resumeName, { color: P.ink }]} numberOfLines={1}>{last.numero}. {last.nom}</Text>
            <View style={styles.resumeProgRow}>
              <View style={[styles.resumeTrack, { backgroundColor: P.track }]}>
                <View style={[styles.resumeFill, { width: `${resumePct}%`, backgroundColor: P.accent }]} />
              </View>
              <Text style={[styles.resumeCount, { color: P.muted }]}>
                {tr('lectureLibre.verseOf', { v: last.verset, n: last.total })}
              </Text>
            </View>
          </View>
          <View style={[styles.resumePlay, { backgroundColor: P.accent }]}>
            <PlayIcon size={15} color="#fff" />
          </View>
        </Pressable>
      ) : null}

      {sourates ? (
        <Text style={[styles.section, { color: P.muted }]}>{tr('lectureLibre.sectionTitle')}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      {error ? (
        <>
          {header}
          <OfflineState error={error} onRetry={load} showOfflineExits />
        </>
      ) : !sourates ? (
        <>
          {header}
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color={P.accent} />
            <Text style={[styles.stateText, { color: P.muted }]}>{tr('lectureLibre.loading')}</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.numero)}
          renderItem={renderRow}
          extraData={[last, lastIndex, P]}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={[styles.listCard, styles.listFirst, styles.listLast, { backgroundColor: P.card }]}>
              <Text style={[styles.empty, { color: P.muted }]}>
                {tr('lectureLibre.noResultsFor', { q: query.trim() })}
              </Text>
            </View>
          }
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={11}
        />
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
    paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  circleBig: {
    position: 'absolute', right: -70, top: 30, width: 240, height: 240, borderRadius: 120,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  circleSmall: {
    position: 'absolute', right: -20, top: 80, width: 140, height: 140, borderRadius: 70,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtn: {
    marginTop: 12, width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: '#fff', marginTop: 18 },
  heroSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  search: {
    marginTop: 18, height: 48, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#fff', paddingVertical: 0 },

  resume: {
    marginHorizontal: 18, marginTop: 16, padding: 14, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  resumeArt: {
    width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  resumeArtText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 17, color: '#fff' },
  resumeLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1 },
  resumeName: { fontFamily: 'Nunito_900Black', fontSize: 16, marginTop: 1 },
  resumeProgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  resumeTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  resumeFill: { height: '100%', borderRadius: 3 },
  resumeCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  resumePlay: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  section: {
    fontFamily: 'Nunito_900Black', fontSize: 12, letterSpacing: 1,
    paddingTop: 24, paddingBottom: 10, paddingHorizontal: 22,
  },

  // La liste forme une seule carte : chaque ligne porte le fond, la première
  // et la dernière arrondissent les coins.
  listCard: { marginHorizontal: 18, paddingHorizontal: 6 },
  listFirst: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 6 },
  listLast: { borderBottomLeftRadius: 22, borderBottomRightRadius: 22, paddingBottom: 6 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 16 },
  star: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  starSq: { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 7 },
  starNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, lineHeight: 16 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nom: { flexShrink: 1, fontFamily: 'Nunito_900Black', fontSize: 16 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, lineHeight: 34, writingDirection: 'rtl' },
  sens: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 8 },
  chip: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, overflow: 'hidden',
  },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  empty: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center', paddingVertical: 26, paddingHorizontal: 10 },
});
