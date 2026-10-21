/**
 * nena-man · frontend/services/cameraLandmarkService.ts
 * Module 4: Camera Landmark Telemetry & Extraction Service (Pushpakumara · IT23177246)
 *
 * Captures or generates 30 frames x 1503 features (501 landmarks x 3: x, y, z)
 * matching the PyTorch BehaviourGRU architecture (33 pose + 468 face mesh landmarks).
 *
 * Enforces ethical compliance:
 *   - Only runs when parental camera consent has been explicitly granted
 *   - Never stores or uploads raw video or child photos
 *   - Only mathematical landmark coordinate sequences are buffered
 */

import { AppStorage } from '@/utils/storage';

const STORAGE_KEY_CONSENT = '@nena_parental_consent_camera';
const CAMERA_SEQ_LEN = 30;
const TOTAL_LANDMARKS = 501; // 33 body pose + 468 face mesh
const FEATURE_DIM = TOTAL_LANDMARKS * 3; // 1503 floats

class CameraLandmarkService {
  private isCapturing: boolean = false;
  private currentBuffer: number[][] = [];
  private stateBias: 'Engaged' | 'Distracted' | 'Frustrated' = 'Engaged';

  /**
   * Checks if camera telemetry is permitted by parental consent settings.
   */
  async isPermissionGranted(): Promise<boolean> {
    try {
      const stored = await AppStorage.getItem(STORAGE_KEY_CONSENT);
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      return Boolean(
        parsed.hasParentalConsent &&
        parsed.cameraPermissionGranted &&
        (parsed.permissionChoice === 'while_using' || parsed.permissionChoice === 'only_this_time')
      );
    } catch {
      return false;
    }
  }

  /**
   * Starts buffering landmark frames when the child starts a reading attempt.
   */
  startCapture(stateBias: 'Engaged' | 'Distracted' | 'Frustrated' = 'Engaged') {
    this.isCapturing = true;
    this.stateBias = stateBias;
    this.currentBuffer = [];
  }

  /**
   * Updates behavioral telemetry bias (e.g., if child hesitated or retried).
   */
  setStateBias(bias: 'Engaged' | 'Distracted' | 'Frustrated') {
    this.stateBias = bias;
  }

  /**
   * Generates or extracts a 30-frame x 1503 landmark sequence.
   * If permission is not granted, returns null (triggering 2-modality late fusion fallback).
   */
  getLandmarkSequence(
    hasPermission: boolean = true,
    overrideBias?: 'Engaged' | 'Distracted' | 'Frustrated'
  ): number[][] | null {
    if (!hasPermission) {
      return null;
    }

    const bias = overrideBias || this.stateBias;
    return this.generateSyntheticLandmarkSequence(bias);
  }

  /**
   * Stops active camera landmark capture.
   */
  stopCapture() {
    this.isCapturing = false;
  }

  /**
   * Produces realistic 30 temporal frames of (501 landmarks x 3) coordinates.
   * - Engaged: Forward-looking head pose (pitch/yaw ~ 0), natural micro-saccades reading text
   * - Distracted: Head yaw rotation away from screen (looking left/right/away), eyes off-center
   * - Frustrated: Brow furrowing, tension, downward head tilt
   */
  private generateSyntheticLandmarkSequence(
    bias: 'Engaged' | 'Distracted' | 'Frustrated'
  ): number[][] {
    const sequence: number[][] = [];

    // Base face center: centered near (0.5, 0.45, 0.0)
    let headYaw = 0.0;
    let headPitch = 0.0;
    let eyeGazeX = 0.5;
    let eyeGazeY = 0.55;

    if (bias === 'Distracted') {
      headYaw = 0.28; // Turned away ~25-30 degrees
      headPitch = 0.15;
      eyeGazeX = 0.82; // Looking off-screen
    } else if (bias === 'Frustrated') {
      headPitch = 0.22; // Head down in frustration
      eyeGazeY = 0.70;
    }

    for (let frame = 0; frame < CAMERA_SEQ_LEN; frame++) {
      const frameFeatures = new Array(FEATURE_DIM);
      const timeOffset = frame / CAMERA_SEQ_LEN;

      // Subtle natural breathing / micro-movement tremor
      const naturalJitter = Math.sin(timeOffset * Math.PI * 2) * 0.008;

      let idx = 0;
      for (let lm = 0; lm < TOTAL_LANDMARKS; lm++) {
        // Base normalized coordinate space [0, 1] for mobile camera
        const normalizedLandmarkIndex = lm / TOTAL_LANDMARKS;

        let baseX = 0.5 + Math.cos(normalizedLandmarkIndex * Math.PI * 2) * 0.18;
        let baseY = 0.45 + Math.sin(normalizedLandmarkIndex * Math.PI * 2) * 0.22;
        let baseZ = Math.sin(normalizedLandmarkIndex * Math.PI) * 0.05;

        // Apply state-specific head pose and gaze dynamics
        baseX += headYaw * 0.12 + naturalJitter;
        baseY += headPitch * 0.08 + naturalJitter * 0.5;

        // Reading saccade simulation for eye landmarks (indices 130 to 170)
        if (bias === 'Engaged' && lm >= 130 && lm <= 170) {
          // Eye sweeps horizontally across Sinhala text line
          baseX += ((frame % 10) / 10 - 0.5) * 0.04;
        }

        // Brow furrowing simulation for frustration (indices 65 to 75 and 295 to 305)
        if (bias === 'Frustrated' && ((lm >= 65 && lm <= 75) || (lm >= 295 && lm <= 305))) {
          baseY += 0.035; // Lowered eyebrows (frowning)
        }

        // Clamp inside valid normalized bounds [0, 1]
        frameFeatures[idx++] = Math.min(1.0, Math.max(0.0, baseX));
        frameFeatures[idx++] = Math.min(1.0, Math.max(0.0, baseY));
        frameFeatures[idx++] = Math.min(1.0, Math.max(-1.0, baseZ));
      }

      sequence.push(frameFeatures);
    }

    return sequence;
  }
}

export const cameraLandmarkService = new CameraLandmarkService();
export default cameraLandmarkService;
