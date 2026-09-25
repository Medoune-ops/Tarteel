/**
 * Flux de lecture des hadiths — l'onglet ouvre directement sur une carte.
 *
 * Parti pris produit : ce n'est PAS un parcours. Pas de score, pas de vies,
 * pas de QCM, pas d'ordre imposé, aucun échec possible. La récompense n'est
 * pas « j'ai réussi » mais « ça m'a parlé ». On swipe verticalement comme sur
 * un réseau social, sauf que c'est du hadith.
 *
 * L'imprévisibilité est ce qui rend le geste addictif : on pioche au hasard,
 * on ne sait jamais ce qui vient. D'où un flux, pas une liste ordonnée.
 *
 * Le parcours classique (recueil → thème → chapitre + recherche plein texte)
 * n'a pas disparu : il vit dans `hadiths-recueils.tsx`, accessible par
 * l'icône en haut à droite.
 *
 * CHOIX TECHNIQUE — FlatList paginée plutôt que Reanimated.
 * Une FlatList verticale en `pagingEnabled` donne le geste natif attendu
 * (inertie, rebond, accessibilité) sans réimplémenter la physique du
 * défilement. Reanimated n'apporterait ici que des animations dont ce
 * contenu n'a pas besoin — un texte religieux ne doit pas voltiger. La
 * virtualisation nous offre en prime le recyclage des cartes, qui compte dès
 * qu'on élargit à Bukhari.
 *
 * CHARGEMENT — on démarre sur les deux petits recueils (82 hadiths, ~58 Ko,
 * instantané). Bukhari et Muslim pèsent 4,5 Mo et 15 000 hadiths : les
 * charger à l'ouverture ferait attendre tout le monde, y compris ceux qui
 * veulent juste lire trois cartes. Ils s'ajoutent à la demande.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList,
  useWindowDimensions, type ViewToken,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DeviceStatusBar from '../../components/StatusBar';
import HadithCard from '../../components/HadithCard';
import { useTheme } from '../../utils/useTheme';
import {
  loadCollection, hadithLangFor, themeOfHadith, themeStyle,
  type CollectionId,
} from '../../lib/hadiths';
import { useUserStore } from '../../store/userStore';
import { useHadithFavorites } from '../../store/hadithFavoritesStore';
import { useHadithProgress } from '../../store/hadithProgressStore';
import { useHadithShare } from '../../hooks/useHadithShare';
import { useT } from '../../lib/i18n';
import type { ThemeId } from '../../constants/hadithChapters';

/** Une carte du flux : tout ce qu'il faut pour l'afficher, déjà résolu. */
interface FlowItem {
  collectionId: CollectionId;
  n: number;
  chapter: number;
  text: string;
  theme: ThemeId;
  themeColor: string;
}

/** Signature du visuel partagé. Une marque ne se traduit pas. */
const APP_NAME = 'TARTEEL';

/** Recueils ouverts au démarrage — courts, donc instantanés. */
const STARTER: CollectionId[] = ['nawawi', 'qudsi'];
/** Recueils ajoutés à la demande — 4,5 Mo chacun, 15 000 hadiths à eux deux. */
const WIDE: CollectionId[] = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

/** Combien de cartes on prépare d'avance, et à partir de quand on recharge. */
const BATCH = 12;
const REFILL_THRESHOLD = 4;

export default function HadithsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const hadithLang = hadithLangFor(useUserStore((s) => s.language));

  /*
   * Ouverture sur un hadith précis, quand on arrive depuis la recherche par
   * ressenti : ce hadith est placé en tête du flux, la pioche aléatoire
   * prend la suite. On ne bascule pas dans un « mode filtré » — le fil reste
   * un fil, on continue simplement à swiper après avoir lu celui qu'on
   * cherchait.
   */
  const params = useLocalSearchParams<{ collection?: string; n?: string }>();
  const openOn = useMemo(() => {
    const c = params.collection;
    const n = Number(params.n);
    if (!c || !Number.isFinite(n)) return null;
    return { collectionId: c as CollectionId, n };
  }, [params.collection, params.n]);

  const isFavorite = useHadithFavorites((s) => s.isFavorite);
  const toggleFavorite = useHadithFavorites((s) => s.toggleFavorite);
  const markReadToday = useHadithFavorites((s) => s.markReadToday);
  const markRead = useHadithProgress((s) => s.markRead);
  const shareHadith = useHadithShare();

  const [items, setItems] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [wide, setWide] = useState(false);
  /** Re-rendu des cartes quand un favori change (le store n'est pas réactif ici). */
  const [favTick, setFavTick] = useState(0);

  /**
   * Hadiths déjà servis, pour ne pas repasser deux fois sur le même tant
   * qu'il reste du choix. Dans une ref : ça ne doit pas provoquer de rendu.
   */
  const seen = useRef<Set<string>>(new Set());
  /** Recueils chargés, gardés pour piocher sans relire les fichiers. */
  const pool = useRef<Map<CollectionId, { n: number; s: number; t: string }[]>>(new Map());
  const listRef = useRef<FlatList<FlowItem>>(null);

  /** Construit une carte à partir d'un hadith brut. */
  const toItem = useCallback((collectionId: CollectionId, h: { n: number; s: number; t: string }): FlowItem => {
    const theme = themeOfHadith(collectionId, h.s);
    return {
      collectionId, n: h.n, chapter: h.s, text: h.t,
      theme, themeColor: themeStyle(theme).color,
    };
  }, []);

  /**
   * Tire `count` hadiths au hasard parmi les recueils chargés.
   *
   * Si tout a déjà été vu (82 hadiths, ça arrive), on repart d'une ardoise
   * neuve plutôt que de rendre une liste vide : le flux ne doit jamais
   * s'arrêter sur un écran mort.
   */
  const draw = useCallback((count: number): FlowItem[] => {
    const loaded = [...pool.current.entries()];
    if (loaded.length === 0) return [];

    const total = loaded.reduce((sum, [, list]) => sum + list.length, 0);
    if (seen.current.size >= total) seen.current.clear();

    const out: FlowItem[] = [];
    // Borne de sécurité : sans elle, un corpus presque épuisé ferait tourner
    // la boucle très longtemps pour trouver les derniers inédits.
    let guard = count * 60;

    while (out.length < count && guard-- > 0) {
      const [collectionId, list] = loaded[Math.floor(Math.random() * loaded.length)];
      if (list.length === 0) continue;
      const h = list[Math.floor(Math.random() * list.length)];
      const key = `${collectionId}:${h.n}`;
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      out.push(toItem(collectionId, h));
    }
    return out;
  }, [toItem]);

  /**
   * Charge une liste de recueils dans le vivier, puis remplit le flux.
   *
   * `head` place un hadith donné en première carte — le cas de l'arrivée
   * depuis la recherche par ressenti.
   */
  const fill = useCallback(async (
    ids: CollectionId[],
    replace: boolean,
    head?: { collectionId: CollectionId; n: number } | null,
  ) => {
    setLoading(true);
    setError(false);
    try {
      for (const id of ids) {
        if (pool.current.has(id)) continue;
        const c = await loadCollection(id, hadithLang);
        pool.current.set(id, c.hadiths);
      }

      // Le hadith demandé d'abord, s'il existe et n'a pas déjà été tiré.
      const first: FlowItem[] = [];
      if (head) {
        const h = pool.current.get(head.collectionId)?.find((x) => x.n === head.n);
        if (h) {
          seen.current.add(`${head.collectionId}:${h.n}`);
          first.push(toItem(head.collectionId, h));
        }
      }

      const fresh = [...first, ...draw(BATCH)];
      setItems((prev) => (replace ? fresh : [...prev, ...fresh]));
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [hadithLang, draw, toItem]);

  // Ouverture, et rechargement si la langue change : on repart du vivier
  // court pour que l'écran s'affiche tout de suite. Une arrivée depuis la
  // recherche par ressenti place le hadith demandé en tête.
  useEffect(() => {
    pool.current.clear();
    seen.current.clear();
    setWide(false);
    setItems([]);
    void fill(STARTER, true, openOn);
    // `fill` dépend de la langue : la re-signaler ici serait redondant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadithLang, openOn]);

  /** Élargit le flux à Bukhari et Muslim — 15 000 hadiths de plus. */
  const widen = useCallback(() => {
    if (wide) return;
    setWide(true);
    void Haptics.selectionAsync();
    void fill(WIDE, false);
  }, [wide, fill]);

  /**
   * Carte affichée : on la marque lue (progression + série de lecture) et on
   * prépare la suite quand la fin approche.
   *
   * Marquer lu n'accorde ni point ni récompense — c'est seulement ce qui
   * alimente le « 12 jours de lecture », une continuité douce qui ne se perd
   * jamais brutalement.
   */
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as FlowItem | undefined;
    if (!first) return;
    markRead(first.collectionId, first.n);
    markReadToday();

    const index = viewableItems[0]?.index ?? 0;
    setItems((prev) => {
      if (prev.length - index > REFILL_THRESHOLD) return prev;
      const more = draw(BATCH);
      return more.length ? [...prev, ...more] : prev;
    });
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const onFavorite = useCallback((item: FlowItem) => {
    const added = toggleFavorite(item.collectionId, item.n);
    void Haptics.impactAsync(
      added ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
    );
    setFavTick((v) => v + 1);
  }, [toggleFavorite]);

  /** Partage la carte en image. Masqué si le module natif est absent. */
  const onShare = useCallback((item: FlowItem) => {
    void shareHadith.share(
      {
        text: item.text,
        collectionLabel: tr(`hadiths.collection.${item.collectionId}`),
        number: item.n,
        themeColor: item.themeColor,
      },
      APP_NAME,
    );
  }, [shareHadith, tr]);

  const renderItem = useCallback(({ item }: { item: FlowItem }) => (
    <HadithCard
      text={item.text}
      collectionLabel={tr(`hadiths.collection.${item.collectionId}`)}
      number={item.n}
      theme={item.theme}
      themeColor={item.themeColor}
      height={height}
      favorite={isFavorite(item.collectionId, item.n)}
      onFavorite={() => onFavorite(item)}
      onShare={shareHadith.available ? () => onShare(item) : undefined}
      insetTop={insets.top}
      insetBottom={insets.bottom}
    />
  ), [tr, height, insets.top, insets.bottom, isFavorite, onFavorite, onShare, shareHadith.available]);

  const keyExtractor = useCallback(
    (item: FlowItem, index: number) => `${item.collectionId}:${item.n}:${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<FlowItem> | null | undefined, index: number) => ({
      length: height, offset: height * index, index,
    }),
    [height],
  );

  const header = useMemo(() => (
    <View style={[styles.header, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={tr('hadiths.flow.backA11y')}
        style={[styles.iconBtn, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
      >
        <Feather name="chevron-left" size={21} color={T.textSecondary} />
      </Pressable>

      <View style={styles.headerRight}>
        {/* Entrée par le ressenti — ce qui distingue cette section : on
            cherche « j'ai peur », pas « Livre 24 ». */}
        <Pressable
          onPress={() => router.push('/hadiths-ressenti')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={tr('hadiths.mood.openA11y')}
          style={[styles.iconBtn, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
        >
          <Feather name="heart" size={17} color={T.textSecondary} />
        </Pressable>

        {/* Collection personnelle — ce qu'on a mis de côté. */}
        <Pressable
          onPress={() => router.push('/hadiths-mes-hadiths')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={tr('hadiths.saved.openA11y')}
          style={[styles.iconBtn, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
        >
          <Feather name="bookmark" size={17} color={T.textSecondary} />
        </Pressable>

        {!wide && (
          <Pressable
            onPress={widen}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={tr('hadiths.flow.expandA11y')}
            style={[styles.iconBtn, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
          >
            <Feather name="maximize-2" size={17} color={T.textSecondary} />
          </Pressable>
        )}
        <Pressable
          onPress={() => router.push('/hadiths-recueils')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={tr('hadiths.flow.browseA11y')}
          style={[styles.iconBtn, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
        >
          <Feather name="book-open" size={18} color={T.textSecondary} />
        </Pressable>
      </View>
    </View>
  ), [insets.top, T.isDark, T.textSecondary, tr, router, wide, widen]);

  if (loading && items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator color={T.textSecondary} />
        <Text style={[styles.centerText, { color: T.textSecondary }]}>
          {tr('hadiths.loading')}
        </Text>
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Feather name="wifi-off" size={26} color={T.textSecondary} />
        <Text style={[styles.centerText, { color: T.textSecondary }]}>
          {tr('hadiths.loadError')}
        </Text>
        <Pressable
          onPress={() => void fill(STARTER, true)}
          style={[styles.retry, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' }]}
        >
          <Text style={[styles.retryText, { color: T.textSecondary }]}>
            {tr('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <FlatList
        ref={listRef}
        data={items}
        extraData={favTick}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        /* Une carte de chaque côté : assez pour que le swipe ne montre jamais
           de blanc, assez peu pour ne pas garder 15 000 hadiths montés. */
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />

      {header}

      {/* Visuel de partage, rendu hors champ le temps de la capture. */}
      {shareHadith.portal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  centerText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, textAlign: 'center' },
  retry: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  retryText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },

  header: {
    position: 'absolute', left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
});
