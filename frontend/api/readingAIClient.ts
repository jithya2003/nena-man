/**
 * Module 1: Dedicated Reading AI API client.
 * Independent from the shared Firebase-authenticated API client.
 */

import axios from 'axios';
import type { ReadingAnalysisResult } from './types';

interface BackendReadingResult extends Omit<
  ReadingAnalysisResult,
  'errorPatternSummary'
> {
  errorPatternSummary: {
    substitution: number;
    omission: number;
    hesitation: number;
    reversal?: number;
  };
}

const readingAIClient = axios.create({
  timeout: 180000,
  headers: {
    Accept: 'application/json',
  },
});

export async function analyzeReadingWithAI(
  audioUri: string,
  expectedText: string
): Promise<ReadingAnalysisResult> {
  const baseUrl =
    process.env.EXPO_PUBLIC_READING_AI_BASE_URL;

  const apiKey =
    process.env.EXPO_PUBLIC_READING_AI_API_KEY;

  if (!baseUrl) {
    throw new Error('Reading AI backend URL is not configured.');
  }

  if (!apiKey) {
    throw new Error('Reading AI demo API key is not configured.');
  }

  if (!audioUri || audioUri.includes('/simulated/')) {
    throw new Error('A real audio recording is required.');
  }

  if (!expectedText.trim()) {
    throw new Error('Expected Sinhala reading text is required.');
  }

  const formData = new FormData();

  formData.append('audio', {
    uri: audioUri,
    name: 'reading.m4a',
    type: 'audio/mp4',
  } as any);

  formData.append('expected_text', expectedText);

  const response = await readingAIClient.post<BackendReadingResult>(
    `${baseUrl.replace(/\/+$/, '')}/analyze-reading`,
    formData,
    {
      headers: {
        'X-API-Key': apiKey,
      },
    }
  );

  const result = response.data;

  if (__DEV__) {
    console.log('[readingAIClient] /analyze-reading response:', {
      readingAccuracy: result.readingAccuracy,
      words: result.words?.map((w) => ({
        text: w.text,
        expected: w.expected,
        status: w.status,
        confidence: w.confidence,
      })),
      errorPatternSummary: result.errorPatternSummary,
    });
  }

  return {
    ...result,
    errorPatternSummary: {
      ...result.errorPatternSummary,
      reversal: result.errorPatternSummary.reversal ?? 0,
    },
  };
}
