import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { PLANS } from './subscription';

type MethodId = 'apple' | 'google' | 'card';

const METHODES: { id: MethodId; label: string; sub: string; icon: keyof typeof Feather.glyphMap; iconBg: string }[] = [
  { id: 'apple',  label: 'Apple Pay',     sub: 'Paiement en un geste',     icon: 'smartphone',  iconBg: '#1B2333' },
  { id: 'google', label: 'Google Pay',    sub: 'Paiement en un geste',     icon: 'smartphone',  iconBg: '#2C9CE0' },
  { id: 'card',   label: 'Carte bancaire', sub: 'Visa, Mastercard, Amex',  icon: 'credit-card', iconBg: '#6B4DFF' },
];

export default function PaymentMethodScreen() {
  const router = useRouter();
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const setPremium = useUserStore((s) => s.setPremium);

  const [method, setMethod] = useState<MethodId>('apple');

  const handleContinue = () => {
    if (method === 'card') {
      router.push({ pathname: '/(app)/payment-card', params: { plan: plan.id } });
      return;
    }
    // Apple Pay / Google Pay : confirmation immédiate (mock — pas de débit réel).
    setPremium(true);
    router.replace('/(app)/(tabs)/parcours');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Paiement</Text>
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
              <Text style={styles.recapTitle}>Tarteel Premium</Text>
              <Text style={styles.recapPlan}>Offre {plan.titre.toLowerCase()} · {plan.detail}</Text>
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
            <Text style={styles.priceLabel}>Essai gratuit</Text>
            <Text style={styles.priceFree}>7 jours · 0,00 €</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Puis, facturé {plan.titre.toLowerCase()}</Text>
            <Text style={styles.priceValue}>{plan.prix}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>À payer aujourd'hui</Text>
            <Text style={styles.totalValue}>0,00 €</Text>
          </View>
        </View>

        {/* Moyens de paiement */}
        <Text style={styles.sectionLabel}>MOYEN DE PAIEMENT</Text>
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
        <Pressable style={styles.cta} onPress={handleContinue}>
          <Feather name={method === 'card' ? 'arrow-right' : 'lock'} size={18} color="#fff" />
          <Text style={styles.ctaText}>
            {method === 'card' ? 'Continuer' : 'Confirmer et démarrer l’essai'}
          </Text>
        </Pressable>
        <Text style={styles.ctaNote}>
          <Feather name="shield" size={12} color="#8A8F99" />  Paiement sécurisé · Annulable à tout moment
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>
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
