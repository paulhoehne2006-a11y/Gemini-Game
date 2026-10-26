import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SqliteStorageAdapter } from '../src/server/storage.ts';
import {
  AuthStore,
  AuthValidationError,
  AuthConflictError,
  toPublicAccount,
} from '../auth.ts';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_auth.sqlite');

test('Auth & Storage Test Suite', async (t) => {
  // Clean up any old test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const storage = new SqliteStorageAdapter(TEST_DB_PATH);
  await storage.init();
  const auth = new AuthStore(storage);

  const testConsent = {
    acceptedAt: new Date().toISOString(),
    noticeVersion: '1.0',
    privacyPolicyVersion: '1.0',
    termsVersion: '1.0',
  };

  await t.test('1. Passwortvalidierung: Zu kurz oder fehlende Zeichenklassen werden abgewiesen', async () => {
    // Too short
    await assert.rejects(
      async () => {
        await auth.register('TestUser1', 'Short1!', 'TAG1', 'neu-anspach', testConsent);
      },
      (err: any) => err instanceof AuthValidationError
    );

    // Missing uppercase
    await assert.rejects(
      async () => {
        await auth.register('TestUser2', 'lowercase12345', 'TAG1', 'neu-anspach', testConsent);
      },
      (err: any) => err instanceof AuthValidationError
    );

    // Missing digits
    await assert.rejects(
      async () => {
        await auth.register('TestUser3', 'NoDigitsPasswordHere', 'TAG1', 'neu-anspach', testConsent);
      },
      (err: any) => err instanceof AuthValidationError
    );
  });

  await t.test('2. Registrierung: Erfolgreiche Registrierung mit gültigen Daten', async () => {
    const account = await auth.register(
      'HessenHeld',
      'GeheimesPasswort123',
      'HESS',
      'neu-anspach',
      testConsent
    );

    assert.ok(account.id.startsWith('acct_'));
    assert.equal(account.username, 'HessenHeld');
    assert.equal(account.clanTag, 'HESS');
    assert.equal(account.faction, 'neu-anspach');

    // Stored in SQLite
    const stored = await storage.getAccountById(account.id);
    assert.ok(stored);
    assert.equal(stored?.username, 'HessenHeld');
    assert.ok(stored?.passwordHash);
    assert.ok(stored?.passwordSalt);
  });

  await t.test('3. Registrierung: Duplikate von Benutzernamen werden abgewiesen (Conflict)', async () => {
    await assert.rejects(
      async () => {
        // Same username with different casing
        await auth.register(
          'hessenheld',
          'AnderesPasswort456',
          'DUPL',
          'wehrheim',
          testConsent
        );
      },
      (err: any) => err instanceof AuthConflictError
    );
  });

  await t.test('4. Login mit korrektem Passwort liefert PublicAccount', async () => {
    const verified = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    assert.ok(verified);
    assert.equal(verified?.username, 'HessenHeld');
  });

  await t.test('5. Login mit falschem Passwort liefert null (Timing Safe)', async () => {
    const verified = await auth.verifyCredentials('HessenHeld', 'FalschesPasswort999');
    assert.equal(verified, null);

    const nonExistent = await auth.verifyCredentials('UnbekannterUser999', 'Irgendwas12345');
    assert.equal(nonExistent, null);
  });

  await t.test('6. Session-Erstellung & Abruf über Token', async () => {
    const user = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    assert.ok(user);

    const sessionInfo = await auth.createSession(user!.id, 3600000);
    assert.ok(sessionInfo.token);
    assert.ok(sessionInfo.csrfToken);
    assert.ok(sessionInfo.expiresAt);

    // Retrieve account by session token
    const sessionData = await auth.getSession(sessionInfo.token);
    assert.ok(sessionData);
    assert.equal(sessionData?.account.username, 'HessenHeld');
    assert.equal(sessionData?.csrfToken, sessionInfo.csrfToken);
  });

  await t.test('7. Single Active Session: Neue Session widerruft ältere Sessions des Accounts', async () => {
    const user = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    const firstSession = await auth.createSession(user!.id, 3600000);
    const secondSession = await auth.createSession(user!.id, 3600000);

    // First session must now be revoked
    const firstLookup = await auth.getSession(firstSession.token);
    assert.equal(firstLookup, null);

    // Second session must be active
    const secondLookup = await auth.getSession(secondSession.token);
    assert.ok(secondLookup);
    assert.equal(secondLookup?.account.username, 'HessenHeld');
  });

  await t.test('8. Session-Ablauf: Abgelaufene Session wird nicht mehr akzeptiert', async () => {
    const user = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    // Session TTL negative (expired 1 second ago)
    const expiredSession = await auth.createSession(user!.id, -1000);
    const lookup = await auth.getSession(expiredSession.token);
    assert.equal(lookup, null);
  });

  await t.test('9. Logout / Session-Widerruf', async () => {
    const user = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    const session = await auth.createSession(user!.id, 3600000);

    await auth.revokeSession(session.token);
    const lookup = await auth.getSession(session.token);
    assert.equal(lookup, null);
  });

  await t.test('10. DSGVO Datenexport & Kontolöschung', async () => {
    const user = await auth.verifyCredentials('HessenHeld', 'GeheimesPasswort123');
    const exportData = await auth.exportAccountData(user!.id);
    assert.ok(exportData);
    assert.equal(exportData.username, 'HessenHeld');
    assert.equal(exportData.security.passwordAlgorithm, 'scrypt-pbkdf');
    // Ensure raw hash/salt is NOT in export
    assert.equal(exportData.passwordHash, undefined);

    // Deletion with wrong password fails
    const failDelete = await auth.deleteAccount(user!.id, 'WrongPassword123');
    assert.equal(failDelete, false);

    // Deletion with correct password succeeds
    const successDelete = await auth.deleteAccount(user!.id, 'GeheimesPasswort123');
    assert.equal(successDelete, true);

    const deletedLookup = await storage.getAccountById(user!.id);
    assert.equal(deletedLookup, null);
  });

  await t.test('11. Google OAuth Kontoerstellung & Wiederanmeldung (authenticateWithGoogle)', async () => {
    const firstAuth = await auth.authenticateWithGoogle({
      googleSub: 'google_12345',
      email: 'taunus@gmail.com',
      displayName: 'Taunus Google',
      clanTag: '61267',
      faction: 'neu-anspach',
    });

    assert.equal(firstAuth.isNewAccount, true);
    assert.equal(firstAuth.account.authProvider, 'google');
    assert.equal(firstAuth.account.email, 'taunus@gmail.com');
    assert.equal(firstAuth.account.clanTag, '61267');
    assert.equal(firstAuth.account.faction, 'neu-anspach');
    assert.ok(firstAuth.account.id.startsWith('acct_'));

    // Second login with same googleSub returns existing account and updates avatarUrl
    const secondAuth = await auth.authenticateWithGoogle({
      googleSub: 'google_12345',
      email: 'taunus@gmail.com',
      displayName: 'Taunus Google',
      avatarUrl: 'https://example.com/avatar.png',
    });

    assert.equal(secondAuth.isNewAccount, false);
    assert.equal(secondAuth.account.id, firstAuth.account.id);
    assert.equal(secondAuth.account.avatarUrl, 'https://example.com/avatar.png');

    // Password login against a Google-only account returns null (cannot be bypassed with empty or arbitrary password)
    const emptyPassAttempt = await auth.verifyCredentials(firstAuth.account.username, '');
    assert.equal(emptyPassAttempt, null);

    const randomPassAttempt = await auth.verifyCredentials(firstAuth.account.username, 'SomePassword123');
    assert.equal(randomPassAttempt, null);
  });

  await t.test('12. DSGVO Export & Kontolöschung für Google-Konten', async () => {
    const googleAuth = await auth.authenticateWithGoogle({
      googleSub: 'google_12345',
    });
    const googleAccountId = googleAuth.account.id;

    const exportData = await auth.exportAccountData(googleAccountId);
    assert.ok(exportData);
    assert.equal(exportData.authProvider, 'google');
    assert.equal(exportData.googleLinked, true);
    assert.ok(exportData.hostingAndProcessors);
    assert.ok(exportData.hostingAndProcessors.applicationHost.includes('Render'));
    assert.ok(exportData.hostingAndProcessors.databaseProvider.includes('Neon'));
    assert.ok(exportData.hostingAndProcessors.identityProvider.includes('Google'));

    // Deletion with wrong confirmation string fails
    const failDelete = await auth.deleteAccount(googleAccountId, 'FALSCH');
    assert.equal(failDelete, false);

    // Deletion with 'LÖSCHEN' succeeds
    const successDelete = await auth.deleteAccount(googleAccountId, 'LÖSCHEN');
    assert.equal(successDelete, true);

    const deletedLookup = await storage.getAccountById(googleAccountId);
    assert.equal(deletedLookup, null);
  });

  // Cleanup
  await storage.close();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});
