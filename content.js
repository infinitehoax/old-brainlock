// Check lock status on initial page load
chrome.runtime.sendMessage({ action: "getQuestion" }, (response) => {
  if (response && response.isLocked && !document.getElementById('brain-lock-overlay')) {
    showLockScreen(response.question);
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showLock") {
    if (!document.getElementById('brain-lock-overlay')) {
      chrome.runtime.sendMessage({ action: "getQuestion" }, (response) => {
        if (response && response.isLocked) {
          showLockScreen(response.question);
        }
      });
    }
  } else if (request.action === "clearLock") {
    const overlay = document.getElementById('brain-lock-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
});

function showLockScreen(question) {
  // Clean up any existing overlay first
  const existingOverlay = document.getElementById('brain-lock-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'brain-lock-overlay';
  
  const shuffledAnswers = [...question.answers].sort(() => Math.random() - 0.5);
  const answersHTML = shuffledAnswers.map((answer, index) => `
    <div class="answer-option" data-answer="${answer.text}">
      <input type="radio" name="answer" id="answer${index}" value="${answer.text}">
      <label for="answer${index}">${answer.text}</label>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="brain-lock-container">
      <div class="brain-lock-header"><h1>🧠 Brain Lock</h1><p>Answer this question correctly to unlock your browser</p></div>
      <div class="brain-lock-content">
        <div class="question-text">${question.question}</div>
        <div class="answers-container">${answersHTML}</div>
        <div id="feedback-message" class="feedback-message"></div>
        <button id="brain-lock-submit" class="submit-button">Submit Answer</button>
      </div>
      <div class="brain-lock-footer"><p>Get it wrong? You'll get another question until you answer correctly!</p></div>
    </div>`;
  
  document.body.appendChild(overlay);

  const submitBtn = document.getElementById('brain-lock-submit');
  const answerOptions = document.querySelectorAll('.answer-option');

  answerOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (submitBtn.disabled) return;
      const radio = option.querySelector('input[type="radio"]');
      radio.checked = true;
      answerOptions.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  
  submitBtn.addEventListener('click', () => {
    const selectedRadio = document.querySelector('input[name="answer"]:checked');
    if (!selectedRadio) {
      showFeedback("Please select an answer!", true);
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking...";
    document.querySelectorAll('.answer-option input').forEach(input => input.disabled = true);
    
    chrome.runtime.sendMessage({ action: "checkAnswer", answer: selectedRadio.value }, handleResponse);
  });
}

function handleResponse(response) {
  const feedbackEl = document.getElementById('feedback-message');
  const submitBtn = document.getElementById('brain-lock-submit');
  const newBtn = submitBtn.cloneNode(true); // Clone button to remove old listeners
  submitBtn.parentNode.replaceChild(newBtn, submitBtn);

  if (response.correct) {
    showFeedback(response.feedback, false);
    feedbackEl.innerHTML += `<div class="general-feedback">${response.generalFeedback}</div>`;
    newBtn.textContent = 'Continue';
    newBtn.className = 'submit-button continue-btn';
    newBtn.disabled = false;
    newBtn.addEventListener('click', () => {
      const overlay = document.getElementById('brain-lock-overlay');
      if (overlay) overlay.remove();
    });
  } else {
    showFeedback(response.feedback, true);
    const correctAnswer = response.correctAnswerText;
    const selectedAnswer = document.querySelector('input[name="answer"]:checked').value;
    
    document.querySelectorAll('.answer-option').forEach(option => {
      const answerText = option.dataset.answer;
      if (answerText === correctAnswer) {
        option.classList.add('correct-choice');
      } else if (answerText === selectedAnswer) {
        option.classList.add('incorrect-choice');
      }
    });

    feedbackEl.innerHTML += `<div class="correct-answer-text">The correct answer was: <strong>${correctAnswer}</strong></div>`;
    if (response.correctAnswerFeedback) {
      const cleanedFeedback = response.correctAnswerFeedback.replace(/^Correct\.\s*/, '');
      feedbackEl.innerHTML += `<div class="correct-answer-feedback">${cleanedFeedback}</div>`;
    }
    if (response.generalFeedback) {
      feedbackEl.innerHTML += `<div class="general-feedback">${response.generalFeedback}</div>`;
    }
    newBtn.textContent = 'Try Another Question';
    newBtn.className = 'submit-button try-again-btn';
    newBtn.disabled = false;
    newBtn.addEventListener('click', () => {
      showLockScreen(response.newQuestion);
    });
  }
}

function showFeedback(message, isIncorrect) {
  const feedbackEl = document.getElementById('feedback-message');
  feedbackEl.textContent = message;
  feedbackEl.className = isIncorrect ? 'feedback-message incorrect' : 'feedback-message correct';
  feedbackEl.style.display = 'block';
}