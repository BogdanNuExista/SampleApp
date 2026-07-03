import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame } from '../context/GameContext';
import {
  LEARNING_CONTENT,
  LEARNING_SUBJECT_META,
  LearningSubjectKey,
  LearningExercise,
} from '../constants/learningContent';
import { RootStackParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';
import { MathRenderer } from '../components/MathRenderer';
import { soundEffects } from '../services/SoundEffects';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Quiz'>;

const SUBJECTS: LearningSubjectKey[] = ['algebra', 'analysis', 'trigonometry'];
const PER_SUBJECT = 4;
const COINS_PER_CORRECT = 5;
const XP_PER_CORRECT = 10;
const PERFECT_BONUS_COINS = 20;

type QuizQuestion = LearningExercise & { subject: LearningSubjectKey };

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function buildQuiz(): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const subject of SUBJECTS) {
    const picked = pickRandom(LEARNING_CONTENT[subject].exercises, PER_SUBJECT);
    picked.forEach(ex => questions.push({ ...ex, subject }));
  }
  return pickRandom(questions, questions.length); // shuffle so subjects interleave
}

export function QuizScreen() {
  const navigation = useNavigation<Navigation>();
  const { completeQuiz } = useGame();

  const [quiz, setQuiz] = useState<QuizQuestion[]>(() => buildQuiz());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<{ q: QuizQuestion; selectedId: string; correct: boolean }[]>([]);
  const [phase, setPhase] = useState<'running' | 'done'>('running');

  const total = quiz.length;
  const question = quiz[index];

  const summary = useMemo(() => {
    const correct = results.filter(r => r.correct).length;
    const coins = correct * COINS_PER_CORRECT + (correct === total && total > 0 ? PERFECT_BONUS_COINS : 0);
    const xp = correct * XP_PER_CORRECT;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, coins, xp, pct };
  }, [results, total]);

  const handleAnswer = (answerId: string) => {
    if (answered) return;
    const correct = answerId === question.correctAnswer;
    setSelected(answerId);
    setAnswered(true);
    setResults(prev => [...prev, { q: question, selectedId: answerId, correct }]);
    soundEffects.play(correct ? 'correct' : 'wrong');
  };

  const handleNext = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    finish();
  };

  const finish = () => {
    const correct = results.filter(r => r.correct).length;
    const coins = correct * COINS_PER_CORRECT + (correct === total && total > 0 ? PERFECT_BONUS_COINS : 0);
    const xp = correct * XP_PER_CORRECT;
    const solvedIds = results.filter(r => r.correct).map(r => r.q.id);
    completeQuiz({ correct, total, coinsEarned: coins, xpEarned: xp, solvedIds });
    if (summary.pct >= 60) {
      soundEffects.play('win');
    }
    setPhase('done');
  };

  const restart = () => {
    setQuiz(buildQuiz());
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setResults([]);
    setPhase('running');
  };

  const getAnswerStyle = (answerId: string) => {
    if (!answered) {
      return [styles.answerButton, styles.answerIdle];
    }
    if (answerId === question.correctAnswer) {
      return [styles.answerButton, styles.answerCorrect];
    }
    if (answerId === selected) {
      return [styles.answerButton, styles.answerWrong];
    }
    return [styles.answerButton, styles.answerDimmed];
  };

  if (phase === 'done') {
    const wrong = results.filter(r => !r.correct);
    const passed = summary.pct >= 60;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.resultHero, { borderColor: passed ? palette.neonGreen : palette.danger }]}>
          <Text style={styles.resultEmoji}>{passed ? '🏆' : '📚'}</Text>
          <Text style={styles.resultScore}>
            {summary.correct} / {total}
          </Text>
          <Text style={styles.resultPct}>{summary.pct}% correct</Text>
          <Text style={styles.resultReward}>+{summary.coins} 🪙   +{summary.xp} XP</Text>
        </View>

        {wrong.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Review ({wrong.length} to revisit)</Text>
            {wrong.map((r, i) => {
              const correctOpt = r.q.answers.find(a => a.id === r.q.correctAnswer);
              const meta = LEARNING_SUBJECT_META[r.q.subject];
              return (
                <View key={`${r.q.id}-${i}`} style={styles.reviewCard}>
                  <Text style={[styles.reviewSubject, { color: meta.color }]}>{meta.title}</Text>
                  <MathRenderer content={r.q.problem} fontSize={13} />
                  <View style={styles.reviewAnswerRow}>
                    <Text style={styles.reviewCorrectLabel}>Correct: </Text>
                    <View style={styles.reviewAnswerValue}>
                      <MathRenderer content={correctOpt?.text ?? ''} fontSize={13} textColor={palette.neonGreen} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footerButtons}>
          <Pressable style={[styles.bigButton, styles.retakeButton]} onPress={restart}>
            <Text style={styles.bigButtonText}>Retake</Text>
          </Pressable>
          <Pressable style={[styles.bigButton, styles.doneButton]} onPress={() => navigation.goBack()}>
            <Text style={[styles.bigButtonText, { color: '#06281c' }]}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const meta = LEARNING_SUBJECT_META[question.subject];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Question {index + 1} / {total}
        </Text>
        <View style={[styles.subjectBadge, { backgroundColor: meta.color + '22', borderColor: meta.color + '55' }]}>
          <Text style={[styles.subjectBadgeText, { color: meta.color }]}>{meta.title}</Text>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${((index) / total) * 100}%` }]} />
      </View>

      <View style={styles.problemCard}>
        <MathRenderer content={question.problem} fontSize={16} />
      </View>

      {question.answers.map(answer => (
        <Pressable
          key={answer.id}
          style={getAnswerStyle(answer.id)}
          onPress={() => handleAnswer(answer.id)}
          disabled={answered}
        >
          <View style={styles.answerLetter}>
            <Text style={styles.answerLetterText}>{answer.id.toUpperCase()}</Text>
          </View>
          <View style={styles.answerText}>
            <MathRenderer content={answer.text} fontSize={14} />
          </View>
        </Pressable>
      ))}

      {answered && (
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {index + 1 < total ? 'Next →' : 'Finish'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  content: { padding: 20, paddingBottom: 48, gap: 14 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: { color: palette.softWhite, fontSize: 15, fontWeight: '700' },
  subjectBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  subjectBadgeText: { fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#1e293b', overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3, backgroundColor: palette.neonPink },
  problemCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  answerIdle: { borderColor: '#334155' },
  answerCorrect: { borderColor: palette.neonGreen, backgroundColor: palette.neonGreen + '1a' },
  answerWrong: { borderColor: palette.danger, backgroundColor: palette.danger + '1a' },
  answerDimmed: { borderColor: '#1e293b', opacity: 0.5 },
  answerLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterText: { color: palette.silver, fontWeight: '700' },
  answerText: { flex: 1 },
  nextButton: {
    marginTop: 6,
    backgroundColor: palette.neonPink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: { color: '#2a0a1c', fontWeight: '800', fontSize: 16 },
  // results
  resultHero: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
  },
  resultEmoji: { fontSize: 48 },
  resultScore: { color: palette.softWhite, fontSize: 40, fontWeight: '900' },
  resultPct: { color: palette.silver, fontSize: 16 },
  resultReward: { color: palette.neonYellow, fontSize: 18, fontWeight: '800', marginTop: 8 },
  reviewSection: { gap: 12 },
  reviewTitle: { color: palette.neonPink, fontSize: 16, fontWeight: '700' },
  reviewCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  reviewSubject: { fontSize: 12, fontWeight: '700' },
  reviewAnswerRow: { flexDirection: 'row', alignItems: 'center' },
  reviewCorrectLabel: { color: palette.silver, fontSize: 13, fontWeight: '700' },
  reviewAnswerValue: { flex: 1 },
  footerButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  bigButton: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  retakeButton: { backgroundColor: '#1e293b' },
  doneButton: { backgroundColor: palette.neonGreen },
  bigButtonText: { color: palette.softWhite, fontWeight: '800', fontSize: 16 },
});
