import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';

function formatObtainedDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InventoryScreen() {
  const {
    state: { inventory },
  } = useGame();

  const sortedInventory = useMemo(
    () => [...inventory].sort((a, b) => b.obtainedAt - a.obtainedAt),
    [inventory],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Backpack Inventory</Text>
        <Text style={styles.subtitle}>
          Claim medium and hard chess victories to add rare loot and weapons to your retro vault.
        </Text>
      </View>

      <FlatList
        data={sortedInventory}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={sortedInventory.length > 0 ? styles.columnWrapper : undefined}
        contentContainerStyle={
          sortedInventory.length === 0 ? styles.emptyContent : styles.gridContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your backpack is empty</Text>
            <Text style={styles.emptyBody}>
              Defeat tougher chess opponents to earn synth relics and blades.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemArtWrapper}>
              <Image source={item.image} style={styles.itemArt} resizeMode="contain" />
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>{formatObtainedDate(item.obtainedAt)}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: palette.neonYellow,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  gridContent: {
    paddingBottom: 40,
    gap: 16,
  },
  columnWrapper: {
    gap: 16,
    justifyContent: 'flex-start',
  },
  itemCard: {
    flex: 1,
    minWidth: 96,
    backgroundColor: '#101b34',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2d4d',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  itemArtWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#172549',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemArt: {
    width: 60,
    height: 60,
  },
  itemName: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  itemMeta: {
    color: '#64748b',
    fontSize: 11,
  },
  emptyContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: palette.softWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
});
