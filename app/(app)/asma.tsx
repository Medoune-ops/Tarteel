import { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { useAsmaFavoritesStore } from '../../store/asmaFavoritesStore';
import { useT } from '../../lib/i18n';
import { nameOfTheDay } from '../../utils/nameOfDay';
import { ASMA_UL_HUSNA, asmaText, type AsmaName } from '../../constants/asmaulHusna';

// Minuscules + suppression des accents → recherche tolérante.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ─── Palette de la maquette (Tarteel Noms et Objectif) ─────────────────────
type Palette = {
  bg: string; card: string; ink: string; muted: string; accent: string; accentSoft: string;
  hero: readonly [string, string, string];
  favBg: string;
};
const LIGHT: Palette = {
  bg: '#F4F3F8', card: '#FFFFFF', ink: '#1A1730', muted: '#6F6B84', accent: '#6B4DFF', accentSoft: '#EEEAFF',
  hero: ['#4A31C2', '#6B4DFF', '#8A6CFF'], favBg: '#FDE8E7',
};
const DARK: Palette = {
  bg: '#0C0B12', card: '#17151F', ink: '#EEEDF5', muted: '#918DA6', accent: '#9A82FF', accentSoft: 'rgba(139,112,255,0.16)',
  hero: ['#130D2C', '#22165A', '#33227E'], favBg: 'rgba(224,88,79,0.16)',
};
const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };
const FAV = '#E0584F';

function Heart({ size, filled, color }: { size: number; filled: boolean; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        fill={filled ? color : 'none'} stroke={color} strokeWidth={2.4} strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * « Les 99 noms d'Allah » (Asmā' ul-Ḥusnā) — écran ouvert depuis le badge du
 * profil. Chaque nom : arabe, translittération, traduction et signification
 * dans la langue de l'app (fr/en), avec favoris et nom du jour.
 */
export default function AsmaScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const P = T.isDark ? DARK : LIGHT;
  const language = useUserStore((s) => s.language);
  const favorites = useAsmaFavoritesStore((s) => s.favorites);
  const toggleFav = useAsmaFavoritesStore((s) => s.toggle);
  const [query, setQuery] = useState('');

  const daily = nameOfTheDay();
  const dailyText = asmaText(daily, language);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ASMA_UL_HUSNA;
    return ASMA_UL_HUSNA.filter((n) => {
      const { nom, sens } = asmaText(n, language);
      return (
        normalize(n.translitteration).includes(q) ||
        normalize(nom).includes(q) ||
        normalize(sens).includes(q) ||
        String(n.numero).startsWith(q) ||
        n.arabe.includes(query.trim())
      );
    });
  }, [query, language]);

  const shadow = T.isDark ? styles.borderDark : styles.shadow;

  const renderRow = ({ item }: { item: AsmaName }) => {
    const { nom, sens } = asmaText(item, language);
    const fav = favorites.includes(item.numero);
    return (
      <View style={[styles.card, { backgroundColor: P.card }, shadow]}>
        <View style={styles.row}>
          {/* Étoile à 8 branches : deux carrés superposés, l'un tourné de 45°. */}
          <View style={styles.star}>
            <View style={[styles.starSq, { backgroundColor: P.accentSoft }]} />
            <View style={[styles.starSq, { backgroundColor: P.accentSoft, transform: [{ rotate: '45deg' }] }]} />
            <Text style={[styles.starNum, { color: P.accent }]}>{item.numero}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.translit, { color: P.ink }]} numberOfLines={1}>{item.translitteration}</Text>
            <Text style={[styles.nom, { color: P.accent }]} numberOfLines={1}>{nom}</Text>
          </View>
          <Text style={[styles.arabe, { color: P.ink }]} numberOfLines={1} adjustsFontSizeToFit>
            {item.arabe}
          </Text>
        </View>
        <View style={styles.descRow}>
          <Text style={[styles.sens, { color: P.muted }]}>{sens}</Text>
          <Pressable
            onPress={() => toggleFav(item.numero)}
            hitSlop={6}
            style={[styles.favBtn, { backgroundColor: fav ? P.favBg : 'transparent' }]}
          >
            <Heart size={16} filled={fav} color={fav ? FAV : P.muted} />
          </Pressable>
        </View>
      </View>
    );
  };

  const header = (
    <View>
      <LinearGradient colors={P.hero} locations={[0, 0.6, 1]} {...G160} style={styles.hero}>
        <View style={[styles.deco, { transform: [{ rotate: '45deg' }] }]} />
        <View style={styles.deco} />
        <DeviceStatusBar />
        <View style={styles.heroBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#3B2A99" />
          </Pressable>
          <View style={styles.favPill}>
            <Heart size={13} filled color="#fff" />
            <Text style={styles.favPillText}>{tr('asma.favCount', { n: favorites.length })}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>{tr('asma.headerTitle')}</Text>
        <Text style={styles.heroSub}>{tr('asma.headerSub')}</Text>

        <View style={styles.daily}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.dailyLabel}>{tr('asma.dailyLabel', { n: daily.numero })}</Text>
            <Text style={styles.dailyTr} numberOfLines={1}>{daily.translitteration}</Text>
            <Text style={styles.dailyFr} numberOfLines={2}>{dailyText.nom}</Text>
          </View>
          <Text style={styles.dailyAr} numberOfLines={1} adjustsFontSizeToFit>{daily.arabe}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.search, { backgroundColor: P.card }, shadow]}>
        <Feather name="search" size={18} color={P.muted} />
        <TextInput
          style={[styles.searchInput, { color: P.ink }]}
          value={query}
          onChangeText={setQuery}
          placeholder={tr('asma.searchPlaceholder')}
          placeholderTextColor={P.muted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={18} color={P.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={(n) => String(n.numero)}
        renderItem={renderRow}
        extraData={favorites}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: P.muted }]}>{tr('asma.noResultsFor', { q: query.trim() })}</Text>
        }
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={11}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shadow: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  borderDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  hero: {
    paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  deco: {
    position: 'absolute', right: -60, top: 90, width: 220, height: 220,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 36,
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  favPill: {
    height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  favPillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: '#fff', marginTop: 18 },
  heroSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  daily: {
    marginTop: 18, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  dailyLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1, color: 'rgba(255,255,255,0.7)' },
  dailyTr: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, lineHeight: 26, color: '#fff', marginTop: 4 },
  dailyFr: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  dailyAr: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 46, lineHeight: 70, color: '#fff',
    maxWidth: '50%', writingDirection: 'rtl',
  },

  search: {
    marginTop: 16, marginHorizontal: 18, marginBottom: 4, height: 50, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: 'Nunito_700Bold', fontSize: 15, paddingVertical: 0 },

  card: {
    marginHorizontal: 18, marginTop: 10, borderRadius: 22,
    paddingTop: 16, paddingBottom: 16, paddingLeft: 14, paddingRight: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  star: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  starSq: { position: 'absolute', top: 5, left: 5, right: 5, bottom: 5, borderRadius: 7 },
  starNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, lineHeight: 18 },
  translit: { fontFamily: 'Nunito_900Black', fontSize: 16 },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  arabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 34, lineHeight: 52,
    maxWidth: '45%', writingDirection: 'rtl', textAlign: 'right',
  },
  descRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 8, paddingLeft: 52 },
  sens: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19 },
  favBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  empty: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center', paddingVertical: 30, paddingHorizontal: 28 },
});
