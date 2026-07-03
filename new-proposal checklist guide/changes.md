### Phase 1: The Inescapable Interruption Engine
- Added `scripting` permission to `manifest.json`.
- Updated `lockBrowser` alarm interval to 30 minutes in `background.js`.
- Implemented `muteAndPauseMedia` function in `background.js` to pause and mute `<video>` and `<audio>` elements.
- Updated `lockBrowser` alarm listener to:
    - Query for the active tab and all audible tabs.
    - Inject `muteAndPauseMedia` into those tabs using `chrome.scripting.executeScript`.
    - Handle restricted URLs (e.g., `chrome://`, `chrome-extension://`, `https://chrome.google.com/webstore`) to prevent injection errors.
- Verified that message passing triggers the UI overlay from the background script (pre-existing, but integrated with the new logic).

### Phase 2: Shadow DOM & Cosmic Toybox UI
- Implemented Shadow DOM in `content.js` to ensure total CSS isolation for the lock screen.
- Modified `manifest.json` to move `lock.css` from `content_scripts` to `web_accessible_resources`, allowing it to be injected manually into the Shadow DOM.
- Revamped the UI with a "Cosmic Toybox" aesthetic:
    - Added a full-screen backdrop with blurred, radial-gradient cosmic effects.
    - Built a central modal with glassmorphism (translucent background, backdrop-blur), rounded corners, and glowing borders.
    - Added floating, CSS-animated background particles.
    - Created a new modal header with a logo, title, and metadata tags (category, difficulty).
    - Implemented pop-in and fade-out CSS animations for the modal.
- Ensured full responsiveness for the UI using media queries.
- Implemented a smooth UI teardown function (`removeLockScreen`) that handles the fade-out animation before removing the Shadow DOM host from the document.
- Performed a z-index audit and added `!important` flags to critical overlay styles to ensure it stays on top of all websites.
