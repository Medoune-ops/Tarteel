import { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ArabicText from '../../components/ArabicText';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';
import { ASMA_UL_HUSNA, asmaText, type AsmaName } from '../../constants/asmaulHusna';

// Minuscules + suppression des accents → recherche tolérante.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * « Les 99 noms d'Allah » (Asmā' ul-Ḥusnā) — écran ouvert depuis le badge du
 * profil. Chaque nom : arabe, translittération, traduction et signification
 * dans la langue de l'app (fr/en). Barre de recherche par nom ou numéro.
 */
export default function AsmaScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const language = useUserStore((s) => s.language);
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ASMA_UL_HUSNA;
    return ASMA_UL_HUSNA.filter((n) => {
      const { nom } = asmaText(n, language);
      return (
        normalize(n.translitteration).includes(q) ||
        normalize(nom).includes(q) ||
        String(n.numero).startsWith(q) ||
        n.arabe.includes(query.trim())
      );
    });
  }, [query, language]);

  const renderRow = ({ item }: { item: AsmaName }) => {
    const { nom, sens } = asmaText(item, language);
    return (
      <View style={[styles.card, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <View style={styles.cardTop}>
          <View style={styles.numBadge}>
            <Text style={styles.numText}>{item.numero}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.translit, { color: T.text }]}>{item.translitteration}</Text>
            <Text style={[styles.nom, { color: T.isDark ? '#B9A8FF' : '#6B4DFF' }]}>{nom}</Text>
          </View>
        </View>
        {/* Nom arabe sur sa propre ligne, aligné à droite (RTL) — pleine largeur
            pour éviter que les noms longs (ex. n°85) soient coupés. */}
        <ArabicText
          style={[styles.arabe, { color: T.text }]}
          harakatColor={T.isDark ? '#B9A8FF' : '#8A5CF0'}
        >
          {item.arabe}
        </ArabicText>
        <Text style={[styles.sens, { color: T.textSecondary }]}>{sens}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      {/* Header — dégradé riche + trame géométrique islamique en filigrane */}
      <LinearGradient
        colors={['#8B5CF6', '#6B4DFF', '#4A2FB8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <HeaderPattern width={width} height={210} />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>

        {/* Médaillon calligraphique : « Allah » en arabe dans un cercle lumineux */}
        <View style={styles.medallion}>
          <View style={styles.medallionInner}>
            <ArabicText style={styles.medallionText}>ٱللّٰه</ArabicText>
          </View>
        </View>

        <Text style={styles.headerTitle}>{tr('asma.headerTitle')}</Text>
        <View style={styles.headerRule} />
        <Text style={styles.headerSub}>{tr('asma.headerSub')}</Text>
      </LinearGradient>

      {/* Recherche */}
      <View style={[styles.searchBar, { backgroundColor: T.inputBg, borderColor: T.border }]}>
        <Feather name="search" size={18} color={T.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: T.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder={tr('asma.searchPlaceholder')}
          placeholderTextColor={T.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={18} color={T.textTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => String(n.numero)}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 34 }}>🔍</Text>
            <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('asma.noResults')}</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 24 }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 52, paddingBottom: 26, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { position: 'absolute', top: 54, left: 16, zIndex: 2 },
  // Médaillon rond calligraphique (le nom « Allah »), halo lumineux.
  medallion: {
    width: 76, height: 76, borderRadius: 38, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  medallionInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  medallionText: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 32, lineHeight: 58, color: '#fff',
    textAlign: 'center', includeFontPadding: false,
  },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 23, color: '#fff', marginTop: 14, textAlign: 'center' },
  // Petit filet doré décoratif sous le titre.
  headerRule: {
    width: 46, height: 3, borderRadius: 2, marginTop: 8,
    backgroundColor: '#F6B100',
  },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginTop: 14, marginBottom: 2,
    paddingHorizontal: 14, height: 48, borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 15, paddingVertical: 0 },

  content: { paddingHorizontal: 18, paddingTop: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },

  card: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numBadge: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  translit: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  nom: { fontFamily: 'Nunito_700Bold', fontSize: 13, marginTop: 1 },
  arabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 34, lineHeight: 60,
    writingDirection: 'rtl', textAlign: 'right', marginTop: 8,
  },
  sens: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18, marginTop: 8 },
});
