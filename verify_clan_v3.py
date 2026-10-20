from playwright.sync_api import sync_playwright
import time
import random

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # Wait for login/register screen
            page.wait_for_selector('input[id="auth-username"]', timeout=5000)

            # Click the 'Registrieren' tab
            page.click('text="Registrieren"')
            time.sleep(1)

            username = f"TestPlayer{random.randint(1000, 9999)}"
            print(f"Registering user: {username}")

            page.fill('input[id="auth-username"]', username)
            page.fill('input[id="auth-clan-tag"]', f"T{random.randint(10, 99)}")
            page.fill('input[id="auth-password"]', "Password123")
            page.fill('input[id="auth-confirm-password"]', "Password123")
            page.check('input[type="checkbox"]')

            # Click Register button
            page.click('text="Konto registrieren & Spiel starten"')

            # Wait for main screen to load (wait for Einsatz starten button)
            print("Waiting for main screen...")
            page.wait_for_selector('text="Einsatz starten"', timeout=10000)
            time.sleep(2)

            # Now find the "Mein Clan" button in the TopBar and click it
            print("Clicking 'Mein Clan' tab...")
            page.evaluate('''() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const clanBtn = buttons.find(b => b.textContent && b.textContent.includes('Mein Clan'));
                if (clanBtn) clanBtn.click();
            }''')

            # Wait for Clan Hub to load
            time.sleep(2)

            print("Taking screenshot of Clan Hub...")
            page.screenshot(path="/home/jules/verification/screenshots/clan_hub_empty.png")

            print("Creating a clan...")
            page.fill('input[placeholder="Vollständiger Name"]', f"Clan{random.randint(100, 999)}")
            page.fill('input[placeholder="TAG"]', f"TAG{random.randint(1, 9)}")
            page.click('text="Clan Gründen"')

            time.sleep(3)

            print("Taking screenshot of active Clan Hub...")
            page.screenshot(path="/home/jules/verification/screenshots/clan_hub_active.png")

            print("Sending chat message...")
            page.click('text="Clan Chat"')
            time.sleep(1)
            page.fill('input[placeholder="Nachricht an den Clan..."]', "Hello from Playwright!")
            page.keyboard.press("Enter")

            time.sleep(2)

            print("Taking screenshot of chat...")
            page.screenshot(path="/home/jules/verification/screenshots/clan_hub_chat.png")

            print("Verification complete!")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="/home/jules/verification/screenshots/error_state.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
