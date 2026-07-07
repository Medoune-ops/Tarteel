import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { reviewRegainHeart } from '../../../lib/api/gems';
import { fetchVersets, submitRevisionReview, type SourateVersets } from '../../../lib/api';
import { useUserStore, MAX_HEARTS } from '../../../store/userStore';
import { t } from '../../../lib/i18n';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useState, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

type Reponse = 'facile' | 'difficile' | 'oublie';
type Phase = 'pret' | 'recitation' | 'fini';

const SCORES: Record<Reponse, { label: string; emoji: string; bg: string; pts: number }> = {
  facile:    { label: 'Facile',    emoji: '😊', bg: '#34C724', pts: 10 },
  difficile: { label: 'Difficile', emoji: '😅', bg: '#F6B100', pts: 5  },
  oublie:    { label: 'À revoir',  emoji: '😬', bg: '#FF6B6B', pts: 0  },
};

// ── Onde sonore animée (mock écoute micro) ──────────────────────────────────
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
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const language = useUserStore((s) => s.language);

  const [data, setData] = useState<SourateVersets | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!numero) { setError(true); return; }
    setError(false);
    try {
      setData(await fetchVersets(numero, language));
    } catch {
      setError(true);
    }
  }, [numero, language]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const [phase, setPhase]       = useState<Phase>('pret');
  const [position, setPosition] = useState(0);      // verset courant en cours de récitation
  const [aideVisible, setAide]  = useState(false);  // la carte révèle-t-elle le verset ?
  const [nbAides, setNbAides]   = useState(0);
  const [choisi, setChoisi]     = useState<Reponse | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Empêche un double-appui sur « Terminer » d'envoyer deux fois la même
  // session (double POST /me/revisions/:numero/review).
  const quittingRef = useRef(false);

  // ── Simulation de la récitation (mock reconnaissance vocale) ──
  // Chaque verset : l'utilisateur récite ~2s. Aléatoirement il "bloque" →
  // l'app affiche l'aide après un court délai, puis il reprend et on avance.
  const lancerVerset = useCallback((i: number, total: number) => {
    if (i >= total) {
      setPhase('fini');
      return;
    }
    setPosition(i);
    setAide(false);

    // 45% de chance de bloquer sur ce verset
    const bloque = Math.random() < 0.45;
    if (bloque) {
      // après 1.4s de récitation fluide, il hésite → l'app révèle le verset
      timer.current = setTimeout(() => {
        setAide(true);
        setNbAides(n => n + 1);
        // il relit avec l'aide ~1.8s puis reprend fluide → on masque et on avance
        timer.current = setTimeout(() => {
          setAide(false);
          timer.current = setTimeout(() => lancerVerset(i + 1, total), 600);
        }, 1800);
      }, 1400);
    } else {
      // récitation fluide → la carte ne montre rien, on avance
      timer.current = setTimeout(() => lancerVerset(i + 1, total), 2200);
    }
  }, []);

  const demarrer = () => {
    if (!data) return;
    setPhase('recitation');
    setNbAides(0);
    lancerVerset(0, data.versets.length);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setPhase('pret'); setPosition(0); setAide(false); setNbAides(0); setChoisi(null);
  };

  if (error) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>Impossible de charger la sourate.</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLabel}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>Chargement de la sourate…</Text>
      </View>
    );
  }

  const versets = data.versets;

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
            await submitRevisionReview(data.sourate.numero, choisi!);
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
              await reviewRegainHeart(data.sourate.numero);
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
            <Text style={styles.headerNom} numberOfLines={1}>{data.sourate.nom} · {data.sourate.nomArabe}</Text>
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
              Récite toute la sourate à voix haute. L'app t'écoute.{'\n'}
              Si tu hésites, la carte t'affiche le verset.{'\n'}
              Dès que tu reprends, elle se masque.
            </Text>
          </View>
        ) : (
          // ── Carte d'aide (visible seulement si l'utilisateur bloque) ──
          <View style={styles.cardWrap}>
            {aideVisible ? (
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
                {versetCourant.translitteration?.texte != null && (
                  <Text style={styles.aideTranslit}>{versetCourant.translitteration.texte}</Text>
                )}
              </Animated.View>
            ) : (
              // Récitation fluide → carte vide encourageante
              <Animated.View
                key="fluide"
                entering={FadeIn.duration(300)}
                style={styles.fluideCard}
              >
                <View style={styles.wave}>
                  {[0, 80, 160, 240, 320, 240, 160, 80, 0].map((d, i) => <WaveBar key={i} delay={d} />)}
                </View>
                <Text style={styles.fluideText}>Continue, tu gères ! 🌟</Text>
                <Text style={styles.fluideSub}>L'app t'écoute…</Text>
              </Animated.View>
            )}
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
        ) : (
          <Pressable style={styles.finBtn} onPress={() => { if (timer.current) clearTimeout(timer.current); setPhase('fini'); }}>
            <Feather name="check-circle" size={20} color="#6B4DFF" />
            <Text style={styles.finBtnText}>J'ai terminé</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F9' },

  centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#7A828F', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  backLabel: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#6B4DFF' },

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
    fontFamily: 'Nunito_800ExtraBold', fontSize: 27, color: '#1B2333',
    textAlign: 'center', lineHeight: 46, writingDirection: 'rtl', marginBottom: 14,
  },
  aideTranslit: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', lineHeight: 22 },

  // Carte fluide
  fluideCard: { alignItems: 'center', gap: 14 },
  wave: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 6 },
  waveBar: { width: 6, height: 50, borderRadius: 3, backgroundColor: '#6B4DFF' },
  fluideText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  fluideSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#B0B5BE' },

  // Bas
  bottom: { paddingHorizontal: 22, paddingBottom: 38, paddingTop: 12 },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', borderRadius: 18, paddingVertical: 18,
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  micBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
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
