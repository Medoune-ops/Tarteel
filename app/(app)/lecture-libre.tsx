import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderPattern from '../../components/HeaderPattern';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { useTheme } from '../../utils/useTheme';
import { fatihaFirstThenDesc } from '../../constants/sourateOrder';
import { sourateMeaning } from '../../constants/sourateMeaning';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';
import OfflineState from '../../components/OfflineState';
import { readPersisted, writePersisted, SOURATES_CACHE_KEY } from '../../lib/api/persistentCache';

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
  const language = useUserStore((s) => s.language);
  const { width } = useWindowDimensions();

  /*
   * En-tête qui se comprime au défilement : de 190 à 86 pixels.
   *
   * Le médaillon, le filet et le sous-titre replient leur HAUTEUR, pas
   * seulement leur opacité — un élément transparent occupe toujours sa place
   * et pousserait le reste hors du cadre. Le titre, lui, est posé à une
   * coordonnée animée plutôt que laissé au flux : il glisse de sa position
   * centrée vers la barre, sans rien devoir à ses voisins.
   */
  const OUVERT = 190;
  const FERME = 86;
  const COURSE = OUVERT - FERME;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const hdrHauteur = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, COURSE], [OUVERT, FERME], Extrapolation.CLAMP),
  }));
  const hdrMedaillon = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [72, 0], Extrapolation.CLAMP),
  }));
  const hdrRule = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.4], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [3, 0], Extrapolation.CLAMP),
    // Le titre étant posé en absolu, il ne pousse plus rien : le filet réserve
    // lui-même la hauteur du titre (32) plus sa respiration, sinon les trois
    // éléments se superposent.
    marginTop: interpolate(scrollY.value, [0, COURSE], [44, 0], Extrapolation.CLAMP),
  }));
  const hdrSous = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [20, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, COURSE], [8, 0], Extrapolation.CLAMP),
  }));
  /*
   * Position du titre au repos : sous le médaillon.
   *   52 (marge haute du corps) + 72 (médaillon) + 12 (respiration) = 136.
   * Le filet et le sous-titre réservent ensuite leur propre place sous lui.
   */
  const hdrTitre = useAnimatedStyle(() => ({
    top: interpolate(scrollY.value, [0, COURSE], [126, 48], Extrapolation.CLAMP),
    left: interpolate(scrollY.value, [0, COURSE], [24, 54], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollY.value, [0, COURSE], [1, 0.78], Extrapolation.CLAMP) },
    ],
  }));

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
      // réutilise son cache disque plutôt que d'afficher une erreur alors
      // que la liste a déjà été vue au moins une fois.
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
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Nom de la sourate — permet de la reconnaître d'un coup d'œil. */}
          <Text style={[styles.nom, { color: T.text }]}>{item.nom}</Text>
          {/* Sens/thème de la sourate, sous le nom (ex. « Les Hypocrites » — …). */}
          {(() => {
            const sens = sourateMeaning(item.numero, language);
            return sens ? (
              <Text style={[styles.sens, { color: T.textSecondary }]}>{sens}</Text>
            ) : null;
          })()}
          <Text style={[styles.arabe, { color: T.text }]}>{item.nomArabe}</Text>
          <Text style={[styles.versets, { color: T.textTertiary }]}>{tr('lectureLibre.versetsCount', { n: item.nombreVersets })}</Text>
        </View>
        <Feather name="play-circle" size={26} color="#6B4DFF" style={{ alignSelf: 'center' }} />
      </Pressable>
    ),
    [T, router, tr, language],
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/*
        Header — dégradé + trame géométrique + médaillon.

        Il se comprime au défilement : le médaillon, le filet et le sous-titre
        se replient, le titre rétrécit et vient se poser à côté de la flèche
        de retour. Une centaine de pixels rendus à la liste des sourates.
      */}
      <Animated.View style={[styles.headerWrap, hdrHauteur]}>
        <LinearGradient
          colors={['#8B5CF6', '#6B4DFF', '#4A2FB8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <HeaderPattern width={width} height={180} variant="waves" />

        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>

        <View style={styles.headerBody}>
          <Animated.View style={[styles.headerMedallionWrap, hdrMedaillon]}>
            <View style={styles.headerMedallion}>
              <Text style={styles.headerEmoji}>🎧</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.headerRule, hdrRule]} />
          <Animated.Text style={[styles.headerSub, hdrSous]} numberOfLines={1}>
            {tr('lectureLibre.headerSub')}
          </Animated.Text>
        </View>

        {/* Posé en absolu : sa place ne dépend plus du repli de ses voisins. */}
        <Animated.Text style={[styles.headerTitle, styles.headerTitleAbs, hdrTitre]} numberOfLines={1}>
          {tr('lectureLibre.headerTitle')}
        </Animated.Text>
      </Animated.View>

      {error ? (
        <OfflineState error={error} onRetry={load} showOfflineExits />
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

          <Animated.FlatList
            onScroll={onScroll}
            // 16 ms : un evenement par image a 60 Hz.
            scrollEventThrottle={16}
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
  // Enveloppe de hauteur animee ; rogne son contenu pendant la compression.
  headerWrap: {
    overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerBody: { flex: 1, paddingTop: 44, paddingHorizontal: 24, alignItems: 'center' },
  // Le medaillon se replie en hauteur : son enveloppe rogne pendant l'animation.
  headerMedallionWrap: { overflow: 'hidden', alignItems: 'center' },
  // Titre pose a une coordonnee animee (voir hdrTitre) : sa place ne depend
  // plus du repli du medaillon, du filet ni du sous-titre.
  headerTitleAbs: { position: 'absolute', right: 24, zIndex: 2, textAlign: 'center', transformOrigin: 'left center' },
  header: {
    paddingTop: 52, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center',
    overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { position: 'absolute', top: 54, left: 16, zIndex: 2 },
  headerMedallion: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.32)',
  },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff' },
  headerRule: { width: 46, borderRadius: 2, backgroundColor: '#F6B100' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },

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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1 },
  numBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  sens: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 2 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, marginTop: 2, writingDirection: 'rtl' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
