import os
import time
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Access via localhost server to avoid fetch issues
        page.goto("http://localhost:8000/verification/test_phase4.html")

        # Wait for groups to load
        page.wait_for_selector(".type-group")

        # Define types to capture
        types = [
            'multiple-choice',
            'true-false',
            'short-answer',
            'fill-in-the-blank',
            'odd-one-out',
            'spell-it-out',
            'word-scramble'
        ]

        for q_type in types:
            print(f"Testing {q_type}...")
            # Click the first button in the group for this type
            selector = f"//div[contains(@class, 'type-group')][span[text()='{q_type.upper()}']]/button[1]"
            page.wait_for_selector(selector, timeout=5000)
            page.click(selector)

            # Wait for overlay (Shadow DOM)
            page.wait_for_selector("#brain-lock-overlay", timeout=5000)

            # Wait a bit for animations
            time.sleep(1)

            # Take screenshot
            page.screenshot(path=f"/home/jules/verification/{q_type}.png")
            print(f"Captured {q_type}.png")

            # Reload to clear
            page.reload()
            page.wait_for_selector(".type-group")

        browser.close()

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")
    run_verification()
