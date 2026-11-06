// LOCO Backend Blueprint v2 — src/challengeScoring.ts
// Deterministic server-side challenge verification, scoring, and leaderboard ranking

import { createHash } from 'node:crypto';
import type { ChallengeScorerType, LeaderboardVisibility, UUID } from './models.ts';

export interface ChallengeAnswerItem {
  ordinal: number;
  value: string;
  responseMs?: number;
}

export interface ChallengeSolutionItem {
  ordinal: number;
  expectedValue: string;
}

export interface ChallengeVerificationInput {
  scorerType: ChallengeScorerType;
  scorerVersion: string;
  durationMs: number;
  graceMs?: number;
  minPlausibleElapsedMs?: number;
  startedAtMs: number;
  submittedAtMs: number;
  expectedNonceHash: string;
  submittedNonce: string;
  answerKey: ChallengeSolutionItem[];
  submittedAnswers: ChallengeAnswerItem[];
}

export interface ChallengeScoringResult {
  score: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  elapsedMs: number;
  eligible: boolean;
  status: 'verified' | 'rejected';
  scorerVersion: string;
  riskFlags: string[];
  itemFlags: Array<{
    ordinal: number;
    submittedValue: string;
    isCorrect: boolean;
  }>;
}

export function hashNonce(nonce: string): string {
  return createHash('sha256').update(String(nonce)).digest('hex');
}

function normalizeAnswer(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function scoreChallengeSubmission(
  input: ChallengeVerificationInput
): ChallengeScoringResult {
  const totalCount = input.answerKey.length;
  if (totalCount === 0) {
    throw new Error('Challenge answerKey cannot be empty');
  }

  const graceMs = input.graceMs ?? 2000;
  const minPlausibleMs = input.minPlausibleElapsedMs ?? Math.max(500, totalCount * 80);
  const elapsedMs = Math.max(0, Math.round(input.submittedAtMs - input.startedAtMs));
  const riskFlags: string[] = [];

  if (!input.submittedNonce || hashNonce(input.submittedNonce) !== input.expectedNonceHash) {
    riskFlags.push('nonce_mismatch');
  }
  if (input.submittedAtMs < input.startedAtMs) {
    riskFlags.push('negative_elapsed_time');
  }
  if (elapsedMs > input.durationMs + graceMs) {
    riskFlags.push('deadline_exceeded');
  }
  if (elapsedMs < minPlausibleMs) {
    riskFlags.push('implausibly_fast_submission');
  }

  const submittedByOrdinal = new Map<number, string>();
  for (const ans of input.submittedAnswers) {
    if (
      typeof ans.ordinal === 'number' &&
      Number.isInteger(ans.ordinal) &&
      ans.ordinal >= 0 &&
      ans.ordinal < totalCount &&
      !submittedByOrdinal.has(ans.ordinal)
    ) {
      submittedByOrdinal.set(ans.ordinal, ans.value);
    } else {
      riskFlags.push('invalid_or_duplicate_ordinal');
    }
  }

  let correctCount = 0;
  const itemFlags = input.answerKey.map((sol) => {
    const rawSubmitted = submittedByOrdinal.get(sol.ordinal) ?? '';
    const isCorrect =
      normalizeAnswer(rawSubmitted) !== '' &&
      normalizeAnswer(rawSubmitted) === normalizeAnswer(sol.expectedValue);
    if (isCorrect) {
      correctCount += 1;
    }
    return {
      ordinal: sol.ordinal,
      submittedValue: rawSubmitted,
      isCorrect
    };
  });

  const accuracy = Number((correctCount / totalCount).toFixed(4));
  const integrityOk = riskFlags.length === 0;
  const clampedElapsedMs = Math.min(elapsedMs, input.durationMs);

  let score = 0;
  let eligible = false;

  if (input.scorerType === 'accuracy_time') {
    score = correctCount;
    eligible = integrityOk && correctCount > 0;
  } else if (input.scorerType === 'perfect_speed') {
    const isPerfect = correctCount === totalCount;
    if (isPerfect && integrityOk) {
      score = Math.max(1, input.durationMs - clampedElapsedMs + 1);
      eligible = true;
    } else {
      score = 0;
      eligible = false;
    }
  }

  return {
    score: integrityOk ? score : 0,
    correctCount,
    totalCount,
    accuracy,
    elapsedMs,
    eligible,
    status: integrityOk ? 'verified' : 'rejected',
    scorerVersion: input.scorerVersion,
    riskFlags,
    itemFlags
  };
}

export interface LeaderboardCandidate {
  userId: UUID;
  handle: string;
  displayName: string;
  leaderboardVisibility: LeaderboardVisibility;
  score: number;
  correctCount: number;
  accuracy: number;
  elapsedMs: number;
  achievedAt: string;
}

export interface RankedLeaderboardEntry {
  rank: number;
  displayOrder: number;
  userId: UUID;
  handle: string;
  displayName: string;
  score: number;
  correctCount: number;
  accuracy: number;
  elapsedMs: number;
  achievedAt: string;
}

export function isBetterChallengeScore(
  candidate: Pick<LeaderboardCandidate, 'score' | 'accuracy' | 'elapsedMs'>,
  existing: Pick<LeaderboardCandidate, 'score' | 'accuracy' | 'elapsedMs'>
): boolean {
  if (candidate.score !== existing.score) {
    return candidate.score > existing.score;
  }
  if (candidate.accuracy !== existing.accuracy) {
    return candidate.accuracy > existing.accuracy;
  }
  return candidate.elapsedMs < existing.elapsedMs;
}

export function buildLeaderboard(options: {
  candidates: LeaderboardCandidate[];
  viewerUserId: UUID;
  scope: 'global' | 'friends';
  acceptedFriendIds: ReadonlySet<UUID>;
  blockedUserIds: ReadonlySet<UUID>;
}): RankedLeaderboardEntry[] {
  const { candidates, viewerUserId, scope, acceptedFriendIds, blockedUserIds } = options;

  const visible = candidates.filter((entry) => {
    if (blockedUserIds.has(entry.userId)) {
      return false;
    }
    const isSelf = entry.userId === viewerUserId;
    const isFriend = acceptedFriendIds.has(entry.userId);

    if (scope === 'friends' && !isSelf && !isFriend) {
      return false;
    }
    if (entry.leaderboardVisibility === 'hidden') {
      return false;
    }
    if (entry.leaderboardVisibility === 'friends' && !isSelf && !isFriend) {
      return false;
    }
    return true;
  });

  visible.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
    const tA = Date.parse(a.achievedAt);
    const tB = Date.parse(b.achievedAt);
    if (tA !== tB) return tA - tB;
    return a.userId.localeCompare(b.userId);
  });

  const ranked: RankedLeaderboardEntry[] = [];
  for (let i = 0; i < visible.length; i += 1) {
    const current = visible[i];
    const prev = i > 0 ? visible[i - 1] : null;
    const isTiedWithPrev =
      prev !== null &&
      prev.score === current.score &&
      prev.accuracy === current.accuracy &&
      prev.elapsedMs === current.elapsedMs;

    const officialRank = isTiedWithPrev ? ranked[i - 1].rank : i + 1;
    ranked.push({
      rank: officialRank,
      displayOrder: i + 1,
      userId: current.userId,
      handle: current.handle,
      displayName: current.displayName,
      score: current.score,
      correctCount: current.correctCount,
      accuracy: current.accuracy,
      elapsedMs: current.elapsedMs,
      achievedAt: current.achievedAt
    });
  }

  return ranked;
}
