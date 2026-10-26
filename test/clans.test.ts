import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, stopServer } from '../server.ts';

const dbPath = path.join(process.cwd(), 'data', 'test_clans.sqlite');

function cleanDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(`${dbPath}${suffix}`); } catch {}
  }
}

async function register(baseUrl: string, username: string, clanTag: string) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'SicheresPasswort123',
      clanTag,
      faction: 'neu-anspach',
      legalConsent: {
        acceptedAt: new Date().toISOString(),
        noticeVersion: '1.0',
        privacyPolicyVersion: '1.0',
        termsVersion: '1.0',
      },
    }),
  });
  const data = await response.json();
  return {
    cookie: response.headers.get('set-cookie')!.split(';')[0],
    csrf: data.csrfToken as string,
  };
}

test('Clan API: Gründung, Einladung, Beitritt, Clan-Börse, Clankriege, Clanaufgaben & Account-Verknüpfung', async () => {
  cleanDb();
  process.env.NODE_ENV = 'test';
  delete process.env.DATABASE_URL;
  const httpServer = await startServer(0, dbPath);
  const port = (httpServer.address() as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const leader = await register(baseUrl, 'ClanLeader', 'LEAD');
    const member = await register(baseUrl, 'ClanMember', 'MEMB');
    const headers = (session: typeof leader) => ({
      'Content-Type': 'application/json',
      Cookie: session.cookie,
      'X-CSRF-Token': session.csrf,
    });

    const create = await fetch(`${baseUrl}/api/clans`, {
      method: 'POST',
      headers: headers(leader),
      body: JSON.stringify({ tag: 'TAUNUS', name: 'Taunus-Trupp', description: 'Gemeinsam stark.' }),
    });
    assert.equal(create.status, 201);

    const invite = await fetch(`${baseUrl}/api/clans/invitations`, {
      method: 'POST',
      headers: headers(leader),
      body: JSON.stringify({ username: 'ClanMember' }),
    });
    assert.equal(invite.status, 201);

    const memberClan = await fetch(`${baseUrl}/api/clans/me`, { headers: { Cookie: member.cookie } });
    const invitation = (await memberClan.json()).invitations[0];
    assert.ok(invitation.id);

    const accept = await fetch(`${baseUrl}/api/clans/invitations/${invitation.id}/accept`, {
      method: 'POST',
      headers: headers(member),
      body: '{}',
    });
    assert.equal(accept.status, 200);

    const message = await fetch(`${baseUrl}/api/clans/messages`, {
      method: 'POST',
      headers: headers(member),
      body: JSON.stringify({ text: 'Hallo Clan!' }),
    });
    assert.equal(message.status, 201);
    assert.equal((await message.json()).message.text, 'Hallo Clan!');

    // 2. Clash Royale Clan-Börse, Level/Cost Validation, Settings, Clankrieg & Clanaufgaben
    const dirRes = await fetch(`${baseUrl}/api/clans/directory`, { headers: { Cookie: leader.cookie } });
    assert.equal(dirRes.status, 200);
    const dirData = await dirRes.json();
    assert.ok(Array.isArray(dirData.clans));
    assert.ok(dirData.clans.some((c: any) => c.tag === 'TAUNUS'));
    assert.ok(dirData.clans.some((c: any) => c.tag === 'HESSEN'));

    // Reject clan creation if operatorLevel < 3
    const rookie = await register(baseUrl, 'RookieOp', '');
    const lowLvCreate = await fetch(`${baseUrl}/api/clans`, {
      method: 'POST',
      headers: headers(rookie),
      body: JSON.stringify({ tag: 'ROOK', name: 'Rookie Clan', description: 'Test', operatorLevel: 1, budget: 5000 }),
    });
    assert.equal(lowLvCreate.status, 403);

    // Reject clan creation if budget < 1000 NAT
    const lowBudgetCreate = await fetch(`${baseUrl}/api/clans`, {
      method: 'POST',
      headers: headers(rookie),
      body: JSON.stringify({ tag: 'ROOK', name: 'Rookie Clan', description: 'Test', operatorLevel: 5, budget: 400 }),
    });
    assert.equal(lowBudgetCreate.status, 400);

    // Update Clan Settings (Leader)
    const settingsRes = await fetch(`${baseUrl}/api/clans/settings`, {
      method: 'PATCH',
      headers: headers(leader),
      body: JSON.stringify({
        description: 'Elite-Bürgerwehr im Taunus',
        badge: 'crown',
        joinType: 'open',
        minLevel: 2,
        minScore: 500,
        minWave: 3,
      }),
    });
    assert.equal(settingsRes.status, 200);
    const updatedClan = (await settingsRes.json()).clan;
    assert.equal(updatedClan.minLevel, 2);
    assert.equal(updatedClan.badge, 'crown');

    // Execute a difficult Clan War Battle
    const warRes = await fetch(`${baseUrl}/api/clans/war/battle`, {
      method: 'POST',
      headers: headers(leader),
      body: JSON.stringify({ mode: 'raid', operatorLevel: 8, weaponLevel: 10, skillPointsSpent: 5 }),
    });
    assert.equal(warRes.status, 200);
    const warData = await warRes.json();
    assert.ok(warData.fameEarned > 0);
    assert.ok(warData.clan.warFame >= warData.fameEarned);

    // Contribute to a difficult Clan Quest
    const firstQuestId = warData.clan.quests[0].id;
    const questRes = await fetch(`${baseUrl}/api/clans/quests/${firstQuestId}/contribute`, {
      method: 'POST',
      headers: headers(leader),
      body: JSON.stringify({ amount: 50 }),
    });
    assert.equal(questRes.status, 200);

    // 3. Username change & Legacy Account Linking
    const renameRes = await fetch(`${baseUrl}/api/auth/username`, {
      method: 'POST',
      headers: headers(rookie),
      body: JSON.stringify({ username: 'RookieRenamed', faction: 'wehrheim' }),
    });
    assert.equal(renameRes.status, 200);
    const renamedData = await renameRes.json();
    assert.equal(renamedData.account.username, 'RookieRenamed');

    // Create a Google-authenticated user and link it to the legacy password account ('ClanMember')
    const googleAuthRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        devProfile: {
          email: 'linktest@gmail.com',
          displayName: 'TempGoogleUser',
          googleSub: 'google_sub_link_test_999',
        },
      }),
    });
    assert.equal(googleAuthRes.status, 201);
    const googleData = await googleAuthRes.json();
    const googleSession = {
      cookie: googleAuthRes.headers.get('set-cookie')!.split(';')[0],
      csrf: googleData.csrfToken as string,
    };

    const linkRes = await fetch(`${baseUrl}/api/auth/link-legacy`, {
      method: 'POST',
      headers: headers(googleSession),
      body: JSON.stringify({ username: 'ClanMember', password: 'SicheresPasswort123' }),
    });
    assert.equal(linkRes.status, 200);
    const linkData = await linkRes.json();
    assert.equal(linkData.account.username, 'ClanMember');
    assert.equal(linkData.account.email, 'linktest@gmail.com');
  } finally {
    await stopServer();
    cleanDb();
  }
});
