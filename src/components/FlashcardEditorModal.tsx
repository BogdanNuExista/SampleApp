import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { JournalMood } from '../context/GameContext';
import { RankedPrediction, useOnnxClassifier } from '../hooks/useOnnxClassifier';
import { palette } from '../theme/colors';

export type FlashcardEditorModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string;
    imageBase64?: string;
    mood?: JournalMood;
  }) => void;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultImageBase64?: string;
  defaultMood?: JournalMood;
  onDelete?: () => void;
};

const pickerOptions = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 640,
  maxHeight: 640,
};

const moodOptions: Array<{ id: JournalMood; label: string; emoji: string; hint: string }> = [
  { id: 'reflective', label: 'Reflective', emoji: '🌓', hint: 'Deep in thought' },
  { id: 'grateful', label: 'Grateful', emoji: '🌟', hint: 'Appreciating the wins' },
  { id: 'energized', label: 'Energized', emoji: '⚡', hint: 'Ready to tackle more' },
  { id: 'curious', label: 'Curious', emoji: '🔍', hint: 'Exploring ideas' },
  { id: 'victorious', label: 'Victorious', emoji: '🏆', hint: 'Celebrating progress' },
];

export function FlashcardEditorModal({
  visible,
  onClose,
  onSubmit,
  defaultDescription = '',
  defaultTitle = '',
  defaultImageBase64,
  defaultMood,
  onDelete,
}: FlashcardEditorModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [imageBase64, setImageBase64] = useState<string | undefined>(
    defaultImageBase64,
  );
  const [hasEditedTitle, setHasEditedTitle] = useState(Boolean(defaultTitle));
  const [predictions, setPredictions] = useState<RankedPrediction[]>([]);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [mood, setMood] = useState<JournalMood | undefined>(defaultMood);

  const { classifyImage, isModelLoading, isModelReady, modelError } = useOnnxClassifier();

  useEffect(() => {
    setTitle(defaultTitle);
    setDescription(defaultDescription);
    setImageBase64(defaultImageBase64);
    setHasEditedTitle(Boolean(defaultTitle));
    setPredictions([]);
    setPredictionError(null);
    setIsClassifying(false);
    setMood(defaultMood);
  }, [defaultDescription, defaultImageBase64, defaultMood, defaultTitle, visible]);

  const handlePickImage = async () => {
    const result = await launchImageLibrary(pickerOptions);
    if (result.didCancel || !result.assets?.length) {
      return;
    }
    const asset = result.assets[0];
    if (asset.base64) {
      setImageBase64(asset.base64);
      setPredictions([]);
      if (!isModelReady) {
        if (!isModelLoading) {
          setPredictionError('AI model is still warming up. Try again in a moment.');
        }
        return;
      }

      try {
        setIsClassifying(true);
        setPredictionError(null);
        const ranked = await classifyImage(asset.base64, 3);
        setPredictions(ranked);
        if (ranked.length > 0 && !hasEditedTitle) {
          setTitle(ranked[0].label);
        }
      } catch (error) {
        console.warn('Failed to classify image', error);
        setPredictionError('Could not classify this image.');
        setPredictions([]);
      } finally {
        setIsClassifying(false);
      }
    }
  };

  const applySuggestion = (label: string) => {
    setTitle(label);
    setHasEditedTitle(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.sheetTitle}>Log a journal memory</Text>
          <Text style={styles.helper}>
            Capture how you feel, what you learned, and keep the story in your codex. AI-powered by ResNet50-int8 for instant image recognition.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={value => {
                setHasEditedTitle(true);
                setTitle(value);
              }}
              placeholder="e.g. Neon skyline reflections"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Entry</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Write the beats of your day, a lesson, or a victory..."
              placeholderTextColor="#9ca3af"
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mood tracker</Text>
            <View style={styles.moodRow}>
              {moodOptions.map(option => {
                const isActive = option.id === mood;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.moodChip, isActive && styles.moodChipActive]}
                    onPress={() => setMood(option.id)}
                  >
                    <Text style={styles.moodEmoji}>{option.emoji}</Text>
                    <Text style={[styles.moodLabel, isActive && styles.moodLabelActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {mood ? (
              <Text style={styles.moodHint}>
                {moodOptions.find(option => option.id === mood)?.hint}
              </Text>
            ) : (
              <Text style={styles.moodHint}>Tag the energy behind this moment.</Text>
            )}
          </View>

          <View style={styles.previewBox}>
            {imageBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                style={styles.preview}
              />
            ) : (
              <View style={[styles.preview, styles.previewPlaceholder]}>
                <Text style={styles.previewPlaceholderText}>No artwork yet</Text>
              </View>
            )}
            <Pressable style={styles.pickButton} onPress={handlePickImage}>
              <Text style={styles.pickButtonText}>Choose cover art</Text>
            </Pressable>

            <View style={styles.modelStatusBlock}>
              {isModelLoading ? (
                <View style={styles.modelStatusRow}>
                  <ActivityIndicator size="small" color={palette.neonPink} />
                  <Text style={styles.modelStatusText}>Loading AI model…</Text>
                </View>
              ) : modelError ? (
                <Text style={styles.modelStatusError}>{modelError}</Text>
              ) : !isModelReady ? (
                <Text style={styles.modelStatusText}>AI model warming up…</Text>
              ) : isClassifying ? (
                <View style={styles.modelStatusRow}>
                  <ActivityIndicator size="small" color={palette.neonBlue} />
                  <Text style={styles.modelStatusText}>Scanning cover art…</Text>
                </View>
              ) : predictionError ? (
                <Text style={styles.modelStatusError}>{predictionError}</Text>
              ) : predictions.length > 0 ? (
                <View style={styles.predictionsBox}>
                  <Text style={styles.predictionsTitle}>AI suggestions</Text>
                  {predictions.map(prediction => (
                    <Pressable
                      key={prediction.index}
                      style={styles.predictionRow}
                      onPress={() => applySuggestion(prediction.label)}
                    >
                      <Text style={styles.predictionLabel}>{prediction.label}</Text>
                      <Text style={styles.predictionConfidence}>
                        {(prediction.probability * 100).toFixed(1)}%
                      </Text>
                    </Pressable>
                  ))}
                  <Text style={styles.predictionsHint}>Tap a suggestion to fill the title.</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.actionsRow}>
            {onDelete ? (
              <Pressable
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={() => {
                  onDelete();
                }}
              >
                <Text style={styles.actionButtonDangerText}>Delete</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.actionButton, styles.actionButtonGhost]}
              onPress={onClose}
            >
              <Text style={styles.actionButtonGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => {
                if (!title.trim()) {
                  return;
                }
                onSubmit({
                  title: title.trim(),
                  description: description.trim(),
                  imageBase64,
                  mood,
                });
                onClose();
              }}
            >
              <Text style={styles.actionButtonPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.midnight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.neonYellow,
  },
  helper: {
    color: palette.silver,
    fontSize: 13,
  },
  field: {
    gap: 8,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  moodChipActive: {
    borderColor: palette.neonPink,
    backgroundColor: '#31183a',
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  moodLabelActive: {
    color: palette.neonPink,
    fontWeight: '700',
  },
  moodHint: {
    color: '#64748b',
    fontSize: 12,
  },
  label: {
    color: palette.neonPink,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.softWhite,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewBox: {
    gap: 14,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  previewPlaceholder: {
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    color: palette.silver,
  },
  pickButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.neonBlue,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  pickButtonText: {
    color: palette.midnight,
    fontWeight: '700',
  },
  modelStatusBlock: {
    gap: 10,
  },
  modelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelStatusText: {
    color: palette.silver,
    fontSize: 13,
  },
  modelStatusError: {
    color: '#fca5a5',
    fontSize: 13,
  },
  predictionsBox: {
    backgroundColor: '#111b34',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#38bdf822',
  },
  predictionsTitle: {
    color: palette.neonYellow,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  predictionLabel: {
    color: palette.softWhite,
    fontWeight: '600',
  },
  predictionConfidence: {
    color: palette.neonBlue,
    fontVariant: ['tabular-nums'],
  },
  predictionsHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDanger: {
    backgroundColor: '#2b0b10',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  actionButtonDangerText: {
    color: '#f43f5e',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtonGhost: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonGhostText: {
    color: palette.silver,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    backgroundColor: palette.neonGreen,
  },
  actionButtonPrimaryText: {
    color: palette.midnight,
    fontWeight: '700',
  },
});
