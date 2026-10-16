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

interface ReadingTextSelectModalProps {
  visible: boolean;
  onClose: () => void;
  selectedText: string;
  onSelectText: (text: string, optionId?: string) => void;
}

export default function ReadingTextSelectModal({
  visible,
  onClose,
  selectedText,
  onSelectText,
}: ReadingTextSelectModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'custom'>('list');
  const [filterType, setFilterType] = useState<'all' | 'word' | 'short_sentence'>('all');
  const [customInput, setCustomInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const readingOptions = getReadingTextOptions();

  const filteredOptions = readingOptions.filter((opt) => {
    if (filterType === 'all') return true;
    return opt.textType === filterType;
  });

  const handleSelectOption = (opt: ReadingTextOption) => {
    onSelectText(opt.text, opt.id);
    onClose();
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

    setValidationError(null);
    onSelectText(trimmed, `custom_${Date.now()}`);
    setCustomInput('');
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
            <View style={styles.customContainer}>
              <AppText size="xs" weight="bold" color={ThemeColors.textSecondary}>
                සිංහල වචනයක් හෝ කෙටි වාක්‍යයක් ඇතුළත් කරන්න:
              </AppText>

              <TextInput
                style={styles.textInput}
                value={customInput}
                onChangeText={(val) => {
                  setCustomInput(val);
                  if (validationError) setValidationError(null);
                }}
                placeholder="උදා: කුරුල්ලා හෝ මම පාසල් යමි"
                placeholderTextColor={ThemeColors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

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
            </View>
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
});
