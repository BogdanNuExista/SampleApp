import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { FlashcardEditorModal } from '../components/FlashcardEditorModal';
import { FlashcardItem } from '../components/FlashcardItem';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';

const icons = {
  crystal: require('../../assets/icon_pack/128/gemBlue.png'),
};

export function FlashcardsScreen() {
  const {
    state: { flashcards },
    addFlashcard,
    updateFlashcard,
    toggleFlashcardFavorite,
  } = useGame();

  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => flashcards.find(card => card.id === selectedId),
    [flashcards, selectedId],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Neon Journal</Text>
          <Text style={styles.subtitle}>
            Chronicle your wins, realizations, and moods as you power through the arcade.
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setEditorVisible(true)}>
          <Text style={styles.addButtonText}>+ Entry</Text>
        </Pressable>
      </View>

      {flashcards.length === 0 ? (
        <EmptyState
          icon={icons.crystal}
          title="Begin your codex journal"
          subtitle="Log reflections, attach photos, and tag the mood of each moment."
        />
      ) : (
        <FlatList
          data={flashcards}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <FlashcardItem
              card={item}
              onPress={card => {
                setSelectedId(card.id);
                setEditorVisible(true);
              }}
              onToggleFavorite={card => toggleFlashcardFavorite(card.id)}
            />
          )}
        />
      )}

      <FlashcardEditorModal
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setSelectedId(null);
        }}
        onSubmit={({ title, description, imageBase64, mood }) => {
          if (selectedCard) {
            updateFlashcard(selectedCard.id, {
              title,
              description,
              imageBase64,
              mood,
              lastReviewedAt: Date.now(),
            });
          } else {
            addFlashcard({ title, description, imageBase64, mood });
          }
        }}
        defaultTitle={selectedCard?.title}
        defaultDescription={selectedCard?.description}
        defaultImageBase64={selectedCard?.imageBase64}
        defaultMood={selectedCard?.mood}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: palette.neonYellow,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
  },
  addButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: palette.neonGreen,
  },
  addButtonText: {
    color: palette.midnight,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
