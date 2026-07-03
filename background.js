const QUESTIONS_URL = 'https://raw.githubusercontent.com/infinitehoax/old-brainlock/main/questions.json';

// Fallback questions if everything else fails
const fallbackQuestions = [
  {
    "id": 1,
    "question": "Which of these numbers is a prime number?",
    "subject": "Mathematics",
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
      const correctAnswer = question.answers.find(ans => ans.text === question.correctAnswer);
      if (correctAnswer && correctAnswer.feedback.startsWith('Correct. ')) {
        correctAnswer.feedback = correctAnswer.feedback.substring('Correct. '.length);
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
    lastUnlockTime: null
  });

  setupAlarm();
});

// Re-lock on browser startup
chrome.runtime.onStartup.addListener(async () => {
  const questions = await fetchQuestionsFromGithub();

  chrome.storage.local.get(['answeredQuestions'], (result) => {
    const answered = result.answeredQuestions || [];
    chrome.storage.local.set({
      isLocked: true,
      currentQuestion: getNextQuestion(questions, answered)
    });
  });
  setupAlarm();
});

function setupAlarm() {
  chrome.alarms.create('lockBrowser', { periodInMinutes: 20 });
}

// Listener for the 20-minute alarm
chrome.alarms.onAlarm.addListener((alarm) => {
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
      });
    });
  }
});

function getNextQuestion(questions, answeredIds) {
  if (!questions || questions.length === 0) return fallbackQuestions[0];
  const unanswered = questions.filter(q => !answeredIds.includes(q.id));
  if (unanswered.length === 0) {
    chrome.storage.local.set({ answeredQuestions: [] });
    return questions[Math.floor(Math.random() * questions.length)];
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
      const isCorrect = q.correctAnswer === request.answer;
      const selectedAnswerObj = q.answers.find(a => a.text === request.answer);

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
          feedback: selectedAnswerObj.feedback,
          generalFeedback: q.generalFeedback
        });
      } else {
        const correctAnswerObj = q.answers.find(a => a.text === q.correctAnswer);
        const newQuestion = getNextQuestion(questions, answered);
        chrome.storage.local.set({ currentQuestion: newQuestion });
        sendResponse({
          correct: false,
          feedback: selectedAnswerObj.feedback,
          correctAnswerText: q.correctAnswer, // Send correct answer text for display
          correctAnswerFeedback: correctAnswerObj.feedback,
          generalFeedback: q.generalFeedback,
          newQuestion: newQuestion
        });
      }
    });
    return true; // Indicates async response
  }

  if (request.action === "getQuestion") {
    chrome.storage.local.get(['isLocked', 'currentQuestion'], (result) => {
      sendResponse({
        isLocked: result.isLocked,
        question: result.currentQuestion
      });
    });
    return true; // Indicates async response
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
