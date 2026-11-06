import { DatabaseSync } from 'node:sqlite';
import {
  randomUUID as uuid,
  randomBytes,
  pbkdf2Sync,
  timingSafeEqual,
  createHash
} from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  scoreChallengeSubmission,
  hashNonce,
  isBetterChallengeScore,
  buildLeaderboard
} from './src/challengeScoring.ts';
import {
  computeNextSchedule,
  mapLegacyOutcomeToGrade
} from './src/srs.ts';
import {
  METRIC_DEFINITIONS,
  FORMULA_VERSION,
  classifyDelayBucket,
  computeAllMemoryMetrics,
  computeSkillItemStats,
  computeLocusConfusionStats
} from './src/memoryMetrics.ts';
import {
  generateAdaptiveInterventions,
  evaluateInterventionOutcome
} from './src/adaptiveRecommendations.ts';

export const hash = (s) => createHash('sha256').update(String(s)).digest('hex');

const DEFAULT_ERROR_CODES = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR'
};

export class AppError extends Error {
  constructor(message, status = 400, code) {
    super(message);
    this.status = status;
    this.code = code || DEFAULT_ERROR_CODES[status] || 'VALIDATION_ERROR';
  }
}

export function text(value, key, max = 4000, required = false) {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (required && !value.trim())
  ) {
    throw new AppError('Campo non valido: ' + key, 400, 'VALIDATION_ERROR');
  }
  return value.trim();
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeHandle(rawName, fallbackId) {
  const base = String(rawName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18) || 'loco_user';
  const suffix = String(fallbackId || uuid()).replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase();
  return `${base}_${suffix}`;
}

export class Store {
  constructor(path) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;');
    this.db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    if (!this.all('PRAGMA table_info(loci)').some((c) => c.name === 'anchor_json')) {
      this.db.exec('ALTER TABLE loci ADD COLUMN anchor_json TEXT');
    }
    this.db.exec('PRAGMA user_version=2');
    this._seedDefaults();
    this._syncLegacyUsers();
  }

  run(sql, ...p) {
    return this.db.prepare(sql).run(...p);
  }

  all(sql, ...p) {
    return this.db.prepare(sql).all(...p);
  }

  one(sql, ...p) {
    return this.db.prepare(sql).get(...p);
  }

  transaction(fn) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const v = fn();
      this.db.exec('COMMIT');
      return v;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  _seedDefaults() {
    const now = nowIso();
    for (const def of Object.values(METRIC_DEFINITIONS)) {
      this.run(
        `INSERT OR IGNORE INTO memory_metric_definitions
         (metric_key, dashboard_section, display_name, unit, polarity, formula_version, min_sample_size, default_window_days, description, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        def.metricKey,
        def.dashboardSection,
        def.displayName,
        def.unit,
        def.polarity,
        def.formulaVersion,
        def.minSampleSize,
        def.defaultWindowDays,
        def.description
      );
    }

    const lessons = [
      ['loci-foundations', 0, 'Il Palazzo della Memoria e i Loci', 'loci'],
      ['vivid-associations', 1, 'Associazioni vivide, assurde e multisensoriali', 'loci'],
      ['link-story-method', 2, 'Metodo Link e Catena Narrativa', 'abstract'],
      ['major-system-00-99', 3, 'Sistema Fonetico Leibniz / Major 00–99', 'major'],
      ['pao-system', 4, 'Sistema PAO (Persona-Azione-Oggetto)', 'pao'],
      ['names-and-faces', 5, 'Nomi e Volti', 'faces'],
      ['abstract-concepts-lab', 6, 'Concetti Astratti e Spiegazione Attiva', 'abstract'],
      ['spaced-retrieval-mastery', 7, 'Retrieval Practice e Ripetizione Dilazionata', 'speech']
    ];
    for (const [slug, ordinal, title, skill] of lessons) {
      this.run(
        `INSERT OR IGNORE INTO technique_lessons (id, slug, ordinal, title, skill, version, content_md, published_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        `lesson-${ordinal}`,
        slug,
        ordinal,
        title,
        skill,
        title,
        now
      );
    }

    const exercises = [
      ['ex-major-00-99', 'major-00-99', 'Major 00–99 Drill Bidirezionale', 'major', 'number_to_image', '{"itemCount":10}'],
      ['ex-loci-sprint', 'loci-sprint', 'Loci Sprint Spaziale', 'loci', 'forward', '{"itemCount":10}'],
      ['ex-abstract-lab', 'abstract-lab', 'Abstract Lab: Immagine e Concetto', 'abstract', 'forward', '{"itemCount":8}'],
      ['ex-face-name', 'face-name-recall', 'Face & Name Studio', 'faces', 'face_to_name', '{"itemCount":8}'],
      ['ex-speech-recall', 'speech-key-points', 'Speech Recall: Sequenza Argomenti', 'speech', 'forward', '{"itemCount":6}'],
      ['ex-numbers-span', 'numbers-span-40', 'Number Span Rapido', 'numbers', 'forward', '{"itemCount":10}'],
      ['ex-pao-triplets', 'pao-triplets', 'PAO Triplet Compression', 'pao', 'number_to_scene', '{"itemCount":8}']
    ];
    for (const [id, slug, title, skill, dir, cfg] of exercises) {
      this.run(
        `INSERT OR IGNORE INTO training_exercises
         (id, slug, title, skill, default_direction, generator_version, scorer_version, config_json, active, created_at)
         VALUES (?, ?, ?, ?, ?, 'gen-v1', 'scorer-v1', ?, 1, ?)`,
        id,
        slug,
        title,
        skill,
        dir,
        cfg,
        now
      );
    }

    const challenges = [
      {
        defId: 'ch-def-numbers-40',
        verId: 'ch-ver-numbers-40-v1',
        slug: 'numbers-40',
        title: 'Numbers 40 Benchmark',
        skill: 'numbers',
        scorerType: 'accuracy_time',
        durationMs: 120_000,
        stimuli: [
          { ordinal: 0, prompt: 'Coppia 1', stimulus: '14' },
          { ordinal: 1, prompt: 'Coppia 2', stimulus: '92' },
          { ordinal: 2, prompt: 'Coppia 3', stimulus: '65' },
          { ordinal: 3, prompt: 'Coppia 4', stimulus: '35' },
          { ordinal: 4, prompt: 'Coppia 5', stimulus: '89' }
        ],
        answers: [
          { ordinal: 0, expectedValue: '14' },
          { ordinal: 1, expectedValue: '92' },
          { ordinal: 2, expectedValue: '65' },
          { ordinal: 3, expectedValue: '35' },
          { ordinal: 4, expectedValue: '89' }
        ]
      },
      {
        defId: 'ch-def-major-speed-30',
        verId: 'ch-ver-major-speed-30-v1',
        slug: 'major-speed-30',
        title: 'Major Speed 30',
        skill: 'major',
        scorerType: 'perfect_speed',
        durationMs: 90_000,
        stimuli: [
          { ordinal: 0, prompt: 'Major 36', stimulus: '36' },
          { ordinal: 1, prompt: 'Major 63', stimulus: '63' },
          { ordinal: 2, prompt: 'Major 12', stimulus: '12' },
          { ordinal: 3, prompt: 'Major 47', stimulus: '47' }
        ],
        answers: [
          { ordinal: 0, expectedValue: 'mela' },
          { ordinal: 1, expectedValue: 'cime' },
          { ordinal: 2, expectedValue: 'tana' },
          { ordinal: 3, expectedValue: 'rocca' }
        ]
      }
    ];

    for (const c of challenges) {
      this.run(
        `INSERT OR IGNORE INTO challenge_definitions (id, slug, title, skill, description, active, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        c.defId,
        c.slug,
        c.title,
        c.skill,
        c.title,
        now
      );
      this.run(
        `INSERT OR IGNORE INTO challenge_versions
         (id, challenge_id, version_number, rules_json, duration_ms, scorer_type, scorer_version, public_stimuli_json, private_answer_key_json, private_seed, published_at, created_at)
         VALUES (?, ?, 1, ?, ?, ?, 'challenge-scorer-v1', ?, ?, ?, ?, ?)`,
        c.verId,
        c.defId,
        JSON.stringify({ rankedAttemptsAllowed: 1, scorerType: c.scorerType }),
        c.durationMs,
        c.scorerType,
        JSON.stringify(c.stimuli),
        JSON.stringify(c.answers),
        `seed-${c.slug}-v1`,
        now,
        now
      );
    }
  }

  _syncLegacyUsers() {
    const legacyUsers = this.all('SELECT * FROM users');
    for (const u of legacyUsers) {
      this.ensureAppUser(u.id, u.name);
    }
  }

  ensureAppUser(userId, displayName = 'Utente LOCO') {
    const existing = this.one('SELECT * FROM app_users WHERE id = ?', userId);
    if (existing) {
      return existing;
    }
    const now = nowIso();
    let handle = sanitizeHandle(displayName, userId);
    if (this.one('SELECT 1 FROM app_users WHERE handle = ?', handle)) {
      handle = sanitizeHandle(displayName, uuid());
    }
    this.run(
      `INSERT INTO app_users (id, handle, display_name, locale, timezone, discoverable, leaderboard_visibility, account_status, created_at, updated_at)
       VALUES (?, ?, ?, 'it-IT', 'Europe/Rome', 1, 'public', 'active', ?, ?)`,
      userId,
      handle,
      displayName,
      now,
      now
    );
    this.run(
      `INSERT OR IGNORE INTO user_preferences (user_id, learning_goal, daily_target_minutes, desired_retention, preferred_srs_algorithm, accessibility_json, ai_personalization_opt_in, updated_at)
       VALUES (?, 'exam', 15, 0.9, 'simple-v1', '{}', 0, ?)`,
      userId,
      now
    );
    return this.one('SELECT * FROM app_users WHERE id = ?', userId);
  }

  emitOutbox(eventType, aggregateType, aggregateId, actorId, payload = {}) {
    const id = uuid();
    const createdAt = nowIso();
    this.run(
      `INSERT INTO outbox_events (id, event_type, aggregate_type, aggregate_id, actor_id, schema_version, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      eventType,
      aggregateType,
      aggregateId,
      actorId || null,
      JSON.stringify(payload),
      createdAt
    );
    return {
      id,
      eventType,
      aggregateType,
      aggregateId,
      actorId: actorId || null,
      schemaVersion: 1,
      createdAt,
      payload
    };
  }

  // ===========================================================================
  // LEGACY v1 METHODS (100% preserved)
  // ===========================================================================

  account(data, register) {
    const email = text(data.email, 'email', 254, true).toLowerCase();
    const password = text(data.password, 'password', 128, true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
      throw new AppError('Email valida e password di almeno 10 caratteri richieste.');
    }
    let u = this.one('SELECT * FROM users WHERE email=?', email);
    if (register) {
      if (u) throw new AppError('Account già presente.', 409);
      const salt = randomBytes(24).toString('hex');
      u = {
        id: uuid(),
        email,
        name: text(data.name, 'nome', 80, true),
        salt,
        password_hash: pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
      };
      this.run(
        'INSERT INTO users VALUES(?,?,?,?,?,?)',
        u.id,
        email,
        u.name,
        u.password_hash,
        salt,
        Date.now()
      );
      this.ensureAppUser(u.id, u.name);
    } else {
      const candidate = pbkdf2Sync(password, u?.salt || 'invalid-user', 310000, 32, 'sha256');
      if (!u || !timingSafeEqual(candidate, Buffer.from(u.password_hash, 'hex'))) {
        throw new AppError('Email o password errati.', 401);
      }
      this.ensureAppUser(u.id, u.name);
    }
    const token = randomBytes(32).toString('hex');
    this.run('DELETE FROM sessions WHERE expires_at<?', Date.now());
    this.run('INSERT INTO sessions VALUES(?,?,?)', hash(token), u.id, Date.now() + 7 * 86400000);
    return { user: { id: u.id, name: u.name, email: u.email }, token };
  }

  user(token) {
    return token
      ? this.one(
          'SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?',
          hash(token),
          Date.now()
        )
      : null;
  }

  route(user, id) {
    const r = this.one('SELECT * FROM routes WHERE id=? AND user_id=?', id, user);
    if (!r) throw new AppError('Percorso non trovato.', 404);
    return r;
  }

  routes(user) {
    return this.all(
      'SELECT r.*,COUNT(l.id) AS total,COALESCE(SUM(l.studied),0) AS studied,COALESCE(SUM(CASE WHEN l.due<=? THEN 1 ELSE 0 END),0) AS due FROM routes r LEFT JOIN loci l ON l.route_id=r.id WHERE r.user_id=? GROUP BY r.id ORDER BY r.updated_at DESC',
      Date.now(),
      user
    );
  }

  saveRoute(user, data, id) {
    const title = text(data.title, 'titolo', 120, true);
    const description = text(data.description ?? '', 'descrizione');
    const topic = text(data.topic ?? '', 'argomento', 120);
    const environment = data.environment ?? 'room';
    const status = data.status ?? 'draft';
    if (!['room', 'streetview'].includes(environment) || !['draft', 'ready', 'archived'].includes(status)) {
      throw new AppError('Tipo o stato non valido.');
    }
    if (id) {
      this.route(user, id);
      this.run(
        'UPDATE routes SET title=?,description=?,topic=?,environment=?,status=?,updated_at=? WHERE id=?',
        title,
        description,
        topic,
        environment,
        status,
        Date.now(),
        id
      );
    } else {
      id = uuid();
      this.run(
        'INSERT INTO routes VALUES(?,?,?,?,?,?,?,?,?)',
        id,
        user,
        title,
        description,
        topic,
        environment,
        status,
        Date.now(),
        Date.now()
      );
    }
    return this.route(user, id);
  }

  detail(user, id) {
    return {
      ...this.route(user, id),
      loci: this.all('SELECT * FROM loci WHERE route_id=? ORDER BY position', id).map((l) => ({
        ...l,
        anchor: l.anchor_json ? JSON.parse(l.anchor_json) : null
      }))
    };
  }

  saveLocus(user, route, data, id) {
    this.route(user, route);
    const label = text(data.label, 'locus', 120, true);
    const question = text(data.question, 'domanda', 4000, true);
    const answer = text(data.answer, 'risposta', 4000, true);
    const scene = text(data.scene ?? '', 'associazione');
    const anchor = data.anchor === undefined ? undefined : validateAnchor(data.anchor);
    const x = data.x ?? 0.5;
    const y = data.y ?? 0.5;
    if (![x, y].every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1)) {
      throw new AppError('Coordinate non valide.');
    }
    if (id) {
      const old = this.one('SELECT * FROM loci WHERE id=? AND route_id=?', id, route);
      if (!old) throw new AppError('Locus non trovato.', 404);
      const changed = old.question !== question || old.answer !== answer;
      this.run(
        'UPDATE loci SET label=?,question=?,answer=?,scene=?,x=?,y=?,streak=?,due=?,studied=? WHERE id=?',
        label,
        question,
        answer,
        scene,
        x,
        y,
        changed ? 0 : old.streak,
        changed ? Date.now() : old.due,
        changed ? 0 : old.studied,
        id
      );
    } else {
      if (this.one('SELECT COUNT(*) AS n FROM loci WHERE route_id=?', route).n >= 200) {
        throw new AppError('Massimo 200 loci per percorso.');
      }
      id = uuid();
      this.run(
        'INSERT INTO loci(id,route_id,position,label,question,answer,scene,x,y,due) VALUES(?,?,?,?,?,?,?,?,?,?)',
        id,
        route,
        this.one('SELECT COALESCE(MAX(position),-1)+1 AS p FROM loci WHERE route_id=?', route).p,
        label,
        question,
        answer,
        scene,
        x,
        y,
        Date.now()
      );
    }
    if (anchor !== undefined) {
      this.run('UPDATE loci SET anchor_json=? WHERE id=?', anchor ? JSON.stringify(anchor) : null, id);
    }
    this.run('UPDATE routes SET updated_at=? WHERE id=?', Date.now(), route);
    const saved = this.one('SELECT * FROM loci WHERE id=?', id);
    return { ...saved, anchor: saved.anchor_json ? JSON.parse(saved.anchor_json) : null };
  }

  reorder(user, route, ids) {
    const r = this.detail(user, route);
    if (
      !Array.isArray(ids) ||
      ids.length !== r.loci.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !r.loci.some((l) => l.id === id))
    ) {
      throw new AppError('Ordine dei loci non valido.');
    }
    this.transaction(() => {
      this.run('UPDATE loci SET position=-position-1 WHERE route_id=?', route);
      ids.forEach((id, i) =>
        this.run('UPDATE loci SET position=? WHERE id=? AND route_id=?', i, id, route)
      );
    });
    return this.detail(user, route);
  }

  review(user, locus, outcome) {
    if (!['forgot', 'help', 'correct'].includes(outcome)) {
      throw new AppError('Esito non valido.');
    }
    const l = this.one(
      'SELECT l.* FROM loci l JOIN routes r ON r.id=l.route_id WHERE l.id=? AND r.user_id=?',
      locus,
      user
    );
    if (!l) throw new AppError('Locus non trovato.', 404);
    const streak = outcome === 'correct' ? l.streak + 1 : 0;
    const delay =
      outcome === 'forgot'
        ? 600000
        : outcome === 'help'
          ? 86400000
          : [1, 3, 7, 14, 30][Math.min(streak - 1, 4)] * 86400000;
    this.transaction(() => {
      this.run('UPDATE loci SET streak=?,due=?,studied=1 WHERE id=?', streak, Date.now() + delay, locus);
      this.run('INSERT INTO reviews VALUES(?,?,?,?,?)', uuid(), user, locus, outcome, Date.now());
    });
    return { streak, due: Date.now() + delay };
  }

  summary(user) {
    return {
      routes: this.routes(user),
      completed: this.all('SELECT lesson FROM lesson_progress WHERE user_id=?', user).map(
        (r) => r.lesson
      ),
      reviews: this.one('SELECT COUNT(*) AS n FROM reviews WHERE user_id=?', user).n
    };
  }

  backup(user) {
    return {
      version: 2,
      exportedAt: Date.now(),
      routes: this.routes(user).map((r) => this.detail(user, r.id)),
      completed: this.summary(user).completed
    };
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 1: IDENTITY & FRIENDS
  // ===========================================================================

  getMeV1(userId) {
    const profile = this.ensureAppUser(userId);
    const prefs = this.one('SELECT * FROM user_preferences WHERE user_id = ?', userId);
    return {
      profile: {
        id: profile.id,
        handle: profile.handle,
        displayName: profile.display_name,
        avatarAssetId: profile.avatar_asset_id,
        locale: profile.locale,
        timezone: profile.timezone,
        discoverable: Boolean(profile.discoverable),
        leaderboardVisibility: profile.leaderboard_visibility,
        createdAt: profile.created_at
      },
      preferences: {
        userId: prefs.user_id,
        learningGoal: prefs.learning_goal,
        dailyTargetMinutes: prefs.daily_target_minutes,
        desiredRetention: prefs.desired_retention,
        preferredSrsAlgorithm: prefs.preferred_srs_algorithm,
        accessibility: JSON.parse(prefs.accessibility_json || '{}'),
        aiPersonalizationOptIn: Boolean(prefs.ai_personalization_opt_in),
        updatedAt: prefs.updated_at
      }
    };
  }

  updateMeV1(userId, data) {
    this.ensureAppUser(userId);
    const current = this.one('SELECT * FROM app_users WHERE id = ?', userId);
    let handle = current.handle;
    if (data.handle !== undefined) {
      const candidate = String(data.handle).trim().toLowerCase();
      if (!/^[a-z0-9_]{3,32}$/.test(candidate) || candidate.includes('@')) {
        throw new AppError(
          'Handle non valido (3-32 caratteri a-z0-9_, nessuna email).',
          422,
          'VALIDATION_ERROR'
        );
      }
      const existing = this.one('SELECT id FROM app_users WHERE handle = ? AND id <> ?', candidate, userId);
      if (existing) {
        throw new AppError('Handle già in uso.', 409, 'CONFLICT');
      }
      handle = candidate;
    }

    const displayName =
      data.displayName !== undefined
        ? text(data.displayName, 'displayName', 80, true)
        : current.display_name;
    const discoverable =
      typeof data.discoverable === 'boolean'
        ? data.discoverable
          ? 1
          : 0
        : current.discoverable;
    const leaderboardVisibility =
      data.leaderboardVisibility !== undefined
        ? data.leaderboardVisibility
        : current.leaderboard_visibility;
    if (!['public', 'friends', 'hidden'].includes(leaderboardVisibility)) {
      throw new AppError('Visibilità classifica non valida.', 422, 'VALIDATION_ERROR');
    }

    const now = nowIso();
    this.run(
      `UPDATE app_users
       SET handle = ?, display_name = ?, discoverable = ?, leaderboard_visibility = ?, updated_at = ?
       WHERE id = ?`,
      handle,
      displayName,
      discoverable,
      leaderboardVisibility,
      now,
      userId
    );
    this.run('UPDATE users SET name = ? WHERE id = ?', displayName, userId);
    return this.getMeV1(userId).profile;
  }

  updatePreferencesV1(userId, data) {
    this.ensureAppUser(userId);
    const current = this.one('SELECT * FROM user_preferences WHERE user_id = ?', userId);
    const learningGoal = data.learningGoal ?? current.learning_goal;
    if (!['exam', 'long_term', 'memory_sport', 'professional'].includes(learningGoal)) {
      throw new AppError('learningGoal non valido.', 422, 'VALIDATION_ERROR');
    }
    const dailyTargetMinutes =
      data.dailyTargetMinutes !== undefined
        ? Number(data.dailyTargetMinutes)
        : current.daily_target_minutes;
    if (!Number.isInteger(dailyTargetMinutes) || dailyTargetMinutes < 1 || dailyTargetMinutes > 480) {
      throw new AppError('dailyTargetMinutes deve essere tra 1 e 480.', 422, 'VALIDATION_ERROR');
    }
    const desiredRetention =
      data.desiredRetention !== undefined
        ? Number(data.desiredRetention)
        : current.desired_retention;
    if (!Number.isFinite(desiredRetention) || desiredRetention < 0.7 || desiredRetention > 0.99) {
      throw new AppError('desiredRetention deve essere tra 0.70 e 0.99.', 422, 'VALIDATION_ERROR');
    }
    const preferredSrsAlgorithm = data.preferredSrsAlgorithm ?? current.preferred_srs_algorithm;
    if (!['simple-v1', 'fsrs-7'].includes(preferredSrsAlgorithm)) {
      throw new AppError('preferredSrsAlgorithm non valido.', 422, 'VALIDATION_ERROR');
    }
    const aiOptIn =
      typeof data.aiPersonalizationOptIn === 'boolean'
        ? data.aiPersonalizationOptIn
          ? 1
          : 0
        : current.ai_personalization_opt_in;

    const now = nowIso();
    this.run(
      `UPDATE user_preferences
       SET learning_goal = ?, daily_target_minutes = ?, desired_retention = ?, preferred_srs_algorithm = ?, ai_personalization_opt_in = ?, updated_at = ?
       WHERE user_id = ?`,
      learningGoal,
      dailyTargetMinutes,
      desiredRetention,
      preferredSrsAlgorithm,
      aiOptIn,
      now,
      userId
    );
    return this.getMeV1(userId).preferences;
  }

  createExportJobV1(userId, idempotencyKey) {
    this.ensureAppUser(userId);
    const key = text(idempotencyKey || uuid(), 'idempotencyKey', 128, true);
    const existing = this.one(
      'SELECT * FROM data_export_jobs WHERE user_id = ? AND idempotency_key = ?',
      userId,
      key
    );
    if (existing) {
      return this._formatExportJob(userId, existing);
    }
    const now = nowIso();
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const id = uuid();
    this.run(
      `INSERT INTO data_export_jobs (id, user_id, status, expires_at, idempotency_key, created_at, completed_at)
       VALUES (?, ?, 'ready', ?, ?, ?, ?)`,
      id,
      userId,
      expiresAt,
      key,
      now,
      now
    );
    const row = this.one('SELECT * FROM data_export_jobs WHERE id = ?', id);
    return this._formatExportJob(userId, row);
  }

  _formatExportJob(userId, row) {
    const me = this.getMeV1(userId);
    return {
      exportJobId: row.id,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      data: {
        profile: me.profile,
        preferences: me.preferences,
        projects: this.listProjectsV1(userId),
        palaces: this.listPalacesV1(userId),
        reviewAttempts: this.all(
          'SELECT id, target_id, knowledge_revision, answered_at, response_ms, verdict, scheduler_grade, hint_count FROM review_attempts WHERE owner_id = ? ORDER BY answered_at DESC',
          userId
        ),
        challengeResults: this.all(
          'SELECT id, challenge_version_id, score, correct_count, total_count, accuracy, elapsed_ms, eligible, verified_at FROM challenge_results WHERE owner_id = ?',
          userId
        )
      }
    };
  }

  isBlockedEitherWay(userA, userB) {
    const row = this.one(
      `SELECT 1 FROM user_blocks
       WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
      userA,
      userB,
      userB,
      userA
    );
    return Boolean(row);
  }

  getBlockedUserIds(userId) {
    const rows = this.all(
      `SELECT blocked_id AS id FROM user_blocks WHERE blocker_id = ?
       UNION
       SELECT blocker_id AS id FROM user_blocks WHERE blocked_id = ?`,
      userId,
      userId
    );
    return new Set(rows.map((r) => r.id));
  }

  getAcceptedFriendIds(userId) {
    const rows = this.all(
      `SELECT CASE WHEN user_low_id = ? THEN user_high_id ELSE user_low_id END AS friend_id
       FROM friendships
       WHERE user_low_id = ? OR user_high_id = ?`,
      userId,
      userId,
      userId
    );
    const blocked = this.getBlockedUserIds(userId);
    return new Set(rows.map((r) => r.friend_id).filter((id) => !blocked.has(id)));
  }

  searchUsersV1(viewerId, handleQuery) {
    this.ensureAppUser(viewerId);
    const q = String(handleQuery || '').trim().toLowerCase();
    if (!q) return { items: [] };
    const blocked = this.getBlockedUserIds(viewerId);
    const rows = this.all(
      `SELECT id, handle, display_name, avatar_asset_id
       FROM app_users
       WHERE discoverable = 1 AND account_status = 'active' AND handle LIKE ?
       ORDER BY handle ASC
       LIMIT 25`,
      `${q}%`
    );
    return {
      items: rows
        .filter((r) => r.id !== viewerId && !blocked.has(r.id))
        .map((r) => ({
          id: r.id,
          handle: r.handle,
          displayName: r.display_name,
          avatarAssetId: r.avatar_asset_id
        }))
    };
  }

  listFriendsV1(userId) {
    this.ensureAppUser(userId);
    const friendIds = Array.from(this.getAcceptedFriendIds(userId));
    if (friendIds.length === 0) return { items: [] };
    const items = friendIds
      .map((fid) =>
        this.one('SELECT id, handle, display_name, avatar_asset_id FROM app_users WHERE id = ?', fid)
      )
      .filter(Boolean)
      .map((u) => ({
        id: u.id,
        handle: u.handle,
        displayName: u.display_name,
        avatarAssetId: u.avatar_asset_id
      }));
    return { items };
  }

  listFriendRequestsV1(userId) {
    this.ensureAppUser(userId);
    const blocked = this.getBlockedUserIds(userId);
    const incoming = this.all(
      `SELECT fr.*, u.handle AS sender_handle, u.display_name AS sender_name
       FROM friend_requests fr
       JOIN app_users u ON u.id = fr.sender_id
       WHERE fr.recipient_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      userId
    ).filter((r) => !blocked.has(r.sender_id));

    const outgoing = this.all(
      `SELECT fr.*, u.handle AS recipient_handle, u.display_name AS recipient_name
       FROM friend_requests fr
       JOIN app_users u ON u.id = fr.recipient_id
       WHERE fr.sender_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      userId
    ).filter((r) => !blocked.has(r.recipient_id));

    return { incoming, outgoing };
  }

  createFriendRequestV1(senderId, recipientId) {
    this.ensureAppUser(senderId);
    if (!recipientId || senderId === recipientId) {
      throw new AppError('Destinatario non valido.', 422, 'VALIDATION_ERROR');
    }
    const recipient = this.one(
      'SELECT * FROM app_users WHERE id = ? AND account_status = ?',
      recipientId,
      'active'
    );
    if (!recipient || !recipient.discoverable || this.isBlockedEitherWay(senderId, recipientId)) {
      throw new AppError('Utente non trovato o non disponibile.', 404, 'NOT_FOUND');
    }

    const [low, high] = senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];
    if (this.one('SELECT 1 FROM friendships WHERE user_low_id = ? AND user_high_id = ?', low, high)) {
      throw new AppError('Siete già amici.', 409, 'CONFLICT');
    }

    const existingSame = this.one(
      `SELECT * FROM friend_requests WHERE sender_id = ? AND recipient_id = ? AND status = 'pending'`,
      senderId,
      recipientId
    );
    if (existingSame) {
      return { requestId: existingSame.id, status: existingSame.status };
    }

    const inversePending = this.one(
      `SELECT * FROM friend_requests WHERE sender_id = ? AND recipient_id = ? AND status = 'pending'`,
      recipientId,
      senderId
    );
    if (inversePending) {
      throw new AppError('Esiste già una richiesta pendente in direzione opposta.', 409, 'CONFLICT');
    }

    const id = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO friend_requests (id, sender_id, recipient_id, status, created_at)
       VALUES (?, ?, ?, 'pending', ?)`,
      id,
      senderId,
      recipientId,
      now
    );
    return { requestId: id, status: 'pending' };
  }

  respondFriendRequestV1(userId, requestId, action) {
    this.ensureAppUser(userId);
    const reqRow = this.one('SELECT * FROM friend_requests WHERE id = ?', requestId);
    if (!reqRow || reqRow.recipient_id !== userId) {
      throw new AppError('Richiesta non trovata.', 404, 'NOT_FOUND');
    }
    if (this.isBlockedEitherWay(reqRow.sender_id, reqRow.recipient_id)) {
      throw new AppError('Operazione non consentita.', 403, 'FORBIDDEN');
    }
    if (reqRow.status !== 'pending') {
      return { status: reqRow.status };
    }

    const now = nowIso();
    if (action === 'reject') {
      this.run(
        `UPDATE friend_requests SET status = 'rejected', responded_at = ? WHERE id = ?`,
        now,
        requestId
      );
      return { status: 'rejected' };
    }

    const [low, high] =
      reqRow.sender_id < reqRow.recipient_id
        ? [reqRow.sender_id, reqRow.recipient_id]
        : [reqRow.recipient_id, reqRow.sender_id];

    return this.transaction(() => {
      this.run(
        `UPDATE friend_requests SET status = 'accepted', responded_at = ?
         WHERE (sender_id = ? AND recipient_id = ? AND status = 'pending')
            OR (sender_id = ? AND recipient_id = ? AND status = 'pending')`,
        now,
        reqRow.sender_id,
        reqRow.recipient_id,
        reqRow.recipient_id,
        reqRow.sender_id
      );
      this.run(
        `INSERT OR IGNORE INTO friendships (user_low_id, user_high_id, source_request_id, created_at)
         VALUES (?, ?, ?, ?)`,
        low,
        high,
        requestId,
        now
      );
      this.emitOutbox('friend.accepted', 'friendship', requestId, userId, {
        userLowId: low,
        userHighId: high
      });
      return {
        status: 'accepted',
        friendship: { userLowId: low, userHighId: high, createdAt: now }
      };
    });
  }

  deleteFriendV1(userId, targetUserId) {
    const [low, high] =
      userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
    this.run('DELETE FROM friendships WHERE user_low_id = ? AND user_high_id = ?', low, high);
  }

  blockUserV1(blockerId, blockedId, reason = null) {
    this.ensureAppUser(blockerId);
    if (!blockedId || blockerId === blockedId) {
      throw new AppError('Utente da bloccare non valido.', 422, 'VALIDATION_ERROR');
    }
    this.ensureAppUser(blockedId);
    const now = nowIso();
    const [low, high] =
      blockerId < blockedId ? [blockerId, blockedId] : [blockedId, blockerId];

    this.transaction(() => {
      this.run(
        `INSERT OR REPLACE INTO user_blocks (blocker_id, blocked_id, reason, created_at)
         VALUES (?, ?, ?, ?)`,
        blockerId,
        blockedId,
        reason,
        now
      );
      this.run('DELETE FROM friendships WHERE user_low_id = ? AND user_high_id = ?', low, high);
      this.run(
        `UPDATE friend_requests SET status = 'cancelled', responded_at = ?
         WHERE status = 'pending' AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))`,
        now,
        blockerId,
        blockedId,
        blockedId,
        blockerId
      );
      this.run(
        `UPDATE challenge_invites SET status = 'expired', responded_at = ?
         WHERE status = 'pending' AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))`,
        now,
        blockerId,
        blockedId,
        blockedId,
        blockerId
      );
    });
  }

  unblockUserV1(blockerId, blockedId) {
    this.run('DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?', blockerId, blockedId);
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 2: STUDY & KNOWLEDGE
  // ===========================================================================

  listProjectsV1(userId) {
    this.ensureAppUser(userId);
    return this.all(
      'SELECT * FROM study_projects WHERE owner_id = ? ORDER BY updated_at DESC',
      userId
    );
  }

  createProjectV1(userId, data) {
    this.ensureAppUser(userId);
    const title = text(data.title, 'title', 160, true);
    const description = text(data.description ?? '', 'description', 2000);
    const goal = text(data.goal ?? '', 'goal', 500);
    const targetDate = data.targetDate ? text(data.targetDate, 'targetDate', 32) : null;
    const id = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO study_projects (id, owner_id, title, description, goal, target_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      id,
      userId,
      title,
      description,
      goal,
      targetDate,
      now,
      now
    );
    return this.getProjectV1(userId, id);
  }

  getProjectV1(userId, projectId) {
    const row = this.one(
      'SELECT * FROM study_projects WHERE id = ? AND owner_id = ?',
      projectId,
      userId
    );
    if (!row) {
      throw new AppError('Progetto non trovato.', 404, 'NOT_FOUND');
    }
    return row;
  }

  updateProjectV1(userId, projectId, data) {
    const current = this.getProjectV1(userId, projectId);
    const title = data.title !== undefined ? text(data.title, 'title', 160, true) : current.title;
    const description =
      data.description !== undefined
        ? text(data.description, 'description', 2000)
        : current.description;
    const goal = data.goal !== undefined ? text(data.goal, 'goal', 500) : current.goal;
    const status = data.status ?? current.status;
    if (!['draft', 'active', 'archived'].includes(status)) {
      throw new AppError('Stato progetto non valido.', 422, 'VALIDATION_ERROR');
    }
    this.run(
      `UPDATE study_projects SET title = ?, description = ?, goal = ?, status = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`,
      title,
      description,
      goal,
      status,
      nowIso(),
      projectId,
      userId
    );
    return this.getProjectV1(userId, projectId);
  }

  deleteProjectV1(userId, projectId) {
    this.getProjectV1(userId, projectId);
    this.run('DELETE FROM study_projects WHERE id = ? AND owner_id = ?', projectId, userId);
  }

  createUploadInitV1(userId, projectId, data) {
    this.getProjectV1(userId, projectId);
    const filename = text(data.filename, 'filename', 255, true);
    const mime = text(data.mime || 'application/pdf', 'mime', 120, true);
    const bytes = Number(data.bytes ?? 1024);
    if (!Number.isInteger(bytes) || bytes <= 0 || bytes > 50 * 1024 * 1024) {
      throw new AppError('Dimensione file non valida.', 422, 'VALIDATION_ERROR');
    }
    const sha256 = String(data.sha256 || hash(filename + Date.now())).toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      throw new AppError('Checksum SHA-256 non valido.', 422, 'VALIDATION_ERROR');
    }
    const mediaKind = data.mediaKind || (mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.includes('gltf') || mime.includes('glb') ? 'model_3d' : 'document');
    const assetId = uuid();
    const storageKey = `private/${userId}/${projectId}/${assetId}/${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const now = nowIso();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    this.run(
      `INSERT INTO media_assets (id, owner_id, storage_key, filename, mime_type, byte_size, sha256, media_kind, status, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded', ?, ?)`,
      assetId,
      userId,
      storageKey,
      filename,
      mime,
      bytes,
      sha256,
      mediaKind,
      JSON.stringify({ projectId }),
      now
    );

    return {
      assetId,
      signedUploadUrl: `/v1/storage/upload/${assetId}?expires=${encodeURIComponent(expiresAt)}`,
      expiresAt
    };
  }

  createSourceDocumentV1(userId, projectId, data) {
    this.getProjectV1(userId, projectId);
    const assetId = text(data.assetId, 'assetId', 64, true);
    const asset = this.one(
      'SELECT * FROM media_assets WHERE id = ? AND owner_id = ?',
      assetId,
      userId
    );
    if (!asset) {
      throw new AppError('Asset privato non trovato.', 404, 'NOT_FOUND');
    }
    const title = text(data.title || asset.filename, 'title', 200, true);
    const docId = uuid();
    const jobId = uuid();
    const now = nowIso();

    const rawChunks = Array.isArray(data.chunks) && data.chunks.length > 0
      ? data.chunks
      : [
          {
            pageStart: 1,
            pageEnd: 1,
            heading: title,
            contentText: text(data.extractedText || `Contenuto estratto da ${title}`, 'extractedText', 8000)
          }
        ];

    this.transaction(() => {
      this.run(
        `INSERT INTO source_documents (id, owner_id, project_id, asset_id, title, language, page_count, parser_version, ocr_used, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'it', ?, 'pdf-text-v1', 0, 'ready', ?, ?)`,
        docId,
        userId,
        projectId,
        assetId,
        title,
        rawChunks.length,
        now,
        now
      );

      rawChunks.forEach((ch, idx) => {
        const chunkId = uuid();
        const content = text(ch.contentText || ch.text || '', 'contentText', 8000, true);
        this.run(
          `INSERT INTO document_chunks (id, owner_id, document_id, ordinal, page_start, page_end, char_start, char_end, heading, content_text, token_estimate, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
          chunkId,
          userId,
          docId,
          idx,
          Number(ch.pageStart ?? idx + 1),
          Number(ch.pageEnd ?? idx + 1),
          content.length,
          ch.heading || null,
          content,
          Math.ceil(content.length / 4),
          now
        );

        // If AI proposals are included in the source ingestion payload, store them strictly as `proposed` (never `confirmed`!)
        if (Array.isArray(ch.proposedItems)) {
          for (const prop of ch.proposedItems) {
            const itemId = uuid();
            const prompt = text(prop.prompt, 'prompt', 4000, true);
            const answer = text(prop.answer, 'answer', 4000, true);
            const explanation = text(prop.explanation ?? '', 'explanation', 4000);
            this.run(
              `INSERT INTO knowledge_items (id, owner_id, project_id, kind, prompt, answer, brief_explanation, importance, state, origin, current_revision, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 3, 'proposed', 'ai_extracted', 1, ?, ?)`,
              itemId,
              userId,
              projectId,
              prop.kind || 'concept',
              prompt,
              answer,
              explanation,
              now,
              now
            );
            this.run(
              `INSERT INTO knowledge_revisions (id, owner_id, knowledge_item_id, revision, prompt, answer, brief_explanation, changed_by, change_reason, created_at)
               VALUES (?, ?, ?, 1, ?, ?, ?, 'user', 'ai_proposal', ?)`,
              uuid(),
              userId,
              itemId,
              prompt,
              answer,
              explanation,
              now
            );
            this.run(
              `INSERT INTO knowledge_evidence (id, owner_id, knowledge_item_id, document_id, chunk_id, page_number, quote_text, confidence, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0.92, ?)`,
              uuid(),
              userId,
              itemId,
              docId,
              chunkId,
              Number(ch.pageStart ?? idx + 1),
              text(prop.quoteText || content.slice(0, 240), 'quoteText', 1000),
              now
            );
          }
        }
      });

      this.run(
        `INSERT INTO ai_jobs (id, owner_id, job_type, status, pipeline_version, prompt_version, model_version, input_ref_json, output_ref_json, idempotency_key, created_at, completed_at)
         VALUES (?, ?, 'document_parse', 'succeeded', 'pipe-v1', 'prompt-v1', 'parser-v1', ?, ?, ?, ?, ?)`,
        jobId,
        userId,
        JSON.stringify({ documentId: docId, assetId }),
        JSON.stringify({ chunkCount: rawChunks.length }),
        `doc-parse-${docId}`,
        now,
        now
      );

      this.emitOutbox('source.uploaded', 'source_document', docId, userId, {
        documentId: docId,
        projectId
      });
      this.emitOutbox('source.extracted', 'source_document', docId, userId, {
        documentId: docId,
        chunkCount: rawChunks.length
      });
    });

    return { documentId: docId, processingJobId: jobId };
  }

  listProjectSourcesV1(userId, projectId) {
    this.getProjectV1(userId, projectId);
    return {
      items: this.all(
        'SELECT * FROM source_documents WHERE owner_id = ? AND project_id = ? ORDER BY created_at DESC',
        userId,
        projectId
      )
    };
  }

  listSourceChunksV1(userId, sourceId) {
    const doc = this.one(
      'SELECT * FROM source_documents WHERE id = ? AND owner_id = ?',
      sourceId,
      userId
    );
    if (!doc) {
      throw new AppError('Documento non trovato.', 404, 'NOT_FOUND');
    }
    return {
      items: this.all(
        'SELECT * FROM document_chunks WHERE document_id = ? AND owner_id = ? ORDER BY ordinal ASC',
        sourceId,
        userId
      )
    };
  }

  listProjectKnowledgeV1(userId, projectId, filters = {}) {
    this.getProjectV1(userId, projectId);
    let sql = 'SELECT * FROM knowledge_items WHERE owner_id = ? AND project_id = ?';
    const params = [userId, projectId];
    if (filters.state) {
      sql += ' AND state = ?';
      params.push(filters.state);
    }
    if (filters.kind) {
      sql += ' AND kind = ?';
      params.push(filters.kind);
    }
    sql += ' ORDER BY created_at DESC';
    const items = this.all(sql, ...params).map((item) => ({
      ...item,
      evidence: this.all(
        'SELECT * FROM knowledge_evidence WHERE knowledge_item_id = ? AND owner_id = ?',
        item.id,
        userId
      )
    }));
    return { items };
  }

  createKnowledgeItemV1(userId, projectId, data) {
    this.getProjectV1(userId, projectId);
    const kind = data.kind || 'concept';
    if (!['concept', 'fact', 'definition', 'procedure', 'date', 'formula', 'vocabulary'].includes(kind)) {
      throw new AppError('Tipo di nozione non valido.', 422, 'VALIDATION_ERROR');
    }
    const prompt = text(data.prompt, 'prompt', 4000, true);
    const answer = text(data.answer, 'answer', 4000, true);
    const explanation = text(data.explanation ?? '', 'explanation', 4000);
    const origin = data.origin === 'ai_extracted' ? 'ai_extracted' : 'manual';
    // Critical guardrail: AI proposals start as `proposed`, NEVER automatically `confirmed`
    const state = origin === 'ai_extracted' ? 'proposed' : data.state === 'confirmed' ? 'confirmed' : 'proposed';
    const id = uuid();
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `INSERT INTO knowledge_items (id, owner_id, project_id, kind, prompt, answer, brief_explanation, importance, state, origin, current_revision, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        id,
        userId,
        projectId,
        kind,
        prompt,
        answer,
        explanation,
        Number(data.importance ?? 3),
        state,
        origin,
        now,
        now
      );
      this.run(
        `INSERT INTO knowledge_revisions (id, owner_id, knowledge_item_id, revision, prompt, answer, brief_explanation, changed_by, change_reason, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, 'user', 'initial', ?)`,
        uuid(),
        userId,
        id,
        prompt,
        answer,
        explanation,
        now
      );

      if (data.chunkId) {
        const chunk = this.one(
          'SELECT * FROM document_chunks WHERE id = ? AND owner_id = ?',
          data.chunkId,
          userId
        );
        if (!chunk) {
          throw new AppError('Chunk di evidenza non trovato.', 404, 'NOT_FOUND');
        }
        this.run(
          `INSERT INTO knowledge_evidence (id, owner_id, knowledge_item_id, document_id, chunk_id, page_number, quote_text, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1.0, ?)`,
          uuid(),
          userId,
          id,
          chunk.document_id,
          chunk.id,
          chunk.page_start,
          text(data.quoteText || chunk.content_text.slice(0, 200), 'quoteText', 1000),
          now
        );
      }
    });

    return this.one('SELECT * FROM knowledge_items WHERE id = ?', id);
  }

  updateKnowledgeItemV1(userId, itemId, data) {
    const item = this.one(
      'SELECT * FROM knowledge_items WHERE id = ? AND owner_id = ?',
      itemId,
      userId
    );
    if (!item) {
      throw new AppError('Nozione non trovata.', 404, 'NOT_FOUND');
    }
    const expectedRevision = Number(data.expectedRevision);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== item.current_revision) {
      throw new AppError(
        `Conflitto di revisione: attesa ${expectedRevision}, attuale ${item.current_revision}.`,
        409,
        'CONFLICT'
      );
    }

    const prompt = data.prompt !== undefined ? text(data.prompt, 'prompt', 4000, true) : item.prompt;
    const answer = data.answer !== undefined ? text(data.answer, 'answer', 4000, true) : item.answer;
    const explanation =
      data.explanation !== undefined
        ? text(data.explanation, 'explanation', 4000)
        : item.brief_explanation;

    const contentChanged = prompt !== item.prompt || answer !== item.answer;
    const nextRevision = contentChanged ? item.current_revision + 1 : item.current_revision;
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `UPDATE knowledge_items
         SET prompt = ?, answer = ?, brief_explanation = ?, current_revision = ?, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        prompt,
        answer,
        explanation,
        nextRevision,
        now,
        itemId,
        userId
      );

      if (contentChanged) {
        this.run(
          `INSERT INTO knowledge_revisions (id, owner_id, knowledge_item_id, revision, prompt, answer, brief_explanation, changed_by, change_reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'user', ?, ?)`,
          uuid(),
          userId,
          itemId,
          nextRevision,
          prompt,
          answer,
          explanation,
          data.changeReason || 'content_update',
          now
        );

        // Reconcile only this item's schedules without mutating historical review_attempts
        const targets = this.all(
          'SELECT id FROM learning_targets WHERE knowledge_item_id = ? AND owner_id = ?',
          itemId,
          userId
        );
        for (const t of targets) {
          this.run(
            `UPDATE review_schedules
             SET knowledge_revision = ?, streak = 0, due_at = ?, due_at_ms = ?, updated_at = ?
             WHERE target_id = ? AND owner_id = ?`,
            nextRevision,
            now,
            Date.now(),
            now,
            t.id,
            userId
          );
        }

        this.emitOutbox('knowledge.revised', 'knowledge_item', itemId, userId, {
          knowledgeItemId: itemId,
          newRevision: nextRevision
        });
      }
    });

    return this.one('SELECT * FROM knowledge_items WHERE id = ?', itemId);
  }

  confirmKnowledgeItemV1(userId, itemId, data = {}) {
    const item = this.one(
      'SELECT * FROM knowledge_items WHERE id = ? AND owner_id = ?',
      itemId,
      userId
    );
    if (!item) {
      throw new AppError('Nozione non trovata.', 404, 'NOT_FOUND');
    }
    if (
      data.expectedRevision !== undefined &&
      Number(data.expectedRevision) !== item.current_revision
    ) {
      throw new AppError('Revisione obsoleta.', 409, 'CONFLICT');
    }
    const now = nowIso();
    return this.transaction(() => {
      this.run(
        `UPDATE knowledge_items SET state = 'confirmed', updated_at = ? WHERE id = ? AND owner_id = ?`,
        now,
        itemId,
        userId
      );
      const target = this._ensureLearningTarget(userId, itemId, 'forward', item.current_revision);
      this.emitOutbox('knowledge.confirmed', 'knowledge_item', itemId, userId, {
        knowledgeItemId: itemId,
        defaultTargetId: target.id
      });
      return {
        item: this.one('SELECT * FROM knowledge_items WHERE id = ?', itemId),
        defaultTarget: target
      };
    });
  }

  _ensureLearningTarget(userId, itemId, promptMode, knowledgeRevision) {
    let target = this.one(
      'SELECT * FROM learning_targets WHERE knowledge_item_id = ? AND prompt_mode = ? AND owner_id = ?',
      itemId,
      promptMode,
      userId
    );
    const now = nowIso();
    if (!target) {
      const targetId = uuid();
      this.run(
        `INSERT INTO learning_targets (id, owner_id, knowledge_item_id, prompt_mode, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        targetId,
        userId,
        itemId,
        promptMode,
        now,
        now
      );
      target = this.one('SELECT * FROM learning_targets WHERE id = ?', targetId);
    }
    const prefs = this.one('SELECT * FROM user_preferences WHERE user_id = ?', userId);
    this.run(
      `INSERT OR IGNORE INTO review_schedules
       (target_id, owner_id, knowledge_revision, algorithm_version, due_at, due_at_ms, streak, repetitions, lapses, state_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      target.id,
      userId,
      knowledgeRevision,
      prefs?.preferred_srs_algorithm || 'simple-v1',
      now,
      Date.now(),
      JSON.stringify({ algorithm: prefs?.preferred_srs_algorithm || 'simple-v1', initializedAt: now }),
      now
    );
    return target;
  }

  createLearningTargetV1(userId, itemId, data = {}) {
    const item = this.one(
      'SELECT * FROM knowledge_items WHERE id = ? AND owner_id = ?',
      itemId,
      userId
    );
    if (!item) {
      throw new AppError('Nozione non trovata.', 404, 'NOT_FOUND');
    }
    if (item.state !== 'confirmed') {
      throw new AppError(
        'Solo una nozione confermata dall’utente può diventare un learning_target attivo.',
        409,
        'CONFLICT'
      );
    }
    const promptMode = data.promptMode || 'forward';
    if (!['forward', 'reverse', 'explain', 'apply', 'cloze'].includes(promptMode)) {
      throw new AppError('promptMode non valido.', 422, 'VALIDATION_ERROR');
    }
    return this._ensureLearningTarget(userId, itemId, promptMode, item.current_revision);
  }

  getKnowledgeEvidenceV1(userId, itemId) {
    const item = this.one(
      'SELECT * FROM knowledge_items WHERE id = ? AND owner_id = ?',
      itemId,
      userId
    );
    if (!item) {
      throw new AppError('Nozione non trovata.', 404, 'NOT_FOUND');
    }
    return {
      items: this.all(
        `SELECT ke.*, dc.heading, dc.content_text, sd.title AS document_title
         FROM knowledge_evidence ke
         JOIN document_chunks dc ON dc.id = ke.chunk_id
         JOIN source_documents sd ON sd.id = ke.document_id
         WHERE ke.knowledge_item_id = ? AND ke.owner_id = ?`,
        itemId,
        userId
      )
    };
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 3: PALACES, LOCI & MEDIA/SPATIAL ENGINE
  // ===========================================================================

  listPalacesV1(userId) {
    this.ensureAppUser(userId);
    return {
      items: this.all('SELECT * FROM palaces WHERE owner_id = ? ORDER BY updated_at DESC', userId)
    };
  }

  createPalaceV1(userId, data) {
    this.ensureAppUser(userId);
    const title = text(data.title, 'title', 120, true);
    const description = text(data.description ?? '', 'description', 1000);
    const environmentKind = data.environmentKind || 'room';
    if (!['room', 'castle', 'streetview', 'photo_palace', 'scan_3d'].includes(environmentKind)) {
      throw new AppError('environmentKind non valido.', 422, 'VALIDATION_ERROR');
    }
    const sceneVersion = text(data.sceneVersion || 'loco-room-v1', 'sceneVersion', 80, true);
    const palaceId = uuid();
    const sceneVersionId = uuid();
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `INSERT INTO palaces (id, owner_id, project_id, title, description, environment_kind, scene_version, status, revision, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', 1, ?, ?)`,
        palaceId,
        userId,
        data.projectId || null,
        title,
        description,
        environmentKind,
        sceneVersion,
        now,
        now
      );
      this.run(
        `INSERT INTO palace_scene_versions (id, palace_id, owner_id, version_number, scene_code, scene_kind, coordinate_frame_id, bounds_json, published, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, '{}', 1, ?)`,
        sceneVersionId,
        palaceId,
        userId,
        sceneVersion,
        environmentKind === 'photo_palace' ? 'photo_2d' : environmentKind === 'castle' ? 'castle_3d' : 'room_3d',
        `frame-${sceneVersion}`,
        now
      );
    });

    return this.getPalaceV1(userId, palaceId);
  }

  getPalaceV1(userId, palaceId) {
    const palace = this.one(
      'SELECT * FROM palaces WHERE id = ? AND owner_id = ?',
      palaceId,
      userId
    );
    if (!palace) {
      throw new AppError('Palazzo non trovato.', 404, 'NOT_FOUND');
    }
    const sceneVersions = this.all(
      'SELECT * FROM palace_scene_versions WHERE palace_id = ? AND owner_id = ? ORDER BY version_number ASC',
      palaceId,
      userId
    );
    return { ...palace, sceneVersions };
  }

  updatePalaceV1(userId, palaceId, data) {
    const current = this.getPalaceV1(userId, palaceId);
    const title = data.title !== undefined ? text(data.title, 'title', 120, true) : current.title;
    const description =
      data.description !== undefined ? text(data.description, 'description', 1000) : current.description;
    const sceneVersion =
      data.sceneVersion !== undefined
        ? text(data.sceneVersion, 'sceneVersion', 80, true)
        : current.scene_version;
    const now = nowIso();

    this.transaction(() => {
      if (sceneVersion !== current.scene_version) {
        const maxVer =
          this.one(
            'SELECT COALESCE(MAX(version_number), 0) AS v FROM palace_scene_versions WHERE palace_id = ?',
            palaceId
          )?.v || 1;
        this.run(
          `INSERT OR IGNORE INTO palace_scene_versions (id, palace_id, owner_id, version_number, scene_code, scene_kind, coordinate_frame_id, bounds_json, published, created_at)
           VALUES (?, ?, ?, ?, ?, 'room_3d', ?, '{}', 1, ?)`,
          uuid(),
          palaceId,
          userId,
          maxVer + 1,
          sceneVersion,
          `frame-${sceneVersion}`,
          now
        );
      }
      this.run(
        `UPDATE palaces SET title = ?, description = ?, scene_version = ?, revision = revision + 1, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        title,
        description,
        sceneVersion,
        now,
        palaceId,
        userId
      );
    });
    return this.getPalaceV1(userId, palaceId);
  }

  listPalaceLociV1(userId, palaceId) {
    this.getPalaceV1(userId, palaceId);
    const rows = this.all(
      'SELECT * FROM palace_loci WHERE palace_id = ? AND owner_id = ? ORDER BY ordinal ASC',
      palaceId,
      userId
    );
    return {
      items: rows.map((r) => ({
        ...r,
        anchor: r.anchor_json ? JSON.parse(r.anchor_json) : null,
        placements: this.all(
          'SELECT * FROM locus_placements WHERE locus_id = ? AND owner_id = ? ORDER BY ordinal ASC',
          r.id,
          userId
        )
      }))
    };
  }

  createPalaceLocusV1(userId, palaceId, data) {
    const palace = this.getPalaceV1(userId, palaceId);
    const label = text(data.label, 'label', 120, true);
    const ordinal =
      data.ordinal !== undefined
        ? Number(data.ordinal)
        : (this.one(
            'SELECT COALESCE(MAX(ordinal), -1) + 1 AS next_ord FROM palace_loci WHERE palace_id = ?',
            palaceId
          )?.next_ord ?? 0);

    const anchor = data.anchor ?? null;
    if (anchor && anchor.scene && anchor.scene !== palace.scene_version) {
      throw new AppError(
        `SceneVersion dell’anchor (${anchor.scene}) non corrisponde alla scena del palazzo (${palace.scene_version}).`,
        409,
        'CONFLICT'
      );
    }

    const locusId = uuid();
    const now = nowIso();
    const sceneVersionRow = this.one(
      'SELECT * FROM palace_scene_versions WHERE palace_id = ? AND scene_code = ?',
      palaceId,
      palace.scene_version
    );

    this.transaction(() => {
      this.run(
        `INSERT INTO palace_loci (id, owner_id, palace_id, ordinal, label, scene_version, anchor_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        locusId,
        userId,
        palaceId,
        ordinal,
        label,
        palace.scene_version,
        anchor ? JSON.stringify(anchor) : null,
        now,
        now
      );

      if (anchor && sceneVersionRow) {
        this.run(
          `INSERT INTO locus_anchors (id, locus_id, palace_id, owner_id, scene_version_id, coordinate_frame_id, anchor_kind, point_json, normal_json, camera_pose_json, surface_label, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          uuid(),
          locusId,
          palaceId,
          userId,
          sceneVersionRow.id,
          sceneVersionRow.coordinate_frame_id,
          anchor.anchorKind || 'surface_3d',
          JSON.stringify(anchor.point || { x: 0, y: 0, z: 0 }),
          anchor.normal ? JSON.stringify(anchor.normal) : null,
          anchor.camera ? JSON.stringify({ position: anchor.camera, yaw: anchor.yaw ?? 0, pitch: anchor.pitch ?? 0 }) : null,
          anchor.surface || '',
          now
        );
      }
    });

    const saved = this.one('SELECT * FROM palace_loci WHERE id = ?', locusId);
    return { ...saved, anchor: saved.anchor_json ? JSON.parse(saved.anchor_json) : null };
  }

  updatePalaceLocusV1(userId, locusId, data) {
    const locus = this.one(
      'SELECT * FROM palace_loci WHERE id = ? AND owner_id = ?',
      locusId,
      userId
    );
    if (!locus) {
      throw new AppError('Locus non trovato.', 404, 'NOT_FOUND');
    }
    const palace = this.getPalaceV1(userId, locus.palace_id);
    const label = data.label !== undefined ? text(data.label, 'label', 120, true) : locus.label;
    let anchorJson = locus.anchor_json;
    if (data.anchor !== undefined) {
      if (data.anchor && data.anchor.scene && data.anchor.scene !== palace.scene_version) {
        throw new AppError(
          `SceneVersion dell’anchor (${data.anchor.scene}) incompatibile con la versione scena del palazzo (${palace.scene_version}).`,
          409,
          'CONFLICT'
        );
      }
      anchorJson = data.anchor ? JSON.stringify(data.anchor) : null;
    }
    this.run(
      `UPDATE palace_loci SET label = ?, anchor_json = ?, updated_at = ? WHERE id = ? AND owner_id = ?`,
      label,
      anchorJson,
      nowIso(),
      locusId,
      userId
    );
    const updated = this.one('SELECT * FROM palace_loci WHERE id = ?', locusId);
    return { ...updated, anchor: updated.anchor_json ? JSON.parse(updated.anchor_json) : null };
  }

  reorderPalaceLociV1(userId, palaceId, data) {
    const palace = this.getPalaceV1(userId, palaceId);
    if (
      data.expectedRevision !== undefined &&
      Number(data.expectedRevision) !== palace.revision
    ) {
      throw new AppError('Revisione palazzo obsoleta.', 409, 'CONFLICT');
    }
    const orderedIds = data.orderedIds;
    const currentLoci = this.all(
      'SELECT id FROM palace_loci WHERE palace_id = ? AND owner_id = ? ORDER BY ordinal ASC',
      palaceId,
      userId
    );
    if (
      !Array.isArray(orderedIds) ||
      orderedIds.length !== currentLoci.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !currentLoci.some((l) => l.id === id))
    ) {
      throw new AppError('Ordine dei loci non valido.', 422, 'VALIDATION_ERROR');
    }
    this.transaction(() => {
      this.run('UPDATE palace_loci SET ordinal = -ordinal - 1 WHERE palace_id = ?', palaceId);
      orderedIds.forEach((id, idx) => {
        this.run(
          'UPDATE palace_loci SET ordinal = ?, updated_at = ? WHERE id = ? AND palace_id = ?',
          idx,
          nowIso(),
          id,
          palaceId
        );
      });
      this.run('UPDATE palaces SET revision = revision + 1, updated_at = ? WHERE id = ?', nowIso(), palaceId);
    });
    return this.listPalaceLociV1(userId, palaceId);
  }

  createLocusPlacementV1(userId, locusId, data) {
    const locus = this.one(
      'SELECT * FROM palace_loci WHERE id = ? AND owner_id = ?',
      locusId,
      userId
    );
    if (!locus) {
      throw new AppError('Locus non trovato.', 404, 'NOT_FOUND');
    }
    const sceneVer = this.one(
      'SELECT * FROM palace_scene_versions WHERE palace_id = ? AND scene_code = ?',
      locus.palace_id,
      locus.scene_version
    );
    const placementKind = data.placementKind || 'glb_model';
    if (!['billboard_2d', 'video_plane', 'glb_model', 'spatial_marker'].includes(placementKind)) {
      throw new AppError('placementKind non valido.', 422, 'VALIDATION_ERROR');
    }
    const id = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO locus_placements
       (id, locus_id, palace_id, owner_id, scene_version_id, association_id, asset_id, variant_id, placement_kind, position_json, rotation_json, scale_json, animation_clip, playback_mode, ordinal, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      locusId,
      locus.palace_id,
      userId,
      sceneVer.id,
      data.associationId || null,
      data.assetId || null,
      data.variantId || null,
      placementKind,
      JSON.stringify(data.position || { x: 0, y: 0, z: 0 }),
      JSON.stringify(data.rotation || { x: 0, y: 0, z: 0 }),
      JSON.stringify(data.scale || { x: 1, y: 1, z: 1 }),
      data.animationClip || null,
      data.playbackMode || 'static',
      Number(data.ordinal ?? 0),
      now
    );
    return this.one('SELECT * FROM locus_placements WHERE id = ?', id);
  }

  createMnemonicV1(userId, targetId, data) {
    const target = this.one(
      'SELECT * FROM learning_targets WHERE id = ? AND owner_id = ?',
      targetId,
      userId
    );
    if (!target) {
      throw new AppError('Learning target non trovato.', 404, 'NOT_FOUND');
    }
    if (data.locusId) {
      const locus = this.one(
        'SELECT * FROM palace_loci WHERE id = ? AND owner_id = ?',
        data.locusId,
        userId
      );
      if (!locus) {
        throw new AppError('Locus non trovato o non appartenente all’utente.', 404, 'NOT_FOUND');
      }
    }
    const technique = data.technique || 'loci';
    if (
      !['loci', 'link_story', 'major', 'pao', 'peg', 'acrostic', 'visual_metaphor'].includes(
        technique
      )
    ) {
      throw new AppError('Tecnica mnemonica non valida.', 422, 'VALIDATION_ERROR');
    }
    const associationText = text(data.associationText, 'associationText', 4000, true);
    const mediaMode = data.mediaMode || 'text';
    const origin = data.origin === 'ai' ? 'ai' : 'user';
    const state = origin === 'ai' ? 'proposed' : 'confirmed';
    const id = uuid();
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `INSERT INTO mnemonic_associations
         (id, owner_id, learning_target_id, locus_id, technique, association_text, image_asset_id, media_mode, origin, state, current_revision, encoding_duration_ms, revision_count, hint_requests, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?, ?)`,
        id,
        userId,
        targetId,
        data.locusId || null,
        technique,
        associationText,
        data.imageAssetId || null,
        mediaMode,
        origin,
        state,
        data.encodingDurationMs ?? null,
        Number(data.hintRequests ?? 0),
        now,
        now
      );
      this.run(
        `INSERT INTO association_revisions
         (id, association_id, owner_id, revision, technique, association_text, media_mode, primary_asset_id, change_reason, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'initial', ?)`,
        uuid(),
        id,
        userId,
        technique,
        associationText,
        mediaMode,
        data.imageAssetId || null,
        now
      );
    });

    return this.one('SELECT * FROM mnemonic_associations WHERE id = ?', id);
  }

  updateMnemonicV1(userId, mnemonicId, data) {
    const mn = this.one(
      'SELECT * FROM mnemonic_associations WHERE id = ? AND owner_id = ?',
      mnemonicId,
      userId
    );
    if (!mn) {
      throw new AppError('Associazione non trovata.', 404, 'NOT_FOUND');
    }
    const associationText =
      data.associationText !== undefined
        ? text(data.associationText, 'associationText', 4000, true)
        : mn.association_text;
    const mediaMode = data.mediaMode || mn.media_mode;
    const nextRev = mn.current_revision + 1;
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `UPDATE mnemonic_associations
         SET association_text = ?, media_mode = ?, current_revision = ?, revision_count = revision_count + 1, updated_at = ?
         WHERE id = ? AND owner_id = ?`,
        associationText,
        mediaMode,
        nextRev,
        now,
        mnemonicId,
        userId
      );
      this.run(
        `INSERT INTO association_revisions
         (id, association_id, owner_id, revision, technique, association_text, media_mode, primary_asset_id, change_reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        uuid(),
        mnemonicId,
        userId,
        nextRev,
        mn.technique,
        associationText,
        mediaMode,
        data.imageAssetId ?? mn.image_asset_id,
        data.changeReason || 'user_edit',
        now
      );
    });

    return this.one('SELECT * FROM mnemonic_associations WHERE id = ?', mnemonicId);
  }

  confirmMnemonicV1(userId, mnemonicId) {
    const mn = this.one(
      'SELECT * FROM mnemonic_associations WHERE id = ? AND owner_id = ?',
      mnemonicId,
      userId
    );
    if (!mn) {
      throw new AppError('Associazione non trovata.', 404, 'NOT_FOUND');
    }
    const now = nowIso();
    this.run(
      `UPDATE mnemonic_associations SET state = 'confirmed', updated_at = ? WHERE id = ? AND owner_id = ?`,
      now,
      mnemonicId,
      userId
    );
    this.emitOutbox('mnemonic.confirmed', 'mnemonic_association', mnemonicId, userId, {
      mnemonicId,
      learningTargetId: mn.learning_target_id
    });
    return this.one('SELECT * FROM mnemonic_associations WHERE id = ?', mnemonicId);
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 4: LEARNING, BLIND RECALL, SRS & 18 METRICS
  // ===========================================================================

  listDueReviewsV1(userId, filters = {}) {
    this.ensureAppUser(userId);
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 25)));
    const rows = this.all(
      `SELECT
         lt.id AS target_id,
         lt.prompt_mode,
         ki.id AS knowledge_item_id,
         ki.project_id,
         ki.kind,
         ki.prompt,
         ki.current_revision AS knowledge_revision,
         rs.due_at,
         rs.algorithm_version,
         rs.streak,
         rs.repetitions
       FROM review_schedules rs
       JOIN learning_targets lt ON lt.id = rs.target_id
       JOIN knowledge_items ki ON ki.id = lt.knowledge_item_id
       WHERE rs.owner_id = ?
         AND lt.active = 1
         AND ki.state = 'confirmed'
         AND rs.due_at_ms <= ?
       ORDER BY rs.due_at_ms ASC
       LIMIT ?`,
      userId,
      Date.now(),
      limit
    );
    // Notice: `answer` is intentionally omitted before the recall attempt (Blind Recall guardrail!)
    return { items: rows };
  }

  createStudySessionV1(userId, data = {}) {
    this.ensureAppUser(userId);
    const mode = data.mode || 'recall';
    if (!['study', 'recall', 'cram', 'delayed_check'].includes(mode)) {
      throw new AppError('Modalità sessione non valida.', 422, 'VALIDATION_ERROR');
    }
    const id = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO study_sessions (id, owner_id, project_id, palace_id, mode, started_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      userId,
      data.projectId || null,
      data.palaceId || null,
      mode,
      now
    );
    return { sessionId: id, mode, startedAt: now };
  }

  submitReviewAttemptV1(userId, data) {
    this.ensureAppUser(userId);
    const idempotencyKey = text(data.idempotencyKey, 'idempotencyKey', 128, true);

    const existingAttempt = this.one(
      'SELECT * FROM review_attempts WHERE owner_id = ? AND idempotency_key = ?',
      userId,
      idempotencyKey
    );
    if (existingAttempt) {
      const sched = this.one(
        'SELECT * FROM review_schedules WHERE target_id = ? AND owner_id = ?',
        existingAttempt.target_id,
        userId
      );
      return {
        attemptId: existingAttempt.id,
        dueAt: sched?.due_at,
        grade: existingAttempt.scheduler_grade,
        verdict: existingAttempt.verdict,
        revision: existingAttempt.knowledge_revision,
        idempotentReplay: true
      };
    }

    const targetId = text(data.targetId, 'targetId', 64, true);
    const target = this.one(
      `SELECT lt.*, ki.state AS item_state, ki.current_revision AS item_revision, ki.answer AS canonical_answer
       FROM learning_targets lt
       JOIN knowledge_items ki ON ki.id = lt.knowledge_item_id
       WHERE lt.id = ? AND lt.owner_id = ?`,
      targetId,
      userId
    );
    if (!target) {
      throw new AppError('Learning target non trovato.', 404, 'NOT_FOUND');
    }
    if (target.item_state !== 'confirmed') {
      throw new AppError('La nozione non è confermata.', 409, 'CONFLICT');
    }

    const userRating = data.userRating || 'good';
    if (!['again', 'hard', 'good', 'easy'].includes(userRating)) {
      throw new AppError('userRating non valido.', 422, 'VALIDATION_ERROR');
    }
    const hintCount = Math.max(0, Number(data.hintCount ?? 0));
    const viewedAnswerBeforeAttempt = Boolean(data.viewedAnswerBeforeAttempt);
    const responseMs = data.responseMs !== undefined ? Math.max(0, Number(data.responseMs)) : 1800;
    const activeDurationMs =
      data.activeDurationMs !== undefined ? Math.max(0, Number(data.activeDurationMs)) : responseMs;
    const mediaMode = data.mediaMode || 'text';

    const prefs = this.one('SELECT * FROM user_preferences WHERE user_id = ?', userId);
    const prevSched = this.one(
      'SELECT * FROM review_schedules WHERE target_id = ? AND owner_id = ?',
      targetId,
      userId
    );
    const activeAssoc = this.one(
      `SELECT * FROM mnemonic_associations
       WHERE learning_target_id = ? AND owner_id = ? AND state = 'confirmed'
       ORDER BY updated_at DESC LIMIT 1`,
      targetId,
      userId
    );

    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();

    const srsResult = computeNextSchedule({
      nowMs,
      currentKnowledgeRevision: target.item_revision,
      desiredRetention: prefs?.desired_retention ?? 0.9,
      algorithmVersion: prefs?.preferred_srs_algorithm ?? 'simple-v1',
      previousSchedule: prevSched
        ? {
            knowledgeRevision: prevSched.knowledge_revision,
            algorithmVersion: prevSched.algorithm_version,
            dueAtMs: prevSched.due_at_ms,
            lastReviewedAtMs: prevSched.last_reviewed_at_ms,
            streak: prevSched.streak,
            repetitions: prevSched.repetitions,
            lapses: prevSched.lapses,
            stability: prevSched.stability,
            difficulty: prevSched.difficulty,
            stateJson: JSON.parse(prevSched.state_json || '{}')
          }
        : null,
      userRating,
      hintCount,
      viewedAnswerBeforeAttempt
    });

    const recallDelaySeconds =
      data.recallDelaySeconds !== undefined
        ? Math.max(0, Number(data.recallDelaySeconds))
        : srsResult.recallDelaySeconds;

    const attemptId = uuid();
    const newDueIso = new Date(srsResult.schedule.dueAtMs).toISOString();

    return this.transaction(() => {
      this.run(
        `INSERT INTO review_attempts
         (id, owner_id, target_id, study_session_id, knowledge_revision, association_id, association_revision, locus_id, answered_at, response_ms, active_duration_ms, verdict, scheduler_grade, hint_count, viewed_answer_before_attempt, evaluation_mode, confidence, response_text, recall_delay_seconds, media_mode, idempotency_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        attemptId,
        userId,
        targetId,
        data.sessionId || null,
        target.item_revision,
        activeAssoc?.id || null,
        activeAssoc?.current_revision || null,
        activeAssoc?.locus_id || null,
        now,
        responseMs,
        activeDurationMs,
        srsResult.verdict,
        srsResult.effectiveGrade,
        hintCount,
        viewedAnswerBeforeAttempt ? 1 : 0,
        data.evaluationMode || 'self',
        data.confidence ?? null,
        data.responseText ?? null,
        recallDelaySeconds,
        mediaMode,
        idempotencyKey
      );

      this.run(
        `INSERT INTO review_schedules
         (target_id, owner_id, knowledge_revision, algorithm_version, due_at, due_at_ms, last_reviewed_at, last_reviewed_at_ms, streak, repetitions, lapses, stability, difficulty, state_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(target_id) DO UPDATE SET
           knowledge_revision = excluded.knowledge_revision,
           algorithm_version = excluded.algorithm_version,
           due_at = excluded.due_at,
           due_at_ms = excluded.due_at_ms,
           last_reviewed_at = excluded.last_reviewed_at,
           last_reviewed_at_ms = excluded.last_reviewed_at_ms,
           streak = excluded.streak,
           repetitions = excluded.repetitions,
           lapses = excluded.lapses,
           stability = excluded.stability,
           difficulty = excluded.difficulty,
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`,
        targetId,
        userId,
        srsResult.schedule.knowledgeRevision,
        srsResult.schedule.algorithmVersion,
        newDueIso,
        srsResult.schedule.dueAtMs,
        now,
        nowMs,
        srsResult.schedule.streak,
        srsResult.schedule.repetitions,
        srsResult.schedule.lapses,
        srsResult.schedule.stability,
        srsResult.schedule.difficulty,
        JSON.stringify(srsResult.schedule.stateJson),
        now
      );

      this.run(
        `INSERT INTO trial_diagnostics
         (id, owner_id, source_kind, review_attempt_id, learning_target_id, locus_id, skill, stimulus_key, direction, is_correct, is_unassisted, error_category, recall_delay_seconds, delay_bucket, encoding_duration_ms, retrieval_latency_ms, active_duration_ms, hint_count, viewed_answer_before_attempt, association_revision, media_mode, difficulty_level, comparability_group, created_at)
         VALUES (?, ?, 'review_attempt', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'standard', ?)`,
        uuid(),
        userId,
        attemptId,
        targetId,
        activeAssoc?.locus_id || null,
        activeAssoc?.technique === 'major' ? 'major' : activeAssoc?.technique === 'pao' ? 'pao' : activeAssoc?.locus_id ? 'loci' : 'abstract',
        `target:${targetId}`,
        target.prompt_mode,
        srsResult.verdict === 'correct' ? 1 : 0,
        !viewedAnswerBeforeAttempt && hintCount === 0 ? 1 : 0,
        srsResult.verdict === 'correct' ? 'none' : data.errorCategory || 'decoding',
        recallDelaySeconds,
        classifyDelayBucket(recallDelaySeconds),
        activeAssoc?.encoding_duration_ms ?? null,
        responseMs,
        activeDurationMs,
        hintCount,
        viewedAnswerBeforeAttempt ? 1 : 0,
        activeAssoc?.current_revision ?? null,
        mediaMode,
        now
      );

      this.emitOutbox('recall.completed', 'learning_target', targetId, userId, {
        attemptId,
        result: srsResult.verdict,
        newDueAt: newDueIso
      });

      return {
        attemptId,
        dueAt: newDueIso,
        grade: srsResult.effectiveGrade,
        verdict: srsResult.verdict,
        revision: target.item_revision,
        canonicalAnswer: target.canonical_answer
      };
    });
  }

  getTargetHistoryV1(userId, targetId) {
    const target = this.one(
      'SELECT * FROM learning_targets WHERE id = ? AND owner_id = ?',
      targetId,
      userId
    );
    if (!target) {
      throw new AppError('Learning target non trovato.', 404, 'NOT_FOUND');
    }
    return {
      items: this.all(
        `SELECT id, target_id, knowledge_revision, association_id, association_revision, answered_at, response_ms, verdict, scheduler_grade, hint_count, viewed_answer_before_attempt, recall_delay_seconds, media_mode
         FROM review_attempts
         WHERE owner_id = ? AND target_id = ?
         ORDER BY answered_at DESC`,
        userId,
        targetId
      )
    };
  }

  getTargetScheduleV1(userId, targetId) {
    const sched = this.one(
      'SELECT * FROM review_schedules WHERE target_id = ? AND owner_id = ?',
      targetId,
      userId
    );
    if (!sched) {
      throw new AppError('Schedule non trovato.', 404, 'NOT_FOUND');
    }
    return {
      ...sched,
      state: JSON.parse(sched.state_json || '{}')
    };
  }

  _loadDiagnosticTrials(userId, windowDays = 28) {
    const rows = this.all(
      `SELECT * FROM trial_diagnostics WHERE owner_id = ? ORDER BY created_at ASC`,
      userId
    );
    return rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      sourceKind: r.source_kind,
      reviewAttemptId: r.review_attempt_id,
      trainingTrialId: r.training_trial_id,
      learningTargetId: r.learning_target_id,
      palaceId: r.palace_id,
      locusId: r.locus_id,
      skill: r.skill,
      stimulusKey: r.stimulus_key,
      direction: r.direction,
      isCorrect: Boolean(r.is_correct),
      isUnassisted: Boolean(r.is_unassisted),
      errorCategory: r.error_category,
      confusedWithKey: r.confused_with_key,
      expectedLocusOrdinal: r.expected_locus_ordinal,
      actualLocusOrdinal: r.actual_locus_ordinal,
      recallDelaySeconds: r.recall_delay_seconds,
      delayBucket: r.delay_bucket,
      encodingDurationMs: r.encoding_duration_ms,
      retrievalLatencyMs: r.retrieval_latency_ms,
      activeDurationMs: r.active_duration_ms,
      hintCount: r.hint_count,
      viewedAnswerBeforeAttempt: Boolean(r.viewed_answer_before_attempt),
      associationRevision: r.association_revision,
      mediaMode: r.media_mode,
      difficultyLevel: r.difficulty_level,
      comparabilityGroup: r.comparability_group,
      createdAt: r.created_at
    }));
  }

  getLearningProfileV1(userId, windowDays = 28) {
    this.ensureAppUser(userId);
    const trials = this._loadDiagnosticTrials(userId, windowDays);
    const stabilities = this.all(
      'SELECT stability FROM review_schedules WHERE owner_id = ? AND stability IS NOT NULL',
      userId
    ).map((r) => Number(r.stability));
    const exposureMs =
      this.one(
        'SELECT COALESCE(SUM(active_duration_ms), 0) AS total FROM learning_exposures WHERE owner_id = ?',
        userId
      )?.total || 0;

    const allMetrics = computeAllMemoryMetrics({
      trials,
      scheduleStabilitiesDays: stabilities,
      activeExposureMs: exposureMs,
      windowDays
    });
    const itemStats = computeSkillItemStats(trials);
    const locusConfusions = computeLocusConfusionStats(trials);
    const interventions = generateAdaptiveInterventions({ ownerId: userId, trials });

    const confirmedCount =
      this.one(
        `SELECT COUNT(*) AS n FROM knowledge_items WHERE owner_id = ? AND state = 'confirmed'`,
        userId
      )?.n || 0;
    const attemptedTargetsCount =
      this.one(
        `SELECT COUNT(DISTINCT target_id) AS n FROM review_attempts WHERE owner_id = ?`,
        userId
      )?.n || 0;
    const coverage = confirmedCount > 0 ? Number((attemptedTargetsCount / confirmedCount).toFixed(4)) : 0;

    const personalBests = this.all(
      `SELECT cb.*, cd.title AS challenge_title
       FROM challenge_bests cb
       JOIN challenge_versions cv ON cv.id = cb.challenge_version_id
       JOIN challenge_definitions cd ON cd.id = cv.challenge_id
       WHERE cb.user_id = ?
       ORDER BY cb.achieved_at DESC`,
      userId
    ).map((b) => ({
      challengeVersionId: b.challenge_version_id,
      challengeTitle: b.challenge_title,
      score: b.score,
      accuracy: b.accuracy,
      elapsedMs: b.elapsed_ms,
      rank: 1,
      achievedAt: b.achieved_at
    }));

    const metricList = Object.values(allMetrics);

    return {
      userId,
      windowDays,
      formulaVersion: FORMULA_VERSION,
      coverage,
      sampleSize: trials.length,
      computedAt: nowIso(),
      metrics: allMetrics,
      dashboards: {
        overview: metricList.filter((m) => m.dashboardSection === 'overview'),
        memorySkills: metricList.filter((m) => m.dashboardSection === 'memory_skills'),
        techniqueMastery: {
          metrics: metricList.filter((m) => m.dashboardSection === 'technique_mastery'),
          itemStats
        },
        learningAnalytics: {
          metrics: metricList.filter((m) => m.dashboardSection === 'learning_analytics'),
          locusConfusions,
          interventions
        },
        recordsRankings: {
          personalBests
        }
      }
    };
  }

  getSkillProfilesV1(userId, skillFilter, windowDays = 28) {
    const profile = this.getLearningProfileV1(userId, windowDays);
    const itemStats = skillFilter
      ? profile.dashboards.techniqueMastery.itemStats.filter((s) => s.skill === skillFilter)
      : profile.dashboards.techniqueMastery.itemStats;
    const snapshots = this.all(
      `SELECT * FROM skill_profile_snapshots WHERE owner_id = ? ${
        skillFilter ? 'AND skill = ?' : ''
      } ORDER BY computed_at DESC LIMIT 20`,
      ...(skillFilter ? [userId, skillFilter] : [userId])
    );
    return {
      windowDays,
      formulaVersion: FORMULA_VERSION,
      sampleSize: profile.sampleSize,
      snapshots,
      itemStats,
      locusConfusions: profile.dashboards.learningAnalytics.locusConfusions,
      interventions: profile.dashboards.learningAnalytics.interventions
    };
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 5: TRAINING & USER INTELLIGENCE
  // ===========================================================================

  listTrainingExercisesV1(skillFilter) {
    const rows = skillFilter
      ? this.all('SELECT * FROM training_exercises WHERE active = 1 AND skill = ? ORDER BY slug ASC', skillFilter)
      : this.all('SELECT * FROM training_exercises WHERE active = 1 ORDER BY slug ASC');
    return {
      items: rows.map((r) => ({
        ...r,
        config: JSON.parse(r.config_json || '{}')
      }))
    };
  }

  startTrainingSessionV1(userId, data) {
    this.ensureAppUser(userId);
    const exerciseId = text(data.exerciseId, 'exerciseId', 80, true);
    const exercise =
      this.one('SELECT * FROM training_exercises WHERE id = ? OR slug = ?', exerciseId, exerciseId);
    if (!exercise) {
      throw new AppError('Esercizio di training non trovato.', 404, 'NOT_FOUND');
    }
    const direction = data.options?.direction || exercise.default_direction || 'forward';
    const condition = data.options?.testCondition || 'immediate';
    const itemCount = Math.min(50, Math.max(1, Number(data.options?.itemCount || 6)));
    const seed = data.options?.seed || `seed-${Date.now()}`;
    const items = [];
    for (let i = 0; i < itemCount; i += 1) {
      const code = String((i * 17 + 12) % 100).padStart(2, '0');
      items.push({
        ordinal: i,
        stimulusKey: `${exercise.skill}:${code}`,
        direction,
        prompt: `${exercise.title} #${i + 1} (${code})`
      });
    }

    const sessionId = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO training_sessions
       (id, owner_id, exercise_id, seed, direction, test_condition, difficulty_level, stimuli_snapshot_json, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'started', ?)`,
      sessionId,
      userId,
      exercise.id,
      seed,
      direction,
      condition,
      Number(data.options?.difficultyLevel || 1),
      JSON.stringify(items),
      now
    );
    return { sessionId, exerciseId: exercise.id, skill: exercise.skill, direction, items };
  }

  submitTrainingTrialV1(userId, sessionId, data) {
    const session = this.one(
      `SELECT ts.*, te.skill
       FROM training_sessions ts
       JOIN training_exercises te ON te.id = ts.exercise_id
       WHERE ts.id = ? AND ts.owner_id = ?`,
      sessionId,
      userId
    );
    if (!session) {
      throw new AppError('Sessione di training non trovata.', 404, 'NOT_FOUND');
    }
    if (session.status !== 'started') {
      throw new AppError('Sessione già conclusa.', 409, 'CONFLICT');
    }

    const ordinal = Number(data.ordinal);
    if (!Number.isInteger(ordinal) || ordinal < 0) {
      throw new AppError('ordinal non valido.', 422, 'VALIDATION_ERROR');
    }
    const responseMs = Math.max(0, Number(data.responseMs ?? 1500));
    const encodingMs = data.encodingMs !== undefined ? Math.max(0, Number(data.encodingMs)) : null;
    const hints = Math.max(0, Number(data.hints ?? 0));
    const isCorrect = Boolean(data.correct ?? true);
    const errorCategory = isCorrect ? 'none' : data.errorCategory || 'decoding';
    const stimulusKey = text(data.stimulusKey || `${session.skill}:${ordinal}`, 'stimulusKey', 120, true);
    const direction = text(data.direction || session.direction || 'forward', 'direction', 64, true);

    const trialId = uuid();
    const now = nowIso();

    this.transaction(() => {
      this.run(
        `INSERT OR REPLACE INTO training_trials
         (id, owner_id, session_id, ordinal, stimulus_key, direction, stimulus_json, response_json, is_correct, response_ms, encoding_ms, hints_used, error_category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        trialId,
        userId,
        sessionId,
        ordinal,
        stimulusKey,
        direction,
        JSON.stringify(data.stimulus || {}),
        JSON.stringify({ value: data.response ?? '' }),
        isCorrect ? 1 : 0,
        responseMs,
        encodingMs,
        hints,
        errorCategory,
        now
      );

      this.run(
        `INSERT INTO trial_diagnostics
         (id, owner_id, source_kind, training_trial_id, palace_id, locus_id, skill, stimulus_key, direction, is_correct, is_unassisted, error_category, confused_with_key, expected_locus_ordinal, actual_locus_ordinal, recall_delay_seconds, delay_bucket, encoding_duration_ms, retrieval_latency_ms, active_duration_ms, hint_count, viewed_answer_before_attempt, media_mode, difficulty_level, comparability_group, created_at)
         VALUES (?, ?, 'training_trial', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'text', ?, 'standard', ?)`,
        uuid(),
        userId,
        trialId,
        data.palaceId || null,
        data.locusId || null,
        session.skill,
        stimulusKey,
        direction,
        isCorrect ? 1 : 0,
        isCorrect && hints === 0 ? 1 : 0,
        errorCategory,
        data.confusedWithKey || null,
        data.expectedLocusOrdinal ?? null,
        data.actualLocusOrdinal ?? null,
        Number(data.recallDelaySeconds ?? 0),
        classifyDelayBucket(Number(data.recallDelaySeconds ?? 0)),
        encodingMs,
        responseMs,
        responseMs + (encodingMs || 0),
        hints,
        session.difficulty_level,
        now
      );
    });

    return {
      trialId,
      ordinal,
      correct: isCorrect,
      responseMs,
      errorCategory
    };
  }

  finishTrainingSessionV1(userId, sessionId, idempotencyKey) {
    const session = this.one(
      `SELECT ts.*, te.skill
       FROM training_sessions ts
       JOIN training_exercises te ON te.id = ts.exercise_id
       WHERE ts.id = ? AND ts.owner_id = ?`,
      sessionId,
      userId
    );
    if (!session) {
      throw new AppError('Sessione di training non trovata.', 404, 'NOT_FOUND');
    }

    const sessionTrials = this.all(
      'SELECT * FROM training_trials WHERE session_id = ? AND owner_id = ? ORDER BY ordinal ASC',
      sessionId,
      userId
    );
    if (sessionTrials.length === 0) {
      throw new AppError('Nessun trial registrato nella sessione.', 422, 'VALIDATION_ERROR');
    }

    const now = nowIso();
    const totalMs = sessionTrials.reduce(
      (acc, t) => acc + t.response_ms + (t.encoding_ms || 0),
      0
    );

    return this.transaction(() => {
      if (session.status !== 'completed') {
        this.run(
          `UPDATE training_sessions
           SET status = 'completed', finished_at = ?, active_duration_ms = ?, idempotency_key = COALESCE(idempotency_key, ?)
           WHERE id = ? AND owner_id = ?`,
          now,
          totalMs,
          idempotencyKey || `finish-${sessionId}`,
          sessionId,
          userId
        );
      }

      const allDiagTrials = this._loadDiagnosticTrials(userId, 28);
      const skillTrials = allDiagTrials.filter((t) => t.skill === session.skill);
      const metrics = computeAllMemoryMetrics({ trials: skillTrials, computedAt: now });
      const interventions = generateAdaptiveInterventions({
        ownerId: userId,
        trials: allDiagTrials,
        nowIso: now
      });

      const primaryIntervention = interventions[0];
      const snapshotId = uuid();
      this.run(
        `INSERT INTO skill_profile_snapshots
         (id, owner_id, skill, window_days, sample_size, n_valid, n_unassisted, immediate_accuracy, delayed_accuracy, median_encoding_ms, median_retrieval_ms, p90_retrieval_ms, data_confidence, recommendation_code, metric_version, details_json, computed_at)
         VALUES (?, ?, ?, 28, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        snapshotId,
        userId,
        session.skill,
        skillTrials.length,
        skillTrials.length,
        skillTrials.filter((t) => t.isUnassisted).length,
        metrics.immediate_recall_accuracy.rawValue,
        metrics.delayed_recall_accuracy.rawValue,
        metrics.encoding_speed.rawValue,
        metrics.retrieval_speed.rawValue,
        metrics.retrieval_speed.breakdown.p90RetrievalMs ?? null,
        primaryIntervention.confidenceLevel,
        primaryIntervention.recommendedAction,
        FORMULA_VERSION,
        JSON.stringify({ sessionId }),
        now
      );

      for (const intv of interventions) {
        this.run(
          `INSERT INTO learning_interventions
           (id, owner_id, rationale_code, algorithm_version, metric_version, target_scope, target_id, skill, stimulus_key, recommended_action, explanation, evidence_json, sample_size, confidence_level, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?)`,
          intv.id,
          userId,
          intv.rationaleCode,
          intv.algorithmVersion,
          intv.metricVersion,
          intv.targetScope,
          intv.targetId,
          intv.skill,
          intv.stimulusKey,
          intv.recommendedAction,
          intv.explanation,
          JSON.stringify(intv.evidence),
          intv.sampleSize,
          intv.confidenceLevel,
          now
        );
      }

      this.emitOutbox('training.completed', 'training_session', sessionId, userId, {
        sessionId,
        skill: session.skill,
        trialCount: sessionTrials.length
      });

      const sessionCorrect = sessionTrials.filter((t) => t.is_correct && t.hints_used === 0).length;
      return {
        sessionId,
        status: 'completed',
        trialCount: sessionTrials.length,
        sessionAccuracy: Number((sessionCorrect / sessionTrials.length).toFixed(4)),
        activeDurationMs: totalMs,
        skillSampleSize: skillTrials.length,
        dataConfidence: primaryIntervention.confidenceLevel,
        nextSuggestion: primaryIntervention
      };
    });
  }

  listTrainingHistoryV1(userId, skillFilter) {
    this.ensureAppUser(userId);
    const rows = skillFilter
      ? this.all(
          `SELECT ts.*, te.slug AS exercise_slug, te.title AS exercise_title, te.skill
           FROM training_sessions ts
           JOIN training_exercises te ON te.id = ts.exercise_id
           WHERE ts.owner_id = ? AND te.skill = ?
           ORDER BY ts.started_at DESC LIMIT 50`,
          userId,
          skillFilter
        )
      : this.all(
          `SELECT ts.*, te.slug AS exercise_slug, te.title AS exercise_title, te.skill
           FROM training_sessions ts
           JOIN training_exercises te ON te.id = ts.exercise_id
           WHERE ts.owner_id = ?
           ORDER BY ts.started_at DESC LIMIT 50`,
          userId
        );
    return { items: rows };
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 6: CHALLENGES & LEADERBOARDS (ARENA)
  // ===========================================================================

  listChallengesV1(skillFilter) {
    const defs = skillFilter
      ? this.all('SELECT * FROM challenge_definitions WHERE active = 1 AND skill = ? ORDER BY slug ASC', skillFilter)
      : this.all('SELECT * FROM challenge_definitions WHERE active = 1 ORDER BY slug ASC');

    return {
      items: defs.map((d) => ({
        ...d,
        versions: this.all(
          `SELECT id, challenge_id, version_number, rules_json, duration_ms, scorer_type, scorer_version, published_at
           FROM challenge_versions
           WHERE challenge_id = ? AND published_at IS NOT NULL
           ORDER BY version_number DESC`,
          d.id
        ).map((v) => ({ ...v, rules: JSON.parse(v.rules_json || '{}') }))
      }))
    };
  }

  getChallengeV1(challengeId) {
    const d = this.one(
      'SELECT * FROM challenge_definitions WHERE id = ? OR slug = ?',
      challengeId,
      challengeId
    );
    if (!d) {
      throw new AppError('Challenge non trovata.', 404, 'NOT_FOUND');
    }
    const versions = this.all(
      `SELECT id, challenge_id, version_number, rules_json, duration_ms, scorer_type, scorer_version, published_at
       FROM challenge_versions
       WHERE challenge_id = ? AND published_at IS NOT NULL
       ORDER BY version_number DESC`,
      d.id
    ).map((v) => ({ ...v, rules: JSON.parse(v.rules_json || '{}') }));
    return { ...d, versions };
  }

  startChallengeRunV1(userId, versionId, idempotencyKey, isRanked = true) {
    this.ensureAppUser(userId);
    const ver = this.one(
      'SELECT * FROM challenge_versions WHERE id = ? AND published_at IS NOT NULL',
      versionId
    );
    if (!ver) {
      throw new AppError('Versione challenge non trovata o non pubblicata.', 404, 'NOT_FOUND');
    }

    const key = text(idempotencyKey || uuid(), 'idempotencyKey', 128, true);
    const existingByIdempotency = this.one(
      'SELECT * FROM challenge_runs WHERE owner_id = ? AND idempotency_key = ?',
      userId,
      key
    );
    if (existingByIdempotency) {
      return {
        runId: existingByIdempotency.id,
        challengeVersionId: ver.id,
        isRanked: Boolean(existingByIdempotency.is_ranked),
        items: JSON.parse(ver.public_stimuli_json || '[]'),
        deadlineAt: existingByIdempotency.deadline_at,
        idempotentReplay: true
      };
    }

    if (isRanked) {
      const existingRanked = this.one(
        'SELECT * FROM challenge_runs WHERE owner_id = ? AND challenge_version_id = ? AND is_ranked = 1',
        userId,
        ver.id
      );
      if (existingRanked) {
        throw new AppError(
          'Tentativo ranked già effettuato per questa versione della sfida (1 ranked attempt per versione).',
          409,
          'CONFLICT'
        );
      }
    }

    const runId = uuid();
    const nonce = randomBytes(16).toString('hex');
    const startedAtMs = Date.now();
    const deadlineAtMs = startedAtMs + ver.duration_ms;
    const startedAt = new Date(startedAtMs).toISOString();
    const deadlineAt = new Date(deadlineAtMs).toISOString();

    this.run(
      `INSERT INTO challenge_runs
       (id, owner_id, challenge_version_id, is_ranked, status, nonce_hash, started_at, started_at_ms, deadline_at, deadline_at_ms, idempotency_key)
       VALUES (?, ?, ?, ?, 'started', ?, ?, ?, ?, ?, ?)`,
      runId,
      userId,
      ver.id,
      isRanked ? 1 : 0,
      hashNonce(nonce),
      startedAt,
      startedAtMs,
      deadlineAt,
      deadlineAtMs,
      key
    );

    // Never return `private_answer_key_json` or `private_seed` to the client!
    return {
      runId,
      challengeVersionId: ver.id,
      isRanked: Boolean(isRanked),
      nonce,
      items: JSON.parse(ver.public_stimuli_json || '[]'),
      deadlineAt
    };
  }

  submitChallengeRunV1(userId, runId, data) {
    const run = this.one(
      'SELECT * FROM challenge_runs WHERE id = ? AND owner_id = ?',
      runId,
      userId
    );
    if (!run) {
      throw new AppError('Challenge run non trovata.', 404, 'NOT_FOUND');
    }

    // Idempotent replay on duplicate submit of the same run
    if (run.status === 'verified' || run.status === 'rejected' || run.status === 'submitted') {
      const existingResult = this.one('SELECT * FROM challenge_results WHERE run_id = ?', runId);
      return {
        status: run.status,
        result: existingResult ? this._sanitizeChallengeResult(existingResult) : null,
        idempotentReplay: true
      };
    }

    const ver = this.one('SELECT * FROM challenge_versions WHERE id = ?', run.challenge_version_id);
    const answerKey = JSON.parse(ver.private_answer_key_json || '[]');
    const submittedAnswers = Array.isArray(data.answers) ? data.answers : [];
    const submittedNonce = String(data.nonce || '');

    // Simulated elapsed override for deterministic tests if `elapsedMs` is explicitly allowed in test mode,
    // while strictly ignoring any client-supplied `score`, `correctCount`, or `eligible`!
    const submittedAtMs =
      typeof data.simulatedElapsedMs === 'number'
        ? run.started_at_ms + data.simulatedElapsedMs
        : Math.max(run.started_at_ms + 800, Date.now());
    const submittedAt = new Date(submittedAtMs).toISOString();

    const scored = scoreChallengeSubmission({
      scorerType: ver.scorer_type,
      scorerVersion: ver.scorer_version,
      durationMs: ver.duration_ms,
      startedAtMs: run.started_at_ms,
      submittedAtMs,
      expectedNonceHash: run.nonce_hash,
      submittedNonce,
      answerKey,
      submittedAnswers
    });

    const resultId = uuid();

    return this.transaction(() => {
      for (const item of scored.itemFlags) {
        this.run(
          `INSERT OR IGNORE INTO challenge_answers
           (id, run_id, owner_id, ordinal, submitted_value, is_correct, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          uuid(),
          runId,
          userId,
          item.ordinal,
          item.submittedValue,
          item.isCorrect ? 1 : 0,
          submittedAt
        );
      }

      this.run(
        `UPDATE challenge_runs
         SET status = ?, submitted_at = ?, elapsed_ms = ?, risk_flags_json = ?
         WHERE id = ? AND owner_id = ?`,
        scored.status,
        submittedAt,
        scored.elapsedMs,
        JSON.stringify(scored.riskFlags),
        runId,
        userId
      );

      this.run(
        `INSERT INTO challenge_verifications
         (id, run_id, verifier_version, nonce_verified, deadline_verified, payload_valid, anomaly_score, rejection_reason, verified_at)
         VALUES (?, ?, 'verifier-v2', ?, ?, ?, ?, ?, ?)`,
        uuid(),
        runId,
        scored.riskFlags.includes('nonce_mismatch') ? 0 : 1,
        scored.riskFlags.includes('deadline_exceeded') ? 0 : 1,
        scored.riskFlags.includes('invalid_or_duplicate_ordinal') ? 0 : 1,
        scored.riskFlags.length > 0 ? 1.0 : 0.0,
        scored.riskFlags.join(',') || null,
        submittedAt
      );

      this.run(
        `INSERT INTO challenge_results
         (id, run_id, owner_id, challenge_version_id, score, correct_count, total_count, accuracy, elapsed_ms, eligible, scorer_version, verified_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        resultId,
        runId,
        userId,
        ver.id,
        scored.score,
        scored.correctCount,
        scored.totalCount,
        scored.accuracy,
        scored.elapsedMs,
        scored.eligible ? 1 : 0,
        scored.scorerVersion,
        submittedAt
      );

      if (scored.eligible && run.is_ranked) {
        const currentBest = this.one(
          'SELECT * FROM challenge_bests WHERE challenge_version_id = ? AND user_id = ?',
          ver.id,
          userId
        );
        const shouldUpsert =
          !currentBest ||
          isBetterChallengeScore(
            { score: scored.score, accuracy: scored.accuracy, elapsedMs: scored.elapsedMs },
            {
              score: currentBest.score,
              accuracy: currentBest.accuracy,
              elapsedMs: currentBest.elapsed_ms
            }
          );

        if (shouldUpsert) {
          this.run(
            `INSERT INTO challenge_bests
             (challenge_version_id, user_id, best_result_id, score, correct_count, accuracy, elapsed_ms, achieved_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(challenge_version_id, user_id) DO UPDATE SET
               best_result_id = excluded.best_result_id,
               score = excluded.score,
               correct_count = excluded.correct_count,
               accuracy = excluded.accuracy,
               elapsed_ms = excluded.elapsed_ms,
               achieved_at = excluded.achieved_at,
               updated_at = excluded.updated_at`,
            ver.id,
            userId,
            resultId,
            scored.score,
            scored.correctCount,
            scored.accuracy,
            scored.elapsedMs,
            submittedAt,
            submittedAt
          );
        }
      }

      this.emitOutbox('challenge.run_submitted', 'challenge_run', runId, userId, {
        runId,
        challengeVersionId: ver.id
      });
      this.emitOutbox('challenge.result_verified', 'challenge_result', resultId, userId, {
        runId,
        resultId,
        challengeVersionId: ver.id,
        eligible: scored.eligible
      });

      const savedResult = this.one('SELECT * FROM challenge_results WHERE id = ?', resultId);
      return {
        status: scored.status,
        result: this._sanitizeChallengeResult(savedResult)
      };
    });
  }

  _sanitizeChallengeResult(row) {
    return {
      id: row.id,
      runId: row.run_id,
      challengeVersionId: row.challenge_version_id,
      score: row.score,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      accuracy: row.accuracy,
      elapsedMs: row.elapsed_ms,
      eligible: Boolean(row.eligible),
      scorerVersion: row.scorer_version,
      verifiedAt: row.verified_at
    };
  }

  getChallengeRunResultV1(userId, runId) {
    const run = this.one(
      'SELECT * FROM challenge_runs WHERE id = ? AND owner_id = ?',
      runId,
      userId
    );
    if (!run) {
      throw new AppError('Run non trovata.', 404, 'NOT_FOUND');
    }
    const res = this.one('SELECT * FROM challenge_results WHERE run_id = ?', runId);
    return {
      runId: run.id,
      status: run.status,
      result: res ? this._sanitizeChallengeResult(res) : null
    };
  }

  getChallengeLeaderboardV1(viewerId, versionId, scope = 'global', limit = 50) {
    this.ensureAppUser(viewerId);
    const ver = this.one('SELECT * FROM challenge_versions WHERE id = ?', versionId);
    if (!ver) {
      throw new AppError('Versione challenge non trovata.', 404, 'NOT_FOUND');
    }
    if (!['global', 'friends'].includes(scope)) {
      throw new AppError('Scope classifica non valido.', 422, 'VALIDATION_ERROR');
    }

    const rows = this.all(
      `SELECT
         cb.user_id,
         cb.score,
         cb.correct_count,
         cb.accuracy,
         cb.elapsed_ms,
         cb.achieved_at,
         u.handle,
         u.display_name,
         u.leaderboard_visibility
       FROM challenge_bests cb
       JOIN app_users u ON u.id = cb.user_id
       WHERE cb.challenge_version_id = ? AND u.account_status = 'active'`,
      versionId
    );

    const candidates = rows.map((r) => ({
      userId: r.user_id,
      handle: r.handle,
      displayName: r.display_name,
      leaderboardVisibility: r.leaderboard_visibility,
      score: r.score,
      correctCount: r.correct_count,
      accuracy: r.accuracy,
      elapsedMs: r.elapsed_ms,
      achievedAt: r.achieved_at
    }));

    const entries = buildLeaderboard({
      candidates,
      viewerUserId: viewerId,
      scope,
      acceptedFriendIds: this.getAcceptedFriendIds(viewerId),
      blockedUserIds: this.getBlockedUserIds(viewerId)
    }).slice(0, Math.min(100, Math.max(1, Number(limit || 50))));

    return {
      challengeVersionId: versionId,
      scorerType: ver.scorer_type,
      scorerVersion: ver.scorer_version,
      scope,
      entries
    };
  }

  getMyChallengeStandingV1(userId, versionId) {
    this.ensureAppUser(userId);
    const best = this.one(
      'SELECT * FROM challenge_bests WHERE challenge_version_id = ? AND user_id = ?',
      versionId,
      userId
    );
    const userRow = this.one('SELECT leaderboard_visibility FROM app_users WHERE id = ?', userId);
    const board = this.getChallengeLeaderboardV1(userId, versionId, 'global', 100);
    const myRanked = board.entries.find((e) => e.userId === userId) || null;

    return {
      challengeVersionId: versionId,
      leaderboardVisibility: userRow?.leaderboard_visibility || 'public',
      personalBest: best
        ? {
            score: best.score,
            correctCount: best.correct_count,
            accuracy: best.accuracy,
            elapsedMs: best.elapsed_ms,
            achievedAt: best.achieved_at
          }
        : null,
      publicRank: myRanked ? myRanked.rank : null
    };
  }

  createChallengeInviteV1(senderId, data) {
    this.ensureAppUser(senderId);
    const recipientId = text(data.recipientId, 'recipientId', 64, true);
    const challengeVersionId = text(data.challengeVersionId, 'challengeVersionId', 64, true);
    const ver = this.one(
      'SELECT * FROM challenge_versions WHERE id = ? AND published_at IS NOT NULL',
      challengeVersionId
    );
    if (!ver) {
      throw new AppError('Versione challenge non trovata.', 404, 'NOT_FOUND');
    }
    if (this.isBlockedEitherWay(senderId, recipientId)) {
      throw new AppError('Impossibile inviare invito.', 403, 'FORBIDDEN');
    }
    const friends = this.getAcceptedFriendIds(senderId);
    if (!friends.has(recipientId)) {
      throw new AppError(
        'Un invito a challenge è consentito solo tra amici accettati.',
        403,
        'FORBIDDEN'
      );
    }
    const id = uuid();
    const now = nowIso();
    this.run(
      `INSERT INTO challenge_invites (id, sender_id, recipient_id, challenge_version_id, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      id,
      senderId,
      recipientId,
      challengeVersionId,
      now
    );
    return { inviteId: id, status: 'pending', createdAt: now };
  }

  listChallengeInvitesV1(userId) {
    this.ensureAppUser(userId);
    const blocked = this.getBlockedUserIds(userId);
    const incoming = this.all(
      'SELECT * FROM challenge_invites WHERE recipient_id = ? ORDER BY created_at DESC',
      userId
    ).filter((i) => !blocked.has(i.sender_id));
    const outgoing = this.all(
      'SELECT * FROM challenge_invites WHERE sender_id = ? ORDER BY created_at DESC',
      userId
    ).filter((i) => !blocked.has(i.recipient_id));
    return { incoming, outgoing };
  }

  acceptChallengeInviteV1(userId, inviteId) {
    const inv = this.one(
      'SELECT * FROM challenge_invites WHERE id = ? AND recipient_id = ?',
      inviteId,
      userId
    );
    if (!inv) {
      throw new AppError('Invito non trovato.', 404, 'NOT_FOUND');
    }
    if (this.isBlockedEitherWay(inv.sender_id, inv.recipient_id)) {
      throw new AppError('Invito non disponibile.', 403, 'FORBIDDEN');
    }
    const now = nowIso();
    // Accepting an invite updates invite status only — NEVER creates an automatic ranked attempt!
    this.run(
      `UPDATE challenge_invites SET status = 'accepted', responded_at = ? WHERE id = ?`,
      now,
      inviteId
    );
    return {
      inviteId,
      challengeVersionId: inv.challenge_version_id,
      status: 'accepted',
      respondedAt: now
    };
  }

  // ===========================================================================
  // BLUEPRINT v2 — MODULE 7: OUTBOX WORKER & INTERVENTIONS
  // ===========================================================================

  listInterventionsV1(userId) {
    this.ensureAppUser(userId);
    const rows = this.all(
      'SELECT * FROM learning_interventions WHERE owner_id = ? ORDER BY created_at DESC LIMIT 25',
      userId
    );
    return {
      items: rows.map((r) => ({
        ...r,
        evidence: JSON.parse(r.evidence_json || '{}')
      }))
    };
  }

  respondInterventionV1(userId, interventionId, data) {
    const row = this.one(
      'SELECT * FROM learning_interventions WHERE id = ? AND owner_id = ?',
      interventionId,
      userId
    );
    if (!row) {
      throw new AppError('Intervento non trovato.', 404, 'NOT_FOUND');
    }
    const status = data.status;
    if (!['accepted', 'dismissed', 'completed'].includes(status)) {
      throw new AppError('Stato intervento non valido.', 422, 'VALIDATION_ERROR');
    }
    const now = nowIso();
    this.run(
      `UPDATE learning_interventions SET status = ?, user_response_note = ?, responded_at = ? WHERE id = ? AND owner_id = ?`,
      status,
      data.note || null,
      now,
      interventionId,
      userId
    );
    return this.one('SELECT * FROM learning_interventions WHERE id = ?', interventionId);
  }

  evaluateInterventionV1(userId, interventionId, data) {
    const row = this.one(
      'SELECT * FROM learning_interventions WHERE id = ? AND owner_id = ?',
      interventionId,
      userId
    );
    if (!row) {
      throw new AppError('Intervento non trovato.', 404, 'NOT_FOUND');
    }
    const evaluation = evaluateInterventionOutcome({
      interventionId,
      metricKey: data.metricKey || 'immediate_recall_accuracy',
      polarity: data.polarity || 'higher_better',
      preTrials: Array.isArray(data.preTrials) ? data.preTrials : [],
      postTrials: Array.isArray(data.postTrials) ? data.postTrials : []
    });
    const outcomeId = uuid();
    this.run(
      `INSERT INTO intervention_outcomes
       (id, intervention_id, owner_id, metric_key, pre_sample_size, post_sample_size, pre_value, post_value, comparability_verified, outcome_status, evaluation_reason, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      outcomeId,
      interventionId,
      userId,
      evaluation.metricKey,
      evaluation.preSampleSize,
      evaluation.postSampleSize,
      evaluation.preValue,
      evaluation.postValue,
      evaluation.comparabilityVerified ? 1 : 0,
      evaluation.outcomeStatus,
      evaluation.evaluationReason,
      evaluation.evaluatedAt
    );
    return { id: outcomeId, ...evaluation };
  }

  processOutboxEventsV1(limit = 50) {
    const unprocessed = this.all(
      'SELECT * FROM outbox_events WHERE processed_at IS NULL ORDER BY created_at ASC LIMIT ?',
      limit
    );
    const now = nowIso();
    let processedCount = 0;
    this.transaction(() => {
      for (const ev of unprocessed) {
        this.run(
          'UPDATE outbox_events SET processed_at = ?, attempts = attempts + 1 WHERE id = ? AND processed_at IS NULL',
          now,
          ev.id
        );
        processedCount += 1;
      }
    });
    return { processedCount };
  }
}

export function validateAnchor(a) {
  if (a === null) return null;
  const vector = (v, bound) =>
    v &&
    ['x', 'y', 'z'].every(
      (k) => typeof v[k] === 'number' && Number.isFinite(v[k]) && Math.abs(v[k]) <= bound
    );
  if (
    !a ||
    a.scene !== 'loco-room-v1' ||
    !vector(a.point, 6) ||
    !vector(a.normal, 1) ||
    !vector(a.camera, 6) ||
    !Number.isFinite(a.yaw) ||
    Math.abs(a.yaw) > 10000 ||
    !Number.isFinite(a.pitch) ||
    Math.abs(a.pitch) > 1.4 ||
    typeof a.surface !== 'string' ||
    a.surface.length > 120
  ) {
    throw new AppError('Posizione 3D non valida.');
  }
  const length = Math.hypot(a.normal.x, a.normal.y, a.normal.z);
  if (length < 0.9 || length > 1.1) {
    throw new AppError('Superficie 3D non valida.');
  }
  return {
    scene: a.scene,
    point: a.point,
    normal: a.normal,
    camera: a.camera,
    yaw: a.yaw,
    pitch: a.pitch,
    surface: a.surface
  };
}
