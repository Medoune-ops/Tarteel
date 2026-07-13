import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { useTheme } from '../../utils/useTheme';
import { fatihaFirstThenDesc } from '../../constants/sourateOrder';
import { useT } from '../../lib/i18n';

// Minuscules + suppression des accents → recherche tolérante ("fatiha" trouve
// "Al-Fâtiha", "nas" trouve "An-Nâs"…).
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// « Lecture libre » — catalogue COMPLET des 114 sourates du Coran (en arabe),
// indépendant de la progression du parcours. Une barre de recherche filtre les
// sourates dès la première lettre (par nom, numéro ou nom arabe). Chaque ligne
// ouvre le lecteur audio qui récite la sourate en entier, sans arrêt.
export default function LectureLibreScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(false);
    try {
      // Le catalogue ne change jamais → SWR (affichage instantané au retour).
      setSourates(await swrFetch('sourates:all', fetchSourates, setSourates));
    } catch {
      setError(true);
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

  const renderRow = useCallback(
    ({ item, index }: { item: SourateListItem; index: number }) => (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          index > 0 && [styles.divider, { borderTopColor: T.divider }],
          pressed && { opacity: 0.6 },
        ]}
        onPress={() => router.push(`/(app)/lecture/${item.numero}` as never)}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{item.numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {/* Nom de la sourate — permet de la reconnaître d'un coup d'œil. */}
          <Text style={[styles.nom, { color: T.text }]}>{item.nom}</Text>
          <Text style={[styles.arabe, { color: T.text }]}>{item.nomArabe}</Text>
          <Text style={[styles.versets, { color: T.textTertiary }]}>{tr('lectureLibre.versetsCount', { n: item.nombreVersets })}</Text>
        </View>
        <Feather name="play-circle" size={26} color="#6B4DFF" />
      </Pressable>
    ),
    [T, router, tr],
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerEmoji}>🎧</Text>
        <Text style={styles.headerTitle}>{tr('lectureLibre.headerTitle')}</Text>
        <Text style={styles.headerSub}>{tr('lectureLibre.headerSub')}</Text>
      </LinearGradient>

      {error ? (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('lectureLibre.loadError')}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryLabel}>{tr('lectureLibre.retry')}</Text>
          </Pressable>
        </View>
      ) : !sourates ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#6B4DFF" />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('lectureLibre.loading')}</Text>
        </View>
      ) : (
        <>
          {/* Barre de recherche */}
          <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.border }]}>
            <Feather name="search" size={18} color={T.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: T.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder={tr('lectureLibre.searchPlaceholder')}
              placeholderTextColor={T.textTertiary}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x" size={18} color={T.textTertiary} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(s) => String(s.numero)}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 34 }}>🔍</Text>
                <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('lectureLibre.noResults')}</Text>
              </View>
            }
            ListFooterComponent={<View style={{ height: 24 }} />}
            // Défilement infini fluide : la liste virtualise les lignes et n'en
            // rend qu'un écran à la fois, puis d'autres au fil du défilement.
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={11}
            removeClippedSubviews
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 54, left: 16 },
  headerEmoji: { fontSize: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginTop: 14, marginBottom: 2,
    paddingHorizontal: 14, height: 48, borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 15, paddingVertical: 0 },

  content: { paddingHorizontal: 18, paddingTop: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1 },
  numBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, marginTop: 2, writingDirection: 'rtl' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
