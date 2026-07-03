import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGame, getQuestViews } from '../context/GameContext';
import { soundEffects } from '../services/SoundEffects';
import { palette } from '../theme/colors';

export function DailyQuests() {
  const {
    state: { daily },
    claimQuest,
    refreshDailyQuests,
  } = useGame();

  // Reset quests if the calendar day rolled over while the app was open.
  useEffect(() => {
    refreshDailyQuests();
  }, [refreshDailyQuests]);

  const quests = getQuestViews(daily);

  return (
    <View style={styles.card}>
      {quests.map((q, i) => {
        const pct = q.target > 0 ? Math.round((q.progress / q.target) * 100) : 0;
        return (
          <View key={q.id} style={[styles.quest, i > 0 && styles.questBorder]}>
            <View style={styles.questInfo}>
              <Text style={styles.questLabel}>{q.label}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${pct}%`,
                      backgroundColor: q.completed ? palette.neonGreen : palette.neonBlue,
                    },
                  ]}
                />
              </View>
              <Text style={styles.reward}>
                {q.progress}/{q.target} · +{q.coinReward}🪙 +{q.xpReward} XP
              </Text>
            </View>
            {q.claimed ? (
              <View style={[styles.claimBtn, styles.claimed]}>
                <Text style={styles.claimedText}>✓</Text>
              </View>
            ) : (
              <Pressable
                disabled={!q.completed}
                onPress={() => {
                  claimQuest(q.id);
                  soundEffects.play('coin');
                }}
                style={[styles.claimBtn, !q.completed && styles.claimDisabled]}
              >
                <Text style={styles.claimText}>Claim</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: palette.neonBlue + '33',
  },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  questBorder: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  questInfo: {
    flex: 1,
    gap: 6,
  },
  questLabel: {
    color: palette.softWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  reward: {
    color: palette.silver,
    fontSize: 12,
  },
  claimBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.neonGreen,
  },
  claimDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  claimText: {
    color: '#06281c',
    fontWeight: '800',
    fontSize: 13,
  },
  claimed: {
    backgroundColor: palette.neonGreen + '22',
    borderWidth: 1,
    borderColor: palette.neonGreen,
  },
  claimedText: {
    color: palette.neonGreen,
    fontWeight: '800',
    fontSize: 16,
  },
});
