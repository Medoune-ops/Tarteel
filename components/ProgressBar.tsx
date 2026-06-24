import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0–1
  height?: number;
  color?: string;
  bgColor?: string;
  borderRadius?: number;
}

export default function ProgressBar({
  progress, height = 14, color = '#34C724', bgColor = '#E2E4E9', borderRadius = 8,
}: ProgressBarProps) {
  return (
    <View style={[styles.track, { height, backgroundColor: bgColor, borderRadius }]}>
      <View
        style={[
          styles.fill,
          { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color, borderRadius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
