import asyncio
from playwright.sync_api import sync_playwright
import os
import time

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Start local server or assume it's running
        page.goto("http://localhost:8000/verification/test_phase4.html")
        time.sleep(2)

        types = ["organize-tags", "categorize-items", "sequence-order", "connect-terms"]

        for q_type in types:
            print(f"Testing {q_type}...")
            # Click the button for the first question of this type
            # In test_phase4.html, types are grouped in div.type-group
            # Find the group with the label for the type
            group = page.locator(f"div.type-group:has(span.type-label:text-is('{q_type.upper()}'))")
            group.locator("button").first.click()

            time.sleep(1)
            # Take screenshot of the whole page instead of just the host
            page.screenshot(path=f"verification/{q_type}.png")
            print(f"Captured {q_type}.png")

            # Refresh to clear the state for the next type
            page.reload()
            time.sleep(1)

        browser.close()

if __name__ == "__main__":
    run_verification()
