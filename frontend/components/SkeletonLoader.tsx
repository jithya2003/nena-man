import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  Easing,
} from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { ThemeRadius, ThemeSpacing } from '@/constants/theme';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';

// ─────────────────────────────────────────────────────────────────────────────
// 🐛 Cute Reading Worm — Dyslexia-friendly gentle cartoon character
// Very slow, calming animations — no flashing, no sudden movements
// ─────────────────────────────────────────────────────────────────────────────

function CuteReadingWorm() {
  const { t } = useLanguage();
  const bobAnim = useRef(new Animated.Value(0)).current;
  const blinkScaleY = useRef(new Animated.Value(1)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const sparklePulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const blink = Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(blinkScaleY, {
          toValue: 0.05,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(blinkScaleY, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ])
    );

    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const sparkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(sparklePulse, {
          toValue: 0.3,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    bob.start();
    blink.start();
    sway.start();
    sparkle.start();

    return () => {
      bob.stop();
      blink.stop();
      sway.stop();
      sparkle.stop();
    };
  }, [bobAnim, blinkScaleY, swayAnim, sparklePulse]);

  return (
    <View style={wormStyles.wrapper}>
      {/* Floating sparkles */}
      <Animated.View style={[wormStyles.sparkleTopLeft, { opacity: sparklePulse }]}>
        <AppText size="sm">✨</AppText>
      </Animated.View>
      <Animated.View style={[wormStyles.sparkleTopRight, { opacity: sparklePulse }]}>
        <AppText size="xs">⭐</AppText>
      </Animated.View>

      {/* Worm body + head */}
      <Animated.View style={[wormStyles.wormRow, { transform: [{ translateY: bobAnim }] }]}>
        <Svg width={148} height={108} viewBox="0 0 148 108">
          {/* Body segments */}
          <Ellipse cx={24} cy={74} rx={17} ry={15} fill="#BBFABB" />
          <Ellipse cx={24} cy={74} rx={13} ry={11} fill="#D4F7D4" />
          <Ellipse cx={48} cy={69} rx={18} ry={16} fill="#A3F0A3" />
          <Ellipse cx={48} cy={69} rx={14} ry={12} fill="#C8F5C8" />
          <Ellipse cx={73} cy={65} rx={19} ry={17} fill="#8FE88F" />
          <Ellipse cx={73} cy={65} rx={15} ry={13} fill="#BFEFBF" />
          <Ellipse cx={98} cy={62} rx={18} ry={16} fill="#A3F0A3" />
          <Ellipse cx={98} cy={62} rx={14} ry={12} fill="#C8F5C8" />

          {/* Head */}
          <Circle cx={118} cy={48} r={23} fill="#5DD35D" />
          <Circle cx={118} cy={48} r={19} fill="#7DE87D" />

          {/* Cheek blush */}
          <Ellipse cx={109} cy={57} rx={5} ry={3} fill="#FF9999" opacity={0.45} />
          <Ellipse cx={127} cy={57} rx={5} ry={3} fill="#FF9999" opacity={0.45} />

          {/* Eye whites */}
          <Circle cx={111} cy={44} r={5.5} fill="white" />
          <Circle cx={125} cy={44} r={5.5} fill="white" />

          {/* Smile */}
          <Path
            d="M 111 55 Q 118 62 125 55"
            stroke="#2D5A27"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />

          {/* Antennae */}
          <Path d="M 111 28 Q 106 18 102 11" stroke="#5DD35D" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          <Circle cx={102} cy={10} r={4.5} fill="#FFD93D" />
          <Path d="M 125 27 Q 130 17 134 11" stroke="#5DD35D" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          <Circle cx={134} cy={10} r={4.5} fill="#FFB3D1" />

          {/* Legs */}
          <Path d="M 34 86 Q 36 96 32 100" stroke="#5DD35D" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 50 84 Q 52 94 48 98" stroke="#5DD35D" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 66 80 Q 68 90 64 94" stroke="#5DD35D" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 82 77 Q 84 87 80 91" stroke="#5DD35D" strokeWidth={3} strokeLinecap="round" fill="none" />
        </Svg>

        {/* Animated eye pupils (blink) */}
        <Animated.View style={[wormStyles.leftPupil, { transform: [{ scaleY: blinkScaleY }] }]} />
        <Animated.View style={[wormStyles.rightPupil, { transform: [{ scaleY: blinkScaleY }] }]} />
      </Animated.View>

      {/* Book — gentle sway */}
      <Animated.View
        style={[
          wormStyles.bookWrap,
          {
            transform: [
              {
                rotate: swayAnim.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-4deg', '4deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={56} height={46} viewBox="0 0 56 46">
          <Rect x={1} y={3} width={54} height={40} rx={7} fill="#FF9F43" />
          <Rect x={4} y={6} width={48} height={34} rx={5} fill="#FFF9F0" />
          <Rect x={25} y={6} width={6} height={34} rx={3} fill="#FFD4A0" />
          <Rect x={7} y={13} width={15} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={7} y={18} width={12} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={7} y={23} width={15} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={7} y={28} width={10} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={34} y={13} width={15} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={34} y={18} width={12} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={34} y={23} width={15} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={34} y={28} width={10} height={2.5} rx={1.2} fill="#CBD5E1" />
          <Rect x={46} y={0} width={5} height={18} rx={2.5} fill="#FF6B9D" />
          <Path d="M 46 16 L 48.5 21 L 51 16" fill="#FF6B9D" />
        </Svg>
      </Animated.View>

      <AppText size="xs" weight="bold" color="#2D6B27" align="center" style={wormStyles.caption}>
        {t('state.skeleton.caption')}
      </AppText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Base skeleton pulse block
// ─────────────────────────────────────────────────────────────────────────────

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = ThemeRadius.sm,
  style,
  color = '#E2ECE6',
}: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: color,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  spacing = ThemeSpacing.sm,
  lastLineWidth = '60%',
  showCharacter = false,
  style,
}: {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: number | string;
  showCharacter?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.textContainer, style]}>
      {showCharacter && <CuteReadingWorm />}
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        return (
          <SkeletonLoader
            key={index}
            height={lineHeight}
            width={isLast && lines > 1 ? lastLineWidth : '100%'}
            borderRadius={ThemeRadius.full}
            color="#D1E7DD"
            style={index > 0 ? { marginTop: spacing } : undefined}
          />
        );
      })}
    </View>
  );
}

export function SkeletonCard({
  height = 140,
  showCharacter = false,
  style,
}: {
  height?: number;
  showCharacter?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cardContainer, style]}>
      {showCharacter && <CuteReadingWorm />}
      <View style={styles.cardHeader}>
        <View style={styles.iconCirclePlaceholder}>
          <SkeletonLoader width={48} height={48} borderRadius={24} color="#A7F3D0" />
        </View>
        <View style={styles.cardHeaderRight}>
          <SkeletonLoader width="65%" height={18} borderRadius={ThemeRadius.full} color="#CBD5E1" />
          <SkeletonLoader
            width="35%"
            height={12}
            borderRadius={ThemeRadius.full}
            color="#E2E8F0"
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
      <SkeletonLoader
        width="100%"
        height={height - 70}
        borderRadius={16}
        color="#F1F5F9"
        style={{ marginTop: 14 }}
      />
    </View>
  );
}

export function SkeletonAvatar({
  size = 48,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SkeletonLoader width={size} height={size} borderRadius={size / 2} color="#BAE6FD" style={style} />
  );
}

export function SkeletonListItem({
  showCharacter = false,
  style,
}: {
  showCharacter?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {showCharacter && <CuteReadingWorm />}
      <View style={styles.listItem}>
        <SkeletonAvatar size={48} />
        <View style={styles.listItemContent}>
          <SkeletonLoader width="75%" height={16} borderRadius={ThemeRadius.full} color="#CBD5E1" />
          <SkeletonLoader
            width="45%"
            height={12}
            borderRadius={ThemeRadius.full}
            color="#E2E8F0"
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </View>
  );
}

// Full-page skeleton with worm
export function SkeletonPage() {
  return (
    <View style={styles.pageContainer}>
      <CuteReadingWorm />
      <SkeletonCard height={150} style={{ marginTop: 8 }} />
      <SkeletonText lines={4} style={{ marginTop: 16 }} />
      <SkeletonListItem style={{ marginTop: 16 }} />
      <SkeletonListItem style={{ marginTop: 10 }} />
    </View>
  );
}

SkeletonLoader.Text = SkeletonText;
SkeletonLoader.Card = SkeletonCard;
SkeletonLoader.Avatar = SkeletonAvatar;
SkeletonLoader.ListItem = SkeletonListItem;
SkeletonLoader.Page = SkeletonPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  skeletonBase: { overflow: 'hidden' },
  textContainer: {
    width: '100%',
    padding: ThemeSpacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    borderWidth: 2,
    borderColor: '#D1E7DD',
    borderBottomWidth: 4,
    borderBottomColor: '#A3D1BE',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCirclePlaceholder: {
    shadowColor: '#059669',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeaderRight: { marginLeft: 14, flex: 1 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 3,
    borderBottomColor: '#D1E0D7',
  },
  listItemContent: { marginLeft: 14, flex: 1 },
  pageContainer: {
    padding: ThemeSpacing.lg,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
});

const wormStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  wormRow: {
    alignItems: 'center',
    position: 'relative',
  },
  bookWrap: {
    marginTop: -20,
    marginLeft: 68,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 6,
    left: 16,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 12,
    right: 20,
  },
  caption: {
    marginTop: 4,
    letterSpacing: 0.3,
  },
  leftPupil: {
    position: 'absolute',
    top: 38,
    left: 57,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D5A27',
  },
  rightPupil: {
    position: 'absolute',
    top: 38,
    left: 71,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D5A27',
  },
});


