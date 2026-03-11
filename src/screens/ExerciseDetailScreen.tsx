import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useGame, LearningSubject } from '../context/GameContext';
import {
  LEARNING_CONTENT,
  LEARNING_SUBJECT_META,
} from '../constants/learningContent';
import { RootStackParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';
import { MathRenderer } from '../components/MathRenderer';

type RouteProps = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export function ExerciseDetailScreen() {
  const route = useRoute<RouteProps>();
  const { subject, exerciseId } = route.params;
  const {
    state: { learning },
    markExerciseSolved,
  } = useGame();

  const data = LEARNING_CONTENT[subject];
  const color = LEARNING_SUBJECT_META[subject].color;
  const exercise = data.exercises.find(ex => ex.id === exerciseId)!;
  const exerciseIndex = data.exercises.findIndex(ex => ex.id === exerciseId);

  const isSolved = learning.solvedExercises.includes(exerciseId);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    isSolved ? exercise.correctAnswer : null,
  );
  const [showSolution, setShowSolution] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(isSolved);

  const handleAnswer = (answerId: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerId);
    setHasAnswered(true);
    if (answerId === exercise.correctAnswer) {
      markExerciseSolved(exerciseId);
    }
  };

  const isCorrect = selectedAnswer === exercise.correctAnswer;

  const getAnswerStyle = (answerId: string) => {
    if (!hasAnswered) {
      return [styles.answerButton, { borderColor: color + '55' }];
    }
    if (answerId === exercise.correctAnswer) {
      return [styles.answerButton, styles.answerCorrect];
    }
    if (answerId === selectedAnswer && answerId !== exercise.correctAnswer) {
      return [styles.answerButton, styles.answerWrong];
    }
    return [styles.answerButton, styles.answerDimmed];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={[styles.subjectBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
          <Text style={[styles.subjectBadgeText, { color }]}>{data.topic}</Text>
        </View>
        <Text style={styles.exerciseNum}>Exercise {exerciseIndex + 1}</Text>
        {isSolved && (
          <View style={styles.solvedBadge}>
            <Text style={styles.solvedBadgeText}>✅ Solved</Text>
          </View>
        )}
      </View>

      {/* Problem */}
      <View style={styles.problemCard}>
        <Text style={[styles.problemLabel, { color }]}>Problem</Text>
        <MathRenderer content={exercise.problem} fontSize={16} />
      </View>

      {/* Answers */}
      <View style={styles.answersSection}>
        <Text style={styles.sectionLabel}>Choose the correct answer</Text>
        {exercise.answers.map(answer => (
          <Pressable
            key={answer.id}
            style={getAnswerStyle(answer.id)}
            onPress={() => handleAnswer(answer.id)}
            disabled={hasAnswered}
          >
            <View style={[styles.answerBullet, { backgroundColor: color + '33' }]}>
              <Text style={[styles.answerBulletText, { color }]}>{answer.id})</Text>
            </View>
            <View pointerEvents="none" style={styles.answerMathArea}>
              <MathRenderer content={answer.text} fontSize={14} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Result banner */}
      {hasAnswered && (
        <View style={[styles.resultBanner, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
          <Text style={styles.resultText}>
            {isCorrect ? '🎉 Correct!' : `❌ Incorrect — the correct answer is (${exercise.correctAnswer})`}
          </Text>
        </View>
      )}

      {/* Show solution button */}
      <Pressable
        style={[styles.solutionToggle, { borderColor: color + '55' }]}
        onPress={() => setShowSolution(v => !v)}
      >
        <Text style={[styles.solutionToggleText, { color }]}>
          {showSolution ? '▲ Hide Solution' : '▼ Show Solution'}
        </Text>
      </Pressable>

      {showSolution && (
        <View style={[styles.solutionCard, { borderColor: color + '33' }]}>
          <Text style={[styles.solutionLabel, { color }]}>Step-by-Step Solution</Text>
          <MathRenderer content={exercise.solution} fontSize={14} textColor="#cbd5e1" />
        </View>
      )}
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
    gap: 16,
    paddingBottom: 60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  subjectBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  subjectBadgeText: {
    fontWeight: '700',
    fontSize: 13,
  },
  exerciseNum: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  solvedBadge: {
    backgroundColor: '#14532d',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  solvedBadgeText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },
  problemCard: {
    backgroundColor: '#111c35',
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  problemLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  problemText: {
    color: palette.softWhite,
    fontSize: 16,
    lineHeight: 26,
  },
  answersSection: {
    gap: 10,
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#111c35',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  answerMathArea: {
    flex: 1,
    overflow: 'hidden',
  },
  answerCorrect: {
    backgroundColor: '#14532d',
    borderColor: '#16a34a',
  },
  answerWrong: {
    backgroundColor: '#450a0a',
    borderColor: '#dc2626',
  },
  answerDimmed: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    opacity: 0.5,
  },
  answerBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerBulletText: {
    fontWeight: '700',
    fontSize: 14,
  },

  resultBanner: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  resultCorrect: {
    backgroundColor: '#14532d',
  },
  resultWrong: {
    backgroundColor: '#450a0a',
  },
  resultText: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 15,
  },
  solutionToggle: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  solutionToggleText: {
    fontWeight: '700',
    fontSize: 15,
  },
  solutionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
  },
  solutionLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  solutionText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 24,
  },
});
