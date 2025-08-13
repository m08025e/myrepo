function getLatestAnswer() {
  const chatGPTBlocks = document.querySelectorAll('div.markdown');
  const chatGPT = chatGPTBlocks[chatGPTBlocks.length - 1];
  if (chatGPT) return chatGPT.innerText.trim();

  // Claude's answer container uses the `font-claude-response` class
  const claudeBlocks = document.querySelectorAll('.font-claude-response');
  const claude = claudeBlocks[claudeBlocks.length - 1];
  if (claude) {
    const content = claude.querySelector('.grid') || claude;
    return content.innerText.trim();
  }

  return null;
}

function insertActionButton() {
  const buttons = document.querySelectorAll('button[data-testid="copy-turn-action-button"]');
  const actionBar = buttons.length ? buttons[buttons.length - 1].parentElement : null;
  if (!actionBar || actionBar.querySelector('#obsidian-save-btn')) return;

  const button = document.createElement('button');
  button.id = 'obsidian-save-btn';
  button.className = 'text-token-text-secondary hover:bg-token-bg-secondary rounded-lg';
  button.setAttribute('aria-label', 'Obsidianへ保存');
  button.innerHTML = '<span class="touch:w-10 flex h-8 w-8 items-center justify-center">💾</span>';
  button.addEventListener('click', () => {
    const text = getLatestAnswer();
    if (text) {
      chrome.runtime.sendMessage({ type: 'SAVE_OBSIDIAN', payload: text });
    } else {
      alert('保存できるメッセージが見つかりませんでした。');
    }
  });
  actionBar.appendChild(button);
}

function createFallbackButton() {
  if (document.getElementById('obsidian-save-btn')) return;
  const button = document.createElement('button');
  button.id = 'obsidian-save-btn';
  button.textContent = 'Obsidianへ保存';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    padding: '8px 12px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  });
  button.addEventListener('click', () => {
    const text = getLatestAnswer();
    if (text) {
      chrome.runtime.sendMessage({ type: 'SAVE_OBSIDIAN', payload: text });
    } else {
      alert('保存できるメッセージが見つかりませんでした。');
    }
  });
  document.body.appendChild(button);
}

function init() {
  insertActionButton();
  if (!document.getElementById('obsidian-save-btn')) {
    createFallbackButton();
  }
}

const observer = new MutationObserver(insertActionButton);
observer.observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
