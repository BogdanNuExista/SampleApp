import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type ArcadeGameId = 'lanes' | 'reaction';

const arcadeGames: Array<{
  id: ArcadeGameId;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: 'lanes',
    title: 'Hyper Lane Defender',
    subtitle: 'Match the highlighted lane before the beat drops.',
    icon: '🚦',
  },
  {
    id: 'reaction',
    title: 'Neon Reaction Pulse',
    subtitle: 'Wait for the flash, then tap faster than the synth beat.',
    icon: '⚡',
  },
];

export function ArcadeScreen() {
  const {
    state: { coins, arcadeHighScore, activeSkin, ownedSkins },
    recordArcadeScore,
    unlockSkin,
  } = useGame();
  const [activeGame, setActiveGame] = useState<ArcadeGameId>('lanes');

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
      <View style={styles.headerBlock}>
        <Text style={styles.panelTitle}>Arcade Nexus</Text>
        <Text style={styles.panelSubtitle}>
          Earn coins by cycling between neon mini-games.
        </Text>
      </View>

      <View style={styles.gameSelector}>
        {arcadeGames.map(game => {
          const isActive = game.id === activeGame;
          return (
            <Pressable
              key={game.id}
              onPress={() => setActiveGame(game.id)}
              style={[styles.selectorCard, isActive && styles.selectorCardActive]}
            >
              <Text style={[styles.selectorIcon, isActive && styles.selectorIconActive]}>
                {game.icon}
              </Text>
              <View style={styles.selectorTextBlock}>
                <Text style={[styles.selectorTitle, isActive && styles.selectorTitleActive]}>
                  {game.title}
                </Text>
                <Text style={styles.selectorSubtitle}>{game.subtitle}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {activeGame === 'lanes' ? (
        <HyperLaneDefender
          highScore={arcadeHighScore}
          recordScore={recordArcadeScore}
        />
      ) : (
        <ReactionPulseArena recordScore={recordArcadeScore} />
      )}

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

type HyperLaneDefenderProps = {
  highScore: number;
  recordScore: (score: number) => void;
};

function HyperLaneDefender({ highScore, recordScore }: HyperLaneDefenderProps) {
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
    }, tickSpeed);

    return () => clearInterval(interval);
  }, [isRunning, tickSpeed]);

  const resetGame = (shouldLog = false) => {
    if (shouldLog && score > 0) {
      recordScore(score);
    }
    setIsRunning(false);
    setLives(3);
    setScore(0);
    setTickSpeed(1300);
    setTargetLane(Math.floor(Math.random() * 3) as Lane);
  };

  const handleLanePress = (lane: Lane) => {
    if (!isRunning) {
      setIsRunning(true);
    }
    if (lane === targetLane) {
      setScore(prev => prev + 8);
      setTickSpeed(prev => Math.max(600, prev - 20));
      setTargetLane(Math.floor(Math.random() * 3) as Lane);
    } else {
      setLives(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    if (lives === 0 && isRunning) {
      recordScore(score);
      resetGame(false);
    }
  }, [isRunning, lives, recordScore, score]);

  return (
    <View style={styles.gameCard}>
      <View style={styles.gameCardHeader}>
        <Text style={styles.gameTitle}>Hyper Lane Defender</Text>
        <Text style={styles.gameSubtitle}>
          Tap the illuminated lane to dodge incoming glitch waves.
        </Text>
      </View>

      <View style={styles.scoreSummaryRow}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeLabel}>Score</Text>
          <Text style={styles.scoreBadgeValue}>{score}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeLabel}>High score</Text>
          <Text style={styles.scoreBadgeValue}>{highScore}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeLabel}>Lives</Text>
          <Text style={styles.scoreBadgeValue}>{lives > 0 ? '❤️'.repeat(lives) : '💀'}</Text>
        </View>
      </View>

      <Text style={styles.callout}>Target: {laneLabels[targetLane]}</Text>
      <View style={styles.laneRow}>
        {[0, 1, 2].map(lane => (
          <Pressable
            key={lane}
            style={[styles.laneButton, lane === targetLane && styles.laneButtonActive]}
            onPress={() => handleLanePress(lane as Lane)}
          >
            <Text style={styles.laneLabel}>{laneLabels[lane as Lane]}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.resetButton} onPress={() => resetGame(true)}>
        <Text style={styles.resetText}>{isRunning ? 'End run' : 'Reset round'}</Text>
      </Pressable>
    </View>
  );
}

type ReactionPulseArenaProps = {
  recordScore: (score: number) => void;
};

type ReactionStatus = 'idle' | 'arming' | 'ready' | 'tooSoon' | 'success' | 'finished';

function ReactionPulseArena({ recordScore }: ReactionPulseArenaProps) {
  const maxRounds = 5;
  const maxStrikes = 3;
  const [status, setStatus] = useState<ReactionStatus>('idle');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [strikes, setStrikes] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyAtRef = useRef<number | null>(null);
  const hasLoggedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleReady = () => {
    clearTimer();
    setStatus('arming');
    const delay = 900 + Math.random() * 2200;
    timerRef.current = setTimeout(() => {
      readyAtRef.current = Date.now();
      setStatus('ready');
    }, delay);
  };

  const resetGame = () => {
    clearTimer();
    hasLoggedRef.current = false;
    readyAtRef.current = null;
    setStatus('idle');
    setRound(0);
    setScore(0);
    setBestTime(null);
    setLastTime(null);
    setStrikes(0);
  };

  const startFreshRun = () => {
    hasLoggedRef.current = false;
    setRound(0);
    setScore(0);
    setBestTime(null);
    setLastTime(null);
    setStrikes(0);
    scheduleReady();
  };

  const finishGame = () => {
    clearTimer();
    if (!hasLoggedRef.current) {
      recordScore(score);
      hasLoggedRef.current = true;
    }
    setStatus('finished');
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const handleTap = () => {
    switch (status) {
      case 'idle':
        startFreshRun();
        break;
      case 'arming':
        clearTimer();
        readyAtRef.current = null;
        setStrikes(prev => {
          const next = prev + 1;
          if (next >= maxStrikes) {
            finishGame();
          } else {
            setStatus('tooSoon');
          }
          return next;
        });
        break;
      case 'ready': {
        clearTimer();
        const reaction = Date.now() - (readyAtRef.current ?? Date.now());
        readyAtRef.current = null;
        setLastTime(reaction);
        setBestTime(prev => (prev === null ? reaction : Math.min(prev, reaction)));
        setScore(prev => prev + Math.max(5, Math.round(160 - reaction / 8)));
        setRound(prev => prev + 1);
        setStatus('success');
        break;
      }
      case 'success':
        if (round >= maxRounds) {
          finishGame();
        } else {
          scheduleReady();
        }
        break;
      case 'tooSoon':
        if (strikes >= maxStrikes) {
          finishGame();
        } else {
          scheduleReady();
        }
        break;
      case 'finished':
        resetGame();
        break;
      default:
        break;
    }
  };

  const reactionMessage = (() => {
    switch (status) {
      case 'idle':
        return 'Tap to arm the signal and start a run.';
      case 'arming':
        return 'Hold steady… wait for the neon flash!';
      case 'ready':
        return 'Tap now!';
      case 'success':
        return lastTime ? `Great hit: ${lastTime}ms` : 'Nice hit!';
      case 'tooSoon':
        return 'Too soon! You tapped before the flash.';
      case 'finished':
        return `Run complete — total score ${score}.`;
      default:
        return '';
    }
  })();

  const buttonLabel = (() => {
    switch (status) {
      case 'idle':
        return 'Start run';
      case 'arming':
        return 'Wait...';
      case 'ready':
        return 'Tap!';
      case 'success':
        return round >= maxRounds ? 'Finish run' : 'Next round';
      case 'tooSoon':
        return strikes >= maxStrikes ? 'See results' : 'Try again';
      case 'finished':
        return 'Log another run';
      default:
        return 'Tap';
    }
  })();

  const stageStyle = (() => {
    switch (status) {
      case 'ready':
        return styles.reactionStageReady;
      case 'success':
        return styles.reactionStageSuccess;
      case 'tooSoon':
        return styles.reactionStageFail;
      case 'finished':
        return styles.reactionStageFinished;
      case 'arming':
        return styles.reactionStageArming;
      default:
        return styles.reactionStageIdle;
    }
  })();

  const buttonStyle = [
    styles.reactionButton,
    status === 'ready' && styles.reactionButtonReady,
    status === 'finished' && styles.reactionButtonFinished,
  ];

  const buttonTextStyle = [
    styles.reactionButtonText,
    (status === 'ready' || status === 'finished') && styles.reactionButtonTextOnBright,
  ];

  const formatMs = (value: number | null) => {
    if (value == null) {
      return '—';
    }
    return `${value}ms`;
  };

  return (
    <View style={styles.gameCard}>
      <View style={styles.gameCardHeader}>
        <Text style={styles.gameTitle}>Neon Reaction Pulse</Text>
        <Text style={styles.gameSubtitle}>
          Wait for the arena to glow neon green before you tap.
        </Text>
      </View>

      <View style={[styles.reactionStage, stageStyle]}>
        <Text style={styles.reactionMessage}>{reactionMessage}</Text>
      </View>

      <Pressable style={buttonStyle} onPress={handleTap}>
        <Text style={buttonTextStyle}>{buttonLabel}</Text>
      </Pressable>

      <View style={styles.reactionStatsRow}>
        <View style={styles.reactionStatBlock}>
          <Text style={styles.reactionStatLabel}>Rounds</Text>
          <Text style={styles.reactionStatValue}>
            {status === 'finished' ? `${round}/${maxRounds}` : `${Math.min(round, maxRounds)}/${maxRounds}`}
          </Text>
        </View>
        <View style={styles.reactionStatBlock}>
          <Text style={styles.reactionStatLabel}>Strikes</Text>
          <Text style={styles.reactionStatValue}>{strikes}/{maxStrikes}</Text>
        </View>
        <View style={styles.reactionStatBlock}>
          <Text style={styles.reactionStatLabel}>Last</Text>
          <Text style={styles.reactionStatValue}>{formatMs(lastTime)}</Text>
        </View>
        <View style={styles.reactionStatBlock}>
          <Text style={styles.reactionStatLabel}>Best</Text>
          <Text style={styles.reactionStatValue}>{formatMs(bestTime)}</Text>
        </View>
        <View style={styles.reactionStatBlock}>
          <Text style={styles.reactionStatLabel}>Score</Text>
          <Text style={styles.reactionStatValue}>{score}</Text>
        </View>
      </View>

      <Pressable style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetText}>Reset session</Text>
      </Pressable>
    </View>
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
  headerBlock: {
    gap: 6,
  },
  panelTitle: {
    color: palette.neonYellow,
    fontSize: 20,
    fontWeight: '700',
  },
  panelSubtitle: {
    color: '#cbd5f5',
  },
  gameSelector: {
    gap: 12,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1438',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#312e81',
  },
  selectorCardActive: {
    borderColor: palette.neonPink,
    backgroundColor: '#26154d',
  },
  selectorIcon: {
    fontSize: 26,
    color: '#a5b4fc',
  },
  selectorIconActive: {
    color: palette.neonPink,
  },
  selectorTextBlock: {
    flex: 1,
    gap: 4,
  },
  selectorTitle: {
    color: palette.softWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  selectorTitleActive: {
    color: palette.neonPink,
  },
  selectorSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  gameCard: {
    backgroundColor: '#1c1438',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#6366f144',
  },
  gameCardHeader: {
    gap: 6,
  },
  gameTitle: {
    color: palette.neonYellow,
    fontSize: 18,
    fontWeight: '700',
  },
  gameSubtitle: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  scoreSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scoreBadge: {
    flex: 1,
    backgroundColor: '#111b34',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#38bdf822',
    alignItems: 'center',
    gap: 4,
  },
  scoreBadgeLabel: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scoreBadgeValue: {
    color: palette.softWhite,
    fontSize: 18,
    fontWeight: '700',
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
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4338ca',
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
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#a855f7',
    marginTop: 6,
  },
  resetText: {
    color: '#c4b5fd',
    fontWeight: '600',
  },
  reactionStage: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  reactionStageIdle: {
    backgroundColor: '#111b34',
    borderColor: '#1f2937',
  },
  reactionStageArming: {
    backgroundColor: '#1f1a45',
    borderColor: '#4338ca',
  },
  reactionStageReady: {
    backgroundColor: '#0f3d2e',
    borderColor: '#34d399',
  },
  reactionStageSuccess: {
    backgroundColor: '#12324d',
    borderColor: '#38bdf8',
  },
  reactionStageFail: {
    backgroundColor: '#3f1d2b',
    borderColor: '#f87171',
  },
  reactionStageFinished: {
    backgroundColor: '#1e1b4b',
    borderColor: '#a855f7',
  },
  reactionMessage: {
    color: palette.softWhite,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reactionButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reactionButtonReady: {
    backgroundColor: palette.neonGreen,
    borderColor: palette.neonGreen,
  },
  reactionButtonFinished: {
    backgroundColor: palette.neonPink,
    borderColor: palette.neonPink,
  },
  reactionButtonText: {
    color: palette.softWhite,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reactionButtonTextOnBright: {
    color: palette.midnight,
  },
  reactionStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reactionStatBlock: {
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: '#111b34',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    gap: 4,
  },
  reactionStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reactionStatValue: {
    color: palette.softWhite,
    fontSize: 16,
    fontWeight: '700',
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
