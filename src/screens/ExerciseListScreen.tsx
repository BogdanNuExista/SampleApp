import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame } from '../context/GameContext';
import { LEARNING_CONTENT, LEARNING_SUBJECT_META } from '../constants/learningContent';
import { RootStackParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';

type RouteProps = RouteProp<RootStackParamList, 'ExerciseList'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

type ExerciseRowData = {
  id: string;
  index: number;
  solved: boolean;
  optionCount: number;
};

const Separator = () => <View style={styles.separator} />;

const ExerciseRow = React.memo(function ExerciseRow({
  item,
  color,
  onPress,
}: {
  item: ExerciseRowData;
  color: string;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      style={[styles.exerciseRow, item.solved && styles.exerciseSolved]}
      onPress={() => onPress(item.id)}
    >
      <View style={[styles.numberBadge, { backgroundColor: item.solved ? '#16a34a' : color + '33' }]}>
        <Text style={[styles.numberText, { color: item.solved ? '#fff' : color }]}>
          {item.index + 1}
        </Text>
      </View>
      <View style={styles.exerciseContent}>
        <Text style={styles.exercisePreview}>Problem {item.index + 1}</Text>
        <Text style={[styles.exerciseStatus, { color: item.solved ? '#4ade80' : '#64748b' }]}>
          {item.solved ? '✅ Solved' : `${item.optionCount} options`}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
});

export function ExerciseListScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Navigation>();
  const { subject } = route.params;
  const { state: { learning } } = useGame();

  const data = LEARNING_CONTENT[subject];
  const color = LEARNING_SUBJECT_META[subject].color;

  const exercises = useMemo<ExerciseRowData[]>(() => {
    const solvedSet = new Set(learning.solvedExercises);
    return data.exercises.map((ex, i) => ({
      id: ex.id,
      index: i,
      solved: solvedSet.has(ex.id),
      optionCount: ex.answers.length,
    }));
  }, [data, learning.solvedExercises]);

  const solvedCount = useMemo(
    () => exercises.reduce((n, e) => (e.solved ? n + 1 : n), 0),
    [exercises],
  );

  const handlePress = useCallback(
    (exerciseId: string) => {
      navigation.navigate('ExerciseDetail', { subject, exerciseId });
    },
    [navigation, subject],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ExerciseRowData>) => (
      <ExerciseRow item={item} color={color} onPress={handlePress} />
    ),
    [color, handlePress],
  );

  const keyExtractor = useCallback((item: ExerciseRowData) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color }]}>{data.topic}</Text>
        <Text style={styles.subtitle}>
          {solvedCount} / {exercises.length} exercises solved
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(solvedCount / exercises.length) * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={11}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 14,
  },
  exerciseSolved: {
    opacity: 0.85,
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontWeight: '700',
    fontSize: 15,
  },
  exerciseContent: {
    flex: 1,
    gap: 3,
  },
  exercisePreview: {
    color: palette.softWhite,
    fontSize: 14,
    lineHeight: 20,
  },
  exerciseStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    color: '#475569',
    fontSize: 22,
    fontWeight: '300',
  },
});
