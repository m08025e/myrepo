chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SAVE_OBSIDIAN") {
    const title = `ChatGPT-Note-${Date.now()}`;
    const content = encodeURIComponent(message.payload);
    const obsidianUrl = `obsidian://new?file=${title}.md&content=${content}`;
    chrome.tabs.create({ url: obsidianUrl });
  }
});
