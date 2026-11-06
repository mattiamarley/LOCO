import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreChallengeSubmission,
  hashNonce,
  buildLeaderboard
} from '../src/challengeScoring.ts';
import {
  computeNextSchedule,
  resolveEffectiveGradeAndVerdict
} from '../src/srs.ts';
import {
  ALL_MEMORY_METRIC_KEYS,
  classifyDelayBucket,
  computeAllMemoryMetrics,
  computeSkillItemStats,
  computeLocusConfusionStats
} from '../src/memoryMetrics.ts';
import {
  generateAdaptiveInterventions,
  evaluateInterventionOutcome
} from '../src/adaptiveRecommendations.ts';

function makeTrial(overrides = {}) {
  return {
    id: overrides.id || 'trial-1',
    ownerId: overrides.ownerId || 'user-1',
    sourceKind: overrides.sourceKind || 'training_trial',
    trainingTrialId: overrides.trainingTrialId || 'tt-1',
    learningTargetId: overrides.learningTargetId || null,
    palaceId: overrides.palaceId || null,
    locusId: overrides.locusId || null,
    skill: overrides.skill || 'major',
    stimulusKey: overrides.stimulusKey || 'major:36',
    direction: overrides.direction || 'number_to_image',
    isCorrect: overrides.isCorrect ?? true,
    isUnassisted: overrides.isUnassisted ?? true,
    errorCategory: overrides.errorCategory || 'none',
    confusedWithKey: overrides.confusedWithKey || null,
    expectedLocusOrdinal: overrides.expectedLocusOrdinal ?? null,
    actualLocusOrdinal: overrides.actualLocusOrdinal ?? null,
    recallDelaySeconds: overrides.recallDelaySeconds ?? 0,
    delayBucket: classifyDelayBucket(overrides.recallDelaySeconds ?? 0),
    encodingDurationMs: overrides.encodingDurationMs ?? 2100,
    retrievalLatencyMs: overrides.retrievalLatencyMs ?? 1400,
    activeDurationMs: overrides.activeDurationMs ?? 3500,
    hintCount: overrides.hintCount ?? 0,
    viewedAnswerBeforeAttempt: overrides.viewedAnswerBeforeAttempt ?? false,
    associationRevision: overrides.associationRevision ?? 1,
    mediaMode: overrides.mediaMode || 'image',
    difficultyLevel: overrides.difficultyLevel ?? 1,
    comparabilityGroup: overrides.comparabilityGroup || 'standard',
    createdAt: overrides.createdAt || '2026-11-06T12:00:00.000Z'
  };
}

test('18 Memory Metrics: insufficient data gating and full metric calculation', () => {
  // With only 3 trials, metrics requiring >= 10 sample size must report `insufficient` and null rawValue
  const smallSample = [makeTrial({ id: 't1' }), makeTrial({ id: 't2' }), makeTrial({ id: 't3' })];
  const sparseMetrics = computeAllMemoryMetrics({ trials: smallSample });
  assert.equal(Object.keys(sparseMetrics).length, 18);
  for (const key of ALL_MEMORY_METRIC_KEYS) {
    assert.ok(sparseMetrics[key], `Missing metric key ${key}`);
  }
  assert.equal(sparseMetrics.immediate_recall_accuracy.confidenceLevel, 'insufficient');
  assert.equal(sparseMetrics.immediate_recall_accuracy.rawValue, null);
  assert.equal(sparseMetrics.training_volume.rawValue, 3);

  // With 24 valid trials (12 immediate, 12 delayed >= 24h), metrics compute accurately
  const richTrials = [];
  for (let i = 0; i < 12; i += 1) {
    richTrials.push(
      makeTrial({
        id: `imm-${i}`,
        skill: i % 2 === 0 ? 'major' : 'loci',
        isCorrect: i < 10,
        recallDelaySeconds: 120,
        encodingDurationMs: 1800,
        retrievalLatencyMs: 1200,
        createdAt: new Date(Date.now() - (24 - i) * 3600_000).toISOString()
      })
    );
  }
  for (let i = 0; i < 12; i += 1) {
    richTrials.push(
      makeTrial({
        id: `del-${i}`,
        skill: 'abstract',
        isCorrect: i < 6,
        recallDelaySeconds: 172_800, // 48 hours
        encodingDurationMs: 2400,
        retrievalLatencyMs: 1900,
        createdAt: new Date(Date.now() - (12 - i) * 3600_000).toISOString()
      })
    );
  }

  const fullMetrics = computeAllMemoryMetrics({
    trials: richTrials,
    scheduleStabilitiesDays: [2, 4, 7, 7, 14, 14, 21, 30, 30, 30]
  });

  assert.equal(fullMetrics.immediate_recall_accuracy.sampleSize, 12);
  assert.equal(fullMetrics.immediate_recall_accuracy.rawValue, Number((10 / 12).toFixed(4)));
  assert.equal(fullMetrics.delayed_recall_accuracy.sampleSize, 12);
  assert.equal(fullMetrics.delayed_recall_accuracy.rawValue, 0.5);
  assert.equal(fullMetrics.memory_stability.rawValue, 14);
});

test('Major forward vs reverse directional separation and locus neighbor swap detection', () => {
  const trials = [
    ...Array.from({ length: 5 }, (_, i) =>
      makeTrial({
        id: `fwd-${i}`,
        skill: 'major',
        stimulusKey: 'major:36',
        direction: 'number_to_image',
        isCorrect: i < 2,
        confusedWithKey: i >= 2 ? 'major:63' : null,
        retrievalLatencyMs: 4400
      })
    ),
    ...Array.from({ length: 5 }, (_, i) =>
      makeTrial({
        id: `rev-${i}`,
        skill: 'major',
        stimulusKey: 'major:36',
        direction: 'image_to_number',
        isCorrect: true,
        retrievalLatencyMs: 950
      })
    )
  ];

  const stats = computeSkillItemStats(trials);
  assert.equal(stats.length, 2);
  const fwd = stats.find((s) => s.direction === 'number_to_image');
  const rev = stats.find((s) => s.direction === 'image_to_number');
  assert.ok(fwd && rev);
  assert.equal(fwd.unassistedAccuracy, 0.4);
  assert.equal(fwd.topConfusedWithKey, 'major:63');
  assert.equal(fwd.topConfusionCount, 3);
  assert.equal(rev.unassistedAccuracy, 1.0);
  assert.equal(rev.medianRetrievalMs, 950);

  // Locus neighbor swap (locus 3 <-> locus 4)
  const locusTrials = [
    makeTrial({
      id: 'loc-1',
      skill: 'loci',
      palaceId: 'pal-1',
      locusId: 'loc-3',
      expectedLocusOrdinal: 3,
      actualLocusOrdinal: 4,
      isCorrect: false,
      errorCategory: 'position'
    }),
    makeTrial({
      id: 'loc-2',
      skill: 'loci',
      palaceId: 'pal-1',
      locusId: 'loc-3',
      expectedLocusOrdinal: 3,
      actualLocusOrdinal: 4,
      isCorrect: false,
      errorCategory: 'position'
    })
  ];
  const confusions = computeLocusConfusionStats(locusTrials);
  assert.equal(confusions.length, 1);
  assert.equal(confusions[0].swapCount, 2);
});

test('Explainable Adaptive Interventions and inconclusive outcome when non-comparable', () => {
  // Insufficient data (< 20 trials) returns baseline recommendation
  const fewInterventions = generateAdaptiveInterventions({
    ownerId: 'u-1',
    trials: [makeTrial({ id: '1' }), makeTrial({ id: '2' })]
  });
  assert.equal(fewInterventions.length, 1);
  assert.equal(fewInterventions[0].rationaleCode, 'insufficient_data_baseline');
  assert.equal(fewInterventions[0].confidenceLevel, 'insufficient');

  // 22 trials with slow/confused Major 36 triggers `slow_major_pair_bidirectional_drill`
  const twentyTwoTrials = Array.from({ length: 22 }, (_, i) =>
    makeTrial({
      id: `m-${i}`,
      skill: 'major',
      stimulusKey: i < 6 ? 'major:36' : 'major:12',
      direction: 'number_to_image',
      isCorrect: i >= 4,
      confusedWithKey: i < 4 ? 'major:63' : null,
      retrievalLatencyMs: i < 6 ? 4500 : 1200
    })
  );
  const proposals = generateAdaptiveInterventions({
    ownerId: 'u-1',
    trials: twentyTwoTrials
  });
  assert.ok(proposals.some((p) => p.rationaleCode === 'slow_major_pair_bidirectional_drill'));

  // Evaluating outcome across non-comparable directions/groups must return `inconclusive`
  const pre = Array.from({ length: 10 }, (_, i) =>
    makeTrial({ id: `pre-${i}`, skill: 'major', direction: 'number_to_image', isCorrect: i < 5 })
  );
  const postDifferentDirection = Array.from({ length: 10 }, (_, i) =>
    makeTrial({ id: `post-${i}`, skill: 'major', direction: 'image_to_number', isCorrect: true })
  );
  const nonComparable = evaluateInterventionOutcome({
    interventionId: 'int-1',
    metricKey: 'immediate_recall_accuracy',
    polarity: 'higher_better',
    preTrials: pre,
    postTrials: postDifferentDirection
  });
  assert.equal(nonComparable.comparabilityVerified, false);
  assert.equal(nonComparable.outcomeStatus, 'inconclusive');

  // Evaluating outcome across comparable trials returns `improved`
  const postComparable = Array.from({ length: 10 }, (_, i) =>
    makeTrial({ id: `post-c-${i}`, skill: 'major', direction: 'number_to_image', isCorrect: i < 9 })
  );
  const comparable = evaluateInterventionOutcome({
    interventionId: 'int-1',
    metricKey: 'immediate_recall_accuracy',
    polarity: 'higher_better',
    preTrials: pre,
    postTrials: postComparable
  });
  assert.equal(comparable.comparabilityVerified, true);
  assert.equal(comparable.outcomeStatus, 'improved');
});

test('SRS guardrails: viewedAnswerBeforeAttempt and hintCount cap ratings; revision reconciles', () => {
  const peeked = resolveEffectiveGradeAndVerdict({
    userRating: 'easy',
    hintCount: 0,
    viewedAnswerBeforeAttempt: true
  });
  assert.equal(peeked.effectiveGrade, 'again');
  assert.equal(peeked.verdict, 'forgot');

  const hinted = resolveEffectiveGradeAndVerdict({
    userRating: 'good',
    hintCount: 1,
    viewedAnswerBeforeAttempt: false
  });
  assert.equal(hinted.effectiveGrade, 'hard');
  assert.equal(hinted.verdict, 'partial');

  // Revision increment resets streak while keeping repetitions count
  const step1 = computeNextSchedule({
    nowMs: 1_000_000,
    currentKnowledgeRevision: 1,
    algorithmVersion: 'simple-v1',
    userRating: 'good',
    hintCount: 0,
    viewedAnswerBeforeAttempt: false
  });
  assert.equal(step1.schedule.streak, 1);

  const step2AfterRevision = computeNextSchedule({
    nowMs: 2_000_000,
    currentKnowledgeRevision: 2,
    algorithmVersion: 'simple-v1',
    previousSchedule: step1.schedule,
    userRating: 'good',
    hintCount: 0,
    viewedAnswerBeforeAttempt: false
  });
  assert.equal(step2AfterRevision.reconciledRevision, true);
  assert.equal(step2AfterRevision.schedule.streak, 1);
  assert.equal(step2AfterRevision.schedule.knowledgeRevision, 2);
});

test('Deterministic Challenge Scoring and rank() tie-breaking with visibility & blocks', () => {
  const nonce = 'secret-nonce-123';
  const key = [
    { ordinal: 0, expectedValue: '14' },
    { ordinal: 1, expectedValue: '92' },
    { ordinal: 2, expectedValue: '65' }
  ];

  // Perfect speed requires 100% correct; score = durationMs - elapsedMs + 1
  const perfect = scoreChallengeSubmission({
    scorerType: 'perfect_speed',
    scorerVersion: 'v1',
    durationMs: 60_000,
    startedAtMs: 1000,
    submittedAtMs: 16_000, // 15_000ms elapsed
    expectedNonceHash: hashNonce(nonce),
    submittedNonce: nonce,
    answerKey: key,
    submittedAnswers: [
      { ordinal: 0, value: '14' },
      { ordinal: 1, value: '92' },
      { ordinal: 2, value: '65' }
    ]
  });
  assert.equal(perfect.eligible, true);
  assert.equal(perfect.score, 60_000 - 15_000 + 1);

  // Tied scores share official rank(), ordered deterministically by achievedAt
  const board = buildLeaderboard({
    viewerUserId: 'u-1',
    scope: 'global',
    acceptedFriendIds: new Set(['u-2']),
    blockedUserIds: new Set(['u-blocked']),
    candidates: [
      {
        userId: 'u-2',
        handle: 'bob',
        displayName: 'Bob',
        leaderboardVisibility: 'public',
        score: 5,
        correctCount: 5,
        accuracy: 1,
        elapsedMs: 12000,
        achievedAt: '2026-11-06T10:05:00Z'
      },
      {
        userId: 'u-1',
        handle: 'alice',
        displayName: 'Alice',
        leaderboardVisibility: 'public',
        score: 5,
        correctCount: 5,
        accuracy: 1,
        elapsedMs: 12000,
        achievedAt: '2026-11-06T10:00:00Z'
      },
      {
        userId: 'u-3',
        handle: 'charlie',
        displayName: 'Charlie',
        leaderboardVisibility: 'public',
        score: 4,
        correctCount: 4,
        accuracy: 0.8,
        elapsedMs: 11000,
        achievedAt: '2026-11-06T10:01:00Z'
      },
      {
        userId: 'u-hidden',
        handle: 'ghost',
        displayName: 'Ghost',
        leaderboardVisibility: 'hidden',
        score: 5,
        correctCount: 5,
        accuracy: 1,
        elapsedMs: 9000,
        achievedAt: '2026-11-06T09:00:00Z'
      },
      {
        userId: 'u-blocked',
        handle: 'troll',
        displayName: 'Troll',
        leaderboardVisibility: 'public',
        score: 5,
        correctCount: 5,
        accuracy: 1,
        elapsedMs: 8000,
        achievedAt: '2026-11-06T09:00:00Z'
      }
    ]
  });

  assert.equal(board.length, 3);
  assert.equal(board[0].userId, 'u-1');
  assert.equal(board[0].rank, 1);
  assert.equal(board[1].userId, 'u-2');
  assert.equal(board[1].rank, 1); // same official rank for identical score/accuracy/elapsedMs
  assert.equal(board[1].displayOrder, 2);
  assert.equal(board[2].userId, 'u-3');
  assert.equal(board[2].rank, 3);
});
