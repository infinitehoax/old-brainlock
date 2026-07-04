import asyncio
from playwright.async_api import async_playwright
import os
import json

async def verify_phase8():
    async with async_playwright() as p:
        # Path to the extension
        extension_path = os.getcwd()

        # Launch browser with extension
        browser = await p.chromium.launch_persistent_context(
            user_data_dir="/tmp/playwright_test",
            headless=False,
            args=[
                f"--disable-extensions-except={extension_path}",
                f"--load-extension={extension_path}",
            ],
        )

        # Give it a moment to load the extension
        await asyncio.sleep(2)

        # Get extension ID
        extension_id = None
        # We can find it from the targets or by visiting chrome://extensions
        background_pages = browser.service_workers
        if background_pages:
            url = background_pages[0].url
            extension_id = url.split('/')[2]
            print(f"Detected Extension ID: {extension_id}")

        if not extension_id:
            print("Could not detect extension ID. Aborting.")
            await browser.close()
            return

        page = await browser.new_page()

        # 1. Verify Parent Dashboard (popup.html)
        popup_url = f"chrome-extension://{extension_id}/popup.html"
        await page.goto(popup_url)
        await page.wait_for_selector("h1")

        # Take screenshot of Dashboard
        await page.screenshot(path="verification/phase8_dashboard.png")
        print("Captured Phase 8 Dashboard screenshot.")

        # Check for stats
        breaks_today = await page.inner_text("#breaksToday")
        lifetime_breaks = await page.inner_text("#lifetimeBreaks")
        print(f"Stats: Breaks Today: {breaks_today}, Lifetime: {lifetime_breaks}")

        # Check Interval Input
        interval_input = await page.query_selector("#intervalInput")
        current_val = await interval_input.get_attribute("value")
        print(f"Current Interval: {current_val}")

        await interval_input.fill("45")
        await interval_input.dispatch_event("change")
        print("Updated interval to 45.")

        # 2. Verify Options Page
        options_url = f"chrome-extension://{extension_id}/options.html"
        await page.goto(options_url)
        await page.wait_for_selector("h1")
        await page.screenshot(path="verification/phase8_options.png")
        print("Captured Phase 8 Options screenshot.")

        # 3. Verify "Test Break Now" (Requires a normal page to inject into)
        test_page = await browser.new_page()
        await test_page.goto("https://www.google.com")
        await test_page.wait_for_load_state("networkidle")

        await page.goto(popup_url)
        await test_page.bring_to_front()

        await page.bring_to_front()
        await page.click("#testBtn")
        print("Clicked 'Test Break Now' button.")

        # Wait a bit and check if google.com has the overlay
        await asyncio.sleep(5)
        await test_page.bring_to_front()

        # Check for Shadow DOM host - based on grep it seems to be in a shadow root of a host
        # Let's find the host. Usually it's a div added to body.
        # I'll check for any shadow root on the page.
        overlay_exists = await test_page.evaluate("""
            () => {
                const hosts = document.querySelectorAll('*');
                for (const host of hosts) {
                    if (host.shadowRoot && host.shadowRoot.getElementById('brain-lock-overlay')) {
                        return true;
                    }
                }
                return false;
            }
        """)
        print(f"Overlay injected on google.com: {overlay_exists}")

        if overlay_exists:
            await test_page.screenshot(path="verification/phase8_test_break.png")
            print("Captured Phase 8 Test Break injection screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_phase8())
