/**
 * nena-man · frontend/hooks/useConsentPrivacy.ts
 * Module 4: Parental Consent & Camera Privacy State Hook (Pushpakumara · IT23177246)
 *
 * Manages child privacy protection, COPPA compliance, and permissions for:
 *  - Real-time facial pose & attention tracking (camera telemetry)
 *  - Touch latency and interaction monitoring
 *  - Parental authorization verification
 */

import { useState, useEffect, useCallback } from 'react';
import { AppStorage } from '@/utils/storage';

const STORAGE_KEY_CONSENT = '@nena_parental_consent_camera';

export type PermissionChoice = 'while_using' | 'only_this_time' | 'denied' | null;

export interface ConsentPrivacyState {
  hasParentalConsent: boolean;
  cameraPermissionGranted: boolean;
  touchTrackingConsent: boolean;
  consentedAt: string | null;
  parentPinVerified: boolean;
  permissionChoice: PermissionChoice;
}

const DEFAULT_CONSENT: ConsentPrivacyState = {
  hasParentalConsent: false,
  cameraPermissionGranted: false,
  touchTrackingConsent: false,
  consentedAt: null,
  parentPinVerified: false,
  permissionChoice: null,
};

export function useConsentPrivacy() {
  const [consentState, setConsentState] = useState<ConsentPrivacyState>(DEFAULT_CONSENT);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted consent on mount
  useEffect(() => {
    async function loadStoredConsent() {
      try {
        const stored = await AppStorage.getItem(STORAGE_KEY_CONSENT);
        if (stored) {
          const parsed = JSON.parse(stored) as ConsentPrivacyState;
          // If previous session was 'only_this_time', require asking again
          if (parsed.permissionChoice === 'only_this_time') {
            setConsentState({
              ...parsed,
              hasParentalConsent: false,
              cameraPermissionGranted: false,
              permissionChoice: null,
            });
          } else {
            setConsentState(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load parental consent settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredConsent();
  }, []);

  // Update & persist consent
  const updateConsent = useCallback(
    async (updates: Partial<ConsentPrivacyState>) => {
      setConsentState((prev) => {
        const updated: ConsentPrivacyState = {
          ...prev,
          ...updates,
          consentedAt: new Date().toISOString(),
        };
        AppStorage.setItem(STORAGE_KEY_CONSENT, JSON.stringify(updated)).catch((err) =>
          console.warn('Failed to persist consent update:', err)
        );
        return updated;
      });
    },
    []
  );

  // Reset or revoke consent
  const revokeConsent = useCallback(async () => {
    const revoked: ConsentPrivacyState = {
      hasParentalConsent: false,
      cameraPermissionGranted: false,
      touchTrackingConsent: false,
      consentedAt: null,
      parentPinVerified: false,
      permissionChoice: null,
    };
    setConsentState(revoked);
    await AppStorage.removeItem(STORAGE_KEY_CONSENT);
  }, []);

  return {
    consentState,
    isLoading,
    updateConsent,
    revokeConsent,
    hasActiveConsent: Boolean(
      consentState.hasParentalConsent &&
      consentState.cameraPermissionGranted &&
      (consentState.permissionChoice === 'while_using' || consentState.permissionChoice === 'only_this_time')
    ),
  };
}

export default useConsentPrivacy;
