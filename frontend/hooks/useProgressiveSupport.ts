/**
 * nena-man · frontend/hooks/useProgressiveSupport.ts
 * Progression state machine & retry manager for Progressive Reading Support.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ReadingSupportItem,
  SupportLevel,
  ProgressiveSupportState,
} from '@/types/progressiveSupport';

export interface UseProgressiveSupportReturn extends ProgressiveSupportState {
  handleAttemptResult: (correct: boolean) => void;
  resetProgressiveState: () => void;
  getNextValidLevel: (fromLevel: SupportLevel) => SupportLevel;
  isMaxSupportReached: boolean;
  attemptsRemainingInLevel: number;
}

/**
 * Calculates the next valid support level for a given reading item,
 * respecting `splitNeeded`, `simplificationNeeded`, and `maxSupportLevel`.
 */
export function calculateNextSupportLevel(
  currentLevel: SupportLevel,
  item: ReadingSupportItem
): SupportLevel {
  const max = item.maxSupportLevel;

  // Step from Level 0 (Independent) -> Level 1 (Highlight)
  if (currentLevel < 1 && max >= 1) {
    return 1;
  }

  // Step from Level 1 -> Level 2 (Split) or Level 3 (Audio)
  if (currentLevel === 1) {
    if (item.splitNeeded && max >= 2) {
      return 2;
    }
    if (max >= 3) {
      return 3;
    }
    if (item.simplificationNeeded && max >= 4) {
      return 4;
    }
    return 1;
  }

  // Step from Level 2 -> Level 3 (Audio) or Level 4 (Simplification)
  if (currentLevel === 2) {
    if (max >= 3) {
      return 3;
    }
    if (item.simplificationNeeded && max >= 4) {
      return 4;
    }
    return 2;
  }

  // Step from Level 3 -> Level 4 (Simplification)
  if (currentLevel === 3) {
    if (item.simplificationNeeded && max >= 4) {
      return 4;
    }
    return 3;
  }

  return Math.min(currentLevel, max) as SupportLevel;
}

export function useProgressiveSupport(item: ReadingSupportItem): UseProgressiveSupportReturn {
  const [currentSupportLevel, setCurrentSupportLevel] = useState<SupportLevel>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState<boolean | null>(null);
  const [history, setHistory] = useState<ProgressiveSupportState['history']>([]);

  const getNextValidLevel = useCallback(
    (fromLevel: SupportLevel) => calculateNextSupportLevel(fromLevel, item),
    [item]
  );

  const isMaxSupportReached = useMemo(() => {
    if (currentSupportLevel >= item.maxSupportLevel) return true;
    const nextPossible = calculateNextSupportLevel(currentSupportLevel, item);
    return nextPossible === currentSupportLevel;
  }, [currentSupportLevel, item]);

  const attemptsRemainingInLevel = useMemo(() => {
    return Math.max(0, item.maxRetriesPerLevel - retryCount);
  }, [item.maxRetriesPerLevel, retryCount]);

  const handleAttemptResult = useCallback(
    (correct: boolean) => {
      if (completed && correct) return;
      if (completed && !correct) {
        setCompleted(false);
      }

      const newHistoryEntry = {
        level: currentSupportLevel,
        attemptIndex: retryCount + 1,
        correct,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, newHistoryEntry]);
      setLastAttemptCorrect(correct);

      if (correct) {
        setCompleted(true);
        return;
      }

      // Incorrect attempt handling:
      const nextRetryCount = retryCount + 1;

      if (nextRetryCount >= item.maxRetriesPerLevel) {
        const nextLevel = calculateNextSupportLevel(currentSupportLevel, item);

        if (nextLevel > currentSupportLevel && nextLevel <= item.maxSupportLevel) {
          // Escalate to next support level & reset retry counter
          setCurrentSupportLevel(nextLevel);
          setRetryCount(0);
        } else {
          // At max support level: remain at max level and keep maxed retries
          setRetryCount(item.maxRetriesPerLevel);
        }
      } else {
        setRetryCount(nextRetryCount);
      }
    },
    [completed, currentSupportLevel, retryCount, item]
  );

  const resetProgressiveState = useCallback(() => {
    setCurrentSupportLevel(0);
    setRetryCount(0);
    setCompleted(false);
    setLastAttemptCorrect(null);
    setHistory([]);
  }, []);

  return {
    currentSupportLevel,
    retryCount,
    completed,
    lastAttemptCorrect,
    history,
    handleAttemptResult,
    resetProgressiveState,
    getNextValidLevel,
    isMaxSupportReached,
    attemptsRemainingInLevel,
  };
}

export default useProgressiveSupport;
