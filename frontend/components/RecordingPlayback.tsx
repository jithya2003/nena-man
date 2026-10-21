/**
 * nena-man · frontend/components/RecordingPlayback.tsx
 * Compact playback control for the child's own M1 reading recording.
 *
 * Plays the exact local audio file that was uploaded for analysis (no download,
 * no copy). Uses the already-installed expo-av library. The sound is unloaded
 * whenever the URI changes or the component unmounts, so playback can never
 * overlap with another recording or a later attempt.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AppText from '@/components/AppText';
import { ThemeColors, ThemeRadius, ThemeSpacing } from '@/constants/theme';

interface RecordingPlaybackProps {
  /** Local URI of the recording associated with the displayed analysis result */
  audioUri: string | null;
}

const UNAVAILABLE_MESSAGE = 'පටිගත කිරීම ලබාගත නොහැක (Recording unavailable)';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function RecordingPlayback({ audioUri }: RecordingPlaybackProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [didFinish, setDidFinish] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load (and later release) the sound for exactly this recording URI
  useEffect(() => {
    let cancelled = false;
    let createdSound: Audio.Sound | null = null;

    setIsLoaded(false);
    setIsPlaying(false);
    setPositionMs(0);
    setDurationMs(0);
    setDidFinish(false);
    setError(null);

    // Simulated (mock-mode) URIs have no real file behind them
    if (!audioUri || audioUri.includes('/simulated/')) {
      setError(UNAVAILABLE_MESSAGE);
      return;
    }

    const onStatus = (status: AVPlaybackStatus) => {
      if (cancelled) return;
      if (!status.isLoaded) {
        if (status.error) {
          setError(UNAVAILABLE_MESSAGE);
          setIsPlaying(false);
        }
        return;
      }
      setPositionMs(status.positionMillis);
      if (status.durationMillis != null) {
        setDurationMs(status.durationMillis);
      }
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        // Reset to the beginning so the next press replays
        setIsPlaying(false);
        setDidFinish(true);
        setPositionMs(0);
        soundRef.current?.setPositionAsync(0).catch(() => { });
      }
    };

    (async () => {
      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 },
          onStatus
        );
        if (cancelled) {
          await sound.unloadAsync().catch(() => { });
          return;
        }
        createdSound = sound;
        soundRef.current = sound;
        setIsLoaded(status.isLoaded);
        if (status.isLoaded && status.durationMillis != null) {
          setDurationMs(status.durationMillis);
        }
      } catch (err) {
        // Missing, deleted, or unreadable file
        console.warn('[RecordingPlayback] Failed to load recording:', err);
        if (!cancelled) {
          setError(UNAVAILABLE_MESSAGE);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (soundRef.current === createdSound) {
        soundRef.current = null;
      }
      if (createdSound) {
        const sound = createdSound;
        sound.setOnPlaybackStatusUpdate(null);
        sound
          .stopAsync()
          .catch(() => { })
          .finally(() => {
            sound.unloadAsync().catch(() => { });
          });
      }
    };
  }, [audioUri]);

  const handleTogglePlayback = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound || error) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        setError(UNAVAILABLE_MESSAGE);
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        return;
      }

      // Make sure output is routed for playback (not the recording session)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      }).catch(() => { });

      const atEnd =
        status.durationMillis != null && status.positionMillis >= status.durationMillis;
      if (didFinish || atEnd) {
        await sound.setPositionAsync(0);
        setDidFinish(false);
      }

      await sound.playAsync();
    } catch (err) {
      console.warn('[RecordingPlayback] Playback failed:', err);
      setIsPlaying(false);
      setError(UNAVAILABLE_MESSAGE);
    }
  }, [error, didFinish]);

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  const buttonLabel = isPlaying
    ? '⏸ විරාමය (Pause)'
    : didFinish
      ? '🔁 නැවත (Replay)'
      : positionMs > 0
        ? '▶ ඉදිරියට (Resume)'
        : '▶ වාදනය (Play)';

  const isDisabled = Boolean(error) || !isLoaded;

  return (
    <View style={styles.container}>
      <AppText size="xs" weight="bold" color={ThemeColors.textMuted}>
        🎧 ඔබේ කියවීමට සවන් දෙන්න (Listen to Your Reading):
      </AppText>

      {error ? (
        <AppText size="xs" color={ThemeColors.textSecondary} style={styles.errorText}>
          {error}
        </AppText>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.playButton,
              isPlaying && styles.playButtonActive,
              isDisabled && styles.playButtonDisabled,
            ]}
            onPress={handleTogglePlayback}
            disabled={isDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause recording' : 'Play recording'}
          >
            <AppText
              size="xs"
              weight="bold"
              color={isPlaying ? '#FFFFFF' : ThemeColors.primary}
            >
              {isLoaded ? buttonLabel : '⏳ ...'}
            </AppText>
          </TouchableOpacity>

          <View style={styles.progressColumn}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                {formatTime(positionMs)}
              </AppText>
              <AppText size="xs" color={ThemeColors.textSecondary}>
                {formatTime(durationMs)}
              </AppText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: ThemeSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.borderLight,
    backgroundColor: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: ThemeSpacing.sm,
  },
  playButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ThemeRadius.full,
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
    backgroundColor: ThemeColors.primaryLight,
  },
  playButtonActive: {
    backgroundColor: ThemeColors.primary,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  progressColumn: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ThemeColors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorText: {
    marginTop: 6,
  },
});
