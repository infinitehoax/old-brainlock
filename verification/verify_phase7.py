import asyncio
import os
import http.server
import socketserver
import threading
from playwright.async_api import async_playwright

PORT = 8011
DIRECTORY = os.getcwd()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, *kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

async def verify_phase7():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    await asyncio.sleep(2)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto(f"http://127.0.0.1:{PORT}/verification/test_phase4.html")

        await page.evaluate("""
            window.chrome = window.chrome || {};
            window.chrome.runtime = {
                getURL: (path) => "../" + path,
                sendMessage: (msg, cb) => {
                    if (msg.action === "getQuestion") {
                        if (cb) cb({ isLocked: true, question: { id: 1, type: 'multiple-choice', question: 'Test?', answers: [{text: 'A'}], correctAnswer: 'A', category: 'Math' } });
                    } else if (msg.action === "checkAnswer") {
                        if (cb) cb({
                            correct: true,
                            feedback: 'Correct!',
                            xpEarned: 120,
                            newTotalXP: 1120,
                            streak: 3,
                            multiplier: 1.5
                        });
                    }
                },
                onMessage: { addListener: () => {} }
            };
            window.chrome.storage = {
                local: {
                    get: (keys, cb) => {
                         const result = { dailyStreak: 3 };
                         if (cb) cb(result);
                         return Promise.resolve(result);
                    },
                    set: (data, cb) => {
                        if (cb) cb();
                        return Promise.resolve();
                    }
                }
            };
        """)

        print("Testing Question Rendering with Timer...")
        await page.evaluate("showLockScreen({ id: 1, type: 'multiple-choice', question: 'Test?', answers: [{text: 'A'}], correctAnswer: 'A', category: 'Math' })")
        await asyncio.sleep(2)

        timer = page.locator(".timer-container")
        timer_exists = await timer.is_visible()
        print(f"Timer visible: {timer_exists}")

        streak = page.locator(".streak-badge")
        streak_exists = await streak.is_visible()
        print(f"Streak badge visible: {streak_exists}")

        await page.locator(".answer-option").first.click()
        await page.locator("#brain-lock-submit").click()

        await asyncio.sleep(2)

        result_title = page.locator(".result-title")
        result_title_visible = await result_title.is_visible()
        print(f"Result Screen Title visible: {result_title_visible}")

        xp_amount = page.locator(".xp-amount")
        xp_amount_visible = await xp_amount.is_visible()
        print(f"XP Amount visible: {xp_amount_visible}")

        confetti = page.locator("#confetti-canvas")
        confetti_exists = await confetti.is_visible()
        print(f"Confetti Canvas exists: {confetti_exists}")

        await page.screenshot(path="verification/phase7_verification.png")
        print("Captured verification/phase7_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_phase7())
