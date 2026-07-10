import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { fetchLesson, reviewLettre, type RevisionQuality } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { playRemoteAudio, stopRemoteAudio } from '../../../constants/sounds';
import { getLetterSound } from '../../../constants/letterSounds';
import type { DiscoveryStep } from '../../../constants/lessonEngine';
import { useTheme } from '../../../utils/useTheme';
import DeviceStatusBar from '../../../components/StatusBar';

type Reponse = 'facile' | 'difficile' | 'oublie';

const SCORES: Record<Reponse, { label: string; emoji: string; bg: string }> = {
  facile:    { label: 'Facile',    emoji: '😊', bg: '#34C724' },
  difficile: { label: 'Difficile', emoji: '😅', bg: '#F6B100' },
  oublie:    { label: 'À revoir',  emoji: '😬', bg: '#FF6B6B' },
};

/** Joue l'audio d'une carte : mp3 local de lettre > TTS arabe > URL distante. */
function playCard(step: DiscoveryStep) {
  const localSrc = getLetterSound(step.letterKey);
  if (localSrc != null) playRemoteAudio(localSrc);
  else if (step.ttsText) Speech.speak(step.ttsText, { language: 'ar' });
  else playRemoteAudio(step.audioUrl);
}

/**
 * Révision d'une leçon d'alphabet/harakat : les lettres/syllabes de la leçon
 * défilent en flashcards (arabe affiché → l'utilisateur se teste → tap pour
 * révéler nom/son + audio), puis auto-évaluation finale qui recalcule le SRS
 * côté serveur (POST /me/revisions/lettres/:id/review). Pas de dictée vocale :
 * contrairement aux versets, ces leçons n'ont pas d'endpoint /recite.
 */
export default function LettreRevisionScreen() {
  const router = useRouter();
  const T = useTheme();
  const { lessonId, titre } = useLocalSearchParams<{ lessonId: string; titre?: string }>();

  // ── Cartes = étapes discovery de la leçon (lettres/syllabes enseignées) ──
  const [cards, setCards] = useState<DiscoveryStep[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const [choisi, setChoisi] = useState<Reponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(async () => {
    if (!lessonId) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const lesson = await swrFetch(`lesson:${lessonId}`, () => fetchLesson(lessonId));
      const discoveries = lesson.steps.filter((s): s is DiscoveryStep => s.type === 'discovery');
      setCards(discoveries);
    } catch {
      setLoadError(true);
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);
  // Coupe l'audio en quittant l'écran.
  useEffect(() => () => { stopRemoteAudio(); Speech.stop(); }, []);

  const reveal = useCallback(() => {
    if (!cards) return;
    setRevealed(true);
    playCard(cards[index]);
  }, [cards, index]);

  const next = useCallback(() => {
    if (!cards) return;
    stopRemoteAudio();
    Speech.stop();
    if (index + 1 >= cards.length) setFinished(true);
    else { setIndex(index + 1); setRevealed(false); }
  }, [cards, index]);

  const choisir = useCallback(async (rep: Reponse) => {
    if (saving || !lessonId) return;
    setChoisi(rep);
    setSaving(true);
    setSaveError(false);
    try {
      await reviewLettre(lessonId, rep as RevisionQuality);
      router.back();
    } catch {
      setSaveError(true);
      setChoisi(null);
    } finally {
      setSaving(false);
    }
  }, [lessonId, saving, router]);

  // ── États chargement / erreur ──
  if (loadError) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Feather name="wifi-off" size={32} color={T.textSecondary} />
        <Text style={[styles.stateText, { color: T.text }]}>Impossible de charger la leçon.</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
  if (!cards) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator size="large" color="#6B4DFF" />
      </View>
    );
  }
  if (cards.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Text style={[styles.stateText, { color: T.text }]}>Rien à réviser dans cette leçon.</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryLabel}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ── Fin de session : auto-évaluation → SRS ──
  if (finished) {
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
          <Text style={styles.headerEmoji}>🎉</Text>
          <Text style={styles.headerTitle}>{titre ?? 'Révision'}</Text>
          <Text style={styles.headerSub}>{cards.length} cartes revues</Text>
        </LinearGradient>
        <View style={styles.body}>
          <Text style={[styles.question, { color: T.text }]}>Comment tu t'es senti ?</Text>
          {saveError && <Text style={styles.errorText}>Une erreur est survenue, réessaie.</Text>}
          <View style={styles.btnsCol}>
            {(['oublie', 'difficile', 'facile'] as Reponse[]).map((rep) => {
              const s = SCORES[rep];
              const loading = saving && choisi === rep;
              return (
                <Pressable
                  key={rep}
                  style={[styles.repBtn, { backgroundColor: s.bg }, saving && choisi !== rep && { opacity: 0.5 }]}
                  onPress={() => choisir(rep)}
                  disabled={saving}
                >
                  <Text style={styles.repBtnEmoji}>{s.emoji}</Text>
                  <Text style={styles.repBtnLabel}>{s.label}</Text>
                  {loading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={styles.restartBtn}
            onPress={() => { setIndex(0); setRevealed(false); setFinished(false); }}
            disabled={saving}
          >
            <Feather name="refresh-cw" size={16} color="#6B4DFF" />
            <Text style={styles.restartTxt}>Revoir les cartes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Flashcard courante ──
  const card = cards[index];
  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={T.textSecondary} />
        </Pressable>
        <View style={[styles.progTrack, { backgroundColor: T.isDark ? '#2E2D3F' : '#E6E8ED' }]}>
          <View style={[styles.progFill, { width: `${((index + 1) / cards.length) * 100}%` }]} />
        </View>
        <Text style={[styles.progText, { color: T.textSecondary }]}>{index + 1}/{cards.length}</Text>
      </View>

      <View style={styles.cardZone}>
        <Text style={[styles.consigne, { color: T.textSecondary }]}>
          {revealed ? 'Tu avais bon ?' : 'Comment se lit cette lettre ?'}
        </Text>

        <Pressable
          style={[styles.flashcard, { backgroundColor: T.cardBg }]}
          onPress={revealed ? undefined : reveal}
        >
          <Text style={[styles.arabe, { color: T.text }]}>{card.arabe}</Text>
          {revealed ? (
            <>
              <Text style={styles.translit}>{card.translitteration}</Text>
              <Text style={[styles.traduction, { color: T.textSecondary }]}>{card.traduction}</Text>
              <Pressable style={styles.audioBtn} onPress={() => playCard(card)} hitSlop={8}>
                <Feather name="volume-2" size={26} color="#2A9E1C" />
              </Pressable>
            </>
          ) : (
            <Text style={[styles.tapHint, { color: T.textSecondary }]}>Appuie pour révéler</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        {revealed ? (
          <Pressable style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextLabel}>{index + 1 >= cards.length ? 'Terminer' : 'Suivant'}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={[styles.nextBtn, { backgroundColor: '#6B4DFF' }]} onPress={reveal}>
            <Text style={styles.nextLabel}>Révéler</Text>
            <Feather name="eye" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  progTrack: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 6, backgroundColor: '#34C724' },
  progText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  cardZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 20 },
  consigne: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  flashcard: {
    width: '100%', maxWidth: 380, borderRadius: 28, paddingVertical: 44, paddingHorizontal: 24,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  arabe: { fontSize: 84, lineHeight: 120, textAlign: 'center' },
  translit: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#6B4DFF' },
  traduction: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center' },
  tapHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 8 },
  audioBtn: {
    marginTop: 8, width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(52,199,36,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#34C724', borderRadius: 16, paddingVertical: 16,
    borderBottomWidth: 4, borderBottomColor: '#2A9E1C',
  },
  nextLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },

  header: { paddingTop: 16, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', textAlign: 'center' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body: { flex: 1, padding: 24, justifyContent: 'center' },
  question: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, textAlign: 'center', marginBottom: 24 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#FF4B4B', textAlign: 'center', marginBottom: 16 },
  btnsCol: { gap: 12 },
  repBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 16,
  },
  repBtnEmoji: { fontSize: 22 },
  repBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, paddingVertical: 12,
  },
  restartTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
});
