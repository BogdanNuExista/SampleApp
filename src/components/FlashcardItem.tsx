import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Flashcard } from '../context/GameContext';
import { palette } from '../theme/colors';

export type FlashcardItemProps = {
  card: Flashcard;
  onPress: (card: Flashcard) => void;
  onToggleFavorite: (card: Flashcard) => void;
};

export function FlashcardItem({ card, onPress, onToggleFavorite }: FlashcardItemProps) {
  return (
    <Pressable style={styles.container} onPress={() => onPress(card)}>
      {card.imageBase64 ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${card.imageBase64}` }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.placeholderText}>No Snapshot</Text>
        </View>
      )}
      <View style={styles.textContent}>
        <Text style={styles.title} numberOfLines={1}>
          {card.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {card.description}
        </Text>
        {card.mood ? (
          <View style={styles.tagRow}>
            <Text style={styles.moodTag}>{card.mood.toUpperCase()}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>
            Added {new Date(card.createdAt).toLocaleDateString()}
          </Text>
          <Pressable onPress={() => onToggleFavorite(card)}>
            <Text style={[styles.favorite, card.favorite && styles.favoriteActive]}>
              {card.favorite ? '📌' : '📍'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111827ee',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  thumbnail: {
    width: 96,
    height: 96,
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  placeholderText: {
    color: palette.silver,
    fontSize: 12,
  },
  textContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  title: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  description: {
    color: palette.silver,
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moodTag: {
    backgroundColor: '#1e1b4b',
    color: palette.neonPink,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#9ca3af',
    fontSize: 11,
  },
  favorite: {
    color: '#9ca3af',
    fontSize: 18,
  },
  favoriteActive: {
    color: palette.neonYellow,
  },
});
