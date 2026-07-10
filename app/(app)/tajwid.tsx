import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { RECITERS, DEFAULT_RECITER_ID, reciterById } from '../../constants/reciters';
import { playSurates } from '../../constants/trackPlayer';

// « Écoute du Coran » (badge Tajwid) — catalogue des 114 sourates en audio
// complet. On choisit un récitateur puis une sourate : la lecture démarre et se
// poursuit en arrière-plan (écran éteint), avec file d'attente et contrôles de
// l'écran verrouillé (react-native-track-player).
export default function TajwidScreen() {
  const router = useRouter();
  const T = useTheme();

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [reciterId, setReciterId] = useState(DEFAULT_RECITER_ID);
  const [starting, setStarting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setSourates(await swrFetch('sourates:all', fetchSourates, setSourates));
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onPlay = useCallback(async (index: number) => {
    if (!sourates || starting != null) return;
    setStarting(sourates[index]!.numero);
    try {
      const lite = sourates.map((s) => ({ numero: s.numero, nom: s.nom, nomArabe: s.nomArabe }));
      await playSurates(lite, reciterById(reciterId), index);
      router.push('/(app)/coran-player');
    } catch {
      setError(true);
    } finally {
      setStarting(null);
    }
  }, [sourates, reciterId, starting, router]);

  const renderRow = useCallback(
    ({ item, index }: { item: SourateListItem; index: number }) => (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          index > 0 && [styles.divider, { borderTopColor: T.divider }],
          pressed && { opacity: 0.6 },
        ]}
        onPress={() => onPlay(index)}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{item.numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nom, { color: T.text }]}>{item.nom}</Text>
          <Text style={[styles.arabe, { color: T.text }]}>{item.nomArabe}</Text>
          <Text style={[styles.versets, { color: T.textTertiary }]}>{item.nombreVersets} versets</Text>
        </View>
        {starting === item.numero
          ? <ActivityIndicator color="#8A5CF0" />
          : <Feather name="play-circle" size={26} color="#8A5CF0" />}
      </Pressable>
    ),
    [T, onPlay, starting],
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      {/* Header */}
      <LinearGradient colors={['#9A6CF5', '#7C3AED']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerEmoji}>🎧</Text>
        <Text style={styles.headerTitle}>Écoute du Coran</Text>
        <Text style={styles.headerSub}>Continue même écran éteint 🌙</Text>
      </LinearGradient>

      {error ? (
        <View style={styles.stateBox}>
          <Feather name="wifi-off" size={32} color={T.textTertiary} />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>Impossible de charger les sourates.</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryLabel}>Réessayer</Text>
          </Pressable>
        </View>
      ) : !sourates ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color="#8A5CF0" />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>Chargement des sourates…</Text>
        </View>
      ) : (
        <>
          {/* Choix du récitateur */}
          <View style={styles.reciterWrap}>
            <Text style={[styles.reciterLabel, { color: T.textSecondary }]}>Récitateur</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reciterRow}
            >
              {RECITERS.map((r) => {
                const active = r.id === reciterId;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setReciterId(r.id)}
                    style={[
                      styles.reciterChip,
                      { backgroundColor: active ? '#8A5CF0' : T.cardBg, borderColor: active ? '#8A5CF0' : T.border },
                    ]}
                  >
                    <Text style={[styles.reciterChipText, { color: active ? '#fff' : T.text }]}>{r.nom}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            data={sourates}
            keyExtractor={(s) => String(s.numero)}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={11}
            removeClippedSubviews
            ListFooterComponent={<View style={{ height: 24 }} />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 2 },
  headerEmoji: { fontSize: 34, marginTop: 6 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#8A5CF0' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  reciterWrap: { paddingTop: 14 },
  reciterLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.5, marginLeft: 18, marginBottom: 8, textTransform: 'uppercase' },
  reciterRow: { paddingHorizontal: 18, gap: 8 },
  reciterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  reciterChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  content: { paddingHorizontal: 18, paddingTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1 },
  numBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFE8FF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#8A5CF0' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, marginTop: 2, writingDirection: 'rtl' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
