import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { decode as decodeJpeg } from 'jpeg-js';
import { Buffer } from 'buffer';
import classes from '../../assets/data/classes.json';

const MODEL_ASSET = require('../../assets/models/resnet50v17.onnx');
const CLASS_LABELS = (classes as { classes: string[] }).classes;
const TARGET_SIZE = 224;
const MODEL_FILENAME = 'resnet50v17.onnx';
const MODEL_ANDROID_ASSET_PATH = `models/${MODEL_FILENAME}`;

export type RankedPrediction = {
  index: number;
  label: string;
  probability: number;
};

type ModelSource = string | Uint8Array;

export function useOnnxClassifier() {
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { uri } = Image.resolveAssetSource(MODEL_ASSET);
        const modelSource = await loadModelSource(uri);
        const loadedSession =
          typeof modelSource === 'string'
            ? await InferenceSession.create(modelSource)
            : await InferenceSession.create(modelSource);
        if (isMounted) {
          setSession(loadedSession);
        }
      } catch (modelError) {
        console.warn('Failed to load ONNX model', modelError);
        if (isMounted) {
          setError('Unable to load classification model.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  const classifyImage = useCallback(
    async (base64: string, topK = 3): Promise<RankedPrediction[]> => {
      if (!session) {
        throw new Error('Model not ready yet');
      }

      const tensor = preprocessImage(base64);
      const feeds: Record<string, Tensor> = {
        [session.inputNames[0]]: tensor,
      };

      const output = await session.run(feeds);
      const outputName = session.outputNames[0];
      const outputTensor = output[outputName];

      if (!outputTensor || !outputTensor.data) {
        throw new Error('Model returned no data');
      }

      const dataArray = Array.from(outputTensor.data as Float32Array | number[]);
      const probabilities = softmax(dataArray);
      return rankPredictions(probabilities, CLASS_LABELS, topK);
    },
    [session],
  );

  return useMemo(
    () => ({
      classifyImage,
      isModelReady: Boolean(session),
      isModelLoading: isLoading,
      modelError: error,
    }),
    [classifyImage, error, isLoading, session],
  );
}

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
      const sourceIndex = pixelIndex * 4;
      const r = resized.data[sourceIndex] / 255;
      const g = resized.data[sourceIndex + 1] / 255;
      const b = resized.data[sourceIndex + 2] / 255;

      tensorData[pixelIndex] = (r - mean[0]) / std[0];
      tensorData[pixelIndex + TARGET_SIZE * TARGET_SIZE] = (g - mean[1]) / std[1];
      tensorData[pixelIndex + TARGET_SIZE * TARGET_SIZE * 2] = (b - mean[2]) / std[2];
    }
  }

  return new Tensor('float32', tensorData, [1, 3, TARGET_SIZE, TARGET_SIZE]);
}

function resizeToSquare(
  image: { data: Uint8Array; width: number; height: number },
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
