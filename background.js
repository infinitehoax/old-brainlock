const QUESTIONS_URL = 'https://raw.githubusercontent.com/infinitehoax/old-brainlock/main/questions.json';

// Fallback questions if everything else fails
const fallbackQuestions = [
  {
    "id": 1,
    "question": "Which of these numbers is a prime number?",
    "category": "Mathematics",
    "generalFeedback": "A prime number is a whole number greater than 1 that has only two factors: 1 and itself.",
    "answers": [
      {"text": "9", "feedback": "Incorrect. 9 has factors 1, 3, and 9."},
      {"text": "15", "feedback": "Incorrect. 15 has factors 1, 3, 5, and 15."},
      {"text": "21", "feedback": "Incorrect. 21 has factors 1, 3, 7, and 21."},
      {"text": "11", "feedback": "Correct. 11 can only be divided by 1 and 11."}
    ],
    "correctAnswer": "11"
  }
];

async function getBundledQuestions() {
  try {
    const response = await fetch(chrome.runtime.getURL('questions.json'));
    return await response.json();
  } catch (e) {
    return fallbackQuestions;
  }
}

async function fetchQuestionsFromGithub() {
  try {
    const response = await fetch(QUESTIONS_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const questions = await response.json();

    // Programmatically clean up the "Correct." prefix from feedback
    questions.forEach(question => {
      if (question.answers) {
        const correctAnswer = question.answers.find(ans => ans.text === question.correctAnswer);
        if (correctAnswer && correctAnswer.feedback.startsWith('Correct. ')) {
          correctAnswer.feedback = correctAnswer.feedback.substring('Correct. '.length);
        }
      }
    });

    await chrome.storage.local.set({ questions: questions, lastFetchTime: Date.now() });
    return questions;
  } catch (error) {
    console.error('Failed to fetch questions from GitHub:', error);
    const data = await chrome.storage.local.get('questions');
    if (data.questions) return data.questions;
    return await getBundledQuestions();
  }
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  const questions = await fetchQuestionsFromGithub();

  chrome.storage.local.set({
    isLocked: true,
    currentQuestion: getNextQuestion(questions, []),
    answeredQuestions: [],
    lastUnlockTime: null,
    dailyCategory: null,
    lastSpinDate: null
  });

  setupAlarms();
});

// Re-lock on browser startup
chrome.runtime.onStartup.addListener(async () => {
  const questions = await fetchQuestionsFromGithub();

  chrome.storage.local.get(['answeredQuestions', 'dailyCategory', 'lastSpinDate'], (result) => {
    const answered = result.answeredQuestions || [];
    const today = new Date().toDateString();

    let dailyCategory = result.dailyCategory;
    if (result.lastSpinDate !== today) {
      dailyCategory = null;
    }

    chrome.storage.local.set({
      isLocked: true,
      currentQuestion: getNextQuestion(questions, answered, dailyCategory),
      dailyCategory: dailyCategory
    });
  });
  setupAlarms();
});

function setupAlarms() {
  chrome.alarms.create('lockBrowser', { periodInMinutes: 30 });
  chrome.alarms.create('periodicFetch', { periodInMinutes: 60 });
}

// Listener for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicFetch') {
    fetchQuestionsFromGithub();
  }
  if (alarm.name === 'lockBrowser') {
    chrome.storage.local.get(['questions', 'answeredQuestions'], async (result) => {
      let questions = result.questions;
      if (!questions) {
          questions = await fetchQuestionsFromGithub();
      }
      const answered = result.answeredQuestions || [];
      chrome.storage.local.set({
        isLocked: true,
        currentQuestion: getNextQuestion(questions, answered),
        lastUnlockTime: null
      }, () => {
        broadcastLockState(true); // Tell all tabs to show lock screen

        // Mute and pause media on active and audible tabs
        chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
          chrome.tabs.query({ audible: true }, (audibleTabs) => {
            // Deduplicate tabs by ID
            const tabsMap = new Map();
            activeTabs.forEach(t => tabsMap.set(t.id, t));
            audibleTabs.forEach(t => tabsMap.set(t.id, t));

            tabsMap.forEach(tab => {
              if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('https://chrome.google.com/webstore')) {
                chrome.scripting.executeScript({
                  target: { tabId: tab.id, allFrames: true },
                  func: muteAndPauseMedia
                }).catch(err => console.error('Script injection failed:', err));
              }
            });
          });
        });
      });
    });
  }
});

// Function to pause and mute all media elements
function muteAndPauseMedia() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(media => {
    media.pause();
    media.muted = true;
  });
}

function getNextQuestion(questions, answeredIds, category = null) {
  if (!questions || questions.length === 0) return fallbackQuestions[0];

  let pool = questions;
  if (category) {
    if (category === 'Academic') {
      // For now, assume everything that isn't YouTube or IPA is Academic
      pool = questions.filter(q => q.category !== 'YouTube' && q.category !== 'IPA');
    } else {
      pool = questions.filter(q => q.category === category);
    }
  }

  // If filtered pool is empty, fallback to all questions
  if (pool.length === 0) pool = questions;

  const unanswered = pool.filter(q => !answeredIds.includes(q.id));
  if (unanswered.length === 0) {
    // If all in pool are answered, reset answered list (of that pool? no, let's keep it simple)
    // Actually, maybe we should only reset if ALL questions are answered.
    // For now, let's just pick a random one from the pool.
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return unanswered[Math.floor(Math.random() * unanswered.length)];
}

// Function to send a message to all content scripts
function broadcastLockState(isLocked) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        const message = isLocked ? { action: "showLock" } : { action: "clearLock" };
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      }
    });
  });
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAnswer") {
    chrome.storage.local.get(['questions', 'currentQuestion', 'answeredQuestions'], (result) => {
      const questions = result.questions || fallbackQuestions;
      const q = result.currentQuestion;
      const answered = result.answeredQuestions || [];

      let isCorrect = false;

      const checkFuzzy = (user, correct, isShortAnswer = false) => {
        const userNorm = (user || "").toString().trim().toLowerCase();
        const correctNorm = (correct || "").toString().trim().toLowerCase();
        if (isShortAnswer) {
          return userNorm.includes(correctNorm);
        }
        return userNorm === correctNorm;
      };

      if (q.type === 'fill-in-the-blank' && Array.isArray(q.correctAnswer)) {
        const userAnswers = Array.isArray(request.answer) ? request.answer : [request.answer];
        isCorrect = q.correctAnswer.every((val, idx) => checkFuzzy(userAnswers[idx], val));
      } else if (q.type === 'short-answer') {
        isCorrect = checkFuzzy(request.answer, q.correctAnswer, true);
      } else if (q.type === 'fill-in-the-blank' || q.type === 'spell-it-out' || q.type === 'word-scramble') {
        // Fuzzy matching: case insensitive, trim whitespace
        isCorrect = checkFuzzy(request.answer, q.correctAnswer);
      } else if (q.type === 'sequence-order') {
        isCorrect = Array.isArray(request.answer) &&
                    request.answer.length === q.correctAnswer.length &&
                    request.answer.every((val, idx) => val === q.correctAnswer[idx]);
      } else if (q.type === 'organize-tags' || q.type === 'categorize-items' || q.type === 'connect-terms') {
        // request.answer and q.correctAnswer are objects
        const userKeys = Object.keys(request.answer || {});
        const correctKeys = Object.keys(q.correctAnswer || {});
        if (userKeys.length !== correctKeys.length) {
          isCorrect = false;
        } else {
          isCorrect = correctKeys.every(key => request.answer[key] === q.correctAnswer[key]);
        }
      } else {
        isCorrect = q.correctAnswer === request.answer;
      }

      const selectedAnswerObj = q.answers ? q.answers.find(a => a.text === request.answer) : null;

      if (isCorrect) {
        const newAnswered = [...answered, q.id];
        chrome.storage.local.set({
          isLocked: false,
          answeredQuestions: newAnswered,
          lastUnlockTime: Date.now()
        }, () => {
          broadcastLockState(false); // On correct answer, tell all tabs to unlock
        });
        sendResponse({
          correct: true,
          feedback: selectedAnswerObj ? selectedAnswerObj.feedback : "Correct!",
          generalFeedback: q.generalFeedback
        });
      } else {
        const correctAnswerObj = q.answers ? q.answers.find(a => a.text === q.correctAnswer) : null;
        const newQuestion = getNextQuestion(questions, answered);
        chrome.storage.local.set({ currentQuestion: newQuestion });

        let correctAnswerText = q.correctAnswer;
        if (typeof q.correctAnswer === 'object' && !Array.isArray(q.correctAnswer)) {
          correctAnswerText = Object.entries(q.correctAnswer).map(([k, v]) => `${k} ➔ ${v}`).join(', ');
        } else if (Array.isArray(q.correctAnswer)) {
          correctAnswerText = q.correctAnswer.join(', ');
        }

        sendResponse({
          correct: false,
          feedback: selectedAnswerObj ? selectedAnswerObj.feedback : "Incorrect.",
          correctAnswerText: correctAnswerText, // Send correct answer text for display
          correctAnswerFeedback: correctAnswerObj ? correctAnswerObj.feedback : null,
          generalFeedback: q.generalFeedback,
          newQuestion: newQuestion
        });
      }
    });
    return true; // Indicates async response
  }

  if (request.action === "getQuestion") {
    chrome.storage.local.get(['isLocked', 'currentQuestion', 'lastSpinDate'], (result) => {
      const today = new Date().toDateString();
      const needsSpin = result.lastSpinDate !== today;

      sendResponse({
        isLocked: result.isLocked,
        question: result.currentQuestion,
        needsSpin: needsSpin
      });
    });
    return true; // Indicates async response
  }

  if (request.action === "setDailyCategory") {
    const today = new Date().toDateString();
    chrome.storage.local.get(['questions', 'answeredQuestions'], (result) => {
      const questions = result.questions || fallbackQuestions;
      const answered = result.answeredQuestions || [];
      const newQuestion = getNextQuestion(questions, answered, request.category);

      chrome.storage.local.set({
        dailyCategory: request.category,
        lastSpinDate: today,
        currentQuestion: newQuestion
      }, () => {
        sendResponse({ success: true, question: newQuestion });
      });
    });
    return true;
  }

  if (request.action === "getDefaultQuestions") {
    getBundledQuestions().then(questions => {
      sendResponse({ defaultQuestions: questions });
    });
    return true;
  }

  if (request.action === "forceFetchQuestions") {
    fetchQuestionsFromGithub().then(questions => {
      sendResponse({ success: true, questions: questions });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});
