// Check lock status on initial page load
chrome.runtime.sendMessage({ action: "getQuestion" }, (response) => {
  if (response && response.isLocked && !document.getElementById('brain-lock-host')) {
    if (response.needsSpin) {
      showLockScreen(null, 'wheel');
    } else {
      showLockScreen(response.question);
    }
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showLock") {
    if (!document.getElementById('brain-lock-host')) {
      chrome.runtime.sendMessage({ action: "getQuestion" }, (response) => {
        if (response && response.isLocked) {
          if (response.needsSpin) {
            showLockScreen(null, 'wheel');
          } else {
            showLockScreen(response.question);
          }
        }
      });
    }
  } else if (request.action === "clearLock") {
    removeLockScreen();
  }
});

let shadowRoot;

function showLockScreen(question, stage = 'question') {
  // Clean up any existing overlay first
  const existingHost = document.getElementById('brain-lock-host');
  if (existingHost) existingHost.remove();

  const host = document.createElement('div');
  host.id = 'brain-lock-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('lock.css');
  shadowRoot.appendChild(link);

  const overlay = document.createElement('div');
  overlay.id = 'brain-lock-overlay';
  shadowRoot.appendChild(overlay);

  renderStage(overlay, stage, question);

  // Create particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 5 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    particle.style.opacity = Math.random();
    particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
    particle.style.animationDelay = `${Math.random() * -20}s`;
    overlay.appendChild(particle);
  }
}

function renderStage(overlay, stage, data) {
  const container = document.createElement('div');
  container.className = 'brain-lock-container stage-transition';
  
  if (stage === 'wheel') {
    container.innerHTML = `
      <div class="brain-lock-header">
        <div class="modal-logo">🎡</div>
        <h1>Daily Kickoff!</h1>
        <p>Spin the wheel to start your first break of the day</p>
      </div>
      <div class="brain-lock-content">
        <div class="wheel-container">
          <div class="wheel-pointer"></div>
          <canvas id="wheel-canvas" width="400" height="400"></canvas>
          <button id="spin-btn" class="submit-button spin-button">SPIN!</button>
        </div>
      </div>
    `;
    overlay.appendChild(container);
    initWheel();
  } else if (stage === 'category') {
    container.innerHTML = `
      <div class="brain-lock-header">
        <div class="modal-logo">🎯</div>
        <h1>Choose Your Subject</h1>
        <p>${data === 'System Picks' ? "The wheel decided! Randomizing..." : "The choice is yours! Pick a subject for today."}</p>
      </div>
      <div class="brain-lock-content">
        <div class="category-selection-container">
          <div class="category-card academic" data-category="Academic">
            <div class="category-icon">📚</div>
            <div class="category-title">Academic</div>
            <div class="category-desc">Math, Science, History, and more!</div>
          </div>
          <div class="category-card youtube" data-category="YouTube">
            <div class="category-icon">📺</div>
            <div class="category-title">YouTube</div>
            <div class="category-desc">Watch a short video and learn!</div>
          </div>
          <div class="category-card ipa" data-category="IPA">
            <div class="category-icon">🗣️</div>
            <div class="category-title">IPA</div>
            <div class="category-desc">Master phonetic pronunciations!</div>
          </div>
        </div>
      </div>
    `;
    overlay.appendChild(container);

    if (data === 'System Picks') {
      // Logic for random selection with animation
      setTimeout(() => {
        const categories = ['Academic', 'YouTube', 'IPA'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const card = shadowRoot.querySelector(`.category-card[data-category="${randomCategory}"]`);
        card.style.transform = "scale(1.1) translateY(-20px)";
        card.style.borderColor = "#fff";
        card.style.boxShadow = "0 0 30px rgba(255,255,255,0.5)";

        setTimeout(() => selectCategory(randomCategory), 1500);
      }, 1000);
    } else {
      shadowRoot.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => selectCategory(card.dataset.category));
      });
    }
  } else {
    const question = data;
    const shuffledAnswers = [...question.answers].sort(() => Math.random() - 0.5);
    const answersHTML = shuffledAnswers.map((answer, index) => `
      <div class="answer-option" data-answer="${answer.text}">
        <input type="radio" name="answer" id="answer${index}" value="${answer.text}">
        <label for="answer${index}">${answer.text}</label>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="brain-lock-header">
        <div class="modal-logo">🚀</div>
        <h1>Brain Lock</h1>
        <div class="header-metadata">
          <span class="category-tag">${question.subject || 'Standard'}</span>
          <span class="difficulty-tag">Normal</span>
        </div>
        <p>Answer this question correctly to unlock your browser</p>
      </div>
      <div class="brain-lock-content">
        <div class="question-text">${question.question}</div>
        <div class="answers-container">${answersHTML}</div>
        <div id="feedback-message" class="feedback-message"></div>
        <button id="brain-lock-submit" class="submit-button">Submit Answer</button>
      </div>
      <div class="brain-lock-footer"><p>Get it wrong? You'll get another question until you answer correctly!</p></div>
    `;
    overlay.appendChild(container);

    const submitBtn = shadowRoot.getElementById('brain-lock-submit');
    const answerOptions = shadowRoot.querySelectorAll('.answer-option');

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
      const selectedRadio = shadowRoot.querySelector('input[name="answer"]:checked');
      if (!selectedRadio) {
        showFeedback("Please select an answer!", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Checking...";
      shadowRoot.querySelectorAll('.answer-option input').forEach(input => input.disabled = true);

      chrome.runtime.sendMessage({ action: "checkAnswer", answer: selectedRadio.value }, handleResponse);
    });
  }
}

function selectCategory(category) {
  chrome.runtime.sendMessage({ action: "setDailyCategory", category: category }, (response) => {
    if (response.success) {
      const overlay = shadowRoot.getElementById('brain-lock-overlay');
      const container = shadowRoot.querySelector('.brain-lock-container');
      container.classList.add('fade-out');
      setTimeout(() => {
        container.remove();
        renderStage(overlay, 'question', response.question);
      }, 400);
    }
  });
}

function initWheel() {
  const canvas = shadowRoot.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = shadowRoot.getElementById('spin-btn');
  
  const segments = ["You Pick", "System Picks", "You Pick", "System Picks", "You Pick", "System Picks"];
  const colors = ["#4facfe", "#f093fb", "#4facfe", "#f093fb", "#4facfe", "#f093fb"];

  let currentAngle = 0;
  let isSpinning = false;
  let velocity = 0;
  let friction = 0.985;

  function drawWheel() {
    const radius = canvas.width / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const sliceAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((segment, i) => {
      const angle = currentAngle + i * sliceAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 10, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px 'Segoe UI'";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.fillText(segment, radius - 40, 10);
      ctx.restore();
    });

    // Draw center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "#4facfe";
    ctx.lineWidth = 4;
    ctx.stroke();
    
    //Hub logo
    ctx.fillStyle = "#fff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚀", centerX, centerY + 8);
  }

  function rotate() {
    if (!isSpinning) return;

    currentAngle += velocity;
    velocity *= friction;

    if (velocity < 0.001) {
      isSpinning = false;
      calculateResult();
    } else {
      drawWheel();
      requestAnimationFrame(rotate);
    }
  }

  function calculateResult() {
    const sliceAngle = (2 * Math.PI) / segments.length;
    // Pointer is at the top (-PI/2)
    // Normalize currentAngle to 0..2PI
    const normalizedAngle = (currentAngle + Math.PI/2) % (2 * Math.PI);
    const invertedAngle = (2 * Math.PI - normalizedAngle) % (2 * Math.PI);
    const segmentIndex = Math.floor(invertedAngle / sliceAngle) % segments.length;
    const result = segments[segmentIndex];

    setTimeout(() => {
      const overlay = shadowRoot.getElementById('brain-lock-overlay');
      const container = shadowRoot.querySelector('.brain-lock-container');
      container.classList.add('fade-out');
      setTimeout(() => {
        container.remove();
        renderStage(overlay, 'category', result);
      }, 400);
    }, 1000);
  }

  spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    velocity = Math.random() * 0.4 + 0.3; // High initial velocity
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.style.animation = "none";
    spinBtn.style.opacity = "0.5";
    rotate();
  });

  drawWheel();
}

function removeLockScreen() {
  const host = document.getElementById('brain-lock-host');
  if (host) {
    const overlay = shadowRoot.getElementById('brain-lock-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      overlay.addEventListener('animationend', () => {
        host.remove();
      }, { once: true });
      // Fallback if animation fails
      setTimeout(() => {
        if (document.getElementById('brain-lock-host')) host.remove();
      }, 500);
    } else {
      host.remove();
    }
  }
}

function handleResponse(response) {
  const feedbackEl = shadowRoot.getElementById('feedback-message');
  const submitBtn = shadowRoot.getElementById('brain-lock-submit');
  const newBtn = submitBtn.cloneNode(true); // Clone button to remove old listeners
  submitBtn.parentNode.replaceChild(newBtn, submitBtn);

  if (response.correct) {
    showFeedback(response.feedback, false);
    feedbackEl.innerHTML += `<div class="general-feedback">${response.generalFeedback}</div>`;
    newBtn.textContent = 'Continue';
    newBtn.className = 'submit-button continue-btn';
    newBtn.disabled = false;
    newBtn.addEventListener('click', () => {
      removeLockScreen();
    });
  } else {
    showFeedback(response.feedback, true);
    const correctAnswer = response.correctAnswerText;
    const selectedAnswer = shadowRoot.querySelector('input[name="answer"]:checked').value;
    
    shadowRoot.querySelectorAll('.answer-option').forEach(option => {
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
  const feedbackEl = shadowRoot.getElementById('feedback-message');
  feedbackEl.textContent = message;
  feedbackEl.className = isIncorrect ? 'feedback-message incorrect' : 'feedback-message correct';
  feedbackEl.style.display = 'block';
}