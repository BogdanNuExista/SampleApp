import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { levelProgress } from '../constants/leveling';
import { palette } from '../theme/colors';

type Props = {
  xp: number;
  compact?: boolean;
};

export function LevelBar({ xp, compact }: Props) {
  const { level, xpIntoLevel, xpForThisLevel, progress } = levelProgress(xp);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.row}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>LVL</Text>
          <Text style={styles.levelValue}>{level}</Text>
        </View>
        <View style={styles.barColumn}>
          <View style={styles.barTopRow}>
            <Text style={styles.title}>Experience</Text>
            <Text style={styles.xpText}>
              {xpIntoLevel} / {xpForThisLevel} XP
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.electricPurple + '44',
  },
  cardCompact: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  levelBadge: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: palette.electricPurple + '22',
    borderWidth: 1,
    borderColor: palette.electricPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLabel: {
    color: palette.electricPurple,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelValue: {
    color: palette.softWhite,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  barColumn: {
    flex: 1,
    gap: 6,
  },
  barTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  xpText: {
    color: palette.silver,
    fontSize: 12,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.electricPurple,
  },
});
