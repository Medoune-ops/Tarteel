import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { reviewRegainHeart } from '../../../lib/api/gems';
import { fetchVersets, reciteVerset, submitRevisionReview, type Verset as ApiVerset } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useUserStore, MAX_HEARTS } from '../../../store/userStore';
import { t } from '../../../lib/i18n';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useState, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';

type Reponse = 'facile' | 'difficile' | 'oublie';
type Phase = 'pret' | 'recitation' | 'fini';
/** Sous-état pendant la récitation d'un verset. */
type SubPhase = 'recording' | 'analyzing' | 'aide';

const SCORES: Record<Reponse, { label: string; emoji: string; bg: string; pts: number }> = {
  facile:    { label: 'Facile',    emoji: '😊', bg: '#34C724', pts: 10 },
  difficile: { label: 'Difficile', emoji: '😅', bg: '#F6B100', pts: 5  },
  oublie:    { label: 'À revoir',  emoji: '😬', bg: '#FF6B6B', pts: 0  },
};

// ── Onde sonore animée (pendant l'enregistrement micro) ─────────────────────
function WaveBar({ delay }: { delay: number }) {
  const h = useSharedValue(0.3);
  useEffect(() => {
    h.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.sin) }),
      ), -1,
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.value }] }));
  return <Animated.View style={[styles.waveBar, style]} />;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progWrap}>
      <View style={[styles.progBar, { width: `${(current / total) * 100}%` }]} />
    </View>
  );
}

// ── Écran résultat ──────────────────────────────────────────────────────────
function ResultScreen({ aides, total, suggestion, choisi, onChoisir, onRestart, onQuitter }: {
  aides: number; total: number; suggestion: Reponse;
  choisi: Reponse | null; onChoisir: (r: Reponse) => void;
  onRestart: () => void; onQuitter: () => void;
}) {
  const verdict = SCORES[suggestion];
  const fluidite = Math.max(0, Math.round(((total - aides) / total) * 100));
  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.resultGrad}>
        <Text style={styles.resultEmoji}>{verdict.emoji}</Text>
        <Text style={styles.resultMention}>
          {suggestion === 'facile' ? 'Maîtrisé !' : suggestion === 'difficile' ? 'Presque !' : 'À revoir'}
        </Text>
        <View style={styles.resultCircle}>
          <Text style={styles.resultPct}>{fluidite}%</Text>
          <Text style={styles.resultSub}>Fluidité</Text>
        </View>
        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatVal}>{total - aides}/{total}</Text>
            <Text style={styles.resultStatLbl}>Versets fluides</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultStat}>
            <Text style={styles.resultStatVal}>{aides}</Text>
            <Text style={styles.resultStatLbl}>Aides utilisées</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.resultBottom}>
        <Text style={styles.confirmTitle}>L'app pense : <Text style={{ color: verdict.bg }}>{verdict.label}</Text></Text>
        <Text style={styles.confirmSub}>Et toi, comment tu t'es senti ?</Text>
        <View style={styles.btnsRow}>
          {(['oublie', 'difficile', 'facile'] as Reponse[]).map((rep) => {
            const s = SCORES[rep];
            const isSuggestion = rep === suggestion;
            return (
              <Pressable
                key={rep}
                style={[
                  styles.repBtn, { backgroundColor: s.bg },
                  isSuggestion && styles.repBtnSuggested,
                  choisi === rep && styles.repBtnSelected,
                ]}
                onPress={() => onChoisir(rep)}
              >
                {isSuggestion && (
                  <View style={styles.suggestPip}>
                    <Feather name="star" size={9} color="#fff" />
                  </View>
                )}
                <Text style={styles.repBtnEmoji}>{s.emoji}</Text>
                <Text style={styles.repBtnLabel}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.restartBtn} onPress={onRestart}>
          <Feather name="refresh-cw" size={16} color="#6B4DFF" />
          <Text style={styles.restartTxt}>Réciter à nouveau</Text>
        </Pressable>
        <Pressable
          style={[styles.quitBtn, !choisi && styles.quitBtnDisabled]}
          onPress={onQuitter}
          disabled={!choisi}
        >
          <Text style={styles.quitTxt}>Terminer</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FlashcardScreen() {
  const router = useRouter();
  // `numero` = numéro de sourate (1–114) — passé par l'écran Révisions.
  const { numero } = useLocalSearchParams<{ numero?: string }>();
  const language = useUserStore((s) => s.language);

  // ── Versets réels chargés depuis l'API (cachés en mémoire, cf. swr) ──
  const [versets, setVersets] = useState<ApiVerset[] | null>(null);
  const [meta, setMeta] = useState<{ nom: string; nomArabe: string } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!numero) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const data = await swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language));
      setVersets(data.versets);
      setMeta({ nom: data.sourate.nom, nomArabe: data.sourate.nomArabe });
    } catch {
      setLoadError(true);
    }
  }, [numero, language]);

  useEffect(() => { load(); }, [load]);

  // ── Enregistrement micro (expo-audio) ──
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [phase, setPhase]       = useState<Phase>('pret');
  const [subPhase, setSubPhase] = useState<SubPhase>('recording');
  const [position, setPosition] = useState(0);      // verset courant
  const [nbAides, setNbAides]   = useState(0);
  const [choisi, setChoisi]     = useState<Reponse | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  // Empêche un double-appui sur « Terminer » d'envoyer deux fois la même
  // session (double POST /me/revisions/:numero/review).
  const quittingRef = useRef(false);

  // Sécurité : couper l'enregistrement + mode lecture en quittant l'écran.
  useEffect(() => () => {
    if (recorder.isRecording) recorder.stop().catch(() => {});
    exitRecordingMode();
  }, []);

  /** Démarre l'enregistrement du verset courant. */
  const startRecording = useCallback(async () => {
    await enterRecordingMode();
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const demarrer = async () => {
    const granted = await ensureMicPermission();
    if (!granted) { setMicDenied(true); return; }
    setMicDenied(false);
    setNbAides(0);
    setPosition(0);
    setSubPhase('recording');
    setPhase('recitation');
    await startRecording();
  };

  /** Passe au verset suivant (ou termine), en relançant l'enregistrement. */
  const avancer = useCallback(async (i: number) => {
    if (!versets || i + 1 >= versets.length) {
      await exitRecordingMode();
      setPhase('fini');
      return;
    }
    setPosition(i + 1);
    setSubPhase('recording');
    await startRecording();
  }, [versets, startRecording]);

  /**
   * « Verset suivant » : stoppe l'enregistrement du verset courant, l'envoie
   * au serveur (Whisper) et agit selon le verdict :
   *   fluide          → on avance directement ;
   *   hesitant/oublie → on révèle le verset (aide), l'utilisateur reprend.
   * Hors-ligne / erreur → on avance sans pénalité (best-effort).
   */
  const versetSuivant = async () => {
    if (!versets || subPhase !== 'recording') return;
    await recorder.stop();
    const uri = recorder.uri;
    const verset = versets[position];
    setSubPhase('analyzing');
    try {
      if (!uri) throw new Error('no-recording');
      const res = await reciteVerset(verset.id, uri);
      if (res.verdict === 'fluide') {
        await avancer(position);
      } else {
        setNbAides((n) => n + 1);
        setSubPhase('aide');
      }
    } catch {
      // best-effort : serveur indisponible → on ne bloque pas la révision
      await avancer(position);
    }
  };

  /** Après l'aide : l'utilisateur a relu le verset, on continue. */
  const reprendre = async () => { await avancer(position); };

  const terminerTot = async () => {
    if (recorder.isRecording) await recorder.stop().catch(() => {});
    await exitRecordingMode();
    setPhase('fini');
  };

  const reset = () => {
    setPhase('pret'); setPosition(0); setNbAides(0); setChoisi(null); setSubPhase('recording');
  };

  // ── États de chargement / erreur ──
  if (loadError) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>Impossible de charger la sourate.</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Retour</Text>
        </Pressable>
      </View>
    );
  }
  if (!versets || !meta) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>Chargement de la sourate…</Text>
      </View>
    );
  }

  // ── Écran résultat ──
  if (phase === 'fini') {
    const ratio = (versets.length - nbAides) / versets.length;
    const suggestion: Reponse = ratio >= 0.8 ? 'facile' : ratio >= 0.5 ? 'difficile' : 'oublie';
    return (
      <ResultScreen
        aides={nbAides}
        total={versets.length}
        suggestion={suggestion}
        choisi={choisi}
        onChoisir={setChoisi}
        onRestart={reset}
        onQuitter={async () => {
          if (quittingRef.current) return;
          quittingRef.current = true;
          // Enregistre le résultat de la session (SRS) — best-effort, ne
          // bloque jamais la sortie de l'écran.
          try {
            await submitRevisionReview(Number(numero), choisi!);
          } catch {
            // hors-ligne ou sourate pas encore apprise — pas bloquant
          }
          // « Réviser pour regagner » : une session terminée = +1 cœur (max
          // 2/jour, plafonné CÔTÉ SERVEUR, qui vérifie que la session
          // ci-dessus a bien été enregistrée). Best-effort : si la limite est
          // atteinte / cœurs pleins / premium, le serveur refuse et on ignore.
          const s = useUserStore.getState();
          if (!s.isPremium && s.hearts < MAX_HEARTS) {
            try {
              await reviewRegainHeart(Number(numero));
              Alert.alert(t('review.regainTitle'), t('review.regainMsg'));
            } catch {
              // limite quotidienne atteinte ou hors-ligne — pas bloquant
            }
          }
          router.back();
        }}
      />
    );
  }

  const versetCourant = versets[position];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={styles.headerNom} numberOfLines={1}>{meta.nom} · {meta.nomArabe}</Text>
          </View>
          <View style={{ width: 30 }} />
        </View>
        {phase === 'recitation' && (
          <>
            <ProgressBar current={position + 1} total={versets.length} />
            <Text style={styles.headerCount}>Verset {position + 1} / {versets.length}</Text>
          </>
        )}
      </LinearGradient>

      {/* Zone centrale */}
      <View style={styles.cardZone}>
        {phase === 'pret' ? (
          // ── Écran prêt ──
          <View style={styles.pretCard}>
            <Text style={styles.pretEmoji}>🎙️</Text>
            <Text style={styles.pretTitle}>Récite de mémoire</Text>
            <Text style={styles.pretDesc}>
              Récite chaque verset à voix haute, puis appuie sur{'\n'}
              « Verset suivant ». L'app analyse ta récitation.{'\n'}
              Si tu bloques, elle t'affiche le verset.
            </Text>
            {micDenied && (
              <Text style={styles.micDenied}>
                ⚠️ Autorise le micro dans les réglages pour commencer
              </Text>
            )}
          </View>
        ) : subPhase === 'aide' ? (
          // ── Carte d'aide (verdict serveur : hésitant / oublié) ──
          <View style={styles.cardWrap}>
            <Animated.View
              key={versetCourant.id}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={styles.aideCard}
            >
              <View style={styles.aideBadge}>
                <Feather name="help-circle" size={13} color="#F0820C" />
                <Text style={styles.aideBadgeText}>Petit coup de pouce</Text>
              </View>
              <Text style={styles.aideArabe}>{versetCourant.texteArabe}</Text>
              {!!versetCourant.translitteration && (
                <Text style={styles.aideTranslit}>{versetCourant.translitteration.texte}</Text>
              )}
            </Animated.View>
          </View>
        ) : subPhase === 'analyzing' ? (
          // ── Analyse serveur en cours ──
          <View style={styles.cardWrap}>
            <Animated.View key="analyzing" entering={FadeIn.duration(200)} style={styles.fluideCard}>
              <ActivityIndicator size="large" color="#6B4DFF" />
              <Text style={styles.fluideText}>Analyse de ta récitation…</Text>
              <Text style={styles.fluideSub}>Un instant</Text>
            </Animated.View>
          </View>
        ) : (
          // ── Enregistrement en cours → carte encourageante ──
          <View style={styles.cardWrap}>
            <Animated.View key="fluide" entering={FadeIn.duration(300)} style={styles.fluideCard}>
              <View style={styles.wave}>
                {[0, 80, 160, 240, 320, 240, 160, 80, 0].map((d, i) => <WaveBar key={i} delay={d} />)}
              </View>
              <Text style={styles.fluideText}>Récite le verset {position + 1} 🎙️</Text>
              <Text style={styles.fluideSub}>L'app t'écoute…</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Bas */}
      <View style={styles.bottom}>
        {phase === 'pret' ? (
          <Pressable style={styles.micBtn} onPress={demarrer}>
            <Feather name="mic" size={22} color="#fff" />
            <Text style={styles.micBtnText}>Commencer la récitation</Text>
          </Pressable>
        ) : subPhase === 'aide' ? (
          <Pressable style={styles.micBtn} onPress={reprendre}>
            <Feather name="arrow-right" size={20} color="#fff" />
            <Text style={styles.micBtnText}>J'ai relu, verset suivant</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.micBtn, subPhase === 'analyzing' && styles.btnDisabled]}
              onPress={versetSuivant}
              disabled={subPhase === 'analyzing'}
            >
              <Feather name="check" size={20} color="#fff" />
              <Text style={styles.micBtnText}>
                {subPhase === 'analyzing' ? 'Analyse…' : 'Verset suivant'}
              </Text>
            </Pressable>
            <Pressable style={styles.finBtn} onPress={terminerTot}>
              <Feather name="check-circle" size={20} color="#6B4DFF" />
              <Text style={styles.finBtnText}>J'ai terminé</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F9' },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#7A828F', textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  backLink: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#8A8F99', marginTop: 8 },

  // Header
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { padding: 4, width: 30 },
  headerNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  progWrap: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progBar: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  headerCount: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8 },

  // Zone centrale
  cardZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },

  // Écran prêt
  pretCard: { alignItems: 'center', paddingHorizontal: 10 },
  pretEmoji: { fontSize: 64, marginBottom: 20 },
  pretTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', marginBottom: 14 },
  pretDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#7A828F', textAlign: 'center', lineHeight: 24 },
  micDenied: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#E03434', textAlign: 'center', marginTop: 16 },

  // Carte
  cardWrap: { width: '100%', minHeight: 280, alignItems: 'center', justifyContent: 'center' },

  // Carte d'aide
  aideCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 28, paddingTop: 50,
    alignItems: 'center',
    borderWidth: 2, borderColor: '#FFE0B8',
    shadowColor: '#F0820C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  aideBadge: {
    position: 'absolute', top: 16, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF0E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  aideBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#F0820C' },
  aideArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, color: '#1B2333',
    textAlign: 'center', lineHeight: 52, writingDirection: 'rtl', marginBottom: 14,
  },
  aideTranslit: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', lineHeight: 22 },

  // Carte fluide / analyse
  fluideCard: { alignItems: 'center', gap: 14 },
  wave: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 6 },
  waveBar: { width: 6, height: 50, borderRadius: 3, backgroundColor: '#6B4DFF' },
  fluideText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  fluideSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#B0B5BE' },

  // Bas
  bottom: { paddingHorizontal: 22, paddingBottom: 38, paddingTop: 12, gap: 10 },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', borderRadius: 18, paddingVertical: 18,
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  micBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  btnDisabled: { opacity: 0.55 },
  finBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16,
    borderWidth: 2, borderColor: '#6B4DFF', borderBottomWidth: 4,
  },
  finBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#6B4DFF' },

  // Résultat
  resultGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 28 },
  resultEmoji: { fontSize: 56 },
  resultMention: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  resultCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  resultPct: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, color: '#fff' },
  resultSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  resultStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 18 },
  resultStat: { flex: 1, alignItems: 'center', gap: 4 },
  resultStatVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff' },
  resultStatLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  resultDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' },

  resultBottom: { padding: 22, paddingBottom: 36, backgroundColor: '#F4F5F9' },
  confirmTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#1B2333', textAlign: 'center' },
  confirmSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  btnsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  repBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 2,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  repBtnSuggested: { borderWidth: 3, borderColor: '#fff', borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.15)' },
  repBtnSelected: { transform: [{ scale: 0.96 }], opacity: 0.85 },
  suggestPip: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFB800',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  repBtnEmoji: { fontSize: 22 },
  repBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, marginBottom: 10,
    borderWidth: 2, borderColor: '#DDD8FF',
  },
  restartTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  quitBtn: {
    backgroundColor: '#6B4DFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  quitBtnDisabled: { opacity: 0.4 },
  quitTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
