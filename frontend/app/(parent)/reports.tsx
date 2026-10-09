import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import {
  MOCK_CHILD,
  MOCK_SESSIONS,
  MOCK_ERROR_BREAKDOWN,
  MOCK_M3_RESPONSE,
} from '@/mock/data';
import { BehaviorBadge } from '@/components/Badge';
import AppText from '@/components/AppText';
import Card from '@/components/Card';
import ProgressBar from '@/components/ProgressBar';
import NavBar from '@/components/NavBar';
import M3RecommendationCard from '@/components/M3RecommendationCard';
import EmailReportModal from '@/components/EmailReportModal';
import { sessionService } from '@/services/sessionService';
import { recommendationService } from '@/services/recommendationService';
import { useCurrentChild, useAuthStore } from '@/store/hooks';
import { useLanguage } from '@/context/LanguageContext';
import type { SessionData, M3Response, ReadingSessionRecord } from '@/types';

export default function ReportsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [sessions, setSessions] = useState<SessionData[]>(MOCK_SESSIONS);
  const [rawSessions, setRawSessions] = useState<ReadingSessionRecord[]>([]);
  const [m3Data, setM3Data] = useState<M3Response>(MOCK_M3_RESPONSE);
  const [isRealData, setIsRealData] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { currentChild } = useCurrentChild();
  const { user } = useAuthStore();

  const activeChildName = currentChild?.name || user?.name || (language === 'si' ? 'සෙනුලි පෙරේරා' : 'Senuli Perera');
  const activeChildGrade = currentChild?.grade || 2;
  const activeChildId = currentChild?.id || user?.uid || 'child_default';

  const ERROR_DETAIL = {
    substitution: {
      label: language === 'si' ? 'ආදේශන දෝෂ (Substitution)' : 'Substitution Errors',
      icon: '🔄',
      description: language === 'si'
        ? 'දරුවා වචනයක් වෙනුවට වෙනත් වචනයක් හෝ ශබ්දයක් ආදේශ කර කියවීම (උදා: "ගස" වෙනුවට "ගස්" කීම).'
        : 'Child replaces a word with a different word (e.g. says "ගස්" instead of "ගස").',
      tip: language === 'si'
        ? '🏡 ගෙදරදී උපදෙස්: ඉලක්කගත වචනය අක්ෂර/මාත්‍රා වලට කඩා (Syllable split) වෙන වෙනම සෙමින් කියවන්න.'
        : '🏡 Home Tip: Practice the target word in isolation with syllable split, then in short context.',
      color: ThemeColors.m1,
      bg: ThemeColors.m1Surface,
      border: ThemeColors.border,
    },
    omission: {
      label: language === 'si' ? 'මඟහැරීම් දෝෂ (Omission)' : 'Omission Errors',
      icon: '❌',
      description: language === 'si'
        ? 'ශබ්ද නගා කියවීමේදී අකුරු, පිල්ලම් හෝ සම්පූර්ණ වචන මඟහැරීම.'
        : 'Child skips a word or syllable while reading aloud.',
      tip: language === 'si'
        ? '🏡 ගෙදරදී උපදෙස්: ඇඟිල්ල හෝ පාලකය (Ruler/Finger-pointer) තබා අකුරෙන් අකුර පෙන්වමින් කියවීමට හුරු කරන්න.'
        : '🏡 Home Tip: Use finger-pointing or a bookmark tracker to follow each character.',
      color: ThemeColors.error,
      bg: ThemeColors.errorSurface,
      border: ThemeColors.errorBorder,
    },
    reversal: {
      label: language === 'si' ? 'අකුරු පෙරලීම (Reversal)' : 'Reversal Errors',
      icon: '↩️',
      description: language === 'si'
        ? 'කොම්බුව, ඇලපිල්ල හෝ අකුරු පිළිවෙළ මාරු කර කියවීම (උදා: කොම්බුව අකුරට පසුපසින් කියවීම).'
        : 'Child reverses letter order or Sinhala syllable modifiers (kombuwa/al-lakuna).',
      tip: language === 'si'
        ? '🏡 ගෙදරදී උපදෙස්: අහසේ හෝ වැලි පිඟානක ඇඟිල්ලෙන් අකුරේ හැඩය සහ කොම්බුව මුලින් ලියන පිළිවෙල පුහුණු කරන්න.'
        : '🏡 Home Tip: Use air-writing or sand tray tracing to reinforce the left-to-right modifier sequence.',
      color: ThemeColors.warning,
      bg: ThemeColors.warningSurface,
      border: ThemeColors.warningBorder,
    },
    hesitation: {
      label: language === 'si' ? 'චකිතය හා දීර්ඝ නැවතීම් (Hesitation)' : 'Hesitation & Pauses',
      icon: '⏸️',
      description: language === 'si'
        ? 'වචනයක් හඳුනාගැනීමට අපහසු වී තත්පර 2කට වඩා දීර්ඝ ලෙස නිහඬව සිටීම.'
        : 'Child pauses significantly before or during a word due to cognitive load.',
      tip: language === 'si'
        ? '🏡 ගෙදරදී උපදෙස්: පින්තූර ආශ්‍රිත ඉඟි ලබා දෙමින් දරුවාගේ ආත්ම විශ්වාසය නංවන්න. කියවීමට බල නොකරන්න.'
        : '🏡 Home Tip: Reduce sentence complexity; use picture cues and praise reading attempts.',
      color: ThemeColors.info,
      bg: ThemeColors.infoSurface,
      border: ThemeColors.infoBorder,
    },
  };

  const totalErrors = Object.values(MOCK_ERROR_BREAKDOWN).reduce((a, b) => a + b, 0);

  useEffect(() => {
    async function loadSessions() {
      try {
        const records = await sessionService.getChildSessions(activeChildId, 15);
        if (records && records.length > 0) {
          const mapped = records.map((r) => sessionService.toSessionData(r));
          setSessions(mapped);
          setRawSessions(records);
          setIsRealData(true);

          const rec = await recommendationService.getNextRecommendation(activeChildId, records[0]);
          setM3Data(rec);
        } else {
          const rec = await recommendationService.getNextRecommendation(activeChildId, null);
          setM3Data(rec);
        }
      } catch (err) {
        console.warn('[ReportsScreen] Error loading real sessions:', err);
      }
    }
    loadSessions();
  }, [activeChildId]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Top Navigation */}
      <NavBar
        title={language === 'si' ? 'සායනික කියවීමේ වාර්තාව' : 'Clinical Reading Report'}
        subtitle={`${activeChildName} · ${sessions.length} ${language === 'si' ? 'සැසි' : 'Sessions'} ${isRealData ? (language === 'si' ? '(සජීවී දත්ත)' : '(Live Sync)') : ''}`}
        showBack={true}
        fallbackRoute="/(parent)/dashboard"
        showSettings={true}
        showLogout={false}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Child Profile Quick Bar */}
        <View style={styles.childHeaderCard}>
          <View style={styles.childAvatar}>
            <AppText size="lg" weight="bold" color={ThemeColors.textPrimary}>
              {activeChildName.charAt(0)}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
              {activeChildName} — {language === 'si' ? 'ප්‍රගති වාර්තාව' : 'Progress Report'}
            </AppText>
            <AppText size="xs" color={ThemeColors.textSecondary}>
              {activeChildGrade} {language === 'si' ? 'ශ්‍රේණිය · මව්භාෂාව: සිංහල' : 'Grade · Sinhala Dyslexia Support'}
            </AppText>
          </View>
          <TouchableOpacity
            style={styles.backDashBtn}
            onPress={() => router.replace('/(parent)/dashboard')}
            activeOpacity={0.7}
          >
            <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
              ← {language === 'si' ? 'පුවරුවට' : 'Dashboard'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── PDF EMAIL PROGRESS REPORT PROMO CARD ── */}
        <View style={[styles.pdfPromoCard, ThemeShadow.sm]}>
          <View style={styles.pdfPromoInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.pdfIconCircle}>
                <AppText size="lg">📄</AppText>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <AppText size="sm" weight="extrabold" color="#0B7A44">
                  {language === 'si' ? 'සතිපතා / මාසික PDF වාර්තාව' : 'Weekly / Monthly PDF Report'}
                </AppText>
                <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2, lineHeight: 17 }}>
                  {language === 'si'
                    ? 'දරුවාගේ සම්පූර්ණ ප්‍රගතිය PDF ලෙස බාගත කරගන්න හෝ ඊමේල් ලිපිනයට ස්වයංක්‍රීයව යවා ගන්න.'
                    : 'Download full progress report as PDF or auto-dispatch to parent/teacher inbox.'}
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.openPdfModalBtn}
              onPress={() => setShowEmailModal(true)}
              activeOpacity={0.8}
            >
              <AppText size="xs" weight="extrabold" color="#FFFFFF">
                📧 {language === 'si' ? 'වාර්තාව ලබාගන්න' : 'Get PDF Report'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── M3 Adaptive Recommendation & XAI Guidance ──────────────── */}
        <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          🧠 {language === 'si' ? 'AI අනුවර්තී මගපෙන්වීම සහ XAI විග්‍රහය' : 'AI Adaptive Recommendation & Explainable AI'}
        </AppText>
        <M3RecommendationCard data={m3Data} showLauncher={false} />

        {/* Error Deep-Dive */}
        <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          📊 {language === 'si' ? 'දෝෂ වර්ගීකරණය සහ ගෙදරදී කළ හැකි අභ්‍යාස' : 'Error Classification & Home Intervention Tips'}
        </AppText>
        {(
          Object.entries(ERROR_DETAIL) as [
            keyof typeof ERROR_DETAIL,
            (typeof ERROR_DETAIL)[keyof typeof ERROR_DETAIL],
          ][]
        ).map(([key, meta]) => {
          const count = MOCK_ERROR_BREAKDOWN[key as keyof typeof MOCK_ERROR_BREAKDOWN] ?? 0;
          return (
            <Card
              key={key}
              style={[
                styles.errorDetailCard,
                { borderLeftWidth: 4, borderLeftColor: meta.color },
              ]}
            >
              <View style={styles.errorDetailHeader}>
                <View
                  style={[
                    styles.errorDetailBadge,
                    { backgroundColor: meta.bg, borderColor: meta.border },
                  ]}
                >
                  <AppText size="sm">{meta.icon}</AppText>
                  <AppText size="xs" weight="bold" color={meta.color}>
                    {meta.label}
                  </AppText>
                </View>
                <AppText size="xl" weight="extrabold" color={meta.color}>
                  {count}
                </AppText>
              </View>
              <ProgressBar
                value={(count / totalErrors) * 100}
                color={meta.color}
                height={6}
              />
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: ThemeSpacing.sm, lineHeight: 18 }}>
                {meta.description}
              </AppText>
              <View style={styles.tipBox}>
                <AppText size="xs" color="#9A3412" style={{ flex: 1, lineHeight: 18, fontWeight: '600' }}>
                  {meta.tip}
                </AppText>
              </View>
            </Card>
          );
        })}

        {/* Session-by-Session Breakdown */}
        <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary} style={styles.sectionTitle}>
          📜 {language === 'si' ? 'සැසි අනුව විස්තරාත්මක ඉතිහාසය' : 'Session History'} {isRealData && (language === 'si' ? '☁️ (සජීවී වාර්තා)' : '☁️ (Live Synced)')}
        </AppText>
        {sessions.map((s) => (
          <Card key={s.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                {s.date}
              </AppText>
              <BehaviorBadge state={s.behaviorState} />
            </View>
            <View style={styles.sessionStats}>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {s.accuracy}%
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  {language === 'si' ? 'නිරවද්‍යතාව' : 'Accuracy'}
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {s.errorCount}
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  {language === 'si' ? 'දෝෂ ගණන' : 'Errors'}
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="md" weight="extrabold" color={ThemeColors.textPrimary}>
                  {Math.round(s.durationSeconds / 60)}m
                </AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  {language === 'si' ? 'කාලය' : 'Duration'}
                </AppText>
              </View>
              <View style={styles.sessionStat}>
                <AppText size="sm">{'⭐'.repeat(s.starsEarned)}</AppText>
                <AppText size="xs" color={ThemeColors.textMuted}>
                  {language === 'si' ? 'තරු' : 'Stars'}
                </AppText>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: ThemeSpacing.xl }} />
      </ScrollView>

      {/* ── EMAIL REPORT MODAL ── */}
      <EmailReportModal
        visible={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        childId={activeChildId}
        childName={activeChildName}
        grade={activeChildGrade}
        sessions={rawSessions}
        m3Recommendation={m3Data}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scroll: {
    padding: ThemeSpacing.md,
    gap: ThemeSpacing.md,
  },
  childHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 12,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ThemeColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ThemeColors.primaryBorder,
  },
  backDashBtn: {
    backgroundColor: ThemeColors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ThemeRadius.md,
  },
  pdfPromoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: ThemeRadius.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    padding: ThemeSpacing.md,
  },
  pdfPromoInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pdfIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPdfModalBtn: {
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: ThemeRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginTop: ThemeSpacing.sm,
  },
  errorDetailCard: {
    padding: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 8,
  },
  errorDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ThemeRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  tipBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 10,
    borderRadius: ThemeRadius.md,
    marginTop: 4,
  },
  sessionCard: {
    padding: ThemeSpacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.lg,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.borderLight,
    paddingTop: 8,
  },
  sessionStat: {
    alignItems: 'center',
  },
});
