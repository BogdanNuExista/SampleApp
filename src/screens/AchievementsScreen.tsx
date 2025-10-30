import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, AchievementId } from '../types/achievements';
import { palette } from '../theme/colors';

export function AchievementsScreen() {
  const { state: { achievements, focusSessions, chess, flashcards, streak, bestSessionMinutes, totalCoinsEarned } } = useGame();

  const achievementsList = useMemo(() => {
    return Object.values(ACHIEVEMENTS).map(achievement => {
      const userAchievement = achievements.find(a => a.id === achievement.id);
      const isUnlocked = Boolean(userAchievement);
      
      // Calculate progress
      let progress = 0;
      switch (achievement.id) {
        case 'first-session':
          progress = Math.min(focusSessions.length, 1);
          break;
        case 'night-owl':
          progress = focusSessions.filter(s => new Date(s.completedAt).getHours() >= 22).length;
          break;
        case 'early-bird':
          progress = focusSessions.filter(s => new Date(s.completedAt).getHours() < 8).length;
          break;
        case 'marathon-runner':
          progress = bestSessionMinutes;
          break;
        case 'chess-beginner':
          progress = chess.stats.easy.wins + chess.stats.normal.wins + chess.stats.hard.wins;
          break;
        case 'chess-master':
          progress = chess.stats.hard.wins;
          break;
        case 'chess-legend':
          progress = chess.stats.easy.wins + chess.stats.normal.wins + chess.stats.hard.wins;
          break;
        case 'journaler':
          progress = flashcards.length;
          break;
        case 'mood-explorer':
          progress = new Set(flashcards.filter(f => f.mood).map(f => f.mood)).size;
          break;
        case 'streak-keeper':
          progress = streak;
          break;
        case 'coin-collector':
          progress = totalCoinsEarned;
          break;
      }

      return {
        ...achievement,
        isUnlocked,
        progress,
        unlockedAt: userAchievement?.unlockedAt,
      };
    }).sort((a, b) => {
      if (a.isUnlocked !== b.isUnlocked) {
        return a.isUnlocked ? -1 : 1;
      }
      return 0;
    });
  }, [achievements, focusSessions, chess, flashcards, streak, bestSessionMinutes, totalCoinsEarned]);

  const unlockedCount = achievements.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          {unlockedCount} of {totalCount} unlocked
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(unlockedCount / totalCount) * 100}%` }]} />
        </View>
      </View>

      <FlatList
        data={achievementsList}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.achievementCard, !item.isUnlocked && styles.achievementLocked]}>
            <View style={styles.achievementIcon}>
              <Text style={[styles.icon, !item.isUnlocked && styles.iconLocked]}>
                {item.icon}
              </Text>
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, !item.isUnlocked && styles.textLocked]}>
                {item.title}
              </Text>
              <Text style={styles.achievementDescription}>{item.description}</Text>
              
              {!item.isUnlocked && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarSmall}>
                    <View 
                      style={[
                        styles.progressFillSmall, 
                        { width: `${Math.min((item.progress / item.requirement) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {item.progress} / {item.requirement}
                  </Text>
                </View>
              )}

              {item.isUnlocked && item.unlockedAt && (
                <Text style={styles.unlockedDate}>
                  Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            {item.isUnlocked && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    color: palette.neonYellow,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.silver,
    fontSize: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.neonPink,
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.neonGreen,
  },
  achievementLocked: {
    borderColor: '#1e293b',
    opacity: 0.7,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.4,
  },
  achievementContent: {
    flex: 1,
    gap: 6,
  },
  achievementTitle: {
    color: palette.neonYellow,
    fontSize: 16,
    fontWeight: '700',
  },
  textLocked: {
    color: '#94a3b8',
  },
  achievementDescription: {
    color: palette.silver,
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 4,
    gap: 6,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: palette.neonBlue,
  },
  progressText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  unlockedDate: {
    color: palette.neonGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.neonGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: palette.midnight,
    fontSize: 16,
    fontWeight: '700',
  },
});
