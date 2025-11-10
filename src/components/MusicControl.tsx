import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { musicPlayer, TRACKS } from '../services/MusicPlayer';
import { palette } from '../theme/colors';
import { useGame } from '../context/GameContext';

export function MusicControl() {
  const { state: { musicEnabled }, toggleMusic } = useGame();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(musicPlayer.getCurrentTrack());
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (musicEnabled && !hasError) {
      try {
        musicPlayer.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Music playback error:', error);
        setHasError(true);
        setIsPlaying(false);
      }
    } else {
      musicPlayer.pause();
      setIsPlaying(false);
    }
  }, [musicEnabled, hasError]);

  const handlePlayPause = () => {
    if (isPlaying) {
      musicPlayer.pause();
      setIsPlaying(false);
    } else {
      musicPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    musicPlayer.next();
    setCurrentTrack(musicPlayer.getCurrentTrack());
    // Update playing state after track changes and loads
    setTimeout(() => {
      setIsPlaying(musicPlayer.getIsPlaying());
    }, 200);
  };

  const handlePrevious = () => {
    musicPlayer.previous();
    setCurrentTrack(musicPlayer.getCurrentTrack());
    // Update playing state after track changes and loads
    setTimeout(() => {
      setIsPlaying(musicPlayer.getIsPlaying());
    }, 200);
  };

  if (hasError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>🎵 Music unavailable</Text>
        <Text style={styles.errorSubtext}>Audio files need to be copied to device</Text>
      </View>
    );
  }

  if (!musicEnabled) {
    return (
      <Pressable style={styles.container} onPress={() => toggleMusic(true)}>
        <Text style={styles.enableText}>🎵 Enable lo-fi music</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {currentTrack.name}
        </Text>
        <Text style={styles.trackSubtitle}>Synthwave Focus Mix</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.controlButton} onPress={handlePrevious}>
          <Text style={styles.controlIcon}>⏮️</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.playButton]} onPress={handlePlayPause}>
          <Text style={styles.controlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={handleNext}>
          <Text style={styles.controlIcon}>⏭️</Text>
        </Pressable>
      </View>
      <Pressable style={styles.disableButton} onPress={() => toggleMusic(false)}>
        <Text style={styles.disableText}>🔇</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  enableText: {
    color: palette.neonBlue,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackInfo: {
    gap: 4,
  },
  trackName: {
    color: palette.neonYellow,
    fontSize: 14,
    fontWeight: '700',
  },
  trackSubtitle: {
    color: palette.silver,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.neonPink,
    borderColor: palette.neonPink,
  },
  controlIcon: {
    fontSize: 16,
  },
  disableButton: {
    alignSelf: 'center',
    padding: 8,
  },
  disableText: {
    fontSize: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    color: palette.silver,
    fontSize: 12,
    textAlign: 'center',
  },
});
