from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local test file
        file_path = "file://" + os.path.abspath("verification/test_ui.html")
        page.goto(file_path)

        # Wait for rendering
        page.wait_for_timeout(1000)

        # Take screenshot of wheel
        page.screenshot(path="verification/wheel_stage.png")

        # Re-render as Category stage in the same page for second screenshot
        page.evaluate("""
            const host = document.getElementById('host');
            const shadow = host.shadowRoot;
            const overlay = shadow.getElementById('brain-lock-overlay');
            overlay.innerHTML = '';

            const container = document.createElement('div');
            container.className = 'brain-lock-container';
            container.innerHTML = `
              <div class="brain-lock-header">
                <div class="modal-logo">🎯</div>
                <h1>Choose Your Subject</h1>
                <p>The choice is yours! Pick a subject for today.</p>
              </div>
              <div class="brain-lock-content">
                <div class="category-selection-container">
                  <div class="category-card academic">
                    <div class="category-icon">📚</div>
                    <div class="category-title">Academic</div>
                    <div class="category-desc">Math, Science, History, and more!</div>
                  </div>
                  <div class="category-card youtube">
                    <div class="category-icon">📺</div>
                    <div class="category-title">YouTube</div>
                    <div class="category-desc">Watch a short video and learn!</div>
                  </div>
                  <div class="category-card ipa">
                    <div class="category-icon">🗣️</div>
                    <div class="category-title">IPA</div>
                    <div class="category-desc">Master phonetic pronunciations!</div>
                  </div>
                </div>
              </div>
            `;
            overlay.appendChild(container);
        """)

        page.wait_for_timeout(1000)
        page.screenshot(path="verification/category_stage.png")

        browser.close()

if __name__ == "__main__":
    run()
