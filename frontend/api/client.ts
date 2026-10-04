/**
 * nena-man · frontend/api/client.ts
 * Centralized Axios API client for all four AI modules.
 *
 * Configured with:
 *   - Base URL from typed config/env.ts
 *   - 15-second timeout
 *   - Request interceptor reading token from authStore (outside React components)
 *   - Response interceptor returning response.data directly
 *   - Automatic 401 session logout and error normalization into ApiError
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '@/config/env';
import { useAuthStoreBase } from '@/store/authStore';
import type { ApiError } from './types';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Read the current auth token outside React component tree
    const token = useAuthStoreBase.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  // a) on success, return response.data directly
  (response: AxiosResponse) => {
    return response.data;
  },
  // b) on error, normalize into { message, status, isNetworkError } & handle 401
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const isNetworkError = Boolean(
      !error.response &&
        (error.code === 'ERR_NETWORK' ||
          error.code === 'ECONNABORTED' ||
          error.message?.toLowerCase().includes('network error'))
    );

    // c) on 401, call authStore's logout action and reject
    if (status === 401) {
      console.warn('[API Client] 401 Unauthorized encountered. Logging out via authStore.');
      useAuthStoreBase.getState().logout();
    }

    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.response?.data?.detail;

    const message =
      serverMessage ||
      (isNetworkError
        ? 'ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න (Network error. Please check connection).'
        : error.message || 'An unexpected error occurred');

    const normalizedError: ApiError = {
      message,
      status,
      isNetworkError,
      data: error.response?.data,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
