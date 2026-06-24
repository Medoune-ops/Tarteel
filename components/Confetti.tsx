import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

const COLORS = ['#FFE07A', '#FF8FA3', '#7BE0C2', '#9D7BFF', '#FFB454', '#7AC6FF', '#fff'];

interface PieceProps {
  originX: number;
  originY: number;
  delay: number;
}

function Piece({ originX, originY, delay }: PieceProps) {
  const progress = useSharedValue(0);

  // angle de projection + portée tirés une seule fois (déterministe par montage)
  const angle = Math.random() * Math.PI * 2;
  const distance = 90 + Math.random() * 170;
  const dx = Math.cos(angle) * distance;
  // bias vers le haut puis chute (gravité simulée plus bas)
  const dyUp = Math.sin(angle) * distance - 60;
  const fall = 220 + Math.random() * 180;
  const size = 7 + Math.random() * 8;
  const isRound = Math.random() > 0.5;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // x: file droit. y: monte (dyUp) puis retombe (fall * p^2 -> effet gravité)
    const tx = dx * p;
    const ty = dyUp * p + fall * p * p;
    const opacity = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15;
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${spin * p}deg` },
        { scale: 0.4 + p * 0.8 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: originX,
          top: originY,
          width: size,
          height: isRound ? size : size * 1.6,
          borderRadius: isRound ? size : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

interface ConfettiProps {
  /** Nombre de paillettes */
  count?: number;
  /** Origine X de l'explosion (par défaut centre écran) */
  originX?: number;
  /** Origine Y de l'explosion */
  originY?: number;
  /** Re-déclenche l'animation quand cette valeur change */
  burstKey?: number | string;
}

export default function Confetti({
  count = 44,
  originX,
  originY,
  burstKey = 0,
}: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const ox = originX ?? width / 2;
  const oy = originY ?? height * 0.28;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <Piece
          key={`${burstKey}-${i}`}
          originX={ox}
          originY={oy}
          delay={Math.random() * 180}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});
