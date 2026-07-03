import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';
import { LevelBar } from '../components/LevelBar';
import {
  SUBJECT_EXERCISE_COUNTS,
  TOTAL_LEARNING_EXERCISES,
} from '../constants/learningContent';

type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;
};

function StatCard({ label, value, subtitle, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function StatisticsScreen() {
  const {
    state: {
      focusSessions,
      chess,
      maiaChess,
      sudoku,
      flashcards,
      totalFocusMinutes,
      totalCoinsEarned,
      bestSessionMinutes,
      learning,
      quizStats,
      puzzleStats,
      xp,
    },
  } = useGame();

  // Calculate stats
  const stats = useMemo(() => {
    const last7Days = focusSessions.filter(s => 
      Date.now() - s.completedAt < 7 * 24 * 60 * 60 * 1000
    );
    const last30Days = focusSessions.filter(s => 
      Date.now() - s.completedAt < 30 * 24 * 60 * 60 * 1000
    );

    const totalChessGames = chess.stats.easy.wins + chess.stats.easy.losses +
                           chess.stats.normal.wins + chess.stats.normal.losses +
                           chess.stats.hard.wins + chess.stats.hard.losses;
    
    const totalChessWins = chess.stats.easy.wins + chess.stats.normal.wins + chess.stats.hard.wins;
    const winRate = totalChessGames > 0 ? ((totalChessWins / totalChessGames) * 100).toFixed(1) : '0';

    const maiaWins = maiaChess.stats.apprentice.wins + maiaChess.stats.adept.wins + maiaChess.stats.master.wins;
    const maiaLosses = maiaChess.stats.apprentice.losses + maiaChess.stats.adept.losses + maiaChess.stats.master.losses;
    const maiaTotal = maiaWins + maiaLosses;
    const maiaWinRate = maiaTotal > 0 ? ((maiaWins / maiaTotal) * 100).toFixed(1) : '0';

    const learnedAlgebra = learning.solvedExercises.filter(id => id.startsWith('AL')).length;
    const learnedAnalysis = learning.solvedExercises.filter(id => id.startsWith('AM')).length;
    const learnedTrig = learning.solvedExercises.filter(id => id.startsWith('TG')).length;
    const quizAccuracy = quizStats.totalQuestions > 0
      ? ((quizStats.totalCorrect / quizStats.totalQuestions) * 100).toFixed(1)
      : '0';

    const moodCounts = flashcards.reduce((acc, card) => {
      if (card.mood) {
        acc[card.mood] = (acc[card.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostUsedMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Calculate hourly distribution
    const hourlyDistribution = focusSessions.reduce((acc, session) => {
      const hour = new Date(session.completedAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostProductiveHour = Object.entries(hourlyDistribution)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalSessions: focusSessions.length,
      last7DaysSessions: last7Days.length,
      last30DaysSessions: last30Days.length,
      totalChessGames,
      totalChessWins,
      winRate,
      maiaWins,
      maiaLosses,
      maiaTotal,
      maiaWinRate,
      learnedAlgebra,
      learnedAnalysis,
      learnedTrig,
      quizAccuracy,
      mostUsedMood,
      mostProductiveHour,
      avgSessionLength: focusSessions.length > 0
        ? Math.round(focusSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / focusSessions.length)
        : 0,
    };
  }, [focusSessions, chess, maiaChess, flashcards, learning, quizStats]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics Dashboard</Text>
        <Text style={styles.subtitle}>Your arcade performance metrics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Level</Text>
        <LevelBar xp={xp} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Focus Sessions</Text>
        <View style={styles.grid}>
          <StatCard label="Total Sessions" value={stats.totalSessions} icon="🎮" />
          <StatCard label="Last 7 Days" value={stats.last7DaysSessions} icon="📅" />
          <StatCard label="Last 30 Days" value={stats.last30DaysSessions} icon="📆" />
          <StatCard label="Avg Session" value={`${stats.avgSessionLength} min`} icon="⏱️" />
          <StatCard label="Best Session" value={`${bestSessionMinutes} min`} icon="🏆" />
          <StatCard label="Total Time" value={`${totalFocusMinutes} min`} icon="⏳" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>♟️ Chess Statistics</Text>
        <View style={styles.grid}>
          <StatCard label="Total Games" value={stats.totalChessGames} icon="🎲" />
          <StatCard label="Total Wins" value={stats.totalChessWins} icon="✨" />
          <StatCard label="Win Rate" value={`${stats.winRate}%`} icon="📊" />
        </View>
        
        <View style={styles.chessBreakdown}>
          <Text style={styles.breakdownTitle}>By Difficulty</Text>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Easy:</Text>
            <Text style={styles.chessValue}>{chess.stats.easy.wins}W / {chess.stats.easy.losses}L</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Normal:</Text>
            <Text style={styles.chessValue}>{chess.stats.normal.wins}W / {chess.stats.normal.losses}L</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Hard:</Text>
            <Text style={styles.chessValue}>{chess.stats.hard.wins}W / {chess.stats.hard.losses}L</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 Maia AI Chess</Text>
        <View style={styles.grid}>
          <StatCard label="Games" value={stats.maiaTotal} icon="🎲" />
          <StatCard label="Wins" value={stats.maiaWins} icon="✨" />
          <StatCard label="Win Rate" value={`${stats.maiaWinRate}%`} icon="📊" />
        </View>
        <View style={styles.chessBreakdown}>
          <Text style={styles.breakdownTitle}>By Level</Text>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Apprentice (~1100):</Text>
            <Text style={styles.chessValue}>{maiaChess.stats.apprentice.wins}W / {maiaChess.stats.apprentice.losses}L</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Adept (~1300):</Text>
            <Text style={styles.chessValue}>{maiaChess.stats.adept.wins}W / {maiaChess.stats.adept.losses}L</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Master (~1500):</Text>
            <Text style={styles.chessValue}>{maiaChess.stats.master.wins}W / {maiaChess.stats.master.losses}L</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔢 Sudoku</Text>
        <View style={styles.grid}>
          <StatCard label="Played" value={sudoku.totalGames} icon="🎲" />
          <StatCard label="Completed" value={sudoku.totalWins} icon="✅" />
        </View>
        <View style={styles.chessBreakdown}>
          <Text style={styles.breakdownTitle}>By Difficulty (completed / played)</Text>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Easy:</Text>
            <Text style={styles.chessValue}>{sudoku.stats.easy.completed} / {sudoku.stats.easy.played}</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Medium:</Text>
            <Text style={styles.chessValue}>{sudoku.stats.medium.completed} / {sudoku.stats.medium.played}</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Expert:</Text>
            <Text style={styles.chessValue}>{sudoku.stats.expert.completed} / {sudoku.stats.expert.played}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Learning</Text>
        <View style={styles.grid}>
          <StatCard
            label="Solved"
            value={`${learning.solvedExercises.length} / ${TOTAL_LEARNING_EXERCISES}`}
            icon="🧮"
          />
          <StatCard
            label="Quiz Accuracy"
            value={`${stats.quizAccuracy}%`}
            subtitle={`${quizStats.taken} taken`}
            icon="📝"
          />
          <StatCard label="Puzzles Solved" value={puzzleStats.solved} icon="♟️" />
        </View>
        <View style={styles.chessBreakdown}>
          <Text style={styles.breakdownTitle}>Exercises by Subject</Text>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Algebra:</Text>
            <Text style={styles.chessValue}>{stats.learnedAlgebra} / {SUBJECT_EXERCISE_COUNTS.algebra}</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Analysis:</Text>
            <Text style={styles.chessValue}>{stats.learnedAnalysis} / {SUBJECT_EXERCISE_COUNTS.analysis}</Text>
          </View>
          <View style={styles.chessRow}>
            <Text style={styles.chessLabel}>Trigonometry:</Text>
            <Text style={styles.chessValue}>{stats.learnedTrig} / {SUBJECT_EXERCISE_COUNTS.trigonometry}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📔 Journal Insights</Text>
        <View style={styles.grid}>
          <StatCard label="Total Entries" value={flashcards.length} icon="📝" />
          <StatCard label="Favorites" value={flashcards.filter(f => f.favorite).length} icon="⭐" />
          {stats.mostUsedMood && (
            <StatCard 
              label="Top Mood" 
              value={stats.mostUsedMood[0]} 
              subtitle={`${stats.mostUsedMood[1]} times`} 
              icon="🌈" 
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Economy</Text>
        <View style={styles.grid}>
          <StatCard label="Total Earned" value={totalCoinsEarned} icon="🪙" />
        </View>
      </View>

      {stats.mostProductiveHour && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Productivity Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              You're most productive at <Text style={styles.insightHighlight}>{stats.mostProductiveHour[0]}:00</Text> with {stats.mostProductiveHour[1]} sessions completed.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    gap: 6,
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
  section: {
    marginBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    color: palette.neonPink,
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  statIcon: {
    fontSize: 24,
  },
  statContent: {
    gap: 4,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: palette.softWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  statSubtitle: {
    color: palette.neonBlue,
    fontSize: 11,
  },
  chessBreakdown: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  breakdownTitle: {
    color: palette.neonYellow,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  chessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chessLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  chessValue: {
    color: palette.softWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.neonGreen,
  },
  insightText: {
    color: palette.silver,
    fontSize: 14,
    lineHeight: 20,
  },
  insightHighlight: {
    color: palette.neonGreen,
    fontWeight: '700',
  },
});
