import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';

const AVANTAGES = [
  { icon: 'slash' as const,    titre: 'Sans publicité',        desc: 'Apprends sans interruption' },
  { icon: 'heart' as const,    titre: 'Vies illimitées',       desc: 'Ne sois plus jamais bloqué' },
  { icon: 'bar-chart-2' as const, titre: 'Statistiques avancées', desc: 'Suis ta progression en détail' },
  { icon: 'download' as const, titre: 'Mode hors-ligne',        desc: 'Révise même sans connexion' },
  { icon: 'zap' as const,      titre: 'XP doublés',            desc: 'Progresse deux fois plus vite' },
];

const PLANS = [
  { id: 'annuel',  titre: 'Annuel',  prix: '15,24 €', detail: '1,27 €/mois', badge: 'ÉCONOMISE 17%', best: true },
  { id: 'mensuel', titre: 'Mensuel', prix: '1,52 €',  detail: 'par mois',    badge: null,            best: false },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState('annuel');
  const setPremium = useUserStore((s) => s.setPremium);

  // Pour l'instant (pas de paiement réel), l'essai active directement le premium.
  const startPremium = () => {
    setPremium(true);
    router.replace('/(app)/(tabs)/parcours');
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header premium */}
        <LinearGradient colors={['#FFA53D', '#F0820C']} style={styles.hero}>
          <Pressable style={styles.close} onPress={() => router.back()} hitSlop={10}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          <View style={styles.crown}>
            <Feather name="star" size={36} color="#F0820C" />
          </View>
          <Text style={styles.heroTitle}>Tarteel Premium</Text>
          <Text style={styles.heroSub}>Débloque tout ton potentiel d'apprentissage</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Avantages */}
          {AVANTAGES.map((a, i) => (
            <View key={i} style={styles.avantage}>
              <View style={styles.avantageIcon}>
                <Feather name={a.icon} size={20} color="#F0820C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.avantageTitre}>{a.titre}</Text>
                <Text style={styles.avantageDesc}>{a.desc}</Text>
              </View>
              <Feather name="check-circle" size={22} color="#34C724" />
            </View>
          ))}

          {/* Plans */}
          <Text style={styles.plansTitle}>Choisis ton offre</Text>
          {PLANS.map((p) => {
            const actif = plan === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.plan, actif && styles.planActif]}
                onPress={() => setPlan(p.id)}
              >
                {p.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{p.badge}</Text>
                  </View>
                )}
                <View style={[styles.radio, actif && styles.radioActif]}>
                  {actif && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitre}>{p.titre}</Text>
                  <Text style={styles.planDetail}>{p.detail}</Text>
                </View>
                <Text style={styles.planPrix}>{p.prix}</Text>
              </Pressable>
            );
          })}

          {/* CTA */}
          <Pressable style={styles.cta} onPress={startPremium}>
            <Text style={styles.ctaText}>Commencer l'essai gratuit de 7 jours</Text>
          </Pressable>
          <Text style={styles.ctaNote}>
            Puis {PLANS.find((p) => p.id === plan)?.prix}. Annulable à tout moment.
          </Text>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F9' },
  hero: { paddingTop: 56, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
  close: { position: 'absolute', top: 54, left: 20 },
  crown: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  heroSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 6 },
  body: { padding: 22 },
  avantage: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  avantageIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  avantageTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333' },
  avantageDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', marginTop: 2 },
  plansTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#1B2333', marginTop: 20, marginBottom: 12 },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 2, borderColor: '#E6E8ED',
  },
  planActif: { borderColor: '#F0820C', backgroundColor: '#FFFBF5' },
  planBadge: {
    position: 'absolute', top: -10, right: 16,
    backgroundColor: '#34C724', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  planBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#fff', letterSpacing: 0.3 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C9CDD4',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActif: { borderColor: '#F0820C' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F0820C' },
  planTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#1B2333' },
  planDetail: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
  planPrix: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1B2333' },
  cta: {
    backgroundColor: '#F0820C', borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    marginTop: 8, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  ctaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  ctaNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', textAlign: 'center', marginTop: 12 },
});
