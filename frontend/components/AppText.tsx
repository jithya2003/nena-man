import React, { useEffect } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
  StyleProp,
  StyleSheet,
  Platform,
} from 'react-native';
import { ThemeColors, ThemeFontSize, ThemeFontWeight } from '@/constants/theme';
import { useDyslexiaTheme } from '@/context/ThemeContext';

export type TextSize = keyof typeof ThemeFontSize | number;
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export interface AppTextProps extends RNTextProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

// Sinhala Unicode range: U+0D80 to U+0DFF
const SINHALA_REGEX = /[\u0D80-\u0DFF]/;

// Ensure Dyslexia-Friendly Fonts (OpenDyslexic, Lexend & Noto Sans Sinhala) are loaded in the browser
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // 1. Google Fonts: Lexend & Noto Sans Sinhala
  const googleFontId = 'google-dyslexia-fonts';
  if (!document.getElementById(googleFontId)) {
    const link = document.createElement('link');
    link.id = googleFontId;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  // 2. OpenDyslexic Official Web Font
  const openDyslexicId = 'opendyslexic-web-font';
  if (!document.getElementById(openDyslexicId)) {
    const link2 = document.createElement('link');
    link2.id = openDyslexicId;
    link2.rel = 'stylesheet';
    link2.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
    document.head.appendChild(link2);
  }
}

function extractStringFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return children.toString();
  if (Array.isArray(children)) {
    return children.map(extractStringFromChildren).join('');
  }
  if (React.isValidElement(children) && children.props && (children.props as any).children) {
    return extractStringFromChildren((children.props as any).children);
  }
  return '';
}

export default function AppText({
  size = 'md',
  weight = 'regular',
  color = ThemeColors.textPrimary,
  align = 'left',
  children,
  style,
  ...rest
}: AppTextProps) {
  const { getScaledFontSize, getLineHeight, getLetterSpacing, fontPreference } = useDyslexiaTheme();

  // 1. Resolve raw base font size
  const rawBaseSize: number = typeof size === 'number'
    ? size
    : ThemeFontSize[size] ?? ThemeFontSize.md;

  // 2. Compute dyslexia-scaled font size, line height, and letter spacing
  const fontSize = getScaledFontSize(rawBaseSize);
  const lineHeight = getLineHeight(fontSize);
  const letterSpacing = getLetterSpacing();

  // 3. Detect script (Sinhala vs Latin/English)
  const fullText = extractStringFromChildren(children);
  const isSinhala = SINHALA_REGEX.test(fullText);

  // 4. Map font family according to platform, script, and font preference
  const isWeb = Platform.OS === 'web';

  const latinFont = fontPreference === 'opendyslexic'
    ? '"OpenDyslexic", "OpenDyslexic3", "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    : '"Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const sinhalaFont = '"Noto Sans Sinhala", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const fontFamily = isWeb
    ? isSinhala
      ? sinhalaFont
      : latinFont
    : isSinhala
    ? 'NotoSansSinhala'
    : fontPreference === 'opendyslexic'
    ? 'OpenDyslexic'
    : 'Lexend';

  // 5. Flatten custom styles & strip forbidden dyslexia anti-patterns:
  //    - No italic styling (increases visual letter crowding)
  //    - No uppercase transforms (erases word shape outlines)
  //    - No justified text (causes irregular rivering/spacing)
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {
    fontStyle: _forbiddenItalic,
    textTransform: _forbiddenTransform,
    textAlign: customAlign,
    ...safeCustomStyle
  } = flattenedStyle;

  const resolvedAlign = customAlign === 'justify' ? 'left' : (customAlign || align);

  const combinedStyle: TextStyle = {
    color,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign: resolvedAlign,
    fontFamily,
    fontWeight: ThemeFontWeight[weight],
    ...safeCustomStyle,
  };

  return (
    <RNText style={combinedStyle} {...rest}>
      {children}
    </RNText>
  );
}
