function getLatestAnswer() {
  const chatGPT = document.querySelector("div.markdown");
  if (chatGPT) return chatGPT.innerText;

  const claude = document.querySelector('[data-testid="bot-message-content"]');
  if (claude) return claude.innerText;

  return null;
}

function createButton() {
  if (document.getElementById("obsidian-save-btn")) return;

  const button = document.createElement("button");
  button.id = "obsidian-save-btn";
  button.textContent = "Obsidianへ保存";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    padding: "8px 12px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  });

  button.addEventListener("click", () => {
    const text = getLatestAnswer();
    if (text) {
      chrome.runtime.sendMessage({ type: "SAVE_OBSIDIAN", payload: text });
    } else {
      alert("保存できるメッセージが見つかりませんでした。");
    }
  });

  document.body.appendChild(button);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createButton);
} else {
  createButton();
}
