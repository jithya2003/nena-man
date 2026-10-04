import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { ConnectionRequest } from '@/types';
import { LoadingView, EmptyView } from '@/components/shared-states';

export default function ConnectStudentScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState<'email' | 'code'>('email');
  const [identifier, setIdentifier] = useState('');
  const [relationship, setRelationship] = useState(
    user?.role === 'teacher' ? 'පන්ති භාර ගුරුතුමා' : 'මව'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const relationshipOptions =
    user?.role === 'teacher'
      ? ['පන්ති භාර ගුරුතුමා/ගුරුතුමිය', 'විෂය භාර ගුරුතුමා', 'විශේෂ අධ්‍යාපන සහායක']
      : ['මව (Mother)', 'පියා (Father)', 'භාරකරු (Guardian)'];

  const loadSentRequests = async () => {
    if (!user?.uid) return;
    try {
      setIsLoadingRequests(true);
      const list = await connectionService.getSentRequestsForParent(user.uid);
      setSentRequests(list);
    } catch (err) {
      console.warn('[ConnectStudent] loadSentRequests error:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadSentRequests();
  }, [user?.uid]);

  const handleDetachRequest = async (req: ConnectionRequest) => {
    if (!user?.uid) return;
    const confirmMsg = `${req.childName} ශිෂ්‍යයාගේ සම්බන්ධතාවය ඉවත් කිරීමට ඔබට අවශ්‍යද? (Remove this student connection?)`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await executeDetach(req);
      }
    } else {
      Alert.alert('සම්බන්ධතාවය ඉවත් කිරීම', confirmMsg, [
        { text: 'අවලංගු කරන්න', style: 'cancel' },
        {
          text: 'ඉවත් කරන්න',
          style: 'destructive',
          onPress: () => executeDetach(req),
        },
      ]);
    }
  };

  const executeDetach = async (req: ConnectionRequest) => {
    if (!user?.uid) return;
    try {
      await connectionService.removeStudentConnection(user.uid, req.childUid || req.childEmail);
      await loadSentRequests();
    } catch (err) {
      console.warn('[ConnectStudent] Detach error:', err);
    }
  };

  const handleSendRequest = async () => {
    if (!identifier.trim()) {
      setErrorMessage(
        inputMode === 'email'
          ? 'කරුණාකර ශිෂ්‍යයාගේ විද්‍යුත් තැපෑල ඇතුළත් කරන්න. (Please enter student email.)'
          : 'කරුණාකර ශිෂ්‍ය කේතය (උදා: NM-1234) ඇතුළත් කරන්න. (Please enter student code.)'
      );
      return;
    }

    if (!user) {
      setErrorMessage('පරිශීලක තොරතුරු හමු නොවීය. කරුණාකර නැවත ලොග් වන්න.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await connectionService.sendConnectionRequest({
        sender: user,
        childEmailOrCode: identifier.trim(),
        relationship,
      });

      setSuccessMessage(
        'සම්බන්ධතා ඉල්ලීම සාර්ථකව යවන ලදී! ශිෂ්‍ය ගිණුමේ දැනුම්දීම් (Notifications) මඟින් එය තහවුරු කළ පසු ගිණුම් දෙක සම්බන්ධ වේ.'
      );
      setIdentifier('');
      await loadSentRequests();
    } catch (err: any) {
      setErrorMessage(err.message || 'ඉල්ලීම යැවීම අසාර්ථක විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsSubmitting(false);
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
          <AppText size="sm">🔗</AppText>
          <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
            ශිෂ්‍යයෙකු සම්බන්ධ කරන්න
          </AppText>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(parent)/dashboard')} activeOpacity={0.7}>
          <AppText size="xs" weight="bold" color={ThemeColors.primary}>
            පුවරුව
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro Hero Card */}
        <View style={[styles.heroCard, ThemeShadow.sm]}>
          <View style={styles.heroIconWrap}>
            <AppText size="xl">👨‍👩‍👧‍👦</AppText>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
              දරුවාගේ ඉගෙනුම් ගමනට එක්වන්න
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2, lineHeight: 18 }}>
              ශිෂ්‍යයාගේ විද්‍යුත් තැපෑල හෝ ශිෂ්‍ය කේතය ලබාදී ඉල්ලීමක් යවන්න. ශිෂ්‍යයා තහවුරු කළ පසු ප්‍රගතිය නිරීක්ෂණය කළ හැක.
            </AppText>
          </View>
        </View>

        {/* Input Card Form */}
        <View style={[styles.formCard, ThemeShadow.sm]}>
          {/* Mode Switch Tabs */}
          <View style={styles.modeTabsRow}>
            <TouchableOpacity
              style={[styles.modeTab, inputMode === 'email' && styles.modeTabActive]}
              onPress={() => {
                setInputMode('email');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={inputMode === 'email' ? '#FFFFFF' : ThemeColors.textSecondary}>
                ✉️ විද්‍යුත් තැපෑල (Email)
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, inputMode === 'code' && styles.modeTabActive]}
              onPress={() => {
                setInputMode('code');
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={inputMode === 'code' ? '#FFFFFF' : ThemeColors.textSecondary}>
                🏷️ ශිෂ්‍ය කේතය (Code)
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Input Field */}
          <View style={{ marginTop: 14 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 6 }}>
              {inputMode === 'email' ? 'ශිෂ්‍ය ගිණුමේ විද්‍යුත් තැපෑල (Student Email):' : 'ශිෂ්‍ය කේතය (Student Code):'}
            </AppText>
            <TextInput
              style={styles.input}
              placeholder={
                inputMode === 'email'
                  ? 'උදා: senuli@gmail.com හෝ senuli@nenaman.lk'
                  : 'උදා: NM-4892'
              }
              placeholderTextColor={ThemeColors.textMuted}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize={inputMode === 'code' ? 'characters' : 'none'}
              keyboardType={inputMode === 'email' ? 'email-address' : 'default'}
            />
          </View>

          {/* Relationship Selector */}
          <View style={{ marginTop: 16 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginBottom: 6 }}>
              ශිෂ්‍යයා සමඟ ඔබගේ සබඳතාවය:
            </AppText>
            <View style={styles.chipsRow}>
              {relationshipOptions.map((opt) => {
                const isSelected = relationship === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setRelationship(opt)}
                    activeOpacity={0.75}
                  >
                    <AppText
                      size="xs"
                      weight={isSelected ? 'bold' : 'regular'}
                      color={isSelected ? ThemeColors.primary : ThemeColors.textSecondary}
                    >
                      {opt}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
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

          {/* Success Message */}
          {!!successMessage && (
            <View style={styles.successBox}>
              <AppText size="xs" color="#047857" weight="bold">
                ✓ {successMessage}
              </AppText>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSendRequest}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText size="sm">📤</AppText>
                <AppText size="sm" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 8 }}>
                  සම්බන්ධ වීමේ ඉල්ලීම යවන්න
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── SENT REQUESTS LIST ── */}
        <View style={styles.sectionWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
              යවන ලද ඉල්ලීම් ({sentRequests.length})
            </AppText>
            <TouchableOpacity onPress={loadSentRequests} activeOpacity={0.7}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                නැවත පූරණය ⟳
              </AppText>
            </TouchableOpacity>
          </View>

          {isLoadingRequests ? (
            <LoadingView variant="inline" message="ඉල්ලීම් පූරණය වෙමින්..." style={{ marginTop: 16 }} />
          ) : sentRequests.length === 0 ? (
            <EmptyView
              compact
              title="තවමත් කිසිදු ඉල්ලීමක් යවා නැත"
              message="ඉහත පෝරමය මඟින් ඔබගේ ශිෂ්‍යයාට සම්බන්ධ වීමේ ඉල්ලීමක් යවන්න."
            />
          ) : (
            sentRequests.map((req) => (
              <View key={req.id} style={[styles.requestCard, ThemeShadow.sm]}>
                <View style={styles.requestCardLeft}>
                  <View style={styles.requestAvatarCircle}>
                    <AppText size="md">🎓</AppText>
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                      {req.childName}
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                      {req.childEmail} · ශ්‍රේණිය {req.childGrade || 2}
                    </AppText>
                    <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 2 }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </AppText>
                  </View>
                </View>

                {/* Status Badge & Remove Action */}
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View
                    style={[
                      styles.statusBadge,
                      req.status === 'accepted' && styles.statusBadgeAccepted,
                      req.status === 'pending' && styles.statusBadgePending,
                      req.status === 'declined' && styles.statusBadgeDeclined,
                    ]}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={
                        req.status === 'accepted'
                          ? '#047857'
                          : req.status === 'pending'
                          ? '#B45309'
                          : '#DC2626'
                      }
                    >
                      {req.status === 'accepted'
                        ? '✓ සම්බන්ධ විය'
                        : req.status === 'pending'
                        ? '⌛ පොරොත්තුවෙන්'
                        : '✕ ප්‍රතික්ෂේප විය'}
                    </AppText>
                  </View>

                  {req.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.detachRequestBtn}
                      onPress={() => handleDetachRequest(req)}
                      activeOpacity={0.7}
                    >
                      <AppText size="xs" color="#DC2626" weight="bold">
                        ✕ ඉවත් කරන්න
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Helper Guide Card */}
        <View style={styles.guideCard}>
          <AppText size="xs" weight="bold" color="#0369A1">
            💡 ශිෂ්‍ය කේතය (Student Code) සොයාගන්නේ කෙසේද?
          </AppText>
          <AppText size="xs" color="#0C4A6E" style={{ marginTop: 6, lineHeight: 18 }}>
            1. ශිෂ්‍යයාගේ උපාංගයෙන් නැණ මං යෙදුමට පිවිසෙන්න.{'\n'}
            2. යට තීරුවේ ඇති "පැතිකඩ (Profile)" ටැබ් එක තෝරන්න.{'\n'}
            3. එහි ඉහළින් පෙන්වන "ශිෂ්‍ය කේතය (Student Code)" බලා මෙහි සටහන් කරන්න.
          </AppText>
        </View>
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
    gap: ThemeSpacing.md,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  heroIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: ThemeColors.primary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
    borderRadius: 12,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: ThemeColors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#DCFCE7',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  sectionWrap: {
    gap: 10,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  requestCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeDeclined: {
    backgroundColor: '#FEE2E2',
  },
  detachRequestBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  guideCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: ThemeSpacing.md,
  },
});
