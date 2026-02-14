import { useResponsive } from '@/hooks/ui/use-responsive';

export interface LayoutSizes {
  cardHeaderPadding: number;
  screenHeaderPadding: number;
  taskTitleSize: number;
  taskDescSize: number;
  headerTitleSize: number;
  listPadding: number;
  fabSize: number;
  fabIconSize: number;
  fabPosition: {
    right: number;
    bottom: number;
  };
}

export function getLayoutSizes(
  responsive: ReturnType<typeof useResponsive>
): LayoutSizes {
  const cardHeaderPadding = responsive.isMobile
    ? 16
    : responsive.isTablet
      ? 20
      : 24;
  const screenHeaderPadding = responsive.isMobile
    ? 20
    : responsive.isTablet
      ? 24
      : 32;
  const taskTitleSize = responsive.isMobile
    ? 18
    : responsive.isTablet
      ? 20
      : 22;
  const taskDescSize = responsive.isMobile ? 14 : responsive.isTablet ? 15 : 16;
  const headerTitleSize = responsive.isMobile
    ? 24
    : responsive.isTablet
      ? 26
      : 28;
  const listPadding = responsive.isMobile ? 16 : responsive.isTablet ? 24 : 32;
  const fabSize = responsive.isMobile ? 60 : responsive.isTablet ? 64 : 68;
  const fabIconSize = responsive.isMobile ? 32 : responsive.isTablet ? 34 : 36;
  const fabPosition = {
    right: responsive.isDesktop ? 32 : 20,
    bottom: responsive.isDesktop ? 40 : 30,
  };
  return {
    cardHeaderPadding,
    screenHeaderPadding,
    taskTitleSize,
    taskDescSize,
    headerTitleSize,
    listPadding,
    fabSize,
    fabIconSize,
    fabPosition,
  };
}
