import { createContext, useContext, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolation, type SharedValue,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/*
 * En-tête qui se comprime au défilement.
 *
 * Un grand en-tête fixe mange en permanence le tiers haut de l'écran. Ici il
 * se réduit à une barre fine dès qu'on descend : l'icône et le sous-titre
 * s'effacent, le titre rétrécit, mais le retour reste toujours accessible.
 *
 * `DocHeader` et `DocScroll` communiquent par ce contexte : la page les pose
 * côte à côte sans rien avoir à brancher, et les six pages de contenu en
 * bénéficient sans être modifiées.
 */
const ScrollCtx = createContext<SharedValue<number> | null>(null);

/** Hauteurs de l'en-tête, au repos et une fois comprimé. */
const H_OUVERT = 190;
const H_FERME = 92;
/** Distance de défilement sur laquelle la compression s'étale. */
const COURSE = H_OUVERT - H_FERME;

/** En-tête dégradé avec bouton retour, emoji ou icône SVG (`icon` prime), titre. */
export function DocHeader({ emoji, icon, titre, sous, c1, c2 }: {
  emoji?: string; icon?: React.ReactNode; titre: string; sous?: string; c1: string; c2: string;
}) {
  const router = useRouter();
  const scrollY = useContext(ScrollCtx);

  const hauteur = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      height: interpolate(scrollY.value, [0, COURSE], [H_OUVERT, H_FERME], Extrapolation.CLAMP),
    };
  });

  /*
   * Les marges se resserrent avec la hauteur.
   *
   * Sans ça, le `paddingTop: 54` et le `paddingBottom: 20` consomment 74 des
   * 92 pixels restants : le titre est poussé hors de la zone visible et seul
   * le bouton retour demeure. En les réduisant, le titre vient se poser à
   * côté de la flèche.
   */
  const marges = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      paddingTop: interpolate(scrollY.value, [0, COURSE], [54, 44], Extrapolation.CLAMP),
      paddingBottom: interpolate(scrollY.value, [0, COURSE], [20, 18], Extrapolation.CLAMP),
      // Le titre se décale à droite pour ne pas passer sous la flèche de
      // retour, qui reste à sa place.
      paddingLeft: interpolate(scrollY.value, [0, COURSE], [24, 56], Extrapolation.CLAMP),
    };
  });

  /*
   * L'icône et le sous-titre s'effacent AVANT la fin de la compression (à
   * 55 % de la course) : les voir s'écraser jusqu'au dernier pixel donne une
   * impression de désordre, alors qu'un fondu plus tôt laisse la barre fine
   * se poser proprement.
   */
  /*
   * L'icône et le sous-titre s'effacent ET se replient.
   *
   * L'opacité seule ne suffit pas : un élément transparent occupe toujours sa
   * place, et le titre — pris dans un conteneur en `flex: 1` — se retrouvait
   * écrasé à une hauteur de zéro. On anime donc aussi leur hauteur, pour
   * qu'ils libèrent réellement l'espace.
   */
  const fonduIcone = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
      height: interpolate(scrollY.value, [0, COURSE], [66, 0], Extrapolation.CLAMP),
      marginBottom: interpolate(scrollY.value, [0, COURSE], [10, 0], Extrapolation.CLAMP),
    };
  });

  const fonduSous = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
      height: interpolate(scrollY.value, [0, COURSE], [20, 0], Extrapolation.CLAMP),
      marginTop: interpolate(scrollY.value, [0, COURSE], [4, 0], Extrapolation.CLAMP),
    };
  });

  // Le titre rétrécit sans descendre sous 0,74 : en dessous, la police
  // devient floue sur les écrans peu denses.
  const titreStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      transform: [
        { scale: interpolate(scrollY.value, [0, COURSE], [1, 0.74], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[s.headerWrap, hauteur]}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[s.header, marges]}>
        <Pressable style={s.back} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>

        <Animated.View style={[s.iconWrap, fonduIcone]}>
          {icon ? <View style={s.icon}>{icon}</View> : <Text style={s.emoji}>{emoji}</Text>}
        </Animated.View>

        <Animated.Text style={[s.titre, titreStyle]} numberOfLines={1}>
          {titre}
        </Animated.Text>

        {sous && (
          <Animated.Text style={[s.sous, fonduSous]} numberOfLines={1}>
            {sous}
          </Animated.Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

/** Carte de section avec titre coloré. */
export function Section({ titre, children, accent = '#6B4DFF' }: {
  titre: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <View style={s.section}>
      <View style={[s.sectionBar, { backgroundColor: accent }]} />
      <Text style={[s.sectionTitre, { color: accent }]}>{titre}</Text>
      {children}
    </View>
  );
}

/** Paragraphe de texte. */
export function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.p}>{children}</Text>;
}

/** Mot/segment en gras inline (à utiliser dans un P). */
export function B({ children }: { children: React.ReactNode }) {
  return <Text style={s.b}>{children}</Text>;
}

/**
 * Citation / encadré mis en valeur. `arabe` est optionnel : quand la citation
 * est un verset du Coran, on affiche aussi son texte arabe original (RTL) au
 * dessus de la traduction, comme partout ailleurs dans l'app (lecture-libre,
 * lecteur de sourate…). `arabeSize`/`arabeLineHeight` permettent de réduire la
 * taille sur une page précise sans changer les autres (défauts inchangés).
 */
export function Quote({ children, accent = '#6B4DFF', arabe, arabeSize, arabeLineHeight }: {
  children: React.ReactNode; accent?: string; arabe?: string;
  arabeSize?: number; arabeLineHeight?: number;
}) {
  return (
    <View style={[s.quote, { borderLeftColor: accent, backgroundColor: `${accent}12` }]}>
      {arabe && (
        <Text
          style={[
            s.quoteArabe,
            { color: accent },
            arabeSize != null && { fontSize: arabeSize },
            arabeLineHeight != null && { lineHeight: arabeLineHeight },
          ]}
        >
          {arabe}
        </Text>
      )}
      <Text style={[s.quoteText, { color: accent }]}>{children}</Text>
    </View>
  );
}

/** Élément de liste numérotée (étape). */
export function Step({ num, titre, children, accent = '#6B4DFF' }: {
  num: number; titre: string; children?: React.ReactNode; accent?: string;
}) {
  return (
    <View style={s.step}>
      <View style={[s.stepNum, { backgroundColor: accent }]}>
        <Text style={s.stepNumText}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.stepTitre}>{titre}</Text>
        {children && <Text style={s.stepText}>{children}</Text>}
      </View>
    </View>
  );
}

/** Fait clé en chiffre. */
export function Fact({ val, lbl, accent = '#6B4DFF' }: { val: string; lbl: string; accent?: string }) {
  return (
    <View style={s.fact}>
      <Text style={[s.factVal, { color: accent }]}>{val}</Text>
      <Text style={s.factLbl}>{lbl}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  // `overflow: hidden` rogne le contenu pendant la compression, pour qu'il ne
  // déborde pas sur la page quand la hauteur se réduit.
  headerWrap: { overflow: 'hidden' },
  // Conteneur de l'icône : sa hauteur est animée, donc il doit rogner son
  // contenu pendant le repli au lieu de le laisser déborder.
  iconWrap: { overflow: 'hidden', alignItems: 'center' },
  // `justifyContent: flex-end` garde le titre collé au bas de l'en-tête quand
  // celui-ci rétrécit, au lieu de le laisser flotter au centre.
  // Les marges verticales et la marge gauche sont animées (voir `marges`) :
  // seule la droite est fixe ici, pour garder le titre centré au repos.
  header: {
    flex: 1, paddingRight: 24,
    alignItems: 'center', justifyContent: 'flex-end',
  },
  back: { position: 'absolute', top: 54, left: 18 },
  emoji: { fontSize: 50, marginBottom: 8 },
  icon: { marginBottom: 10 },
  titre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', textAlign: 'center' },
  sous: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },

  section: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 10 },
  sectionTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 10 },
  p: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#3A4150', lineHeight: 24, marginBottom: 10 },
  b: { fontFamily: 'Nunito_800ExtraBold', color: '#1B2333' },
  quote: {
    borderLeftWidth: 4, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  quoteText: { fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  quoteArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 15, lineHeight: 26,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: 6,
  },
  step: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#fff' },
  stepTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333', marginTop: 4 },
  stepText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#6A7280', lineHeight: 21, marginTop: 3 },
  fact: {
    flex: 1, backgroundColor: '#F4F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 2,
  },
  factVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  factLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#8A8F99', textAlign: 'center' },
});

/**
 * Conteneur scroll standard pour une page doc.
 *
 * Fournit sa position de défilement à `DocHeader` par le contexte : c'est ce
 * qui permet à l'en-tête de se comprimer sans que la page ait à brancher quoi
 * que ce soit. L'animation tourne sur le thread natif (Reanimated), donc elle
 * suit le doigt sans à-coups même sur un défilement rapide.
 */
export function DocScroll({ children }: { children: React.ReactNode }) {
  const scrollY = useContext(ScrollCtx);
  const local = useSharedValue(0);
  const cible = scrollY ?? local;

  const onScroll = useAnimatedScrollHandler((e) => {
    cible.value = e.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      // 16 ms : un événement par image à 60 Hz.
      scrollEventThrottle={16}
      contentContainerStyle={{ padding: 18, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Animated.ScrollView>
  );
}

/**
 * Variante de `DocScroll` pour les pages qui ont besoin de passer leurs
 * propres props à la liste — celle des prophètes, par exemple, qui ajoute une
 * barre de recherche et un style de contenu particulier.
 *
 * ⚠️ Doit être rendu À L'INTÉRIEUR de `DocScreen`, comme `DocScroll` : c'est
 * de là que vient la position partagée. Appeler un hook au-dessus de
 * `DocScreen` ne verrait pas le contexte et l'en-tête resterait figé.
 */
export function DocScrollView({ children, contentContainerStyle }: {
  children: React.ReactNode;
  contentContainerStyle?: object;
}) {
  const scrollY = useContext(ScrollCtx);
  const local = useSharedValue(0);
  const cible = scrollY ?? local;

  const onScroll = useAnimatedScrollHandler((e) => {
    cible.value = e.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </Animated.ScrollView>
  );
}

/**
 * Racine d'une page de contenu.
 *
 * Porte la position de défilement partagée entre `DocHeader` et `DocScroll`,
 * qui sont frères dans l'arbre et ne peuvent donc pas se la passer
 * directement. Remplace le `<View style={docStyles.screen}>` des pages.
 */
export function DocScreen({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0);
  // La valeur partagée est stable : on mémorise pour ne pas recréer le
  // contexte à chaque rendu, ce qui rejouerait l'animation.
  const ctx = useMemo(() => scrollY, [scrollY]);

  return (
    <ScrollCtx.Provider value={ctx}>
      <View style={docStyles.screen}>{children}</View>
    </ScrollCtx.Provider>
  );
}

export const docStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  factsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
});
