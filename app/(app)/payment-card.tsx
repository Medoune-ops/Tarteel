import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { PLANS } from './subscription';

// ─── Helpers de formatage ────────────────────────────────────────────────────
const formatCardNumber = (v: string) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const detectBrand = (num: string): keyof typeof Feather.glyphMap | null => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'credit-card';
  if (/^5[1-5]/.test(n)) return 'credit-card';
  return null;
};

export default function PaymentCardScreen() {
  const router = useRouter();
  const { plan: planId } = useLocalSearchParams<{ plan: string }>();
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];
  const setPremium = useUserStore((s) => s.setPremium);

  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paying, setPaying] = useState(false);

  const valid =
    number.replace(/\s/g, '').length === 16 &&
    name.trim().length > 2 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const handlePay = () => {
    if (!valid || paying) return;
    setPaying(true);
    // Mock d'appel paiement — à remplacer par Stripe/PaymentSheet au branchement back.
    setTimeout(() => {
      setPremium(true);
      router.replace('/(app)/(tabs)/parcours');
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Carte bancaire</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Aperçu de la carte */}
          <LinearGradient colors={['#6B4DFF', '#4B32C2']} style={styles.cardPreview}>
            <View style={styles.cardTop}>
              <View style={styles.chip} />
              <Feather name={detectBrand(number) ?? 'credit-card'} size={28} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.cardNum}>{number || '•••• •••• •••• ••••'}</Text>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardMini}>TITULAIRE</Text>
                <Text style={styles.cardVal}>{name.toUpperCase() || 'VOTRE NOM'}</Text>
              </View>
              <View>
                <Text style={styles.cardMini}>EXP.</Text>
                <Text style={styles.cardVal}>{expiry || 'MM/AA'}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Formulaire */}
          <Text style={styles.label}>Numéro de carte</Text>
          <View style={styles.inputWrap}>
            <Feather name="credit-card" size={18} color="#8A8F99" />
            <TextInput
              style={styles.input}
              value={number}
              onChangeText={(v) => setNumber(formatCardNumber(v))}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#B8BCC4"
              keyboardType="number-pad"
              maxLength={19}
            />
          </View>

          <Text style={styles.label}>Nom du titulaire</Text>
          <View style={styles.inputWrap}>
            <Feather name="user" size={18} color="#8A8F99" />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Medoune Seck"
              placeholderTextColor="#B8BCC4"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Expiration</Text>
              <View style={styles.inputWrap}>
                <Feather name="calendar" size={18} color="#8A8F99" />
                <TextInput
                  style={styles.input}
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/AA"
                  placeholderTextColor="#B8BCC4"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CVV</Text>
              <View style={styles.inputWrap}>
                <Feather name="lock" size={18} color="#8A8F99" />
                <TextInput
                  style={styles.input}
                  value={cvv}
                  onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  placeholderTextColor="#B8BCC4"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.cta, (!valid || paying) && styles.ctaDisabled]}
            onPress={handlePay}
            disabled={!valid || paying}
          >
            <Feather name="lock" size={18} color="#fff" />
            <Text style={styles.ctaText}>
              {paying ? 'Traitement…' : `Démarrer l’essai · puis ${plan.prix}`}
            </Text>
          </Pressable>
          <Text style={styles.note}>
            <Feather name="shield" size={12} color="#8A8F99" />  Tes informations sont chiffrées et ne sont pas stockées.
          </Text>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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

  cardPreview: { borderRadius: 20, padding: 22, height: 200, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { width: 42, height: 30, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.55)' },
  cardNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', letterSpacing: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardMini: { fontFamily: 'Nunito_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  cardVal: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff', marginTop: 2 },

  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#1B2333', marginTop: 18, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 54,
    borderWidth: 2, borderColor: '#E6E8ED',
  },
  input: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },
  row: { flexDirection: 'row', gap: 14 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#F0820C', borderRadius: 18, paddingVertical: 18,
    marginTop: 26, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', textAlign: 'center', marginTop: 12 },
});
