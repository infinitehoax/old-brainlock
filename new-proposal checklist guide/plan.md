# Checkmark the ones that has been completed and log your progress and the things you changed in the changes.md (Yes, I'm talking to you, Jules)

### Phase 1: The Inescapable Interruption Engine
- [x] - Day 1: Initialize MV3 `manifest.json` with alarms, tabs, and scripting permissions.
- [x] - Day 2: Set up the background service worker (`content.js` / `background.js`) to handle alarms.
- [x] - Day 3: Implement the core 30-minute repeating timer using `chrome.alarms`.
- [x] - Day 4: Write tab-querying logic to identify currently active and audible tabs.
- [x] - Day 5: Create the media-muter script to pause all `<video>` and `<audio>` tags.
- [x] - Day 6: Create the media-muter script to mute all media (preventing auto-play loopholes).
- [x] - Day 7: Inject the media-muter script into the active tab exactly when the alarm fires.
- [x] - Day 8: Establish message passing to trigger the UI overlay from the background script.
- [x] - Day 9: Add edge-case handling to prevent injection on restricted `chrome://` URLs.
- [x] - Day 10: Perform end-to-end testing of the timer triggering the pause/mute function.

### Phase 2: Shadow DOM & Cosmic Toybox UI
- [x] - Day 11: Set up Shadow DOM in your content script to ensure total CSS isolation.
- [x] - Day 12: Build the full-screen backdrop UI overlay.
- [x] - Day 13: Add the blurred, radial-gradient aesthetic to the backdrop.
- [x] - Day 14: Build the central modal container (`lock.css`) with rounded corners and glowing borders.
- [x] - Day 15: Create floating, CSS-animated background particles inside the overlay.
- [x] - Day 16: Build the modal header (Logo, Brain emoji, and metadata placeholders).
- [x] - Day 17: Implement pop-in and fade-out CSS animations for the modal.
- [x] - Day 18: Ensure the overlay is fully responsive for different screen sizes.
- [x] - Day 19: Build the UI teardown function (removing the Shadow DOM smoothly).
- [x] - Day 20: Test overlay rendering over complex sites (YouTube, heavy web apps) to ensure it stays on top.

### Phase 3: The Spinning Wheel & Category Engine
- [x] - Day 21: Set up an HTML5 Canvas element inside the overlay for the Spinning Wheel.
- [x] - Day 22: Draw the wheel segments mathematically (You Pick vs. System Picks).
- [x] - Day 23: Apply vibrant colors, text styling, and shadow glows to the canvas wheel.
- [x] - Day 24: Code the wheel physics (random initial velocity, friction, and deceleration).
- [x] - Day 25: Code the logic to calculate the final resting angle and declare the winner.
- [x] - Day 26: Implement local storage logic to check if this is the "first break of the day".
- [x] - Day 27: Design the 3 Category Selection Cards (Academic, YouTube, IPA).
- [x] - Day 28: Add hover-lift animations and glowing borders to the category cards.
- [x] - Day 29: Write the logic for the "System Picks" outcome (randomly assigning a category).
- [x] - Day 30: Save the selected category to local storage so it locks in for the rest of the day.

### Phase 4: Core Question Engine & Text Interactions
- [x] - Day 31: Build the internal JSON parser to read your local question bank (the one gotten from periodicly pinging this GitHub repo to fetch the latest).
- [x] - Day 32: Create a central Question Renderer Factory to display different component types.
- [x] - Day 33: Build the Multiple Choice UI component.
- [x] - Day 34: Add visual states (selected, correct, wrong) to Multiple Choice buttons.
- [x] - Day 35: Build the True/False component.
- [x] - Day 36: Build the Short Answer text input component.
- [x] - Day 37: Implement fuzzy-matching validation for Short Answer (case-insensitive, substrings).
- [x] - Day 38: Build the Fill-in-the-Blank component logic.
- [x] - Day 39: Map `___` in strings to inline HTML text inputs for Fill-in-the-Blank.
- [x] - Day 40: Build the Odd One Out UI component.
- [x] - Day 41: Build the Spell It Out component.
- [x] - Day 42: Write the logic to generate a pool of random letters plus the correct answer letters.
- [x] - Day 43: Build the Word Scramble component.
- [x] - Day 44: Add click-to-move tile logic for Word Scramble.
- [x] - Day 45: Connect all Phase 4 basic question types to a unified validation function.

### Phase 5: Advanced Drag & Drop Interactions
- [x] - Day 46: Set up HTML5 Drag and Drop event listeners inside the Shadow DOM.
- [x] - Day 47: Build the Organize Tags component UI (tag pool and buckets).
- [x] - Day 48: Implement dragstart, dragover, and drop logic for Organize Tags.
- [x] - Day 49: Build the Categorize Items component (reusing tag logic for categories).
- [x] - Day 50: Build the Sequence Order component UI (draggable list rows).
- [x] - Day 51: Implement list reordering logic and update array order on drop.
- [x] - Day 52: Build the Connect Terms component UI (two columns).
- [x] - Day 53: Implement click-to-match logic between left and right columns.
- [x] - Day 54: Add CSS animations (shake for wrong match, green glow for correct match).
- [x] - Day 55: Finalize validation state updates for all advanced drag-and-drop types.

### Phase 6: YouTube Learner & IPA Transcriber Pillars
- [x] - Day 56: Build the YouTube iframe container inside the question modal.
- [x] - Day 57: Configure the iframe API (no-cookie domain, zero autoplay, zero related videos).
- [x] - Day 58: Map `videoId` from the JSON to dynamically inject into the iframe.
- [x] - Day 59: Ensure all 13 question types render correctly beneath the YouTube video embed.
- [x] - Day 60: Design the IPA Transcriber custom on-screen keyboard UI.
- [x] - Day 61: Populate the keyboard with Consonant and Vowel phonetic symbols.
- [x] - Day 62: Add Diphthongs and Stress Mark sections to the IPA keyboard.
- [x] - Day 63: Build the custom input display box with a blinking cursor.
- [x] - Day 63: Build the custom input display box with a blinking cursor.
- [x] - Day 64: Write custom backspace logic to handle multi-character IPA symbols (e.g., `tʃ`).
- [x] - Day 65: Connect the IPA keyboard output to the validation engine.

### Phase 7: Gamification, Streaks, and Confetti
- [x] - Day 66: Build the visual SVG timer ring component for the top bar.
- [x] - Day 67: Implement the strict 2-minute countdown interval.
- [x] - Day 68: Animate the SVG timer stroke to change color from green to yellow to red.
- [x] - Day 69: Write logic to auto-submit the current answer if the timer reaches zero.
- [x] - Day 70: Build the XP calculation engine (Base XP + early-answer Time Bonus).
- [x] - Day 71: Create daily streak tracking logic in local storage (checking date rollovers).
- [x] - Day 72: Apply 1.5x and 2.0x XP multipliers for 3-day and 7-day streaks.
- [x] - Day 73: Update the modal header to display the current streak fire badge.
- [x] - Day 74: Build the Result Screen UI (Titles, XP amount, Explanation text).
- [x] - Day 75: Animate the XP progress bar filling up on correct answers.
- [x] - Day 76: Set up an independent HTML5 Canvas covering the viewport for Confetti.
- [x] - Day 77: Write particle physics logic (gravity, velocity, alpha decay) for confetti.
- [x] - Day 78: Add random shapes (circles, squares, strips) and colors to the confetti.
- [x] - Day 79: Hook the confetti burst exclusively to the correct-answer trigger.
- [x] - Day 80: Populate an array of randomized encouraging titles ("Brilliant!", "Superstar!").
- [x] - Day 81: Populate randomized failure messages ("Almost there!", "Keep going!").
- [x] - Day 82: Implement smooth screen transitions between the Question and Result screens.
- [x] - Day 83: Program the "Next Question" logic to render a fresh challenge.
- [x] - Day 84: Program the "I'm Done" button to dismantle the UI and unpause background media.
- [x] - Day 85: Perform a z-index audit to ensure Confetti renders over the modal, and the modal renders over the site.

### Phase 8: Parent Dashboard & Controls
- [x] - Day 86: Convert your existing `options.html` / `popup.html` into the Parent Dashboard UI.
- [x] - Day 87: Apply the global "Cosmic Toybox" font and color aesthetic to the popup menu.
- [x] - Day 88: Write logic to fetch and display "Breaks Today" stats from local storage.
- [x] - Day 89: Write logic to fetch and display "Lifetime Total Breaks".
- [x] - Day 90: Display the currently locked-in daily category on the dashboard.
- [x] - Day 91: Create the interval configuration number input (clamped between 5 and 120 minutes).
- [x] - Day 92: Write background logic to clear and reset the alarm immediately when the interval is changed.
- [x] - Day 93: Add the "Test Break Now" button to the popup UI.
- [x] - Day 94: Write message-passing logic to force a break on the active tab when the test button is clicked.
- [x] - Day 95: Add error handling for the test button if the parent is on an un-injectable tab (like the Chrome Web Store).

### Phase 9: Polish, Cleanup, & Deployment
- [ ] - Day 96: Perform a complete audit of the midnight rollover logic (resetting daily stats/categories properly).
- [ ] - Day 97: Refactor Python file (`cool.py`) if it plays a role, or remove it if strictly going MV3 JS.
- [ ] - Day 98: Thorough cross-browser testing (Chrome, Brave, Edge).
- [ ] - Day 99: Final bug hunting (Memory leaks, ensuring media un-pauses reliably after a break).
- [ ] - Day 100: Update `manifest.json` versions, trigger your `.github/workflows/package.yml`, and launch the extension!
