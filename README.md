# 🧠 Brain Lock

**Turn passive screen time into mandatory micro-learning.**

**Brain Lock** is a productivity and educational Google Chrome extension acting as a "tollbooth" for a child’s screen time. Instead of fighting kids to get off the computer to study, Brain Lock brings the studying directly to them—interrupting YouTube, web games, and mindless scrolling with inescapable, gamified academic challenges. 

---

### 🚀 How It Works (The "Ambush" Mechanism)

1. **The Stealth Timer:** The extension runs a silent background timer. Every 30 minutes, it initiates a "Brain Break."
2. **Universal Auto-Mute:** It instantly hunts down every open tab playing audio or video and pauses/mutes them. Background YouTube videos are held hostage!
3. **The Zero-Context-Switch Overlay:** A vibrant, "cosmic toybox" UI slides down directly on top of the current web page. It operates inside a Shadow DOM, meaning the website's code cannot break or hide it.
4. **The Roadblock:** The user is forced to answer a curriculum-aligned question.
   * **Correct?** Confetti explodes, the browser unlocks, and media resumes.
   * **Wrong?** They receive educational feedback explaining *why* they were wrong and are forced to try a new question until they get one right.

---

### ✨ Features (Current & Upcoming)

* ⏱️ **Inescapable Interruption Engine:** Reliable 30-minute interval lock that survives browser restarts.
* 🔇 **Smart Media Pausing:** Scans tabs and mutes `<video>` and `<audio>` elements automatically.
* 🛡️ **Shadow DOM UI:** Glassmorphism lock screen with floating CSS particles, completely isolated from host-site CSS.
* ☁️ **Ghost Content Updates:** The extension dynamically fetches the latest `questions.json` from this GitHub repository. Parents/Teachers can update the curriculum remotely without ever touching the child's computer!
* 🎡 **Physics-Based Spinning Wheel:** To decide the daily subject category.
* 🧩 **Advanced Question Types:** Drag-and-drop tags, word scrambles, fill-in-the-blanks, and matching.
* 📺 **YouTube Learner Mode:** Embedded educational video clips followed by comprehension checks.
* 🗣️ **IPA Transcriber:** A custom on-screen International Phonetic Alphabet keyboard for language learning.
* 🔥 **Gamification Engine:** 2-minute countdown timer bonuses, XP progress bars, and multi-day streaks.
* ⚙️ **Parent Dashboard:** See daily/lifetime breaks, current streaks, and adjust the timer intervals (5–120 minutes).

---

### 🛠️ Installation (Developer Mode)

Since this extension is in active development, you can install it manually via Chrome:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** ON (top right corner).
4. Click **Load unpacked** (top left).
5. Select the `infinitehoax-old-brainlock` folder.
6. The extension is now active! (Click the puzzle piece icon in your toolbar to pin it and view the popup).

---

### 👨‍💻 For Developers

This project uses Manifest V3 (MV3). 
* **`background.js`**: Handles the alarms, tab querying, media muting, and GitHub JSON fetching.
* **`content.js`**: Injects the Shadow DOM overlay and handles UI interactions.
* **`lock.css`**: Injected directly into the Shadow DOM for the glassmorphic aesthetic.
* **`cool.py`**: A handy utility script to bulk-renumber MCQ IDs in the JSON database.

---

### 📚 Question JSON Schema

Brain Lock supports 7 distinct question types. All questions must follow this base structure:

```json
{
  "id": 1001,
  "type": "type-name",
  "category": "Mathematics",
  "question": "The question text...",
  "correctAnswer": "The expected answer",
  "generalFeedback": "Optional feedback shown after any answer"
}
```

#### 1. Multiple Choice (`multiple-choice`)
Requires an `answers` array of objects.
```json
{
  "type": "multiple-choice",
  "question": "Which of these is a prime number?",
  "answers": [
    { "text": "9", "feedback": "Incorrect. 9 has factors 1, 3, and 9." },
    { "text": "11", "feedback": "Correct! 11 is prime." }
  ],
  "correctAnswer": "11"
}
```

#### 2. True/False (`true-false`)
Similar to multiple choice, but usually with two options.
```json
{
  "type": "true-false",
  "question": "The sun is a star.",
  "answers": [
    { "text": "True", "feedback": "Correct!" },
    { "text": "False", "feedback": "Incorrect." }
  ],
  "correctAnswer": "True"
}
```

#### 3. Short Answer (`short-answer`)
Displays a single text input. Validation is case-insensitive and trims whitespace.
```json
{
  "type": "short-answer",
  "question": "What is the capital of France?",
  "correctAnswer": "Paris"
}
```

#### 4. Fill-in-the-Blank (`fill-in-the-blank`)
Map `___` (three underscores) to inline text inputs.
* **Single Blank:** `correctAnswer` is a string.
* **Multiple Blanks:** `correctAnswer` is an array of strings.
```json
{
  "type": "fill-in-the-blank",
  "question": "The process by which plants make their food is called ___.",
  "correctAnswer": "photosynthesis"
}
```

#### 5. Odd One Out (`odd-one-out`)
Similar to multiple choice.
```json
{
  "type": "odd-one-out",
  "question": "Which of these is NOT a primary color?",
  "answers": [
    { "text": "Red", "feedback": "Red is primary." },
    { "text": "Green", "feedback": "Correct! Green is secondary." }
  ],
  "correctAnswer": "Green"
}
```

#### 6. Spell It Out (`spell-it-out`)
The UI generates a pool of letter tiles including the correct answer letters plus decoys.
```json
{
  "type": "spell-it-out",
  "question": "Spell the name of the planet we live on.",
  "correctAnswer": "EARTH"
}
```

#### 7. Word Scramble (`word-scramble`)
The UI displays the `correctAnswer` as scrambled tiles for the user to reorder.
```json
{
  "type": "word-scramble",
  "question": "Unscramble this science word: MTOA",
  "correctAnswer": "ATOM"
}
```

---

### 📄 License & Credits
Developed for students, parents, and educators looking to make the internet a slightly smarter place. Feel free to fork, adapt the JSON for your own local curriculum, and contribute!
