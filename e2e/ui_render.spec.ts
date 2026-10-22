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

    // Switch to Register tab
    await registerTab.click();
    await expect(page.locator('#auth-clan-tag')).toBeVisible();
    await expect(page.locator('#auth-confirm-password')).toBeVisible();

    // Verify empty submission triggers validation error
    const submitBtn = page.getByRole('button', { name: /Konto registrieren|Anmelden/i });
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

    // Fill form
    await page.fill('#auth-username', testUsername);
    await page.fill('#auth-clan-tag', testClanTag);
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

    // --- TAB 4: Mein Clan (Clan Hub) ---
    const clanNav = page.locator('header').getByRole('button', { name: /Mein Clan/i });
    if (await clanNav.isVisible()) {
      await clanNav.click();
      await expect(page.getByText(/Squad|Clan-Verwaltung|Clanzentrale|Clan gründen/i).first()).toBeVisible({ timeout: 5000 });
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
});
