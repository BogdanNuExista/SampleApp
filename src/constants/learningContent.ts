import algebraData from '../../assets/learning/algebra.json';
import analysisData from '../../assets/learning/analysis.json';
import trigonometryData from '../../assets/learning/trigonometry.json';

export type LearningSubjectKey = 'algebra' | 'analysis' | 'trigonometry';

export type LearningAnswer = {
  id: string;
  text: string;
};

export type LearningExercise = {
  id: string;
  problem: string;
  answers: LearningAnswer[];
  correctAnswer: string;
  solution: string;
};

export type LearningTopicData = {
  topic: string;
  exercises: LearningExercise[];
};

export const LEARNING_CONTENT: Record<LearningSubjectKey, LearningTopicData> = {
  algebra: algebraData as LearningTopicData,
  analysis: analysisData as LearningTopicData,
  trigonometry: trigonometryData as LearningTopicData,
};

export const LEARNING_SUBJECT_META = {
  algebra: {
    title: 'Algebra',
    subtitle: 'Inequalities, absolute values, equations & number theory',
    icon: '📐',
    color: '#a855f7',
    exercisePrefix: 'AL',
  },
  analysis: {
    title: 'Analysis',
    subtitle: 'Limits, derivatives, continuity & asymptotes',
    icon: '📊',
    color: '#06b6d4',
    exercisePrefix: 'AM',
  },
  trigonometry: {
    title: 'Trigonometry',
    subtitle: 'Angles, identities, equations & functions',
    icon: '📏',
    color: '#f59e0b',
    exercisePrefix: 'TG',
  },
} as const satisfies Record<LearningSubjectKey, {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  exercisePrefix: string;
}>;

export const SUBJECT_EXERCISE_COUNTS: Record<LearningSubjectKey, number> = {
  algebra: LEARNING_CONTENT.algebra.exercises.length,
  analysis: LEARNING_CONTENT.analysis.exercises.length,
  trigonometry: LEARNING_CONTENT.trigonometry.exercises.length,
};

export const TOTAL_LEARNING_EXERCISES = Object.values(LEARNING_CONTENT).reduce(
  (total, subject) => total + subject.exercises.length,
  0,
);
