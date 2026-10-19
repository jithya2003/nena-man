/**
 * nena-man · frontend/components/ReadingTextSelectModal.tsx
 * Modal dialog allowing the child/parent to select reading text:
 * Option A: Select from available reading items (words / short sentences)
 * Option B: Enter custom Sinhala text with basic validation
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from './AppText';
import {
  getReadingTextOptions,
  ReadingTextOption,
} from '@/services/readingTextService';
import { useAuth } from '@/context/AuthContext';
import { useChildStoreBase } from '@/store/childStore';

interface ReadingTextSelectModalProps {
  visible: boolean;
  onClose: () => void;
  selectedText: string;
  onSelectText: (
    text: string,
    optionId?: string,
    gradeLevel?: 1 | 2 | 3,
    textType?: 'word' | 'short sentence'
  ) => void;
}

export default function ReadingTextSelectModal({
  visible,
  onClose,
  selectedText,
  onSelectText,
}: ReadingTextSelectModalProps) {
  const { user } = useAuth();
  const currentChild = useChildStoreBase((s) => s.currentChild);

  // Real existing profile field representing the logged-in child's grade
  // Checked in priority: user.grade -> currentChild.grade
  const rawProfileGrade = user?.grade ?? currentChild?.grade;
  const profileGrade: 1 | 2 | 3 | null =
    rawProfileGrade === 1 || rawProfileGrade === 2 || rawProfileGrade === 3
      ? (rawProfileGrade as 1 | 2 | 3)
      : null;

  const [activeTab, setActiveTab] = useState<'list' | 'custom'>('list');
  const [filterType, setFilterType] = useState<'all' | 'word' | 'short_sentence'>('all');
  const [customInput, setCustomInput] = useState('');
  const [customTextType, setCustomTextType] = useState<'word' | 'short sentence'>('word');
  const [hasManuallySelectedType, setHasManuallySelectedType] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const readingOptions = getReadingTextOptions();

  const filteredOptions = readingOptions.filter((opt) => {
    if (filterType === 'all') return true;
    return opt.textType === filterType;
  });

  const handleSelectOption = (opt: ReadingTextOption) => {
    const mappedType: 'word' | 'short sentence' =
      opt.textType === 'word' ? 'word' : 'short sentence';
    onSelectText(opt.text, opt.id, opt.gradeLevel as 1 | 2 | 3, mappedType);
    onClose();
  };

  const handleCustomInputChange = (val: string) => {
    setCustomInput(val);
    if (validationError) setValidationError(null);

    // Auto-infer text type if child hasn't explicitly changed it
    if (!hasManuallySelectedType) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        setCustomTextType('short sentence');
      } else {
        setCustomTextType('word');
      }
    }
  };

  const handleConfirmCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) {
      setValidationError('කරුණාකර සිංහල වචනයක් හෝ කෙටි වාක්‍යයක් ඇතුළත් කරන්න.');
      return;
    }

    // Basic Sinhala unicode character check (\u0D80-\u0DFF)
    const hasSinhalaChar = /[\u0D80-\u0DFF]/.test(trimmed);
    if (!hasSinhalaChar) {
      setValidationError('කරුණාකර සිංහල අකුරු පමණක් භාවිතා කර ලියන්න.');
      return;
    }

    if (!profileGrade) {
      setValidationError('කරුණාකර පළමුව ඔබගේ පැතිකඩෙහි (Profile) ශ්‍රේණිය (Grade 1-3) සකසන්න.');
      return;
    }

    setValidationError(null);
    /**
     * PROTOTYPE ASSUMPTION:
     * Custom text lacks educational-source grade metadata. For prototype inference,
     * the logged-in child's profile grade is used as the intended reading-grade proxy.
     * (Not an expert-inferred text grade).
     */
    onSelectText(trimmed, `custom_${Date.now()}`, profileGrade, customTextType);
    setCustomInput('');
    setHasManuallySelectedType(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, ThemeShadow.lg]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <AppText size="md" weight="extrabold" color={ThemeColors.primary}>
                📖 කියවීම සඳහා පාඨයක් තෝරන්න
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 2 }}>
                ලැයිස්තුවෙන් තෝරන්න හෝ නව පාඨයක් ඇතුළත් කරන්න
              </AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <AppText size="md" color={ThemeColors.textMuted} weight="bold">
                ✕
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Section Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('list');
                setValidationError(null);
              }}
              activeOpacity={0.8}
            >
              <AppText
                size="xs"
                weight="bold"
                color={activeTab === 'list' ? ThemeColors.primary : ThemeColors.textSecondary}
              >
                📚 ලැයිස්තුවෙන් තෝරන්න
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('custom');
                setValidationError(null);
              }}
              activeOpacity={0.8}
            >
              <AppText
                size="xs"
                weight="bold"
                color={activeTab === 'custom' ? ThemeColors.primary : ThemeColors.textSecondary}
              >
                ✏️ නව පාඨයක් ලියන්න
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          {activeTab === 'list' ? (
            <View style={styles.listContainer}>
              {/* Filter Pills */}
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]}
                  onPress={() => setFilterType('all')}
                  activeOpacity={0.8}
                >
                  <AppText
                    size="xs"
                    weight={filterType === 'all' ? 'bold' : 'medium'}
                    color={filterType === 'all' ? '#FFFFFF' : ThemeColors.textSecondary}
                  >
                    සියල්ල
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterPill, filterType === 'word' && styles.filterPillActive]}
                  onPress={() => setFilterType('word')}
                  activeOpacity={0.8}
                >
                  <AppText
                    size="xs"
                    weight={filterType === 'word' ? 'bold' : 'medium'}
                    color={filterType === 'word' ? '#FFFFFF' : ThemeColors.textSecondary}
                  >
                    වචන
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterPill, filterType === 'short_sentence' && styles.filterPillActive]}
                  onPress={() => setFilterType('short_sentence')}
                  activeOpacity={0.8}
                >
                  <AppText
                    size="xs"
                    weight={filterType === 'short_sentence' ? 'bold' : 'medium'}
                    color={filterType === 'short_sentence' ? '#FFFFFF' : ThemeColors.textSecondary}
                  >
                    කෙටි වාක්‍ය
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView
                style={styles.optionsScroll}
                showsVerticalScrollIndicator={false}
              >
                {filteredOptions.map((opt) => {
                  const isSelected = selectedText === opt.text;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                      onPress={() => handleSelectOption(opt)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.typeBadge,
                              {
                                backgroundColor:
                                  opt.textType === 'word' ? '#DBEAFE' : '#FEF3C7',
                              },
                            ]}
                          >
                            <AppText
                              size="xs"
                              weight="bold"
                              color={opt.textType === 'word' ? '#1D4ED8' : '#B45309'}
                            >
                              {opt.textType === 'word' ? '🔤 වචනය' : '📝 කෙටි වාක්‍යය'}
                            </AppText>
                          </View>
                          <View style={styles.gradeBadge}>
                            <AppText size="xs" color={ThemeColors.textMuted}>
                              ශ්‍රේණිය {opt.gradeLevel}
                            </AppText>
                          </View>
                        </View>
                        <AppText
                          size="lg"
                          weight="extrabold"
                          color={ThemeColors.textPrimary}
                          style={{ marginTop: 4 }}
                        >
                          {opt.text}
                        </AppText>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <ScrollView style={styles.customContainer} showsVerticalScrollIndicator={false}>
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                සිංහල වචනයක් හෝ කෙටි වාක්‍යයක් ඇතුළත් කරන්න:
              </AppText>

              <TextInput
                style={styles.textInput}
                value={customInput}
                onChangeText={handleCustomInputChange}
                placeholder="උදා: කුරුල්ලා හෝ මම පාසල් යමි"
                placeholderTextColor={ThemeColors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Informational Non-editable Child Profile Grade Label */}
              <View style={styles.gradeInfoCard}>
                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                  🎓 ශ්‍රේණිය (Grade):
                </AppText>
                {profileGrade ? (
                  <View style={styles.gradeInfoBadge}>
                    <AppText size="xs" weight="extrabold" color={ThemeColors.primary}>
                      ශ්‍රේණිය {profileGrade} (Child Profile)
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.missingGradeBadge}>
                    <AppText size="xs" weight="bold" color="#DC2626">
                      ⚠️ පැතිකඩෙහි ශ්‍රේණියක් සකසා නැත
                    </AppText>
                  </View>
                )}
              </View>
              {!profileGrade && (
                <AppText size="xs" color="#DC2626" style={{ marginTop: 4 }}>
                  කරුණාකර පළමුව ඔබගේ පැතිකඩ වෙත ගොස් ශ්‍රේණිය (Grade 1-3) තෝරන්න.
                </AppText>
              )}

              {/* Text Type Selector */}
              <View style={styles.selectorSection}>
                <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                  📝 පාඨ වර්ගය (Text Type):
                </AppText>
                <View style={styles.selectorPillRow}>
                  {(
                    [
                      { key: 'word', label: '🔤 වචනය (Word)' },
                      { key: 'short sentence', label: '📄 කෙටි වාක්‍යය (Short Sentence)' },
                    ] as const
                  ).map((t) => {
                    const isSelected = customTextType === t.key;
                    return (
                      <TouchableOpacity
                        key={`type-${t.key}`}
                        style={[
                          styles.selectorPill,
                          isSelected && styles.selectorPillActive,
                        ]}
                        onPress={() => {
                          setCustomTextType(t.key);
                          setHasManuallySelectedType(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <AppText
                          size="xs"
                          weight={isSelected ? 'extrabold' : 'semibold'}
                          color={isSelected ? '#FFFFFF' : ThemeColors.textSecondary}
                        >
                          {t.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {validationError ? (
                <View style={styles.errorBanner}>
                  <AppText size="xs" weight="bold" color="#DC2626">
                    ⚠️ {validationError}
                  </AppText>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmCustom}
                activeOpacity={0.8}
              >
                <AppText size="sm" weight="extrabold" color="#FFFFFF">
                  ✓ මෙම පාඨය තෝරාගන්න
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ThemeSpacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ThemeSpacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.md,
    padding: 4,
    marginBottom: ThemeSpacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: ThemeRadius.sm,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...ThemeShadow.sm,
  },
  listContainer: {
    maxHeight: 380,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: ThemeSpacing.sm,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: ThemeColors.primary,
  },
  optionsScroll: {
    maxHeight: 320,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    marginBottom: ThemeSpacing.sm,
  },
  optionCardSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#F0FDF4',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: ThemeColors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ThemeColors.primary,
  },
  customContainer: {
    paddingVertical: ThemeSpacing.sm,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: ThemeRadius.md,
    padding: ThemeSpacing.md,
    fontSize: 18,
    color: ThemeColors.textPrimary,
    minHeight: 100,
    marginTop: ThemeSpacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ThemeRadius.sm,
    padding: 8,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: ThemeColors.primary,
    borderRadius: ThemeRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: ThemeSpacing.md,
    ...ThemeShadow.sm,
  },
  selectorSection: {
    marginTop: ThemeSpacing.sm,
  },
  selectorPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  selectorPillActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  gradeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: ThemeSpacing.sm,
  },
  gradeInfoBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ThemeRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  missingGradeBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ThemeRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
