import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import BottomNav from '@/components/BottomNav';
import { StudentAvatarPhoto } from '@/components/Illustrations';
import { useAuth } from '@/context/AuthContext';
import { connectionService } from '@/services/connectionService';
import { useChildStoreBase } from '@/store/childStore';
import { LinkedPerson } from '@/types';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentChild = useChildStoreBase((s) => s.currentChild);
  const isParentOrTeacher = user?.role === 'parent' || user?.role === 'teacher';

  const [audioAssistance, setAudioAssistance] = useState(true);
  const [largeFont, setLargeFont] = useState(true);
  const [connectedGuardians, setConnectedGuardians] = useState<LinkedPerson[]>([]);
  const [connectedChildren, setConnectedChildren] = useState<LinkedPerson[]>([]);

  const studentGradeNumber = user?.grade || 2;
  const studentCode = connectionService.getStudentCode(user?.uid || '', user?.studentCode);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        if (isParentOrTeacher) {
          const list = await connectionService.getLinkedChildren(user.uid, user.email);
          setConnectedChildren(list || []);
        } else {
          const list = await connectionService.getLinkedGuardians(user.uid, user.email);
          setConnectedGuardians(list || []);
        }
      } catch (err) {
        console.warn('[ProfileScreen] loadData error:', err);
      }
    }
    loadData();
  }, [user?.uid, user?.email, isParentOrTeacher]);

  const handleSwitchToChildSession = (child: LinkedPerson) => {
    useChildStoreBase.getState().setCurrentChild({
      id: child.uid,
      name: child.name,
      age: 7,
      grade: child.grade || 2,
      readingLevel: 'medium',
      streak: 1,
      stars: 10,
      totalSessions: 0,
      avatarColor: '#4F46E5',
    });
    router.replace('/(child)/home');
  };

  const handleRemoveChild = async (child: LinkedPerson) => {
    if (!user?.uid) return;
    const confirmMsg = `${child.name} ශිෂ්‍යයාගේ සම්බන්ධතාවය ඔබගේ ගිණුමෙන් ඉවත් කිරීමට අවශ්‍යද? (Remove this student connection?)`;
    const doRemove = Platform.OS === 'web' ? window.confirm(confirmMsg) : true;
    if (doRemove) {
      try {
        await connectionService.removeStudentConnection(user.uid, child.uid, child.email);
        useChildStoreBase.getState().clearCurrentChild();
        setConnectedChildren((prev) =>
          prev.filter((c) => c.uid !== child.uid && c.email !== child.email)
        );
      } catch (err) {
        console.warn('[ProfileScreen] remove child error:', err);
      }
    }
  };

  const handleRemoveGuardian = async (guardian: LinkedPerson) => {
    if (!user?.uid) return;
    const confirmMsg = `${guardian.name} දෙමාපිය/ගුරු ගිණුමේ සම්බන්ධතාවය ඔබගේ ගිණුමෙන් ඉවත් කිරීමට අවශ්‍යද? (Remove this parent/teacher connection?)`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await executeRemoveGuardian(guardian);
      }
    } else {
      Alert.alert(
        'සම්බන්ධතාවය ඉවත් කිරීම',
        confirmMsg,
        [
          { text: 'අවලංගු කරන්න', style: 'cancel' },
          {
            text: 'ඉවත් කරන්න',
            style: 'destructive',
            onPress: () => executeRemoveGuardian(guardian),
          },
        ]
      );
    }
  };

  const executeRemoveGuardian = async (guardian: LinkedPerson) => {
    if (!user?.uid) return;
    try {
      await connectionService.removeStudentConnection(guardian.uid, user.uid, user.email);
      useChildStoreBase.getState().setCurrentGuardian(null);
      setConnectedGuardians((prev) =>
        prev.filter((g) => g.uid !== guardian.uid && g.email !== guardian.email)
      );
    } catch (err) {
      console.warn('[ProfileScreen] remove guardian error:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => (isParentOrTeacher ? router.replace('/(parent)/dashboard') : router.back())}
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

        <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
          {isParentOrTeacher ? 'මගේ ගිණුම (දෙමාපිය / ගුරු)' : 'මගේ ගිණුම'}
        </AppText>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isParentOrTeacher && (
            <TouchableOpacity
              onPress={() => router.replace('/(parent)/dashboard')}
              style={[styles.navIconBtn, { backgroundColor: '#E0F2FE' }]}
              activeOpacity={0.75}
              accessibilityLabel="Back to Parent Dashboard"
            >
              <AppText size="sm">🎛️</AppText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push('/(settings)/settings')}
            style={styles.navIconBtn}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 19.14 12.94 C 19.18 12.63 19.2 12.32 19.2 12 C 19.2 11.68 19.18 11.37 19.14 11.06 L 21.16 9.48 C 21.34 9.34 21.39 9.08 21.28 8.87 L 19.36 5.55 C 19.24 5.34 18.99 5.26 18.77 5.34 L 16.39 6.3 C 15.9 5.92 15.37 5.61 14.8 5.38 L 14.44 2.85 C 14.4 2.61 14.2 2.43 13.96 2.43 L 10.12 2.43 C 9.88 2.43 9.68 2.61 9.64 2.85 L 9.28 5.38 C 8.71 5.61 8.18 5.92 7.69 6.3 L 5.31 5.34 C 5.09 5.25 4.84 5.34 4.72 5.55 L 2.8 8.87 C 2.69 9.08 2.74 9.34 2.92 9.48 L 4.94 11.06 C 4.9 11.37 4.88 11.69 4.88 12 C 4.88 12.31 4.9 12.63 4.94 12.94 L 2.92 14.52 C 2.74 14.66 2.69 14.92 2.8 15.13 L 4.72 18.45 C 4.84 18.66 5.09 18.75 5.31 18.66 L 7.69 17.7 C 8.18 18.08 8.71 18.39 9.28 18.62 L 9.64 21.15 C 9.68 21.39 9.88 21.57 10.12 21.57 L 13.96 21.57 C 14.2 21.57 14.4 21.39 14.44 21.15 L 14.8 18.62 C 15.37 18.39 15.9 18.08 16.39 17.7 L 18.77 18.66 C 18.99 18.75 19.24 18.66 19.36 18.45 L 21.28 15.13 C 21.39 14.92 21.34 14.66 21.16 14.52 L 19.14 12.94 Z M 12 15.5 C 10.07 15.5 8.5 13.93 8.5 12 C 8.5 10.07 10.07 8.5 12 8.5 C 13.93 8.5 15.5 10.07 15.5 12 C 15.5 13.93 13.93 15.5 12 15.5 Z"
                fill={ThemeColors.textSecondary}
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutPillBtn}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M 9 21 H 5 C 3.89543 21 3 20.1046 3 19 V 5 C 3 3.89543 3.89543 3 5 3 H 9 M 16 17 L 21 12 M 21 12 L 16 7 M 21 12 H 9"
                stroke="#DC2626"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── PROFILE HEADER CARD ── */}
        <View style={[styles.profileCard, ThemeShadow.sm]}>
          {isParentOrTeacher ? (
            <View style={styles.parentAvatarLargeCircle}>
              <AppText size="xxl">{user?.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}</AppText>
            </View>
          ) : (
            <StudentAvatarPhoto size={76} showEditBadge={true} style={styles.avatarMargin} />
          )}

          <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary} style={styles.studentName}>
            {isParentOrTeacher
              ? (user?.displayName || (user?.role === 'teacher' ? 'පන්ති භාර ගුරුතුමා' : 'දෙමාපියන්'))
              : (user?.displayName || 'ශිෂ්‍ය ගිණුම')}
          </AppText>

          <AppText size="xs" color={ThemeColors.textSecondary} style={styles.schoolSubtitle}>
            {isParentOrTeacher
              ? `${user?.role === 'teacher' ? 'ගුරු ගිණුම' : 'දෙමාපිය ගිණුම'} • ${user?.email}`
              : `${studentGradeNumber} ශ්‍රේණිය • ${user?.schoolName || 'ශ්‍රී ලංකා පාසල'}`}
          </AppText>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/(settings)/settings')}
            activeOpacity={0.8}
          >
            <AppText size="xs">{isParentOrTeacher ? '⚙️' : '👤'}</AppText>
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 4 }}>
              {isParentOrTeacher ? 'සැකසුම් (Settings)' : 'පැතිකඩ සංස්කරණය'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── STUDENT CODE & CONNECTION CARD (For Child Only) ── */}
        {!isParentOrTeacher && (
          <View style={[styles.codeCard, ThemeShadow.sm]}>
            <View style={styles.codeCardHeader}>
              <View style={styles.codeTagPill}>
                <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                  🏷️ ශිෂ්‍ය කේතය (Student Code)
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(child)/notifications')}
                activeOpacity={0.7}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  දැනුම්දීම් බලන්න 🔔
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.codeDisplayRow}>
              <View style={styles.codeBox}>
                <AppText size="xl" weight="extrabold" color={ThemeColors.primary} style={{ letterSpacing: 2 }}>
                  {studentCode}
                </AppText>
              </View>
            </View>

            <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
              දෙමාපියන්ට හෝ ගුරුතුමාට ඔබේ ගිණුම සම්බන්ධ කිරීමට මෙම කේතය හෝ ඔබගේ විද්‍යුත් තැපෑල ({user?.email}) ලබාදෙන්න.
            </AppText>
          </View>
        )}

        {/* ── CONNECTED CHILDREN (FOR PARENT/TEACHER) OR GUARDIANS (FOR CHILD) ── */}
        {isParentOrTeacher ? (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText size="md">👥</AppText>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                  සම්බන්ධිත දරුවන් සහ සිසුන් ({connectedChildren.length})
                </AppText>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(parent)/connect-student')}
                activeOpacity={0.7}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  + අලුතින් එක්කරන්න
                </AppText>
              </TouchableOpacity>
            </View>

            {connectedChildren.length === 0 ? (
              <View style={[styles.emptyGuardiansCard, ThemeShadow.sm]}>
                <AppText size="sm">🤝</AppText>
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    තවමත් කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2, lineHeight: 18 }}>
                    ඔබගේ දරුවාගේ හෝ ශිෂ්‍යයාගේ ගිණුම සම්බන්ධ කිරීමට පහත බොත්තම ඔබන්න.
                  </AppText>
                </View>
                <TouchableOpacity
                  style={styles.connectMiniBtn}
                  onPress={() => router.push('/(parent)/connect-student')}
                  activeOpacity={0.8}
                >
                  <AppText size="xs" weight="bold" color="#FFFFFF">
                    + සම්බන්ධ කරන්න
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              connectedChildren.map((c) => (
                <View key={c.uid} style={[styles.guardianCard, ThemeShadow.sm]}>
                  <View style={styles.guardianInfoRow}>
                    <View style={[styles.guardianAvatar, { backgroundColor: '#DCFCE7' }]}>
                      <AppText size="sm" weight="extrabold" color="#047857">
                        {c.name ? c.name.charAt(0) : '🎓'}
                      </AppText>
                    </View>
                    <View style={styles.guardianTextCol}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} numberOfLines={1}>
                        {c.name}
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                        ශ්‍රේණිය {c.grade || 2} · {c.relationship || 'ශිෂ්‍යයා'}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.guardianDivider} />

                  <View style={styles.guardianActionsRow}>
                    <TouchableOpacity
                      style={styles.sessionSwitchPill}
                      onPress={() => handleSwitchToChildSession(c)}
                      activeOpacity={0.8}
                    >
                      <AppText size="xs" weight="bold" color="#FFFFFF">
                        ඉගෙනුමට 🚀
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detachSmallBtn}
                      onPress={() => handleRemoveChild(c)}
                      activeOpacity={0.7}
                      accessibilityLabel="Remove child connection"
                    >
                      <AppText size="xs" weight="bold" color="#DC2626">
                        ✕ ඉවත් කරන්න
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <AppText size="md">👨‍👩‍👧‍👦</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                සම්බන්ධිත දෙමාපියන් සහ ගුරුවරුන් ({connectedGuardians.length})
              </AppText>
            </View>

            {connectedGuardians.length === 0 ? (
              <View style={[styles.emptyGuardiansCard, ThemeShadow.sm]}>
                <AppText size="sm">🤝</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 8, flex: 1, lineHeight: 18 }}>
                  තවමත් කිසිදු දෙමාපිය හෝ ගුරු ගිණුමක් සම්බන්ධ කර නැත. ඉහත කේතය දෙමාපියන්ට ලබාදෙන්න.
                </AppText>
              </View>
            ) : (
              connectedGuardians.map((g) => (
                <View key={g.uid} style={[styles.guardianCard, ThemeShadow.sm]}>
                  <View style={styles.guardianInfoRow}>
                    <View style={styles.guardianAvatar}>
                      <AppText size="md">
                        {g.role === 'teacher' ? '👩‍🏫' : '👨‍👩‍👧'}
                      </AppText>
                    </View>
                    <View style={styles.guardianTextCol}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} numberOfLines={1}>
                        {g.name}
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                        {g.role === 'teacher' ? 'ගුරුතුමා / ගුරුතුමිය' : 'දෙමාපියන්'} · {g.relationship || 'භාරකරු'}
                      </AppText>
                      {g.email ? (
                        <AppText size="xs" color="#94A3B8" style={{ marginTop: 1, fontSize: 11 }} numberOfLines={1}>
                          {g.email}
                        </AppText>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.guardianDivider} />

                  <View style={styles.guardianActionsRow}>
                    <View style={styles.linkedBadge}>
                      <AppText size="xs" weight="bold" color="#047857">
                        ✓ සම්බන්ධයි
                      </AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.detachSmallBtn}
                      onPress={() => handleRemoveGuardian(g)}
                      activeOpacity={0.7}
                      accessibilityLabel="Remove guardian connection"
                    >
                      <AppText size="xs" weight="bold" color="#DC2626">
                        ✕ ඉවත් කරන්න
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── SECTION 1: මගේ ඉගෙනුම් පැතිකඩ ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">📚</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              මගේ ඉගෙනුම් පැතිකඩ
            </AppText>
          </View>

          {/* 4-Stat Metric Grid */}
          <View style={styles.statsGrid}>
            {/* Stat 1: මට්ටම */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">🎓</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  මට්ටම
                </AppText>
              </View>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                ආරම්භක
              </AppText>
            </View>

            {/* Stat 2: ප්‍රගතිය */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">📈</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  ප්‍රගතිය
                </AppText>
              </View>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                72 %
              </AppText>
              <View style={styles.statProgressTrack}>
                <View style={[styles.statProgressFill, { width: '72%' }]} />
              </View>
            </View>

            {/* Stat 3: ක්‍රියාකාරකම් */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">📇</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  ක්‍රියාකාරකම්
                </AppText>
              </View>
              <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary} style={styles.statValue}>
                38
              </AppText>
            </View>

            {/* Stat 4: දින ගණන */}
            <View style={[styles.statBox, ThemeShadow.sm]}>
              <View style={styles.statLabelRow}>
                <AppText size="xs">🔥</AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginLeft: 4 }}>
                  දින ගණන
                </AppText>
              </View>
              <View style={styles.streakValRow}>
                <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
                  5
                </AppText>
                <AppText size="md" style={{ marginLeft: 4 }}>
                  🔥
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: මගේ ඉලක්කය (My Goal) ── */}
        <View style={[styles.goalCard, ThemeShadow.sm]}>
          <View style={styles.goalHeaderRow}>
            <AppText size="sm">🎯</AppText>
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 4 }}>
              මගේ ඉලක්කය
            </AppText>
          </View>
          <AppText size="xs" color={ThemeColors.textPrimary} style={styles.goalText}>
            වාක්‍ය කියවීමේ හැකියාව වැඩි දියුණු කරමු
          </AppText>
        </View>

        {/* ── SECTION 3: මගේ ශක්තීන් (My Strengths) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">⭐</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              මගේ ශක්තීන්
            </AppText>
          </View>

          {/* Strength Item 1 */}
          <View style={[styles.strengthCard, { borderLeftColor: ThemeColors.primary }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={styles.skillIconCircle}>
                <AppText size="sm">⛰️</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                අකුරු හඳුනාගැනීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              90%
            </AppText>
          </View>

          {/* Strength Item 2 */}
          <View style={[styles.strengthCard, { borderLeftColor: ThemeColors.primary }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={styles.skillIconCircle}>
                <AppText size="sm">🗣️</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                ශබ්ද හඳුනාගැනීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              82%
            </AppText>
          </View>
        </View>

        {/* ── SECTION 4: තව පුහුණු විය යුතු දේ (Areas to Practice More) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">🌱</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              තව පුහුණු විය යුතු දේ
            </AppText>
          </View>

          {/* Practice Item 1 (Blue accent) */}
          <View style={[styles.strengthCard, { borderLeftColor: '#3B82F6' }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={[styles.skillIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <AppText size="sm">📖</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                වචන කියවීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color="#2563EB">
              65%
            </AppText>
          </View>

          {/* Practice Item 2 (Orange/Amber accent) */}
          <View style={[styles.strengthCard, { borderLeftColor: '#F97316' }, ThemeShadow.sm]}>
            <View style={styles.skillRowLeft}>
              <View style={[styles.skillIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <AppText size="sm">👥</AppText>
              </View>
              <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                වාක්‍ය කියවීම
              </AppText>
            </View>
            <AppText size="md" weight="extrabold" color="#EA580C">
              48%
            </AppText>
          </View>
        </View>

        {/* ── SECTION 5: ඉගෙනුම් පහසුකම් (Learning Accessibility) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <AppText size="md">♿</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
              ඉගෙනුම් පහසුකම්
            </AppText>
          </View>

          <View style={[styles.accessibilityCard, ThemeShadow.sm]}>
            {/* Setting 1: අකුරු ප්‍රමාණය */}
            <View style={styles.accessRow}>
              <View style={styles.accessLeft}>
                <View style={styles.accessIconBox}>
                  <AppText size="sm">🔤</AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                  අකුරු ප්‍රමාණය
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.pillValueBadge}
                onPress={() => setLargeFont(!largeFont)}
                activeOpacity={0.7}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                  {largeFont ? 'විශාල' : 'සාමාන්‍ය'}
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Setting 2: ශබ්ද සහාය */}
            <View style={styles.accessRow}>
              <View style={styles.accessLeft}>
                <View style={styles.accessIconBox}>
                  <AppText size="sm">🔊</AppText>
                </View>
                <AppText size="xs" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                  ශබ්ද සහාය
                </AppText>
              </View>
              <Switch
                value={audioAssistance}
                onValueChange={setAudioAssistance}
                trackColor={{ false: '#D1D5DB', true: ThemeColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Big LogOut Button at bottom */}
        <TouchableOpacity
          style={[styles.fullLogoutBtn, ThemeShadow.sm]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <AppText size="md">🚪</AppText>
          <AppText size="sm" weight="bold" color="#DC2626" style={{ marginLeft: 8 }}>
            ගිණුමෙන් ඉවත්වන්න (Log Out)
          </AppText>
        </TouchableOpacity>

        <View style={{ height: ThemeSpacing.lg }} />
      </ScrollView>

      {/* 5-Tab Sinhala Bottom Navigation with Profile Active (Child Only) */}
      {!isParentOrTeacher && <BottomNav role="child" activeTab="profile" />}
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
  scroll: {
    paddingHorizontal: ThemeSpacing.md,
    paddingTop: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xl,
    gap: ThemeSpacing.md,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  parentAvatarLargeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ThemeSpacing.sm,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  connectMiniBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sessionSwitchPill: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detachSmallBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  avatarMargin: {
    marginBottom: ThemeSpacing.sm,
  },
  studentName: {
    marginBottom: 2,
  },
  schoolSubtitle: {
    marginBottom: ThemeSpacing.md,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2ECF4',
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.xs + 2,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: '#D0E0EC',
  },
  sectionWrap: {
    gap: ThemeSpacing.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    marginTop: 2,
  },
  statProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: ThemeRadius.full,
    marginTop: 6,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: 6,
    backgroundColor: ThemeColors.accent,
    borderRadius: ThemeRadius.full,
  },
  streakValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: '#EAF7EE',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: '#C7EBD2',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalText: {
    lineHeight: 18,
  },
  strengthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  skillRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAF7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessibilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  accessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValueBadge: {
    backgroundColor: '#E8F1F8',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: 4,
    borderRadius: ThemeRadius.full,
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.borderLight,
    marginVertical: ThemeSpacing.sm,
  },
  logoutPillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fullLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    paddingVertical: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    marginTop: ThemeSpacing.sm,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#C7EBD2',
  },
  codeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeTagPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  codeDisplayRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  codeBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyGuardiansCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  guardianCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
    marginBottom: 10,
  },
  guardianInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  guardianAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  guardianDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
    width: '100%',
  },
  guardianActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  linkedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
});
