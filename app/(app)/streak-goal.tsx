import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Alert,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { playSound } from '../../constants/sounds';
import { streakReward } from '../../constants/rewards';

const PRESETS = [7, 14, 30, 50, 100, 365];
const MAX_GOAL = 9999;

export default function StreakGoalScreen() {
  const router = useRouter();
  const streak = useUserStore((s) => s.streak);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const setStreakGoal = useUserStore((s) => s.setStreakGoal);
  const claimStreakReward = useUserStore((s) => s.claimStreakReward);

  const defaultGoal = streakGoal ?? PRESETS.find((p) => p > streak) ?? 30;
  // Si l'objectif courant n'est pas un preset, on le met directement dans le champ libre.
  const [picked, setPicked] = useState<number>(defaultGoal);
  const [custom, setCustom] = useState<string>(
    streakGoal != null && !PRESETS.includes(streakGoal) ? String(streakGoal) : '',
  );

  // L'objectif effectif : le champ libre prime s'il est renseigné et valide.
  const customNum = parseInt(custom, 10);
  const customValid = custom !== '' && customNum >= 1 && customNum <= MAX_GOAL;
  const target = customValid ? customNum : picked;
  // Le champ libre doit être > série en cours pour être un vrai défi (sinon déjà atteint).
  const canSave = target >= 1 && (customValid ? customNum > 0 : true);

  const goalReached = streakGoal != null && streak >= streakGoal;
  const progress = streakGoal ? Math.min(1, streak / streakGoal) : 0;

  const claim = () => {
    const gained = claimStreakReward();
    if (gained > 0) {
      playSound('finish');
      Alert.alert('🎉 Objectif atteint !', `Tu remportes +${gained} XP. Fixe un nouvel objectif quand tu veux !`);
    }
  };

  const save = () => {
    if (!canSave) return;
    setStreakGoal(target);
    playSound('start');
    router.back();
  };

  const pickPreset = (p: number) => {
    setPicked(p);
    setCustom(''); // un preset annule la saisie libre
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Objectif de série</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Carte série actuelle */}
        <LinearGradient colors={['#FF8A4B', '#FF4B4B']} style={styles.hero}>
          <Text style={styles.heroFlame}>🔥</Text>
          <Text style={styles.heroStreak}>{streak} jours</Text>
          <Text style={styles.heroLabel}>Série en cours</Text>

          {streakGoal != null && (
            <>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.heroGoal}>
                {goalReached ? '🎯 Objectif atteint !' : `${streak} / ${streakGoal} jours`}
              </Text>
            </>
          )}
        </LinearGradient>

        {/* Cadeau à réclamer si atteint */}
        {goalReached && (
          <Pressable style={styles.claimCard} onPress={claim}>
            <View style={styles.giftIcon}>
              <Feather name="gift" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.claimTitle}>Récupère ton cadeau !</Text>
              <Text style={styles.claimSub}>+{streakReward(streakGoal!).toLocaleString('fr-FR')} XP t'attendent</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#E0A02C" />
          </Pressable>
        )}

        {/* Choix de l'objectif */}
        <Text style={styles.sectionLabel}>
          {goalReached ? 'FIXER UN NOUVEL OBJECTIF' : 'CHOISIR UN OBJECTIF'}
        </Text>
        <View style={styles.grid}>
          {PRESETS.map((p) => {
            const active = !customValid && picked === p;
            return (
              <Pressable
                key={p}
                style={[styles.preset, active && styles.presetActive]}
                onPress={() => pickPreset(p)}
              >
                <Text style={[styles.presetDays, active && styles.presetTextActive]}>{p}</Text>
                <Text style={[styles.presetUnit, active && styles.presetTextActive]}>jours</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Objectif personnalisé */}
        <Text style={styles.sectionLabel}>OU UN NOMBRE PERSONNALISÉ</Text>
        <View style={[styles.customRow, customValid && styles.customRowActive]}>
          <Feather name="flag" size={20} color={customValid ? '#FF4B4B' : '#9AA0AA'} />
          <TextInput
            style={styles.customInput}
            value={custom}
            onChangeText={(v) => setCustom(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex : 200"
            placeholderTextColor="#B8BCC4"
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.customUnit}>jours</Text>
        </View>

        <Text style={styles.note}>
          C'est juste un défi motivant 💪 — ça ne change rien à ta série : 1 jour sans cours, elle gèle ;
          2 jours, elle repart à zéro.
        </Text>

        {/* Aperçu du cadeau */}
        <View style={styles.rewardPreview}>
          <Text style={styles.rewardPreviewLabel}>🎁 Cadeau à la clé</Text>
          <Text style={styles.rewardPreviewValue}>+{streakReward(target).toLocaleString('fr-FR')} XP</Text>
        </View>

        <Pressable style={[styles.cta, !canSave && styles.ctaDisabled]} onPress={save} disabled={!canSave}>
          <Text style={styles.ctaText}>
            {streakGoal === target ? 'Garder cet objectif' : `Viser ${target} jours`}
          </Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  content: { paddingHorizontal: 22, paddingVertical: 18 },

  hero: { borderRadius: 22, paddingVertical: 26, paddingHorizontal: 22, alignItems: 'center' },
  heroFlame: { fontSize: 46 },
  heroStreak: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: '#fff', marginTop: 6 },
  heroLabel: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  barTrack: { width: '100%', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 18, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6, backgroundColor: '#fff' },
  heroGoal: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff', marginTop: 10 },

  claimCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16,
    backgroundColor: '#FFF7E6', borderRadius: 18, padding: 16,
    borderWidth: 2, borderColor: '#F0C04C',
  },
  giftIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#E0A02C', alignItems: 'center', justifyContent: 'center' },
  claimTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#8A5A0C' },
  claimSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#B07A1C', marginTop: 2 },

  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  preset: {
    width: '30.5%', aspectRatio: 1.15, borderRadius: 16, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E6E8ED',
  },
  presetActive: { borderColor: '#FF4B4B', backgroundColor: '#FFF0F0' },
  presetDays: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333' },
  presetUnit: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99' },
  presetTextActive: { color: '#FF4B4B' },

  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, height: 58,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16,
    borderWidth: 2, borderColor: '#E6E8ED',
  },
  customRowActive: { borderColor: '#FF4B4B', backgroundColor: '#FFF0F0' },
  customInput: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1B2333' },
  customUnit: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#8A8F99' },

  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 18, lineHeight: 20, paddingHorizontal: 8 },

  rewardPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF7E6', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, marginTop: 18,
  },
  rewardPreviewLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#8A5A0C' },
  rewardPreviewValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#E0A02C' },

  cta: {
    height: 58, borderRadius: 18, backgroundColor: '#FF4B4B', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, borderBottomWidth: 4, borderBottomColor: '#D43A3A',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
});
