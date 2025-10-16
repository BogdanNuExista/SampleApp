import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FocusTimer } from '../components/FocusTimer';
import { StatBadge } from '../components/StatBadge';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';

const icons = {
  coin: '🪙',
  streak: '🔥',
  time: '⏱️',
  cabinet: '🎮',
};

const skinVariants: Record<string, { backgroundColor: string; borderColor: string }> = {
  neon: { backgroundColor: '#1f2937', borderColor: '#38bdf822' },
  royal: { backgroundColor: '#312e81', borderColor: '#6366f122' },
  ember: { backgroundColor: '#4c1d95', borderColor: '#fb718522' },
};

const compactNumberFormatter =
  typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function'
    ? new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      })
    : null;

function formatCoins(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return '0';
  }
  if (compactNumberFormatter) {
    return compactNumberFormatter.format(amount);
  }
  if (amount < 1000) {
    return `${amount}`;
  }
  const thousands = amount / 1000;
  return `${thousands.toFixed(thousands >= 10 ? 0 : 1)}k`;
}

function formatStreak(days: number) {
  if (!Number.isFinite(days) || days <= 0) {
    return '0d';
  }
  if (days < 7) {
    return `${days}d`;
  }
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  if (remainder === 0) {
    return `${weeks}w`;
  }
  return `${weeks}w ${remainder}d`;
}

function formatBestSession(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '0m';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
}

export function HomeScreen() {
  const {
    state: {
      profileName,
      coins,
      streak,
      bestSessionMinutes,
      focusSessions,
      activeSkin,
    },
    completeSession,
  } = useGame();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.playerName}>{profileName}</Text>
        </View>
        <View
          style={[
            styles.skinBadge,
            {
              backgroundColor:
                skinVariants[activeSkin]?.backgroundColor ?? '#1f2937',
              borderColor: skinVariants[activeSkin]?.borderColor ?? '#38bdf822',
            },
          ]}
        >
          <Text style={styles.skinEmoji}>{icons.cabinet}</Text>
          <Text style={styles.skinLabel}>{activeSkin.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatBadge
          label="Coins"
          value={formatCoins(coins)}
          icon={<Text style={styles.statEmoji}>{icons.coin}</Text>}
        />
        <StatBadge
          label="Focus streak"
          value={formatStreak(streak)}
          icon={<Text style={styles.statEmoji}>{icons.streak}</Text>}
        />
        <StatBadge
          label="Best session"
          value={formatBestSession(bestSessionMinutes)}
          icon={<Text style={styles.statEmoji}>{icons.time}</Text>}
        />
      </View>

      <Text style={styles.sectionTitle}>Arcade Focus Run</Text>
      <FocusTimer
        isDarkMode
        onSessionComplete={minutes => {
          completeSession(minutes);
        }}
      />

      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {focusSessions.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHeadline}>No runs logged yet</Text>
          <Text style={styles.emptyBody}>
            Start a focus run to earn retro coins and climb your personal leaderboard.
          </Text>
        </View>
      ) : (
        <FlatList
          data={focusSessions.slice(0, 5)}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.historyList}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View>
                <Text style={styles.historyTitle}>
                  {new Date(item.completedAt).toLocaleDateString()} ·{' '}
                  {new Date(item.completedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.historySubtitle}>
                  {item.durationMinutes} minute sprint · +{item.coinsEarned} coins
                </Text>
              </View>
              <Text style={styles.historyStreak}>{item.streakAchieved}x streak</Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.midnight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    gap: 4,
  },
  greeting: {
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
  },
  playerName: {
    color: palette.softWhite,
    fontSize: 26,
    fontWeight: '700',
  },
  skinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  skinEmoji: {
    fontSize: 20,
  },
  skinLabel: {
    color: palette.neonBlue,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: {
    color: palette.neonYellow,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyHistory: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  emptyHeadline: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  emptyBody: {
    color: palette.silver,
    fontSize: 13,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf822',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    color: palette.softWhite,
    fontWeight: '600',
  },
  historySubtitle: {
    color: palette.silver,
    marginTop: 4,
  },
  historyStreak: {
    color: palette.neonPink,
    fontWeight: '700',
  },
  statEmoji: {
    fontSize: 20,
  },
});
