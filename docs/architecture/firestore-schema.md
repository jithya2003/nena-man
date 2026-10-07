# 🔥 Firebase Firestore Collection Schema: `sessions`

**Document Path**: `sessions/{sessionId}`  
**Feature Branch**: `feat/session-persistence`  
**Purpose**: Persists end-to-end reading session telemetry and results from all four AI modules for longitudinal dyslexia improvement tracking, clinician review, and student progress dashboards.

---

## 1. Document Structure Overview

```json
{
  "sessionId": "session_1791388421000_abc12",
  "childId": "child_001",
  "childName": "සෙනුලි පෙරේරා",
  "textId": "text_001",
  "textContent": "මම මගේ රටට ගොඩාක් ආදරෙයි",
  "startTime": 1791388421000,
  "endTime": 1791388481000,
  "durationSeconds": 60,
  "status": "completed",
  "starsEarned": 3,
  "overallAccuracy": 85,
  "createdAt": "2026-10-07T15:54:41.000Z",
  "synced": true,
  "results": {
    "errorAnalysis": {
      "accuracy": 85,
      "severity": 0.15,
      "errorCount": 1,
      "readingSpeed": 32,
      "pauseDuration": 1.1,
      "hesitationCount": 1,
      "fluencyScore": 84,
      "words": [
        {
          "text": "මම",
          "status": "correct",
          "expected": "මම",
          "confidence": 0.98
        },
        {
          "text": "ගොඩක්",
          "status": "error",
          "expected": "ගොඩාක්",
          "confidence": 0.88
        }
      ],
      "errors": [
        {
          "type": "substitution",
          "word": "ගොඩාක්",
          "detected": "ගොඩක්",
          "severity": 0.4,
          "explanation": "'ගොඩාක්' වචනයේ 'ඩා' ස්වරය දිගු කර පැහැදිලිව ශබ්ද කළ යුතුය.",
          "tip": "🗣️ 'ඩා' ශබ්දය දිගු කර 'ගොඩාක්' ලෙස උච්චාරණය කරන්න."
        }
      ],
      "transcription": "මම මගේ රටට ගොඩක් ආදරෙයි"
    },
    "textDifficulty": {
      "difficultyLevel": "Medium",
      "support": ["simplification", "highlight", "syllable_split"],
      "simplificationNeeded": true,
      "simplifiedText": "මම මගේ රටට ආදරෙයි",
      "ruleApplied": "Removed elongated modifier 'ගොඩාක්' to reduce working memory load"
    },
    "behaviorState": {
      "behavioralState": "Focused",
      "predictionConfidence": 0.91,
      "interventionRequired": false,
      "recommendedIntervention": null,
      "engagementScore": 88,
      "fatigueLevel": 0.18,
      "voiceMetrics": {
        "readingSpeed": 32,
        "hesitationCount": 1,
        "pauseDuration": 1.1,
        "fluencyScore": 84
      }
    },
    "recommendation": {
      "difficultyAction": "Maintain",
      "nextActivity": "Level 2 Syllable Practice",
      "recommendedActivities": [
        {
          "activityId": "act_02",
          "title": "Level 2 Syllable Practice",
          "rank": 1
        }
      ],
      "rationale": [
        "Consistent accuracy above 80%",
        "Mild hesitation on long vowels"
      ]
    }
  }
}
```

---

## 2. Field Specifications

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string` | Unique session document ID (`session_${timestamp}_${rand}`) |
| `childId` | `string` | ID of the student/child |
| `childName` | `string` | Denormalized student display name for fast dashboard lists |
| `textId` | `string` | Identifier of reading text item (e.g., `text_001`) |
| `textContent` | `string` | Sinhala sentence or passage being read |
| `startTime` | `number` | Unix epoch millisecond timestamp at session start |
| `endTime` | `number` | Unix epoch millisecond timestamp at session completion |
| `durationSeconds` | `number` | Calculated reading duration in seconds |
| `status` | `'completed' \| 'partial' \| 'error'` | Session lifecycle completion state |
| `starsEarned` | `number` | Stars earned for gamification (1–3 stars) |
| `overallAccuracy` | `number` | Denormalized accuracy percentage (0–100) for fast indexing |
| `createdAt` | `string` | ISO-8601 creation timestamp |
| `synced` | `boolean` | Sync status flag between local storage and Firestore |

### Nested `results` Fields

#### 1. `results.errorAnalysis` (Module 1 — Speech Classifier)
- `accuracy`: Accuracy percentage (0–100)
- `severity`: Severity index (0.0–1.0)
- `errorCount`: Total identified errors count
- `readingSpeed`: Words Per Minute (WPM)
- `pauseDuration`: Mean pause duration in seconds
- `hesitationCount`: Total cognitive hesitations
- `fluencyScore`: Acoustic fluency score (0–100)
- `words`: Word-by-word correctness breakdown
- `errors`: Classified clinical error instances (substitution, omission, reversal, hesitation)
- `transcription`: Recognized speech text

#### 2. `results.textDifficulty` (Module 2 — Text Difficulty)
- `difficultyLevel`: Assessed difficulty (`'Easy' | 'Medium' | 'Hard'`)
- `support`: Recommended scaffolding options (`'simplification' | 'highlight' | 'syllable_split' | 'audio' | 'picture'`)
- `simplificationNeeded`: Boolean flag
- `simplifiedText`: AI simplified sentence if required
- `ruleApplied`: Linguistic transformation explanation

#### 3. `results.behaviorState` (Module 4 — Behavioral Detection)
- `behavioralState`: Engagement state (`'Focused' | 'Hesitant' | 'Frustrated' | 'Fatigued' | 'Engaged'`)
- `predictionConfidence`: Model confidence (0.0–1.0)
- `interventionRequired`: Whether relaxation/cooldown intervention was triggered
- `recommendedIntervention`: Selected intervention type (`'star_game' | 'breathing' | 'motivational'`)
- `engagementScore`: Numeric engagement index (0–100)
- `fatigueLevel`: Cognitive fatigue index (0.0–1.0)
- `voiceMetrics`: Acoustic telemetry extracted from M1

#### 4. `results.recommendation` (Module 3 — Recommendation Engine)
- `difficultyAction`: Adaptive transition (`'Decrease' | 'Maintain' | 'Increase'`)
- `nextActivity`: Recommended next learning activity title
- `recommendedActivities`: Ranked array of candidate learning activities
- `rationale`: Explainable AI (XAI) rationale lines

---

## 3. Atomic Child Profile Stats Updates

Upon successfully persisting a session, `sessionService` atomically increments:
- `users/{childId}.totalSessions` (+1)
- `users/{childId}.stars` (+starsEarned)
- `users/{childId}.latestAccuracy` (= overallAccuracy)
- `users/{childId}.lastActive` (= ISO-8601 timestamp)

---

## 4. Querying Examples

### Get all sessions for a child sorted by newest first:
```typescript
import { sessionService } from '@/services/sessionService';

const childSessions = await sessionService.getChildSessions('child_001');
console.log(`Loaded ${childSessions.length} sessions for student.`);
```
