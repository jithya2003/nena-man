import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeShadow,
} from '@/constants/theme';
import AppText from '@/components/AppText';
import Button from '@/components/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useChildStoreBase } from '@/store/childStore';
import { useAuthStoreBase } from '@/store/authStore';
import { Child } from '@/types';
import { AppStorage } from '@/utils/storage';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  child: Child | null;
  childId: string;
  onProfileSaved?: (updates: {
    name: string;
    grade: number;
    age: number;
  }) => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  child,
  childId,
  onProfileSaved,
}: EditProfileModalProps) {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const updateChild = useChildStoreBase((s) => s.updateChild);
  const authUser = useAuthStoreBase((s) => s.user);
  const setAuthUser = useAuthStoreBase((s) => s.setUser);

  // Local draft state — NO writes to Firestore on keystroke/selection
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(2);
  const [age, setAge] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill form with current child values whenever modal opens
  useEffect(() => {
    if (visible && child) {
      setName(child.name || '');
      setGrade(child.grade || 2);
      setAge(child.age || 7);
      setErrorMessage(null);
    }
  }, [visible, child]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage(t('profile.edit.errorRequired'));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updates = {
      name: trimmedName,
      grade: Number(grade),
      age: Number(age),
    };

    try {
      // 0. Immediate UI update callback
      onProfileSaved?.(updates);

      // 1. Update local child store immediately (instant offline UI update)
      updateChild(childId, updates);

      // If the currently logged in user is the child, keep authContext, authStore and AppStorage in sync
      if (user && user.uid === childId) {
        updateUser({
          displayName: trimmedName,
          grade: Number(grade),
          age: Number(age),
        });
      } else if (authUser && authUser.uid === childId) {
        setAuthUser({
          ...authUser,
          name: trimmedName,
        });
      }

      AppStorage.getItem('@nena_man_auth_user').then((raw) => {
        if (raw) {
          try {
            const u = JSON.parse(raw);
            if (u.uid === childId) {
              u.displayName = trimmedName;
              u.grade = Number(grade);
              u.age = Number(age);
              AppStorage.setItem('@nena_man_auth_user', JSON.stringify(u));
            }
          } catch {}
        }
      });

      // 2. Perform ONE single write to Firestore users/{childId} document with merge
      // Minimal top-level fields only: displayName, grade, age
      if (childId) {
        await setDoc(
          doc(db, 'users', childId),
          {
            displayName: trimmedName,
            grade: Number(grade),
            age: Number(age),
          },
          { merge: true }
        );
      }

      onClose();
    } catch (err) {
      console.warn('[EditProfileModal] Firestore write warning:', err);
      // Even if network write fails, local store was updated; close modal gracefully
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Discard any draft changes without writing to Firestore
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, ThemeShadow.md]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
              {t('profile.edit.title')}
            </AppText>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeBtn}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <AppText size="md" color={ThemeColors.textSecondary}>✕</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {errorMessage && (
              <View style={styles.errorBanner}>
                <AppText size="xs" color="#DC2626" weight="bold">
                  ⚠️ {errorMessage}
                </AppText>
              </View>
            )}

            {/* ── Field 1: Name / Nickname ── */}
            <View style={styles.fieldGroup}>
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={styles.fieldLabel}>
                {t('profile.edit.nameLabel')}
              </AppText>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t('profile.edit.namePlaceholder')}
                placeholderTextColor={ThemeColors.textMuted}
                autoCapitalize="words"
                editable={!isSaving}
              />
            </View>

            {/* ── Field 2: Grade (1, 2, 3) ── */}
            <View style={styles.fieldGroup}>
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={styles.fieldLabel}>
                {t('profile.edit.gradeLabel')}
              </AppText>
              <View style={styles.pillRow}>
                {[1, 2, 3].map((g) => {
                  const isSelected = grade === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.selectorPill,
                        isSelected && styles.selectorPillActive,
                      ]}
                      onPress={() => setGrade(g)}
                      activeOpacity={0.8}
                      disabled={isSaving}
                    >
                      <AppText
                        size="sm"
                        weight={isSelected ? 'extrabold' : 'semibold'}
                        color={isSelected ? '#FFFFFF' : ThemeColors.textPrimary}
                      >
                        {g} ශ්‍රේණිය
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Field 3: Age (6, 7, 8) ── */}
            <View style={styles.fieldGroup}>
              <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={styles.fieldLabel}>
                {t('profile.edit.ageLabel')}
              </AppText>
              <View style={styles.pillRow}>
                {[6, 7, 8].map((a) => {
                  const isSelected = age === a;
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[
                        styles.selectorPill,
                        isSelected && styles.selectorPillActive,
                      ]}
                      onPress={() => setAge(a)}
                      activeOpacity={0.8}
                      disabled={isSaving}
                    >
                      <AppText
                        size="sm"
                        weight={isSelected ? 'extrabold' : 'semibold'}
                        color={isSelected ? '#FFFFFF' : ThemeColors.textPrimary}
                      >
                        අවුරුදු {a}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Button
              label={t('profile.edit.cancel')}
              variant="secondary"
              size="md"
              onPress={handleCancel}
              disabled={isSaving}
              style={{ flex: 1 }}
            />
            <Button
              label={isSaving ? t('profile.edit.saving') : t('profile.edit.save')}
              variant="primary"
              size="md"
              loading={isSaving}
              onPress={handleSave}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ThemeSpacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ThemeRadius.xl,
    padding: ThemeSpacing.lg,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeSpacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: ThemeSpacing.xs,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    marginBottom: ThemeSpacing.sm,
  },
  fieldGroup: {
    marginBottom: ThemeSpacing.md,
  },
  fieldLabel: {
    marginBottom: ThemeSpacing.xs,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: ThemeRadius.md,
    paddingHorizontal: ThemeSpacing.md,
    paddingVertical: ThemeSpacing.sm + 2,
    fontSize: 15,
    color: ThemeColors.textPrimary,
    backgroundColor: '#F8FAFC',
  },
  pillRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
  },
  selectorPill: {
    flex: 1,
    paddingVertical: ThemeSpacing.sm,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillActive: {
    borderColor: ThemeColors.primary,
    backgroundColor: ThemeColors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: ThemeSpacing.sm,
    marginTop: ThemeSpacing.md,
  },
});
