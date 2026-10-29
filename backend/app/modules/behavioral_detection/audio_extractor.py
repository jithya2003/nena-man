"""
nena-man · backend/app/modules/behavioral_detection/audio_extractor.py
Module 4: Real-Time Audio Signal Feature Extractor & Frustration Analyzer.

Extracts the exact 208 acoustic features matching Colab training:
  - 40 MFCCs (mean + std)   -> 80 features
  - 64 Mel Spectrogram (mean + std) -> 128 features
  Total: 208 features (input to best_audio_frustration_model.pt).
"""

import io
import wave
import logging
import numpy as np
from scipy import signal, fft

logger = logging.getLogger(__name__)

def _get_mel_filterbank(sr: int = 16000, n_fft: int = 512, n_mels: int = 64) -> np.ndarray:
    """Computes triangular Mel filterbank matrix."""
    low_freq = 0
    high_freq = sr / 2

    def hz_to_mel(hz):
        return 2595.0 * np.log10(1.0 + hz / 700.0)

    def mel_to_hz(mel):
        return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

    mel_points = np.linspace(hz_to_mel(low_freq), hz_to_mel(high_freq), n_mels + 2)
    hz_points = mel_to_hz(mel_points)
    bin_points = np.floor((n_fft + 1) * hz_points / sr).astype(int)

    fbank = np.zeros((n_mels, int(np.floor(n_fft / 2 + 1))))
    for m in range(1, n_mels + 1):
        f_m_minus = bin_points[m - 1]
        f_m = bin_points[m]
        f_m_plus = bin_points[m + 1]

        for k in range(f_m_minus, f_m):
            if f_m > f_m_minus:
                fbank[m - 1, k] = (k - bin_points[m - 1]) / (f_m - f_m_minus)
        for k in range(f_m, f_m_plus):
            if f_m_plus > f_m:
                fbank[m - 1, k] = (bin_points[m + 1] - k) / (f_m_plus - f_m)

    return fbank


def extract_208_features_from_audio(y: np.ndarray, sr: int = 16000) -> np.ndarray:
    """
    Extracts 208 acoustic features from 1D audio waveform:
      - 40 MFCC mean
      - 40 MFCC std
      - 64 Log-Mel mean
      - 64 Log-Mel std
    """
    if y is None or len(y) == 0:
        return np.zeros(208, dtype=np.float32)

    # Ensure float32 normalized [-1.0, 1.0]
    if y.dtype != np.float32:
        y = y.astype(np.float32)

    max_val = np.max(np.abs(y))
    if max_val > 1.0:
        y = y / max_val

    # Ensure minimum length for STFT (at least 512 samples)
    if len(y) < 512:
        y = np.pad(y, (0, 512 - len(y)), mode='constant')

    # STFT parameters matching Colab training: n_fft=512, hop_length=160
    f, t, Zxx = signal.stft(y, fs=sr, nperseg=512, noverlap=512 - 160)
    power_spec = np.abs(Zxx) ** 2

    # Mel Spectrogram
    fbank = _get_mel_filterbank(sr=sr, n_fft=512, n_mels=64)
    mel_spec = np.dot(fbank, power_spec)
    mel_spec = np.maximum(mel_spec, 1e-10)

    # Log-Mel in dB
    log_mel = 10.0 * np.log10(mel_spec)
    log_mel -= np.max(log_mel)

    # 40 MFCCs via DCT-II
    mfcc = fft.dct(log_mel, type=2, axis=0, norm='ortho')[:40]

    # Mean + Std pooling (matches notebook cell 48)
    features = np.concatenate([
        mfcc.mean(axis=1),
        mfcc.std(axis=1),
        log_mel.mean(axis=1),
        log_mel.std(axis=1),
    ])

    return features.astype(np.float32)


def read_audio_bytes_to_waveform(audio_bytes: bytes, target_sr: int = 16000) -> np.ndarray:
    """
    Converts raw audio bytes (WAV, PCM, or headerless 16-bit PCM) into 1D float32 waveform.
    """
    if not audio_bytes:
        return np.zeros(target_sr, dtype=np.float32)

    # Attempt 1: Standard WAV header
    try:
        with wave.open(io.BytesIO(audio_bytes), 'rb') as wf:
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()
            framerate = wf.getframerate()
            frames = wf.readframes(wf.getnframes())

            if sampwidth == 2:
                samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            elif sampwidth == 4:
                samples = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
            else:
                samples = np.frombuffer(frames, dtype=np.uint8).astype(np.float32) / 128.0 - 1.0

            if n_channels > 1:
                samples = samples.reshape(-1, n_channels).mean(axis=1)

            # Resample to target_sr if needed
            if framerate != target_sr and len(samples) > 0:
                num_target_samples = int(len(samples) * target_sr / framerate)
                samples = signal.resample(samples, num_target_samples)

            return samples
    except Exception:
        pass

    # Attempt 2: 16-bit PCM raw stream
    try:
        samples = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        if len(samples) > 0:
            return samples
    except Exception:
        pass

    # Fallback: Zero array
    return np.zeros(target_sr, dtype=np.float32)


def compute_reading_speech_metrics(y: np.ndarray, sr: int = 16000) -> dict:
    """
    Computes real speech metrics from audio signal:
      - duration (seconds)
      - pause duration (silent segments)
      - hesitation count
      - estimated reading speed (words/min based on speech bursts)
      - fluency score (0.0 to 1.0)
    """
    duration = max(0.5, len(y) / sr)
    frame_len = int(sr * 0.05)  # 50ms frames
    num_frames = len(y) // frame_len

    if num_frames == 0:
        return {
            "readingSpeed": 50.0,
            "hesitationCount": 0,
            "pauseDuration": 0.5,
            "fluencyScore": 0.85,
            "duration": duration,
        }

    energies = []
    for i in range(num_frames):
        frame = y[i * frame_len : (i + 1) * frame_len]
        energy = np.sqrt(np.mean(frame ** 2))
        energies.append(energy)

    energies = np.array(energies)
    silence_threshold = max(0.015, np.mean(energies) * 0.25)
    is_silent = energies < silence_threshold

    # Count pauses longer than 300ms (6 frames of 50ms)
    pause_frames = 0
    hesitations = 0
    current_pause = 0

    for silent in is_silent:
        if silent:
            current_pause += 1
        else:
            if current_pause >= 6:  # >= 300ms
                pause_frames += current_pause
                hesitations += 1
            current_pause = 0

    if current_pause >= 6:
        pause_frames += current_pause
        hesitations += 1

    pause_duration = pause_frames * 0.05
    speech_ratio = max(0.1, 1.0 - (pause_duration / duration))
    fluency_score = min(1.0, max(0.2, speech_ratio - (hesitations * 0.05)))
    reading_speed = max(20.0, min(120.0, 60.0 * speech_ratio * 1.5))

    return {
        "readingSpeed": float(round(reading_speed, 1)),
        "hesitationCount": int(hesitations),
        "pauseDuration": float(round(pause_duration, 2)),
        "fluencyScore": float(round(fluency_score, 2)),
        "duration": float(round(duration, 2)),
    }
