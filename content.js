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
let currentRenderer;
let activeConfetti = null;

class Timer {
  constructor(duration, onTick, onComplete) {
    this.duration = duration;
    this.remaining = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.timerId = null;
  }

  start() {
    this.timerId = setInterval(() => {
      this.remaining--;
      if (this.onTick) this.onTick(this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }, 1000);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getRemainingTime() {
    return this.remaining;
  }
}

class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resizeHandler = this.resize.bind(this);
    this.resize();
    window.addEventListener('resize', this.resizeHandler);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  destroy() {
    window.removeEventListener('resize', this.resizeHandler);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  burst() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const shapes = ['circle', 'square', 'strip'];

    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: this.canvas.width / 2,
        y: this.canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 10,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        vRotation: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    if (!this.animationId) {
      this.animate();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // Gravity
      p.rotation += p.vRotation;
      p.alpha -= 0.01;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'square') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationId = null;
    }
  }
}

const QuestionRendererFactory = {
  createRenderer(question) {
    switch (question.type) {
      case 'multiple-choice':
        return new MultipleChoiceRenderer(question);
      case 'true-false':
        return new TrueFalseRenderer(question);
      case 'short-answer':
        return new ShortAnswerRenderer(question);
      case 'fill-in-the-blank':
        return new FillInTheBlankRenderer(question);
      case 'odd-one-out':
        return new OddOneOutRenderer(question);
      case 'spell-it-out':
        return new SpellItOutRenderer(question);
      case 'word-scramble':
        return new WordScrambleRenderer(question);
      case 'organize-tags':
        return new OrganizeTagsRenderer(question);
      case 'categorize-items':
        return new CategorizeItemsRenderer(question);
      case 'sequence-order':
        return new SequenceOrderRenderer(question);
      case 'connect-terms':
        return new ConnectTermsRenderer(question);
      case 'ipa-transcriber':
        return new IPATranscriberRenderer(question);
      default:
        return new MultipleChoiceRenderer(question);
    }
  }
};

class BaseRenderer {
  constructor(question) {
    this.question = question;
    this.container = null;
    this.timer = null;
    this.streak = 0;
  }

  getIcon() { return "🚀"; }

  async render(container) {
    this.container = container;

    // Get current streak
    const storage = await chrome.storage.local.get(['dailyStreak']);
    this.streak = storage.dailyStreak || 0;

    let youtubeHtml = "";
    if (this.question.videoId) {
      youtubeHtml = `
        <div class="video-container">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${this.question.videoId}?rel=0&autoplay=0&showinfo=0&controls=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
      `;
    }

    const streakHtml = this.streak > 0 ? `
      <div class="streak-badge">
        <span class="streak-fire">🔥</span>
        <span class="streak-count">${this.streak} Day Streak!</span>
      </div>
    ` : "";

    container.innerHTML = `
      <div class="timer-container">
        <svg class="timer-svg" viewBox="0 0 40 40">
          <circle class="timer-bg" cx="20" cy="20" r="18"></circle>
          <circle class="timer-progress" cx="20" cy="20" r="18" stroke-dasharray="113.1" stroke-dashoffset="0"></circle>
        </svg>
        <div id="timer-text" class="timer-text">120</div>
      </div>
      <div class="brain-lock-header">
        <div class="modal-logo">${this.getIcon()}</div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
          <h1>Brain Lock</h1>
          ${streakHtml}
        </div>
        <div class="header-metadata">
          <span class="category-tag">${this.question.category || 'Standard'}</span>
          <span class="difficulty-tag">Normal</span>
        </div>
        <p>Answer this question correctly to unlock your browser</p>
      </div>
      <div class="brain-lock-content">
        ${youtubeHtml}
        <div class="question-text">${this.question.question}</div>
        <div class="interactive-area"></div>
        <div id="feedback-message" class="feedback-message"></div>
        <button id="brain-lock-submit" class="submit-button">Submit Answer</button>
      </div>
      <div class="brain-lock-footer"><p>Get it wrong? You'll get another question until you answer correctly!</p></div>
    `;

    const area = container.querySelector('.interactive-area');
    this.renderInteractiveArea(area);
    this.setupEventListeners(container);
    this.startTimer(container);
  }

  startTimer(container) {
    const progressCircle = container.querySelector('.timer-progress');
    const timerText = container.querySelector('#timer-text');
    const totalTime = 120;
    const circumference = 2 * Math.PI * 18;

    this.timer = new Timer(totalTime, (remaining) => {
      timerText.textContent = remaining;
      const offset = circumference - (remaining / totalTime) * circumference;
      progressCircle.style.strokeDashoffset = offset;

      if (remaining <= 20) progressCircle.style.stroke = "#ff4d4d";
      else if (remaining <= 60) progressCircle.style.stroke = "#ff8c00";
    }, () => {
      this.getAnswerAndSubmit();
    });
    this.timer.start();
  }

  getAnswerAndSubmit() {
    const submitBtn = this.container.querySelector('#brain-lock-submit');
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
    }
  }

  renderInteractiveArea(area) {
    area.innerHTML = `<p style="color: #ff4d4d;">Question type "${this.question.type}" not yet implemented.</p>`;
  }

  setupEventListeners(container) {
    const submitBtn = container.querySelector('#brain-lock-submit');
    submitBtn.addEventListener('click', () => {
      const answer = this.getAnswer();
      if (answer === null || answer === "" || (Array.isArray(answer) && answer.some(a => a === ""))) {
        showFeedback("Please provide an answer!", true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Checking...";
      this.disableInput();
      if (this.timer) this.timer.stop();

      chrome.runtime.sendMessage({
        action: "checkAnswer",
        answer: answer,
        remainingTime: this.timer ? this.timer.getRemainingTime() : 0
      }, (response) => {
        this.handleResponse(response, container);
      });
    });
  }

  getAnswer() { return null; }
  disableInput() {}

  handleResponse(response, container) {
    if (response.correct) {
      const canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      shadowRoot.appendChild(canvas);
      activeConfetti = new Confetti(canvas);
      activeConfetti.burst();
    }

    container.classList.add('screen-fade-exit-active');
    setTimeout(() => {
      this.renderResultScreen(response, container);
    }, 300);
  }

  renderResultScreen(response, container) {
    container.innerHTML = "";
    container.className = "brain-lock-container result-screen screen-fade-enter";

    const encouragingTitles = ["Brilliant!", "Superstar!", "Amazing!", "Genius!", "Excellent!", "Correct!"];
    const failureTitles = ["Almost there!", "Keep going!", "Not quite!", "Try again!", "Oops!"];
    const title = response.correct ?
      encouragingTitles[Math.floor(Math.random() * encouragingTitles.length)] :
      failureTitles[Math.floor(Math.random() * failureTitles.length)];

    const xpSection = response.correct ? `
      <div class="xp-award-container">
        <div class="xp-amount">+${response.xpEarned} XP</div>
        ${response.multiplier > 1 ? `<div class="xp-multiplier-tag">${response.multiplier}x Streak Bonus!</div>` : ""}
        <div class="xp-progress-container">
          <div id="xp-bar" class="xp-progress-bar"></div>
        </div>
      </div>
    ` : "";

    container.innerHTML = `
      <h2 class="result-title">${title}</h2>
      <p style="font-size: 18px; color: #a5b4fc;">${response.feedback}</p>

      ${xpSection}

      <div class="explanation-container">
        <div class="explanation-label">Explanation</div>
        <div class="explanation-text">${this.question.generalFeedback || "No extra explanation for this one."}</div>
      </div>

      <div class="result-actions">
        ${response.correct ?
          `<button id="done-btn" class="submit-button continue-btn">I'm Done</button>` :
          `<button id="next-q-btn" class="submit-button try-again-btn">Try Another Question</button>`
        }
        <button id="next-fresh-btn" class="submit-button" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">Next Question</button>
      </div>
    `;

    setTimeout(() => {
      container.classList.remove('screen-fade-enter');
      container.classList.add('screen-fade-enter-active');

      if (response.correct) {
        const bar = container.querySelector('#xp-bar');
        if (bar) {
          // Progress bar animation: calculate percentage based on 1000 XP levels (simple)
          const progress = (response.newTotalXP % 1000) / 10;
          setTimeout(() => bar.style.width = `${progress}%`, 100);
        }
      }
    }, 10);

    const doneBtn = container.querySelector('#done-btn');
    if (doneBtn) doneBtn.addEventListener('click', () => removeLockScreen());

    const nextQBtn = container.querySelector('#next-q-btn');
    if (nextQBtn) nextQBtn.addEventListener('click', () => {
       showLockScreen(response.newQuestion);
    });

    const nextFreshBtn = container.querySelector('#next-fresh-btn');
    if (nextFreshBtn) nextFreshBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: "getQuestion" }, (res) => {
        showLockScreen(res.question);
      });
    });
  }

  showCorrectAnswer(response, container) {
    const feedbackEl = container.querySelector('#feedback-message');
    feedbackEl.innerHTML += `<div class="correct-answer-text">The correct answer was: <strong>${response.correctAnswerText}</strong></div>`;
    if (response.correctAnswerFeedback) {
      const cleanedFeedback = response.correctAnswerFeedback.replace(/^Correct\.\s*/, '');
      feedbackEl.innerHTML += `<div class="correct-answer-feedback">${cleanedFeedback}</div>`;
    }
  }
}

class MultipleChoiceRenderer extends BaseRenderer {
  renderInteractiveArea(area) {
    const shuffledAnswers = [...this.question.answers].sort(() => Math.random() - 0.5);
    area.className = 'answers-container';
    area.innerHTML = shuffledAnswers.map((answer, index) => `
      <div class="answer-option" data-answer="${answer.text}">
        <input type="radio" name="answer" id="answer${index}" value="${answer.text}">
        <label for="answer${index}">${answer.text}</label>
      </div>
    `).join('');
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const options = container.querySelectorAll('.answer-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled) return;
        const radio = option.querySelector('input[type="radio"]');
        radio.checked = true;
        options.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }

  getAnswer() {
    const selected = this.container.querySelector('input[name="answer"]:checked');
    return selected ? selected.value : null;
  }

  disableInput() {
    this.container.querySelectorAll('.answer-option input').forEach(input => input.disabled = true);
  }

  showCorrectAnswer(response, container) {
    const selectedAnswer = this.getAnswer();
    const correctAnswer = response.correctAnswerText;

    container.querySelectorAll('.answer-option').forEach(option => {
      const answerText = option.dataset.answer;
      if (answerText === correctAnswer) {
        option.classList.add('correct-choice');
      } else if (answerText === selectedAnswer) {
        option.classList.add('incorrect-choice');
      }
    });
    super.showCorrectAnswer(response, container);
  }
}

class TrueFalseRenderer extends MultipleChoiceRenderer {
  getIcon() { return "⚖️"; }
  renderInteractiveArea(area) {
    this.question.answers = [
      { text: "True", feedback: this.question.answers.find(a => a.text === "True")?.feedback || "Correct!" },
      { text: "False", feedback: this.question.answers.find(a => a.text === "False")?.feedback || "Incorrect." }
    ];
    super.renderInteractiveArea(area);
  }
}

class ShortAnswerRenderer extends BaseRenderer {
  getIcon() { return "✏️"; }
  renderInteractiveArea(area) {
    area.innerHTML = `
      <div class="short-answer-container">
        <input type="text" id="short-answer-input" class="text-input" placeholder="Type your answer here..." autocomplete="off">
      </div>
    `;
  }
  getAnswer() {
    return this.container.querySelector('#short-answer-input').value;
  }
  disableInput() {
    this.container.querySelector('#short-answer-input').disabled = true;
  }
}

class FillInTheBlankRenderer extends BaseRenderer {
  getIcon() { return "🧩"; }
  renderInteractiveArea(area) {
    const parts = this.question.question.split('___');
    let html = '<div class="fitb-container">';
    parts.forEach((part, index) => {
      html += `<span>${part}</span>`;
      if (index < parts.length - 1) {
        html += `<input type="text" class="text-input fitb-input" data-index="${index}" style="display: inline-block; width: auto; min-width: 100px; padding: 4px 8px; margin: 0 5px;" autocomplete="off">`;
      }
    });
    html += '</div>';
    area.innerHTML = html;

    // Update the question text area to be empty since we are rendering the question in the interactive area
    this.container.querySelector('.question-text').style.display = 'none';
  }

  getAnswer() {
    const inputs = this.container.querySelectorAll('.fitb-input');
    if (inputs.length === 1) return inputs[0].value;
    return Array.from(inputs).map(input => input.value);
  }

  disableInput() {
    this.container.querySelectorAll('.fitb-input').forEach(input => input.disabled = true);
  }
}

class OddOneOutRenderer extends MultipleChoiceRenderer {
  getIcon() { return "🔍"; }
}

class SpellItOutRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.currentSpelling = "";
    this.letterPool = this.generateLetterPool();
  }

  getIcon() { return "🔠"; }

  generateLetterPool() {
    const correct = this.question.correctAnswer.toUpperCase().split('');
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const decoys = [];
    for (let i = 0; i < 5; i++) {
      decoys.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }
    return [...correct, ...decoys].sort(() => Math.random() - 0.5);
  }

  renderInteractiveArea(area) {
    area.innerHTML = `
      <div class="spelled-word-container" id="spelled-word"></div>
      <div class="letter-pool" id="letter-pool">
        ${this.letterPool.map(l => `<div class="letter-tile">${l}</div>`).join('')}
      </div>
      <button id="clear-spelling" class="submit-button try-again-btn" style="margin-top: 15px; padding: 10px;">Clear</button>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const tiles = container.querySelectorAll('.letter-tile');
    const display = container.querySelector('#spelled-word');
    const clearBtn = container.querySelector('#clear-spelling');

    tiles.forEach(tile => {
      tile.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled) return;
        this.currentSpelling += tile.textContent;
        display.textContent = this.currentSpelling;
      });
    });

    clearBtn.addEventListener('click', () => {
      if (container.querySelector('#brain-lock-submit').disabled) return;
      this.currentSpelling = "";
      display.textContent = "";
    });
  }

  getAnswer() {
    return this.currentSpelling;
  }

  disableInput() {
    this.container.querySelectorAll('.letter-tile').forEach(t => t.style.pointerEvents = 'none');
    this.container.querySelector('#clear-spelling').disabled = true;
  }
}

class WordScrambleRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.scrambledLetters = this.question.correctAnswer.toUpperCase().split('').sort(() => Math.random() - 0.5);
    this.currentGuess = [];
  }

  getIcon() { return "🔀"; }

  renderInteractiveArea(area) {
    area.innerHTML = `
      <div class="spelled-word-container" id="scramble-guess"></div>
      <div class="scramble-container" id="scramble-pool">
        ${this.scrambledLetters.map((l, i) => `<div class="letter-tile" data-index="${i}">${l}</div>`).join('')}
      </div>
      <button id="clear-scramble" class="submit-button try-again-btn" style="margin-top: 15px; padding: 10px;">Clear</button>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const tiles = container.querySelectorAll('.letter-tile');
    const display = container.querySelector('#scramble-guess');
    const clearBtn = container.querySelector('#clear-scramble');

    tiles.forEach(tile => {
      tile.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled || tile.classList.contains('selected-tile')) return;
        this.currentGuess.push(tile.textContent);
        tile.classList.add('selected-tile');
        display.textContent = this.currentGuess.join('');
      });
    });

    clearBtn.addEventListener('click', () => {
      if (container.querySelector('#brain-lock-submit').disabled) return;
      this.currentGuess = [];
      display.textContent = "";
      tiles.forEach(tile => tile.classList.remove('selected-tile'));
    });
  }

  getAnswer() {
    return this.currentGuess.join('');
  }

  disableInput() {
    this.container.querySelectorAll('.letter-tile').forEach(t => t.style.pointerEvents = 'none');
    this.container.querySelector('#clear-scramble').disabled = true;
  }
}

class OrganizeTagsRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.userAssignments = {}; // { tagText: bucketName }
  }

  getIcon() { return "🏷️"; }

  renderInteractiveArea(area) {
    area.className = 'interactive-area organize-tags-container';

    let bucketsHtml = this.question.buckets.map(bucket => `
      <div class="tag-bucket" data-bucket="${bucket}">
        <div class="bucket-name">${bucket}</div>
        <div class="bucket-items"></div>
      </div>
    `).join('');

    let poolHtml = `
      <div class="tag-pool">
        ${this.question.items.map((item, i) => `
          <div class="draggable-tag" draggable="true" id="tag-${i}" data-text="${item.text}">
            ${item.text}
          </div>
        `).join('')}
      </div>
    `;

    area.innerHTML = `
      ${poolHtml}
      <div class="buckets-container">
        ${bucketsHtml}
      </div>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const tags = container.querySelectorAll('.draggable-tag');
    const buckets = container.querySelectorAll('.tag-bucket');
    const pool = container.querySelector('.tag-pool');

    tags.forEach(tag => {
      tag.addEventListener('dragstart', (e) => {
        if (container.querySelector('#brain-lock-submit').disabled) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/plain', tag.id);
        tag.classList.add('dragging');
      });

      tag.addEventListener('dragend', () => {
        tag.classList.remove('dragging');
      });
    });

    buckets.forEach(bucket => {
      bucket.addEventListener('dragover', (e) => {
        e.preventDefault();
        bucket.classList.add('drag-over');
      });

      bucket.addEventListener('dragleave', () => {
        bucket.classList.remove('drag-over');
      });

      bucket.addEventListener('drop', (e) => {
        e.preventDefault();
        bucket.classList.remove('drag-over');
        const tagId = e.dataTransfer.getData('text/plain');
        const tag = container.querySelector(`#${tagId}`);
        if (tag) {
          const itemsContainer = bucket.querySelector('.bucket-items');
          itemsContainer.appendChild(tag);
          this.userAssignments[tag.dataset.text] = bucket.dataset.bucket;
        }
      });
    });

    pool.addEventListener('dragover', (e) => {
      e.preventDefault();
      pool.classList.add('drag-over');
    });

    pool.addEventListener('dragleave', () => {
      pool.classList.remove('drag-over');
    });

    pool.addEventListener('drop', (e) => {
      e.preventDefault();
      pool.classList.remove('drag-over');
      const tagId = e.dataTransfer.getData('text/plain');
      const tag = container.querySelector(`#${tagId}`);
      if (tag) {
        pool.appendChild(tag);
        delete this.userAssignments[tag.dataset.text];
      }
    });
  }

  getAnswer() {
    if (Object.keys(this.userAssignments).length < this.question.items.length) {
      return null;
    }
    return this.userAssignments;
  }

  disableInput() {
    this.container.querySelectorAll('.draggable-tag').forEach(tag => {
      tag.setAttribute('draggable', 'false');
      tag.style.cursor = 'default';
    });
  }
}

class ConnectTermsRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.leftColumn = [...this.question.leftColumn].sort(() => Math.random() - 0.5);
    this.rightColumn = [...this.question.rightColumn].sort(() => Math.random() - 0.5);
    this.selectedLeft = null;
    this.matches = {}; // { leftTerm: rightTerm }
  }

  getIcon() { return "🔗"; }

  renderInteractiveArea(area) {
    area.className = 'interactive-area connect-terms-container';

    let leftHtml = this.leftColumn.map(term => `
      <div class="term-item left-term" data-term="${term}">${term}</div>
    `).join('');

    let rightHtml = this.rightColumn.map(term => `
      <div class="term-item right-term" data-term="${term}">${term}</div>
    `).join('');

    area.innerHTML = `
      <div class="connect-columns">
        <div class="connect-column left-column">${leftHtml}</div>
        <div class="connect-column right-column">${rightHtml}</div>
      </div>
      <div id="matches-display" class="matches-display"></div>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const leftTerms = container.querySelectorAll('.left-term');
    const rightTerms = container.querySelectorAll('.right-term');

    leftTerms.forEach(term => {
      term.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled) return;
        leftTerms.forEach(t => t.classList.remove('selected'));
        term.classList.add('selected');
        this.selectedLeft = term.dataset.term;
      });
    });

    rightTerms.forEach(term => {
      term.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled || !this.selectedLeft) return;

        // Remove previous match if this right term was already matched
        for (let left in this.matches) {
          if (this.matches[left] === term.dataset.term) {
            delete this.matches[left];
            container.querySelector(`.left-term[data-term="${left}"]`).classList.remove('matched');
          }
        }

        this.matches[this.selectedLeft] = term.dataset.term;

        // Visual feedback
        container.querySelector(`.left-term[data-term="${this.selectedLeft}"]`).classList.add('matched');
        container.querySelector(`.left-term[data-term="${this.selectedLeft}"]`).classList.remove('selected');
        term.classList.add('matched');

        this.selectedLeft = null;
        this.updateMatchesDisplay(container);
      });
    });
  }

  updateMatchesDisplay(container) {
    const display = container.querySelector('#matches-display');
    display.innerHTML = Object.entries(this.matches).map(([l, r]) => `
      <div class="match-pair"><span>${l}</span> ➔ <span>${r}</span></div>
    `).join('');
  }

  getAnswer() {
    if (Object.keys(this.matches).length < this.leftColumn.length) return null;
    return this.matches;
  }

  disableInput() {
    this.container.querySelectorAll('.term-item').forEach(t => t.style.pointerEvents = 'none');
  }
}

class CategorizeItemsRenderer extends OrganizeTagsRenderer {
  getIcon() { return "🗂️"; }
}

class IPATranscriberRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.userInput = []; // Array of IPA symbols
  }

  getIcon() { return "🗣️"; }

  renderInteractiveArea(area) {
    area.className = 'interactive-area ipa-transcriber-container';
    area.innerHTML = `
      <div class="ipa-input-box">
        <div class="ipa-display"><span id="ipa-text"></span><span class="cursor">|</span></div>
        <button id="ipa-backspace" class="ipa-key backspace-key">⌫</button>
      </div>
      <div class="ipa-keyboard">
        <div class="keyboard-section">
          <div class="section-label">Consonants</div>
          <div class="key-grid">
            ${['p','b','t','d','k','g','f','v','θ','ð','s','z','ʃ','ʒ','h','m','n','ŋ','r','l','j','w','tʃ','dʒ'].map(s => `<button class="ipa-key" data-symbol="${s}">${s}</button>`).join('')}
          </div>
        </div>
        <div class="keyboard-section">
          <div class="section-label">Vowels & Diphthongs</div>
          <div class="key-grid">
            ${['iː','ɪ','e','æ','ɑː','ɒ','ɔː','ʊ','uː','ʌ','ɜː','ə','eɪ','aɪ','ɔɪ','əʊ','aʊ','ɪə','eə','ʊə'].map(s => `<button class="ipa-key" data-symbol="${s}">${s}</button>`).join('')}
          </div>
        </div>
        <div class="keyboard-section">
          <div class="section-label">Marks</div>
          <div class="key-grid">
            ${['ˈ','ˌ','.', 'ː', '/'].map(s => `<button class="ipa-key" data-symbol="${s}">${s}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const keys = container.querySelectorAll('.ipa-key:not(.backspace-key)');
    const backspace = container.querySelector('#ipa-backspace');
    const display = container.querySelector('#ipa-text');

    keys.forEach(key => {
      key.addEventListener('click', () => {
        if (container.querySelector('#brain-lock-submit').disabled) return;
        const symbol = key.dataset.symbol;
        this.userInput.push(symbol);
        this.updateDisplay(display);
      });
    });

    backspace.addEventListener('click', () => {
      if (container.querySelector('#brain-lock-submit').disabled) return;
      this.userInput.pop();
      this.updateDisplay(display);
    });
  }

  updateDisplay(display) {
    display.textContent = this.userInput.join('');
  }

  getAnswer() {
    return this.userInput.join('');
  }

  disableInput() {
    this.container.querySelectorAll('.ipa-key').forEach(k => k.disabled = true);
  }
}

class SequenceOrderRenderer extends BaseRenderer {
  constructor(question) {
    super(question);
    this.currentOrder = [...this.question.items].sort(() => Math.random() - 0.5);
  }

  getIcon() { return "🔢"; }

  renderInteractiveArea(area) {
    area.className = 'interactive-area sequence-order-container';
    area.innerHTML = `
      <div class="draggable-list" id="sequence-list">
        ${this.currentOrder.map((item, i) => `
          <div class="sequence-row" draggable="true" id="seq-item-${i}" data-text="${item}">
            <span class="order-handle">⠿</span>
            <span class="row-text">${item}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  setupEventListeners(container) {
    super.setupEventListeners(container);
    const list = container.querySelector('#sequence-list');
    const rows = container.querySelectorAll('.sequence-row');

    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        if (container.querySelector('#brain-lock-submit').disabled) {
          e.preventDefault();
          return;
        }
        row.classList.add('dragging');
        e.dataTransfer.setData('text/plain', row.id);
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
      });
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingRow = container.querySelector('.dragging');
      const afterElement = this.getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggingRow);
      } else {
        list.insertBefore(draggingRow, afterElement);
      }
    });

    list.addEventListener('drop', (e) => {
      e.preventDefault();
      this.updateInternalOrder();
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sequence-row:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  updateInternalOrder() {
    const rows = this.container.querySelectorAll('.sequence-row');
    this.currentOrder = Array.from(rows).map(row => row.dataset.text);
  }

  getAnswer() {
    return this.currentOrder;
  }

  disableInput() {
    this.container.querySelectorAll('.sequence-row').forEach(row => {
      row.setAttribute('draggable', 'false');
      row.style.cursor = 'default';
    });
  }
}

async function showLockScreen(question, stage = 'question') {
  const existingHost = document.getElementById('brain-lock-host');
  if (existingHost) existingHost.remove();

  const host = document.createElement('div');
  host.id = 'brain-lock-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('lock.css');
  shadowRoot.appendChild(link);

  const overlay = document.createElement('div');
  overlay.id = 'brain-lock-overlay';
  shadowRoot.appendChild(overlay);

  await renderStage(overlay, stage, question);

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

async function renderStage(overlay, stage, data) {
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
        <h1>Choose Your Category</h1>
        <p>${data === 'System Picks' ? "The wheel decided! Randomizing..." : "The choice is yours! Pick a category for today."}</p>
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
      setTimeout(() => {
        const categories = ['Academic', 'YouTube', 'IPA'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const card = shadowRoot.querySelector(`.category-card[data-category="${randomCategory}"]`);
        if (card) {
          card.style.transform = "scale(1.1) translateY(-20px)";
          card.style.borderColor = "#fff";
          card.style.boxShadow = "0 0 30px rgba(255,255,255,0.5)";
        }
        setTimeout(() => selectCategory(randomCategory), 1500);
      }, 1000);
    } else {
      shadowRoot.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => selectCategory(card.dataset.category));
      });
    }
  } else {
    overlay.appendChild(container);
    currentRenderer = QuestionRendererFactory.createRenderer(data);
    await currentRenderer.render(container);
  }
}

function selectCategory(category) {
  chrome.runtime.sendMessage({ action: "setDailyCategory", category: category }, (response) => {
    if (response.success) {
      const overlay = shadowRoot.getElementById('brain-lock-overlay');
      const container = shadowRoot.querySelector('.brain-lock-container');
      container.classList.add('fade-out');
      setTimeout(async () => {
        container.remove();
        await renderStage(overlay, 'question', response.question);
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
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 10, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 2;
      ctx.stroke();

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

    ctx.beginPath();
    ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "#4facfe";
    ctx.lineWidth = 4;
    ctx.stroke();
    
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
    velocity = Math.random() * 0.4 + 0.3;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.style.animation = "none";
    spinBtn.style.opacity = "0.5";
    rotate();
  });

  drawWheel();
}

function removeLockScreen() {
  // Cleanup logic
  if (currentRenderer && currentRenderer.timer) {
    currentRenderer.timer.stop();
  }
  if (activeConfetti) {
    activeConfetti.destroy();
    activeConfetti = null;
  }

  const host = document.getElementById('brain-lock-host');
  if (host) {
    const overlay = shadowRoot.getElementById('brain-lock-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      overlay.addEventListener('animationend', () => {
        host.remove();
      }, { once: true });
      setTimeout(() => {
        if (document.getElementById('brain-lock-host')) host.remove();
      }, 500);
    } else {
      host.remove();
    }
  }
}

function showFeedback(message, isIncorrect) {
  const feedbackEl = shadowRoot.getElementById('feedback-message');
  if (feedbackEl) {
    feedbackEl.textContent = message;
    feedbackEl.className = isIncorrect ? 'feedback-message incorrect' : 'feedback-message correct';
    feedbackEl.style.display = 'block';
  }
}
