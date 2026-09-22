/**
 * Sinhala Phoneme & Speech Error Analyzer for Dyslexia Learning (Nena Man)
 * Specialized in early primary (Age 7-8) Sinhala phonological error patterns.
 */

export interface PhonemeAnalysisResult {
  isCorrect: boolean;
  score: number; // 0 to 100
  spokenText: string;
  expectedText: string;
  errorType?: 'voicing_swap' | 'vowel_length' | 'pillam_omission' | 'liquid_confusion' | 'sibilant_confusion' | 'incomplete' | 'clean';
  feedbackTitle: string;
  feedbackExplanation: string;
  articulationTip: string;
  syllableBreakdown: {
    syllable: string;
    status: 'correct' | 'error' | 'warning';
  }[];
}

// Common Sinhala Dyslexic Phonetic Confusion Mapping
const COMMON_CONFUSIONS: Record<string, { confusedWith: string[]; tip: string }> = {
  'ක': {
    confusedWith: ['ග', 'ත', 'ප'],
    tip: "'ක' ශබ්දය උගුරෙන් නිකුත් වන තද ශබ්දයකි. දිව පසුපස උඩුතල්ලේ ස්පර්ශ කර හුස්ම මුදාහරින්න 🗣️",
  },
  'ග': {
    confusedWith: ['ක', 'ද', 'බ'],
    tip: "'ග' ශබ්දය උගුරේ කම්පනයක් සහිත මෘදු ශබ්දයකි. උගුර අතින් අල්ලා කම්පනය හඳුනාගන්න 🗣️",
  },
  'ප': {
    confusedWith: ['බ', 'ම', 'ත'],
    tip: "'ප' ශබ්දය තොල් දෙක එකතු කර එක්වරම විවෘත කිරීමෙන් නිකුත් වේ 👄",
  },
  'බ': {
    confusedWith: ['ප', 'ද', 'ම'],
    tip: "'බ' ශබ්දය තොල් දෙක කම්පනය කරමින් ශබ්ද පිටකළ යුතු මෘදු අකුරකි 👄",
  },
  'ත': {
    confusedWith: ['ද', 'ට', 'ක'],
    tip: "'ත' ශබ්දය දිව උඩු දත්වල ස්පර්ශ කර නිකුත් කරන ශබ්දයකි 🦷",
  },
  'ද': {
    confusedWith: ['ත', 'ඩ', 'ග'],
    tip: "'ද' ශබ්දයේදී දිව උඩුදත් මුල තබා කටහඬ කම්පනය කරන්න 🦷",
  },
  'ර': {
    confusedWith: ['ල', 'ය'],
    tip: "'ර' ශබ්දයේදී දිවේ අග උඩුතල්ලේ මෘදුව කම්පනය විය යුතුය 👅",
  },
  'ල': {
    confusedWith: ['ර', 'න'],
    tip: "'ල' ශබ්දයේදී දිවේ අග උඩුදත් මුල ස්ථිරව තබා දෙපසින් වාතය යවන්න 👅",
  },
  'ස': {
    confusedWith: ['හ', 'ශ', 'ෂ'],
    tip: "'ස' ශබ්දය දත් අතරින් සෙමින් වාතය පිටකරමින් නිකුත් කරන්න 🌬️",
  },
  'ම': {
    confusedWith: ['න', 'ප', 'බ'],
    tip: "'ම' ශබ්දය නාසයෙන් සහ තොල් දෙක එක්කර නිකුත් කරන ශබ්දයකි 👃",
  },
};

/**
 * Analyzes spoken Sinhala text against target expected letter, word, or sentence.
 */
export function analyzeSpeechPronunciation(
  spoken: string,
  expected: string,
  mode: 'letter' | 'word' | 'sentence' = 'letter'
): PhonemeAnalysisResult {
  const cleanSpoken = spoken.trim().toLowerCase();
  const cleanExpected = expected.trim().toLowerCase();

  // 1. Exact match
  if (cleanSpoken === cleanExpected || cleanSpoken.includes(cleanExpected)) {
    return {
      isCorrect: true,
      score: 96,
      spokenText: spoken,
      expectedText: expected,
      errorType: 'clean',
      feedbackTitle: 'විශිෂ්ටයි! නිවැරදි උච්චාරණය 🌟',
      feedbackExplanation: `ඔබ "${expected}" ඉතා පැහැදිලිව සහ නිවැරදිව උච්චාරණය කළා.`,
      articulationTip: 'ඉතා විශිෂ්ට උත්සාහයක්! මේ ආකාරයටම ඉදිරියට යමු! 🌱',
      syllableBreakdown: [{ syllable: expected, status: 'correct' }],
    };
  }

  // 2. Letter / Phoneme Specific Analysis
  if (mode === 'letter') {
    const confusionRule = COMMON_CONFUSIONS[cleanExpected];
    const spokenFirstChar = cleanSpoken.charAt(0) || cleanSpoken;

    if (confusionRule && confusionRule.confusedWith.includes(spokenFirstChar)) {
      return {
        isCorrect: false,
        score: 45,
        spokenText: spokenFirstChar || spoken,
        expectedText: expected,
        errorType: 'voicing_swap',
        feedbackTitle: 'නැවත උත්සාහ කරමු 🌱',
        feedbackExplanation: `ඔබ පැවසුවේ "${spokenFirstChar}" ශබ්දයයි. මෙහි ඉලක්ක අකුර වන්නේ "${expected}" අකුරයි.`,
        articulationTip: confusionRule.tip,
        syllableBreakdown: [
          { syllable: expected, status: 'error' },
        ],
      };
    }

    return {
      isCorrect: false,
      score: 30,
      spokenText: spoken,
      expectedText: expected,
      errorType: 'incomplete',
      feedbackTitle: 'නැවත අසමු සහ කියමු 🌱',
      feedbackExplanation: `ශබ්දය "${expected}" ලෙස පැහැදිලිව ශබ්ද නගා කියන්න.`,
      articulationTip: confusionRule ? confusionRule.tip : 'කට හොඳින් විවෘත කර ශබ්දය නිකුත් කරන්න 🗣️',
      syllableBreakdown: [{ syllable: expected, status: 'error' }],
    };
  }

  // 3. Word Level Syllable Breakdown Analysis
  if (mode === 'word') {
    // Example: "මාළු", "මල", "ගස"
    const expectedChars = Array.from(cleanExpected);
    const spokenChars = Array.from(cleanSpoken);

    const breakdown = expectedChars.map((char, index) => {
      const spokenChar = spokenChars[index];
      const isMatch = spokenChar === char;
      return {
        syllable: char,
        status: isMatch ? ('correct' as const) : ('error' as const),
      };
    });

    const matchedCount = breakdown.filter((b) => b.status === 'correct').length;
    const score = Math.round((matchedCount / expectedChars.length) * 100);

    const isClose = score >= 50;

    return {
      isCorrect: score >= 80,
      score: score > 0 ? score : 25,
      spokenText: spoken,
      expectedText: expected,
      errorType: isClose ? 'pillam_omission' : 'incomplete',
      feedbackTitle: score >= 80 ? 'ඉතා හොඳයි! 🌟' : 'තව ටිකක් පුහුණු වෙමු 🌱',
      feedbackExplanation:
        score >= 80
          ? `ඔබ "${expected}" වචනය ඉතා හොඳින් උච්චාරණය කළා.`
          : `ඔබ පැවසුවේ "${spoken}". ඉලක්ක වචනය "${expected}".`,
      articulationTip: 'වචනයේ එක් එක් අකුර සහ පිල්ලම් වෙන් වෙන්ව හඳුනාගෙන කියන්න 📖',
      syllableBreakdown: breakdown,
    };
  }

  // 4. Sentence Level Word Breakdown Analysis
  const expectedWords = cleanExpected.split(/\s+/).filter(Boolean);
  const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

  const sentenceBreakdown = expectedWords.map((word) => {
    const isFound = spokenWords.some((sw) => sw.includes(word) || word.includes(sw));
    return {
      syllable: word,
      status: isFound ? ('correct' as const) : ('error' as const),
    };
  });

  const correctWordsCount = sentenceBreakdown.filter((s) => s.status === 'correct').length;
  const sentenceScore = Math.round((correctWordsCount / expectedWords.length) * 100);

  return {
    isCorrect: sentenceScore >= 70,
    score: sentenceScore,
    spokenText: spoken,
    expectedText: expected,
    errorType: sentenceScore >= 70 ? 'clean' : 'incomplete',
    feedbackTitle: sentenceScore >= 70 ? 'විශිෂ්ට කියවීමක්! 🌟' : 'හෙමින් නැවත කියවමු 🌱',
    feedbackExplanation:
      sentenceScore >= 70
        ? 'ඔබ සම්පූර්ණ වාක්‍යයම ඉතා චතුර ලෙස කියවා අවසන් කළා!'
        : `වාක්‍යයේ වචන ${expectedWords.length} න් ${correctWordsCount} ක් ඔබ නිවැරදිව කියෙව්වා.`,
    articulationTip: 'හෙමින් කියවන්න. ඉක්මන් වෙන්න අවශ්‍ය නැහැ. සෑම වචනයක්ම පැහැදිලිව උච්චාරණය කරන්න 💚',
    syllableBreakdown: sentenceBreakdown,
  };
}
