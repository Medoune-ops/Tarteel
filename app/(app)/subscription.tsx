import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Fonctions (pas des constantes figées) : réévaluées à chaque rendu pour
 *  rester réactives à un changement de langue en cours de session. */
function buildAvantages(tr: ReturnType<typeof useT>) {
  return [
    { icon: 'slash' as const,       titre: tr('subscription.perkNoAdsTitle'),          desc: tr('subscription.perkNoAdsDesc') },
    { icon: 'heart' as const,       titre: tr('subscription.perkUnlimitedLivesTitle'), desc: tr('subscription.perkUnlimitedLivesDesc') },
    { icon: 'bar-chart-2' as const, titre: tr('subscription.perkStatsTitle'),          desc: tr('subscription.perkStatsDesc') },
    { icon: 'zap' as const,         titre: tr('subscription.perkDoubleXpTitle'),       desc: tr('subscription.perkDoubleXpDesc') },
  ];
}

export function buildPlans(tr: ReturnType<typeof useT>) {
  return [
    { id: 'annuel',  titre: tr('subscription.planYearlyTitle'),  prix: '15,24 €', detail: '1,27 €/mois', badge: tr('subscription.planYearlyBadge'), best: true },
    { id: 'mensuel', titre: tr('subscription.planMonthlyTitle'), prix: '1,52 €',  detail: tr('subscription.planMonthlyDetail'),    badge: null,            best: false },
  ];
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const tr = useT();
  const isPremium = useUserStore((s) => s.isPremium);
  const premiumUntil = useUserStore((s) => s.premiumUntil);
  const language = useUserStore((s) => s.language);
  const AVANTAGES = buildAvantages(tr);
  const PLANS = buildPlans(tr);
  const [plan, setPlan] = useState('annuel');

  // On passe l'offre choisie à l'écran de paiement.
  const goToPayment = () => {
    router.push({ pathname: '/(app)/payment-method', params: { plan } });
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
          <Text style={styles.heroTitle}>{tr('subscription.heroTitle')}</Text>
          <Text style={styles.heroSub}>{tr('subscription.heroSub')}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {isPremium && (
            <View style={styles.activeCard}>
              <View style={styles.activeIcon}>
                <Feather name="check-circle" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>{tr('subscription.activeTitle')}</Text>
                <Text style={styles.activeSub}>
                  {premiumUntil
                    ? tr('subscription.activeUntil', { date: formatDate(premiumUntil, language) })
                    : tr('subscription.activeNoDate')}
                </Text>
                <Text style={styles.activeNote}>{tr('subscription.activeNoAutoRenew')}</Text>
              </View>
            </View>
          )}

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

          {/* Plans — masqués si déjà premium, rien à choisir avant expiration. */}
          {!isPremium && (
            <>
              <Text style={styles.plansTitle}>{tr('subscription.plansTitle')}</Text>
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
            </>
          )}

          {/* CTA — inutile si déjà premium (pas de reconduction à prolonger avant expiration). */}
          {!isPremium && (
            <>
              <Pressable style={styles.cta} onPress={goToPayment}>
                <Text style={styles.ctaText}>{tr('subscription.ctaStartTrial')}</Text>
              </Pressable>
              <Text style={styles.ctaNote}>
                {tr('subscription.ctaNote', { price: PLANS.find((p) => p.id === plan)?.prix ?? '' })}
              </Text>
            </>
          )}

          {/* Plan familial : partage le premium avec jusqu'à 5 comptes. */}
          <Pressable style={styles.familyLink} onPress={() => router.push('/(app)/household' as never)}>
            <Text style={styles.familyEmoji}>👨‍👩‍👧‍👦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.familyTitle}>{tr('household.subscriptionLinkTitle')}</Text>
              <Text style={styles.familyHint}>{tr('household.subscriptionLinkHint')}</Text>
            </View>
            <Text style={styles.familyChevron}>›</Text>
          </Pressable>

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
  activeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#E8F9E6', borderRadius: 16, padding: 16, marginBottom: 18,
    borderWidth: 1, borderColor: '#B7EAB0',
  },
  activeIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  activeTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333' },
  activeSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#2A9E1C', marginTop: 2 },
  activeNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 11.5, color: '#5A6270', marginTop: 6 },
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
  familyLink: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18,
    backgroundColor: '#F2EEFF', borderRadius: 16, padding: 14,
  },
  familyEmoji: { fontSize: 26 },
  familyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333' },
  familyHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#7A6BA8', marginTop: 2 },
  familyChevron: { fontSize: 24, color: '#6B4DFF' },
});
