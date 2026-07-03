### Phase 1: The Inescapable Interruption Engine
- Added `scripting` permission to `manifest.json`.
- Updated `lockBrowser` alarm interval to 30 minutes in `background.js`.
- Implemented `muteAndPauseMedia` function in `background.js` to pause and mute `<video>` and `<audio>` elements.
- Updated `lockBrowser` alarm listener to:
    - Query for the active tab and all audible tabs.
    - Inject `muteAndPauseMedia` into those tabs using `chrome.scripting.executeScript`.
    - Handle restricted URLs (e.g., `chrome://`, `chrome-extension://`, `https://chrome.google.com/webstore`) to prevent injection errors.
- Verified that message passing triggers the UI overlay from the background script (pre-existing, but integrated with the new logic).
