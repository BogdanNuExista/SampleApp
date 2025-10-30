import { ImageSourcePropType } from 'react-native';

export type SkeletonAnimationKey =
  | 'running'
  | 'slashing';

export interface SkeletonAnimation {
  label: string;
  frames: ImageSourcePropType[];
  fps: number;
}

// Running animation frames
const runningFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_000.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_001.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_002.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_003.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_004.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_005.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_006.png'),
  require('../../assets/Skeleton_Crusader/Running/0_Skeleton_Crusader_Running_007.png'),
];

// Slashing animation frames
const slashingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_000.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_001.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_002.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_003.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_004.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_005.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_006.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_007.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_008.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_009.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_010.png'),
  require('../../assets/Skeleton_Crusader/Slashing/0_Skeleton_Crusader_Slashing_011.png'),
];

export const skeletonAnimations: Record<SkeletonAnimationKey, SkeletonAnimation> = {
  running: {
    label: 'Running',
    frames: runningFrames,
    fps: 12,
  },
  slashing: {
    label: 'Slashing',
    frames: slashingFrames,
    fps: 15,
  },
};

export function pickRandomSkeletonAnimation(
  exclude?: SkeletonAnimationKey | SkeletonAnimationKey[],
): SkeletonAnimationKey {
  const excludeArray = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
  const keys = (Object.keys(skeletonAnimations) as SkeletonAnimationKey[]).filter(
    key => !excludeArray.includes(key),
  );
  return keys[Math.floor(Math.random() * keys.length)];
}
