import React, { useState, useEffect, useMemo } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import { connectionService } from '@/services/connectionService';
import { sessionService } from '@/services/sessionService';
import { recommendationService, ParentRecommendationInsight } from '@/services/recommendationService';
import { LinkedPerson, ReadingSessionRecord } from '@/types';
import { useChildStoreBase } from '@/store/childStore';
import { MOCK_SESSIONS } from '@/mock/data';
import EmailReportModal from '@/components/EmailReportModal';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const currentGuardian = useChildStoreBase((s) => s.currentGuardian);
  const currentChild = useChildStoreBase((s) => s.currentChild);
  const isChildViewingParent = user?.role === 'child';
  const isTeacher = user?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'insights'>('overview');
  const [linkedStudents, setLinkedStudents] = useState<LinkedPerson[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [showChildSelectModal, setShowChildSelectModal] = useState(false);
  const [recentSessions, setRecentSessions] = useState<ReadingSessionRecord[]>([]);
  const [aiInsight, setAiInsight] = useState<ParentRecommendationInsight | null>(null);
  const [showEmailReportModal, setShowEmailReportModal] = useState(false);
  const [rawM3, setRawM3] = useState<any>(null);

  const effectiveParentName = isChildViewingParent
    ? (currentGuardian?.name || (language === 'si' ? 'දෙමාපියන්' : 'Parent'))
    : (user?.displayName || (language === 'si' ? 'සුභ උදෑසනක්!' : 'Welcome!'));

  const activeChildId = currentChild?.id || (linkedStudents.length > 0 ? linkedStudents[0].uid : 'child_001');
  const activeChildName = currentChild?.name || (linkedStudents.length > 0 ? linkedStudents[0].name : (language === 'si' ? 'සෙනුලි පෙරේරා' : 'Senuli Perera'));
  const activeChildGrade = currentChild?.grade || (linkedStudents.length > 0 && linkedStudents[0].grade ? linkedStudents[0].grade : 2);

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
            name: user?.displayName || (language === 'si' ? 'ශිෂ්‍යයා' : 'Student'),
            email: user?.email || '',
            role: 'child',
            grade: user?.grade || 2,
            relationship: guardian.relationship || (language === 'si' ? 'ශිෂ්‍යයා' : 'Student'),
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

  const loadChildData = async () => {
    try {
      const sessions = await sessionService.getChildSessions(activeChildId, 10);
      setRecentSessions(sessions || []);

      const latest = sessions && sessions.length > 0 ? sessions[0] : null;
      const rec = await recommendationService.getNextRecommendation(activeChildId, latest);
      setRawM3(rec);
      const insight = recommendationService.getParentExplanation(rec);
      setAiInsight(insight);
    } catch (err) {
      console.warn('[ParentDashboard] loadChildData error:', err);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [user?.uid, user?.email, isChildViewingParent, currentGuardian?.uid]);

  useEffect(() => {
    loadChildData();
  }, [activeChildId]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/role-select');
  };

  const handleSwitchToChild = (targetChild?: LinkedPerson) => {
    if (!linkedStudents || linkedStudents.length === 0) {
      const promptTitle = language === 'si' ? 'ශිෂ්‍ය ගිණුමක් නැත' : 'No Student Connected';
      const promptMsg = language === 'si'
        ? 'තවමත් ඔබගේ ගිණුමට කිසිදු ශිෂ්‍යයෙකු සම්බන්ධ කර නැත.\n\nදැන්ම ශිෂ්‍යයෙකු සම්බන්ධ කිරීමේ පිටුවට යන්නද?'
        : 'No student account has been linked to your profile yet.\n\nWould you like to link a student now?';

      if (Platform.OS === 'web') {
        if (window.confirm(promptMsg)) {
          router.push('/(parent)/connect-student');
        }
      } else {
        Alert.alert(promptTitle, promptMsg, [
          { text: language === 'si' ? 'අවලංගු කරන්න' : 'Cancel', style: 'cancel' },
          {
            text: language === 'si' ? 'සම්බන්ධ කරන්න' : 'Connect',
            onPress: () => router.push('/(parent)/connect-student'),
          },
        ]);
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

    setShowChildSelectModal(true);
  };

  const applySwitchToChild = (selected: LinkedPerson) => {
    setShowChildSelectModal(false);
    const childStoreState = useChildStoreBase.getState();
    const existingChild = childStoreState.children.find((c) => c.id === selected.uid);
    const existingCurrent = childStoreState.currentChild?.id === selected.uid ? childStoreState.currentChild : null;
    const resolvedAvatar = existingCurrent?.avatar || existingChild?.avatar || (user?.uid === selected.uid ? user?.avatar : undefined);

    useChildStoreBase.getState().setCurrentChild({
      id: selected.uid,
      name: selected.name,
      age: 7,
      grade: selected.grade || 2,
      readingLevel: 'medium',
      streak: currentChild?.streak || 3,
      stars: currentChild?.stars || 15,
      totalSessions: recentSessions.length || 5,
      avatarColor: '#0B7A44',
      avatar: resolvedAvatar,
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

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    const hasLiveSessions = recentSessions.length > 0;
    const totalSessions = hasLiveSessions ? recentSessions.length : (currentChild?.totalSessions || 12);

    let totalAcc = 0;
    let totalStars = 0;

    if (hasLiveSessions) {
      recentSessions.forEach((s) => {
        totalAcc += s.overallAccuracy ?? s.results.errorAnalysis?.accuracy ?? 80;
        totalStars += s.starsEarned ?? 3;
      });
      const avgAcc = Math.round(totalAcc / recentSessions.length);
      return {
        totalSessions,
        avgAccuracy: avgAcc,
        totalStars: totalStars || (currentChild?.stars ?? 36),
        streak: currentChild?.streak ?? 5,
        isDemo: false,
      };
    }

    return {
      totalSessions: 8,
      avgAccuracy: 76,
      totalStars: currentChild?.stars ?? 24,
      streak: currentChild?.streak ?? 4,
      isDemo: true,
    };
  }, [recentSessions, currentChild]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── TOP HEADER ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/(auth)/role-select')} activeOpacity={0.7}>
            <NenaManLogo size="sm" showText={false} />
          </TouchableOpacity>

          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
              {isTeacher ? (language === 'si' ? 'ගුරු පුවරුව' : 'Teacher Portal') : t('dashboard.parentTitle')}
            </AppText>
            <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
              {effectiveParentName} 👏
            </AppText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* 1-Click Switch to Child Account Mode */}
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
            <AppText size="xs" weight="extrabold" color="#047857" style={{ marginLeft: 4 }}>
              {language === 'si' ? 'ශිෂ්‍ය මාදිලිය' : 'Student'}
            </AppText>
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

          {/* Log Out Button */}
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
        {/* ── TEACHER CLASSROOM BANNER (IF APPLICABLE) ── */}
        {isTeacher && (
          <TouchableOpacity
            style={[styles.teacherPromoBanner, ThemeShadow.sm]}
            onPress={() => router.push('/(parent)/teacher')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="lg">🏫</AppText>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText size="sm" weight="extrabold" color="#1E3A8A">
                  {t('dashboard.teacherBanner.title')}
                </AppText>
                <AppText size="xs" color="#3B82F6" style={{ marginTop: 2 }}>
                  {t('dashboard.teacherBanner.desc')}
                </AppText>
              </View>
              <AppText size="sm" weight="extrabold" color="#1E3A8A">
                →
              </AppText>
            </View>
          </TouchableOpacity>
        )}

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
              {t('dashboard.tabs.overview')}
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
              {t('dashboard.tabs.students')} ({linkedStudents.length || 1})
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
              {t('dashboard.tabs.recommendations')}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── CARD 1: ACTIVE CHILD HERO CARD (PARENT-FOCUSED) ── */}
        <View style={[styles.childHeroCard, ThemeShadow.md]}>
          <View style={styles.childHeroTop}>
            <StudentAvatarPhoto size={56} showEditBadge={false} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {activeChildName}
                </AppText>
                <View style={styles.gradeBadge}>
                  <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                    {activeChildGrade} {language === 'si' ? 'ශ්‍රේණිය' : 'Grade'}
                  </AppText>
                </View>
              </View>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                {language === 'si' ? 'සිංහල කියවීමේ සහාය · මධ්‍යම මට්ටම' : 'Sinhala Reading Assistant · Medium Level'}
              </AppText>
            </View>
          </View>

          <View style={styles.childHeroActions}>
            <TouchableOpacity
              style={styles.practiceNowBtn}
              onPress={() => handleSwitchToChild()}
              activeOpacity={0.85}
            >
              <AppText size="xs" weight="extrabold" color="#FFFFFF">
                🚀 {language === 'si' ? 'අද කියවීමේ අභ්‍යාසයට පිවිසෙන්න' : 'Start Reading Exercise'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.connectOtherBtn}
              onPress={() => router.push('/(parent)/connect-student')}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                + {language === 'si' ? 'දරුවෙකු එක්කරන්න' : 'Link Child'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailReportQuickBtn}
              onPress={() => setShowEmailReportModal(true)}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color="#0369A1">
                📧 {language === 'si' ? 'PDF වාර්තාව' : 'PDF Report'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4 SUMMARY METRIC CARDS (REAL DYNAMIC SESSION METRICS) ── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: කියවූ සැසි */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <AppText size="md">📖</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('dashboard.metrics.totalSessions')}
              </AppText>
              <AppText size="xl" weight="extrabold" color="#047857">
                {stats.totalSessions}
              </AppText>
            </View>
          </View>

          {/* Card 2: නිරවද්‍යතාව */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <AppText size="md">🎯</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('dashboard.metrics.avgAccuracy')}
              </AppText>
              <AppText size="xl" weight="extrabold" color="#0369A1">
                {stats.avgAccuracy}%
              </AppText>
            </View>
          </View>

          {/* Card 3: තරු එකතුව */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <AppText size="md">⭐</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('dashboard.metrics.starsEarned')}
              </AppText>
              <AppText size="xl" weight="extrabold" color="#B45309">
                {stats.totalStars}
              </AppText>
            </View>
          </View>

          {/* Card 4: දින සටහන */}
          <View style={[styles.metricCard, ThemeShadow.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <AppText size="md">🔥</AppText>
            </View>
            <View style={{ marginLeft: 10 }}>
              <AppText size="xs" color={ThemeColors.textSecondary} weight="bold">
                {t('dashboard.metrics.currentStreak')}
              </AppText>
              <AppText size="xl" weight="extrabold" color="#DC2626">
                {stats.streak} {language === 'si' ? 'දින' : 'Days'}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── CARD 2: ACTIONABLE HOME PRACTICE GUIDANCE FOR PARENTS ── */}
        <View style={[styles.homeTipsCard, ThemeShadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="sm">🏡</AppText>
              <AppText size="md" weight="extrabold" color="#9A3412" style={{ marginLeft: 6 }}>
                {t('dashboard.homeTips.title')}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => router.push('/(parent)/reports')} activeOpacity={0.7}>
              <AppText size="xs" weight="bold" color="#C2410C">
                {t('dashboard.homeTips.viewGuide')}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.tipBox}>
            <AppText size="xs" weight="extrabold" color="#9A3412">
              1. {language === 'si' ? 'අකුරු පෙරලීම සහ කොම්බුව පිහිටීම (Reversal Support):' : 'Diacritic Sequencing Support:'}
            </AppText>
            <AppText size="xs" color="#7C2D12" style={{ marginTop: 2, lineHeight: 18 }}>
              {language === 'si'
                ? 'දරුවාට කොම්බුව සහිත අකුරු ලියන විට, කොම්බුව මුලින් තබා අකුර පසුව ලියන අනුපිළිවෙල ඇඟිල්ලෙන් ඇඳ පෙන්වන්න.'
                : 'Guide your child to trace the kombuwa stroke order in the air before reading words.'}
            </AppText>
          </View>

          <View style={[styles.tipBox, { marginTop: 8 }]}>
            <AppText size="xs" weight="extrabold" color="#9A3412">
              2. {language === 'si' ? 'දිගු ස්වර පැහැදිලිව උච්චාරණය (Vowel Length):' : 'Long Vowel Articulation:'}
            </AppText>
            <AppText size="xs" color="#7C2D12" style={{ marginTop: 2, lineHeight: 18 }}>
              {language === 'si'
                ? '"ගොඩක්" සහ "ගොඩාක්" අතර වෙනස හඳුනාගැනීමට "ඩා" ශබ්දය දිගු කර ශබ්ද කරන ලෙස දරුවාට සිනහමුසු මුහුණින් පෙන්වන්න.'
                : 'Practice distinguishing short and elongated vowel sounds like "ගොඩක්" vs "ගොඩාක්".'}
            </AppText>
          </View>
        </View>

        {/* ── CARD 3: AI ADAPTIVE RECOMMENDATION PREVIEW (MODULE 3) ── */}
        {aiInsight && (
          <View style={[styles.insightsCard, ThemeShadow.sm]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText size="sm">🧠</AppText>
                <AppText size="md" weight="extrabold" color={ThemeColors.primary} style={{ marginLeft: 6 }}>
                  {language === 'si' ? 'AI අනුවර්තී මගපෙන්වීම (Module 3)' : 'AI Adaptive Recommendation (M3)'}
                </AppText>
              </View>
              <View style={styles.confidenceBadge}>
                <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                  {aiInsight.confidencePercent}% {language === 'si' ? 'විශ්වාසය' : 'Match'}
                </AppText>
              </View>
            </View>

            <View style={styles.insightInnerBox}>
              <AppText size="xs" weight="extrabold" color="#0369A1">
                {language === 'si' ? aiInsight.title : aiInsight.recommendation}
              </AppText>
              <AppText size="xs" color="#0C4A6E" style={{ marginTop: 4, lineHeight: 18 }}>
                {language === 'si' ? aiInsight.plainLanguageReasonSi : aiInsight.plainLanguageReason}
              </AppText>
              <View style={styles.targetPhonemePill}>
                <AppText size="xs" weight="bold" color="#0369A1">
                  🎯 {language === 'si' ? 'ඉලක්කය:' : 'Target:'} {aiInsight.targetSkill}
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewRecsBtn}
              onPress={() => router.push('/(parent)/recommendations')}
              activeOpacity={0.85}
            >
              <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                {language === 'si' ? 'සම්පූර්ණ AI Roadmap එක බලන්න →' : 'Explore Learning Roadmap →'}
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* ── CARD 4: RECENT SESSIONS SUMMARY TABLE ── */}
        <View style={[styles.progressCard, ThemeShadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText size="sm">📜</AppText>
              <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                {t('dashboard.recentSessions.title')}
              </AppText>
            </View>

            <TouchableOpacity onPress={() => router.push('/(parent)/reports')} activeOpacity={0.7}>
              <AppText size="xs" weight="bold" color={ThemeColors.primary}>
                {t('dashboard.recentSessions.viewAll')}
              </AppText>
            </TouchableOpacity>
          </View>

          {recentSessions.length > 0 ? (
            <View style={{ gap: 8 }}>
              {recentSessions.slice(0, 3).map((sess, idx) => {
                const acc = sess.overallAccuracy ?? sess.results.errorAnalysis?.accuracy ?? 80;
                const dateStr = sess.createdAt ? new Date(sess.createdAt).toLocaleDateString() : 'අද දින';
                return (
                  <View key={sess.sessionId || idx} style={styles.sessionItemRow}>
                    <View style={{ flex: 1 }}>
                      <AppText size="xs" weight="extrabold" color={ThemeColors.textPrimary} numberOfLines={1}>
                        "{sess.textContent || 'මම මගේ රටට ආදරෙයි'}"
                      </AppText>
                      <AppText size="xs" color={ThemeColors.textMuted} style={{ marginTop: 2 }}>
                        {dateStr} · {sess.durationSeconds || 45}s · ⭐ {sess.starsEarned || 3}
                      </AppText>
                    </View>

                    <View style={[styles.accBadge, { backgroundColor: acc >= 75 ? '#DCFCE7' : '#FEF3C7' }]}>
                      <AppText size="xs" weight="extrabold" color={acc >= 75 ? '#047857' : '#B45309'}>
                        {acc}%
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptySessionsBox}>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ textAlign: 'center', lineHeight: 18 }}>
                {t('dashboard.recentSessions.empty')}
              </AppText>
              <TouchableOpacity
                style={styles.startSessionSmallBtn}
                onPress={() => handleSwitchToChild()}
                activeOpacity={0.8}
              >
                <AppText size="xs" weight="bold" color="#FFFFFF">
                  🚀 {language === 'si' ? 'අභ්‍යාසයක් අරඹමු' : 'Start Reading'}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
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
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText size="lg">👶</AppText>
                <View style={{ marginLeft: 10 }}>
                  <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                    {language === 'si' ? 'ශිෂ්‍ය ගිණුම තෝරන්න' : 'Select Student'}
                  </AppText>
                  <AppText size="xs" color={ThemeColors.textSecondary}>
                    {language === 'si' ? 'ඉගෙනුමට පිවිසීමට අවශ්‍ය දරුවා තෝරන්න:' : 'Choose which child to switch into:'}
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
                                ✓ {language === 'si' ? 'සක්‍රීයයි' : 'Active'}
                              </AppText>
                            </View>
                          )}
                        </View>
                        <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                          {child.grade || 2} {language === 'si' ? 'ශ්‍රේණිය' : 'Grade'} · {child.relationship || (language === 'si' ? 'ශිෂ්‍යයා' : 'Student')}
                        </AppText>
                      </View>

                      <View style={[styles.selectActionPill, isCurrent && { backgroundColor: '#059669' }]}>
                        <AppText size="xs" weight="extrabold" color="#FFFFFF">
                          {isCurrent ? (language === 'si' ? 'පිවිසෙන්න 🚀' : 'Switch 🚀') : (language === 'si' ? 'තෝරන්න 🚀' : 'Select 🚀')}
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowChildSelectModal(false)}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                {language === 'si' ? 'අවලංගු කරන්න (Cancel)' : 'Cancel'}
              </AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── EMAIL REPORT MODAL ── */}
      <EmailReportModal
        visible={showEmailReportModal}
        onClose={() => setShowEmailReportModal(false)}
        childId={activeChildId}
        childName={activeChildName}
        grade={activeChildGrade}
        sessions={recentSessions}
        m3Recommendation={rawM3}
      />
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
    borderBottomColor: ThemeColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: ThemeRadius.full,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
  },
  teacherPromoBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
  },
  tabPillsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: ThemeRadius.full,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: ThemeRadius.full,
  },
  tabPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  childHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
  },
  childHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeBadge: {
    backgroundColor: ThemeColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.full,
  },
  childHeroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: ThemeSpacing.md,
    paddingTop: ThemeSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  practiceNowBtn: {
    flex: 1,
    backgroundColor: ThemeColors.primary,
    paddingVertical: 10,
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
  },
  connectOtherBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: ThemeColors.primaryBorder,
    alignItems: 'center',
  },
  emailReportQuickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTipsCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.md,
  },
  tipBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#FDBA74',
    marginTop: 6,
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  confidenceBadge: {
    backgroundColor: ThemeColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ThemeRadius.full,
  },
  insightInnerBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: ThemeRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginVertical: 10,
  },
  targetPhonemePill: {
    marginTop: 6,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ThemeRadius.sm,
  },
  viewRecsBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.sm,
  },
  sessionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.sm,
  },
  emptySessionsBox: {
    paddingVertical: ThemeSpacing.md,
    alignItems: 'center',
    gap: 8,
  },
  startSessionSmallBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ThemeRadius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ThemeSpacing.md,
  },
  modalCloseBtn: {
    padding: 4,
  },
  childSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  childSelectCardActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  miniAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selectActionPill: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: ThemeSpacing.sm,
  },
});
