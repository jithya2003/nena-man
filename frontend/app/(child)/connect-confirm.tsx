import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { ConnectionRequest } from '@/types';

export default function ConnectConfirmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<ConnectionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<'accepted' | 'declined' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadRequest() {
      if (!user) return;
      try {
        setIsLoading(true);
        const pending = await connectionService.getPendingRequestsForChild(
          user.uid,
          user.email
        );
        if (id) {
          const found = pending.find((r) => r.id === id);
          if (found) {
            setRequest(found);
          } else {
            // Check if first pending
            setRequest(pending[0] || null);
          }
        } else if (pending.length > 0) {
          setRequest(pending[0]);
        }
      } catch (err) {
        console.warn('[ConnectConfirm] loadRequest error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequest();
  }, [id, user]);

  const handleAccept = async () => {
    if (!request || !user) return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await connectionService.acceptConnectionRequest(request, user);
      setActionDone('accepted');
    } catch (err: any) {
      setErrorMessage(err.message || 'සම්බන්ධ වීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!request) return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await connectionService.declineConnectionRequest(request.id);
      setActionDone('declined');
    } catch (err: any) {
      setErrorMessage(err.message || 'ඉල්ලීම ප්‍රතික්ෂේප කිරීම අසාර්ථක විය.');
    } finally {
      setIsProcessing(false);
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
          <AppText size="sm">🤝</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            සම්බන්ධතාවය තහවුරු කිරීම
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
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ThemeColors.primary} />
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 12 }}>
              තොරතුරු පූරණය වෙමින් පවතී...
            </AppText>
          </View>
        ) : actionDone === 'accepted' ? (
          /* Celebration View */
          <View style={[styles.successCard, ThemeShadow.md]}>
            <View style={styles.celebrationIconCircle}>
              <AppText size="xxl">🎉</AppText>
            </View>
            <AppText size="lg" weight="extrabold" color="#047857" style={{ marginTop: 14 }}>
              සාර්ථකව සම්බන්ධ විය!
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              දැන් <AppText size="xs" weight="bold">{request?.senderName}</AppText> ඔබගේ ඉගෙනුම් ගිණුමට සම්බන්ධ කර ඇත.{'\n'}
              ඔබගේ දෙමාපියන්ට හෝ ගුරුතුමාට ඔබගේ ප්‍රගතිය නිරීක්ෂණය කර සහාය විය හැක.
            </AppText>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/(child)/home')}
              activeOpacity={0.8}
            >
              <AppText size="sm" weight="extrabold" color="#FFFFFF">
                ඉගෙනුම ආරම්භ කරමු 🚀
              </AppText>
            </TouchableOpacity>
          </View>
        ) : actionDone === 'declined' ? (
          /* Declined View */
          <View style={[styles.card, ThemeShadow.sm]}>
            <View style={[styles.celebrationIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AppText size="xxl">✕</AppText>
            </View>
            <AppText size="md" weight="extrabold" color="#DC2626" style={{ marginTop: 14 }}>
              ඉල්ලීම ප්‍රතික්ෂේප කරන ලදී
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
              මෙම සම්බන්ධතා ඉල්ලීම ඉවත් කරන ලදී.
            </AppText>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: ThemeColors.textSecondary }]}
              onPress={() => router.replace('/(child)/notifications')}
              activeOpacity={0.8}
            >
              <AppText size="sm" weight="bold" color="#FFFFFF">
                දැනුම්දීම් වෙත ආපසු යන්න
              </AppText>
            </TouchableOpacity>
          </View>
        ) : !request ? (
          /* No Request Found */
          <View style={[styles.card, ThemeShadow.sm]}>
            <AppText size="xxl">📭</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 12 }}>
              සම්බන්ධතා ඉල්ලීම් කිසිවක් නැත
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', marginTop: 6 }}>
              ඔබට ලැබී ඇති නව සම්බන්ධතා ඉල්ලීම් මෙහි නොමැත.
            </AppText>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: ThemeColors.primary }]}
              onPress={() => router.replace('/(child)/home')}
              activeOpacity={0.8}
            >
              <AppText size="sm" weight="bold" color="#FFFFFF">
                මුල් පිටුවට යන්න
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          /* Request Details & Confirmation */
          <View style={{ gap: ThemeSpacing.md }}>
            {/* Person Card */}
            <View style={[styles.profileRequestCard, ThemeShadow.sm]}>
              <View style={styles.avatarBigCircle}>
                <AppText size="xl">
                  {request.senderRole === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}
                </AppText>
              </View>

              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 10 }}>
                {request.senderName}
              </AppText>

              <View style={styles.roleBadge}>
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  {request.senderRole === 'teacher' ? '👩‍🏫 ගුරුතුමා / ගුරුතුමිය' : '👨‍👩‍👧 දෙමාපියන්'} · {request.relationship}
                </AppText>
              </View>

              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 6 }}>
                ✉️ {request.senderEmail}
              </AppText>
            </View>

            {/* Permissions / Transparency Box */}
            <View style={styles.permissionBox}>
              <AppText size="xs" weight="extrabold" color="#0369A1" style={{ marginBottom: 6 }}>
                🛡️ සම්බන්ධ වූ පසු ඔවුන්ට හැකි වන්නේ:
              </AppText>

              <View style={styles.benefitRow}>
                <AppText size="xs" color="#047857" weight="bold">✓</AppText>
                <AppText size="xs" color="#0C4A6E" style={{ marginLeft: 6, flex: 1, lineHeight: 18 }}>
                  ඔබ කියවීමේ අභ්‍යාස සම්පූර්ණ කරන විට ප්‍රගතිය සහ තරු ලකුණු බලාගැනීම.
                </AppText>
              </View>

              <View style={styles.benefitRow}>
                <AppText size="xs" color="#047857" weight="bold">✓</AppText>
                <AppText size="xs" color="#0C4A6E" style={{ marginLeft: 6, flex: 1, lineHeight: 18 }}>
                  ඔබට අපහසු අකුරු සහ වචන සඳහා විශේෂ සහාය ලබාදීම.
                </AppText>
              </View>

              <View style={styles.benefitRow}>
                <AppText size="xs" color="#047857" weight="bold">✓</AppText>
                <AppText size="xs" color="#0C4A6E" style={{ marginLeft: 6, flex: 1, lineHeight: 18 }}>
                  ඉහළ බොත්තම මඟින් ගිණුම් දෙක අතර පහසුවෙන් මාරුවීමට ඉඩ ලබාදීම.
                </AppText>
              </View>
            </View>

            {/* Error Message */}
            {!!errorMessage && (
              <View style={styles.errorBox}>
                <AppText size="xs" color="#DC2626" weight="bold">
                  ⚠️ {errorMessage}
                </AppText>
              </View>
            )}

            {/* Big Action Buttons */}
            <View style={{ gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.confirmBtn, isProcessing && { opacity: 0.7 }]}
                onPress={handleAccept}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppText size="md">✓</AppText>
                    <AppText size="md" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 8 }}>
                      තහවුරු කර සම්බන්ධ වන්න
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.declineBtn, isProcessing && { opacity: 0.7 }]}
                onPress={handleDecline}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="bold" color="#DC2626">
                  ✕ ප්‍රතික්ෂේප කරන්න (Decline)
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingTop: ThemeSpacing.lg,
    paddingBottom: ThemeSpacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  profileRequestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  avatarBigCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  permissionBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confirmBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  celebrationIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
  },
});
