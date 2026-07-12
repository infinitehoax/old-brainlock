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
    const data = await response.json();

    let questions = [];
    if (Array.isArray(data)) {
      questions = data;
    } else if (data.questions && Array.isArray(data.questions)) {
      questions = data.questions;
      if (data.config) {
        await applyConfig(data.config);
      }
    }

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
  const data = await chrome.storage.local.get('activeHours');

  chrome.storage.local.set({
    isLocked: isWithinActiveHours(data.activeHours),
    currentQuestion: getNextQuestion(questions, []),
    answeredQuestions: [],
    lastUnlockTime: null,
    dailyCategory: null,
    lastSpinDate: null,
    totalXP: 0,
    dailyStreak: 0,
    lastStreakDate: null,
    breaksToday: 0,
    lifetimeBreaks: 0,
    breakInterval: 30,
    lastStatsResetDate: new Date().toDateString()
  });

  setupAlarms();
});

// Re-lock on browser startup
chrome.runtime.onStartup.addListener(async () => {
  const questions = await fetchQuestionsFromGithub();

  chrome.storage.local.get([
    'answeredQuestions',
    'dailyCategory',
    'lastSpinDate',
    'lastStatsResetDate',
    'breaksToday',
    'activeHours'
  ], (result) => {
    const answered = result.answeredQuestions || [];
    const today = new Date().toDateString();

    let dailyCategory = result.dailyCategory;
    let breaksToday = result.breaksToday || 0;
    let lastStatsResetDate = result.lastStatsResetDate;

    if (lastStatsResetDate !== today) {
      dailyCategory = null;
      breaksToday = 0;
      lastStatsResetDate = today;
    }

    chrome.storage.local.set({
      isLocked: isWithinActiveHours(result.activeHours),
      currentQuestion: getNextQuestion(questions, answered, dailyCategory),
      dailyCategory: dailyCategory,
      breaksToday: breaksToday,
      lastStatsResetDate: lastStatsResetDate
    });
  });
  setupAlarms();
});

async function setupAlarms() {
  const data = await chrome.storage.local.get(['breakInterval', 'githubPingInterval']);
  const interval = data.breakInterval || 30;
  const fetchInterval = data.githubPingInterval || 60;

  chrome.alarms.clear('lockBrowser');
  chrome.alarms.create('lockBrowser', { periodInMinutes: interval });

  chrome.alarms.clear('periodicFetch');
  chrome.alarms.create('periodicFetch', { periodInMinutes: fetchInterval });
}

// Listener for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicFetch') {
    fetchQuestionsFromGithub();
  }
  if (alarm.name === 'lockBrowser') {
    triggerLock();
  }
});

/**
 * Triggers the lock screen and media muting.
 * @param {number} [targetTabId] - Optional specific tab ID to target (for "Test Break Now")
 */
async function triggerLock(targetTabId = null) {
  const result = await chrome.storage.local.get([
    'questions',
    'answeredQuestions',
    'breaksToday',
    'lifetimeBreaks',
    'lastStatsResetDate',
    'dailyCategory',
    'lastSpinDate',
    'activeHours'
  ]);

  // Skip if not in active hours, unless it's a manual test
  if (!targetTabId && !isWithinActiveHours(result.activeHours)) {
    console.log('Skipping lock: outside of active hours.');
    return;
  }

  let questions = result.questions;
  if (!questions) {
    questions = await fetchQuestionsFromGithub();
  }
  const answered = result.answeredQuestions || [];
  const today = new Date().toDateString();

  let breaksToday = result.breaksToday || 0;
  let lifetimeBreaks = result.lifetimeBreaks || 0;
  let lastStatsResetDate = result.lastStatsResetDate;
  let dailyCategory = result.dailyCategory;

  // Midnight Rollover Logic: Reset daily stats and category if the day has changed
  if (lastStatsResetDate !== today) {
    breaksToday = 0;
    lastStatsResetDate = today;
    dailyCategory = null; // Forces a new wheel spin
  }

  breaksToday++;
  lifetimeBreaks++;

  chrome.storage.local.set({
    isLocked: true,
    currentQuestion: getNextQuestion(questions, answered, dailyCategory),
    lastUnlockTime: null,
    breaksToday: breaksToday,
    lifetimeBreaks: lifetimeBreaks,
    lastStatsResetDate: lastStatsResetDate,
    dailyCategory: dailyCategory
  }, () => {
    if (targetTabId) {
      // Targeted lock for "Test Break Now"
      chrome.tabs.get(targetTabId, (tab) => {
        if (tab && tab.url && isInjectable(tab.url)) {
          chrome.tabs.sendMessage(tab.id, { action: "showLock" }).catch(() => {});
          chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: muteAndPauseMedia
          }).catch(err => console.error('Script injection failed:', err));
        }
      });
    } else {
      // Global lock
      broadcastLockState(true);

      chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
        chrome.tabs.query({ audible: true }, (audibleTabs) => {
          const tabsMap = new Map();
          activeTabs.forEach(t => tabsMap.set(t.id, t));
          audibleTabs.forEach(t => tabsMap.set(t.id, t));

          tabsMap.forEach(tab => {
            if (tab.url && isInjectable(tab.url)) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                func: muteAndPauseMedia
              }).catch(err => console.error('Script injection failed:', err));
            }
          });
        });
      });
    }
  });
}

function isInjectable(url) {
  return url &&
         !url.startsWith('chrome://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('https://chrome.google.com/webstore') &&
         !url.startsWith('https://chromewebstore.google.com');
}

// Function to pause and mute all media elements
function muteAndPauseMedia() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(media => {
    media.pause();
    media.muted = true;
  });
}

// Function to unmute and play all media elements
function unmuteAndPlayMedia() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(media => {
    media.muted = false;
    media.play().catch(() => {
      // Autoplay might be blocked until user interacts, which is fine here
      console.log('Autoplay prevented on some media.');
    });
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
    // If all in pool are answered, pick a random one from the pool.
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return unanswered[Math.floor(Math.random() * unanswered.length)];
}

// Function to send a message to all content scripts
function broadcastLockState(isLocked) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && isInjectable(tab.url)) {
        const message = isLocked ? { action: "showLock" } : { action: "clearLock" };
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});

        if (!isLocked) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: unmuteAndPlayMedia
          }).catch(() => {});
        }
      }
    });
  });
}

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAnswer") {
    chrome.storage.local.get([
      'questions',
      'currentQuestion',
      'answeredQuestions',
      'totalXP',
      'dailyStreak',
      'lastStreakDate'
    ], (result) => {
      const questions = result.questions || fallbackQuestions;
      const q = result.currentQuestion;
      const answered = result.answeredQuestions || [];
      let totalXP = result.totalXP || 0;
      let dailyStreak = result.dailyStreak || 0;
      let lastStreakDate = result.lastStreakDate;

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

        // Gamification Logic
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (lastStreakDate !== today) {
          if (lastStreakDate === yesterday) {
            dailyStreak++;
          } else {
            dailyStreak = 1;
          }
          lastStreakDate = today;
        }

        let multiplier = 1.0;
        if (dailyStreak >= 7) multiplier = 2.0;
        else if (dailyStreak >= 3) multiplier = 1.5;

        const baseXP = 100;
        const timeBonus = Math.max(0, Math.floor(request.remainingTime || 0));
        const xpEarned = Math.floor((baseXP + timeBonus) * multiplier);
        totalXP += xpEarned;

        chrome.storage.local.set({
          isLocked: false,
          answeredQuestions: newAnswered,
          lastUnlockTime: Date.now(),
          totalXP: totalXP,
          dailyStreak: dailyStreak,
          lastStreakDate: lastStreakDate
        }, () => {
          broadcastLockState(false); // On correct answer, tell all tabs to unlock
        });

        sendResponse({
          correct: true,
          feedback: selectedAnswerObj ? selectedAnswerObj.feedback : "Correct!",
          generalFeedback: q.generalFeedback,
          xpEarned: xpEarned,
          newTotalXP: totalXP,
          streak: dailyStreak,
          multiplier: multiplier
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

  if (request.action === "updateInterval") {
    chrome.storage.local.set({ breakInterval: request.interval }, () => {
      setupAlarms();
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "testBreakNow") {
    triggerLock(request.tabId);
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Helper to check if current time is within active hours window
 */
function isWithinActiveHours(activeHours) {
  if (!activeHours) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Determine which activeHours config to use:
  // If there's a day-specific config, use that.
  // Otherwise, if there is a 'start' and 'end', use the direct config.
  // Otherwise, default to true (no restrictions).
  let hours = null;

  if (activeHours.start && activeHours.end) {
    hours = activeHours;
  } else {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = daysOfWeek[now.getDay()];
    if (activeHours[todayDayName]) {
      hours = activeHours[todayDayName];
    }
  }

  if (!hours || !hours.start || !hours.end) return true;

  const [startH, startM] = hours.start.split(':').map(Number);
  const [endH, endM] = hours.end.split(':').map(Number);

  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overlays midnight (e.g., 22:00 to 06:00)
    return currentTime >= startTime || currentTime <= endTime;
  }
}

/**
 * Applies configuration settings to storage and updates alarms
 */
async function applyConfig(config) {
  if (!config) return;

  const updates = {};
  if (config.githubPingInterval) updates.githubPingInterval = config.githubPingInterval;
  if (config.brainLockInterval) updates.breakInterval = config.brainLockInterval;
  if (config.activeHours) updates.activeHours = config.activeHours;

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
    setupAlarms();
  }
}
