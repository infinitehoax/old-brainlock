document.addEventListener('DOMContentLoaded', () => {
  const breaksTodayEl = document.getElementById('breaksToday');
  const lifetimeBreaksEl = document.getElementById('lifetimeBreaks');
  const dailyCategoryEl = document.getElementById('dailyCategory');
  const currentStreakEl = document.getElementById('currentStreak');
  const totalXPEl = document.getElementById('totalXP');
  const intervalInput = document.getElementById('intervalInput');
  const testBtn = document.getElementById('testBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusMsg = document.getElementById('statusMsg') || document.getElementById('status-msg');

  function showStatus(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = isError ? 'error-text' : 'success-text';
    statusMsg.style.opacity = '1';
    setTimeout(() => {
      statusMsg.style.opacity = '0';
    }, 3000);
  }

  // Initial load
  chrome.storage.local.get([
    'breaksToday',
    'lifetimeBreaks',
    'dailyCategory',
    'dailyStreak',
    'totalXP',
    'breakInterval'
  ], (result) => {
    breaksTodayEl.textContent = result.breaksToday || 0;
    lifetimeBreaksEl.textContent = result.lifetimeBreaks || 0;
    dailyCategoryEl.textContent = result.dailyCategory || 'None Set';
    currentStreakEl.textContent = `${result.dailyStreak || 0} Days`;
    totalXPEl.textContent = (result.totalXP || 0).toLocaleString();
    intervalInput.value = result.breakInterval || 30;
  });

  // Handle interval changes
  intervalInput.addEventListener('change', () => {
    let val = parseInt(intervalInput.value);
    if (isNaN(val)) val = 30;
    if (val < 5) val = 5;
    if (val > 120) val = 120;
    intervalInput.value = val;

    chrome.runtime.sendMessage({ action: 'updateInterval', interval: val }, (response) => {
      if (response && response.success) {
        showStatus('Interval updated!');
      }
    });
  });

  // Test Break Now
  testBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab) return;

      const url = activeTab.url || "";
      const isInjectable = url &&
                           !url.startsWith('chrome://') &&
                           !url.startsWith('chrome-extension://') &&
                           !url.startsWith('https://chrome.google.com/webstore') &&
                           !url.startsWith('https://chromewebstore.google.com');

      if (!isInjectable) {
        showStatus('Cannot trigger on this page', true);
        return;
      }

      chrome.runtime.sendMessage({
        action: 'testBreakNow',
        tabId: activeTab.id
      }, (response) => {
        if (response && response.success) {
          window.close(); // Close popup to see the effect
        }
      });
    });
  });

  // Edit Questions
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Reset Progress
  resetBtn.addEventListener('click', () => {
    if (confirm('This will reset your answered questions progress and lock the browser immediately. Continue?')) {
      chrome.storage.local.set({
        isLocked: true,
        answeredQuestions: []
      }, () => {
        // Trigger a fresh lock immediately
        chrome.runtime.sendMessage({ action: 'testBreakNow' }, () => {
           window.close();
        });
      });
    }
  });

  // Listen for storage changes to update stats in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.breaksToday) breaksTodayEl.textContent = changes.breaksToday.newValue;
    if (changes.lifetimeBreaks) lifetimeBreaksEl.textContent = changes.lifetimeBreaks.newValue;
    if (changes.dailyCategory) dailyCategoryEl.textContent = changes.dailyCategory.newValue || 'None Set';
    if (changes.dailyStreak) currentStreakEl.textContent = `${changes.dailyStreak.newValue} Days`;
    if (changes.totalXP) totalXPEl.textContent = changes.totalXP.newValue.toLocaleString();
  });
});
