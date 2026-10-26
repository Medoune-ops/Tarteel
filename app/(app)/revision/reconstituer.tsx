import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { fetchRevisions, fetchVersets } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { playSound } from '../../../constants/sounds';
import ArabicText from '../../../components/ArabicText';
import DeviceStatusBar from '../../../components/StatusBar';
import OfflineState from '../../../components/OfflineState';
import { useTheme } from '../../../utils/useTheme';
import { useT } from '../../../lib/i18n';
import { useUserStore } from '../../../store/userStore';
import {
  builtText, createPuzzle, modelText, pickSession, placePiece,
  type Piece, type PuzzleItem, type PuzzleState,
} from '../../../utils/harakatPuzzle';

/** Sans sourate apprise, on s'entraîne sur Al-Fatiha (première sourate du parcours). */
const SOURATE_PAR_DEFAUT = 1;
const TATWEEL = 'ـ';

/**
 * Révision « Reconstituer » : un mot ou un verset d'une sourate apprise sert
 * de modèle ; l'élève le reforme en posant chaque lettre puis ses harakats.
 * Chaque pièce est vérifiée aussitôt (logique dans utils/harakatPuzzle.ts) :
 * une pièce fausse est refusée et comptée comme erreur.
 */
export default function ReconstituerScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const { numero } = useLocalSearchParams<{ numero?: string }>();

  const [items, setItems] = useState<PuzzleItem[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [index, setIndex] = useState(0);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [finished, setFinished] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setItems(null);
    try {
      const lang = useUserStore.getState().language;
      let cible = numero ? Number(numero) : null;
      if (!cible) {
        const apprises = await swrFetch('revisions', fetchRevisions);
        const choix = apprises.length ? apprises[Math.floor(Math.random() * apprises.length)]! : null;
        cible = choix?.numero ?? SOURATE_PAR_DEFAUT;
      }
      const data = await swrFetch(`versets:${cible}:${lang}`, () => fetchVersets(cible!, lang));
      setItems(pickSession(data.versets, data.sourate.nom));
    } catch (e) {
      setLoadError(e);
    }
  }, [numero]);

  useEffect(() => { load(); }, [load]);

  const item = items?.[index];
  useEffect(() => {
    if (item) setPuzzle(createPuzzle(item.text));
  }, [item]);

  const restart = useCallback(() => {
    setIndex(0);
    setTotalMistakes(0);
    setPerfect(0);
    setFinished(false);
    load();
  }, [load]);

  const onPiece = useCallback((p: Piece) => {
    if (!puzzle || puzzle.done) return;
    const r = placePiece(puzzle, p.id);
    if (!r.ok) {
      setWrongId(p.id);
      playSound('wrong');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setWrongId((w) => (w === p.id ? null : w)), 450);
      setPuzzle(r.state);
      return;
    }
    void Haptics.selectionAsync();
    if (r.state.done) {
      playSound('correct');
      setTotalMistakes((n) => n + r.state.mistakes);
      if (r.state.mistakes === 0) setPerfect((n) => n + 1);
    }
    setPuzzle(r.state);
  }, [puzzle]);

  const next = useCallback(() => {
    if (!items) return;
    if (index + 1 >= items.length) {
      playSound('finish');
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }, [items, index]);

  const lettres = useMemo(() => puzzle?.pieces.filter((p) => p.kind === 'letter') ?? [], [puzzle]);
  const harakats = useMemo(() => puzzle?.pieces.filter((p) => p.kind === 'mark') ?? [], [puzzle]);
  const accent = T.isDark ? '#B9A8FF' : '#6B4DFF';

  if (loadError) {
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <OfflineState error={loadError} onRetry={load} />
      </View>
    );
  }

  if (!items || (!puzzle && items.length > 0)) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator size="large" color="#6B4DFF" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Text style={[styles.stateText, { color: T.text }]}>{tr('reconstituer.empty')}</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryTxt}>{tr('reconstituer.finish')}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Fin de session ──
  if (finished) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Text style={styles.endEmoji}>{totalMistakes === 0 ? '🌟' : '👏'}</Text>
        <Text style={[styles.endTitle, { color: T.text }]}>{tr('reconstituer.endTitle')}</Text>
        <Text style={[styles.stateText, { color: T.textSecondary }]}>
          {tr('reconstituer.endPerfect', { n: perfect, total: items.length })}
        </Text>
        <Text style={[styles.stateText, { color: T.textSecondary }]}>
          {totalMistakes === 0 ? tr('reconstituer.endNoMistake') : tr('reconstituer.endMistakes', { n: totalMistakes })}
        </Text>
        <Pressable style={[styles.primaryBtn, { alignSelf: 'stretch', marginHorizontal: 32 }]} onPress={restart}>
          <Feather name="refresh-cw" size={18} color="#fff" />
          <Text style={styles.primaryTxt}>{tr('reconstituer.again')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryTxt}>{tr('reconstituer.finish')}</Text>
        </Pressable>
      </View>
    );
  }

  const s = puzzle!;
  const modele = modelText(item!.text);
  const reforme = builtText(s);
  const isVerset = item!.kind === 'verset';
  const consigne = s.done
    ? tr('reconstituer.wellDone')
    : s.letterPlaced ? tr('reconstituer.placeHaraka') : tr('reconstituer.placeLetter');

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={T.textSecondary} />
        </Pressable>
        <View style={[styles.progTrack, { backgroundColor: T.isDark ? '#2E2D3F' : '#E6E8ED' }]}>
          <View style={[styles.progFill, { width: `${((index + (s.done ? 1 : 0)) / items.length) * 100}%` }]} />
        </View>
        <Text style={[styles.progText, { color: T.textSecondary }]}>{index + 1}/{items.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Modèle */}
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <View style={styles.cardHead}>
            <View style={[styles.kindPill, { backgroundColor: T.isDark ? '#2A2540' : '#EDE8FF' }]}>
              <Text style={[styles.kindTxt, { color: accent }]}>
                {isVerset ? tr('reconstituer.kindVerse') : tr('reconstituer.kindWord')}
              </Text>
            </View>
            <Text style={[styles.ref, { color: T.textTertiary }]} numberOfLines={1}>{item!.ref}</Text>
          </View>
          <ArabicText
            style={[isVerset ? styles.modelVerse : styles.modelWord, { color: T.text }]}
            harakatScale={1.25}
            harakatColor={accent}
          >
            {modele}
          </ArabicText>
        </View>

        {/* Réponse en cours */}
        <Text style={[styles.consigne, { color: s.done ? '#2A9E1C' : T.textSecondary }]}>{consigne}</Text>
        <View
          style={[
            styles.answer,
            { backgroundColor: T.cardBg, borderColor: s.done ? '#34C724' : (T.isDark ? '#2E2D3F' : '#E2E4EA') },
          ]}
        >
          {reforme ? (
            <ArabicText
              style={[isVerset ? styles.modelVerse : styles.modelWord, { color: T.text }]}
              harakatScale={1.25}
              harakatColor={accent}
            >
              {reforme}
            </ArabicText>
          ) : (
            <Text style={[styles.placeholder, { color: T.textTertiary }]}>…</Text>
          )}
        </View>

        {/* Pièces */}
        {!s.done && (
          <>
            <Text style={[styles.groupLabel, { color: T.textTertiary }]}>{tr('reconstituer.letters')}</Text>
            <View style={styles.tiles}>
              {lettres.map((p) => (
                <Tile key={p.id} piece={p} wrong={wrongId === p.id} onPress={onPiece} dark={T.isDark} text={T.text} />
              ))}
            </View>
            <Text style={[styles.groupLabel, { color: T.textTertiary }]}>{tr('reconstituer.harakats')}</Text>
            <View style={styles.tiles}>
              {harakats.map((p) => (
                <Tile key={p.id} piece={p} wrong={wrongId === p.id} onPress={onPiece} dark={T.isDark} text={accent} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {s.done ? (
          <Pressable style={styles.primaryBtn} onPress={next}>
            <Text style={styles.primaryTxt}>
              {index + 1 >= items.length ? tr('reconstituer.seeResult') : tr('reconstituer.next')}
            </Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Text style={[styles.mistakes, { color: s.mistakes ? '#FF6B6B' : T.textTertiary }]}>
            {tr('reconstituer.mistakes', { n: s.mistakes })}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Une pièce : lettre seule, ou harakat posé sur un tatwil pour être visible. */
function Tile({ piece, wrong, onPress, dark, text }: {
  piece: Piece; wrong: boolean; onPress: (p: Piece) => void; dark: boolean; text: string;
}) {
  if (piece.used) return <View style={[styles.tile, styles.tileUsed, { backgroundColor: dark ? '#1C1B28' : '#E6E8ED' }]} />;
  return (
    <Pressable
      onPress={() => onPress(piece)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: dark ? '#26243A' : '#FFFFFF', borderColor: dark ? '#3A3852' : '#E2E4EA' },
        pressed && { transform: [{ scale: 0.94 }] },
        wrong && styles.tileWrong,
      ]}
    >
      <Text style={[styles.tileTxt, { color: wrong ? '#FF4B4B' : text }]}>
        {piece.kind === 'mark' ? TATWEEL + piece.value : piece.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  progTrack: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 6, backgroundColor: '#34C724' },
  progText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  body: { padding: 20, paddingBottom: 12, gap: 12 },
  card: {
    borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  kindPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  kindTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  ref: { flexShrink: 1, fontFamily: 'Nunito_700Bold', fontSize: 12 },
  modelWord: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 46, lineHeight: 92, textAlign: 'center' },
  modelVerse: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, lineHeight: 64, textAlign: 'center' },

  consigne: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, textAlign: 'center', marginTop: 4 },
  answer: {
    minHeight: 96, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
  },
  placeholder: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28 },

  groupLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.8, marginTop: 6 },
  // Les pièces se lisent de droite à gauche, comme le texte qu'on reforme.
  tiles: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: 52, height: 58, borderRadius: 14, borderWidth: 2, borderBottomWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  tileUsed: { borderWidth: 0, opacity: 0.5 },
  tileWrong: { borderColor: '#FF6B6B', backgroundColor: '#FFECEC' },
  tileTxt: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, lineHeight: 52, textAlign: 'center' },

  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  mistakes: { fontFamily: 'Nunito_700Bold', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#34C724', borderRadius: 16, paddingVertical: 16,
    borderBottomWidth: 4, borderBottomColor: '#2A9E1C',
  },
  primaryTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  secondaryBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  secondaryTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  endEmoji: { fontSize: 56 },
  endTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26 },
});
