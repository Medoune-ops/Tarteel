import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { DocHeader } from './_components';
import { PROPHETES } from './_prophetes-data';

export default function DocProphetes() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const resultats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROPHETES;
    return PROPHETES.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      (p.fr?.toLowerCase().includes(q)) ||
      p.arabe.includes(query.trim())
    );
  }, [query]);

  return (
    <View style={styles.screen}>
      <DocHeader emoji="👤" titre="Les Prophètes" sous="Les 25 prophètes cités dans le Coran" c1="#F0820C" c2="#D96E00" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Recherche */}
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#A0A5AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un prophète…"
            placeholderTextColor="#A0A5AE"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x-circle" size={18} color="#C9CDD4" />
            </Pressable>
          )}
        </View>

        {resultats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucun prophète trouvé</Text>
          </View>
        ) : resultats.map((p, i) => (
          <Pressable
            key={p.id}
            style={styles.card}
            onPress={() => router.push(`/(app)/docs/prophete/${p.id}` as never)}
          >
            <View style={styles.num}>
              <Text style={styles.numText}>{PROPHETES.indexOf(p) + 1}</Text>
            </View>
            <Text style={styles.emoji}>{p.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nom} numberOfLines={1}>
                {p.nom}{p.fr ? <Text style={styles.fr}>  ·  {p.fr}</Text> : null}
              </Text>
              <Text style={styles.titre} numberOfLines={1}>{p.titre}</Text>
            </View>
            <Text style={styles.arabe}>{p.arabe}</Text>
          </Pressable>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { padding: 18, paddingBottom: 30 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 50, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#1B2333', padding: 0 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#1B2333' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF0E0', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#F0820C' },
  emoji: { fontSize: 26 },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  fr: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#A0A5AE' },
  titre: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', marginTop: 2 },
  arabe: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#F0820C' },
});
