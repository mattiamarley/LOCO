// LOCO Backend Blueprint v2 — src/srs.ts
// Versioned Spaced Repetition Scheduler supporting `simple-v1` and `fsrs-7`
// Enforces blind-recall guardrails (`viewedAnswerBeforeAttempt` and `hintCount`)
// and reconciles schedules when `knowledgeRevision` increments.

import type {
  RecallVerdict,
  SchedulerGrade,
  SrsAlgorithmVersion
} from './models.ts';

export interface SrsScheduleSnapshot {
  knowledgeRevision: number;
  algorithmVersion: SrsAlgorithmVersion;
  dueAtMs: number;
  lastReviewedAtMs: number | null;
  streak: number;
  repetitions: number;
  lapses: number;
  stability: number | null;
  difficulty: number | null;
  stateJson: Record<string, unknown>;
}

export interface SrsTransitionInput {
  nowMs: number;
  currentKnowledgeRevision: number;
  desiredRetention?: number;
  algorithmVersion?: SrsAlgorithmVersion;
  previousSchedule?: SrsScheduleSnapshot | null;
  userRating: SchedulerGrade;
  hintCount: number;
  viewedAnswerBeforeAttempt: boolean;
}

export interface SrsTransitionResult {
  effectiveGrade: SchedulerGrade;
  verdict: RecallVerdict;
  recallDelaySeconds: number;
  schedule: SrsScheduleSnapshot;
  reconciledRevision: boolean;
}

const DAY_MS = 86_400_000;
const TEN_MINUTES_MS = 600_000;

/**
 * Guardrail:
 * - Viewing the answer before attempting recall is NOT independent retrieval (`again` / `forgot`).
 * - Using hints prevents attributing a full `good` or `easy` rating (capped at `hard` / `partial`).
 */
export function resolveEffectiveGradeAndVerdict(input: {
  userRating: SchedulerGrade;
  hintCount: number;
  viewedAnswerBeforeAttempt: boolean;
}): { effectiveGrade: SchedulerGrade; verdict: RecallVerdict } {
  if (input.viewedAnswerBeforeAttempt) {
    return { effectiveGrade: 'again', verdict: 'forgot' };
  }
  if (input.userRating === 'again') {
    return { effectiveGrade: 'again', verdict: 'forgot' };
  }
  if (input.hintCount > 0) {
    return { effectiveGrade: 'hard', verdict: 'partial' };
  }
  if (input.userRating === 'hard') {
    return { effectiveGrade: 'hard', verdict: 'partial' };
  }
  return {
    effectiveGrade: input.userRating,
    verdict: 'correct'
  };
}

export function mapLegacyOutcomeToGrade(outcome: 'forgot' | 'help' | 'correct'): {
  userRating: SchedulerGrade;
  verdict: RecallVerdict;
  hintCount: number;
} {
  if (outcome === 'forgot') {
    return { userRating: 'again', verdict: 'forgot', hintCount: 0 };
  }
  if (outcome === 'help') {
    return { userRating: 'hard', verdict: 'partial', hintCount: 1 };
  }
  return { userRating: 'good', verdict: 'correct', hintCount: 0 };
}

export function computeNextSchedule(input: SrsTransitionInput): SrsTransitionResult {
  const algo: SrsAlgorithmVersion =
    input.algorithmVersion ?? input.previousSchedule?.algorithmVersion ?? 'simple-v1';
  const desiredRetention = Math.min(0.99, Math.max(0.7, input.desiredRetention ?? 0.9));

  const prev = input.previousSchedule ?? null;
  const reconciledRevision =
    prev !== null && prev.knowledgeRevision !== input.currentKnowledgeRevision;

  // If the underlying knowledge item was substantially revised, do not pretend old streak measures new content
  const baseStreak = prev && !reconciledRevision ? prev.streak : 0;
  const baseRepetitions = prev ? prev.repetitions : 0;
  const baseLapses = prev ? prev.lapses : 0;

  const recallDelaySeconds =
    prev && prev.lastReviewedAtMs !== null
      ? Math.max(0, Math.floor((input.nowMs - prev.lastReviewedAtMs) / 1000))
      : 0;

  const { effectiveGrade, verdict } = resolveEffectiveGradeAndVerdict({
    userRating: input.userRating,
    hintCount: input.hintCount,
    viewedAnswerBeforeAttempt: input.viewedAnswerBeforeAttempt
  });

  if (algo === 'simple-v1') {
    let nextStreak = baseStreak;
    let delayMs = DAY_MS;
    let lapses = baseLapses;

    if (effectiveGrade === 'again') {
      nextStreak = 0;
      lapses += 1;
      delayMs = TEN_MINUTES_MS;
    } else if (effectiveGrade === 'hard') {
      nextStreak = 0;
      delayMs = DAY_MS;
    } else if (effectiveGrade === 'good') {
      nextStreak = baseStreak + 1;
      const steps = [1, 3, 7, 14, 30];
      const days = steps[Math.min(nextStreak - 1, steps.length - 1)];
      delayMs = days * DAY_MS;
    } else {
      // easy
      nextStreak = baseStreak + 2;
      const steps = [1, 3, 7, 14, 30, 60];
      const days = steps[Math.min(nextStreak - 1, steps.length - 1)];
      delayMs = days * DAY_MS;
    }

    const stabilityDays = Number((delayMs / DAY_MS).toFixed(4));
    const difficulty = Number(
      Math.min(10, Math.max(1, 5 - nextStreak * 0.4 + lapses * 0.5)).toFixed(4)
    );

    return {
      effectiveGrade,
      verdict,
      recallDelaySeconds,
      reconciledRevision,
      schedule: {
        knowledgeRevision: input.currentKnowledgeRevision,
        algorithmVersion: 'simple-v1',
        dueAtMs: input.nowMs + delayMs,
        lastReviewedAtMs: input.nowMs,
        streak: nextStreak,
        repetitions: baseRepetitions + 1,
        lapses,
        stability: stabilityDays,
        difficulty,
        stateJson: {
          algorithm: 'simple-v1',
          streak: nextStreak,
          intervalDays: stabilityDays,
          lastGrade: effectiveGrade
        }
      }
    };
  }

  // FSRS-7 compatible state machine
  const prevStability =
    prev && !reconciledRevision && prev.stability !== null ? prev.stability : 1.0;
  const prevDifficulty =
    prev && !reconciledRevision && prev.difficulty !== null ? prev.difficulty : 5.0;

  const gradeWeight =
    effectiveGrade === 'again'
      ? 1
      : effectiveGrade === 'hard'
        ? 2
        : effectiveGrade === 'good'
          ? 3
          : 4;

  const nextDifficulty = Number(
    Math.min(10, Math.max(1, prevDifficulty - 0.65 * (gradeWeight - 3))).toFixed(4)
  );

  let nextStability: number;
  let nextStreak = baseStreak;
  let lapses = baseLapses;

  if (effectiveGrade === 'again') {
    nextStreak = 0;
    lapses += 1;
    nextStability = Number(Math.max(0.15, prevStability * 0.35).toFixed(4));
  } else if (effectiveGrade === 'hard') {
    nextStreak = 0;
    nextStability = Number(Math.max(0.8, prevStability * 1.2).toFixed(4));
  } else if (effectiveGrade === 'good') {
    nextStreak = baseStreak + 1;
    const growth = 1 + (11 - nextDifficulty) * 0.28;
    nextStability = Number(Math.max(1.5, prevStability * growth).toFixed(4));
  } else {
    nextStreak = baseStreak + 2;
    const growth = 1 + (11 - nextDifficulty) * 0.42;
    nextStability = Number(Math.max(3.0, prevStability * growth).toFixed(4));
  }

  // Convert desired retention (e.g. 0.90) to interval days
  const retentionFactor = Math.log(desiredRetention) / Math.log(0.9);
  const rawDays =
    effectiveGrade === 'again' ? 10 / 1440 : Math.max(1, nextStability * retentionFactor);
  const delayMs = Math.round(rawDays * DAY_MS);

  return {
    effectiveGrade,
    verdict,
    recallDelaySeconds,
    reconciledRevision,
    schedule: {
      knowledgeRevision: input.currentKnowledgeRevision,
      algorithmVersion: 'fsrs-7',
      dueAtMs: input.nowMs + delayMs,
      lastReviewedAtMs: input.nowMs,
      streak: nextStreak,
      repetitions: baseRepetitions + 1,
      lapses,
      stability: nextStability,
      difficulty: nextDifficulty,
      stateJson: {
        algorithm: 'fsrs-7',
        stability: nextStability,
        difficulty: nextDifficulty,
        desiredRetention,
        reps: baseRepetitions + 1,
        lapses,
        lastGrade: effectiveGrade
      }
    }
  };
}
