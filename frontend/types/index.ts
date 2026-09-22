// =============================================================================
// TypeScript Interfaces & Types — nena-man
// Shared type definitions used across all screens and components.
// =============================================================================

// ── User / Auth ───────────────────────────────────────────────────────────────

export type UserRole = 'child' | 'parent' | 'teacher';

export interface Child {
  id: string;
  name: string;
  age: number;
  grade: number;
  readingLevel: DifficultyLevel;
  streak: number;
  stars: number;
  totalSessions: number;
  avatarColor: string;
}

export interface ParentUser {
  id: string;
  name: string;
  role: 'parent' | 'teacher';
  children: Child[];
}

// ── Reading Content ───────────────────────────────────────────────────────────

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ReadingText {
  id: string;
  sinhala: string;
  simplifiedSinhala?: string;
  english: string;
  simplifiedEnglish?: string;
  syllables: string[];
  difficulty: DifficultyLevel;
  pictureEmoji: string;
  hint?: string;
  category: 'word' | 'sentence' | 'passage';
}

// ── M1 — Speech Error Classifier (Dual-ASR) ──────────────────────────────────

export type ErrorType = 'substitution' | 'omission' | 'reversal' | 'hesitation';

export interface ReadingError {
  type: ErrorType;
  word: string;
  detected: string;
  severity: number; // 0.0 – 1.0
}

export interface M1Response {
  transcription: string;
  errors: ReadingError[];
  overallSeverity: number;
  errorCount: number;
  accuracy: number; // 0 – 100
}

// ── M2 — Text Difficulty & AI Sentence Simplification ────────────────────────

export type SupportType = 'simplification' | 'highlight' | 'syllable_split' | 'audio' | 'picture';

export interface M2Response {
  difficultyLevel: DifficultyLevel;
  originalSentence?: string;
  simplifiedSentence?: string;
  simplificationRule?: string;
  suggestedSupport: SupportType[];
  supportFlags: Record<SupportType, boolean>;
  syllables: string[];
}

// ── M3 — Adaptive Recommendation Engine & Explainable AI (XAI) ───────────────

export type DifficultyTransition = 'Decrease' | 'Maintain' | 'Increase';

export interface XAIFactor {
  name: string;
  weight: number; // 0 – 100 percentage
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PeerBenchmark {
  cohortName: string;
  similarityScore: number; // e.g. 88%
  averageGrowthRate: string; // e.g. "+18% over 3 weeks"
  comparisonNote: string;
}

export interface RoadmapStage {
  id: string;
  stageNumber: number;
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'locked';
  progressPercentage: number;
  targetSkills: string[];
  estimatedDaysLeft: number;
}

export interface SkillDimension {
  id: string;
  label: string;
  studentScore: number; // 0 - 100
  peerCohortAvg: number; // 0 - 100
  icon: string;
  description: string;
}

export interface PeerCluster {
  clusterId: string;
  clusterName: string;
  size: number;
  description: string;
  color: string;
}

export interface SimulationInputs {
  difficultyLevel: DifficultyLevel;
  supportLevel: SupportType;
  dailyMinutes: number;
}

export interface SimulationOutputs {
  predictedAccuracy: number;
  frustrationRisk: number; // 0 - 100 %
  timeToNextMilestoneDays: number;
  confidenceRating: number;
}

export interface M3Response {
  recommendation: DifficultyTransition;
  nextActivityId: string;
  nextActivityLabel: string;
  targetPhonemeSkill: string;
  rationale: string;
  confidence: number;
  xaiFactors: XAIFactor[];
  peerBenchmark: PeerBenchmark;
  roadmapStages?: RoadmapStage[];
  skillDimensions?: SkillDimension[];
}

// ── M4 — Behavioral State & Gamified Rewards Engine ──────────────────────────

export type BehaviorState = 'focused' | 'engaged' | 'frustrated' | 'distracted' | 'tired';
export type Intervention = 'balloon_breathing' | 'star_game' | 'motivational' | 'break';

export interface RewardBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  category: 'mastery' | 'persistence' | 'fluency' | 'calmness';
  unlockedAt?: string;
}

export interface M4Response {
  state: BehaviorState;
  confidence: number; // 0.0 – 1.0
  engagementScore: number; // 0 – 100
  fatigueLevel: number; // 0.0 – 1.0
  interventionTriggered: boolean;
  intervention?: Intervention;
  message: string;
  badgesAvailable: RewardBadge[];
}

// ── Teacher & Classroom Clinical Types ────────────────────────────────────────

export interface StudentProfile extends Child {
  lastActive: string;
  latestAccuracy: number;
  primaryErrorType: ErrorType;
  engagementIndex: number;
  notes: string;
}

export interface ClassroomSummary {
  id: string;
  className: string;
  grade: number;
  teacherName: string;
  totalStudents: number;
  avgAccuracy: number;
  classEngagementIndex: number;
  topErrorDistribution: Record<ErrorType, number>;
  students: StudentProfile[];
}

// ── Session & Analytics Data ──────────────────────────────────────────────────

export interface SessionData {
  id: string;
  date: string;
  textId: string;
  accuracy: number;
  durationSeconds: number;
  errorCount: number;
  behaviorState: BehaviorState;
  starsEarned: number;
}

export interface ProgressDataPoint {
  session: number;
  accuracy: number;
  date: string;
  label: string;
}

export interface ErrorBreakdown {
  substitution: number;
  omission: number;
  reversal: number;
  hesitation: number;
}
