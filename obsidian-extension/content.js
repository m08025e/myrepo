function getLatestAnswer() {
  const chatGPT = document.querySelector("div.markdown");
  if (chatGPT) return chatGPT.innerText;

  const claude = document.querySelector('[data-testid="bot-message-content"]');
  if (claude) return claude.innerText;

  return null;
}

const button = document.createElement("button");
button.textContent = "Obsidianへ保存";
button.style.position = "fixed";
button.style.bottom = "20px";
button.style.right = "20px";
button.style.zIndex = 9999;
button.addEventListener("click", () => {
  const text = getLatestAnswer();
  if (text) {
    chrome.runtime.sendMessage({ type: "SAVE_OBSIDIAN", payload: text });
  } else {
    alert("保存できるメッセージが見つかりませんでした。");
  }
});
document.body.appendChild(button);
