import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import {
  ThemeColors,
  ThemeRadius,
  ThemeSpacing,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import { useIsOnline } from '@/store/hooks';
import { useLanguage } from '@/context/LanguageContext';

export interface OfflineBannerProps {
  message?: string;
  forceShow?: boolean;
  floating?: boolean;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wifi Off SVG Icon
 */
function WifiOffIcon({ size = 20, color = '#92400E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M 1 1 L 23 23"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M 16.72 11.06 C 18.28 11.96 19.5 13.25 20.3 14.77 M 5 12.55 C 6.54 11.33 8.45 10.5 10.5 10.22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M 8.5 16.5 C 9.5 15.6 10.7 15.1 12 15.1 C 13.3 15.1 14.5 15.6 15.5 16.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="20" r="1.5" fill={color} />
    </Svg>
  );
}

export default function OfflineBanner({
  message,
  forceShow = false,
  floating = false,
  onRetry,
  style,
}: OfflineBannerProps) {
  const { t } = useLanguage();
  const displayMessage = message ?? t('state.offline.message');
  const isOnline = useIsOnline();
  const shouldShow = forceShow || !isOnline;

  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow, translateY, opacity]);

  if (!shouldShow && !forceShow) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        floating ? styles.floating : styles.docked,
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconBox}>
          <WifiOffIcon size={20} color="#B45309" />
        </View>

        <AppText
          size="xs"
          weight="bold"
          color="#92400E"
          style={styles.text}
        >
          {displayMessage}
        </AppText>

        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            activeOpacity={0.7}
            style={styles.retryPill}
          >
            <AppText size="xs" weight="bold" color="#B45309">
              {t('state.offline.retry')}
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FEF3C7', // Warm amber / honey surface
    borderBottomWidth: 2,
    borderBottomColor: '#FCD34D',
    zIndex: 9999,
  },
  docked: {
    width: '100%',
    paddingVertical: ThemeSpacing.xs + 2,
    paddingHorizontal: ThemeSpacing.md,
  },
  floating: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 44,
    left: 16,
    right: 16,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    ...ThemeShadow.md,
    paddingVertical: ThemeSpacing.xs + 4,
    paddingHorizontal: ThemeSpacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
  retryPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
});
