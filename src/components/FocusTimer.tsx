import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  pickRandomSkeletonAnimation,
  skeletonAnimations,
  SkeletonAnimationKey,
} from '../assets/skeletonAnimations';
import { SkeletonSprite } from './SkeletonSprite';
import { palette } from '../theme/colors';

const PRESETS = [1, 5, 15, 25, 45];

export type FocusTimerProps = {
  onSessionComplete: (durationMinutes: number) => void;
  isDarkMode: boolean;
};

export function FocusTimer({ onSessionComplete, isDarkMode }: FocusTimerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(selectedMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState<SkeletonAnimationKey>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemainingSeconds(selectedMinutes * 60);
  setIsRunning(false);
  setActiveAnimation('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [selectedMinutes]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current as ReturnType<typeof setInterval>);
          intervalRef.current = null;
          setIsRunning(false);
          onSessionComplete(selectedMinutes);
          setActiveAnimation('idle');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onSessionComplete, selectedMinutes]);

  const progress = useMemo(() => {
    return 1 - remainingSeconds / (selectedMinutes * 60);
  }, [remainingSeconds, selectedMinutes]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleToggleRunning = () => {
    setIsRunning(prev => {
      if (prev) {
        return false;
      }

      if (remainingSeconds === selectedMinutes * 60 || remainingSeconds === 0) {
        setActiveAnimation(current => {
          const excludes: SkeletonAnimationKey[] = ['idle'];
          if (current) {
            excludes.push(current);
          }
          return pickRandomSkeletonAnimation(excludes);
        });
      }

      return true;
    });
  };

  useEffect(() => {
    if (isRunning && activeAnimation === 'idle') {
      setActiveAnimation(current =>
        current === 'idle' ? pickRandomSkeletonAnimation('idle') : current,
      );
    }
  }, [activeAnimation, isRunning]);

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(remainingSeconds % 60)
    .toString()
    .padStart(2, '0');

  return (
    <View
      style={[
        styles.container,
        { borderColor: isDarkMode ? palette.neonPink : palette.neonBlue },
      ]}
    >
      <View style={styles.presetsRow}>
        {PRESETS.map(preset => (
          <Pressable
            key={preset}
            style={[
              styles.presetChip,
              preset === selectedMinutes && styles.presetChipActive,
            ]}
            onPress={() => setSelectedMinutes(preset)}
            disabled={isRunning}
          >
            <Text
              style={[
                styles.presetChipText,
                preset === selectedMinutes && styles.presetChipTextActive,
              ]}
            >
              {preset}m
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timerFace}>
        <View style={[styles.progressTrack]}>
          <View
            style={[
              styles.progressFill,
              {
                transform: [{ scaleX: Math.max(0.05, progress) }],
                backgroundColor: isDarkMode
                  ? palette.neonGreen
                  : palette.neonPink,
              },
            ]}
          />
        </View>
        <Text style={[styles.timeText, isDarkMode && styles.timeTextDark]}>
          {minutes}:{seconds}
        </Text>
        <Text style={[styles.subLabel, isDarkMode && styles.subLabelDark]}>
          Stay focused to earn coins
        </Text>
      </View>

      <View style={styles.animationStage}>
        <SkeletonSprite
          frames={skeletonAnimations[activeAnimation].frames}
          fps={skeletonAnimations[activeAnimation].fps}
          paused={!isRunning}
          size={isDarkMode ? 160 : 150}
        />
        <Text style={styles.animationCaption}>
          {isRunning
            ? skeletonAnimations[activeAnimation].label
            : 'Guardian standing by'}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.controlButton, isRunning && styles.controlButtonStop]}
          onPress={handleToggleRunning}
        >
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, styles.controlButtonSecondary]}
          onPress={() => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsRunning(false);
            setRemainingSeconds(selectedMinutes * 60);
            setActiveAnimation('idle');
          }}
        >
          <Text style={styles.controlButtonText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#111827dd',
    gap: 20,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.silver,
    minWidth: 52,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: palette.neonPink,
    borderColor: palette.neonPink,
  },
  presetChipText: {
    color: palette.silver,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: palette.midnight,
  },
  timerFace: {
    alignItems: 'center',
    gap: 8,
  },
  animationStage: {
    alignItems: 'center',
    gap: 8,
  },
  animationCaption: {
    color: palette.silver,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  timeText: {
    fontSize: 42,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    color: palette.softWhite,
  },
  timeTextDark: {
    color: palette.softWhite,
  },
  subLabel: {
    color: palette.silver,
    fontSize: 14,
  },
  subLabelDark: {
    color: palette.silver,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    backgroundColor: palette.neonGreen,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  controlButtonStop: {
    backgroundColor: palette.danger,
  },
  controlButtonSecondary: {
    backgroundColor: palette.neonBlue,
  },
  controlButtonText: {
    color: palette.midnight,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
