import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export type SkeletonSpriteProps = {
  frames: ImageSourcePropType[];
  fps?: number;
  paused?: boolean;
  size?: number;
};

export function SkeletonSprite({ frames, fps = 12, paused = false, size = 160 }: SkeletonSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const clampedFrames = useMemo(() => frames.filter(Boolean), [frames]);

  useEffect(() => {
    setFrameIndex(0);
  }, [clampedFrames]);

  useEffect(() => {
    if (paused || clampedFrames.length === 0) {
      if (intervalRef.current !== null) {
        cancelAnimationFrame(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const frameIntervalMs = Math.max(30, Math.round(1000 / fps));
    let lastTimestamp: number | null = null;
    let accumulator = 0;

    const step = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const delta = timestamp - lastTimestamp;
      accumulator += delta;

      if (accumulator >= frameIntervalMs) {
        accumulator -= frameIntervalMs;
        setFrameIndex(prev => (prev + 1) % clampedFrames.length);
      }

      lastTimestamp = timestamp;
      intervalRef.current = requestAnimationFrame(step);
    };

    intervalRef.current = requestAnimationFrame(step);

    return () => {
      if (intervalRef.current !== null) {
        cancelAnimationFrame(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [clampedFrames, fps, paused]);

  if (clampedFrames.length === 0) {
    return null;
  }

  return (
    <View style={[styles.frame, { width: size + 32, height: size + 32 }]}>
      <View style={[styles.innerGlow, { width: size + 12, height: size + 12 }]}> 
        <Image
          source={clampedFrames[frameIndex % clampedFrames.length]}
          style={{ width: size, height: size }}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#0f172acc',
    borderWidth: 1,
    borderColor: '#38bdf833',
    padding: 16,
  },
  innerGlow: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#111b2ecc',
  },
});
