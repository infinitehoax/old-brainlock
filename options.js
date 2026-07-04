document.addEventListener('DOMContentLoaded', () => {
    const questionsTextarea = document.getElementById('questionsJson');
    const saveBtn = document.getElementById('saveBtn');
    const fetchBtn = document.getElementById('fetchBtn');
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
      chrome.storage.local.get(['questions', 'githubPingInterval', 'breakInterval', 'activeHours'], (data) => {
        const questions = data.questions || defaultQuestions;
        const config = {};
        if (data.githubPingInterval) config.githubPingInterval = data.githubPingInterval;
        if (data.breakInterval) config.brainLockInterval = data.breakInterval;
        if (data.activeHours) config.activeHours = data.activeHours;

        const output = {
          config: config,
          questions: questions
        };
        questionsTextarea.value = JSON.stringify(output, null, 2);
      });
    });

    // Save button event listener
    saveBtn.addEventListener('click', () => {
      try {
        const data = JSON.parse(questionsTextarea.value);
        let questions = [];
        let config = null;

        if (Array.isArray(data)) {
          questions = data;
        } else if (data && data.questions && Array.isArray(data.questions)) {
          questions = data.questions;
          config = data.config;
        } else {
          throw new Error("JSON must be an array of questions or an object containing a 'questions' array.");
        }

        if (questions.length === 0) {
          throw new Error("Questions array cannot be empty.");
        }

        const storageData = { questions: questions };
        if (config) {
          if (config.githubPingInterval) storageData.githubPingInterval = config.githubPingInterval;
          if (config.brainLockInterval) storageData.breakInterval = config.brainLockInterval;
          if (config.activeHours) storageData.activeHours = config.activeHours;
        }

        chrome.storage.local.set(storageData, () => {
          showStatus('Questions and Configuration saved successfully!');
          // Trigger alarm setup if config changed
          if (config) {
            chrome.runtime.sendMessage({ action: 'updateInterval', interval: storageData.breakInterval });
          }
        });
      } catch (e) {
        showStatus(`Error: Invalid JSON format. ${e.message}`, true);
      }
    });

    // Fetch Latest button event listener
    fetchBtn.addEventListener('click', () => {
        fetchBtn.disabled = true;
        fetchBtn.textContent = 'Fetching...';
        chrome.runtime.sendMessage({ action: 'forceFetchQuestions' }, (resp) => {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Fetch Latest from GitHub';
            if (resp && resp.success) {
                questionsTextarea.value = JSON.stringify(resp.questions, null, 2);
                showStatus('Latest questions fetched and updated!');
            } else {
                showStatus('Failed to fetch questions from GitHub.', true);
            }
        });
    });

    // Reset button event listener
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset to the bundled default questions? All your changes will be lost.')) {
        chrome.storage.local.set({ questions: defaultQuestions }, () => {
          questionsTextarea.value = JSON.stringify(defaultQuestions, null, 2);
          showStatus('Questions have been reset to bundled defaults.');
        });
      }
    });
});