import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import type { RewardBadge } from '@/types';
import { MOCK_REWARD_BADGES, MOCK_CHILD } from '@/mock/data';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
  badges?: RewardBadge[];
}

export default function RewardsModal({
  visible,
  onClose,
  badges = MOCK_REWARD_BADGES,
}: RewardsModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalBox, ThemeShadow.md]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.moduleTag}>
              <View style={[styles.moduleDot, { backgroundColor: ThemeColors.m4 }]} />
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                Adaptive Gamified Rewards Engine
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <AppText size="md" weight="bold" color={ThemeColors.textSecondary}>
                ✕
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.titleWrap}>
            <AppText size="display" style={{ fontSize: 44 }}>
              🏆
            </AppText>
            <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 4 }}>
              Reading Achievements
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              {MOCK_CHILD.name} · {MOCK_CHILD.stars} Total Stars · {MOCK_CHILD.streak} Day Streak 🔥
            </AppText>
          </View>

          {/* Badges Grid */}
          <ScrollView style={styles.badgeList} showsVerticalScrollIndicator={false}>
            {badges.map((badge) => (
              <Card key={badge.id} style={styles.badgeCard}>
                <View style={styles.badgeIconWrap}>
                  <AppText size="xxl">{badge.icon}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeTitleRow}>
                    <AppText size="md" weight="bold" color={ThemeColors.textPrimary}>
                      {badge.title}
                    </AppText>
                    {badge.unlockedAt && (
                      <View style={styles.unlockedTag}>
                        <AppText size="xs" weight="bold" color={ThemeColors.success}>
                          ✓ {badge.unlockedAt}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                    {badge.description}
                  </AppText>
                </View>
              </Card>
            ))}
          </ScrollView>

          {/* Close Action */}
          <Button
            label="Awesome! Keep Reading 🌟"
            onPress={onClose}
            fullWidth
            size="lg"
            style={{ marginTop: ThemeSpacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(51, 48, 46, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.lg,
  },
  modalBox: {
    backgroundColor: ThemeColors.background,
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: ThemeColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.xs,
  },
  moduleDot: {
    width: 8,
    height: 8,
    borderRadius: ThemeRadius.full,
  },
  closeBtn: {
    padding: ThemeSpacing.xs,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  badgeList: {
    maxHeight: 300,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ThemeSpacing.md,
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.xs,
    backgroundColor: ThemeColors.surface,
  },
  badgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: ThemeRadius.full,
    backgroundColor: ThemeColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockedTag: {
    backgroundColor: ThemeColors.successSurface,
    paddingHorizontal: ThemeSpacing.xs + 2,
    paddingVertical: 1,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.successBorder,
  },
});
