import { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import {
  useSharedValue, useAnimatedReaction, withDelay, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';

interface CountUpProps {
  /** Valeur cible finale (nombre entier ou déjà arrondi). */
  value: number;
  /** Texte ajouté après le nombre (ex: " XP", "%"). Ignoré si `format` est fourni. */
  suffix?: string;
  /** Texte ajouté avant le nombre (ex: "+", "×"). Ignoré si `format` est fourni. */
  prefix?: string;
  /** Formatte la valeur courante (ex: ms → "m:ss"). Prioritaire sur prefix/suffix. */
  format?: (current: number) => string;
  delay?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

// Compteur qui défile de 0 jusqu'à `value` — utilisé pour les stats de fin de leçon.
// Le calcul du texte (via `format`, une fonction JS arbitraire) se fait côté JS
// via runOnJS plutôt que dans le worklet UI — appeler une fonction non-worklet
// depuis un worklet crashe sur natif (Reanimated exige des worklets).
export default function CountUp({ value, suffix = '', prefix = '', format, delay = 0, duration = 900, style }: CountUpProps) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(() => (format ? format(0) : `${prefix}0${suffix}`));

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(value, { duration, easing: Easing.out(Easing.cubic) }));
  }, [value, delay, duration]);

  // Le formatage (appel de `format`, une fonction JS non-worklet) doit se faire
  // entièrement côté JS : on passe uniquement le nombre brut à runOnJS, jamais
  // le résultat de `format(...)` — l'évaluer ici arriverait sur le thread UI.
  const applyDisplay = (current: number) => {
    setDisplay(format ? format(current) : `${prefix}${current}${suffix}`);
  };

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(applyDisplay)(current);
    },
    [format, prefix, suffix],
  );

  return <Text style={style}>{display}</Text>;
}
