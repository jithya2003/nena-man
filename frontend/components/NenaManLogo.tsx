import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, G, Rect } from 'react-native-svg';
import AppText from './AppText';
import { ThemeColors } from '@/constants/theme';

interface NenaManLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  color?: string;
  style?: ViewStyle;
  layout?: 'row' | 'column'; // NEW: column puts text below icon
}

export default function NenaManLogo({
  size = 'md',
  showText = true,
  color = ThemeColors.primary,
  style,
  layout = 'row',
}: NenaManLogoProps) {
  const iconDimensions = {
    sm: { width: 36, height: 26, fontSize: 'sm' as const, gap: 6 },
    md: { width: 48, height: 34, fontSize: 'lg' as const, gap: 8 },
    lg: { width: 72, height: 50, fontSize: 'xxl' as const, gap: 12 },
    xl: { width: 96, height: 68, fontSize: 'xxxl' as const, gap: 16 },
  }[size];

  return (
    <View
      style={[
        layout === 'column' ? styles.containerColumn : styles.container,
        { gap: iconDimensions.gap },
        style,
      ]}
    >
      {/* SVG Icon of Book + Winding Path + Leaf Sprout */}
      <Svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 100 70"
        fill="none"
      >
        <G stroke={color} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Left page outline */}
          <Path d="M 12 18 C 24 13 38 18 48 24 L 48 58 C 38 52 24 48 12 52 Z" />
          
          {/* Left inner page lines */}
          <Path d="M 19 23 L 19 47" strokeWidth="4.5" />
          
          {/* Right top page corner */}
          <Path d="M 48 24 C 56 19 68 15 78 18 L 78 30" />
          
          {/* Right bottom page corner */}
          <Path d="M 78 44 L 78 52 C 68 49 56 52 48 58" />

          {/* Winding Path emerging from center spine */}
          <Path
            d="M 48 40 C 58 40, 56 32, 68 31 C 76 30, 84 27, 88 18"
            strokeWidth="5"
          />
          <Path
            d="M 48 48 C 62 48, 60 40, 72 38 C 78 37, 80 43, 76 49"
            strokeWidth="4.5"
          />

          {/* Leaf sprout at top right of the path */}
          <Path
            d="M 88 18 C 96 14 96 25 89 28 C 84 26 83 20 88 18 Z"
            fill={color}
            stroke="none"
          />
          <Path
            d="M 88 19 L 91 24"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Sinhala Branding Text */}
      {showText && (
        <AppText
          size={iconDimensions.fontSize}
          weight="extrabold"
          color={color}
          style={layout === 'column' ? styles.logoTextCenter : styles.logoText}
          align={layout === 'column' ? 'center' : undefined}
        >
          නැණ මං
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoText: {
    letterSpacing: 0.5,
  },
  logoTextCenter: {
    letterSpacing: 1,
    marginTop: 2,
  },
});
