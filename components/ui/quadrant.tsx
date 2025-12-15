import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface QuadrantProps {
  /** Size of the quadrant container in pixels */
  size: number;
  /** Position of the quadrant: 'tl' (top-left), 'tr' (top-right), 'bl' (bottom-left), 'br' (bottom-right) */
  position: 'tl' | 'tr' | 'bl' | 'br';
  /** Color of the quadrant (default: '#2196F3' - blue) */
  color?: string;
}

/**
 * Quadrant - A single quadrant component (1/4 circle)
 * 
 * Renders one quarter circle in a square container.
 * Can be used to build up a full 4-quadrant loader animation.
 * 
 * @example
 * ```tsx
 * import { Quadrant } from '@/components/ui/quadrant';
 * 
 * <Quadrant size={100} position="tl" color="#2196F3" />
 * ```
 */
export function Quadrant({
  size,
  position,
  color = '#2196F3',
}: QuadrantProps) {

  const getPath = () => {
    const radius = size; // Radius for quarter circle arc
    
    switch (position) {
      case 'tl': // Top-left quadrant - quarter circle
        // Quarter circle centered at top-left corner (0,0)
        // Arc from (size,0) to (0,size)
        return `M 0,0 L ${size},0 A ${radius},${radius} 0 0,1 0,${size} Z`;
      case 'tr': // Top-right quadrant - quarter circle
        // Quarter circle centered at top-right corner (size,0)
        // Arc from (size,size) to (0,0)
        return `M ${size},0 L ${size},${size} A ${radius},${radius} 0 0,1 0,0 Z`;
      case 'bl': // Bottom-left quadrant - quarter circle
        // Quarter circle centered at bottom-left corner (0,size)
        // Arc from (0,0) to (size,size)
        return `M 0,${size} L 0,0 A ${radius},${radius} 0 0,1 ${size},${size} Z`;
      case 'br': // Bottom-right quadrant - quarter circle
        // Quarter circle centered at bottom-right corner (size,size)
        // Arc from (0,size) to (size,0)
        return `M ${size},${size} L 0,${size} A ${radius},${radius} 0 0,1 ${size},0 Z`;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Path d={getPath()} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

