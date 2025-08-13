(() => {
  // Try to grab latest ChatGPT answer
  const chatGPTBlocks = document.querySelectorAll('div.markdown');
  const chatGPT = chatGPTBlocks[chatGPTBlocks.length - 1];
  if (chatGPT) return chatGPT.innerText.trim();

  // Fallback to Claude's latest answer
  const claudeBlocks = document.querySelectorAll('div.grid.grid-cols-1');
  const claude = claudeBlocks[claudeBlocks.length - 1];
  if (claude) return claude.innerText.trim();

  return null;
})();
