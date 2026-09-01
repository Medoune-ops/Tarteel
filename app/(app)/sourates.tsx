import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchLearnedSourates, type SourateListItem } from '../../lib/api';
import { useT } from '../../lib/i18n';
import OfflineState from '../../components/OfflineState';

// Couleurs par défaut (vert) quand la sourate n'a pas de couleur de section
// (comptes anciens / contenu legacy sans leçon taguée — voir learnedSourates.ts
// côté backend).
const FALLBACK_COLOR = '#2A9E1C';
const FALLBACK_GRADIENT: [string, string] = ['#E2F5E1', '#E2F5E1'];

// Badge « Sourates apprises » (profil) — LECTURE SEULE : liste uniquement les
// sourates que l'utilisateur a apprises en intégralité dans le parcours (toutes
// les leçons de leur section terminées). Aucune ligne n'est cliquable — la
// lecture mot par mot se fait dans les leçons du parcours.

export default function SouratesScreen() {
  const router = useRouter();
  const tr = useT();

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSourates(await fetchLearnedSourates());
    } catch (e) {
      setError(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const versets = (sourates ?? []).reduce((t, s) => t + s.nombreVersets, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('sourates.headerTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <OfflineState error={error} onRetry={load} showOfflineExits />
      ) : !sourates ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#2A9E1C" />
          <Text style={styles.stateText}>{tr('sourates.loading')}</Text>
        </View>
      ) : sourates.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={{ fontSize: 40 }}>📖</Text>
          <Text style={styles.stateText}>{tr('sourates.emptyTitle')}</Text>
          <Text style={styles.emptyHint}>
            {tr('sourates.emptyHint')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Résumé */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{sourates.length}</Text>
              <Text style={styles.summaryLabel}>{tr('sourates.summarySourates')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{versets}</Text>
              <Text style={styles.summaryLabel}>{tr('sourates.summaryVersets')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>📖</Text>
              <Text style={styles.summaryLabel}>{tr('sourates.summaryLecture')}</Text>
            </View>
          </View>

          {/* Liste (lecture seule — non cliquable) */}
          <View style={styles.list}>
            {sourates.map((s, i) => {
              const gradient = s.degrade ?? FALLBACK_GRADIENT;
              const textColor = s.couleur ?? FALLBACK_COLOR;
              return (
                <View key={s.numero} style={[styles.row, i > 0 && styles.divider]}>
                  <LinearGradient
                    colors={gradient}
                    style={styles.numBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.numText, { color: textColor }]}>{s.numero}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nom}>{s.nom}</Text>
                    <Text style={styles.versets}>{tr('sourates.versetsCount', { n: s.nombreVersets })}</Text>
                  </View>
                  <Text style={styles.arabe}>{s.nomArabe}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.note}>
            {tr('sourates.footerNote')}
          </Text>
          <View style={{ height: 24 }} />
        </ScrollView>
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

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#7A828F', textAlign: 'center' },
  emptyHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#9AA0AA', textAlign: 'center', paddingHorizontal: 12 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#2A9E1C' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  summary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#E2F5E1', borderRadius: 18, paddingVertical: 18, marginBottom: 18,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#2A9E1C' },
  summaryLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#4C8B3E', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#C6E6C2' },

  list: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  numBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#2A9E1C' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 1 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, color: '#1B2333', marginRight: 4 },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
});
