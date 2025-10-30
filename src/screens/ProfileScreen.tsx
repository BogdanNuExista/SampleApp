import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useGame } from '../context/GameContext';
import { RootTabParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';

const icons = {
  profile: require('../../assets/icon_pack/128/helmet.png'),
  history: require('../../assets/icon_pack/64/map.png'),
  favorite: require('../../assets/icon_pack/64/heart.png'),
  focus: require('../../assets/icon_pack/64/potionRed.png'),
  trophy: require('../../assets/icon_pack/128/shield.png'),
  stats: require('../../assets/icon_pack/64/scroll.png'),
};

type Navigation = BottomTabNavigationProp<RootTabParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    state: { profileName, coins, streak, totalFocusMinutes, flashcards, focusSessions },
    setProfileName,
  } = useGame();
  const [nameInput, setNameInput] = useState(profileName);

  const favoriteCount = flashcards.filter(card => card.favorite).length;
  const bestSessions = [...focusSessions]
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 6);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <Image source={icons.profile} style={styles.avatar} />
        <View style={styles.profileText}>
          <Text style={styles.profileTitle}>Cadet Profile</Text>
          <Text style={styles.profileSubtitle}>Customize your arcade identity.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Call sign</Text>
        <TextInput
          value={nameInput}
          onChangeText={setNameInput}
          onBlur={() => setProfileName(nameInput)}
          style={styles.input}
          placeholder="Enter your arcade alias"
          placeholderTextColor="#9ca3af"
        />
        <View style={styles.profileStatsRow}>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Coins</Text>
            <Text style={styles.profileStatValue}>{coins}</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Focus streak</Text>
            <Text style={styles.profileStatValue}>{streak} days</Text>
          </View>
          <View style={styles.profileStat}>
            <Text style={styles.profileStatLabel}>Minutes banked</Text>
            <Text style={styles.profileStatValue}>{totalFocusMinutes}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={icons.history} style={styles.cardIcon} />
          <View>
            <Text style={styles.cardTitle}>Top Focus Runs</Text>
            <Text style={styles.cardSubtitle}>
              Your strongest streaks keep your cabinet glowing.
            </Text>
          </View>
        </View>
        {bestSessions.length === 0 ? (
          <Text style={styles.emptyText}>Complete a focus run to build your leaderboard.</Text>
        ) : (
          <FlatList
            data={bestSessions}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item, index }) => (
              <View style={styles.historyRow}>
                <Text style={styles.ranking}>#{index + 1}</Text>
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{item.durationMinutes} minute sprint</Text>
                  <Text style={styles.historySubtitle}>
                    {new Date(item.completedAt).toLocaleDateString()} · +{item.coinsEarned} coins
                  </Text>
                </View>
                <Text style={styles.historyBadge}>{item.streakAchieved}x</Text>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={icons.favorite} style={styles.cardIcon} />
          <View>
            <Text style={styles.cardTitle}>Flashcard Arsenal</Text>
            <Text style={styles.cardSubtitle}>
              {favoriteCount} favorites · {flashcards.length} total cards
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Flashcards' as never)}
        >
          <Text style={styles.primaryButtonText}>Review your codex</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={icons.trophy} style={styles.cardIcon} />
          <View>
            <Text style={styles.cardTitle}>Achievements</Text>
            <Text style={styles.cardSubtitle}>
              Track your progress and unlock badges
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Achievements' as never)}
        >
          <Text style={styles.primaryButtonText}>View achievements</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={icons.stats} style={styles.cardIcon} />
          <View>
            <Text style={styles.cardTitle}>Statistics Dashboard</Text>
            <Text style={styles.cardSubtitle}>
              Dive into your performance metrics
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Statistics' as never)}
        >
          <Text style={styles.primaryButtonText}>View stats</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={icons.focus} style={styles.cardIcon} />
          <View>
            <Text style={styles.cardTitle}>Daily focus tip</Text>
            <Text style={styles.cardSubtitle}>Keep streaks alive with 15+ minute sprints.</Text>
          </View>
        </View>
        <Text style={styles.tipBody}>
          Stack multiple short runs with short breaks to earn combo coins faster. Every
          third consecutive day multiplies your streak bonus!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    resizeMode: 'contain',
  },
  profileText: {
    gap: 4,
  },
  profileTitle: {
    color: palette.neonYellow,
    fontSize: 20,
    fontWeight: '700',
  },
  profileSubtitle: {
    color: '#94a3b8',
  },
  card: {
    backgroundColor: '#111c35',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  cardTitle: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 18,
  },
  cardSubtitle: {
    color: '#9ca3af',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.softWhite,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  profileStat: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  profileStatLabel: {
    color: '#9ca3af',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileStatValue: {
    color: palette.neonPink,
    fontWeight: '700',
    fontSize: 18,
  },
  emptyText: {
    color: '#9ca3af',
  },
  separator: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ranking: {
    width: 28,
    textAlign: 'center',
    color: palette.neonYellow,
    fontWeight: '700',
  },
  historyText: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    color: palette.softWhite,
    fontWeight: '600',
  },
  historySubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  historyBadge: {
    color: palette.neonPink,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: palette.neonGreen,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.midnight,
    fontWeight: '700',
  },
  tipBody: {
    color: '#cbd5f5',
    lineHeight: 20,
  },
});
