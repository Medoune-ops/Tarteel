/**
 * Mes hadiths — la collection personnelle.
 *
 * C'est de l'engagement SANS compétition : la satisfaction de constituer
 * quelque chose à soi, pas celle de battre un score. D'où ce qu'on ne trouve
 * pas ici :
 *
 *  - aucune statistique de lecture (« 340 hadiths ce mois ») : le compteur et
 *    la performance ramèneraient la pression là où on cherchait le calme ;
 *  - aucun classement, aucun badge, aucune récompense ;
 *  - le marque-page n'a rien à voir avec les cœurs/vies du parcours Coran —
 *    le retirer ne coûte rien.
 *
 * La seule continuité affichée est la série de lecture, et elle est douce :
 * elle repart à 1 après un jour sauté, sans jamais rien retirer. Voir
 * `store/hadithFavoritesStore.ts`.
 *
 * Les textes ne sont pas stockés avec les favoris — seulement la référence
 * `recueil:numéro`. On recharge les recueils à l'ouverture pour retrouver les
 * textes dans la langue courante : un favori mis de côté en français
 * s'affiche donc en anglais si l'app change de langue, ce qui est le
 * comportement attendu.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import {
  loadCollection, hadithLangFor, themeOfHadith, themeStyle,
  type CollectionId,
} from '../../lib/hadiths';
import { useHadithFavorites } from '../../store/hadithFavoritesStore';
import { useHadithShare } from '../../hooks/useHadithShare';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

/** Signature du visuel partagé. Une marque ne se traduit pas. */
const APP_NAME = 'TARTEEL';

/** Un favori, texte résolu. */
interface SavedHadith {
  collectionId: CollectionId;
  n: number;
  text: string;
  color: string;
  savedOn: string;
}

export default function MesHadithsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const hadithLang = hadithLangFor(useUserStore((s) => s.language));

  // On s'abonne au tableau : retirer un favori doit rafraîchir la liste.
  const favorites = useHadithFavorites((s) => s.favorites);
  const removeFavorite = useHadithFavorites((s) => s.removeFavorite);
  const streak = useHadithFavorites((s) => s.streak);
  const shareHadith = useHadithShare();

  const [items, setItems] = useState<SavedHadith[]>([]);
  const [loading, setLoading] = useState(true);

  /** Recueils à ouvrir : seulement ceux réellement présents en favori. */
  const needed = useMemo(
    () => [...new Set(favorites.map((f) => f.collectionId as CollectionId))],
    [favorites],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (favorites.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const texts = new Map<CollectionId, Map<number, { s: number; t: string }>>();
        for (const id of needed) {
          const c = await loadCollection(id, hadithLang);
          texts.set(id, new Map(c.hadiths.map((h) => [h.n, { s: h.s, t: h.t }])));
        }
        if (cancelled) return;

        const out: SavedHadith[] = [];
        // Du plus récemment mis de côté au plus ancien : ce qu'on vient
        // d'enregistrer est ce qu'on veut revoir en premier.
        for (const f of [...favorites].reverse()) {
          const collectionId = f.collectionId as CollectionId;
          const h = texts.get(collectionId)?.get(f.n);
          if (!h) continue;
          out.push({
            collectionId, n: f.n, text: h.t, savedOn: f.savedOn,
            color: themeStyle(themeOfHadith(collectionId, h.s)).color,
          });
        }
        setItems(out);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [favorites, needed, hadithLang]);

  const remove = useCallback((item: SavedHadith) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    removeFavorite(item.collectionId, item.n);
  }, [removeFavorite]);

  const share = useCallback((item: SavedHadith) => {
    void shareHadith.share(
      {
        text: item.text,
        collectionLabel: tr(`hadiths.collection.${item.collectionId}`),
        number: item.n,
        themeColor: item.color,
      },
      APP_NAME,
    );
  }, [shareHadith, tr]);

  const open = useCallback((item: SavedHadith) => {
    router.push({
      pathname: '/hadiths',
      params: { collection: item.collectionId, n: String(item.n) },
    });
  }, [router]);

  const border = T.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(23,28,38,0.07)';
  const soft = T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,28,38,0.04)';

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={tr('hadiths.flow.backA11y')}
          style={[styles.iconBtn, { backgroundColor: soft }]}
        >
          <Feather name="chevron-left" size={21} color={T.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: T.text }]}>
          {tr('hadiths.saved.title')}
        </Text>

        <View style={styles.metaRow}>
          {items.length > 0 && (
            <Text style={[styles.meta, { color: T.textSecondary }]}>
              {tr('hadiths.saved.count', { n: items.length })}
            </Text>
          )}
          {/* Série de lecture : une continuité, pas un devoir. */}
          {streak > 0 && (
            <View style={[styles.streak, { backgroundColor: soft }]}>
              <Feather name="sunrise" size={13} color={T.textSecondary} />
              <Text style={[styles.streakText, { color: T.textSecondary }]}>
                {streak === 1
                  ? tr('hadiths.saved.streakOne')
                  : tr('hadiths.saved.streak', { n: streak })}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={T.textSecondary} style={styles.loader} />
        ) : items.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: T.cardBg, borderColor: border }]}>
            <Feather name="bookmark" size={26} color={T.textSecondary} />
            <Text style={[styles.emptyTitle, { color: T.text }]}>
              {tr('hadiths.saved.emptyTitle')}
            </Text>
            <Text style={[styles.emptyBody, { color: T.textSecondary }]}>
              {tr('hadiths.saved.emptyBody')}
            </Text>
            <Pressable
              onPress={() => router.push('/hadiths')}
              style={[styles.emptyBtn, { backgroundColor: soft }]}
            >
              <Text style={[styles.emptyBtnText, { color: T.text }]}>
                {tr('hadiths.saved.emptyCta')}
              </Text>
            </Pressable>
          </View>
        ) : (
          items.map((item) => (
            <View
              key={`${item.collectionId}:${item.n}`}
              style={[styles.card, { backgroundColor: T.cardBg, borderColor: border }]}
            >
              <View style={[styles.bar, { backgroundColor: item.color }]} />

              <View style={styles.body}>
                <Pressable onPress={() => open(item)}>
                  <Text style={[styles.text, { color: T.text }]} numberOfLines={5}>
                    {item.text}
                  </Text>
                </Pressable>

                <View style={styles.footer}>
                  <Text style={[styles.reference, { color: item.color }]} numberOfLines={1}>
                    {tr('hadiths.reference', {
                      collection: tr(`hadiths.collection.${item.collectionId}`),
                      n: item.n,
                    })}
                  </Text>

                  <View style={styles.actions}>
                    {shareHadith.available && (
                      <Pressable
                        onPress={() => share(item)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={tr('hadiths.flow.shareA11y')}
                        style={[styles.actionBtn, { backgroundColor: soft }]}
                      >
                        <Feather name="share-2" size={15} color={T.textSecondary} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => remove(item)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={tr('hadiths.saved.removeA11y')}
                      style={[styles.actionBtn, { backgroundColor: soft }]}
                    >
                      <Feather name="bookmark" size={15} color={item.color} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Visuel de partage, rendu hors champ le temps de la capture. */}
      {shareHadith.portal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  content: { paddingHorizontal: 22, paddingTop: 8 },

  title: { fontFamily: 'Baloo2_700Bold', fontSize: 25, lineHeight: 33 },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 6, marginBottom: 20, flexWrap: 'wrap',
  },
  meta: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  streakText: { fontFamily: 'Nunito_700Bold', fontSize: 12.5 },

  loader: { marginTop: 40 },

  empty: {
    alignItems: 'center', gap: 10, borderWidth: 1,
    borderRadius: 20, padding: 28, marginTop: 20,
  },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, marginTop: 4 },
  emptyBody: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14,
    lineHeight: 21, textAlign: 'center',
  },
  emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 14 },
  emptyBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },

  card: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 18,
    overflow: 'hidden', marginBottom: 12,
  },
  bar: { width: 4 },
  body: { flex: 1, padding: 16, gap: 12 },
  text: { fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, lineHeight: 23 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reference: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, letterSpacing: 0.3 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
