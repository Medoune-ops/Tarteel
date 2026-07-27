import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { subscribePremium, type PremiumPlan, type CheckoutSession } from '../../lib/api/billing';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { buildPlans } from './subscription';
import { useT } from '../../lib/i18n';
import { useAppConfigStore } from '../../store/appConfigStore';

type MethodId = 'apple' | 'google' | 'card';

export default function PaymentMethodScreen() {
  const router = useRouter();
  const tr = useT();
  const pricing = useAppConfigStore((s) => s.pricing);
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const PLANS = buildPlans(tr, pricing);
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const METHODES: { id: MethodId; label: string; sub: string; icon: keyof typeof Feather.glyphMap; iconBg: string }[] = [
    { id: 'apple',  label: tr('paymentMethod.applePay'),     sub: tr('paymentMethod.oneTapPayment'),  icon: 'smartphone',  iconBg: '#1B2333' },
    { id: 'google', label: tr('paymentMethod.googlePay'),    sub: tr('paymentMethod.oneTapPayment'),  icon: 'smartphone',  iconBg: '#2C9CE0' },
    { id: 'card',   label: tr('paymentMethod.cardLabel'),    sub: tr('paymentMethod.cardSub'),         icon: 'credit-card', iconBg: '#6B4DFF' },
  ];

  const [method, setMethod] = useState<MethodId>('apple');
  const [paying, setPaying] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  // DexPay ne gère QUE la carte (choix produit acté) — quelle que soit la
  // méthode affichée ici, le paiement réel passe par le checkout DexPay carte.
  const handleContinue = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const s = await subscribePremium(plan.id as PremiumPlan);
      setSession(s);
    } catch (e) {
      const msg = e instanceof ApiError && e.status !== 0 ? e.message : tr('paymentMethod.errorMessage');
      Alert.alert(tr('paymentMethod.errorTitle'), msg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('paymentMethod.headerTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Récap de l'offre */}
        <LinearGradient colors={['#FFA53D', '#F0820C']} style={styles.recap}>
          <View style={styles.recapTop}>
            <View style={styles.recapStar}>
              <Feather name="star" size={20} color="#F0820C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recapTitle}>{tr('paymentMethod.premiumTitle')}</Text>
              <Text style={styles.recapPlan}>{tr('paymentMethod.planOffer', { plan: plan.titre.toLowerCase(), detail: plan.detail })}</Text>
            </View>
          </View>
          {plan.badge && (
            <View style={styles.recapBadge}>
              <Text style={styles.recapBadgeText}>{plan.badge}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Détail prix */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{tr('paymentMethod.planLabel', { plan: plan.titre.toLowerCase() })}</Text>
            <Text style={styles.priceValue}>{plan.prix}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>{tr('paymentMethod.dueToday')}</Text>
            <Text style={styles.totalValue}>{plan.prix}</Text>
          </View>
        </View>

        {/* Moyens de paiement */}
        <Text style={styles.sectionLabel}>{tr('paymentMethod.sectionLabel')}</Text>
        <View style={styles.card}>
          {METHODES.map((m, i) => {
            const actif = method === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.method, i > 0 && styles.divider]}
                onPress={() => setMethod(m.id)}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.iconBg }]}>
                  <Feather name={m.icon} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodSub}>{m.sub}</Text>
                </View>
                <View style={[styles.radio, actif && styles.radioActif]}>
                  {actif && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <Pressable style={[styles.cta, paying && { opacity: 0.7 }]} onPress={handleContinue} disabled={paying}>
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name={method === 'card' ? 'arrow-right' : 'lock'} size={18} color="#fff" />
              <Text style={styles.ctaText}>
                {method === 'card' ? tr('paymentMethod.ctaContinue') : tr('paymentMethod.ctaConfirmPay')}
              </Text>
            </>
          )}
        </Pressable>
        <Text style={styles.ctaNote}>
          <Feather name="shield" size={12} color="#8A8F99" />  {tr('paymentMethod.securityNote')}
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={(outcome) => {
            setSession(null);
            if (outcome === 'success') router.replace('/(app)/(tabs)/parcours');
          }}
        />
      )}
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

  recap: { borderRadius: 18, padding: 18 },
  recapTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  recapStar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  recapTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
  recapPlan: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  recapBadge: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  recapBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#fff', letterSpacing: 0.3 },

  priceCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99' },
  priceFree: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#34C724' },
  priceValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#1B2333' },
  priceDivider: { height: 1, backgroundColor: '#F0F1F4', marginVertical: 12 },
  totalLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  totalValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1B2333' },

  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 22, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  method: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  methodIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  methodSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C9CDD4',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActif: { borderColor: '#F0820C' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F0820C' },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#F0820C', borderRadius: 18, paddingVertical: 18,
    marginTop: 22, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  ctaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  ctaNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', textAlign: 'center', marginTop: 12 },
});
