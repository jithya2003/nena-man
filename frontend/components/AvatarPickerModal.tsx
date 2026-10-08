import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
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
import { CharacterAvatarId, ChildAvatar } from '@/types';
import { CHARACTER_AVATAR_LIST } from '@/assets/avatars';
import { AppStorage } from '@/utils/storage';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatar?: ChildAvatar;
  childId: string;
  onAvatarSelect?: (avatar: ChildAvatar) => void;
}

export default function AvatarPickerModal({
  visible,
  onClose,
  currentAvatar,
  childId,
  onAvatarSelect,
}: AvatarPickerModalProps) {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const updateChild = useChildStoreBase((s) => s.updateChild);
  const [isProcessing, setIsProcessing] = useState(false);

  const saveAvatar = (avatar: ChildAvatar) => {
    // 0. Instant UI callback
    onAvatarSelect?.(avatar);

    // 1. Instant local persistence in childStore (offline-first)
    updateChild(childId, { avatar });

    // 2. Keep AuthContext in sync if this child is the current logged in user
    if (user && user.uid === childId) {
      updateUser({ avatar });
    } else {
      AppStorage.getItem('@nena_man_auth_user').then((raw) => {
        if (raw) {
          try {
            const u = JSON.parse(raw);
            if (u.uid === childId) {
              u.avatar = avatar;
              AppStorage.setItem('@nena_man_auth_user', JSON.stringify(u));
            }
          } catch {}
        }
      });
    }

    // 3. Sync to Firestore in the background (users/{childId} document)
    // Non-blocking setDoc with merge: true ensures safety across document states
    if (childId) {
      setDoc(doc(db, 'users', childId), { avatar }, { merge: true }).catch((err) => {
        console.warn('[AvatarPicker] Background Firestore sync warning:', err);
      });
    }

    onClose();
  };

  const handleSelectCharacter = (characterId: CharacterAvatarId) => {
    saveAvatar({ type: 'character', value: characterId });
  };

  const processAndSaveImage = async (uri: string) => {
    setIsProcessing(true);
    try {
      // Resize to 200x200 and compress to JPEG 0.7
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200, height: 200 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) {
        throw new Error('Base64 encoding failed');
      }

      // Check size budget: Firestore doc limit is 1MB total; cap avatar at ~150KB
      const approxByteSize = (manipulated.base64.length * 3) / 4;
      if (approxByteSize > 150 * 1024) {
        Alert.alert(
          'ප්‍රමාණය වැඩියි (Oversized)',
          t('profile.avatar.tooLarge')
        );
        return;
      }

      const photoDataUri = `data:image/jpeg;base64,${manipulated.base64}`;
      saveAvatar({ type: 'photo', value: photoDataUri });
    } catch (err) {
      console.warn('[AvatarPicker] Error processing image:', err);
      Alert.alert('දෝෂයක් (Error)', 'ඡායාරූපය සැකසීමට නොහැකි විය. නැවත උත්සාහ කරන්න.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('අවසර අවශ්‍යයි (Permission Required)', t('profile.avatar.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndSaveImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[AvatarPicker] Gallery picker error:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('අවසර අවශ්‍යයි (Permission Required)', t('profile.avatar.permissionDenied'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndSaveImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[AvatarPicker] Camera error:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, ThemeShadow.md]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <AppText size="lg" weight="extrabold" color={ThemeColors.textPrimary}>
              {t('profile.avatar.title')}
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              disabled={isProcessing}
            >
              <AppText size="md" color={ThemeColors.textSecondary}>✕</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ── Section 1: Choose a Character ── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <AppText size="sm">✨</AppText>
                <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                  {t('profile.avatar.chooseCharacter')}
                </AppText>
              </View>

              <View style={styles.gridContainer}>
                {CHARACTER_AVATAR_LIST.map((item) => {
                  const isSelected =
                    currentAvatar?.type === 'character' &&
                    currentAvatar.value === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.avatarOptionCard,
                        { backgroundColor: item.color },
                        isSelected && styles.avatarOptionCardSelected,
                      ]}
                      onPress={() => handleSelectCharacter(item.id)}
                      activeOpacity={0.8}
                      disabled={isProcessing}
                    >
                      <Image source={item.source} style={styles.characterImg} resizeMode="cover" />
                      <AppText
                        size="xs"
                        weight={isSelected ? 'extrabold' : 'semibold'}
                        color={ThemeColors.textPrimary}
                        style={{ marginTop: 6 }}
                      >
                        {t(item.nameKey)}
                      </AppText>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <AppText size="xs" color="#FFFFFF">✓</AppText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Section 2: Upload Photo ── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <AppText size="sm">📸</AppText>
                <AppText size="sm" weight="bold" color={ThemeColors.textPrimary} style={{ marginLeft: 6 }}>
                  {t('profile.avatar.uploadPhoto')}
                </AppText>
              </View>

              {isProcessing ? (
                <View style={styles.processingBox}>
                  <ActivityIndicator size="small" color={ThemeColors.primary} />
                  <AppText size="xs" color={ThemeColors.textSecondary} style={{ marginTop: 8 }}>
                    {t('profile.avatar.compressing')}
                  </AppText>
                </View>
              ) : (
                <View style={styles.uploadBtnRow}>
                  <TouchableOpacity
                    style={[styles.uploadActionBtn, { borderColor: ThemeColors.primary }]}
                    onPress={handlePickFromGallery}
                    activeOpacity={0.8}
                  >
                    <AppText size="sm" weight="bold" color={ThemeColors.primary}>
                      {t('profile.avatar.fromGallery')}
                    </AppText>
                  </TouchableOpacity>

                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={[styles.uploadActionBtn, { borderColor: '#0284C7' }]}
                      onPress={handleTakePhoto}
                      activeOpacity={0.8}
                    >
                      <AppText size="sm" weight="bold" color="#0284C7">
                        {t('profile.avatar.fromCamera')}
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Close */}
          <Button
            label={t('profile.avatar.close')}
            variant="ghost"
            size="sm"
            onPress={onClose}
            disabled={isProcessing}
            style={{ marginTop: ThemeSpacing.sm }}
          />
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
    maxWidth: 400,
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
  section: {
    marginBottom: ThemeSpacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ThemeSpacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ThemeSpacing.sm,
    justifyContent: 'space-between',
  },
  avatarOptionCard: {
    width: '48%',
    borderRadius: ThemeRadius.lg,
    padding: ThemeSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionCardSelected: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#ECFDF5',
  },
  characterImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingBox: {
    padding: ThemeSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ThemeRadius.md,
  },
  uploadBtnRow: {
    gap: ThemeSpacing.sm,
  },
  uploadActionBtn: {
    paddingVertical: ThemeSpacing.sm + 2,
    paddingHorizontal: ThemeSpacing.md,
    borderRadius: ThemeRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
