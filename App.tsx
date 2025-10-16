import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import type { Permission } from 'react-native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { decode as decodeJpeg } from 'jpeg-js';
import classes from './assets/data/classes.json';
import { Buffer } from 'buffer';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';

const MODEL_ASSET = require('./assets/models/resnet50v17.onnx');
const CLASS_LABELS = (classes as { classes: string[] }).classes;
const TARGET_SIZE = 224;
const MODEL_FILENAME = 'resnet50v17.onnx';
const MODEL_ANDROID_ASSET_PATH = `models/${MODEL_FILENAME}`;

type RankedPrediction = {
  index: number;
  label: string;
  probability: number;
};

type SelectedImage = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView
        style={[
          styles.safeArea,
          isDarkMode ? styles.safeAreaDark : styles.safeAreaLight,
        ]}
      >
        <AppContent isDarkMode={isDarkMode} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type AppContentProps = {
  isDarkMode: boolean;
};

function AppContent({ isDarkMode }: AppContentProps) {
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [predictions, setPredictions] = useState<RankedPrediction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
  const { uri } = Image.resolveAssetSource(MODEL_ASSET);
        const modelSource = await loadModelSource(uri);
        const initializedSession =
          typeof modelSource === 'string'
            ? await InferenceSession.create(modelSource)
            : await InferenceSession.create(modelSource);
        if (isMounted) {
          setSession(initializedSession);
          setIsModelReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage('Failed to load the model. Please restart the app.');
          setIsModelReady(false);
        }
        console.error('Model load error', error);
      } finally {
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  const ensurePermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

  const permissionsToRequest: Permission[] = [];

    const mediaPermission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    if (mediaPermission) {
      permissionsToRequest.push(mediaPermission);
    }

    if (PermissionsAndroid.PERMISSIONS.CAMERA) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    const results = await PermissionsAndroid.requestMultiple(
      permissionsToRequest,
    );

    const allGranted = permissionsToRequest.every(permission => {
      const status = results[permission];
      return status === PermissionsAndroid.RESULTS.GRANTED;
    });

    if (!allGranted) {
      Alert.alert(
        'Permissions required',
        'Camera and photo library permissions are needed to classify photos.',
      );
    }

    return allGranted;
  }, []);

  const handleImageSelection = useCallback(
    async (source: 'camera' | 'library') => {
      setErrorMessage(null);

      if (!(await ensurePermission())) {
        return;
      }

      const pickerOptions = {
        mediaType: 'photo' as const,
        includeBase64: true,
        maxWidth: 768,
        maxHeight: 768,
        quality: 1 as const,
        presentationStyle: 'fullScreen' as const,
      };

      const result =
        source === 'camera'
          ? await launchCamera(pickerOptions)
          : await launchImageLibrary(pickerOptions);

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset: Asset = result.assets[0];

      if (!asset.base64 || !asset.uri) {
        setErrorMessage('Could not read image data. Please try another photo.');
        return;
      }

      setSelectedImage({
        uri: asset.uri,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
        fileName: asset.fileName ?? undefined,
      });

      if (!session) {
        setErrorMessage('Model is not ready yet.');
        return;
      }

      setIsRunningInference(true);

      try {
        const tensor = preprocessImage(asset.base64);
        const feeds = {
          [session.inputNames[0]]: tensor,
        };
        const output = await session.run(feeds);
        const outputName = session.outputNames[0];
        const rawOutput = output[outputName]?.data as Float32Array | number[];

        if (!rawOutput) {
          throw new Error('Model returned no data');
        }

        const probabilities = softmax(Array.from(rawOutput));
        const ranked = rankPredictions(probabilities, CLASS_LABELS, 3);
        setPredictions(ranked);
      } catch (error) {
        console.error('Inference error', error);
        setErrorMessage('Something went wrong while running the model.');
      } finally {
        setIsRunningInference(false);
      }
    },
    [ensurePermission, session],
  );

  return (
    <ScrollView
      style={[
        styles.content,
        isDarkMode ? styles.contentDark : styles.contentLight,
      ]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          ONNX Image Classifier
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Capture or upload a photo and let the ResNet50 model tell you what it
          sees.
        </Text>
      </View>

      {isModelReady && (
        <View style={styles.modelBadge}>
          <Text style={styles.modelBadgeText}>Model loaded</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => handleImageSelection('camera')}
          disabled={isLoadingModel || isRunningInference}
          accessibilityRole="button"
          accessibilityLabel="Open camera to take a photo"
        >
          <Text style={styles.buttonText}>
            {isRunningInference ? 'Working…' : 'Take Photo'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => handleImageSelection('library')}
          disabled={isLoadingModel || isRunningInference}
          accessibilityRole="button"
          accessibilityLabel="Choose a photo from the library"
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Choose Photo
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingModel && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.feedbackText, isDarkMode && styles.titleDark]}>
            Loading ONNX model…
          </Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {selectedImage && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
          <Text style={[styles.caption, isDarkMode && styles.captionDark]}>
            {selectedImage.fileName ?? 'Selected photo'}
          </Text>
        </View>
      )}

      {isRunningInference && !isLoadingModel && (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.feedbackText, isDarkMode && styles.titleDark]}>
            Classifying…
          </Text>
        </View>
      )}

      {!isRunningInference && predictions.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.titleDark]}>
            Top predictions
          </Text>
          {predictions.map(prediction => (
            <View key={prediction.index} style={styles.predictionRow}>
              <Text
                style={[styles.predictionLabel, isDarkMode && styles.titleDark]}
              >
                {prediction.label}
              </Text>
              <Text style={styles.predictionScore}>
                {(prediction.probability * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.helperBox}>
        <Text style={[styles.helperTitle, isDarkMode && styles.titleDark]}>
          Tips
        </Text>
        <Text style={[styles.helperText, isDarkMode && styles.subtitleDark]}>
          - Well lit, centered subjects improve accuracy.{'\n'}- Results are best
          for everyday objects from the ImageNet dataset.
        </Text>
      </View>
    </ScrollView>
  );
}

type ModelSource = string | Uint8Array;

async function loadModelSource(uri: string): Promise<ModelSource> {
  const normalizedUri = uri.trim();

  if (Platform.OS === 'android') {
    try {
      const cachedPath = `${RNFS.CachesDirectoryPath}/${MODEL_FILENAME}`;
      const hasCopy = await RNFS.exists(cachedPath);

      if (!hasCopy) {
        await RNFS.copyFileAssets(MODEL_ANDROID_ASSET_PATH, cachedPath);
      }

      return `file://${cachedPath}`;
    } catch (error) {
      console.warn('Falling back to network model load on Android', error);
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const bundlePath = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
      const exists = await RNFS.exists(bundlePath);

      if (exists) {
        return bundlePath;
      }
    } catch (error) {
      console.warn('Falling back to network model load on iOS', error);
    }
  }

  if (
    normalizedUri.startsWith('file://') ||
    normalizedUri.startsWith('asset:/') ||
    normalizedUri.startsWith('content://')
  ) {
    return normalizedUri;
  }

  if (normalizedUri.startsWith('http')) {
    const response = await fetch(normalizedUri);

    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error(`Unsupported model URI: ${normalizedUri}`);
}

function preprocessImage(base64: string) {
  const buffer = Buffer.from(base64, 'base64');
  const decoded = decodeJpeg(buffer, { useTArray: true });

  if (!decoded || !decoded.data) {
    throw new Error('Unable to decode image');
  }

  const resized = resizeToSquare(decoded, TARGET_SIZE);
  const tensorData = new Float32Array(3 * TARGET_SIZE * TARGET_SIZE);

  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let y = 0; y < TARGET_SIZE; y += 1) {
    for (let x = 0; x < TARGET_SIZE; x += 1) {
      const pixelIndex = y * TARGET_SIZE + x;
      const dataIndex = pixelIndex * 4;
      const r = resized.data[dataIndex] / 255;
      const g = resized.data[dataIndex + 1] / 255;
      const b = resized.data[dataIndex + 2] / 255;

      tensorData[pixelIndex] = (r - mean[0]) / std[0];
      tensorData[pixelIndex + TARGET_SIZE * TARGET_SIZE] =
        (g - mean[1]) / std[1];
      tensorData[pixelIndex + TARGET_SIZE * TARGET_SIZE * 2] =
        (b - mean[2]) / std[2];
    }
  }

  return new Tensor('float32', tensorData, [1, 3, TARGET_SIZE, TARGET_SIZE]);
}

function resizeToSquare(
  image: {
    data: Uint8Array;
    width: number;
    height: number;
  },
  target: number,
) {
  const { data, width, height } = image;
  const resized = new Uint8ClampedArray(target * target * 4);

  const xRatio = width / target;
  const yRatio = height / target;

  for (let y = 0; y < target; y += 1) {
    const sourceY = Math.min(Math.floor(y * yRatio), height - 1);
    for (let x = 0; x < target; x += 1) {
      const sourceX = Math.min(Math.floor(x * xRatio), width - 1);
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const targetIndex = (y * target + x) * 4;

      resized[targetIndex] = data[sourceIndex];
      resized[targetIndex + 1] = data[sourceIndex + 1];
      resized[targetIndex + 2] = data[sourceIndex + 2];
      resized[targetIndex + 3] = 255;
    }
  }

  return { data: resized, width: target, height: target };
}

function softmax(logits: number[]) {
  const maxLogit = Math.max(...logits);
  const expValues = logits.map(logit => Math.exp(logit - maxLogit));
  const sumExp = expValues.reduce((sum, value) => sum + value, 0);
  return expValues.map(value => value / sumExp);
}

function rankPredictions(
  probabilities: number[],
  labels: readonly string[],
  topK: number,
): RankedPrediction[] {
  const indexed = probabilities.map((probability, index) => ({
    index,
    probability,
    label: labels[index] ?? `Class ${index}`,
  }));

  indexed.sort((a, b) => b.probability - a.probability);

  return indexed.slice(0, topK);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  safeAreaDark: {
    backgroundColor: '#0d1117',
  },
  safeAreaLight: {
    backgroundColor: '#f2f4f8',
  },
  content: {
    flex: 1,
  },
  contentDark: {
    backgroundColor: '#111827',
  },
  contentLight: {
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  titleDark: {
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
  },
  subtitleDark: {
    color: '#d1d5db',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  button: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  feedbackText: {
    fontSize: 16,
    color: '#111827',
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 15,
  },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
  },
  caption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f9fafb',
    fontSize: 14,
  },
  captionDark: {
    color: '#e5e7eb',
  },
  resultsContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  predictionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  predictionScore: {
    fontVariant: ['tabular-nums'],
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  helperBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
  },
  helperTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  helperText: {
    color: '#4b5563',
    lineHeight: 20,
  },
  modelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  modelBadgeText: {
    color: '#ecfdf5',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

export default App;
