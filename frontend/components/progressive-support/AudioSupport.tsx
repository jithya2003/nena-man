/**
 * nena-man · frontend/components/progressive-support/AudioSupport.tsx
 * Level 3 Support: Audio Pronunciation Player using expo-av (with web/mock fallback).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import AppText from '@/components/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { ThemeColors, ThemeSpacing, ThemeRadius } from '@/constants/theme';

interface AudioSupportProps {
  audioUri?: string;
  text: string;
}

export const AudioSupport: React.FC<AudioSupportProps> = ({ audioUri, text }) => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const cleanupSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, [cleanupSound]);

  const handlePlayAudio = useCallback(async () => {
    if (isPlaying) {
      await cleanupSound();
      return;
    }

    setIsLoading(true);

    try {
      if (audioUri && audioUri.startsWith('http')) {
        // Load & play remote/local URI via expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setIsPlaying(true);
        setIsLoading(false);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            cleanupSound();
          }
        });
        return;
      }

      // Simulated Speech/Audio playback fallback
      setIsPlaying(true);
      setIsLoading(false);

      // Simulate audio play duration based on text length
      const playDurationMs = Math.max(1500, text.length * 300);
      setTimeout(() => {
        setIsPlaying(false);
      }, playDurationMs);
    } catch (err) {
      console.warn('[AudioSupport] Audio playback fallback:', err);
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [audioUri, isPlaying, text, cleanupSound]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playingButton]}
          onPress={handlePlayAudio}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <AppText size="xl" weight="extrabold" color="#FFFFFF">
              {isPlaying ? '⏸️' : '🔊'}
            </AppText>
          )}

          <AppText
            size="md"
            weight="extrabold"
            color="#FFFFFF"
            style={styles.playText}
          >
            {isPlaying
              ? t('progressiveSupport.listen') + '...'
              : t('progressiveSupport.listen')}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: ThemeSpacing.md,
    width: '100%',
  },
  card: {
    padding: ThemeSpacing.md,
    backgroundColor: '#F5F3FF', // Soft violet background
    borderRadius: ThemeRadius.lg,
    borderWidth: 2,
    borderColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: ThemeSpacing.lg,
    paddingVertical: ThemeSpacing.sm + 2,
    borderRadius: ThemeRadius.full,
    gap: ThemeSpacing.xs,
    elevation: 3,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  playingButton: {
    backgroundColor: '#D97706',
  },
  playText: {
    marginLeft: ThemeSpacing.xs,
  },
});

export default AudioSupport;
