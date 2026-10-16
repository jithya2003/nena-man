/**
 * nena-man · frontend/services/readingTextService.ts
 * Module 2: Sinhala Text Difficulty Analysis & Progressive Reading Support
 * Author: Edirisooriya (IT23179844)
 *
 * Provides:
 * 1. Typed contracts for future ML difficulty model inputs & outputs.
 * 2. ReadingSupportItem development data contract.
 * 3. Curated list of mock educational reading options (words & short sentences) supporting Test Cases A-D.
 * 4. Text difficulty evaluation service with linguistically safe Sinhala tokenization (never naive split('')).
 */

// ── 1. Future Model Input & Output Contracts ───────────────────────────────────

export interface TextDifficultyModelInput {
  grade_level: number;
  akuru_count: number;
  pillam_count: number;
  word_frequency_level: 'low' | 'medium' | 'high';
}

export interface TextDifficultyModelOutput {
  final_difficulty_level: 'easy' | 'medium' | 'hard';
  split_needed: boolean;
  simplification_needed: boolean;
  max_support_level: 1 | 2 | 3 | 4;
}

// ── 2. Reading Support Item (Development Data Contract per Spec) ────────────────

export interface SplitWord {
  word: string;
  parts: string[];
}

export interface ReadingSupportItem {
  id: string;
  originalText: string;
  textType: 'word' | 'short_sentence';

  splitNeeded: boolean;
  simplificationNeeded: boolean;

  maxSupportLevel: 1 | 2 | 3 | 4;
  maxRetriesPerLevel: number;

  highlightUnits?: string[];
  splitParts?: string[];
  splitWords?: SplitWord[];

  audioUri?: string;
  simplifiedText?: string;
}

export type SupportLevelNumber = 1 | 2 | 3 | 4;

export interface SupportPlanInput {
  maxSupportLevel?: number;
  splitNeeded?: boolean;
  simplificationNeeded?: boolean;
  simplifiedText?: string | null;
}

/**
 * Derives the applicable progressive reading support levels for a given item.
 *
 * Rules:
 * - Level 1 (Highlight): allowed whenever maxSupportLevel >= 1
 * - Level 2 (Akuru / Syllable Split): allowed only when maxSupportLevel >= 2 AND splitNeeded === true
 * - Level 3 (Audio Support): allowed whenever maxSupportLevel >= 3
 * - Level 4 (Text Simplification): allowed only when maxSupportLevel >= 4 AND simplificationNeeded === true AND Boolean(simplifiedText)
 */
export function getApplicableSupportLevels(item?: SupportPlanInput | null): SupportLevelNumber[] {
  if (!item) return [];

  const maxLevel = item.maxSupportLevel ?? 1;
  const applicable: SupportLevelNumber[] = [];

  // Level 1 — Highlight: allowed whenever maxSupportLevel >= 1
  if (maxLevel >= 1) {
    applicable.push(1);
  }

  // Level 2 — Akuru / Syllable Split: allowed only when maxSupportLevel >= 2 AND splitNeeded === true
  if (maxLevel >= 2 && item.splitNeeded === true) {
    applicable.push(2);
  }

  // Level 3 — Audio Support: allowed whenever maxSupportLevel >= 3
  if (maxLevel >= 3) {
    applicable.push(3);
  }

  // Level 4 — Text Simplification: allowed only when maxSupportLevel >= 4 AND simplificationNeeded === true AND Boolean(item.simplifiedText)
  if (maxLevel >= 4 && item.simplificationNeeded === true && Boolean(item.simplifiedText)) {
    applicable.push(4);
  }

  return applicable;
}

/**
 * Gets the next valid support level from the list of applicable levels.
 * Skips non-applicable levels (e.g. skips Level 2 if splitNeeded === false).
 */
export function getNextValidSupportLevel(
  currentLevel: number,
  applicableLevels: SupportLevelNumber[]
): SupportLevelNumber | null {
  for (const lvl of applicableLevels) {
    if (lvl > currentLevel) {
      return lvl;
    }
  }
  return null;
}

// ── 3. Frontend-Friendly Text Difficulty Contract ──────────────────────────────

export interface TextDifficultyResult {
  finalDifficultyLevel: 'easy' | 'medium' | 'hard';
  /** Backwards compatibility alias for existing pipeline / store references */
  difficultyLevel?: 'Easy' | 'Medium' | 'Hard' | 'easy' | 'medium' | 'hard';
  splitNeeded: boolean;
  simplificationNeeded: boolean;
  maxSupportLevel: 1 | 2 | 3 | 4;
  applicableSupportLevels?: SupportLevelNumber[];
  maxRetriesPerLevel: number;
  highlightUnits?: string[];
  splitParts?: string[];
  splitWords?: SplitWord[];
  simplifiedText?: string;
  audioUri?: string;
}

// ── 4. Reading Text Option Contract (Home & Modal selection) ───────────────────

export interface ReadingTextOption {
  id: string;
  text: string;
  textType: 'word' | 'short_sentence';
  gradeLevel: 1 | 2 | 3;
  difficultyResult: TextDifficultyResult;
}

// ── 5. Standard Test Cases A, B, C, D per Specification ────────────────────────

export const READING_SUPPORT_ITEMS: ReadingSupportItem[] = [
  // CASE A: Simple short word — splitNeeded=false, simplificationNeeded=false, maxSupportLevel=3 (Highlight + Audio only)
  {
    id: 'case_a',
    originalText: 'මල',
    textType: 'word',
    splitNeeded: false,
    simplificationNeeded: false,
    maxSupportLevel: 3,
    maxRetriesPerLevel: 1,
    highlightUnits: ['මල'],
    splitParts: ['ම', 'ල'],
    splitWords: [
      { word: 'මල', parts: ['ම', 'ල'] },
    ],
    audioUri: 'target_mala.mp3',
  },

  // CASE B: Word that actually benefits from splitting — splitNeeded=true, simplificationNeeded=false, maxSupportLevel=3 (Highlight + Split + Audio)
  {
    id: 'case_b',
    originalText: 'කුරුල්ලා',
    textType: 'word',
    splitNeeded: true,
    simplificationNeeded: false,
    maxSupportLevel: 3,
    maxRetriesPerLevel: 1,
    highlightUnits: ['කු', 'රු', 'ල්', 'ලා'],
    splitParts: ['කු', 'රු', 'ල්', 'ලා'],
    splitWords: [
      { word: 'කුරුල්ලා', parts: ['කු', 'රු', 'ල්', 'ලා'] },
    ],
    audioUri: 'target_kurulla.mp3',
  },

  // CASE C: Difficult short sentence — splitNeeded=true, simplificationNeeded=true, maxSupportLevel=4 (Highlight + Split + Audio + Simplification)
  {
    id: 'case_c',
    originalText: 'මම මගේ රටට ගොඩාක් ආදරෙයි',
    textType: 'short_sentence',
    splitNeeded: true,
    simplificationNeeded: true,
    maxSupportLevel: 4,
    maxRetriesPerLevel: 1,
    highlightUnits: ['මම', 'මගේ', 'රටට', 'ගොඩාක්', 'ආදරෙයි'],
    splitParts: ['ම', 'ම', 'ම', 'ගේ', 'ර', 'ට', 'ට', 'ගො', 'ඩා', 'ක්', 'ආ', 'ද', 'රෙ', 'යි'],
    splitWords: [
      { word: 'මම', parts: ['ම', 'ම'] },
      { word: 'මගේ', parts: ['ම', 'ගේ'] },
      { word: 'රටට', parts: ['ර', 'ට', 'ට'] },
      { word: 'ගොඩාක්', parts: ['ගො', 'ඩා', 'ක්'] },
      { word: 'ආදරෙයි', parts: ['ආ', 'ද', 'රෙ', 'යි'] },
    ],
    simplifiedText: 'මම මගේ රටට ආදරෙයි',
    audioUri: 'target_sentence_001.mp3',
  },

  // CASE D: Short sentence with splitNeeded=false, simplificationNeeded=true, maxSupportLevel=4 (Highlight + Audio + Simplification; Split skipped)
  {
    id: 'case_d',
    originalText: 'කුඩා ළමයා රසවත් නැවුම් කිරි බොනවා',
    textType: 'short_sentence',
    splitNeeded: false,
    simplificationNeeded: true,
    maxSupportLevel: 4,
    maxRetriesPerLevel: 1,
    highlightUnits: ['කුඩා', 'ළමයා', 'රසවත්', 'නැවුම්', 'කිරි', 'බොනවා'],
    splitParts: ['කු', 'ඩා', 'ළ', 'ම', 'යා', 'කි', 'රි', 'බො', 'න', 'වා'],
    splitWords: [
      { word: 'කුඩා', parts: ['කු', 'ඩා'] },
      { word: 'ළමයා', parts: ['ළ', 'ම', 'යා'] },
      { word: 'රසවත්', parts: ['ර', 'ස', 'ව', 'ත්'] },
      { word: 'නැවුම්', parts: ['නැ', 'වු', 'ම්'] },
      { word: 'කිරි', parts: ['කි', 'රි'] },
      { word: 'බොනවා', parts: ['බො', 'න', 'වා'] },
    ],
    simplifiedText: 'ළමයා කිරි බොනවා',
    audioUri: 'target_milk.mp3',
  },

  // Word test cases with valid Sinhala grapheme cluster units
  {
    id: 'word_mala',
    originalText: 'මල',
    textType: 'word',
    splitNeeded: false,
    simplificationNeeded: false,
    maxSupportLevel: 1,
    maxRetriesPerLevel: 1,
    highlightUnits: ['ම', 'ල'],
    splitParts: ['ම', 'ල'],
    splitWords: [
      { word: 'මල', parts: ['ම', 'ල'] },
    ],
    audioUri: 'target_mala.mp3',
  },
  {
    id: 'word_kurulla',
    originalText: 'කුරුල්ලා',
    textType: 'word',
    splitNeeded: true,
    simplificationNeeded: false,
    maxSupportLevel: 3,
    maxRetriesPerLevel: 1,
    highlightUnits: ['කු', 'රු', 'ල්', 'ලා'],
    splitParts: ['කු', 'රු', 'ල්', 'ලා'],
    splitWords: [
      { word: 'කුරුල්ලා', parts: ['කු', 'රු', 'ල්', 'ලා'] },
    ],
    audioUri: 'target_kurulla.mp3',
  },
];

// ── 6. Mock Educational Reading Options (Home & Select Modal) ──────────────────

export const MOCK_READING_OPTIONS: ReadingTextOption[] = [
  {
    id: 'case_c',
    text: 'මම මගේ රටට ගොඩාක් ආදරෙයි',
    textType: 'short_sentence',
    gradeLevel: 3,
    difficultyResult: {
      finalDifficultyLevel: 'hard',
      difficultyLevel: 'Hard',
      splitNeeded: true,
      simplificationNeeded: true,
      maxSupportLevel: 4,
      maxRetriesPerLevel: 1,
      highlightUnits: ['මම', 'මගේ', 'රටට', 'ගොඩාක්', 'ආදරෙයි'],
      splitParts: ['ම', 'ම', 'ම', 'ගේ', 'ර', 'ට', 'ට', 'ගො', 'ඩා', 'ක්', 'ආ', 'ද', 'රෙ', 'යි'],
      splitWords: [
        { word: 'මම', parts: ['ම', 'ම'] },
        { word: 'මගේ', parts: ['ම', 'ගේ'] },
        { word: 'රටට', parts: ['ර', 'ට', 'ට'] },
        { word: 'ගොඩාක්', parts: ['ගො', 'ඩා', 'ක්'] },
        { word: 'ආදරෙයි', parts: ['ආ', 'ද', 'රෙ', 'යි'] },
      ],
      simplifiedText: 'මම මගේ රටට ආදරෙයි',
      audioUri: 'target_sentence_001.mp3',
    },
  },
  {
    id: 'case_a',
    text: 'මල',
    textType: 'word',
    gradeLevel: 1,
    difficultyResult: {
      finalDifficultyLevel: 'medium',
      difficultyLevel: 'Medium',
      splitNeeded: false,
      simplificationNeeded: false,
      maxSupportLevel: 3,
      applicableSupportLevels: [1, 3],
      maxRetriesPerLevel: 1,
      highlightUnits: ['මල'],
      splitParts: ['ම', 'ල'],
      splitWords: [
        { word: 'මල', parts: ['ම', 'ල'] },
      ],
      audioUri: 'target_mala.mp3',
    },
  },
  {
    id: 'case_b',
    text: 'කුරුල්ලා',
    textType: 'word',
    gradeLevel: 2,
    difficultyResult: {
      finalDifficultyLevel: 'medium',
      difficultyLevel: 'Medium',
      splitNeeded: true,
      simplificationNeeded: false,
      maxSupportLevel: 3,
      applicableSupportLevels: [1, 2, 3],
      maxRetriesPerLevel: 1,
      highlightUnits: ['කු', 'රු', 'ල්', 'ලා'],
      splitParts: ['කු', 'රු', 'ල්', 'ලා'],
      splitWords: [
        { word: 'කුරුල්ලා', parts: ['කු', 'රු', 'ල්', 'ලා'] },
      ],
      audioUri: 'target_kurulla.mp3',
    },
  },
  {
    id: 'opt_kurulla',
    text: 'කුරුල්ලා',
    textType: 'word',
    gradeLevel: 2,
    difficultyResult: {
      finalDifficultyLevel: 'medium',
      difficultyLevel: 'Medium',
      splitNeeded: true,
      simplificationNeeded: false,
      maxSupportLevel: 3,
      maxRetriesPerLevel: 1,
      highlightUnits: ['කු', 'රු', 'ල්', 'ලා'],
      splitParts: ['කු', 'රු', 'ල්', 'ලා'],
      splitWords: [
        { word: 'කුරුල්ලා', parts: ['කු', 'රු', 'ල්', 'ලා'] },
      ],
      audioUri: 'target_kurulla.mp3',
    },
  },
  {
    id: 'opt_mala',
    text: 'මල',
    textType: 'word',
    gradeLevel: 1,
    difficultyResult: {
      finalDifficultyLevel: 'easy',
      difficultyLevel: 'Easy',
      splitNeeded: false,
      simplificationNeeded: false,
      maxSupportLevel: 1,
      maxRetriesPerLevel: 1,
      highlightUnits: ['ම', 'ල'],
      splitParts: ['ම', 'ල'],
      splitWords: [
        { word: 'මල', parts: ['ම', 'ල'] },
      ],
      audioUri: 'target_mala.mp3',
    },
  },
  {
    id: 'opt_forest',
    text: 'ලස්සන වනාන්තරයේ ගස් සහ මල් තිබේ',
    textType: 'short_sentence',
    gradeLevel: 2,
    difficultyResult: {
      finalDifficultyLevel: 'medium',
      difficultyLevel: 'Medium',
      splitNeeded: true,
      simplificationNeeded: false,
      maxSupportLevel: 3,
      maxRetriesPerLevel: 1,
      highlightUnits: ['ලස්සන', 'වනාන්තරයේ', 'ගස්', 'සහ', 'මල්', 'තිබේ'],
      splitParts: ['ල', 'ස්ස', 'න', 'ව', 'නා', 'න්', 'ත', 'ර', 'යේ', 'ග', 'ස්', 'ස', 'හ', 'ම', 'ල්', 'ති', 'බේ'],
      splitWords: [
        { word: 'ලස්සන', parts: ['ල', 'ස්ස', 'න'] },
        { word: 'වනාන්තරයේ', parts: ['ව', 'නා', 'න්', 'ත', 'ර', 'යේ'] },
        { word: 'ගස්', parts: ['ග', 'ස්'] },
        { word: 'සහ', parts: ['ස', 'හ'] },
        { word: 'මල්', parts: ['ම', 'ල්'] },
        { word: 'තිබේ', parts: ['ති', 'බේ'] },
      ],
      simplifiedText: 'ලස්සන වනයේ ගස් තිබේ',
      audioUri: 'target_forest.mp3',
    },
  },
  {
    id: 'case_d',
    text: 'කුඩා ළමයා රසවත් නැවුම් කිරි බොනවා',
    textType: 'short_sentence',
    gradeLevel: 3,
    difficultyResult: {
      finalDifficultyLevel: 'hard',
      difficultyLevel: 'Hard',
      splitNeeded: false,
      simplificationNeeded: true,
      maxSupportLevel: 4,
      applicableSupportLevels: [1, 3, 4],
      maxRetriesPerLevel: 1,
      highlightUnits: ['කුඩා', 'ළමයා', 'රසවත්', 'නැවුම්', 'කිරි', 'බොනවා'],
      splitParts: ['කු', 'ඩා', 'ළ', 'ම', 'යා', 'කි', 'රි', 'බො', 'න', 'වා'],
      splitWords: [
        { word: 'කුඩා', parts: ['කු', 'ඩා'] },
        { word: 'ළමයා', parts: ['ළ', 'ම', 'යා'] },
        { word: 'රසවත්', parts: ['ර', 'ස', 'ව', 'ත්'] },
        { word: 'නැවුම්', parts: ['නැ', 'වු', 'ම්'] },
        { word: 'කිරි', parts: ['කි', 'රි'] },
        { word: 'බොනවා', parts: ['බො', 'න', 'වා'] },
      ],
      simplifiedText: 'ළමයා කිරි බොනවා',
      audioUri: 'target_milk.mp3',
    },
  },
];

// ── 7. Helper & Service Functions ─────────────────────────────────────────────

/**
 * Returns the list of curated reading text options.
 */
export function getReadingTextOptions(): ReadingTextOption[] {
  return MOCK_READING_OPTIONS;
}

/**
 * Finds a pre-configured option by ID or text.
 */
export function findReadingOption(identifier: string): ReadingTextOption | undefined {
  return MOCK_READING_OPTIONS.find(
    (opt) => opt.id === identifier || opt.text === identifier
  );
}

/**
 * Splits Sinhala text into linguistically safe akuru/syllable/grapheme clusters.
 * Groups consonants with pillam, virama/al-lakuna, and zero-width joiners. Never uses naive split('').
 */
export function splitSinhalaGraphemes(text: string): string[] {
  const matches = text.match(/[\u0D80-\u0DFF](?:\u0DCA\u200D[\u0D85-\u0DC6]|[\u0D82\u0D83\u0DCA\u0DCF-\u0DF4])*/g);
  if (matches && matches.length > 0) {
    return matches;
  }
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Evaluates text difficulty according to the future ML contract.
 * Checks predefined ReadingSupportItems and MOCK_READING_OPTIONS first.
 * For custom text:
 * - Sentences: safely uses whitespace tokenization for word boundaries.
 * - Single words: preserves intact without using naive JavaScript character splitting.
 */
export function getTextDifficulty(
  text: string,
  gradeLevel: number = 2
): TextDifficultyResult {
  const trimmed = text.trim();

  // 1. Check known reading support items
  const supportItem = READING_SUPPORT_ITEMS.find(
    (item) => item.id === trimmed || item.originalText === trimmed
  );
  if (supportItem) {
    const finalDifficultyLevel: 'easy' | 'medium' | 'hard' =
      supportItem.maxSupportLevel === 4
        ? 'hard'
        : supportItem.maxSupportLevel >= 2
        ? 'medium'
        : 'easy';
    const applicableSupportLevels = getApplicableSupportLevels({
      maxSupportLevel: supportItem.maxSupportLevel,
      splitNeeded: supportItem.splitNeeded,
      simplificationNeeded: supportItem.simplificationNeeded,
      simplifiedText: supportItem.simplifiedText,
    });
    return {
      finalDifficultyLevel,
      difficultyLevel: (finalDifficultyLevel.charAt(0).toUpperCase() +
        finalDifficultyLevel.slice(1)) as any,
      splitNeeded: supportItem.splitNeeded,
      simplificationNeeded: supportItem.simplificationNeeded,
      maxSupportLevel: supportItem.maxSupportLevel,
      applicableSupportLevels,
      maxRetriesPerLevel: supportItem.maxRetriesPerLevel,
      highlightUnits: supportItem.highlightUnits,
      splitParts: supportItem.splitParts,
      splitWords: supportItem.splitWords,
      simplifiedText: supportItem.simplifiedText,
      audioUri: supportItem.audioUri,
    };
  }

  // 2. Check known reading options
  const known = findReadingOption(trimmed);
  if (known) {
    const res = known.difficultyResult;
    return {
      ...res,
      applicableSupportLevels:
        res.applicableSupportLevels ||
        getApplicableSupportLevels({
          maxSupportLevel: res.maxSupportLevel,
          splitNeeded: res.splitNeeded,
          simplificationNeeded: res.simplificationNeeded,
          simplifiedText: res.simplifiedText,
        }),
    };
  }

  // 3. Fallback heuristic for custom entered Sinhala text
  const words = trimmed.split(/\s+/).filter(Boolean);
  const isWord = words.length <= 1;
  const splitNeeded = isWord ? trimmed.length >= 4 : words.length >= 2;
  const simplificationNeeded = !isWord && words.length >= 3;
  const maxSupportLevel: 1 | 2 | 3 | 4 = simplificationNeeded
    ? 4
    : splitNeeded
    ? 3
    : 1;

  const finalDifficultyLevel: 'easy' | 'medium' | 'hard' =
    maxSupportLevel === 4 ? 'hard' : maxSupportLevel === 3 ? 'medium' : 'easy';

  // Section 8: Sentence fallback uses whitespace tokenization for word highlights.
  // Section 7: Akuru/syllable split uses grapheme cluster matching (never naive split('')).
  const highlightUnits = isWord ? [trimmed] : words;
  const splitParts = splitSinhalaGraphemes(trimmed);

  const simplifiedText = simplificationNeeded
    ? words.slice(0, Math.max(2, words.length - 1)).join(' ')
    : undefined;

  const applicableSupportLevels = getApplicableSupportLevels({
    maxSupportLevel,
    splitNeeded,
    simplificationNeeded,
    simplifiedText,
  });

  return {
    finalDifficultyLevel,
    difficultyLevel: (finalDifficultyLevel.charAt(0).toUpperCase() +
      finalDifficultyLevel.slice(1)) as any,
    splitNeeded,
    simplificationNeeded,
    maxSupportLevel,
    applicableSupportLevels,
    maxRetriesPerLevel: 1,
    highlightUnits,
    splitParts,
    splitWords: isWord ? [{ word: trimmed, parts: splitParts }] : undefined,
    simplifiedText,
    audioUri: undefined,
  };
}
