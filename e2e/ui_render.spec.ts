import { test, expect } from '@playwright/test';

test.describe('Neu-Anspach Royale - Complete UI & Interaction Suite', () => {
  const testUsername = `Agent_${Date.now().toString().slice(-6)}`;
  const testPassword = 'Password123!';
  const testClanTag = 'TAG1';

  test('1. AuthScreen renders with premium UI craft, handles tab toggling and validation', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Check title & branding
    await expect(page).toHaveTitle(/Neu-Anspach 61267: Taunus Battle Royale & Tycoon/i);
    await expect(page.getByText('61267 NEU-ANSPACH')).toBeVisible();

    // Check tabs
    const loginTab = page.getByRole('tab', { name: /Anmelden/i });
    const registerTab = page.getByRole('tab', { name: /Registrieren/i });
    await expect(loginTab).toBeVisible();
    await expect(registerTab).toBeVisible();

    // Switch to Register tab — verify Clan selection is removed at registration and Clan-Börse hint is shown
    await registerTab.click();
    await expect(page.locator('#auth-clan-tag')).toHaveCount(0);
    await expect(page.getByTestId('auth-clan-boerse-hint')).toBeVisible();
    await expect(page.locator('#auth-confirm-password')).toBeVisible();

    // Verify empty submission triggers validation error
    const submitBtn = page.getByRole('button', { name: /Konto registrieren & Spiel starten|Anmelden & Spiel starten/i });
    await submitBtn.click();
    await expect(page.getByRole('alert')).toBeVisible();

    // No fatal console errors
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('404') &&
        !err.includes('401') &&
        !err.includes('WebSocket') &&
        !err.includes('Failed to load resource')
    );
    expect(fatalErrors).toEqual([]);
  });

  test('2. Complete Operator registration, TopBar HUD rendering, and Full Tab Navigation', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Switch to Register
    await page.getByRole('tab', { name: /Registrieren/i }).click();

    // Fill form (no clan tag at registration)
    await page.fill('#auth-username', testUsername);
    await page.fill('#auth-password', testPassword);
    await page.fill('#auth-confirm-password', testPassword);

    // Accept legal consent checkbox
    const legalCheckbox = page.locator('input[type="checkbox"]');
    await legalCheckbox.check();

    // Submit registration
    await page.getByRole('button', { name: /Konto registrieren & Spiel starten/i }).click();

    // Wait for authentication and TopBar to appear
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

    // Verify TopBar elements
    await expect(page.getByText('NEU-ANSPACH').first()).toBeVisible();
    await expect(page.getByText('ROYALE').first()).toBeVisible();
    await expect(page.getByText('NAT').first()).toBeVisible();
    await expect(page.getByText(testUsername).first()).toBeVisible();

    // --- TAB 1: Hauptmenü (Home Dashboard) ---
    await expect(page.getByText('EINSATZRAUM:').or(page.getByText('BÜRGERWEHR-RADAR')).first()).toBeVisible();

    // Verify Arena Quick-Deploy cards exist
    await expect(page.getByText(/Freilichtmuseum Hessenpark|Marktplatz/i).first()).toBeVisible();

    // --- TAB 2: Waffenschmiede (Gunsmith) ---
    const gunsmithNav = page.locator('header').getByRole('button', { name: /Waffenschmiede/i });
    if (await gunsmithNav.isVisible()) {
      await gunsmithNav.click();
      await expect(page.getByText(/Waffen-Arsenal|Arsenal V5|Waffenschmiede/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Bembel|Taunus-Flinte|Kelter/i).first()).toBeVisible();
    }

    // --- TAB 3: Skilltree ---
    const skilltreeNav = page.locator('header').getByRole('button', { name: /Skilltree/i });
    if (await skilltreeNav.isVisible()) {
      await skilltreeNav.click();
      await expect(page.getByText(/Spezialisierung|Skilltree|Operator-Skilltree/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Angriff|Kampf|Verteidigung|Taktik/i).first()).toBeVisible();
    }

    // --- TAB 4: Mein Clan (Clan Hub & Clan-Börse) ---
    const clanNav = page.locator('header').getByRole('button', { name: /Mein Clan/i });
    if (await clanNav.isVisible()) {
      await clanNav.click();
      await expect(page.getByText(/Squad|Clan-Verwaltung|Clanzentrale|Clan gründen/i).first()).toBeVisible({ timeout: 5000 });
      // Verify Clan-Börse shows seeded clans (e.g. HESSEN)
      await expect(page.getByText(/Hessenpark Wächter|Clan-Börse/i).first()).toBeVisible({ timeout: 5000 });
    }

    // --- TAB 5: Maps & Tycoon ---
    const tycoonNav = page.locator('header').getByRole('button', { name: /Maps & Tycoon/i });
    if (await tycoonNav.isVisible()) {
      await tycoonNav.click();
      await expect(page.getByText(/Kommunalhaushalt|Stadtverwaltung|Tycoon/i).first()).toBeVisible({ timeout: 5000 });
    }

    // --- TAB 6: Live-Leaderboard ---
    const leaderboardNav = page.locator('header').getByRole('button', { name: /Live-Leaderboard/i });
    if (await leaderboardNav.isVisible()) {
      await leaderboardNav.click();
      await expect(page.getByText(/Bestenliste|Echtzeit-Bestenliste|Derby/i).first()).toBeVisible({ timeout: 5000 });
    }

    // --- TAB 7: Freunde-Lobby ---
    const multiplayerNav = page.locator('header').getByRole('button', { name: /Freunde-Lobby/i });
    if (await multiplayerNav.isVisible()) {
      await multiplayerNav.click();
      await expect(page.getByText(/Freunde-Netzwerk|Squad-Lobbys|Raum/i).first()).toBeVisible({ timeout: 5000 });
    }

    // Return to Hauptmenü
    const homeNav = page.locator('header').getByRole('button', { name: 'Hauptmenü', exact: true });
    if (await homeNav.isVisible()) {
      await homeNav.click();
      await expect(page.locator('header')).toBeVisible();
    }

    // Verify no fatal console errors occurred during the entire user flow
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('404') &&
        !err.includes('WebSocket') &&
        !err.includes('Failed to load resource')
    );
    expect(fatalErrors).toEqual([]);
  });

  test('3. Google Sign-In flow & Legal Modal (Impressum, Render, Neon SQL & Google OAuth) on AuthScreen', async ({ page }) => {
    await page.goto('/');

    // Verify the "Mit Google anmelden" button is visible on AuthScreen
    const googleBtn = page.getByTestId('google-auth-button').or(page.getByRole('button', { name: /Mit Google/i })).first();
    await expect(googleBtn).toBeVisible();

    // Click the Legal / Datenschutz button on AuthScreen and verify LegalModal opens
    const legalBtn = page.getByRole('button', { name: /Impressum|Datenschutz|Rechtliches/i }).first();
    await expect(legalBtn).toBeVisible();
    await legalBtn.click();

    const legalDialog = page.getByRole('dialog');
    await expect(legalDialog).toBeVisible();
    await expect(legalDialog.getByText(/Render/i).first()).toBeVisible();
    await expect(legalDialog.getByText(/Neon/i).first()).toBeVisible();
    await expect(legalDialog.getByText(/Google/i).first()).toBeVisible();
    await expect(legalDialog.getByText(/Impressum/i).first()).toBeVisible();

    // Close the LegalModal
    const closeLegalBtn = legalDialog.getByRole('button', { name: /Schließen|Rechtliche Hinweise schließen/i }).first();
    await closeLegalBtn.click();
    await expect(legalDialog).toBeHidden();

    // Trigger the Google Sign-In flow in dev/test mode
    await googleBtn.click();

    const devQuickLoginBtn = page.getByTestId('google-dev-quick-login').or(page.getByTestId('google-dev-submit')).first();
    if (await devQuickLoginBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await devQuickLoginBtn.click();
    }

    // Verify user is authenticated and reaches the main dashboard
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
  });

  test('4. Mobile Redesign: 5-Tab Dock, Tactical Patrol combat dispatch, and Mobile Hub navigation', async ({ page }) => {
    // Set smartphone viewport (e.g. iPhone / Android portrait) to test mobile redesign layout
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileUsername = `Mob_${Date.now().toString().slice(-6)}`;
    await page.goto('/');

    // Register user (no clan tag at registration)
    await page.getByRole('tab', { name: /Registrieren/i }).click();
    await page.fill('#auth-username', mobileUsername);
    await page.fill('#auth-password', 'MobilePass123!');
    await page.fill('#auth-confirm-password', 'MobilePass123!');
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: /Konto registrieren & Spiel starten/i }).click();

    // Verify Mobile App Header
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('NEU-ANSPACH').first()).toBeVisible();
    await expect(page.getByText('ROYALE').first()).toBeVisible();

    // Verify 5-Tab Mobile Dock
    const dock = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(dock).toBeVisible();
    const tabZentrale = dock.getByRole('button', { name: 'Zentrale' });
    const tabEinsatz = dock.getByRole('button', { name: 'Einsatz' });
    const tabArsenal = dock.getByRole('button', { name: 'Arsenal' });
    const tabSkills = dock.getByRole('button', { name: 'Skills' });
    const tabMehr = dock.getByRole('button', { name: 'Mehr' });

    await expect(tabZentrale).toBeVisible();
    await expect(tabEinsatz).toBeVisible();
    await expect(tabArsenal).toBeVisible();
    await expect(tabSkills).toBeVisible();
    await expect(tabMehr).toBeVisible();

    // 1. Test Tab "Einsatz" & Tactical Patrol Dispatch
    await tabEinsatz.click();
    await expect(page.getByText('Taktische Zentrale')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Einsatzgebiete & Streifen')).toBeVisible();

    // Dispatch patrol in Hessenpark
    const streifeBtn = page.getByRole('button', { name: /Streife/i }).first();
    await expect(streifeBtn).toBeVisible();
    await streifeBtn.click();

    // Verify combat loot report appears
    await expect(page.getByText(/Wehrheimer Späher.*abgewehrt/i)).toBeVisible({ timeout: 4000 });
    await expect(page.getByText(/NAT Beute/i)).toBeVisible();

    // 2. Test Tab "Arsenal"
    await tabArsenal.click();
    await expect(page.getByText(/Waffen-Arsenal|Arsenal V5|Waffenschmiede/i).first()).toBeVisible({ timeout: 5000 });

    // 3. Test Tab "Skills"
    await tabSkills.click();
    await expect(page.getByText(/Spezialisierung|Skilltree|Operator-Skilltree/i).first()).toBeVisible({ timeout: 5000 });

    // 4. Test Tab "Mehr" (Mobile Hub Drawer)
    await tabMehr.click();
    await expect(page.getByText('Kommando-Hub').or(page.getByText('Weitere Bereiche')).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Mein Clan').first()).toBeVisible();
    await expect(page.getByText('Maps & Tycoon').first()).toBeVisible();
    await expect(page.getByText('Live-Bestenliste').first()).toBeVisible();
    await expect(page.getByText('Freunde-Lobby').first()).toBeVisible();

    // Jump to Clan Hub via Hub card
    await page.getByRole('button', { name: /Mein Clan/i }).first().click();
    await expect(page.getByText(/Clan-Verwaltung|Squad|Clanzentrale|Clan gründen/i).first()).toBeVisible({ timeout: 5000 });

    // Back button in Clan view to Hub
    await page.getByRole('button', { name: /Zurück zum Hub/i }).click();
    await expect(page.getByText('Weitere Bereiche').first()).toBeVisible({ timeout: 5000 });

    // Return to Zentrale via Dock
    await tabZentrale.click();
    await expect(page.getByText('BÜRGERWEHR-RADAR ONLINE').first()).toBeVisible({ timeout: 5000 });
  });
});
