import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame, LearningSubject } from '../context/GameContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';

import algebraData from '../../assets/learning/algebra.json';
import analysisData from '../../assets/learning/analysis.json';
import trigonometryData from '../../assets/learning/trigonometry.json';

type RouteProps = RouteProp<RootStackParamList, 'ExerciseList'>;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const DATA_MAP: Record<LearningSubject, { topic: string; exercises: { id: string; problem: string; answers: { id: string; text: string }[]; correctAnswer: string; solution: string }[] }> = {
  algebra: algebraData as any,
  analysis: analysisData as any,
  trigonometry: trigonometryData as any,
};

const SUBJECT_COLOR: Record<LearningSubject, string> = {
  algebra: '#a855f7',
  analysis: '#06b6d4',
  trigonometry: '#f59e0b',
};

export function ExerciseListScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Navigation>();
  const { subject } = route.params;
  const { state: { learning } } = useGame();

  const data = DATA_MAP[subject];
  const color = SUBJECT_COLOR[subject];

  const exercises = data.exercises.map((ex, i) => ({
    ...ex,
    index: i,
    solved: learning.solvedExercises.includes(ex.id),
  }));

  const solvedCount = exercises.filter(e => e.solved).length;

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
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.exerciseRow, item.solved && styles.exerciseSolved]}
            onPress={() =>
              navigation.navigate('ExerciseDetail', {
                subject,
                exerciseId: item.id,
              })
            }
          >
            <View style={[styles.numberBadge, { backgroundColor: item.solved ? '#16a34a' : color + '33' }]}>
              <Text style={[styles.numberText, { color: item.solved ? '#fff' : color }]}>
                {item.index + 1}
              </Text>
            </View>
            <View style={styles.exerciseContent}>
              <Text style={styles.exercisePreview}>
                Problem {item.index + 1}
              </Text>
              <Text style={[styles.exerciseStatus, { color: item.solved ? '#4ade80' : '#64748b' }]}>
                {item.solved ? '✅ Solved' : `${item.answers.length} options`}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
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
