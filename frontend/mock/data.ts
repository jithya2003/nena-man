// =============================================================================
// Mock Data & Simulated AI Responses — nena-man Prototype
// All AI module responses are mocked here for the prototype demo.
// In Phase 2 these are replaced by real API calls via frontend/services/.
// =============================================================================

import type {
  Child,
  ParentUser,
  ReadingText,
  M1Response,
  M2Response,
  M3Response,
  M4Response,
  RewardBadge,
  ClassroomSummary,
  StudentProfile,
  RoadmapStage,
  SkillDimension,
  PeerCluster,
  SimulationInputs,
  SimulationOutputs,
  SessionData,
  ProgressDataPoint,
  ErrorBreakdown,
} from "@/types";

// ── Mock Users ────────────────────────────────────────────────────────────────

export const MOCK_CHILD: Child = {
  id: "child_001",
  name: "සෙනුලි පෙරේරා",
  age: 10,
  grade: 5,
  readingLevel: "medium",
  streak: 5,
  stars: 42,
  totalSessions: 38,
  avatarColor: "#0B7A44",
};

export const MOCK_PARENT: ParentUser = {
  id: "parent_001",
  name: "Mrs. Perera",
  role: "parent",
  children: [MOCK_CHILD],
};

// ── Reading Texts ─────────────────────────────────────────────────────────────

export const MOCK_READING_TEXTS: ReadingText[] = [
  {
    id: "text_001",
    sinhala: "මම මගේ රටට ගොඩාක් ආදරෙයි",
    simplifiedSinhala: "මම මගේ රටට ආදරෙයි",
    english: "I love my country very much",
    simplifiedEnglish: "I love my country",
    syllables: ["ම", "ම", "ම", "ගේ", "ර", "ට", "ට", "ආ", "ද", "රෙ", "යි"],
    difficulty: "medium",
    pictureEmoji: "",
    hint: "A sentence expressing love for our motherland.",
    category: "sentence",
  },
  {
    id: "text_002",
    sinhala: "ලස්සන වනාන්තරයේ ගස් සහ මල් තිබේ",
    simplifiedSinhala: "ලස්සන වනයේ ගස් තිබේ",
    english: "There are trees and flowers in the beautiful forest",
    simplifiedEnglish: "There are trees in the beautiful forest",
    syllables: ["ල", "ස්ස", "න", "ව", "නා", "න්", "ත", "ර", "යේ"],
    difficulty: "medium",
    pictureEmoji: "🌿",
    hint: "A place full of big green trees and nature.",
    category: "sentence",
  },
  {
    id: "text_003",
    sinhala: "සූර්ය ආලෝකය පොළොවට වැටෙනවා",
    simplifiedSinhala: "ඉර එළිය වැටෙනවා",
    english: "Sunlight falls upon the earth",
    simplifiedEnglish: "Sunlight is shining",
    syllables: ["සූ", "ර්ය", "ආ", "ලෝ", "ක", "ය"],
    difficulty: "hard",
    pictureEmoji: "☀️",
    hint: "The bright warm light that comes from the sun.",
    category: "sentence",
  },
  {
    id: "text_004",
    sinhala: "පාසල් මිතුරන් එකට සෙල්ලම් කරනවා",
    simplifiedSinhala: "යහළුවන් සෙල්ලම් කරනවා",
    english: "School friends are playing together",
    simplifiedEnglish: "Friends are playing",
    syllables: ["පා", "ස", "ල්", "මි", "තු", "ර", "න්"],
    difficulty: "medium",
    pictureEmoji: "⚽",
    hint: "Children having fun playing sports together.",
    category: "sentence",
  },
  {
    id: "text_005",
    sinhala: "කුඩා ළමයා රසවත් නැවුම් කිරි බොනවා",
    simplifiedSinhala: "ළමයා කිරි බොනවා",
    english: "The small child is drinking fresh tasty milk",
    simplifiedEnglish: "The child drinks milk",
    syllables: ["කු", "ඩා", "ළ", "ම", "යා", "කි", "රි", "බො", "න", "වා"],
    difficulty: "easy",
    pictureEmoji: "🥛",
    hint: "A child having their nutritious morning drink.",
    category: "sentence",
  },
];

// ── Mock M1 Response — Speech Error Classifier ────────────────────────────────

export const MOCK_M1_RESPONSE: M1Response = {
  transcription: "මම මගේ රටට ගොඩක් ආදරෙයි",
  errors: [
    { type: "substitution", word: "ගොඩාක්", detected: "ගොඩක්", severity: 0.45 },
  ],
  overallSeverity: 0.35,
  errorCount: 1,
  accuracy: 82,
};

export const MOCK_M1_GOOD: M1Response = {
  transcription: "මම මගේ රටට ආදරෙයි",
  errors: [],
  overallSeverity: 0.05,
  errorCount: 0,
  accuracy: 98,
};

// ── Mock M2 Response — Text Difficulty & AI Sentence Simplification ───────────

export const MOCK_M2_RESPONSE: M2Response = {
  difficultyLevel: "medium",
  originalSentence: "මම මගේ රටට ගොඩාක් ආදරෙයි",
  simplifiedSentence: "මම මගේ රටට ආදරෙයි",
  simplificationRule: "M2 Simplification Model removed the elongated modifier 'ගොඩාක්' to reduce visual clutter and phonological working memory load.",
  suggestedSupport: ["simplification", "highlight", "syllable_split"],
  supportFlags: {
    simplification: true,
    highlight: true,
    syllable_split: true,
    audio: false,
    picture: false,
  },
  syllables: ["ම", "ම", "ම", "ගේ", "ර", "ට", "ට", "ආ", "ද", "රෙ", "යි"],
};

// ── Member 3: Learning Pathway Roadmap Stages ─────────────────────────────────

export const MOCK_ROADMAP_STAGES: RoadmapStage[] = [
  {
    id: "stage_1",
    stageNumber: 1,
    title: "Basic Sinhala Akuru Mastery",
    subtitle: "Isolated letters and basic vowel sound recognition",
    status: "completed",
    progressPercentage: 100,
    targetSkills: ["Clear vowel distinction", "Zero letter reversals (බ/ඩ)"],
    estimatedDaysLeft: 0,
  },
  {
    id: "stage_2",
    stageNumber: 2,
    title: "Syllable Decoding & Kombuwa (ෙ)",
    subtitle: "Connecting consonants with vowel signs (පිල්ලම්)",
    status: "current",
    progressPercentage: 65,
    targetSkills: ["Kombuwa (ෙ) decoding", "Al-lakuna (්) pauses", "2-syllable blends"],
    estimatedDaysLeft: 4,
  },
  {
    id: "stage_3",
    stageNumber: 3,
    title: "Compound Words & Sentence Simplification",
    subtitle: "Multi-syllable Sinhala words in contextual reading",
    status: "locked",
    progressPercentage: 0,
    targetSkills: ["Bandhi Akuru", "Colloquial modifier reduction"],
    estimatedDaysLeft: 12,
  },
  {
    id: "stage_4",
    stageNumber: 4,
    title: "Connected Sinhala Sentence Fluency",
    subtitle: "Reading full natural sentences with rhythm and expression",
    status: "locked",
    progressPercentage: 0,
    targetSkills: ["Pacing > 35 WPM", "Self-correction on hesitation"],
    estimatedDaysLeft: 21,
  },
  {
    id: "stage_5",
    stageNumber: 5,
    title: "Independent Story Comprehension",
    subtitle: "Paragraph-level reading with full comprehension",
    status: "locked",
    progressPercentage: 0,
    targetSkills: ["Passage recall", "Zero scaffolding independence"],
    estimatedDaysLeft: 35,
  },
];

// ── Member 3: 5D Clinical Skill Dimensions ────────────────────────────────────

export const MOCK_SKILL_DIMENSIONS: SkillDimension[] = [
  {
    id: "dim_accuracy",
    label: "Phonological Decoding",
    studentScore: 82,
    peerCohortAvg: 74,
    icon: "🎯",
    description: "Accuracy in matching Sinhala graphemes to correct spoken phonemes.",
  },
  {
    id: "dim_speed",
    label: "Reading Pace (WPM)",
    studentScore: 78,
    peerCohortAvg: 65,
    icon: "⏱️",
    description: "Reading velocity measured against age-normed dyslexic benchmarks.",
  },
  {
    id: "dim_resilience",
    label: "Error Recovery",
    studentScore: 76,
    peerCohortAvg: 68,
    icon: "🛡️",
    description: "Ability to self-correct substitutions without emotional breakdown.",
  },
  {
    id: "dim_engagement",
    label: "Affective Engagement",
    studentScore: 88,
    peerCohortAvg: 80,
    icon: "⚡",
    description: "Attention span, motivation, and positive emotional state index.",
  },
  {
    id: "dim_pillam",
    label: "Vowel Sign (Pillam) Mastery",
    studentScore: 70,
    peerCohortAvg: 65,
    icon: "🔤",
    description: "Accuracy in decoding complex vowel diacritics (ඇලපිල්ල, පාපිල්ල).",
  },
];

// ── Member 3: Peer Clusters ───────────────────────────────────────────────────

export const MOCK_PEER_CLUSTERS: PeerCluster[] = [
  {
    clusterId: "cluster_a",
    clusterName: "Fast Accelerators (Cluster A)",
    size: 42,
    description: "Students demonstrating rapid phonological recovery with minimal scaffolding.",
    color: "#3A7CA5",
  },
  {
    clusterId: "cluster_b",
    clusterName: "Steady Scaffolding Learners (Cluster B — Nimasha)",
    size: 140,
    description: "Consistent progress when supported by Syllable Splitting & AI Simplification.",
    color: "#E8A33D",
  },
  {
    clusterId: "cluster_c",
    clusterName: "High Support / Audio-First (Cluster C)",
    size: 58,
    description: "Learners requiring multi-sensory audio cues and visual picture scaffolding.",
    color: "#8D6B94",
  },
];

// ── Mock M3 Response — Adaptive Recommendation Engine & Explainable AI (XAI) ─

export const MOCK_M3_RESPONSE: M3Response = {
  recommendation: "Maintain",
  nextActivityId: "text_002",
  nextActivityLabel: "Beautiful Forest (Simplified Level 2)",
  targetPhonemeSkill: "Sinhala 'Kombuwa' (ෙ) and 'Al-lakuna' (්) recognition",
  rationale:
    "Student demonstrates 82% accuracy with M2 simplification. Model recommends maintaining Medium difficulty while practicing target vowel signs to reinforce phonological decoding before advancing.",
  confidence: 0.88,
  xaiFactors: [
    {
      name: "Recent Accuracy Trend",
      weight: 42,
      direction: "positive",
      description: "Consistent 80%+ accuracy on simplified sentences supports maintaining current level.",
    },
    {
      name: "Hesitation Error Frequency",
      weight: 34,
      direction: "neutral",
      description: "Minor hesitation on elongated vowels suggests giving more practice before difficulty increase.",
    },
    {
      name: "Cognitive Fatigue Metric",
      weight: 24,
      direction: "positive",
      description: "Low frustration score indicates student is comfortable with current pace.",
    },
  ],
  peerBenchmark: {
    cohortName: "Grade 2 Sinhala Dyslexic Peer Cohort (n=140)",
    similarityScore: 89,
    averageGrowthRate: "+18% accuracy over 3 weeks",
    comparisonNote:
      "Nimasha's progression closely matches the top quartile of learners who achieved independent reading fluency using syllable scaffolding.",
  },
  roadmapStages: MOCK_ROADMAP_STAGES,
  skillDimensions: MOCK_SKILL_DIMENSIONS,
};

// ── Member 3: What-If Pedagogical Simulator Logic ─────────────────────────────

export function simulateRecommendation(inputs: SimulationInputs): SimulationOutputs {
  let baseAcc = 82;
  let frustration = 18;
  let daysLeft = 4;

  // Difficulty adjustment impact
  if (inputs.difficultyLevel === 'easy') {
    baseAcc += 10;
    frustration -= 10;
    daysLeft += 3; // slower learning velocity
  } else if (inputs.difficultyLevel === 'hard') {
    baseAcc -= 18;
    frustration += 38;
    daysLeft -= 1; // higher intensity
  }

  // Scaffolding adjustment impact
  if (inputs.supportLevel === 'simplification' || inputs.supportLevel === 'syllable_split') {
    baseAcc += 6;
    frustration -= 8;
  } else if (inputs.supportLevel === 'audio') {
    baseAcc += 12;
    frustration -= 12;
  }

  // Daily minutes impact
  if (inputs.dailyMinutes >= 15) {
    daysLeft = Math.max(1, daysLeft - 2);
    frustration += 6;
  } else if (inputs.dailyMinutes <= 5) {
    daysLeft += 4;
    frustration -= 6;
  }

  return {
    predictedAccuracy: Math.min(98, Math.max(45, baseAcc)),
    frustrationRisk: Math.min(95, Math.max(5, frustration)),
    timeToNextMilestoneDays: Math.max(1, daysLeft),
    confidenceRating: 91,
  };
}

// ── Mock M4 Response — Behavioral State & Gamified Rewards ───────────────────

export const MOCK_REWARD_BADGES: RewardBadge[] = [
  {
    id: "badge_1",
    title: "Akuru Master",
    icon: "🔤",
    description: "Decoded 10 complex Sinhala syllables without hesitation.",
    category: "mastery",
    unlockedAt: "Today",
  },
  {
    id: "badge_2",
    title: "Persistence Hero",
    icon: "🛡️",
    description: "Completed 5 consecutive reading sessions without giving up.",
    category: "persistence",
    unlockedAt: "Yesterday",
  },
  {
    id: "badge_3",
    title: "Fluency Star",
    icon: "🏆",
    description: "Achieved over 80% accuracy on full Sinhala sentences.",
    category: "fluency",
    unlockedAt: "Aug 21",
  },
  {
    id: "badge_4",
    title: "Calm Mind Breather",
    icon: "🌬️",
    description: "Completed a full 3-cycle balloon breathing relaxation break.",
    category: "calmness",
    unlockedAt: "Aug 20",
  },
];

export const MOCK_M4_FRUSTRATED: M4Response = {
  state: "frustrated",
  confidence: 0.84,
  engagementScore: 48,
  fatigueLevel: 0.72,
  interventionTriggered: true,
  intervention: "star_game",
  message: "You've worked so hard! Let's take a relaxing Star Catching or Breathing Break. 🌟",
  badgesAvailable: MOCK_REWARD_BADGES,
};

export const MOCK_M4_FOCUSED: M4Response = {
  state: "focused",
  confidence: 0.92,
  engagementScore: 88,
  fatigueLevel: 0.18,
  interventionTriggered: false,
  intervention: "motivational",
  message: "Outstanding focus and energy! Keep shining! 🎉",
  badgesAvailable: MOCK_REWARD_BADGES,
};

// ── Mock Classroom & Teacher Clinical Data ────────────────────────────────────

export const MOCK_STUDENTS: StudentProfile[] = [
  {
    id: "child_001",
    name: "Nimasha",
    age: 7,
    grade: 2,
    readingLevel: "medium",
    streak: 5,
    stars: 42,
    totalSessions: 18,
    avatarColor: "#E8A33D",
    lastActive: "10 mins ago",
    latestAccuracy: 82,
    primaryErrorType: "hesitation",
    engagementIndex: 86,
    notes: "Responds very well to AI Sentence Simplification. Ready for Level 2 Syllable practice.",
  },
  {
    id: "child_002",
    name: "Kusal",
    age: 8,
    grade: 3,
    readingLevel: "hard",
    streak: 7,
    stars: 56,
    totalSessions: 24,
    avatarColor: "#3A7CA5",
    lastActive: "1 hour ago",
    latestAccuracy: 88,
    primaryErrorType: "substitution",
    engagementIndex: 92,
    notes: "High reading stamina. Shows minor letter reversal on 'ඩ' and 'බ'.",
  },
  {
    id: "child_003",
    name: "Dilshan",
    age: 7,
    grade: 2,
    readingLevel: "easy",
    streak: 3,
    stars: 28,
    totalSessions: 12,
    avatarColor: "#C1666B",
    lastActive: "Yesterday",
    latestAccuracy: 68,
    primaryErrorType: "omission",
    engagementIndex: 65,
    notes: "Benefits significantly from visual cues and audio pronunciation support.",
  },
  {
    id: "child_004",
    name: "Rashmi",
    age: 7,
    grade: 2,
    readingLevel: "medium",
    streak: 4,
    stars: 35,
    totalSessions: 15,
    avatarColor: "#8D6B94",
    lastActive: "2 days ago",
    latestAccuracy: 74,
    primaryErrorType: "reversal",
    engagementIndex: 78,
    notes: "Great improvement in focus after calming balloon breathing exercises.",
  },
];

export const MOCK_CLASSROOM: ClassroomSummary = {
  id: "class_grade2_b",
  className: "Grade 2 - Lotus Special Ed",
  grade: 2,
  teacherName: "Mrs. Jayasinghe (Special Educator)",
  totalStudents: 4,
  avgAccuracy: 78,
  classEngagementIndex: 82,
  topErrorDistribution: {
    substitution: 18,
    omission: 12,
    reversal: 8,
    hesitation: 22,
  },
  students: MOCK_STUDENTS,
};

// ── Mock Progress Data ────────────────────────────────────────────────────────

export const MOCK_PROGRESS: ProgressDataPoint[] = [
  { session: 1, accuracy: 58, date: "2026-08-17", label: "Sun" },
  { session: 2, accuracy: 65, date: "2026-08-18", label: "Mon" },
  { session: 3, accuracy: 72, date: "2026-08-19", label: "Tue" },
  { session: 4, accuracy: 70, date: "2026-08-20", label: "Wed" },
  { session: 5, accuracy: 78, date: "2026-08-21", label: "Thu" },
  { session: 6, accuracy: 84, date: "2026-08-22", label: "Fri" },
  { session: 7, accuracy: 82, date: "2026-08-23", label: "Sat" },
];

export const MOCK_ERROR_BREAKDOWN: ErrorBreakdown = {
  substitution: 10,
  omission: 7,
  reversal: 4,
  hesitation: 12,
};

export const MOCK_SESSIONS: SessionData[] = [
  {
    id: "session_001",
    date: "2026-08-23",
    textId: "text_001",
    accuracy: 82,
    durationSeconds: 110,
    errorCount: 1,
    behaviorState: "focused",
    starsEarned: 3,
  },
  {
    id: "session_002",
    date: "2026-08-22",
    textId: "text_002",
    accuracy: 84,
    durationSeconds: 140,
    errorCount: 1,
    behaviorState: "engaged",
    starsEarned: 3,
  },
  {
    id: "session_003",
    date: "2026-08-21",
    textId: "text_003",
    accuracy: 78,
    durationSeconds: 180,
    errorCount: 2,
    behaviorState: "frustrated",
    starsEarned: 2,
  },
  {
    id: "session_004",
    date: "2026-08-20",
    textId: "text_004",
    accuracy: 70,
    durationSeconds: 195,
    errorCount: 3,
    behaviorState: "tired",
    starsEarned: 2,
  },
];

// Helper to simulate asynchronous API delay
export function simulateApi<T>(data: T, delayMs: number = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}
