import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';

const skinsCatalog = [
  {
    id: 'neon',
    title: 'Neon Pulse',
    price: 0,
    description: 'Default synthwave glow.',
  },
  {
    id: 'royal',
    title: 'Royal Nova',
    price: 120,
    description: 'Deep blues with golden trims.',
  },
  {
    id: 'ember',
    title: 'Ember Blade',
    price: 180,
    description: 'Fiery gradients for intense streaks.',
  },
];

type Lane = 0 | 1 | 2;

const laneLabels: Record<Lane, string> = {
  0: 'Left',
  1: 'Center',
  2: 'Right',
};

export function ArcadeScreen() {
  const {
    state: { coins, arcadeHighScore, activeSkin, ownedSkins },
    recordArcadeScore,
    unlockSkin,
  } = useGame();
  const [targetLane, setTargetLane] = useState<Lane>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [tickSpeed, setTickSpeed] = useState(1300);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTargetLane(Math.floor(Math.random() * 3) as Lane);
      setTickSpeed(prev => Math.max(500, prev - 15));
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [isRunning, tickSpeed]);

  const resetGame = () => {
    setIsRunning(false);
    setLives(3);
    setScore(0);
    setTickSpeed(1300);
  };

  const handleLanePress = (lane: Lane) => {
    if (!isRunning) {
      setIsRunning(true);
    }
    if (lane === targetLane) {
      setScore(prev => prev + 5);
    } else {
      setLives(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    if (lives === 0 && isRunning) {
      recordArcadeScore(score);
      resetGame();
    }
  }, [isRunning, lives, score, recordArcadeScore]);

  const skinStatus = useMemo(() => {
    return skinsCatalog.map(skin => ({
      ...skin,
      owned: ownedSkins.includes(skin.id),
      active: activeSkin === skin.id,
      affordable: coins >= skin.price,
    }));
  }, [coins, ownedSkins, activeSkin]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.scorePanel}>
        <Text style={styles.panelTitle}>Hyper Lane Defender</Text>
        <Text style={styles.panelSubtitle}>
          Tap the highlighted lane before the beat drops.
        </Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>High score</Text>
          <Text style={styles.scoreValue}>{arcadeHighScore}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Lives</Text>
          <Text style={styles.scoreValue}>{'❤️'.repeat(lives)}</Text>
        </View>
      </View>

      <View style={styles.gameBoard}>
        <Text style={styles.callout}>Target: {laneLabels[targetLane]}</Text>
        <View style={styles.laneRow}>
          {[0, 1, 2].map(lane => (
            <Pressable
              key={lane}
              style={[
                styles.laneButton,
                lane === targetLane && styles.laneButtonActive,
              ]}
              onPress={() => handleLanePress(lane as Lane)}
            >
              <Text style={styles.laneLabel}>{laneLabels[lane as Lane]}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.resetButton} onPress={resetGame}>
          <Text style={styles.resetText}>Reset round</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Arcade Cabinet Store</Text>
      <Text style={styles.sectionSubtitle}>
        Spend coins to unlock cabinet skins and flex your arcade style.
      </Text>

      <View style={styles.storeList}>
        {skinStatus.map(skin => (
          <View key={skin.id} style={styles.skinCard}>
            <Text style={styles.skinTitle}>{skin.title}</Text>
            <Text style={styles.skinDescription}>{skin.description}</Text>
            <View style={styles.skinFooter}>
              <Text style={styles.skinPrice}>
                {skin.price === 0 ? 'Owned' : `${skin.price} coins`}
              </Text>
              <Pressable
                style={[
                  styles.skinButton,
                  skin.active && styles.skinButtonActive,
                  !skin.affordable && !skin.owned && styles.skinButtonDisabled,
                ]}
                onPress={() => unlockSkin(skin.id, skin.price)}
                disabled={!skin.affordable && !skin.owned}
              >
                <Text style={styles.skinButtonText}>
                  {skin.active ? 'Equipped' : skin.owned ? 'Equip skin' : 'Unlock'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#140c2c',
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  scorePanel: {
    backgroundColor: '#1c1438',
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#a855f744',
  },
  panelTitle: {
    color: palette.neonYellow,
    fontSize: 20,
    fontWeight: '700',
  },
  panelSubtitle: {
    color: '#cbd5f5',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#a5b4fc',
    letterSpacing: 1,
  },
  scoreValue: {
    color: palette.softWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  gameBoard: {
    backgroundColor: '#1c1438',
    borderRadius: 24,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: '#f472b633',
  },
  callout: {
    color: palette.neonPink,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  laneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  laneButton: {
    flex: 1,
    backgroundColor: '#312e81',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  laneButtonActive: {
    backgroundColor: palette.neonPink,
    borderColor: palette.neonPink,
  },
  laneLabel: {
    color: palette.softWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  resetText: {
    color: '#c4b5fd',
    fontWeight: '600',
  },
  sectionTitle: {
    color: palette.neonYellow,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#cbd5f5',
  },
  storeList: {
    gap: 16,
  },
  skinCard: {
    backgroundColor: '#1c1438',
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#6366f144',
  },
  skinTitle: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  skinDescription: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  skinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skinPrice: {
    color: palette.neonBlue,
    fontWeight: '600',
  },
  skinButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: palette.neonBlue,
  },
  skinButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  skinButtonActive: {
    backgroundColor: palette.neonGreen,
  },
  skinButtonText: {
    color: palette.midnight,
    fontWeight: '700',
  },
});
