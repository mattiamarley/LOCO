import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../dev.mjs';

test('Blueprint v2 /v1 API: Identity, Friends, Knowledge, Palaces, Blind Recall, Training & Arena', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'loco-v2-api-'));
  const dbPath = join(directory, 'test-v2.sqlite');
  const { server, store } = createApp(dbPath);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => {
    server.close();
    store.db.close();
    rmSync(directory, { recursive: true, force: true });
  });

  const origin = 'http://127.0.0.1:' + server.address().port;

  async function req(endpoint, method = 'GET', body = null, cookie = '', extraHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Loco-Request': '1',
      Cookie: cookie,
      ...extraHeaders
    };
    const r = await fetch(origin + endpoint, {
      method,
      headers,
      ...(body !== null ? { body: JSON.stringify(body) } : {})
    });
    const isJson = r.headers.get('content-type')?.includes('json');
    return {
      status: r.status,
      cookie: r.headers.get('set-cookie')?.split(';')[0],
      data: isJson ? await r.json() : await r.text()
    };
  }

  // Register Alice (A) and Bob (B)
  const regA = await req('/api/register', 'POST', {
    email: 'alice@example.com',
    password: 'password-alice-123',
    name: 'Alice'
  });
  const regB = await req('/api/register', 'POST', {
    email: 'bob@example.com',
    password: 'password-bob-123',
    name: 'Bob'
  });
  assert.equal(regA.status, 200);
  assert.equal(regB.status, 200);
  const cookieA = regA.cookie;
  const cookieB = regB.cookie;

  // 1. Identity & Privacy
  const meA = await req('/v1/me', 'GET', null, cookieA);
  assert.equal(meA.status, 200);
  assert.equal(meA.data.profile.displayName, 'Alice');
  assert.ok(!('email' in meA.data.profile));

  // Handle cannot contain '@'
  const badHandle = await req('/v1/me', 'PATCH', { handle: 'alice@mail.com' }, cookieA);
  assert.equal(badHandle.status, 422);
  assert.equal(badHandle.data.error.code, 'VALIDATION_ERROR');

  await req('/v1/me', 'PATCH', { handle: 'alice_loco' }, cookieA);
  await req('/v1/me', 'PATCH', { handle: 'bob_loco', discoverable: false }, cookieB);

  // Discoverable=false prevents Bob from appearing in handle search
  const searchHidden = await req('/v1/users?handle=bob_loco', 'GET', null, cookieA);
  assert.equal(searchHidden.data.items.length, 0);

  await req('/v1/me', 'PATCH', { discoverable: true }, cookieB);
  const searchVisible = await req('/v1/users?handle=bob_loco', 'GET', null, cookieA);
  assert.equal(searchVisible.data.items.length, 1);

  // 2. Study, Sources, Knowledge Revision & Confirmation Gating
  const projA = await req(
    '/v1/projects',
    'POST',
    { title: 'Neuroanatomia', goal: 'Esame sessione estiva' },
    cookieA
  );
  assert.equal(projA.status, 201);
  const projectId = projA.data.id;

  // Bob receives 404 on Alice's private project
  const bobStealProj = await req(`/v1/projects/${projectId}`, 'GET', null, cookieB);
  assert.equal(bobStealProj.status, 404);

  // Upload init + source ingestion with AI proposed knowledge item
  const uploadInit = await req(
    `/v1/projects/${projectId}/uploads`,
    'POST',
    {
      filename: 'dispensa.pdf',
      mime: 'application/pdf',
      bytes: 20480,
      sha256: 'a'.repeat(64)
    },
    cookieA
  );
  assert.equal(uploadInit.status, 201);

  const srcCreate = await req(
    `/v1/projects/${projectId}/sources`,
    'POST',
    {
      assetId: uploadInit.data.assetId,
      title: 'Capitolo 1 - Ippocampo',
      chunks: [
        {
          pageStart: 1,
          pageEnd: 1,
          heading: 'Consolidamento spaziale',
          contentText: 'L’ippocampo svolge un ruolo cruciale nella memoria spaziale e dichiarativa.',
          proposedItems: [
            {
              kind: 'concept',
              prompt: 'Quale struttura cerebrale guida la mappa cognitiva spaziale?',
              answer: 'Ippocampo',
              explanation: 'Sede delle place cells studiate da O’Keefe.'
            }
          ]
        }
      ]
    },
    cookieA
  );
  assert.equal(srcCreate.status, 201);

  const kList = await req(`/v1/projects/${projectId}/knowledge`, 'GET', null, cookieA);
  assert.equal(kList.data.items.length, 1);
  const kItem = kList.data.items[0];
  assert.equal(kItem.state, 'proposed');
  assert.equal(kItem.evidence.length, 1);

  // AI proposed item CANNOT become a learning_target before user confirmation!
  const prematureTarget = await req(
    `/v1/knowledge/${kItem.id}/targets`,
    'POST',
    { promptMode: 'forward' },
    cookieA
  );
  assert.equal(prematureTarget.status, 409);

  // Confirm knowledge item -> unlocks default learning_target
  const confirmed = await req(
    `/v1/knowledge/${kItem.id}/confirm`,
    'POST',
    { expectedRevision: 1 },
    cookieA
  );
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.data.item.state, 'confirmed');
  const targetId = confirmed.data.defaultTarget.id;

  // 3. Palaces, SceneVersion & Mnemonics Isolation
  const palA = await req(
    '/v1/palaces',
    'POST',
    { title: 'Casa di Alice', environmentKind: 'room', sceneVersion: 'loco-room-v1' },
    cookieA
  );
  assert.equal(palA.status, 201);
  const palaceId = palA.data.id;

  // Anchor with mismatched sceneVersion is rejected with 409
  const badSceneLocus = await req(
    `/v1/palaces/${palaceId}/loci`,
    'POST',
    {
      label: 'Ingresso',
      anchor: { scene: 'wrong-scene-v9', point: { x: 1, y: 1, z: -2 } }
    },
    cookieA
  );
  assert.equal(badSceneLocus.status, 409);

  const locus1 = await req(
    `/v1/palaces/${palaceId}/loci`,
    'POST',
    {
      label: 'Libreria',
      anchor: { scene: 'loco-room-v1', point: { x: 1.2, y: 1.5, z: -3.0 }, surface: 'Parete Nord' }
    },
    cookieA
  );
  assert.equal(locus1.status, 201);

  // Bob cannot attach his own mnemonic to Alice's target or locus
  const bobCrossMnemonic = await req(
    `/v1/learning-targets/${targetId}/mnemonics`,
    'POST',
    { locusId: locus1.data.id, technique: 'loci', associationText: 'Hack' },
    cookieB
  );
  assert.equal(bobCrossMnemonic.status, 404);

  const mnemA = await req(
    `/v1/learning-targets/${targetId}/mnemonics`,
    'POST',
    {
      locusId: locus1.data.id,
      technique: 'loci',
      associationText: 'Un cavalluccio marino gigante salta sulla libreria',
      mediaMode: 'animated_3d',
      encodingDurationMs: 2200
    },
    cookieA
  );
  assert.equal(mnemA.status, 201);

  // Add a 3D GLB placement in the locus
  const placement = await req(
    `/v1/loci/${locus1.data.id}/placements`,
    'POST',
    {
      associationId: mnemA.data.id,
      placementKind: 'glb_model',
      position: { x: 1.2, y: 1.5, z: -3.0 },
      animationClip: 'jump_loop',
      playbackMode: 'on_recall'
    },
    cookieA
  );
  assert.equal(placement.status, 201);

  // 4. Blind Recall, Idempotency & Revision Reconciliation
  const dueBefore = await req('/v1/reviews/due', 'GET', null, cookieA);
  assert.equal(dueBefore.data.items.length, 1);
  assert.equal(dueBefore.data.items[0].target_id, targetId);
  // Blind recall check: answer is NOT leaked in `/v1/reviews/due`
  assert.equal(dueBefore.data.items[0].answer, undefined);

  // Submit review attempt with idempotencyKey
  const attempt1 = await req(
    '/v1/review-attempts',
    'POST',
    {
      targetId,
      responseMs: 1450,
      hintCount: 0,
      viewedAnswerBeforeAttempt: false,
      userRating: 'good',
      idempotencyKey: 'idem-recall-1'
    },
    cookieA
  );
  assert.equal(attempt1.status, 201);
  assert.equal(attempt1.data.grade, 'good');

  // Duplicate tap with same idempotencyKey returns identical attempt without duplicating history
  const attempt1Dup = await req(
    '/v1/review-attempts',
    'POST',
    {
      targetId,
      responseMs: 1450,
      hintCount: 0,
      viewedAnswerBeforeAttempt: false,
      userRating: 'good',
      idempotencyKey: 'idem-recall-1'
    },
    cookieA
  );
  assert.equal(attempt1Dup.data.attemptId, attempt1.data.attemptId);
  assert.equal(attempt1Dup.data.idempotentReplay, true);

  const hist1 = await req(`/v1/learning-targets/${targetId}/history`, 'GET', null, cookieA);
  assert.equal(hist1.data.items.length, 1);

  // Updating knowledge item with stale expectedRevision -> 409 CONFLICT
  const stalePatch = await req(
    `/v1/knowledge/${kItem.id}`,
    'PATCH',
    { expectedRevision: 99, answer: 'Ippocampo dorsale' },
    cookieA
  );
  assert.equal(stalePatch.status, 409);

  // Updating knowledge item with valid expectedRevision -> revision 2, schedule reset, old attempt still tagged revision 1
  const validPatch = await req(
    `/v1/knowledge/${kItem.id}`,
    'PATCH',
    { expectedRevision: 1, answer: 'Ippocampo dorsale e corteccia entorinale' },
    cookieA
  );
  assert.equal(validPatch.status, 200);
  assert.equal(validPatch.data.current_revision, 2);

  const schedAfterEdit = await req(`/v1/learning-targets/${targetId}/schedule`, 'GET', null, cookieA);
  assert.equal(schedAfterEdit.data.knowledge_revision, 2);
  assert.equal(schedAfterEdit.data.streak, 0);

  // 5. Training Session & Memory Profile v2 (5 Dashboards + 18 Metrics)
  const trainStart = await req(
    '/v1/training/sessions',
    'POST',
    { exerciseId: 'major-00-99', options: { itemCount: 4, direction: 'number_to_image' } },
    cookieA
  );
  assert.equal(trainStart.status, 201);
  const trainSessionId = trainStart.data.sessionId;

  for (let i = 0; i < 4; i += 1) {
    const tr = await req(
      `/v1/training/sessions/${trainSessionId}/trials`,
      'POST',
      {
        ordinal: i,
        stimulusKey: 'major:36',
        direction: 'number_to_image',
        response: 'mela',
        correct: i < 3,
        responseMs: 1300
      },
      cookieA
    );
    assert.equal(tr.status, 201);
  }

  const trainFinish = await req(
    `/v1/training/sessions/${trainSessionId}/finish`,
    'POST',
    { idempotencyKey: 'finish-train-1' },
    cookieA
  );
  assert.equal(trainFinish.status, 200);
  assert.equal(trainFinish.data.trialCount, 4);

  const profileV2 = await req('/v1/me/learning-profile', 'GET', null, cookieA);
  assert.equal(profileV2.status, 200);
  assert.equal(Object.keys(profileV2.data.metrics).length, 18);
  assert.ok(Array.isArray(profileV2.data.dashboards.overview));
  assert.ok(Array.isArray(profileV2.data.dashboards.memorySkills));

  // 6. Friends, Ranked Challenges, Server Scoring & Mutual Block Enforcement
  const freq = await req(
    '/v1/friend-requests',
    'POST',
    { recipientId: regB.data.id },
    cookieA
  );
  assert.equal(freq.status, 201);

  const acceptFreq = await req(
    `/v1/friend-requests/${freq.data.requestId}/accept`,
    'POST',
    {},
    cookieB
  );
  assert.equal(acceptFreq.status, 200);

  // Start ranked challenge `ch-ver-numbers-40-v1` for Alice
  const runA = await req(
    '/v1/challenge-versions/ch-ver-numbers-40-v1/runs',
    'POST',
    { idempotencyKey: 'run-alice-1' },
    cookieA
  );
  assert.equal(runA.status, 201);
  assert.ok(!('private_answer_key_json' in runA.data));

  // Second ranked attempt on the same version with different idempotencyKey -> 409 CONFLICT
  const secondRankedA = await req(
    '/v1/challenge-versions/ch-ver-numbers-40-v1/runs',
    'POST',
    { idempotencyKey: 'run-alice-2' },
    cookieA
  );
  assert.equal(secondRankedA.status, 409);

  // Submit Alice's answers (even if client tries to spoof `score: 999999`, server calculates real score = 5!)
  const submitA = await req(
    `/v1/challenge-runs/${runA.data.runId}/submit`,
    'POST',
    {
      nonce: runA.data.nonce,
      simulatedElapsedMs: 14_000,
      score: 999999,
      answers: [
        { ordinal: 0, value: '14' },
        { ordinal: 1, value: '92' },
        { ordinal: 2, value: '65' },
        { ordinal: 3, value: '35' },
        { ordinal: 4, value: '89' }
      ]
    },
    cookieA
  );
  assert.equal(submitA.status, 200);
  assert.equal(submitA.data.result.score, 5);
  assert.equal(submitA.data.result.eligible, true);

  // Bob also runs and submits
  const runB = await req(
    '/v1/challenge-versions/ch-ver-numbers-40-v1/runs',
    'POST',
    { idempotencyKey: 'run-bob-1' },
    cookieB
  );
  await req(
    `/v1/challenge-runs/${runB.data.runId}/submit`,
    'POST',
    {
      nonce: runB.data.nonce,
      simulatedElapsedMs: 18_000,
      answers: [
        { ordinal: 0, value: '14' },
        { ordinal: 1, value: '92' },
        { ordinal: 2, value: '65' },
        { ordinal: 3, value: '00' },
        { ordinal: 4, value: '00' }
      ]
    },
    cookieB
  );

  const friendsBoard = await req(
    '/v1/challenge-versions/ch-ver-numbers-40-v1/leaderboard?scope=friends',
    'GET',
    null,
    cookieA
  );
  assert.equal(friendsBoard.data.entries.length, 2);

  // When Alice blocks Bob, Bob immediately disappears from Alice's friends list and leaderboard
  const blockRes = await req(`/v1/users/${regB.data.id}/block`, 'POST', {}, cookieA);
  assert.equal(blockRes.status, 204);

  const friendsAfterBlock = await req('/v1/friends', 'GET', null, cookieA);
  assert.equal(friendsAfterBlock.data.items.length, 0);

  const boardAfterBlock = await req(
    '/v1/challenge-versions/ch-ver-numbers-40-v1/leaderboard?scope=global',
    'GET',
    null,
    cookieA
  );
  assert.equal(boardAfterBlock.data.entries.length, 1);
  assert.equal(boardAfterBlock.data.entries[0].userId, regA.data.id);
});
