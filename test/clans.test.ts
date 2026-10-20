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

test('Clan API: Gründung, Einladung, Beitritt und Chat', async () => {
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
  } finally {
    await stopServer();
    cleanDb();
  }
});
