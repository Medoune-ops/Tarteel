/**
 * Écran Hadiths — 4 recueils, navigables par thème puis par chapitre.
 *
 * Trois niveaux, sur un seul écran pour éviter une pile de navigation :
 *   recueil -> thème/chapitre -> hadiths du chapitre
 * Une recherche plein texte court-circuite les deux premiers niveaux.
 *
 * Les données sont des assets embarqués, chargés à l'ouverture seulement
 * (voir lib/hadiths.ts) : tout fonctionne hors-ligne.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
  TextInput, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import {
  COLLECTIONS, loadCollection, groupByTheme, hadithsOfChapter, searchHadiths,
  type Collection, type CollectionId, type Hadith, type ThemeGroup,
} from '../../lib/hadiths';
import { chaptersFor } from '../../constants/hadithChapters';
import { useT } from '../../lib/i18n';

export default function HadithsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();

  const [collectionId, setCollectionId] = useState<CollectionId>('nawawi');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  // Charge le recueil choisi. Les gros recueils (4,5 Mo) prennent un instant :
  // d'où l'indicateur de chargement plutôt qu'un écran figé.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setChapterId(null);
    setQuery('');
    loadCollection(collectionId)
      .then((c) => { if (!cancelled) { setCollection(c); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [collectionId]);

  const groups: ThemeGroup[] = useMemo(
    () => (collection ? groupByTheme(collection) : []),
    [collection],
  );

  const results = useMemo(
    () => (collection && query.trim().length >= 3 ? searchHadiths(collection, query) : []),
    [collection, query],
  );

  const chapterHadiths = useMemo(
    () => (collection && chapterId != null ? hadithsOfChapter(collection, chapterId) : []),
    [collection, chapterId],
  );

  const chapterLabel = useCallback(
    (id: number) => chaptersFor(collectionId)[id]?.fr ?? '',
    [collectionId],
  );

  const renderHadith = (h: Hadith) => (
    <View key={`${h.s}-${h.n}`} style={[styles.hadithCard, { backgroundColor: T.cardBg }]}>
      <Text style={styles.hadithNum}>{tr('hadiths.number', { n: h.n })}</Text>
      <Text style={[styles.hadithText, { color: T.text }]}>{h.t}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <LinearGradient
        colors={['#3C8F6B', '#2E7355', '#1F5A41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <HeaderPattern width={width} height={180} variant="arcs" />
        <Pressable
          onPress={() => (chapterId != null ? setChapterId(null) : router.back())}
          hitSlop={12}
          style={styles.back}
        >
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <View style={styles.headerMedallion}>
          <Text style={styles.headerEmoji}>📜</Text>
        </View>
        <Text style={styles.headerTitle}>
          {chapterId != null ? chapterLabel(chapterId) : tr('hadiths.headerTitle')}
        </Text>
        <View style={styles.headerRule} />
        <Text style={styles.headerSub}>
          {chapterId != null
            ? tr('hadiths.countInChapter', { n: chapterHadiths.length })
            : tr('hadiths.headerSub')}
        </Text>
      </LinearGradient>

      {/* Choix du recueil — masqué une fois dans un chapitre. */}
      {chapterId == null && (
        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {COLLECTIONS.map((c) => {
              const active = c.id === collectionId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCollectionId(c.id)}
                  style={[
                    styles.tab,
                    { backgroundColor: active ? '#2E7355' : T.cardBg, borderColor: active ? '#2E7355' : T.border },
                  ]}
                >
                  <Text style={[styles.tabText, { color: active ? '#fff' : T.text }]}>
                    {tr(`hadiths.collection.${c.id}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#2E7355" />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('hadiths.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Feather name="alert-circle" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('hadiths.loadError')}</Text>
        </View>
      ) : chapterId != null ? (
        // ── Niveau 3 : les hadiths du chapitre ──
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {chapterHadiths.map(renderHadith)}
          <View style={{ height: 28 }} />
        </ScrollView>
      ) : (
        // ── Niveaux 1-2 : recherche, puis thèmes et chapitres ──
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.searchBox, { backgroundColor: T.cardBg, borderColor: T.border }]}>
            <Feather name="search" size={18} color={T.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tr('hadiths.searchPlaceholder')}
              placeholderTextColor={T.textTertiary}
              style={[styles.searchInput, { color: T.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Feather name="x" size={18} color={T.textTertiary} />
              </Pressable>
            )}
          </View>

          {query.trim().length >= 3 ? (
            <>
              <Text style={[styles.resultCount, { color: T.textSecondary }]}>
                {tr('hadiths.results', { n: results.length })}
              </Text>
              {results.map(renderHadith)}
            </>
          ) : (
            groups.map((g) => (
              <View key={g.theme} style={styles.themeBlock}>
                <View style={styles.themeHeader}>
                  <Text style={styles.themeEmoji}>{g.emoji}</Text>
                  <Text style={[styles.themeTitle, { color: T.text }]}>
                    {tr(`hadiths.theme.${g.theme}`)}
                  </Text>
                </View>

                <View style={[styles.chapterList, { backgroundColor: T.cardBg }]}>
                  {g.chapters.map((c, i) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setChapterId(c.id)}
                      style={[styles.chapterRow, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}
                    >
                      <View style={[styles.themeDot, { backgroundColor: g.color }]} />
                      <Text style={[styles.chapterName, { color: T.text }]} numberOfLines={2}>
                        {c.fr}
                      </Text>
                      <Text style={[styles.chapterCount, { color: T.textTertiary }]}>{c.count}</Text>
                      <Feather name="chevron-right" size={18} color={T.textTertiary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center' },
  back: { position: 'absolute', left: 14, top: 54, zIndex: 2 },
  headerMedallion: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEmoji: { fontSize: 30 },
  headerTitle: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff',
    marginTop: 10, textAlign: 'center', paddingHorizontal: 30,
  },
  headerRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 8 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 8 },

  tabsWrap: { paddingTop: 14 },
  tabs: { paddingHorizontal: 20, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1.5 },
  tabText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 18,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14, padding: 0 },
  resultCount: { fontFamily: 'Nunito_700Bold', fontSize: 13, marginBottom: 10 },

  themeBlock: { marginBottom: 22 },
  themeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  themeEmoji: { fontSize: 18 },
  themeTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },

  chapterList: { borderRadius: 16, overflow: 'hidden' },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  divider: { borderTopWidth: 1 },
  themeDot: { width: 8, height: 8, borderRadius: 4 },
  chapterName: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14 },
  chapterCount: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },

  hadithCard: {
    borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  hadithNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#2E7355', marginBottom: 6 },
  hadithText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 22 },
});
