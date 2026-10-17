import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';
import {
  app,
  server,
  startServer,
  stopServer,
  storage,
  authStore,
  getPublicLeaderboardPayload,
} from '../server.ts';
import { SqliteStorageAdapter } from '../src/server/storage.ts';

const TEST_DB = path.join(process.cwd(), 'data', 'test_server.sqlite');

function cleanDb(p: string) {
  try { fs.unlinkSync(p); } catch {}
  try { fs.unlinkSync(`${p}-wal`); } catch {}
  try { fs.unlinkSync(`${p}-shm`); } catch {}
}

test('API, CSRF & Multiplayer Security Test Suite', async (t) => {
  cleanDb(TEST_DB);
  process.env.SQLITE_DB_PATH = TEST_DB;
  process.env.NODE_ENV = 'test';

  // Start server on dynamic port (0 picks an ephemeral available port)
  const testHttpServer = await startServer(0, TEST_DB);
  const address = testHttpServer.address() as { port: number };
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const wsUrl = `ws://127.0.0.1:${port}/ws`;

  let userCookie = '';
  let userCsrf = '';
  let userAccount: any = null;

  let otherCookie = '';
  let otherCsrf = '';
  let otherAccount: any = null;

  await t.test('1. Unauthentifizierter Zugriff auf geschützte Endpunkte liefert 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);

    const submitRes = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 100 }),
    });
    assert.equal(submitRes.status, 401);

    const joinRes = await fetch(`${baseUrl}/api/multiplayer/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arena: 'hessenpark' }),
    });
    assert.equal(joinRes.status, 401);
  });

  await t.test('2. Registrierung & Erhalt von HttpOnly-Cookie und CSRF-Token', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'TaunusRanger',
        password: 'SicheresPasswort123',
        clanTag: 'RNGR',
        faction: 'neu-anspach',
        legalConsent: {
          acceptedAt: new Date().toISOString(),
          noticeVersion: '1.0',
          privacyPolicyVersion: '1.0',
          termsVersion: '1.0',
        },
      }),
    });

    assert.equal(regRes.status, 201);
    const data = await regRes.json();
    assert.equal(data.success, true);
    assert.equal(data.account.username, 'TaunusRanger');
    assert.ok(data.csrfToken);
    userCsrf = data.csrfToken;
    userAccount = data.account;

    // Cookie set in response
    const setCookieHeader = regRes.headers.get('set-cookie');
    assert.ok(setCookieHeader);
    assert.ok(setCookieHeader.includes('gemini_game_session='));
    assert.ok(setCookieHeader.includes('HttpOnly'));

    userCookie = setCookieHeader.split(';')[0];
  });

  await t.test('3. Registrierung eines zweiten Benutzers für Berechtigungstests', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'WehrheimRival',
        password: 'AnderesPasswort789',
        clanTag: 'WEHR',
        faction: 'wehrheim',
        legalConsent: {
          acceptedAt: new Date().toISOString(),
          noticeVersion: '1.0',
          privacyPolicyVersion: '1.0',
          termsVersion: '1.0',
        },
      }),
    });

    assert.equal(regRes.status, 201);
    const data = await regRes.json();
    otherCsrf = data.csrfToken;
    otherAccount = data.account;
    const cookie = regRes.headers.get('set-cookie');
    otherCookie = cookie!.split(';')[0];
  });

  await t.test('4. CSRF-Schutz: Mutation ohne oder mit falschem CSRF-Token wird mit 403 abgewiesen', async () => {
    // Request with valid cookie but MISSING CSRF header
    const noCsrfRes = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
      },
      body: JSON.stringify({ score: 100, kills: 2, wave: 1 }),
    });
    assert.equal(noCsrfRes.status, 403);

    // Request with valid cookie but INVALID CSRF header
    const wrongCsrfRes = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': 'gefaelschtes_csrf_token_123',
      },
      body: JSON.stringify({ score: 100, kills: 2, wave: 1 }),
    });
    assert.equal(wrongCsrfRes.status, 403);
  });

  await t.test('5. Leaderboard: Erfolgreiche Übermittlung mit korrektem CSRF & Cookie', async () => {
    const submitRes = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({
        score: 1200,
        kills: 14,
        wave: 3,
        victory: false,
        currentArena: 'Freilichtmuseum Hessenpark',
      }),
    });

    assert.equal(submitRes.status, 200);
    const payload = await submitRes.json();
    assert.equal(payload.success, true);

    const myEntry = payload.leaderboard.find((e: any) => e.name === 'TaunusRanger');
    assert.ok(myEntry);
    assert.equal(myEntry.score, 1200);
    assert.equal(myEntry.kills, 14);
    assert.equal(myEntry.highestWave, 3);
  });

  await t.test('6. Anti-Cheat & Bounds: Absurde oder negative Werte werden abgewiesen', async () => {
    // Negative score
    const negScore = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({ score: -50, kills: 5, wave: 2 }),
    });
    assert.equal(negScore.status, 400);

    // Impossible score (> 25,000 in single submit)
    const bigScore = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({ score: 999999, kills: 5, wave: 2 }),
    });
    assert.equal(bigScore.status, 400);

    // Impossible kills (> 300)
    const bigKills = await fetch(`${baseUrl}/api/leaderboard/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({ score: 100, kills: 9999, wave: 2 }),
    });
    assert.equal(bigKills.status, 400);
  });

  let roomCode = '';
  let rangerPlayerId = '';

  await t.test('7. Multiplayer: Raum erstellen / beitreten mit sicherem Raumcode', async () => {
    const joinRes = await fetch(`${baseUrl}/api/multiplayer/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({
        arena: 'Freilichtmuseum Hessenpark',
      }),
    });

    assert.equal(joinRes.status, 200);
    const data = await joinRes.json();
    assert.equal(data.success, true);
    assert.ok(data.room.code);
    assert.ok(data.playerId.startsWith('p_'));
    assert.equal(data.room.hostAccountId, userAccount.id);

    roomCode = data.room.code;
    rangerPlayerId = data.playerId;
  });

  await t.test('8. Multiplayer Ownership: Ein Spieler darf den Status fremder Spieler NICHT manipulieren', async () => {
    // Other player (WehrheimRival) attempts to manipulate TaunusRanger's status
    const tamperRes = await fetch(`${baseUrl}/api/multiplayer/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: otherCookie,
        'X-CSRF-Token': otherCsrf,
      },
      body: JSON.stringify({
        roomCode,
        playerId: rangerPlayerId, // Trying to update Ranger's state
        kills: 50,
        score: 1000,
        health: 0,
      }),
    });

    // Must be rejected with 403 Forbidden!
    assert.equal(tamperRes.status, 403);
  });

  await t.test('9. Multiplayer Bounds: Unplausible Sprünge in Kills oder Wellen werden abgewiesen', async () => {
    // Attempting to advance wave by 10 in a single update
    const waveJumpRes = await fetch(`${baseUrl}/api/multiplayer/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({
        roomCode,
        playerId: rangerPlayerId,
        wave: 20,
      }),
    });
    assert.equal(waveJumpRes.status, 400);

    // Valid update succeeds
    const validRes = await fetch(`${baseUrl}/api/multiplayer/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
        'X-CSRF-Token': userCsrf,
      },
      body: JSON.stringify({
        roomCode,
        playerId: rangerPlayerId,
        kills: 3,
        score: 450,
        health: 85,
        wave: 2,
      }),
    });
    assert.equal(validRes.status, 200);
    const updated = await validRes.json();
    assert.equal(updated.room.players[rangerPlayerId].kills, 3);
    assert.equal(updated.room.players[rangerPlayerId].health, 85);
  });

  await t.test('10. WebSocket: Verbindung, Initial-Sync und Session-Binding', async () => {
    const ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WS timeout')), 3000);

      ws.on('open', () => {
        // Send presence update
        ws.send(
          JSON.stringify({
            type: 'player:presence',
            currentArena: 'Waldschwimmbad Neu-Anspach',
          })
        );
      });

      ws.on('message', (msg) => {
        try {
          const parsed = JSON.parse(msg.toString());
          if (parsed.type === 'leaderboard:sync') {
            clearTimeout(timeout);
            assert.ok(parsed.data.leaderboard);
            assert.ok(parsed.data.derbyStats);
            ws.close();
            resolve();
          }
        } catch (e) {
          clearTimeout(timeout);
          reject(e);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  await t.test('11. Room Cleanup: Veraltete Räume werden aufgeräumt', async () => {
    // Manually artificially age the room
    const room = await storage.getRoom(roomCode);
    assert.ok(room);
    room!.updatedAt = Date.now() - 700000; // 11 minutes old
    await storage.saveRoom(room!);

    // Run cleanup for rooms older than 10 minutes
    await storage.cleanupStaleRooms(600000);

    const lookup = await storage.getRoom(roomCode);
    assert.equal(lookup, null);
  });

  // Teardown
  await stopServer();
  cleanDb(TEST_DB);
});
