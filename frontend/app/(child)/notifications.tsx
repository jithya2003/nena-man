import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navIconBtn}
          activeOpacity={0.7}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M 20 11 L 7.83 11 L 13.42 5.41 L 12 4 L 4 12 L 12 20 L 13.41 18.59 L 7.83 13 L 20 13 Z"
              fill={ThemeColors.textPrimary}
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <AppText size="md">🔔</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            දැනුම්දීම්
          </AppText>
        </View>

        <TouchableOpacity onPress={() => router.push('/(child)/home')} activeOpacity={0.7}>
          <AppText size="xs" weight="bold" color={ThemeColors.primary}>
            Finish
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── SECTION 1: අද (Today) ── */}
        <View style={styles.sectionWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionDateHeading}>
            අද
          </AppText>

          {/* Notification 1 */}
          <TouchableOpacity
            style={[styles.notifCard, styles.notifCardFeatured, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/adaptive')}
            activeOpacity={0.8}
          >
            <View style={styles.notifIconCircle}>
              <AppText size="md">🎯</AppText>
            </View>

            <View style={{ flex: 1 }}>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                සෙනුලි, ඔබට නව ක්‍රියාකාරකමක් නිර්දේශ කර ඇත.
              </AppText>
              <View style={styles.newBadgePill}>
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  නව
                </AppText>
              </View>
            </View>
          </TouchableOpacity>

          {/* Notification 2 */}
          <TouchableOpacity
            style={[styles.notifCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/cooldown')}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <AppText size="md">🌿</AppText>
            </View>

            <View style={{ flex: 1 }}>
              <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                විවේකයක් ගැනීමට කාලයයි. කැමති ක්‍රීඩාවක් තෝරන්න.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: ඊයේ (Yesterday) ── */}
        <View style={styles.sectionWrap}>
          <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionDateHeading}>
            ඊයේ
          </AppText>

          {/* Notification 3 */}
          <TouchableOpacity
            style={[styles.notifCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/progress')}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <AppText size="md">⭐</AppText>
            </View>

            <View style={{ flex: 1 }}>
              <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                ඔබ දින 5ක අඛණ්ඩ ඉගෙනුම් ගමනක් සම්පූර්ණ කළා!
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Notification 4 */}
          <TouchableOpacity
            style={[styles.notifCard, ThemeShadow.sm]}
            onPress={() => router.push('/(child)/progress')}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <AppText size="md">📊</AppText>
            </View>

            <View style={{ flex: 1 }}>
              <AppText size="xs" color={ThemeColors.textPrimary} style={{ lineHeight: 18 }}>
                ඔබේ ප්‍රගතිය 5%කින් වැඩි වී ඇත.
              </AppText>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.lg,
  },
  sectionWrap: {
    gap: ThemeSpacing.sm,
  },
  sectionDateHeading: {
    marginBottom: 2,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    gap: 12,
  },
  notifCardFeatured: {
    backgroundColor: '#EAF7EE',
    borderLeftWidth: 4,
    borderLeftColor: ThemeColors.primary,
    borderColor: '#C7EBD2',
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
    marginTop: 6,
  },
});
