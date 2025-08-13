// Respond to toolbar icon clicks
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  // Ensure script runs only on ChatGPT or Claude pages
  if (!/chat\.openai\.com|claude\.ai/.test(tab.url || "")) {
    console.log("Unsupported page");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }, (results) => {
    if (chrome.runtime.lastError || !results || !results.length) {
      console.error('Script injection failed:', chrome.runtime.lastError);
      return;
    }
    const text = results[0].result;
    if (!text) {
      console.warn('No text found to save');
      return;
    }

    const vaultName = 'YOUR_VAULT_NAME'; // replace with your Obsidian vault
    const encodedText = encodeURIComponent(text);
    const today = new Date().toISOString().slice(0, 10);
    const fileName = encodeURIComponent(`LLM Note ${today}`);
    const obsidianUri = `obsidian://new?vault=${vaultName}&file=${fileName}&content=${encodedText}`;
    chrome.tabs.create({ url: obsidianUri });
  });
});
