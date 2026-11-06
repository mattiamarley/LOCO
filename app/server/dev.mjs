import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { Store, AppError, hash, text } from './store.mjs';

const root = resolve(fileURLToPath(new URL('../prototype/', import.meta.url)));
const fontsRoot = resolve(fileURLToPath(new URL('../assets/fonts/', import.meta.url)));

export function createApp(database) {
  const store = new Store(database);
  const attempts = new Map();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method;
    const requestId = req.headers['x-request-id'] || randomUUID();

    const json = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': String(requestId)
      });
      res.end(JSON.stringify(data));
    };

    const empty204 = () => {
      res.writeHead(204, {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Request-Id': String(requestId)
      });
      res.end();
    };

    try {
      // =======================================================================
      // 1. BLUEPRINT v2 API (/v1/*)
      // =======================================================================
      if (path.startsWith('/v1/')) {
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          throw new AppError('Metodo non consentito.', 405, 'METHOD_NOT_ALLOWED');
        }
        if (
          method !== 'GET' &&
          (req.headers['x-loco-request'] !== '1' ||
            (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host))
        ) {
          throw new AppError('Richiesta non consentita (CSRF / Origin check).', 403, 'FORBIDDEN');
        }

        let data = {};
        if (method !== 'GET' && method !== 'DELETE') {
          let size = 0;
          let body = '';
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 1024 * 1024) {
              throw new AppError('Richiesta troppo grande.', 413, 'PAYLOAD_TOO_LARGE');
            }
            body += chunk;
          }
          try {
            data = body ? JSON.parse(body) : {};
          } catch {
            throw new AppError('JSON non valido.', 400, 'VALIDATION_ERROR');
          }
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('Payload non valido.', 422, 'VALIDATION_ERROR');
          }
        }

        const headerIdempotency = req.headers['idempotency-key'];
        if (headerIdempotency && !data.idempotencyKey) {
          data.idempotencyKey = String(headerIdempotency);
        }

        if (path === '/v1/health' && method === 'GET') {
          return json(200, { ok: true, apiVersion: 'v1', blueprintVersion: 'v2' });
        }

        const token = req.headers.cookie
          ?.split(';')
          .map((v) => v.trim())
          .find((v) => v.startsWith('loco_session='))
          ?.slice(13);
        const user = store.user(token);
        if (!user) {
          throw new AppError('Sessione assente o scaduta.', 401, 'UNAUTHORIZED');
        }

        // --- Account & Friends ---
        if (path === '/v1/me' && method === 'GET') {
          return json(200, store.getMeV1(user.id));
        }
        if (path === '/v1/me' && method === 'PATCH') {
          return json(200, store.updateMeV1(user.id, data));
        }
        if (path === '/v1/me/preferences' && method === 'PATCH') {
          return json(200, store.updatePreferencesV1(user.id, data));
        }
        if (path === '/v1/me/exports' && method === 'POST') {
          return json(201, store.createExportJobV1(user.id, data.idempotencyKey));
        }
        if (path === '/v1/users' && method === 'GET') {
          return json(200, store.searchUsersV1(user.id, url.searchParams.get('handle')));
        }
        if (path === '/v1/friends' && method === 'GET') {
          return json(200, store.listFriendsV1(user.id));
        }
        if (path === '/v1/friend-requests' && method === 'GET') {
          return json(200, store.listFriendRequestsV1(user.id));
        }
        if (path === '/v1/friend-requests' && method === 'POST') {
          return json(201, store.createFriendRequestV1(user.id, data.recipientId));
        }

        let m = path.match(/^\/v1\/friend-requests\/([^/]+)\/(accept|reject)$/);
        if (m && method === 'POST') {
          return json(200, store.respondFriendRequestV1(user.id, m[1], m[2]));
        }

        m = path.match(/^\/v1\/friends\/([^/]+)$/);
        if (m && method === 'DELETE') {
          store.deleteFriendV1(user.id, m[1]);
          return empty204();
        }

        m = path.match(/^\/v1\/users\/([^/]+)\/block$/);
        if (m && method === 'POST') {
          store.blockUserV1(user.id, m[1], data.reason);
          return empty204();
        }
        if (m && method === 'DELETE') {
          store.unblockUserV1(user.id, m[1]);
          return empty204();
        }

        // --- Study & Knowledge ---
        if (path === '/v1/projects' && method === 'GET') {
          return json(200, { items: store.listProjectsV1(user.id) });
        }
        if (path === '/v1/projects' && method === 'POST') {
          return json(201, store.createProjectV1(user.id, data));
        }

        m = path.match(/^\/v1\/projects\/([^/]+)$/);
        if (m) {
          if (method === 'GET') return json(200, store.getProjectV1(user.id, m[1]));
          if (method === 'PATCH') return json(200, store.updateProjectV1(user.id, m[1], data));
          if (method === 'DELETE') {
            store.deleteProjectV1(user.id, m[1]);
            return empty204();
          }
        }

        m = path.match(/^\/v1\/projects\/([^/]+)\/uploads$/);
        if (m && method === 'POST') {
          return json(201, store.createUploadInitV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/projects\/([^/]+)\/sources$/);
        if (m) {
          if (method === 'POST') return json(201, store.createSourceDocumentV1(user.id, m[1], data));
          if (method === 'GET') return json(200, store.listProjectSourcesV1(user.id, m[1]));
        }

        m = path.match(/^\/v1\/sources\/([^/]+)\/chunks$/);
        if (m && method === 'GET') {
          return json(200, store.listSourceChunksV1(user.id, m[1]));
        }

        m = path.match(/^\/v1\/projects\/([^/]+)\/knowledge$/);
        if (m) {
          if (method === 'GET') {
            return json(
              200,
              store.listProjectKnowledgeV1(user.id, m[1], {
                state: url.searchParams.get('state'),
                kind: url.searchParams.get('kind')
              })
            );
          }
          if (method === 'POST') {
            return json(201, store.createKnowledgeItemV1(user.id, m[1], data));
          }
        }

        m = path.match(/^\/v1\/knowledge\/([^/]+)$/);
        if (m && method === 'PATCH') {
          return json(200, store.updateKnowledgeItemV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/knowledge\/([^/]+)\/confirm$/);
        if (m && method === 'POST') {
          return json(200, store.confirmKnowledgeItemV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/knowledge\/([^/]+)\/targets$/);
        if (m && method === 'POST') {
          return json(201, store.createLearningTargetV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/knowledge\/([^/]+)\/evidence$/);
        if (m && method === 'GET') {
          return json(200, store.getKnowledgeEvidenceV1(user.id, m[1]));
        }

        // --- Palaces, Loci, Spatial & Media v2 ---
        if (path === '/v1/palaces' && method === 'GET') {
          return json(200, store.listPalacesV1(user.id));
        }
        if (path === '/v1/palaces' && method === 'POST') {
          return json(201, store.createPalaceV1(user.id, data));
        }

        m = path.match(/^\/v1\/palaces\/([^/]+)$/);
        if (m) {
          if (method === 'GET') return json(200, store.getPalaceV1(user.id, m[1]));
          if (method === 'PATCH') return json(200, store.updatePalaceV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/palaces\/([^/]+)\/loci$/);
        if (m) {
          if (method === 'GET') return json(200, store.listPalaceLociV1(user.id, m[1]));
          if (method === 'POST') return json(201, store.createPalaceLocusV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/palaces\/([^/]+)\/loci\/order$/);
        if (m && method === 'PUT') {
          return json(200, store.reorderPalaceLociV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/loci\/([^/]+)$/);
        if (m && method === 'PATCH') {
          return json(200, store.updatePalaceLocusV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/loci\/([^/]+)\/placements$/);
        if (m && method === 'POST') {
          return json(201, store.createLocusPlacementV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/learning-targets\/([^/]+)\/mnemonics$/);
        if (m && method === 'POST') {
          return json(201, store.createMnemonicV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/mnemonics\/([^/]+)$/);
        if (m && method === 'PATCH') {
          return json(200, store.updateMnemonicV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/mnemonics\/([^/]+)\/confirm$/);
        if (m && method === 'POST') {
          return json(200, store.confirmMnemonicV1(user.id, m[1]));
        }

        // --- Learning, Blind Recall, 18 Metrics & Adaptive Interventions ---
        if (path === '/v1/reviews/due' && method === 'GET') {
          return json(
            200,
            store.listDueReviewsV1(user.id, {
              limit: url.searchParams.get('limit'),
              projectId: url.searchParams.get('projectId')
            })
          );
        }
        if (path === '/v1/study-sessions' && method === 'POST') {
          return json(201, store.createStudySessionV1(user.id, data));
        }
        if (path === '/v1/review-attempts' && method === 'POST') {
          return json(201, store.submitReviewAttemptV1(user.id, data));
        }

        m = path.match(/^\/v1\/learning-targets\/([^/]+)\/history$/);
        if (m && method === 'GET') {
          return json(200, store.getTargetHistoryV1(user.id, m[1]));
        }

        m = path.match(/^\/v1\/learning-targets\/([^/]+)\/schedule$/);
        if (m && method === 'GET') {
          return json(200, store.getTargetScheduleV1(user.id, m[1]));
        }

        if (path === '/v1/me/learning-profile' && method === 'GET') {
          const windowDays = Number(url.searchParams.get('window') || 28);
          return json(200, store.getLearningProfileV1(user.id, windowDays));
        }
        if (path === '/v1/me/skill-profiles' && method === 'GET') {
          const windowDays = Number(url.searchParams.get('window') || 28);
          return json(
            200,
            store.getSkillProfilesV1(user.id, url.searchParams.get('skill'), windowDays)
          );
        }
        if (path === '/v1/me/interventions' && method === 'GET') {
          return json(200, store.listInterventionsV1(user.id));
        }

        m = path.match(/^\/v1\/interventions\/([^/]+)\/respond$/);
        if (m && method === 'POST') {
          return json(200, store.respondInterventionV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/interventions\/([^/]+)\/evaluate$/);
        if (m && method === 'POST') {
          return json(200, store.evaluateInterventionV1(user.id, m[1], data));
        }

        // --- Training ---
        if (path === '/v1/training/exercises' && method === 'GET') {
          return json(200, store.listTrainingExercisesV1(url.searchParams.get('skill')));
        }
        if (path === '/v1/training/sessions' && method === 'POST') {
          return json(201, store.startTrainingSessionV1(user.id, data));
        }

        m = path.match(/^\/v1\/training\/sessions\/([^/]+)\/trials$/);
        if (m && method === 'POST') {
          return json(201, store.submitTrainingTrialV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/training\/sessions\/([^/]+)\/finish$/);
        if (m && method === 'POST') {
          return json(200, store.finishTrainingSessionV1(user.id, m[1], data.idempotencyKey));
        }

        if (path === '/v1/training/history' && method === 'GET') {
          return json(200, store.listTrainingHistoryV1(user.id, url.searchParams.get('skill')));
        }

        // --- Challenges & Leaderboards (Arena) ---
        if (path === '/v1/challenges' && method === 'GET') {
          return json(200, store.listChallengesV1(url.searchParams.get('skill')));
        }

        m = path.match(/^\/v1\/challenges\/([^/]+)$/);
        if (m && method === 'GET') {
          return json(200, store.getChallengeV1(m[1]));
        }

        m = path.match(/^\/v1\/challenge-versions\/([^/]+)\/runs$/);
        if (m && method === 'POST') {
          const isRanked = data.isRanked !== false;
          return json(
            201,
            store.startChallengeRunV1(user.id, m[1], data.idempotencyKey, isRanked)
          );
        }

        m = path.match(/^\/v1\/challenge-runs\/([^/]+)\/submit$/);
        if (m && method === 'POST') {
          return json(200, store.submitChallengeRunV1(user.id, m[1], data));
        }

        m = path.match(/^\/v1\/challenge-runs\/([^/]+)\/result$/);
        if (m && method === 'GET') {
          return json(200, store.getChallengeRunResultV1(user.id, m[1]));
        }

        m = path.match(/^\/v1\/challenge-versions\/([^/]+)\/leaderboard$/);
        if (m && method === 'GET') {
          const scope = url.searchParams.get('scope') || 'global';
          const limit = Number(url.searchParams.get('limit') || 50);
          return json(200, store.getChallengeLeaderboardV1(user.id, m[1], scope, limit));
        }

        m = path.match(/^\/v1\/challenge-versions\/([^/]+)\/me$/);
        if (m && method === 'GET') {
          return json(200, store.getMyChallengeStandingV1(user.id, m[1]));
        }

        if (path === '/v1/challenge-invites' && method === 'POST') {
          return json(201, store.createChallengeInviteV1(user.id, data));
        }
        if (path === '/v1/challenge-invites' && method === 'GET') {
          return json(200, store.listChallengeInvitesV1(user.id));
        }

        m = path.match(/^\/v1\/challenge-invites\/([^/]+)\/accept$/);
        if (m && method === 'POST') {
          return json(200, store.acceptChallengeInviteV1(user.id, m[1]));
        }

        throw new AppError('Endpoint /v1 non trovato.', 404, 'NOT_FOUND');
      }

      // =======================================================================
      // 2. LEGACY v1 API (/api/*) — 100% preserved
      // =======================================================================
      if (path.startsWith('/api/')) {
        if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
          throw new AppError('Metodo non consentito.', 405);
        }
        if (
          method !== 'GET' &&
          (req.headers['x-loco-request'] !== '1' ||
            (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host))
        ) {
          throw new AppError('Richiesta non consentita.', 403);
        }
        let data = {};
        if (method !== 'GET') {
          let size = 0;
          let body = '';
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 1024 * 1024) throw new AppError('Richiesta troppo grande.', 413);
            body += chunk;
          }
          try {
            data = body ? JSON.parse(body) : {};
          } catch {
            throw new AppError('JSON non valido.');
          }
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new AppError('Richiesta non valida.');
          }
        }
        if (path === '/api/health') {
          return json(200, { ok: true, storage: 'sqlite', version: 2 });
        }
        const token = req.headers.cookie
          ?.split(';')
          .map((v) => v.trim())
          .find((v) => v.startsWith('loco_session='))
          ?.slice(13);
        if (['/api/register', '/api/login'].includes(path) && method === 'POST') {
          const key = req.socket.remoteAddress;
          const now = Date.now();
          if (attempts.size > 10000) attempts.clear();
          let entry = attempts.get(key);
          if (!entry || entry.until < now) {
            entry = { n: 0, until: now + 600000 };
            attempts.set(key, entry);
          }
          if (++entry.n > 20) {
            throw new AppError('Troppi tentativi. Riprova fra dieci minuti.', 429);
          }
          const result = store.account(data, path === '/api/register');
          res.setHeader(
            'Set-Cookie',
            `loco_session=${result.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`
          );
          return json(200, result.user);
        }
        const user = store.user(token);
        if (!user) throw new AppError('Accedi per continuare.', 401);
        if (path === '/api/me' && method === 'GET') return json(200, user);
        if (path === '/api/logout' && method === 'POST') {
          store.run('DELETE FROM sessions WHERE token_hash=?', hash(token));
          res.setHeader(
            'Set-Cookie',
            'loco_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
          );
          return json(200, { ok: true });
        }
        if (path === '/api/me' && method === 'PUT') {
          store.run('UPDATE users SET name=? WHERE id=?', text(data.name, 'nome', 80, true), user.id);
          return json(200, store.user(token));
        }
        if (path === '/api/summary' && method === 'GET') return json(200, store.summary(user.id));
        if (path === '/api/backup' && method === 'GET') return json(200, store.backup(user.id));
        if (path === '/api/routes' && method === 'GET') return json(200, store.routes(user.id));
        if (path === '/api/routes' && method === 'POST') {
          return json(201, store.saveRoute(user.id, data));
        }
        let m = path.match(/^\/api\/routes\/([^/]+)$/);
        if (m) {
          if (method === 'GET') return json(200, store.detail(user.id, m[1]));
          if (method === 'PUT') return json(200, store.saveRoute(user.id, data, m[1]));
          if (method === 'DELETE') {
            store.route(user.id, m[1]);
            store.run('DELETE FROM routes WHERE id=?', m[1]);
            return json(200, { ok: true });
          }
        }
        m = path.match(/^\/api\/routes\/([^/]+)\/order$/);
        if (m && method === 'PUT') return json(200, store.reorder(user.id, m[1], data.ids));
        m = path.match(/^\/api\/routes\/([^/]+)\/loci(?:\/([^/]+))?$/);
        if (m) {
          if (method === 'POST' && !m[2]) return json(201, store.saveLocus(user.id, m[1], data));
          if (method === 'PUT' && m[2]) {
            return json(200, store.saveLocus(user.id, m[1], data, m[2]));
          }
          if (method === 'DELETE' && m[2]) {
            store.route(user.id, m[1]);
            const result = store.run('DELETE FROM loci WHERE route_id=? AND id=?', m[1], m[2]);
            if (!result.changes) throw new AppError('Locus non trovato.', 404);
            return json(200, { ok: true });
          }
        }
        m = path.match(/^\/api\/loci\/([^/]+)\/review$/);
        if (m && method === 'POST') return json(200, store.review(user.id, m[1], data.outcome));
        m = path.match(/^\/api\/lessons\/(\d+)$/);
        if (m && method === 'PUT') {
          const lesson = Number(m[1]);
          if (lesson > 7) throw new AppError('Lezione non valida.');
          if (data.completed === true) {
            store.run('INSERT OR IGNORE INTO lesson_progress VALUES(?,?,?)', user.id, lesson, Date.now());
          } else if (data.completed === false) {
            store.run('DELETE FROM lesson_progress WHERE user_id=? AND lesson=?', user.id, lesson);
          } else {
            throw new AppError('Stato non valido.');
          }
          return json(200, { ok: true });
        }
        throw new AppError('Endpoint non trovato.', 404);
      }

      // =======================================================================
      // 3. STATIC PROTOTYPE FILES
      // =======================================================================
      if (!['GET', 'HEAD'].includes(method)) {
        throw new AppError('Metodo non consentito.', 405);
      }
      const decodedPath = decodeURIComponent(path === '/' ? '/index.html' : path);
      const isFontAsset = decodedPath.startsWith('/assets/fonts/');
      const baseDir = isFontAsset ? fontsRoot : root;
      const relPath = isFontAsset ? '.' + decodedPath.slice('/assets/fonts'.length) : '.' + decodedPath;
      const file = resolve(baseDir, relPath);
      if (!file.startsWith(baseDir + sep)) throw new AppError('Non trovato.', 404);
      const info = await stat(file);
      if (!info.isFile()) throw new AppError('Non trovato.', 404);
      const mime =
        {
          '.html': 'text/html; charset=utf-8',
          '.mjs': 'text/javascript',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.ttf': 'font/ttf'
        }[extname(file)] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
      });
      res.end(method === 'HEAD' ? undefined : await readFile(file));
    } catch (e) {
      const status = e.status || (e.code === 'ENOENT' ? 404 : 500);
      const message = e.status
        ? e.message
        : e.code === 'ENOENT'
          ? 'Non trovato.'
          : 'Errore interno del server.';

      if (path.startsWith('/v1/')) {
        const code =
          e.code && typeof e.code === 'string' && e.code !== 'ENOENT'
            ? e.code
            : status === 401
              ? 'UNAUTHORIZED'
              : status === 403
                ? 'FORBIDDEN'
                : status === 404
                  ? 'NOT_FOUND'
                  : status === 409
                    ? 'CONFLICT'
                    : status === 422 || status === 400
                      ? 'VALIDATION_ERROR'
                      : status === 429
                        ? 'RATE_LIMITED'
                        : 'INTERNAL_ERROR';
        json(status, {
          error: {
            code,
            message,
            requestId: String(requestId)
          }
        });
      } else {
        json(status, { error: message });
      }
      if (!e.status && e.code !== 'ENOENT') console.error(e.message);
    }
  });

  return { server, store };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.LOCO_PORT || 8781);
  const db =
    process.env.LOCO_DB || fileURLToPath(new URL('../runtime/loco.sqlite', import.meta.url));
  const { server } = createApp(db);
  server.listen(port, '127.0.0.1', () =>
    console.log(`LOCO con database (v1 + Blueprint v2): http://127.0.0.1:${port}`)
  );
}
