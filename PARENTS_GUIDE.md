# 🧠 Brain Lock: Parent & Guardian Guide

Welcome to Brain Lock! This guide is designed to help you customize the educational experience for your child and ensure the extension remains an effective tool for learning.

---

## 🛠️ Customizing Questions

Brain Lock fetches its questions from a `questions.json` file. You can edit the local file in the extension directory, or point the extension to your own GitHub repository for remote updates.

### Supported Question Types

There are **13 distinct interaction types** you can use:

1.  **`multiple-choice`**: Standard 4-option quiz.
2.  **`true-false`**: Simple binary choice.
3.  **`short-answer`**: Text input (supports fuzzy matching).
4.  **`fill-in-the-blank`**: Use `___` in the question string to create input boxes.
5.  **`odd-one-out`**: Identify the item that doesn't fit.
6.  **`spell-it-out`**: Click letter tiles to spell a word.
7.  **`word-scramble`**: Unscramble a shuffled word.
8.  **`organize-tags`**: Drag tags into the correct buckets.
9.  **`categorize-items`**: Sort items into categories.
10. **`sequence-order`**: Arrange a list in the correct chronological or logical order.
11. **`connect-terms`**: Draw lines to match related terms.
12. **`ipa-transcriber`**: Use a custom phonetic keyboard to transcribe words.
13. **`youtube-integration`**: Add a `videoId` to any of the above types to show an educational video before the question.

### JSON Schema Example

```json
{
  "id": 1,
  "type": "multiple-choice",
  "question": "What is 5 + 5?",
  "category": "Academic",
  "answers": [
    {"text": "10", "feedback": "Correct!"},
    {"text": "12", "feedback": "Try again."}
  ],
  "correctAnswer": "10",
  "generalFeedback": "Addition is the process of calculating the total of two or more numbers."
}
```

---

## 🔒 Preventing Uninstallation

To make Brain Lock "inescapable," you can use operating system tools to prevent your child from removing the extension.

### 1. Windows Registry (Advanced)
You can force-install the extension and prevent its removal using the Chrome "ExtensionInstallForcelist" policy.

1.  Open `regedit` (Registry Editor).
2.  Navigate to `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome`. (Create the keys if they don't exist).
3.  Create a new Key named `ExtensionInstallForcelist`.
4.  Inside that key, create a new **String Value** named `1`.
5.  Set the value to the Extension ID found in `chrome://extensions` followed by the update URL.
    *   Example: `[EXTENSION_ID];https://clients2.google.com/service/update2/crx`

### 2. Chrome Management (Family Link)
If you use Google Family Link, you can manage extensions directly from the Family Link app/website and disable the ability for the child to manage or remove extensions.

### 3. Windows Group Policy (GPO)
For Windows Pro/Enterprise users:
1.  Download the [Chrome Policy Templates](https://support.google.com/chrome/a/answer/187202).
2.  Open `gpedit.msc`.
3.  Navigate to `Computer Configuration > Administrative Templates > Google > Google Chrome > Extensions`.
4.  Enable **"Control which extensions are installed automatically"** and add the Extension ID.

---

## 📈 Monitoring Progress

Open the **Parent Dashboard** by clicking the Brain Lock icon in the Chrome toolbar. Here you can see:
*   **Breaks Today**: How many times the child has been interrupted.
*   **Lifetime Total**: Total educational breaks completed.
*   **Daily Streak**: How many consecutive days they've used the tool.
*   **Current Category**: The subject locked in for the day.

You can also use the **"Test Break Now"** button to ensure your new questions are loading correctly!

---
*Brain Lock: Turning passive screen time into active learning.*
