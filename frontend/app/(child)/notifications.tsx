import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { useAuth } from '@/context/AuthContext';
import { connectionService } from '@/services/connectionService';
import { useChildStoreBase } from '@/store/childStore';
import { ConnectionRequest } from '@/types';
import { LoadingView } from '@/components/shared-states';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const currentChild = useChildStoreBase((s) => s.currentChild);
  const childGreeting =
    currentChild?.name?.split(' ')[0] ||
    (user?.role === 'child' ? user?.displayName?.split(' ')[0] : null) ||
    'පුංචි යාළුවා';

  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!user) return;
    try {
      setIsLoadingRequests(true);
      const list = await connectionService.getPendingRequestsForChild(
        user.uid,
        user.email
      );
      setPendingRequests(list);
    } catch (err) {
      console.warn('[NotificationsScreen] loadRequests error:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.uid]);

  const handleQuickAccept = async (req: ConnectionRequest) => {
    if (!user) return;
    setProcessingId(req.id);
    try {
      await connectionService.acceptConnectionRequest(req, user);
      // Remove from list and navigate to confirmation screen
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      router.push({
        pathname: '/(child)/connect-confirm',
        params: { id: req.id },
      });
    } catch (err) {
      console.warn('[NotificationsScreen] Quick accept error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickDecline = async (reqId: string) => {
    setProcessingId(reqId);
    try {
      await connectionService.declineConnectionRequest(reqId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (err) {
      console.warn('[NotificationsScreen] Quick decline error:', err);
    } finally {
      setProcessingId(null);
    }
  };

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
            මුල් පිටුව
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── PRIORITY SECTION: නව සම්බන්ධතා ඉල්ලීම් (PENDING CONNECTION REQUESTS) ── */}
        {isLoadingRequests ? (
          <LoadingView
            variant="inline"
            message="දැනුම්දීම් පරීක්ෂා කරමින්..."
            style={styles.loadingBox}
          />
        ) : pendingRequests.length > 0 ? (
          <View style={styles.prioritySection}>
            <View style={styles.priorityHeaderRow}>
              <View style={styles.priorityBadge}>
                <AppText size="xs" weight="extrabold" color="#DC2626">
                  අලුත්! ({pendingRequests.length})
                </AppText>
              </View>
              <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                නව සම්බන්ධතා ඉල්ලීම්
              </AppText>
            </View>

            {pendingRequests.map((req) => (
              <View
                key={req.id}
                style={[styles.requestCardHighlight, ThemeShadow.md]}
              >
                <TouchableOpacity
                  style={styles.requestCardContent}
                  onPress={() =>
                    router.push({
                      pathname: '/(child)/connect-confirm',
                      params: { id: req.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.requestAvatarCircle}>
                    <AppText size="lg">
                      {req.senderRole === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}
                    </AppText>
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                        {req.senderName}
                      </AppText>
                      <AppText size="xs" color={ThemeColors.primary} weight="bold">
                        විස්තර →
                      </AppText>
                    </View>

                    <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                      {req.senderRole === 'teacher' ? 'ගුරුතුමා / ගුරුතුමිය' : 'දෙමාපියන්'} ({req.relationship || 'භාරකරු'})
                    </AppText>

                    <AppText size="xs" weight="bold" color="#0369A1" style={{ marginTop: 6, lineHeight: 18 }}>
                      ඔබගේ ඉගෙනුම් ගිණුම සමඟ සම්බන්ධ වීමට ඉල්ලීමක් එවා ඇත.
                    </AppText>
                  </View>
                </TouchableOpacity>

                {/* Direct Action Buttons */}
                <View style={styles.requestActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionConfirmBtn, processingId === req.id && { opacity: 0.7 }]}
                    onPress={() => handleQuickAccept(req)}
                    disabled={processingId === req.id}
                    activeOpacity={0.8}
                  >
                    {processingId === req.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AppText size="xs">✓</AppText>
                        <AppText size="xs" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 6 }}>
                          තහවුරු කර සම්බන්ධ වන්න
                        </AppText>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionDeclineBtn}
                    onPress={() => handleQuickDecline(req.id)}
                    disabled={processingId === req.id}
                    activeOpacity={0.7}
                  >
                    <AppText size="xs" weight="bold" color="#DC2626">
                      ✕ ඉවත් කරන්න
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

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
                {childGreeting}, ඔබට නව කියවීමේ ක්‍රියාකාරකමක් නිර්දේශ කර ඇත.
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
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  prioritySection: {
    gap: ThemeSpacing.sm,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  requestCardHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 2,
    borderColor: ThemeColors.primary,
    gap: 12,
  },
  requestCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requestAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    paddingTop: 10,
  },
  actionConfirmBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDeclineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
