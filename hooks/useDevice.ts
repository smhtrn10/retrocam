import { useWindowDimensions } from 'react-native';

export type DeviceType = 'phone' | 'tablet';

export function useDevice() {
  const { width, height } = useWindowDimensions();
  
  // Basic tablet detection: if shortest side is >= 600dp (standard Android/iOS breakpoint)
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= 600;
  
  const isLandscape = width > height;
  
  // Scaling factors for UI elements (icons, padding, etc.)
  const scale = isTablet ? 1.5 : 1;
  const isSmallPhone = width < 375;
  const fontScale = isSmallPhone ? 0.9 : (isTablet ? 1.4 : 1);

  return {
    width,
    height,
    isTablet,
    isLandscape,
    scale,
    fontScale,
    deviceType: isTablet ? 'tablet' : 'phone' as DeviceType,
  };
}
