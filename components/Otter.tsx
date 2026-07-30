import React, { useEffect } from 'react';
import Svg, {
  Ellipse, Circle, Path, Rect, Defs, LinearGradient, Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withRepeat, withSequence, withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// Durée d'un clignement et pause aléatoire entre deux clignements, pour un
// mouvement naturel plutôt qu'un tic répétitif et prévisible.
const BLINK_DURATION = 90;
function randomBlinkPause() {
  return 2200 + Math.random() * 3000;
}

interface OtterProps {
  size?: number;
  showBook?: boolean;
}

export default function Otter({ size = 100, showBook = false }: OtterProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const eyeScale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-size * 0.035, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-1.2, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // Clignement à intervalle aléatoire (pas une boucle répétitive figée) :
    // chaque cycle programme lui-même le suivant avec une nouvelle pause.
    let cancelled = false;
    const scheduleBlink = () => {
      if (cancelled) return;
      eyeScale.value = withDelay(
        randomBlinkPause(),
        withSequence(
          withTiming(0.05, { duration: BLINK_DURATION }),
          withTiming(1, { duration: BLINK_DURATION }, (finished) => {
            if (finished) runOnJS(scheduleBlink)();
          }),
        ),
      );
    };
    scheduleBlink();
    return () => { cancelled = true; };
  }, [size]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Paupières : on écrase les yeux verticalement autour de leur centre (cy)
  // plutôt que de scaler tout le SVG, pour un clignement localisé et naturel.
  const leftEyeProps = useAnimatedProps(() => ({ ry: 8.25 * eyeScale.value }));
  const rightEyeProps = useAnimatedProps(() => ({ ry: 8.25 * eyeScale.value }));
  const leftPupilProps = useAnimatedProps(() => ({ ry: 6 * eyeScale.value }));
  const rightPupilProps = useAnimatedProps(() => ({ ry: 6 * eyeScale.value }));
  const leftShineProps = useAnimatedProps(() => ({ ry: 2.25 * eyeScale.value }));
  const rightShineProps = useAnimatedProps(() => ({ ry: 2.25 * eyeScale.value }));

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C99A63" />
            <Stop offset="1" stopColor="#AE7C49" />
          </LinearGradient>
          <LinearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C2925A" />
            <Stop offset="1" stopColor="#B0814C" />
          </LinearGradient>
          {showBook && (
            <LinearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#8A6BF5" />
              <Stop offset="1" stopColor="#5B3FD6" />
            </LinearGradient>
          )}
        </Defs>

        {/* Ground shadow */}
        <Ellipse cx={50} cy={99} rx={24} ry={3} fill="rgba(40,30,20,0.16)" />

        {/* Ears */}
        <Circle cx={28.5} cy={12} r={8.5} fill="#A8784A" />
        <Circle cx={71.5} cy={12} r={8.5} fill="#A8784A" />
        <Circle cx={30} cy={14} r={5.5} fill="#C79A66" />
        <Circle cx={73} cy={14} r={5.5} fill="#C79A66" />

        {/* Body */}
        <Ellipse cx={50} cy={75} rx={29.5} ry={26} fill="url(#bodyGrad)" />

        {/* Belly */}
        <Ellipse cx={50} cy={74} rx={19} ry={18} fill="#ECD6AC" />

        {/* Paws */}
        <Ellipse cx={36} cy={80.5} rx={6} ry={5} fill="#C99A63" />
        <Ellipse cx={64} cy={80.5} rx={6} ry={5} fill="#C99A63" />

        {/* Book (optional) */}
        {showBook && (
          <>
            <Rect x={33.5} y={70} width={33} height={23} rx={2} fill="url(#bookGrad)" />
            <Rect x={36} y={73} width={27} height={3} rx={1.5} fill="rgba(255,255,255,0.55)" />
            <Rect x={50} y={70} width={1.2} height={23} fill="rgba(0,0,0,0.22)" />
          </>
        )}

        {/* Head */}
        <Ellipse cx={50} cy={30} rx={27.5} ry={26.5} fill="url(#headGrad)" />

        {/* Face patch */}
        <Ellipse cx={52} cy={33} rx={20.5} ry={20} fill="#E8D0A4" />

        {/* Cheeks */}
        <Ellipse cx={36} cy={44} rx={5.25} ry={4} fill="rgba(255,138,138,0.55)" />
        <Ellipse cx={66} cy={44} rx={5.25} ry={4} fill="rgba(255,138,138,0.55)" />

        {/* Eyes white */}
        <AnimatedEllipse cx={39} cy={27} rx={7.5} animatedProps={leftEyeProps} fill="#ffffff" />
        <AnimatedEllipse cx={61} cy={27} rx={7.5} animatedProps={rightEyeProps} fill="#ffffff" />
        {/* Pupils */}
        <AnimatedEllipse cx={41} cy={30} rx={5.5} animatedProps={leftPupilProps} fill="#2A201A" />
        <AnimatedEllipse cx={63} cy={30} rx={5.5} animatedProps={rightPupilProps} fill="#2A201A" />
        {/* Shine */}
        <AnimatedEllipse cx={43.5} cy={27.5} rx={2.25} animatedProps={leftShineProps} fill="#ffffff" />
        <AnimatedEllipse cx={65.5} cy={27.5} rx={2.25} animatedProps={rightShineProps} fill="#ffffff" />

        {/* Nose */}
        <Ellipse cx={50} cy={40} rx={4.25} ry={3.1} fill="#3A2B20" />

        {/* Mouth */}
        <Path
          d="M44.3 44 Q50 49.5 55.7 44"
          stroke="#3A2B20"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
