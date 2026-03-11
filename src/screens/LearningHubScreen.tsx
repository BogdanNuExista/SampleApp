import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGame, LearningSubject } from '../context/GameContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import { palette } from '../theme/colors';

const SUBJECT_UNLOCK_COST = 100;

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type SubjectConfig = {
  id: LearningSubject;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  exercisePrefix: string;
  totalExercises: number;
};

const SUBJECTS: SubjectConfig[] = [
  {
    id: 'algebra',
    title: 'Algebra',
    subtitle: 'Inequalities, absolute values, equations & number theory',
    icon: '📐',
    color: '#a855f7',
    exercisePrefix: 'AL',
    totalExercises: 10,
  },
  {
    id: 'analysis',
    title: 'Analysis',
    subtitle: 'Limits, derivatives, continuity & asymptotes',
    icon: '📊',
    color: '#06b6d4',
    exercisePrefix: 'AM',
    totalExercises: 10,
  },
  {
    id: 'trigonometry',
    title: 'Trigonometry',
    subtitle: 'Angles, identities, equations & functions',
    icon: '📏',
    color: '#f59e0b',
    exercisePrefix: 'TG',
    totalExercises: 10,
  },
];

export function LearningHubScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    state: { coins, learning },
    unlockSubject,
  } = useGame();

  const [pendingSubject, setPendingSubject] = useState<SubjectConfig | null>(null);

  const handleUnlock = (subject: SubjectConfig) => {
    setPendingSubject(subject);
  };

  const confirmUnlock = () => {
    if (pendingSubject) {
      unlockSubject(pendingSubject.id, SUBJECT_UNLOCK_COST);
      setPendingSubject(null);
    }
  };

  const handleOpen = (subject: SubjectConfig) => {
    navigation.navigate('ExerciseList', { subject: subject.id });
  };

  const canAfford = coins >= SUBJECT_UNLOCK_COST;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Unlock modal */}
      <Modal visible={pendingSubject !== null} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPendingSubject(null)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {pendingSubject?.icon} Unlock {pendingSubject?.title}
            </Text>
            <Text style={styles.modalDescription}>{pendingSubject?.subtitle}</Text>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Cost</Text>
              <Text style={styles.costValue}>{SUBJECT_UNLOCK_COST} 🪙</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Your coins</Text>
              <Text style={[styles.costValue, !canAfford && styles.costInsufficient]}>
                {coins} 🪙
              </Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Exercises included</Text>
              <Text style={styles.costValue}>{pendingSubject?.totalExercises}</Text>
            </View>
            {canAfford ? (
              <Pressable style={styles.modalButton} onPress={confirmUnlock}>
                <Text style={styles.modalButtonText}>Unlock Now</Text>
              </Pressable>
            ) : (
              <Text style={styles.insufficientText}>
                Not enough coins! Complete focus sessions to earn more.
              </Text>
            )}
            <Pressable style={styles.modalCancelButton} onPress={() => setPendingSubject(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Learning Hub</Text>
        <Text style={styles.headerSubtitle}>
          Master the subjects required for university entrance
        </Text>
        <View style={styles.coinsRow}>
          <Text style={styles.coinsLabel}>🪙 {coins} coins available</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Unlock a subject for {SUBJECT_UNLOCK_COST} coins and solve all its exercises.
          Mark the correct answer and reveal step-by-step solutions.
        </Text>
      </View>

      {SUBJECTS.map(subject => {
        const isUnlocked = learning.unlockedSubjects.includes(subject.id);
        const solved = learning.solvedExercises.filter(id =>
          id.startsWith(subject.exercisePrefix),
        ).length;

        return (
          <View
            key={subject.id}
            style={[styles.subjectCard, { borderColor: subject.color + '44' }]}
          >
            <View style={styles.subjectTop}>
              <View style={[styles.iconCircle, { backgroundColor: subject.color + '22' }]}>
                <Text style={styles.subjectIcon}>{subject.icon}</Text>
              </View>
              <View style={styles.subjectInfo}>
                <Text style={[styles.subjectTitle, { color: subject.color }]}>
                  {subject.title}
                </Text>
                <Text style={styles.subjectSubtitle}>{subject.subtitle}</Text>
              </View>
            </View>

            {isUnlocked ? (
              <>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${(solved / subject.totalExercises) * 100}%`,
                          backgroundColor: subject.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progresstext}>
                    {solved} / {subject.totalExercises} solved
                  </Text>
                </View>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: subject.color }]}
                  onPress={() => handleOpen(subject)}
                >
                  <Text style={styles.primaryButtonText}>
                    {solved === subject.totalExercises ? '✅ Review Exercises' : '▶ Continue'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>🔒 Locked</Text>
                </View>
                <Pressable
                  style={[
                    styles.unlockButton,
                    coins < SUBJECT_UNLOCK_COST && styles.unlockButtonDisabled,
                  ]}
                  onPress={() => handleUnlock(subject)}
                >
                  <Text style={styles.unlockButtonText}>
                    🪙 Unlock for {SUBJECT_UNLOCK_COST} coins
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        );
      })}

      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>Overall Progress</Text>
        <Text style={styles.totalCount}>
          {learning.solvedExercises.length} / 30 exercises solved
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${(learning.solvedExercises.length / 30) * 100}%`,
                backgroundColor: palette.neonYellow,
              },
            ]}
          />
        </View>
      </View>
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
    paddingBottom: 40,
  },
  header: {
    gap: 6,
    marginBottom: 4,
  },
  headerTitle: {
    color: palette.neonYellow,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  coinsRow: {
    marginTop: 4,
  },
  coinsLabel: {
    color: palette.neonYellow,
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#111c35',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 20,
  },
  subjectCard: {
    backgroundColor: '#111c35',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    borderWidth: 1,
  },
  subjectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIcon: {
    fontSize: 26,
  },
  subjectInfo: {
    flex: 1,
    gap: 4,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  subjectSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressRow: {
    gap: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progresstext: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'right',
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  lockedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockedText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  unlockButton: {
    backgroundColor: '#1e3a5f',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.neonYellow + '55',
  },
  unlockButtonDisabled: {
    opacity: 0.45,
  },
  unlockButtonText: {
    color: palette.neonYellow,
    fontWeight: '700',
    fontSize: 15,
  },
  totalCard: {
    backgroundColor: '#111c35',
    borderRadius: 24,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.neonYellow + '33',
    marginTop: 4,
  },
  totalTitle: {
    color: palette.neonYellow,
    fontWeight: '700',
    fontSize: 16,
  },
  totalCount: {
    color: palette.softWhite,
    fontWeight: '600',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1f2d4d',
  },
  modalTitle: {
    color: palette.neonYellow,
    fontSize: 20,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  costLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  costValue: {
    color: palette.softWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  costInsufficient: {
    color: '#ef4444',
  },
  insufficientText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalButton: {
    marginTop: 4,
    backgroundColor: palette.neonPink,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: palette.midnight,
    fontWeight: '700',
    fontSize: 15,
  },
  modalCancelButton: {
    marginTop: 4,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
});
