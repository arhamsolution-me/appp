import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Reference dimensions based on a standard mobile design (iPhone X/11/12/13/14 format)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale dimension horizontally (for width, marginHorizontal, paddingHorizontal, etc.)
 */
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Scale dimension vertically (for height, marginVertical, paddingVertical, etc.)
 */
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Moderate scale: Scales dimension with a factor to prevent extreme blowing up on tablets
 * Best for fontSizes, borderRadii
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Get device screen properties
 */
export const windowWidth = width;
export const windowHeight = height;
export const isSmallDevice = width < 375;

/**
 * Scale font size based on device pixel ratio
 */
export const scaleFont = (size: number) => size * PixelRatio.getFontScale();
