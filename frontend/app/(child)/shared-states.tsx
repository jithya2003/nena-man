import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ThemeColors,
  ThemeRadius,
  ThemeSpacing,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Button from '@/components/Button';
import NavBar from '@/components/NavBar';
import LoadingView from '@/components/LoadingView';
import ErrorView from '@/components/ErrorView';
import EmptyView from '@/components/EmptyView';
import OfflineBanner from '@/components/OfflineBanner';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/context/LanguageContext';

type DemoTab = 'loading' | 'error' | 'empty' | 'offline' | 'skeleton' | 'async';

export default function SharedStatesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState<DemoTab>('loading');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [forceOffline, setForceOffline] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Pop-up modal visibility states
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<boolean>(false);
  const [modalEmpty, setModalEmpty] = useState<boolean>(false);

  // useAsync simulator
  const [fetchScenario, setFetchScenario] = useState<'success' | 'empty' | 'error'>('success');
  const mockApiCall = async () => {
    await new Promise((r) => setTimeout(r, 1000));
    if (fetchScenario === 'error') {
      throw new Error('AI ගුරු හාමිනේ දැන් ක්‍රියා නොකරයි. මඳකින් ආයෙත් කරමු!');
    }
    if (fetchScenario === 'empty') {
      return [];
    }
    return [
      { id: 1, title: 'මගේ පළමු සිංහල කතාව 📖', level: '2 ශ්‍රේණිය' },
      { id: 2, title: 'කුරුල්ලන්ගේ ලෝකය 🦜', level: '2 ශ්‍රේණිය' },
    ];
  };

  const {
    data,
    isLoading: asyncLoading,
    isError: asyncError,
    isEmpty: asyncEmpty,
    reload: triggerAsync,
  } = useAsync(mockApiCall, { immediate: false });

  const triggerAlert = (msg: string) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(null), 3500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavBar
        title={isEn ? "Shared UI States" : "පොදු UI තත්ව (Shared States)"}
        showBack
        onBack={() => router.back()}
        showLanguagePill
      />

      {/* App-wide offline banner simulation */}
      <OfflineBanner
        forceShow={forceOffline}
        onRetry={() => {
          setForceOffline(false);
          triggerAlert(isEn ? 'Network reconnected successfully!' : 'නැවත සම්බන්ධ වීම සාර්ථකයි! (Network reconnected)');
        }}
      />

      {/* POP-UP MODALS FOR TESTING */}
      <LoadingView
        asModal
        visible={modalLoading}
        onClose={() => setModalLoading(false)}
        message={isEn ? "AI Reading Analysis in progress..." : "AI කියවීම් විශ්ලේෂණය සූදානම් වෙමින් පවතී..."}
        subtitle={isEn ? "Please wait a moment... (Loading Modal Pop-up)" : "මඳක් රැඳෙන්න... (Loading Modal Pop-up)"}
      />

      <ErrorView
        asModal
        visible={modalError}
        onClose={() => setModalError(false)}
        title={isEn ? "Oops! A small hiccup" : "අයියෝ! පුංචි ගැටලුවක්"}
        message={isEn ? "Voice recording analysis failed. Don't worry, let's try again!" : "ශ්‍රව්‍ය පටිගත කිරීම විශ්ලේෂණය කිරීමට නොහැකි විය. ඒකට කමක් නෑ, අපි ආයෙත් කරමු!"}
        onRetry={() => {
          setModalError(false);
          triggerAlert(isEn ? 'Retry clicked from Pop-up!' : 'Pop-up එකෙන් Retry බොත්තම click විය!');
        }}
        retryLabel={isEn ? "Try Again 🚀" : "නැවත කරමු 🚀"}
        secondaryLabel={isEn ? "Close" : "වසන්න"}
        onSecondaryAction={() => setModalError(false)}
      />

      <EmptyView
        asModal
        visible={modalEmpty}
        onClose={() => setModalEmpty(false)}
        title={isEn ? "No reading sessions yet!" : "තවම කියවීමේ සැසි නැත!"}
        message={isEn ? "Let's read a fun story and collect stars today!" : "අදම අලුත් ලස්සන කතාවක් කියවා තරු එකතු කරමු!"}
        actionLabel={isEn ? "Read a Story 📖" : "කතාවක් කියවමු 📖"}
        onAction={() => {
          setModalEmpty(false);
          triggerAlert(isEn ? 'Read a story clicked from Pop-up!' : 'Pop-up එකෙන් කතාවක් කියවමු click විය!');
        }}
        secondaryActionLabel={isEn ? "Close" : "වසන්න"}
        onSecondaryAction={() => setModalEmpty(false)}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentConstrained}>
          {/* Banner Info */}
          <View style={styles.infoBanner}>
            <View style={styles.infoIconBox}>
              <AppText size="lg">🌟</AppText>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                {isEn ? 'Dyslexia-Friendly UI States' : 'ළමා හිතකාමී සාමාන්‍ය දර්ශන'}
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                {isEn
                  ? 'Calming animated mascots, pastel tones & friendly pop-ups for young readers:'
                  : 'අවුරුදු 7-8 ළමුන් ආසා කරන animated characters සහ pop-ups:'}
              </AppText>
            </View>
          </View>

          {/* Action toast */}
          {actionAlert ? (
            <View style={styles.toast}>
              <AppText size="xs" weight="bold" color="#065F46">
                ✨ {actionAlert}
              </AppText>
            </View>
          ) : null}

          {/* Tab Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {(
              [
                { id: 'loading', label: isEn ? '🔄 Loading' : '🔄 රැඳෙන්න' },
                { id: 'error', label: isEn ? '⚠️ Error' : '⚠️ දෝෂය' },
                { id: 'empty', label: isEn ? '📦 Empty' : '📦 හිස් විට' },
                { id: 'offline', label: isEn ? '📡 Offline' : '📡 ජාලය නෑ' },
                { id: 'skeleton', label: isEn ? '🦴 Skeleton' : '🦴 රෝකඩ' },
                { id: 'async', label: isEn ? '⚡ useAsync' : '⚡ ස්වයං-දත්ත' },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  activeTab === tab.id && styles.tabItemActive,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <AppText
                  size="sm"
                  weight={activeTab === tab.id ? 'bold' : 'medium'}
                  color={
                    activeTab === tab.id ? '#FFFFFF' : ThemeColors.textSecondary
                  }
                >
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Preview Container */}
          <View style={styles.previewBox}>
            {/* TAB 1: LOADING */}
            {activeTab === 'loading' && (
              <View style={styles.demoSection}>
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={styles.popupTriggerBtn}
                    onPress={() => setModalLoading(true)}
                    activeOpacity={0.8}
                  >
                    <AppText size="xs" weight="extrabold" color="#065F46">
                      {isEn ? '✨ Test Pop-up Modal' : '✨ උත්පතන ලෙස දිස්වෙන්නද?'}
                    </AppText>
                  </TouchableOpacity>

                  <Button
                    label={isCompact ? (isEn ? 'Full Screen' : 'විශාල තිරය') : (isEn ? 'Card View' : 'කාඩ්පත')}
                    size="sm"
                    variant="secondary"
                    onPress={() => setIsCompact(!isCompact)}
                  />
                </View>

                <View style={styles.componentWrapper}>
                  <LoadingView
                    variant={isCompact ? 'card' : 'fullscreen'}
                    message={isEn ? "Preparing reading text..." : "කියවීම් පාඨය සකස් වෙමින් පවතී..."}
                    subtitle={isEn ? "Please wait a moment (Nena-Man AI Assistant)" : "කරුණාකර මඳක් රැඳෙන්න (නැණ මං AI සහායකයා)"}
                  />
                </View>

                <View style={styles.codeSnippet}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {isEn ? '👨‍💻 Usage in other screens:' : '👨‍💻 වෙනත් screen වල භාවිත කිරීමට:'}
                  </AppText>
                  <AppText size="xs" color="#065F46" style={styles.codeText}>
                    {'<LoadingView asModal visible={isLoading} />'}
                  </AppText>
                </View>
              </View>
            )}

            {/* TAB 2: ERROR */}
            {activeTab === 'error' && (
              <View style={styles.demoSection}>
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={[styles.popupTriggerBtn, { backgroundColor: '#FFE4E6', borderColor: '#FDA4AF' }]}
                    onPress={() => setModalError(true)}
                    activeOpacity={0.8}
                  >
                    <AppText size="xs" weight="extrabold" color="#9F1239">
                      {isEn ? '✨ Test Pop-up Modal' : '✨ උත්පතන ලෙස දිස්වෙන්නද?'}
                    </AppText>
                  </TouchableOpacity>

                  <Button
                    label={isCompact ? (isEn ? 'Full Screen' : 'විශාල තිරය') : (isEn ? 'Card View' : 'කාඩ්පත')}
                    size="sm"
                    variant="secondary"
                    onPress={() => setIsCompact(!isCompact)}
                  />
                </View>

                <View style={styles.componentWrapper}>
                  <ErrorView
                    compact={isCompact}
                    title={isEn ? "Oops! A small hiccup" : "අයියෝ! පුංචි ගැටලුවක්"}
                    message={isEn ? "Voice recording analysis failed. Don't worry, let's try again!" : "ශ්‍රව්‍ය පටිගත කිරීම විශ්ලේෂණය කිරීමට නොහැකි විය. ඒකට කමක් නෑ, අපි ආයෙත් කරමු!"}
                    onRetry={() => triggerAlert(isEn ? 'Retry clicked!' : 'නැවත උත්සාහ කරන්න Click විය!')}
                    retryLabel={isEn ? "Try Again 🚀" : "නැවත කරමු 🚀"}
                    secondaryLabel={isEn ? "Later" : "පසුව කරමු"}
                    onSecondaryAction={() => triggerAlert(isEn ? 'Later clicked!' : 'පසුව කරමු Click විය!')}
                  />
                </View>

                <View style={styles.codeSnippet}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {isEn ? '👨‍💻 Usage in other screens:' : '👨‍💻 වෙනත් screen වල භාවිත කිරීමට:'}
                  </AppText>
                  <AppText size="xs" color="#065F46" style={styles.codeText}>
                    {'<ErrorView asModal visible={hasError} onRetry={handleRetry} onClose={hideModal} />'}
                  </AppText>
                </View>
              </View>
            )}

            {/* TAB 3: EMPTY */}
            {activeTab === 'empty' && (
              <View style={styles.demoSection}>
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={[styles.popupTriggerBtn, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}
                    onPress={() => setModalEmpty(true)}
                    activeOpacity={0.8}
                  >
                    <AppText size="xs" weight="extrabold" color="#92400E">
                      {isEn ? '✨ Test Pop-up Modal' : '✨ උත්පතන ලෙස දිස්වෙන්නද?'}
                    </AppText>
                  </TouchableOpacity>

                  <Button
                    label={isCompact ? (isEn ? 'Full Screen' : 'විශාල තිරය') : (isEn ? 'Card View' : 'කාඩ්පත')}
                    size="sm"
                    variant="secondary"
                    onPress={() => setIsCompact(!isCompact)}
                  />
                </View>

                <View style={styles.componentWrapper}>
                  <EmptyView
                    compact={isCompact}
                    title={isEn ? "No reading sessions yet!" : "තවම කියවීමේ සැසි නැත!"}
                    message={isEn ? "You haven't completed any reading sessions yet. Let's read a fun story and collect stars today!" : "ඔබ තවමත් කිසිදු කියවීමක් සිදුකර නැත. අදම අලුත් ලස්සන කතාවක් කියවා තරු එකතු කරමු!"}
                    actionLabel={isEn ? "Read a Story 📖" : "කතාවක් කියවමු 📖"}
                    onAction={() => triggerAlert(isEn ? 'Read a story clicked!' : 'කතාවක් කියවමු බොත්තම click විය!')}
                  />
                </View>

                <View style={styles.codeSnippet}>
                  <AppText size="xs" weight="bold" color={ThemeColors.textPrimary}>
                    {isEn ? '👨‍💻 Usage in other screens:' : '👨‍💻 වෙනත් screen වල භාවිත කිරීමට:'}
                  </AppText>
                  <AppText size="xs" color="#065F46" style={styles.codeText}>
                    {'<EmptyView asModal visible={isEmpty} actionLabel="Start Reading" onAction={startReading} />'}
                  </AppText>
                </View>
              </View>
            )}

            {/* TAB 4: OFFLINE BANNER */}
            {activeTab === 'offline' && (
              <View style={styles.demoSection}>
                <View style={styles.offlineBox}>
                  <AppText size="md" weight="bold" color={ThemeColors.textPrimary}>
                    {isEn ? '📡 Offline Status Alert' : '📡 ජාලය නැති විට පෙන්වෙන ඇඟවීම'}
                  </AppText>
                  <AppText
                    size="sm"
                    color={ThemeColors.textSecondary}
                    style={{ marginTop: 4, marginBottom: 14 }}
                  >
                    {isEn
                      ? 'Smoothly slides in from the top when internet connection is lost:'
                      : 'අන්තර්ජාලය නැති වූ සැණින් ඉහළින් ලස්සනට slide වෙමින් දිස්වෙන ඇඟවීමේ පටි:'}
                  </AppText>

                  <Button
                    label={
                      forceOffline
                        ? (isEn ? 'Network Reconnected (Reset)' : 'ජාලය ඇත (ක්‍රිය නිම කරන්න)')
                        : (isEn ? 'Simulate Disconnect' : 'ජාලය නොමැතිව සිමුලේෂනය කරන්න')
                    }
                    variant={forceOffline ? 'primary' : 'danger'}
                    onPress={() => setForceOffline(!forceOffline)}
                  />
                </View>

                <View style={{ marginTop: 20 }}>
                  <AppText size="sm" weight="bold" color={ThemeColors.textPrimary}>
                    📋 ඇඟවීමේ නිදසුනක් බලන්න:
                  </AppText>
                  <View style={{ marginTop: 8 }}>
                    <OfflineBanner
                      forceShow={true}
                      onRetry={() => triggerAlert('Banner එකේ retry click විය!')}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* TAB 5: SKELETON LOADER */}
            {activeTab === 'skeleton' && (
              <View style={styles.demoSection}>
                <AppText size="md" weight="bold" color={ThemeColors.textPrimary}>
                  {isEn ? '🦴 Dyslexia-Calming Skeletons & Reading Worm' : '🦴 දත්ත ලැබෙන තෙක් දිස්වෙන රෝකඩ සිතුවම්'}
                </AppText>
                <AppText
                  size="sm"
                  color={ThemeColors.textSecondary}
                  style={{ marginTop: 4, marginBottom: 16 }}
                >
                  {isEn
                    ? 'Gentle pastel pulse animations with a cute reading worm character:'
                    : 'ළමා යෙදුමට ගැළපෙන, animated placeholder සිතුවම්:'}
                </AppText>

                <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginBottom: 6 }}>
                  {isEn ? '①  Text Skeleton with Worm:' : '①  පාඨ රෝකඩ:'}
                </AppText>
                <SkeletonLoader.Text lines={3} showCharacter style={{ marginBottom: 18 }} />

                <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginBottom: 6 }}>
                  {isEn ? '②  Card Skeleton:' : '②  කාඩ්පත් රෝකඩ:'}
                </AppText>
                <SkeletonLoader.Card height={130} showCharacter style={{ marginBottom: 18 }} />

                <AppText size="xs" weight="bold" color={ThemeColors.primary} style={{ marginBottom: 6 }}>
                  {isEn ? '③  List Item Skeleton:' : '③  ලැයිස්තු රෝකඩ:'}
                </AppText>
                <SkeletonLoader.ListItem showCharacter />
              </View>
            )}

            {/* TAB 6: USEASYNC HOOK */}
            {activeTab === 'async' && (
              <View style={styles.demoSection}>
                <AppText size="md" weight="bold" color={ThemeColors.textPrimary}>
                  {isEn ? '⚡ Automated State Transition (useAsync)' : '⚡ ස්වයං-දත්ත සහායකයා'}
                </AppText>
                <AppText
                  size="sm"
                  color={ThemeColors.textSecondary}
                  style={{ marginTop: 4, marginBottom: 12 }}
                >
                  {isEn
                    ? 'Loading → Error → Empty → Success automated flow:'
                    : 'රැඳෙන්න → දෝෂය → දත්ත නැත → දත්ත — ස්වයංක්‍රීයව මාරු වෙන සහායකයා:'}
                </AppText>

                <View style={styles.scenarioRow}>
                  {(['success', 'empty', 'error'] as const).map((sc) => (
                    <TouchableOpacity
                      key={sc}
                      onPress={() => setFetchScenario(sc)}
                      style={[
                        styles.scenarioPill,
                        fetchScenario === sc && styles.scenarioPillActive,
                      ]}
                    >
                      <AppText
                        size="xs"
                        weight="bold"
                        color={fetchScenario === sc ? '#FFFFFF' : ThemeColors.textPrimary}
                      >
                        {sc === 'success'
                          ? (isEn ? '✅ With Data' : '✅ දත්ත ඇති විට')
                          : sc === 'empty'
                          ? (isEn ? '📦 Empty' : '📦 දත්ත නැති විට')
                          : (isEn ? '⚠️ Error' : '⚠️ දෝෂ ඇති විට')}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button
                  label={isEn ? "Fetch Data 🚀" : "දත්ත ලබා ගන්නවා 🚀"}
                  onPress={() => triggerAsync()}
                  style={{ marginBottom: 16 }}
                />

                <View style={styles.asyncContainer}>
                  {asyncLoading ? (
                    <LoadingView variant="card" message={isEn ? "Fetching data... 🔄" : "දත්ත ලබා ගෙනෙමින් පවතී... 🔄"} />
                  ) : asyncError ? (
                    <ErrorView
                      compact
                      message={isEn ? "Failed to fetch data" : "දත්ත ලබා ගැනීමට නොහැකි විය"}
                      onRetry={triggerAsync}
                    />
                  ) : asyncEmpty ? (
                    <EmptyView
                      compact
                      title={isEn ? "No data found" : "දත්ත කිසිවක් නැත"}
                      message={isEn ? "No items found in the list." : "ලැයිස්තුවේ කිසිදු අයිතමයක් හමු නොවීය."}
                      actionLabel={isEn ? "Try Again" : "නැවත බලන්න"}
                      onAction={triggerAsync}
                    />
                  ) : data && data.length > 0 ? (
                    <View style={styles.dataCard}>
                      <AppText size="sm" weight="bold" color={ThemeColors.primary}>
                        {isEn ? '🎉 Success! Available Stories:' : '🎉 ගෙනාවා! කියවිය හැකි කතා:'}
                      </AppText>
                      {data.map((item: any) => (
                        <View key={item.id} style={styles.dataRow}>
                          <AppText size="sm" weight="semibold">
                            • {item.title}
                          </AppText>
                          <AppText size="xs" color={ThemeColors.textMuted}>
                            ({item.level})
                          </AppText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <AppText size="xs" color={ThemeColors.textMuted} align="center">
                      {isEn ? '⬆️ Tap the button above to test states!' : '⬆️ ඉහත බොත්තම ඔබා අත්හදා බලන්න!'}
                    </AppText>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
  },
  container: {
    padding: ThemeSpacing.md,
    paddingBottom: ThemeSpacing.xxl,
    alignItems: 'center',
  },
  contentConstrained: {
    width: '100%',
    maxWidth: 640,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: ThemeSpacing.md,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#B2E2C3',
    borderBottomWidth: 4,
    borderBottomColor: '#059669',
    marginBottom: ThemeSpacing.md,
    ...ThemeShadow.sm,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.sm,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: ThemeSpacing.md,
    paddingVertical: 4,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#E2ECE6',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  tabItemActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
    borderBottomColor: '#064E2A',
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2ECE6',
    borderBottomWidth: 4,
    borderBottomColor: '#CBD5E1',
    padding: ThemeSpacing.lg,
    ...ThemeShadow.sm,
    minHeight: 460,
  },
  demoSection: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
    gap: 8,
  },
  popupTriggerBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderBottomColor: '#6EE7B7',
    borderRadius: ThemeRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  componentWrapper: {
    minHeight: 300,
    justifyContent: 'center',
  },
  codeSnippet: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 16,
    padding: ThemeSpacing.sm + 4,
    marginTop: ThemeSpacing.lg,
  },
  codeText: {
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    lineHeight: 18,
  },
  offlineBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: ThemeSpacing.md,
  },
  scenarioRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  scenarioPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: ThemeRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scenarioPillActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primaryDark,
  },
  asyncContainer: {
    minHeight: 180,
    justifyContent: 'center',
  },
  dataCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 16,
    padding: ThemeSpacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
});
