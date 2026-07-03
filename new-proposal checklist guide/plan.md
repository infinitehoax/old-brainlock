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
- [ ] - Day 21: Set up an HTML5 Canvas element inside the overlay for the Spinning Wheel.
- [ ] - Day 22: Draw the wheel segments mathematically (You Pick vs. System Picks).
- [ ] - Day 23: Apply vibrant colors, text styling, and shadow glows to the canvas wheel.
- [ ] - Day 24: Code the wheel physics (random initial velocity, friction, and deceleration).
- [ ] - Day 25: Code the logic to calculate the final resting angle and declare the winner.
- [ ] - Day 26: Implement local storage logic to check if this is the "first break of the day".
- [ ] - Day 27: Design the 3 Category Selection Cards (Academic, YouTube, IPA).
- [ ] - Day 28: Add hover-lift animations and glowing borders to the category cards.
- [ ] - Day 29: Write the logic for the "System Picks" outcome (randomly assigning a category).
- [ ] - Day 30: Save the selected category to local storage so it locks in for the rest of the day.

### Phase 4: Core Question Engine & Text Interactions
- [ ] - Day 31: Build the internal JSON parser to read your local question bank (the one gotten from periodicly pinging this GitHub repo to fetch the latest).
- [ ] - Day 32: Create a central Question Renderer Factory to display different component types.
- [ ] - Day 33: Build the Multiple Choice UI component.
- [ ] - Day 34: Add visual states (selected, correct, wrong) to Multiple Choice buttons.
- [ ] - Day 35: Build the True/False component.
- [ ] - Day 36: Build the Short Answer text input component.
- [ ] - Day 37: Implement fuzzy-matching validation for Short Answer (case-insensitive, substrings).
- [ ] - Day 38: Build the Fill-in-the-Blank component logic.
- [ ] - Day 39: Map `___` in strings to inline HTML text inputs for Fill-in-the-Blank.
- [ ] - Day 40: Build the Odd One Out UI component.
- [ ] - Day 41: Build the Spell It Out component.
- [ ] - Day 42: Write the logic to generate a pool of random letters plus the correct answer letters.
- [ ] - Day 43: Build the Word Scramble component.
- [ ] - Day 44: Add click-to-move tile logic for Word Scramble.
- [ ] - Day 45: Connect all Phase 4 basic question types to a unified validation function.

### Phase 5: Advanced Drag & Drop Interactions
- [ ] - Day 46: Set up HTML5 Drag and Drop event listeners inside the Shadow DOM.
- [ ] - Day 47: Build the Organize Tags component UI (tag pool and buckets).
- [ ] - Day 48: Implement dragstart, dragover, and drop logic for Organize Tags.
- [ ] - Day 49: Build the Categorize Items component (reusing tag logic for categories).
- [ ] - Day 50: Build the Sequence Order component UI (draggable list rows).
- [ ] - Day 51: Implement list reordering logic and update array order on drop.
- [ ] - Day 52: Build the Connect Terms component UI (two columns).
- [ ] - Day 53: Implement click-to-match logic between left and right columns.
- [ ] - Day 54: Add CSS animations (shake for wrong match, green glow for correct match).
- [ ] - Day 55: Finalize validation state updates for all advanced drag-and-drop types.

### Phase 6: YouTube Learner & IPA Transcriber Pillars
- [ ] - Day 56: Build the YouTube iframe container inside the question modal.
- [ ] - Day 57: Configure the iframe API (no-cookie domain, zero autoplay, zero related videos).
- [ ] - Day 58: Map `videoId` from the JSON to dynamically inject into the iframe.
- [ ] - Day 59: Ensure all 13 question types render correctly beneath the YouTube video embed.
- [ ] - Day 60: Design the IPA Transcriber custom on-screen keyboard UI.
- [ ] - Day 61: Populate the keyboard with Consonant and Vowel phonetic symbols.
- [ ] - Day 62: Add Diphthongs and Stress Mark sections to the IPA keyboard.
- [ ] - Day 63: Build the custom input display box with a blinking cursor.
- [ ] - Day 64: Write custom backspace logic to handle multi-character IPA symbols (e.g., `tʃ`).
- [ ] - Day 65: Connect the IPA keyboard output to the validation engine.

### Phase 7: Gamification, Streaks, and Confetti
- [ ] - Day 66: Build the visual SVG timer ring component for the top bar.
- [ ] - Day 67: Implement the strict 2-minute countdown interval.
- [ ] - Day 68: Animate the SVG timer stroke to change color from green to yellow to red.
- [ ] - Day 69: Write logic to auto-submit the current answer if the timer reaches zero.
- [ ] - Day 70: Build the XP calculation engine (Base XP + early-answer Time Bonus).
- [ ] - Day 71: Create daily streak tracking logic in local storage (checking date rollovers).
- [ ] - Day 72: Apply 1.5x and 2.0x XP multipliers for 3-day and 7-day streaks.
- [ ] - Day 73: Update the modal header to display the current streak fire badge.
- [ ] - Day 74: Build the Result Screen UI (Titles, XP amount, Explanation text).
- [ ] - Day 75: Animate the XP progress bar filling up on correct answers.
- [ ] - Day 76: Set up an independent HTML5 Canvas covering the viewport for Confetti.
- [ ] - Day 77: Write particle physics logic (gravity, velocity, alpha decay) for confetti.
- [ ] - Day 78: Add random shapes (circles, squares, strips) and colors to the confetti.
- [ ] - Day 79: Hook the confetti burst exclusively to the correct-answer trigger.
- [ ] - Day 80: Populate an array of randomized encouraging titles ("Brilliant!", "Superstar!").
- [ ] - Day 81: Populate randomized failure messages ("Almost there!", "Keep going!").
- [ ] - Day 82: Implement smooth screen transitions between the Question and Result screens.
- [ ] - Day 83: Program the "Next Question" logic to render a fresh challenge.
- [ ] - Day 84: Program the "I'm Done" button to dismantle the UI and unpause background media.
- [ ] - Day 85: Perform a z-index audit to ensure Confetti renders over the modal, and the modal renders over the site.

### Phase 8: Parent Dashboard & Controls
- [ ] - Day 86: Convert your existing `options.html` / `popup.html` into the Parent Dashboard UI.
- [ ] - Day 87: Apply the global "Cosmic Toybox" font and color aesthetic to the popup menu.
- [ ] - Day 88: Write logic to fetch and display "Breaks Today" stats from local storage.
- [ ] - Day 89: Write logic to fetch and display "Lifetime Total Breaks".
- [ ] - Day 90: Display the currently locked-in daily category on the dashboard.
- [ ] - Day 91: Create the interval configuration number input (clamped between 5 and 120 minutes).
- [ ] - Day 92: Write background logic to clear and reset the alarm immediately when the interval is changed.
- [ ] - Day 93: Add the "Test Break Now" button to the popup UI.
- [ ] - Day 94: Write message-passing logic to force a break on the active tab when the test button is clicked.
- [ ] - Day 95: Add error handling for the test button if the parent is on an un-injectable tab (like the Chrome Web Store).

### Phase 9: Polish, Cleanup, & Deployment
- [ ] - Day 96: Perform a complete audit of the midnight rollover logic (resetting daily stats/categories properly).
- [ ] - Day 97: Refactor Python file (`cool.py`) if it plays a role, or remove it if strictly going MV3 JS.
- [ ] - Day 98: Thorough cross-browser testing (Chrome, Brave, Edge).
- [ ] - Day 99: Final bug hunting (Memory leaks, ensuring media un-pauses reliably after a break).
- [ ] - Day 100: Update `manifest.json` versions, trigger your `.github/workflows/package.yml`, and launch the extension!
