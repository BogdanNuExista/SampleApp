import { ImageSourcePropType } from 'react-native';

export type SkeletonAnimationKey =
  | 'idle'
  | 'running'
  | 'slashing';

export interface SkeletonAnimation {
  label: string;
  frames: ImageSourcePropType[];
  fps: number;
}

// Idle animation frames - manually loaded for Metro bundler compatibility
const idleFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_000.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_001.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_002.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_003.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_004.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_005.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_006.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_007.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_008.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_009.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_010.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_011.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_012.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_013.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_014.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_015.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_016.png'),
  require('../../assets/Skeleton_Crusader/Idle/0_Skeleton_Crusader_Idle_017.png'),
];

// Walking animation frames
const walkingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_000.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_001.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_002.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_003.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_004.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_005.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_006.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_007.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_008.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_009.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_010.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_011.png'),
  require('../../assets/Skeleton_Crusader/Walking/0_Skeleton_Crusader_Walking_012.png'),
];

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

// Kicking animation frames
const kickingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_000.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_001.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_002.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_003.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_004.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_005.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_006.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_007.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_008.png'),
  require('../../assets/Skeleton_Crusader/Kicking/0_Skeleton_Crusader_Kicking_009.png'),
];

// Throwing animation frames (only 12 frames: 000-011)
const throwingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_000.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_001.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_002.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_003.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_004.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_005.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_006.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_007.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_008.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_009.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_010.png'),
  require('../../assets/Skeleton_Crusader/Throwing/0_Skeleton_Crusader_Throwing_011.png'),
];

// Hurt animation frames
const hurtFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Hurt/0_Skeleton_Crusader_Hurt_000.png'),
  require('../../assets/Skeleton_Crusader/Hurt/0_Skeleton_Crusader_Hurt_001.png'),
  require('../../assets/Skeleton_Crusader/Hurt/0_Skeleton_Crusader_Hurt_002.png'),
];

// Dying animation frames
const dyingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_000.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_001.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_002.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_003.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_004.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_005.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_006.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_007.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_008.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_009.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_010.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_011.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_012.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_013.png'),
  require('../../assets/Skeleton_Crusader/Dying/0_Skeleton_Crusader_Dying_014.png'),
];

// Falling Down animation frames (only 6 frames: 000-005)
const fallingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_000.png'),
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_001.png'),
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_002.png'),
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_003.png'),
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_004.png'),
  require('../../assets/Skeleton_Crusader/Falling Down/0_Skeleton_Crusader_Falling Down_005.png'),
];

// Jump Start animation frames (6 frames: 000-005)
const jumpingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_000.png'),
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_001.png'),
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_002.png'),
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_003.png'),
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_004.png'),
  require('../../assets/Skeleton_Crusader/Jump Start/0_Skeleton_Crusader_Jump Start_005.png'),
];

// Sliding animation frames
const slidingFrames: ImageSourcePropType[] = [
  require('../../assets/Skeleton_Crusader/Sliding/0_Skeleton_Crusader_Sliding_000.png'),
  require('../../assets/Skeleton_Crusader/Sliding/0_Skeleton_Crusader_Sliding_001.png'),
];

export const skeletonAnimations: Record<SkeletonAnimationKey, SkeletonAnimation> = {
  idle: {
    label: 'Idle',
    frames: idleFrames,
    fps: 8,
  },
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
