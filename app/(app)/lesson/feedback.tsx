import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import LessonHeader from '../../../components/LessonHeader';
import { useUserStore } from '../../../store/userStore';
import { correctFeedback, wrongFeedback } from '../../../constants/sounds';

const WORDS_OK = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'];

export default function FeedbackScreen() {
  const router = useRouter();
  const { ok } = useLocalSearchParams<{ ok?: string }>();
  const isOk = ok === '1';

  return isOk ? <FeedbackOk router={router} /> : <FeedbackBad router={router} />;
}

function FeedbackOk({ router }: { router: ReturnType<typeof useRouter> }) {
  // Carillon + vibration de réussite à l'apparition de l'écran.
  useEffect(() => { correctFeedback(); }, []);

  return (
    <View style={styles.screen}>
      <LessonHeader progress={1} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.verseCard}>
          <Text style={styles.arabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        </View>

        <Text style={styles.analyseLabel}>Analyse de ta récitation :</Text>
        <View style={styles.tilesRow}>
          {WORDS_OK.map((w) => (
            <View key={w} style={styles.okTile}>
              <Text style={styles.okTileText}>{w}</Text>
              <Feather name="check" size={14} color="#34C724" />
            </View>
          ))}
        </View>

        {/* Jauge circulaire */}
        <View style={styles.gaugeWrap}>
          <View style={styles.gauge}>
            <Text style={styles.gaugeScore}>94%</Text>
            <Text style={styles.gaugeLabel}>Score</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer vert */}
      <View style={styles.okFooter}>
        <Text style={styles.okFooterTitle}>✓ Excellent !</Text>
        <Text style={styles.okFooterSub}>Tajwid parfait · Toutes règles respectées</Text>
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>+15 XP gagnés</Text>
          <Feather name="star" size={18} color="#F6B100" />
        </View>
        <Pressable style={styles.okCta} onPress={() => router.replace('/(app)/lesson/finish')}>
          <Text style={styles.okCtaLabel}>Continuer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FeedbackBad({ router }: { router: ReturnType<typeof useRouter> }) {
  const loseHeart = useUserStore((s) => s.loseHeart);
  const isPremium = useUserStore((s) => s.isPremium);
  const [heartsLeft, setHeartsLeft] = useState<number | null>(null);
  const applied = useRef(false);

  // On retire 1 cœur une seule fois, au montage de l'écran d'erreur.
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    wrongFeedback();
    setHeartsLeft(loseHeart());
  }, []);

  // Le bouton continuer : si plus de cœurs (et pas premium) → écran de blocage.
  const onContinue = () => {
    if (!isPremium && heartsLeft === 0) {
      router.replace('/(app)/lesson/out-of-hearts');
    } else {
      router.replace('/(app)/lesson/finish');
    }
  };

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.55} progressColor="#FF4B4B" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.verseCardBad}>
          <Text style={styles.arabicBad}>الرَّحْمَٰنِ</Text>
          <Text style={styles.translation}>Ar-Rahman</Text>
        </View>

        <Text style={styles.analyseLabel}>Analyse :</Text>
        <View style={styles.badTile}>
          <Text style={styles.badTileArabic}>الرَّحْمَٰنِ</Text>
          <Text style={styles.badTileLabel}>× Madd manqué</Text>
        </View>

        <View style={styles.tajwidErrRow}>
          <Feather name="zap" size={18} color="#6B4DFF" />
          <Text style={styles.tajwidErrTitle}>Erreur tajwid :</Text>
        </View>
        <Text style={styles.tajwidErrText}>
          Tu n'as pas allongé le son « الرَّ ».{'\n'}Le Madd Tabii impose 2 temps d'allongement.
        </Text>
      </ScrollView>

      {/* Footer rouge */}
      <View style={styles.badFooter}>
        <Text style={styles.badFooterTitle}>✕ Réponse incorrecte</Text>
        <Text style={styles.badFooterSub}>Prononciation correcte : Ar-Raaah-maa-ni</Text>
        <View style={styles.badButtons}>
          <Pressable style={styles.replayBtn}>
            <Feather name="volume-2" size={19} color="#E03434" />
            <Text style={styles.replayLabel}>Réécouter</Text>
          </Pressable>
          <Pressable style={styles.continueBad} onPress={onContinue}>
            <Text style={styles.continueBadLabel}>Continuer →</Text>
          </Pressable>
        </View>
        {!isPremium && (
          <View style={styles.lostHeartRow}>
            <Text style={styles.lostHeartText}>Tu as perdu </Text>
            <Feather name="heart" size={14} color="#E03434" />
            <Text style={styles.lostHeartText}>
              {heartsLeft === 0 ? ' · Plus de cœurs !' : ` · Il te reste ${heartsLeft ?? ''}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { paddingHorizontal: 24, paddingTop: 8 },

  // OK
  verseCard: { backgroundColor: '#E6E8ED', borderRadius: 20, paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' },
  arabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 42, color: '#1B2333', lineHeight: 71, textAlign: 'center', writingDirection: 'rtl' },
  analyseLabel: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333', marginTop: 22, marginBottom: 12 },
  tilesRow: { flexDirection: 'row-reverse', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  okTile: {
    backgroundColor: '#DEF5E5', borderWidth: 2, borderColor: '#34C724', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  okTileText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, color: '#1B2333' },
  gaugeWrap: { alignItems: 'center', marginVertical: 24 },
  gauge: {
    width: 128, height: 128, borderRadius: 64, backgroundColor: '#fff',
    borderWidth: 8, borderColor: '#34C724', alignItems: 'center', justifyContent: 'center',
  },
  gaugeScore: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: '#2A9E1C' },
  gaugeLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  okFooter: { backgroundColor: '#DEF5E5', borderTopWidth: 3, borderTopColor: '#34C724', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  okFooterTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#2A9E1C' },
  okFooterSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#3C7A30', marginTop: 4 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 14 },
  xpText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#2A9E1C' },
  okCta: {
    height: 58, borderRadius: 16, backgroundColor: '#34C724', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  okCtaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },

  // BAD
  verseCardBad: { backgroundColor: '#E6E8ED', borderRadius: 20, paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center' },
  arabicBad: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 52, color: '#1B2333' },
  translation: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 8 },
  badTile: {
    backgroundColor: '#FFE7E7', borderWidth: 2, borderColor: '#FF4B4B', borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 18, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between',
  },
  badTileArabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, color: '#E03434' },
  badTileLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#E03434' },
  tajwidErrRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 22, marginBottom: 6 },
  tajwidErrTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  tajwidErrText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#7A828F', lineHeight: 24 },
  badFooter: { backgroundColor: '#FFE7E7', borderTopWidth: 3, borderTopColor: '#FF4B4B', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30 },
  badFooterTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#E03434' },
  badFooterSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#C53A3A', marginTop: 4, marginBottom: 14 },
  badButtons: { flexDirection: 'row', gap: 12 },
  replayBtn: {
    flex: 1, height: 56, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#FF4B4B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  replayLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#E03434' },
  continueBad: {
    flex: 1, height: 56, borderRadius: 16, backgroundColor: '#FF4B4B',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#D43A3A',
  },
  continueBadLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#fff' },
  lostHeartRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  lostHeartText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#E03434' },
});
