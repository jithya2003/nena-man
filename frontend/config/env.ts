/**
 * nena-man · frontend/config/env.ts
 * Typed environment configuration for the Nena-Man frontend.
 *
 * Validates and exports required environment variables at runtime.
 * Throws a clear, descriptive error if a required variable is missing.
 */

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    '[Environment Error] Missing required environment variable: EXPO_PUBLIC_API_BASE_URL.\n' +
    'Please define EXPO_PUBLIC_API_BASE_URL in your frontend/.env file.\n' +
    'Example: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.2:5000/api/v1'
  );
}

export const ENV = {
  /** Base URL for all backend REST API calls (e.g. http://192.168.1.2:5000/api/v1) */
  API_BASE_URL: apiBaseUrl,

  /** Firebase Client SDK Configuration (optional / checked in firebase service) */
  FIREBASE: {
    API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
} as const;

export default ENV;
