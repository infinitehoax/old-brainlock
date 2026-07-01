document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const statsEl = document.getElementById('stats');
  const optionsBtn = document.getElementById('optionsBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Update popup status on load
  chrome.storage.local.get(['isLocked', 'answeredQuestions', 'questions'], (result) => {
      statusEl.textContent = result.isLocked ? '🔒 Browser is currently locked' : '✅ Browser is unlocked';
      statusEl.className = result.isLocked ? 'status locked' : 'status unlocked';
      
      const answeredCount = result.answeredQuestions ? result.answeredQuestions.length : 0;
      const totalCount = result.questions ? result.questions.length : 'N/A';
      
      statsEl.innerHTML = `
        <strong>Questions answered:</strong> ${answeredCount} / ${totalCount}<br>
        <small>Progress resets when all questions are answered.</small>
      `;
  });

  // "Edit Questions" button
  optionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
  });

  // "Reset Progress" button
  resetBtn.addEventListener('click', () => {
      if (confirm('This will reset your answered questions progress and lock the browser immediately. Continue?')) {
          chrome.storage.local.set({
              isLocked: true,
              answeredQuestions: []
          }, () => {
              // Tell background script to re-lock all tabs
              chrome.alarms.create('forceLock', { when: Date.now() });
              window.close();
          });
      }
  });
});