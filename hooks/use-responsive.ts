import { useWindowDimensions } from 'react-native';
import { MOBILE_MAX, TABLET_MAX, ScreenSize } from '@/constants/breakpoints';

interface UseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  screenSize: ScreenSize;
}

/**
 * Hook to determine responsive breakpoints based on window dimensions.
 * Automatically updates when window size changes (especially useful for web).
 * 
 * Breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 */
export function useResponsive(): UseResponsiveReturn {
  const { width, height } = useWindowDimensions();

  const isMobile = width <= MOBILE_MAX;
  const isTablet = width > MOBILE_MAX && width <= TABLET_MAX;
  const isDesktop = width > TABLET_MAX;

  let screenSize: ScreenSize = 'mobile';
  if (isDesktop) {
    screenSize = 'desktop';
  } else if (isTablet) {
    screenSize = 'tablet';
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    screenSize,
  };
}


