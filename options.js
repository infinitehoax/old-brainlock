document.addEventListener('DOMContentLoaded', () => {
    const questionsTextarea = document.getElementById('questionsJson');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const statusEl = document.getElementById('status');

    // Fetch default questions from background (single source of truth)
    let defaultQuestions = [];

    const showStatus = (message, isError = false) => {
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
        statusEl.style.color = isError ? '#721c24' : '#155724';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    };

    // Load defaults first, then populate editor
    chrome.runtime.sendMessage({ action: 'getDefaultQuestions' }, (resp) => {
      defaultQuestions = resp && resp.defaultQuestions ? resp.defaultQuestions : [];
      chrome.storage.local.get('questions', (data) => {
        const questions = data.questions || defaultQuestions;
        questionsTextarea.value = JSON.stringify(questions, null, 2);
      });
    });

    // Save button event listener
    saveBtn.addEventListener('click', () => {
      try {
        const parsedQuestions = JSON.parse(questionsTextarea.value);
        // Basic validation
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error("JSON must be a non-empty array.");
        }
        chrome.storage.local.set({ questions: parsedQuestions }, () => {
          showStatus('Questions saved successfully!');
        });
      } catch (e) {
        showStatus(`Error: Invalid JSON format. ${e.message}`, true);
      }
    });

    // Reset button event listener
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset to the default questions? All your changes will be lost.')) {
        chrome.storage.local.set({ questions: defaultQuestions }, () => {
          questionsTextarea.value = JSON.stringify(defaultQuestions, null, 2);
          showStatus('Questions have been reset to default.');
        });
      }
    });
});