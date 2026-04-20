import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design baseline: iPhone 14 (390 x 844)
const BASE_WIDTH = 390;

// Scale factor based on screen width — clamps to avoid extremes on tablets or tiny phones
const scale = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, 0.85), 1.25);

// Normalize a size value using the scale factor and round to nearest pixel
const normalize = (size) => Math.round(PixelRatio.roundToNearestPixel(size * scale));

export const colors = {
  // Primary — safe blue, unchanged across all CVD types
  bluePrimary: '#3B7DD8',
  blueLight: '#E3EEFB',
  blueDark: '#1B5FAD',

  // Success — teal (blue-green), clearly distinct from blue and warm colors
  greenPrimary: '#0EA5A0',
  greenLight: '#CCEFEE',

  // Accents — colorblind-safe warm palette
  orangePrimary: '#E8A317',   // amber-gold, distinct from vermillion
  orangeLight: '#FFF4D9',
  purplePrimary: '#8B5FC7',   // blue-purple, safe for all CVD types
  purpleLight: '#EDE4F7',
  redPrimary: '#D94726',      // vermillion, clearly distinct from teal
  redLight: '#FCDDD5',

  // Neutrals
  white: '#FFFFFF',
  bgPrimary: '#F8F9FC',
  bgSecondary: '#F1F3F8',
  bgCard: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F0F0F0',

  // Text
  textPrimary: '#1A1D26',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
};

export const spacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
};

export const borderRadius = {
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(20),
  full: 9999,
};

export const fontSize = {
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  lg: normalize(17),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

// Export helpers for screens that need custom responsive sizes
export { normalize, scale, SCREEN_WIDTH, SCREEN_HEIGHT };
