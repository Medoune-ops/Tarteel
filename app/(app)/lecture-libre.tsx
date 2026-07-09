import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchSourates, type SourateListItem } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { useTheme } from '../../utils/useTheme';

// « Lecture libre » — catalogue COMPLET des 114 sourates du Coran (en arabe),
// indépendant de la progression du parcours. Chaque ligne affiche le nom de la
// sourate (pour la reconnaître) et ouvre le lecteur audio qui la récite en
// entier, sans arrêt, jusqu'à la fin. Liste en défilement infini (FlatList).
export default function LectureLibreScreen() {
  const router = useRouter();
  const T = useTheme();

  const [sourates, setSourates] = useState<SourateListItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      // Le catalogue ne change jamais → SWR (affichage instantané au retour).
      setSourates(await swrFetch('sourates:all', fetchSourates, setSourates));
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderRow = useCallback(
    ({ item, index }: { item: SourateListItem; index: number }) => (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          index > 0 && [styles.divider, { borderTopColor: T.divider }],
          pressed && { opacity: 0.6 },
        ]}
        onPress={() => router.push(`/(app)/lecture/${item.numero}` as never)}
      >
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{item.numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {/* Nom de la sourate — permet de la reconnaître d'un coup d'œil. */}
          <Text style={[styles.nom, { color: T.text }]}>{item.nom}</Text>
          <Text style={[styles.arabe, { color: T.text }]}>{item.nomArabe}</Text>
          <Text style={[styles.versets, { color: T.textTertiary }]}>{item.nombreVersets} versets</Text>
        </View>
        <Feather name="play-circle" size={26} color="#6B4DFF" />
      </Pressable>
    ),
    [T, router],
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerEmoji}>🎧</Text>
        <Text style={styles.headerTitle}>Lecture libre</Text>
        <Text style={styles.headerSub}>Les 114 sourates du Coran</Text>
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
          <ActivityIndicator size="large" color="#6B4DFF" />
          <Text style={[styles.stateText, { color: T.textSecondary }]}>Chargement des sourates…</Text>
        </View>
      ) : (
        <FlatList
          data={sourates}
          keyExtractor={(s) => String(s.numero)}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <Text style={[styles.intro, { color: T.textSecondary }]}>
              Choisis une sourate pour l'écouter en entier 🔊
            </Text>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
          // Défilement infini fluide : la liste virtualise les lignes et n'en
          // rend qu'un écran à la fois, puis d'autres au fil du défilement.
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={11}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 54, left: 16 },
  headerEmoji: { fontSize: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  content: { paddingHorizontal: 18, paddingTop: 16 },
  intro: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1 },
  numBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, marginTop: 2, writingDirection: 'rtl' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
});
