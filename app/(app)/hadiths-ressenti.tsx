/**
 * Recherche de hadiths par ressenti — on entre par ce qu'on vit.
 *
 * C'est la porte d'entrée qui distingue cette section de toutes les apps de
 * hadiths existantes : elles classent par chapitre de fiqh, alors que
 * personne n'ouvre une app en pensant « Livre 24, chapitre de la Zakat ». On
 * ouvre en pensant « je suis anxieux », « j'ai perdu quelqu'un », « je me suis
 * disputé avec mon frère ».
 *
 * La saisie est libre : on tape sa phrase, `lib/hadithSearch.ts` la rapproche
 * des ressentis étiquetés. Tout se fait hors ligne, sans API — la table de
 * synonymes absorbe l'imprévu des formulations.
 *
 * ⚠️ DÉTRESSE VITALE. Si la saisie exprime une envie d'en finir, un bandeau
 * d'écoute s'affiche AVANT les résultats, et la recherche est déjà orientée
 * vers le réconfort (voir DISTRESS_PHRASES dans lib/hadithSearch.ts). Le
 * hadith qudsi:28 ne doit jamais arriver à ces personnes.
 *
 * PÉRIMÈTRE. Seuls an-Nawawi et al-Qudsi sont étiquetés à ce jour (76 hadiths
 * sur 82). Bukhari et Muslim viendront enrichir les ressentis les plus
 * pauvres — famille, maladie, travail.
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, TextInput,
  ActivityIndicator, Keyboard,
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
import {
  matchEmotions, hadithsForEmotion, isDistressQuery,
} from '../../lib/hadithSearch';
import { EMOTIONS, type EmotionId } from '../../constants/hadithEmotions';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

/**
 * Recueils dans lesquels on cherche, par ordre de préférence.
 *
 * Les deux courts d'abord : ils sont intégralement étiquetés et instantanés à
 * ouvrir. Bukhari et Muslim ne le sont que sur les chapitres à charge
 * humaine, et ne sont chargés que si le ressenti choisi y renvoie vraiment
 * (voir `select`).
 */
const TAGGED: CollectionId[] = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

/** Un résultat prêt à afficher. */
interface Result {
  collectionId: CollectionId;
  n: number;
  text: string;
  color: string;
}

/** Ressentis proposés d'emblée — les plus universels, pas les plus fournis. */
const SUGGESTED: EmotionId[] = [
  'peur', 'tristesse', 'colere', 'patience', 'espoir',
  'pardon', 'gratitude', 'amour', 'solitude', 'doute',
  'repentir', 'confiance',
];

export default function HadithsRessentiScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const appLang = useUserStore((s) => s.language);
  const hadithLang = hadithLangFor(appLang);

  const [query, setQuery] = useState('');
  /** Ressenti retenu : soit choisi d'un geste, soit déduit de la saisie. */
  const [picked, setPicked] = useState<EmotionId | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  /** Textes des recueils étiquetés, chargés une fois puis gardés. */
  const pool = useRef<Map<CollectionId, Map<number, { s: number; t: string }>>>(new Map());

  /**
   * Ressentis correspondant à la saisie.
   *
   * La langue de recherche suit celle de l'app : quelqu'un en anglais tape en
   * anglais, et la table de synonymes anglaise répond.
   */
  const matches = useMemo(
    () => (query.trim().length >= 2 ? matchEmotions(query, hadithLang).slice(0, 6) : []),
    [query, hadithLang],
  );

  /** La saisie exprime-t-elle une détresse vitale ? */
  const distress = useMemo(() => isDistressQuery(query), [query]);

  /** Libellé d'un ressenti dans la langue de l'app. */
  const labelOf = useCallback(
    (id: EmotionId) => {
      const e = EMOTIONS.find((x) => x.id === id);
      if (!e) return id;
      return hadithLang === 'en' ? e.en : e.fr;
    },
    [hadithLang],
  );

  const emojiOf = useCallback(
    (id: EmotionId) => EMOTIONS.find((x) => x.id === id)?.emoji ?? '•',
    [],
  );

  const colorOf = useCallback(
    (id: EmotionId) => EMOTIONS.find((x) => x.id === id)?.color ?? '#6B4DFF',
    [],
  );

  /**
   * Résout les hadiths d'un ressenti, en ne chargeant que le nécessaire.
   *
   * On demande d'abord les références, PUIS on ouvre les seuls recueils qui
   * en contiennent. Bukhari et Muslim pèsent 4,5 Mo chacun : les charger
   * systématiquement ferait attendre plusieurs secondes à chaque recherche,
   * y compris sur un ressenti qui n'a que des hadiths d'an-Nawawi.
   */
  const select = useCallback(async (emotion: EmotionId) => {
    Keyboard.dismiss();
    void Haptics.selectionAsync();
    setPicked(emotion);
    setLoading(true);

    try {
      // En détresse vitale, certains textes sont écartés quels que soient
      // leurs tags (condamnation du suicide). Voir NEVER_IN_DISTRESS.
      const refs = hadithsForEmotion(emotion, TAGGED, isDistressQuery(query));
      const needed = [...new Set(refs.map((r) => r.collection as CollectionId))];

      for (const id of needed) {
        if (pool.current.has(id)) continue;
        const c = await loadCollection(id, hadithLang);
        pool.current.set(id, new Map(c.hadiths.map((h) => [h.n, { s: h.s, t: h.t }])));
      }

      const out: Result[] = [];
      for (const ref of refs) {
        const collectionId = ref.collection as CollectionId;
        const h = pool.current.get(collectionId)?.get(ref.n);
        if (!h) continue; // tag pointant sur un hadith absent : on ignore
        out.push({
          collectionId, n: ref.n, text: h.t,
          color: themeStyle(themeOfHadith(collectionId, h.s)).color,
        });
      }
      setResults(out);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [hadithLang, query]);

  const clear = useCallback(() => {
    setQuery('');
    setPicked(null);
    setResults([]);
  }, []);

  /** Ouvre le fil de lecture sur ce hadith précis. */
  const openInFlow = useCallback((r: Result) => {
    router.push({
      pathname: '/hadiths',
      params: { collection: r.collectionId, n: String(r.n) },
    });
  }, [router]);

  const border = T.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(23,28,38,0.07)';
  const soft = T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,28,38,0.04)';

  /** Une puce de ressenti. */
  const chip = (id: EmotionId, active: boolean) => (
    <Pressable
      key={id}
      onPress={() => void select(id)}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${colorOf(id)}22` : soft,
          borderColor: active ? colorOf(id) : border,
        },
      ]}
    >
      <Text style={styles.chipEmoji}>{emojiOf(id)}</Text>
      <Text
        style={[styles.chipText, { color: active ? colorOf(id) : T.textSecondary }]}
        numberOfLines={1}
      >
        {labelOf(id)}
      </Text>
    </Pressable>
  );

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: T.text }]}>
          {tr('hadiths.mood.title')}
        </Text>
        <Text style={[styles.sub, { color: T.textSecondary }]}>
          {tr('hadiths.mood.sub')}
        </Text>

        <View style={[styles.field, { backgroundColor: T.cardBg, borderColor: border }]}>
          <Feather name="search" size={17} color={T.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(v) => { setQuery(v); setPicked(null); }}
            placeholder={tr('hadiths.mood.placeholder')}
            placeholderTextColor={T.textSecondary}
            style={[styles.input, { color: T.text }]}
            returnKeyType="search"
            onSubmitEditing={() => { if (matches[0]) void select(matches[0]); }}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              onPress={clear}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={tr('hadiths.mood.clearA11y')}
            >
              <Feather name="x" size={17} color={T.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Détresse vitale : l'écoute passe avant les hadiths. */}
        {distress && (
          <View style={[styles.care, { backgroundColor: `${'#5B9BD5'}18`, borderColor: '#5B9BD5' }]}>
            <Feather name="heart" size={17} color="#5B9BD5" />
            <View style={styles.careBody}>
              <Text style={[styles.careTitle, { color: T.text }]}>
                {tr('hadiths.mood.careTitle')}
              </Text>
              <Text style={[styles.careText, { color: T.textSecondary }]}>
                {tr('hadiths.mood.careBody')}
              </Text>
            </View>
          </View>
        )}

        {/* Ressentis déduits de la saisie. */}
        {matches.length > 0 && !picked && (
          <View style={styles.chips}>
            {matches.map((id) => chip(id, false))}
          </View>
        )}

        {/* Saisie sans correspondance : on le dit, et on propose autre chose. */}
        {query.trim().length >= 2 && matches.length === 0 && !picked && (
          <View style={[styles.empty, { backgroundColor: soft }]}>
            <Text style={[styles.emptyTitle, { color: T.text }]}>
              {tr('hadiths.mood.empty')}
            </Text>
            <Text style={[styles.emptyHint, { color: T.textSecondary }]}>
              {tr('hadiths.mood.emptyHint')}
            </Text>
          </View>
        )}

        {/* Suggestions, tant qu'aucun ressenti n'est retenu. */}
        {!picked && (
          <>
            <Text style={[styles.section, { color: T.textSecondary }]}>
              {tr('hadiths.mood.suggestions')}
            </Text>
            <View style={styles.chips}>
              {SUGGESTED.map((id) => chip(id, false))}
            </View>
          </>
        )}

        {/* Résultats du ressenti retenu. */}
        {picked && (
          <>
            <View style={styles.pickedRow}>
              {chip(picked, true)}
              <Pressable onPress={clear} hitSlop={10} style={styles.changeBtn}>
                <Feather name="refresh-cw" size={14} color={T.textSecondary} />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={T.textSecondary} style={styles.loader} />
            ) : (
              <>
                <Text style={[styles.count, { color: T.textSecondary }]}>
                  {tr('hadiths.mood.results', { n: results.length })}
                </Text>
                {results.map((r) => (
                  <Pressable
                    key={`${r.collectionId}:${r.n}`}
                    onPress={() => openInFlow(r)}
                    style={[styles.result, { backgroundColor: T.cardBg, borderColor: border }]}
                  >
                    <View style={[styles.resultBar, { backgroundColor: r.color }]} />
                    <View style={styles.resultBody}>
                      <Text
                        style={[styles.resultText, { color: T.text }]}
                        numberOfLines={4}
                      >
                        {r.text}
                      </Text>
                      <Text style={[styles.resultRef, { color: T.textSecondary }]}>
                        {tr('hadiths.reference', {
                          collection: tr(`hadiths.collection.${r.collectionId}`),
                          n: r.n,
                        })}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
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
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, marginTop: 4, marginBottom: 18 },

  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, height: 50,
  },
  input: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 15.5, paddingVertical: 0 },

  care: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 16,
  },
  careBody: { flex: 1, gap: 3 },
  careTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  careText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13.5, lineHeight: 20 },

  section: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 26, marginBottom: 12,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontFamily: 'Nunito_700Bold', fontSize: 13.5 },

  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  changeBtn: { padding: 8 },

  loader: { marginTop: 28 },
  count: {
    fontFamily: 'Nunito_700Bold', fontSize: 12.5,
    letterSpacing: 0.3, marginTop: 20, marginBottom: 10,
  },

  result: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 16,
    overflow: 'hidden', marginBottom: 10,
  },
  resultBar: { width: 4 },
  resultBody: { flex: 1, padding: 14, gap: 8 },
  resultText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, lineHeight: 22 },
  resultRef: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, letterSpacing: 0.2 },

  empty: { borderRadius: 16, padding: 16, marginTop: 16, gap: 5 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  emptyHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13.5, lineHeight: 20 },
});
