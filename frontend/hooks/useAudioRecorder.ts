/**
 * nena-man · frontend/hooks/useAudioRecorder.ts
 * Minimal audio recording hook using expo-av.
 *
 * Requests microphone permission, configures audio mode, records student speech,
 * and yields the local audio file URI upon stop.
 * Gracefully provides simulated audio URI fallback on web or if mic permission is unavailable
 * when USE_MOCK_READING_ANALYSIS is enabled.
 */

import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { USE_MOCK_READING_ANALYSIS } from '@/config/flags';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPreparing: boolean;
  audioUri: string | null;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string | null>;
  resetRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsPreparing(true);

    try {
      if (Platform.OS === 'web') {
        if (!USE_MOCK_READING_ANALYSIS) {
          setError('Audio recording is not supported on web in live mode');
          setIsPreparing(false);
          setIsRecording(false);
          return false;
        }
        // Web fallback: simulate audio capture
        recordingStartTimeRef.current = Date.now();
        setIsPreparing(false);
        setIsRecording(true);
        return true;
      }

      // Request microphone permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission not granted');
        setIsPreparing(false);
        setIsRecording(false);
        return false;
      }

      // Configure audio session mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Initialize and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      recordingStartTimeRef.current = Date.now();
      setIsPreparing(false);
      setIsRecording(true);
      return true;
    } catch (err: any) {
      if (!USE_MOCK_READING_ANALYSIS) {
        console.error('Audio recording failed to start:', err);
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
        Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});

        setError(err?.message || 'Failed to start audio recording');
        setIsPreparing(false);
        setIsRecording(false);
        return false;
      }

      console.warn('Audio recording failed to start, falling back to simulated recording:', err);
      // Fallback for simulators or environments without audio hardware
      recordingStartTimeRef.current = Date.now();
      setIsPreparing(false);
      setIsRecording(true);
      return true;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setIsRecording(false);
    setIsPreparing(false);

    try {
      if (recordingRef.current) {
        const recording = recordingRef.current;
        recordingRef.current = null;

        try {
          await recording.stopAndUnloadAsync();
        } catch (stopErr: any) {
          console.error('Error stopping audio recording:', stopErr);
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});

          if (!USE_MOCK_READING_ANALYSIS) {
            setError(stopErr?.message || 'Failed to stop audio recording');
            setAudioUri(null);
            return null;
          }

          const fallbackUri = `file:///simulated/reading_${Date.now()}.m4a`;
          setAudioUri(fallbackUri);
          return fallbackUri;
        }

        // Reset audio session mode for normal playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        }).catch(() => {});

        const uri = recording.getURI();

        if (!uri) {
          if (!USE_MOCK_READING_ANALYSIS) {
            setError('Recorded audio file URI was not found');
            setAudioUri(null);
            return null;
          }
          const finalUri = `file:///simulated/reading_${Date.now()}.m4a`;
          setAudioUri(finalUri);
          return finalUri;
        }

        setAudioUri(uri);
        return uri;
      }

      // No active recordingRef (e.g. web or simulated fallback)
      if (!USE_MOCK_READING_ANALYSIS) {
        setError('No active audio recording found');
        setAudioUri(null);
        return null;
      }

      // Web or simulated fallback
      const simulatedUri = `file:///simulated/reading_${Date.now()}.m4a`;
      setAudioUri(simulatedUri);
      return simulatedUri;
    } catch (err: any) {
      console.error('Error stopping audio recording:', err);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      recordingRef.current = null;

      if (!USE_MOCK_READING_ANALYSIS) {
        setError(err?.message || 'Failed to stop audio recording');
        setAudioUri(null);
        return null;
      }

      const fallbackUri = `file:///simulated/reading_${Date.now()}.m4a`;
      setAudioUri(fallbackUri);
      return fallbackUri;
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
      Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    }
    recordingStartTimeRef.current = null;
    setIsRecording(false);
    setIsPreparing(false);
    setAudioUri(null);
    setError(null);
  }, []);

  return {
    isRecording,
    isPreparing,
    audioUri,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}

export default useAudioRecorder;
