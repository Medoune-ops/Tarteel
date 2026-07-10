import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useEffect } from 'react';
import { reviewLettre, type RevisionQuality } from '../../../lib/api';
import { useTheme } from '../../../utils/useTheme';
import DeviceStatusBar from '../../../components/StatusBar';

type Reponse = 'facile' | 'difficile' | 'oublie';

const SCORES: Record<Reponse, { label: string; emoji: string; bg: string }> = {
  facile:    { label: 'Facile',    emoji: '😊', bg: '#34C724' },
  difficile: { label: 'Difficile', emoji: '😅', bg: '#F6B100' },
  oublie:    { label: 'À revoir',  emoji: '😬', bg: '#FF6B6B' },
};

/**
 * Révision d'une leçon d'alphabet/harakat (auto-évaluation, sans audio —
 * contrairement aux sourates, ces leçons n'ont pas d'endpoint /recite).
 * Le SRS est recalculé côté serveur via POST /me/revisions/lettres/:id/review.
 */
export default function LettreRevisionScreen() {
  const router = useRouter();
  const T = useTheme();
  const { lessonId, titre } = useLocalSearchParams<{ lessonId: string; titre?: string }>();

  const [choisi, setChoisi] = useState<Reponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const choisir = useCallback(async (rep: Reponse) => {
    if (saving || !lessonId) return;
    setChoisi(rep);
    setSaving(true);
    setError(false);
    try {
      await reviewLettre(lessonId, rep as RevisionQuality);
      router.back();
    } catch {
      setError(true);
      setChoisi(null);
    } finally {
      setSaving(false);
    }
  }, [lessonId, saving, router]);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="x" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerEmoji}>📖</Text>
        <Text style={styles.headerTitle}>{titre ?? 'Révision'}</Text>
        <Text style={styles.headerSub}>Relis cette leçon, puis évalue-toi</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={[styles.question, { color: T.text }]}>Comment tu t'es senti ?</Text>

        {error && (
          <Text style={styles.errorText}>Une erreur est survenue, réessaie.</Text>
        )}

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, padding: 6 },
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
});
