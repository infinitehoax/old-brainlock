import asyncio
from playwright.sync_api import sync_playwright
import os
import time
import subprocess

def run_verification():
    # Start a simple HTTP server
    server = subprocess.Popen(["python3", "-m", "http.server", "8000"])
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            page.goto("http://localhost:8000/verification/test_phase4.html")
            time.sleep(2)

            # Use IDs from the tail output
            test_ids = ["6001", "6002", "7001", "7002"]

            for q_id in test_ids:
                print(f"Testing Question ID {q_id}...")
                # Try finding button by text content or matching exactly
                button = page.get_by_role("button", name=f"ID: {q_id}")
                if button.count() > 0:
                    button.first.click()
                    time.sleep(2)

                    if q_id == "7001":
                        print("Interacting with IPA keyboard...")
                        # Just take a screenshot before interacting too much
                        page.screenshot(path=f"verification/phase6_id_{q_id}_pre.png", full_page=True)

                        # Try a simpler symbol first
                        ipa_keys = ["p", "b", "t"]
                        for key in ipa_keys:
                            print(f"Clicking IPA key: {key}")
                            try:
                                k_locator = page.locator("#brain-lock-host").get_by_role("button", name=key, exact=True)
                                k_locator.click(timeout=5000)
                            except Exception as e:
                                print(f"Could not click {key}: {e}")
                            time.sleep(0.5)

                        time.sleep(1)

                    page.screenshot(path=f"verification/phase6_id_{q_id}.png", full_page=True)
                    print(f"Captured verification/phase6_id_{q_id}.png")

                    page.reload()
                    time.sleep(1)
                else:
                    print(f"Button for ID {q_id} not found!")

            browser.close()
    finally:
        server.terminate()

if __name__ == "__main__":
    run_verification()
