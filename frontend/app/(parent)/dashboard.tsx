import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
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
import NenaManLogo from '@/components/NenaManLogo';
import { StudentAvatarPhoto } from '@/components/Illustrations';
import { useAuth } from '@/context/AuthContext';
import { connectionService } from '@/services/connectionService';
import { LinkedPerson } from '@/types';
import { useChildStoreBase } from '@/store/childStore';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const currentGuardian = useChildStoreBase((s) => s.currentGuardian);
  const currentChild = useChildStoreBase((s) => s.currentChild);
  const isChildViewingParent = user?.role === 'child';

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'insights'>('overview');
  const [linkedStudents, setLinkedStudents] = useState<LinkedPerson[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [showChildSelectModal, setShowChildSelectModal] = useState(false);

  const effectiveParentName = isChildViewingParent
    ? (currentGuardian?.name || 'දෙමාපියන්')
    : (user?.displayName || 'සුභ උදෑසනක්!');

  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      if (isChildViewingParent) {
        let guardian = currentGuardian;
        if (!guardian && user?.uid) {
          const guardians = await connectionService.getLinkedGuardians(user.uid, user.email);
          if (guardians.length > 0) {
            guardian = guardians[0];
            useChildStoreBase.getState().setCurrentGuardian(guardian);
          }
        }
        if (guardian?.uid) {
          const list = await connectionService.getLinkedChildren(guardian.uid, guardian.email);
          const childAsLinked: LinkedPerson = {
            uid: user?.uid || '',
            name: user?.displayName || 'ශිෂ්‍යයා',
            email: user?.email || '',
            role: 'child',
            grade: user?.grade || 2,
            relationship: guardian.relationship || 'ශිෂ්‍යයා',
            linkedAt: guardian.linkedAt || new Date().toISOString(),
          };
          const combined = [...(list || [])];
          if (!combined.some((c) => (c.uid && c.uid === user?.uid) || (user?.email && c.email === user?.email))) {
            combined.unshift(childAsLinked);
          }
          setLinkedStudents(combined);
        } else {
          setLinkedStudents([]);
        }
      } else if (user?.uid) {
        const list = await connectionService.getLinkedChildren(user.uid, user.email);
        setLinkedStudents(list || []);
      }
    } catch (err) {
      console.warn('[ParentDashboard] loadStudents error:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [user?.uid, user?.email, isChildViewingParent, currentGuardian?.uid]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  const handleSwitchToChild = (targetChild?: LinkedPerson) => {
    if (!linkedStudents || linkedStudents.length === 0) {
      if (Platform.OS === 'web') {
        const confirm = window.confirm(
          'තවමත් ඔබගේ ගිණුමට කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත.\n\nදැන්ම ශිෂ්‍යයෙකු සම්බන්ධ කිරීමේ පිටුවට යන්නද? (Connect a student now?)'
        );
        if (confirm) {
          router.push('/(parent)/connect-student');
        }
      } else {
        Alert.alert(
          'ශිෂ්‍ය ගිණුමක් නැත',
          'තවමත් ඔබගේ ගිණුමට කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත. කරුණාකර පළමුව ශිෂ්‍යයෙකු සම්බන්ධ කරන්න.',
          [
            { text: 'අවලංගු කරන්න', style: 'cancel' },
            {
              text: 'සම්බන්ධ කරන්න',
              onPress: () => router.push('/(parent)/connect-student'),
            },
          ]
        );
      }
      return;
    }

    if (targetChild) {
      applySwitchToChild(targetChild);
      return;
    }

    if (linkedStudents.length === 1) {
      applySwitchToChild(linkedStudents[0]);
      return;
    }

    // Multiple children connected: open selection modal to choose!
    setShowChildSelectModal(true);
  };

  const applySwitchToChild = (selected: LinkedPerson) => {
    setShowChildSelectModal(false);
    useChildStoreBase.getState().setCurrentChild({
      id: selected.uid,
      name: selected.name,
      age: 7,
      grade: selected.grade || 2,
      readingLevel: 'medium',
      streak: 1,
      stars: 10,
      totalSessions: 0,
      avatarColor: '#4F46E5',
    });

    router.replace('/(child)/home');
  };

  const handleRemoveStudent = async (student: LinkedPerson) => {
    const confirmMsg = `${student.name} ශිෂ්‍යයාගේ සම්බන්ධතාවය ඔබගේ ගිණුමෙන් ඉවත් කිරීමට අවශ්‍යද? (Remove this student connection?)`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await executeRemove(student);
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
            onPress: () => executeRemove(student),
          },
        ]
      );
    }
  };

  const executeRemove = async (student: LinkedPerson) => {
    if (!user?.uid) return;
    try {
      const parentUid = isChildViewingParent ? currentGuardian?.uid : user?.uid;
      if (!parentUid) return;
      await connectionService.removeStudentConnection(
        parentUid,
        student.uid,
        student.email
      );
      if (isChildViewingParent) {
        useChildStoreBase.getState().setCurrentGuardian(null);
      }
      useChildStoreBase.getState().clearCurrentChild();
      setLinkedStudents((prev) =>
        prev.filter((s) => s.uid !== student.uid && s.email !== student.email)
      );
      if (isChildViewingParent) {
        router.replace('/(child)/home');
      }
    } catch (err) {
      console.warn('[ParentDashboard] Remove student error:', err);
    }
  };

  const students = [
    {
      id: 1,
      name: 'සෙනුලි පෙරේරා',
      grade: 5,
      progress: 78,
      status: 'හොඳයි',
      statusType: 'good',
      avatarBg: '#DCFCE7',
      errorPattern: 'ස්වර දිගුකිරීම් (Vowel Length)',
    },
    {
      id: 2,
      name: 'කවිඳු සිල්වා',
      grade: 5,
      progress: 62,
      status: 'අවධානය',
      statusType: 'attention',
      avatarBg: '#FEF3C7',
      errorPattern: 'ර/ල අකුරු මාරුව (Liquid Confusion)',
    },
    {
      id: 3,
      name: 'සහන් ප්‍රනාන්දු',
      grade: 4,
      progress: 44,
      status: 'සහාය අවශ්‍යයි',
      statusType: 'help',
      avatarBg: '#FEE2E2',
      errorPattern: 'පිල්ලම් මඟහැරීම (Pillam Omission)',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP MOBILE HEADER ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/(auth)/role-select')} activeOpacity={0.7}>
            <NenaManLogo size="sm" showText={false} />
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              දෙමාපිය & ගුරු පුවරුව
            </AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              {effectiveParentName} 👏
            </AppText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Switch to Child Account Mode — 1-click button in the top bar */}
          <TouchableOpacity
            style={[
              styles.childSwitchBtn,
              linkedStudents.length > 1 && { width: 'auto', paddingHorizontal: 10, borderRadius: 16 },
            ]}
            onPress={() => handleSwitchToChild()}
            activeOpacity={0.75}
            accessibilityLabel="Switch to Student Account"
          >
            <AppText size="sm">🌟</AppText>
            {linkedStudents.length > 1 && (
              <AppText size="xs" weight="extrabold" color="#047857" style={{ marginLeft: 4 }}>
                {linkedStudents.length}
              </AppText>
            )}
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/(parent)/reports')}
            activeOpacity={0.7}
          >
            <AppText size="sm">🔔</AppText>
            <View style={styles.redDot} />
          </TouchableOpacity>

          {/* Teacher / Parent Avatar Photo */}
          <TouchableOpacity
            style={styles.teacherAvatarWrap}
            onPress={() => router.push('/(child)/profile')}
            activeOpacity={0.8}
          >
            <AppText size="md">👩‍🏫</AppText>
          </TouchableOpacity>

          {/* Log Out Button (Exit Icon Only) */}
          <TouchableOpacity
            style={styles.logoutBtn}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── TOP CATEGORY PILLS ── */}
        <View style={styles.tabPillsRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'overview' && styles.tabPillActive]}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.8}
          >
            <AppText size="xs">📊</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'overview' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              සාරාංශය
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'students' && styles.tabPillActive]}
            onPress={() => setActiveTab('students')}
            activeOpacity={0.8}
          >
            <AppText size="xs">👥</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'students' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              සිසුන් (24)
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'insights' && styles.tabPillActive]}
            onPress={() => router.push('/(parent)/recommendations')}
            activeOpacity={0.8}
          >
            <AppText size="xs">🧠</AppText>
            <AppText
              size="xs"
              weight="bold"
              color={activeTab === 'insights' ? '#FFFFFF' : ThemeColors.textSecondary}
              style={{ marginLeft: 6 }}
            >
              AI නිර්දේශ
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── CONNECT STUDENT PROMINENT BANNER / CTA ── */}
        <View style={[styles.connectBanner, ThemeShadow.sm]}>
          {/* Top row: icon + text */}
          <View style={styles.connectBannerTop}>
            <View style={styles.connectIconCircle}>
              <AppText size="lg">🔗</AppText>
            </View>
            <View style={styles.connectBannerTextWrap}>
              <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
                ශිෂ්‍ය ගිණුම් සම්බන්ධතාවය
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                {linkedStudents.length > 0
                  ? `සම්බන්ධිත සිසුන් ${linkedStudents.length}ක් සිටී.`
                  : 'ඔබගේ දරුවා හෝ ශිෂ්‍යයා සමඟ ගිණුම සම්බන්ධ කරන්න.'}
              </AppText>
            </View>
          </View>

          {/* Bottom row: action buttons */}
          <View style={styles.connectBannerActions}>
            {linkedStudents.length > 1 && (
              <TouchableOpacity
                style={styles.chooseChildBannerBtn}
                onPress={() => setShowChildSelectModal(true)}
                activeOpacity={0.8}
                accessibilityLabel="Choose Student"
              >
                <AppText size="xs" weight="extrabold" color="#0369A1">
                  👥 තෝරන්න
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.connectCtaBtn}
              onPress={() => router.push('/(parent)/connect-student')}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="extrabold" color="#FFFFFF">
                + සම්බන්ධ කරන්න
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4 SUMMARY METRIC CARDS (2x2 Clean Mobile Grid) ── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: සිසුන් */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <AppText size="md">👥</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                මුළු සිසුන්
              </AppText>
              <AppText size="xl" weight="extrabold" color={ThemeColors.textPrimary}>
                24
              </AppText>
            </View>
          </View>

          {/* Card 2: සම්පූර්ණ කළ */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <AppText size="md">✓</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                සම්පූර්ණ සැසි
              </AppText>
              <AppText size="xl" weight="extrabold" color="#047857">
                156
              </AppText>
            </View>
          </View>

          {/* Card 3: සාමාන්‍ය ප්‍රගතිය */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <AppText size="md">📈</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                සාමාන්‍ය ප්‍රගතිය
              </AppText>
              <AppText size="xl" weight="extrabold" color="#B45309">
                72%
              </AppText>
            </View>
          </View>

          {/* Card 4: අවධානය අවශ්‍යයි */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <AppText size="md">⚠️</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                අවධානය අවශ්‍ය
              </AppText>
              <AppText size="xl" weight="extrabold" color="#DC2626">
                5
              </AppText>
            </View>
          </View>
        </View>

        {/* ── CARD 2: සිසුන්ගේ ප්‍රගතිය (STUDENT PROGRESS LIST) ── */}
        <View style={[styles.progressCard, ThemeShadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="sm">📊</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                සිසුන්ගේ දෛනික ප්‍රගතිය
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => router.push('/(parent)/connect-student')}
                activeOpacity={0.7}
              >
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  + එක්කරන්න
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(parent)/reports')} activeOpacity={0.7}>
                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                  වාර්තා →
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Real Linked Students List */}
          {linkedStudents.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 14 }}>
              <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                ✓ ඔබගේ සම්බන්ධිත සිසුන් ({linkedStudents.length})
              </AppText>
              {linkedStudents.map((ls) => {
                const isActive = currentChild?.id === ls.uid;
                return (
                  <View
                    key={ls.uid}
                    style={[
                      styles.studentItemCard,
                      {
                        backgroundColor: isActive ? '#F0FDF4' : '#FFFFFF',
                        borderColor: isActive ? '#86EFAC' : '#E2E8F0',
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <View style={styles.studentTopLine}>
                      <View style={styles.studentNameWrap}>
                        <View style={[styles.miniAvatarCircle, { backgroundColor: isActive ? '#DCFCE7' : '#E0F2FE' }]}>
                          <AppText size="xs" weight="extrabold" color={isActive ? '#047857' : '#0369A1'}>
                            {ls.name.charAt(0)}
                          </AppText>
                        </View>
                        <View style={{ marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                              {ls.name}
                            </AppText>
                            {isActive && (
                              <View style={styles.activePillBadge}>
                                <AppText size="xs" weight="bold" color="#047857">
                                  ✓ සක්‍රීයයි
                                </AppText>
                              </View>
                            )}
                          </View>
                          <AppText size="xs" color={ThemeColors.textSecondary}>
                            ශ්‍රේණිය {ls.grade || 2} · {ls.relationship || 'ශිෂ්‍යයා'}
                          </AppText>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.switchSessionBtn, isActive && { backgroundColor: '#059669' }]}
                          onPress={() => applySwitchToChild(ls)}
                          activeOpacity={0.8}
                        >
                          <AppText size="xs" weight="bold" color="#FFFFFF">
                            {isActive ? 'පිවිසෙන්න 🚀' : 'තෝරන්න 🚀'}
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.detachBtn}
                          onPress={() => handleRemoveStudent(ls)}
                          activeOpacity={0.7}
                          accessibilityLabel="Remove student connection"
                        >
                          <AppText size="xs" weight="bold" color="#DC2626">
                            ✕ ඉවත් කරන්න
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyStudentsBox}>
              <AppText size="lg">👥</AppText>
              <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginTop: 4 }}>
                තවමත් කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                ඔබගේ දරුවාගේ හෝ පන්තියේ සිසුන්ගේ ප්‍රගතිය බැලීමට ශිෂ්‍ය ගිණුමක් සම්බන්ධ කරන්න.
              </AppText>
              <TouchableOpacity
                style={styles.connectFirstBtn}
                onPress={() => router.push('/(parent)/connect-student')}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="extrabold" color="#FFFFFF">
                  + පළමු ශිෂ්‍යයා සම්බන්ධ කරන්න
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* Student Rows (Sample Cohort) */}
          <View style={[styles.studentsListWrap, { marginTop: 8 }]}>
            <AppText size="xs" weight="bold" color={ThemeColors.textMuted} style={{ marginBottom: 4 }}>
              ආදර්ශ සිසුන්ගේ ප්‍රගතිය (Sample Cohort):
            </AppText>
            {students.map((stu) => (
              <View key={stu.id} style={styles.studentItemCard}>
                <View style={styles.studentTopLine}>
                  <View style={styles.studentNameWrap}>
                    <View style={[styles.miniAvatarCircle, { backgroundColor: stu.avatarBg }]}>
                      <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary}>
                        {stu.name.charAt(0)}
                      </AppText>
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                        {stu.name}
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textSecondary}>
                        ශ්‍රේණිය {stu.grade} · {stu.errorPattern}
                      </AppText>
                    </View>
                  </View>

                  {/* Status Tag */}
                  <View
                    style={[
                      styles.statusPillBadge,
                      stu.statusType === 'good' && styles.statusGood,
                      stu.statusType === 'attention' && styles.statusAttention,
                      stu.statusType === 'help' && styles.statusHelp,
                    ]}
                  >
                    <AppText
                      size="xs"
                      weight="bold"
                      color={
                        stu.statusType === 'good'
                          ? '#047857'
                          : stu.statusType === 'attention'
                          ? '#B45309'
                          : '#DC2626'
                      }
                    >
                      {stu.status}
                    </AppText>
                  </View>
                </View>

                {/* Progress Bar & Percentage Line */}
                <View style={styles.studentProgressBarRow}>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stu.progress}%`,
                          backgroundColor:
                            stu.progress >= 70
                              ? '#10B981'
                              : stu.progress >= 50
                              ? '#F59E0B'
                              : '#EF4444',
                        },
                      ]}
                    />
                  </View>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 8 }}>
                    {stu.progress}%
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── CARD 3: AI නිර්දේශ සහ මගපෙන්වීම් (ADAPTIVE INSIGHTS) ── */}
        <View style={[styles.insightsCard, ThemeShadow.sm]}>
          <View style={styles.insightHeaderRow}>
            <AppText size="sm">🧠</AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
              AI ස්මාර්ට් ඉගෙනුම් නිර්දේශ
            </AppText>
          </View>

          <View style={styles.insightInnerBox}>
            <AppText size="xs" weight="bold" color="#0369A1">
              • සිසුන් 8 දෙනෙකු සඳහා නව කථන අභ්‍යාස නිර්දේශ කර ඇත.
            </AppText>
            <AppText size="xs" color="#0C4A6E" style={{ marginTop: 4, lineHeight: 18 }}>
              ර/ල අකුරු මාරුව සහ ස්වර දිගුකිරීම් ආශ්‍රිත දෝෂ සහිත සිසුන්ට පියවරෙන් පියවර සහාය ලබාදෙන්න.
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.viewRecsBtn}
            onPress={() => router.push('/(parent)/recommendations')}
            activeOpacity={0.85}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.primary}>
              සම්පූර්ණ AI නිර්දේශ විමසන්න →
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── CARD 4: ඉක්මන් පුහුණු සැසියක් (QUICK LAUNCHER) ── */}
        <View style={[styles.quickLauncherCard, ThemeShadow.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppText size="md">📋</AppText>
            <AppText size="md" weight="extrabold" color="#FFFFFF" style={{ marginLeft: 8 }}>
              විස්තරාත්මක වාර්තා සහ නිර්දේශ
            </AppText>
          </View>
          <AppText size="xs" color="rgba(255,255,255,0.9)" style={{ marginTop: 4, lineHeight: 18 }}>
            සිසුවාගේ උච්චාරණ දෝෂ විශ්ලේෂණය සහ ඉදිරි ඉගෙනුම් මාර්ගය පරිශීලනය කරන්න.
          </AppText>

          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => router.push('/(parent)/reports')}
            activeOpacity={0.85}
          >
            <AppText size="sm" weight="extrabold" color={ThemeColors.primary}>
              සම්පූර්ණ වාර්තාව බලන්න →
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* ── MULTI-CHILD SELECTION MODAL ── */}
      <Modal
        visible={showChildSelectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChildSelectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChildSelectModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText size="lg">👶</AppText>
                <View style={{ marginLeft: 10 }}>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                    ශිෂ්‍ය ගිණුම තෝරන්න
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textSecondary}>
                    ඉගෙනුමට පිවිසීමට අවශ්‍ය ශිෂ්‍යයා තෝරන්න:
                  </AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowChildSelectModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppText size="sm" weight="bold" color={ThemeColors.textSecondary}>
                  ✕
                </AppText>
              </TouchableOpacity>
            </View>

            {/* List of Connected Children */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10, paddingVertical: 6 }}>
                {linkedStudents.map((child) => {
                  const isCurrent = currentChild?.id === child.uid;
                  return (
                    <TouchableOpacity
                      key={child.uid}
                      style={[
                        styles.childSelectCard,
                        isCurrent && styles.childSelectCardActive,
                      ]}
                      onPress={() => applySwitchToChild(child)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.miniAvatarCircle, { backgroundColor: isCurrent ? '#DCFCE7' : '#E0F2FE' }]}>
                        <AppText size="sm" weight="extrabold" color={isCurrent ? '#047857' : '#0369A1'}>
                          {child.name.charAt(0)}
                        </AppText>
                      </View>

                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText size="sm" weight="extrabold" color={ThemeColors.textPrimary}>
                            {child.name}
                          </AppText>
                          {isCurrent && (
                            <View style={styles.activePillBadge}>
                              <AppText size="xs" weight="bold" color="#047857">
                                ✓ සක්‍රීයයි
                              </AppText>
                            </View>
                          )}
                        </View>
                        <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                          ශ්‍රේණිය {child.grade || 2} · {child.relationship || 'ශිෂ්‍යයා'}
                        </AppText>
                      </View>

                      <View style={[styles.selectActionPill, isCurrent && { backgroundColor: '#059669' }]}>
                        <AppText size="xs" weight="extrabold" color="#FFFFFF">
                          {isCurrent ? 'පිවිසෙන්න 🚀' : 'තෝරන්න 🚀'}
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Cancel Button */}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowChildSelectModal(false)}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                අවලංගු කරන්න (Cancel)
              </AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any, height: '100vh' as any } : {}),
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  childSwitchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  teacherAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxl,
  },
  tabPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: ThemeRadius.full,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  tabPillActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: ThemeSpacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  studentsListWrap: {
    gap: 10,
  },
  studentItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  statusGood: {
    backgroundColor: '#DCFCE7',
  },
  statusAttention: {
    backgroundColor: '#FEF3C7',
  },
  statusHelp: {
    backgroundColor: '#FEE2E2',
  },
  studentProgressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: ThemeRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: ThemeRadius.full,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.borderLight,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  insightInnerBox: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: ThemeSpacing.sm + 2,
    marginBottom: ThemeSpacing.sm,
  },
  viewRecsBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: ThemeRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  quickLauncherCard: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 20,
    padding: ThemeSpacing.md,
  },
  launchBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: ThemeSpacing.md,
    ...ThemeShadow.sm,
  },
  connectBanner: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: ThemeSpacing.md,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 10,
  },
  connectBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectBannerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  connectBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  connectIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectCtaBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  switchSessionBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detachBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emptyStudentsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  connectFirstBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  chooseChildBannerBtn: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ThemeSpacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: ThemeSpacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    paddingBottom: ThemeSpacing.sm,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: ThemeSpacing.sm + 4,
    borderWidth: 1.5,
    borderColor: ThemeColors.borderLight,
  },
  childSelectCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  activePillBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectActionPill: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  modalCancelBtn: {
    marginTop: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
});
