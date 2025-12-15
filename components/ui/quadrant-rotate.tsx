import { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface QuadrantRotateProps {
  /** Size of the entire loader in pixels (default: 120) */
  size?: number;
  /** Color of the quadrants (default: '#2196F3' - blue) */
  color?: string;
  /** Animation durations for one rotation cycle for each quadrant in milliseconds (default: [4000, 4000, 4000, 4000]) */
  durations?: [number, number, number, number];
  /** Pause durations at each 90-degree mark for each quadrant in milliseconds (default: [600, 500, 700, 550]) */
  pauseDurations?: [number, number, number, number];
  /** Start delay offsets for each quadrant in milliseconds (default: [0, 200, 400, 600]) */
  startDelays?: [number, number, number, number];
  /** Initial rotation angles for each quadrant in degrees (default: [0, 0, 0, 0]) */
  initialRotations?: [number, number, number, number];
  /** Show loading text below the animation (default: true) */
  showLoadingText?: boolean;
  /** Loading text to display (default: 'Loading') */
  loadingText?: string;
  /** Color of the loading text (default: '#666666') */
  textColor?: string;
}

/**
 * QuadrantRotate - 4-quadrant loader with independent rotation animations
 * 
 * Each quadrant rotates around its center independently:
 * - Rotates 0° → 90° → 180° → 270° → 360° (0°)
 * - Pauses at each 90-degree mark with different durations per quadrant
 * - Starts at different times to create a staggered effect
 * - Repeats continuously
 * 
 * @example
 * ```tsx
 * import { QuadrantRotate } from '@/components/ui/quadrant-rotate';
 * 
 * {loading && <QuadrantRotate size={120} />}
 * ```
 */
export function QuadrantRotate({
  size = 120,
  color = '#2196F3',
  durations = [3800, 4200, 4000, 4400], // [tl, tr, bl, br] - varied speeds for organic movement
  pauseDurations = [400, 500, 450, 550], // [tl, tr, bl, br] - balanced pauses for fluid rhythm
  startDelays = [0, 300, 600, 900], // [tl, tr, bl, br] - clear wave pattern
  initialRotations = [0, 0, 0, 180], // [tl, tr, bl, br] - spread out for immediate visual interest
  showLoadingText = true,
  loadingText = 'Loading',
  textColor = '#666666',
}: QuadrantRotateProps) {
  // Separate rotation angles for each quadrant (0 to 360)
  const rotationTL = useSharedValue(initialRotations[0]); // Top-left
  const rotationTR = useSharedValue(initialRotations[1]); // Top-right
  const rotationBL = useSharedValue(initialRotations[2]); // Bottom-left
  const rotationBR = useSharedValue(initialRotations[3]); // Bottom-right

  // Animated dots progress
  const dotsProgress = useSharedValue(0);

  // Animate dots: cycles through 1, 2, 3 dots
  useEffect(() => {
    dotsProgress.value = withRepeat(
      withTiming(1, {
        duration: 1200, // Cycle through dots every 1.2 seconds
        easing: Easing.linear,
      }),
      -1,
      false // Don't reverse
    );
  }, [dotsProgress]);

  // Helper function to create rotation animation for a quadrant
  const createRotationAnimation = useCallback((
    duration: number,
    pauseDuration: number,
    startDelay: number,
    initialAngle: number
  ) => {
    // Calculate rotation duration per segment (total duration minus all pauses)
    // 4 pauses total (at 90°, 180°, 270°, 360°)
    const totalPauseTime = pauseDuration * 4;
    const totalRotationTime = duration - totalPauseTime;
    const rotateDurationPerSegment = totalRotationTime / 4;

    // Adjust all angles by the initial angle
    const angle90 = initialAngle + 90;
    const angle180 = initialAngle + 180;
    const angle270 = initialAngle + 270;
    const angle360 = initialAngle + 360;

    return withDelay(
      startDelay,
      withRepeat(
        withSequence(
          // Rotate initial → initial + 90°
          withTiming(angle90, {
            duration: rotateDurationPerSegment,
            easing: Easing.inOut(Easing.ease),
          }),
          // Pause at initial + 90°
          withTiming(angle90, {
            duration: pauseDuration,
            easing: Easing.linear,
          }),
          // Rotate initial + 90° → initial + 180°
          withTiming(angle180, {
            duration: rotateDurationPerSegment,
            easing: Easing.inOut(Easing.ease),
          }),
          // Pause at initial + 180°
          withTiming(angle180, {
            duration: pauseDuration,
            easing: Easing.linear,
          }),
          // Rotate initial + 180° → initial + 270°
          withTiming(angle270, {
            duration: rotateDurationPerSegment,
            easing: Easing.inOut(Easing.ease),
          }),
          // Pause at initial + 270°
          withTiming(angle270, {
            duration: pauseDuration,
            easing: Easing.linear,
          }),
          // Rotate initial + 270° → initial + 360°
          withTiming(angle360, {
            duration: rotateDurationPerSegment,
            easing: Easing.inOut(Easing.ease),
          }),
          // Pause at initial + 360° (same as initial)
          withTiming(angle360, {
            duration: pauseDuration,
            easing: Easing.linear,
          })
        ),
        -1, // Infinite loops
        false // Don't reverse
      )
    );
  }, []);

  useEffect(() => {
    // Reset all rotations to initial state
    rotationTL.value = initialRotations[0];
    rotationTR.value = initialRotations[1];
    rotationBL.value = initialRotations[2];
    rotationBR.value = initialRotations[3];

    // Start animations for each quadrant with different durations, pause durations, delays, and initial angles
    rotationTL.value = createRotationAnimation(durations[0], pauseDurations[0], startDelays[0], initialRotations[0]);
    rotationTR.value = createRotationAnimation(durations[1], pauseDurations[1], startDelays[1], initialRotations[1]);
    rotationBL.value = createRotationAnimation(durations[2], pauseDurations[2], startDelays[2], initialRotations[2]);
    rotationBR.value = createRotationAnimation(durations[3], pauseDurations[3], startDelays[3], initialRotations[3]);

    // Cleanup on unmount
    return () => {
      cancelAnimation(rotationTL);
      cancelAnimation(rotationTR);
      cancelAnimation(rotationBL);
      cancelAnimation(rotationBR);
    };
  }, [createRotationAnimation, durations, pauseDurations, startDelays, initialRotations, rotationTL, rotationTR, rotationBL, rotationBR]);

  const half = size / 2;
  const radius = half; // Radius for quarter circle

  // Get SVG path for a quadrant at a specific position (always inward arc)
  const getQuadrantPath = (position: 'tl' | 'tr' | 'bl' | 'br') => {
    switch (position) {
      case 'tl': // Top-left quadrant - quarter circle
        return `M 0,0 L ${radius},0 A ${radius},${radius} 0 0,1 0,${radius} Z`;
      case 'tr': // Top-right quadrant - quarter circle
        return `M ${radius},0 L ${radius},${radius} A ${radius},${radius} 0 0,1 0,0 Z`;
      case 'bl': // Bottom-left quadrant - quarter circle
        return `M 0,${radius} L 0,0 A ${radius},${radius} 0 0,1 ${radius},${radius} Z`;
      case 'br': // Bottom-right quadrant - quarter circle
        return `M ${radius},${radius} L 0,${radius} A ${radius},${radius} 0 0,1 ${radius},0 Z`;
    }
  };

  // Separate rotation animation styles for each quadrant
  const rotationStyleTL = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotationTL.value}deg` }],
    };
  });

  const rotationStyleTR = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotationTR.value}deg` }],
    };
  });

  const rotationStyleBL = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotationBL.value}deg` }],
    };
  });

  const rotationStyleBR = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotationBR.value}deg` }],
    };
  });

  // Animated dots: cycles through 1, 2, 3 dots
  const dotCount = useDerivedValue(() => {
    'worklet';
    const progress = dotsProgress.value;
    // Cycle through 1, 2, 3 dots
    if (progress < 0.33) return 1;
    if (progress < 0.66) return 2;
    return 3;
  });

  const dotsOpacity1 = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: dotCount.value >= 1 ? 1 : 0,
    };
  });

  const dotsOpacity2 = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: dotCount.value >= 2 ? 1 : 0,
    };
  });

  const dotsOpacity3 = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: dotCount.value >= 3 ? 1 : 0,
    };
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
      {/* Top-left quadrant */}
      <Animated.View
        style={[
          styles.quadrantWrapper,
          { top: 0, left: 0, width: half, height: half },
          rotationStyleTL,
        ]}
      >
        <Svg width={half} height={half} viewBox={`0 0 ${half} ${half}`}>
          <Path d={getQuadrantPath('tl')} fill={color} />
        </Svg>
      </Animated.View>

      {/* Top-right quadrant */}
      <Animated.View
        style={[
          styles.quadrantWrapper,
          { top: 0, left: half, width: half, height: half },
          rotationStyleTR,
        ]}
      >
        <Svg width={half} height={half} viewBox={`0 0 ${half} ${half}`}>
          <Path d={getQuadrantPath('tr')} fill={color} />
        </Svg>
      </Animated.View>

      {/* Bottom-left quadrant */}
      <Animated.View
        style={[
          styles.quadrantWrapper,
          { top: half, left: 0, width: half, height: half },
          rotationStyleBL,
        ]}
      >
        <Svg width={half} height={half} viewBox={`0 0 ${half} ${half}`}>
          <Path d={getQuadrantPath('bl')} fill={color} />
        </Svg>
      </Animated.View>

      {/* Bottom-right quadrant */}
      <Animated.View
        style={[
          styles.quadrantWrapper,
          { top: half, left: half, width: half, height: half },
          rotationStyleBR,
        ]}
      >
        <Svg width={half} height={half} viewBox={`0 0 ${half} ${half}`}>
          <Path d={getQuadrantPath('br')} fill={color} />
        </Svg>
      </Animated.View>
      </View>

      {showLoadingText && (
        <View style={styles.loadingTextContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>{loadingText}</Text>
          <Animated.Text style={[styles.dots, dotsOpacity1, { color: textColor }]}>.</Animated.Text>
          <Animated.Text style={[styles.dots, dotsOpacity2, { color: textColor }]}>.</Animated.Text>
          <Animated.Text style={[styles.dots, dotsOpacity3, { color: textColor }]}>.</Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
  },
  quadrantWrapper: {
    position: 'absolute',
    transformOrigin: 'center',
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666666',
  },
  dots: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666666',
    marginLeft: 2,
  },
});
