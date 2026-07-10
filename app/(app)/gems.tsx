import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { refillHeartsWithGems, buyStreakFreeze, buyDoubleXp, buyGemPack, type GemPackId } from '../../lib/api';
import { ApiError } from '../../lib/api/client';

// Coûts en gemmes (source de vérité : backend ; repris ici pour l'affichage).
const REFILL_COST = 350;
const FREEZE_COST = 200;
const DOUBLE_XP_COST = 100;

// Packs de gemmes (achat avec de l'argent, paiement mock côté backend).
const PACKS: { id: GemPackId; gems: number }[] = [
  { id: 'p500', gems: 500 },
  { id: 'p3000', gems: 3000 },
  { id: 'p7000', gems: 7000 },
];

function OptionCard({
  emoji, title, hint, cta, tint, onPress, disabled, loading, cardBg, textColor,
}: {
  emoji: string; title: string; hint: string; cta?: string; tint: string;
  onPress: () => void; disabled?: boolean; loading?: boolean; cardBg: string; textColor: string;
}) {
  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardBg, borderColor: tint + '55' }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={[styles.cardIcon, { backgroundColor: tint + '1A' }]}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
        <Text style={styles.cardHint}>{hint}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : cta ? (
        <View style={[styles.cardCta, { backgroundColor: tint }]}>
          <Text style={styles.cardCtaText}>{cta}</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={22} color={tint} />
      )}
    </Pressable>
  );
}

// Page « Mes gemmes » — ouverte en appuyant sur le compteur 💎 du parcours.
// Montre le solde et TOUTES les options possibles avec les gemmes : convertir
// en cœurs, geler la série, doubler l'XP, ou acheter plus de gemmes.
export default function GemsScreen() {
  const router = useRouter();
  const T = useTheme();
  const gems = useUserStore((s) => s.gems);
  const streakFreezes = useUserStore((s) => s.streakFreezes);
  const doubleXpUntil = useUserStore((s) => s.doubleXpUntil);

  // Action en cours (clé unique) → désactive et montre le spinner sur la bonne carte.
  const [busy, setBusy] = useState<string | null>(null);
  const doubleXpActive = doubleXpUntil != null && doubleXpUntil > Date.now();

  // Enveloppe commune : lance l'action serveur, alerte succès/échec, jamais bloquant.
  const run = async (key: string, fn: () => Promise<unknown>, okTitle: string, okMsg: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      Alert.alert(okTitle, okMsg);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'INSUFFICIENT_GEMS'
          ? "Tu n'as pas assez de gemmes pour ça."
          : e instanceof ApiError && e.status !== 0
            ? e.message
            : "Action impossible pour l'instant. Réessaie.";
      Alert.alert('Oups', msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      {/* Header */}
      <LinearGradient colors={['#4FC3F7', '#1CB0F6']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.gemBig}>💎</Text>
        <Text style={styles.headerCount}>{gems}</Text>
        <Text style={styles.headerTitle}>Mes gemmes</Text>
        <Text style={styles.headerSub}>Utilise-les pour progresser plus vite</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: T.text }]}>Dépenser mes gemmes</Text>

        <OptionCard
          emoji="❤️" tint="#FF4B4B" cardBg={T.cardBg} textColor={T.text}
          title="Convertir en cœurs"
          hint={`${REFILL_COST} 💎 → tous tes cœurs`}
          cta={String(REFILL_COST)}
          onPress={() => run('refill', refillHeartsWithGems, 'Cœurs rechargés', 'Tes cœurs sont de nouveau au maximum !')}
          loading={busy === 'refill'}
          disabled={gems < REFILL_COST}
        />

        <OptionCard
          emoji="❄️" tint="#1CB0F6" cardBg={T.cardBg} textColor={T.text}
          title="Geler ma série"
          hint={`${FREEZE_COST} 💎 · protège un jour manqué · tu en as ${streakFreezes}`}
          cta={String(FREEZE_COST)}
          onPress={() => run('freeze', buyStreakFreeze, 'Gel acheté', 'Ta série est protégée pour un jour manqué.')}
          loading={busy === 'freeze'}
          disabled={gems < FREEZE_COST}
        />

        <OptionCard
          emoji="⚡" tint="#E8A800" cardBg={T.cardBg} textColor={T.text}
          title="Double XP · 15 min"
          hint={doubleXpActive ? 'Boost déjà actif ✨' : `${DOUBLE_XP_COST} 💎 · XP ×2 pendant 15 min`}
          cta={String(DOUBLE_XP_COST)}
          onPress={() => run('xp', buyDoubleXp, 'Double XP activé', 'Tu gagnes 2× plus d\'XP pendant 15 minutes !')}
          loading={busy === 'xp'}
          disabled={gems < DOUBLE_XP_COST || doubleXpActive}
        />

        <Text style={[styles.sectionTitle, { color: T.text }]}>Obtenir plus de gemmes</Text>

        {PACKS.map((p) => (
          <OptionCard
            key={p.id}
            emoji="💎" tint="#6B4DFF" cardBg={T.cardBg} textColor={T.text}
            title={`${p.gems.toLocaleString('fr-FR')} gemmes`}
            hint="Recharge ton solde de gemmes"
            cta="Acheter"
            onPress={() => run(`pack-${p.id}`, () => buyGemPack(p.id), 'Gemmes ajoutées', `+${p.gems.toLocaleString('fr-FR')} 💎 sur ton solde.`)}
            loading={busy === `pack-${p.id}`}
          />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 22, alignItems: 'center' },
  back: { position: 'absolute', top: 16, left: 18, padding: 4, zIndex: 2 },
  gemBig: { fontSize: 44, marginTop: 8 },
  headerCount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: '#fff', marginTop: 2 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 6 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  body: { padding: 18 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 12, marginTop: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  cardHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#8A8F99', marginTop: 3 },
  cardCta: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, minWidth: 44, alignItems: 'center' },
  cardCtaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
});
