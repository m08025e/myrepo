# README

This repository includes a sample Chrome extension that sends ChatGPT or Claude responses to Obsidian using the `obsidian://` URI scheme.

## Usage
1. Open `chrome://extensions` and enable Developer Mode.
2. Choose "Load unpacked" and select the `obsidian-extension` folder.
3. In `background.js`, replace `YOUR_VAULT_NAME` with the name of your Obsidian vault.
4. Open ChatGPT or Claude and click the extension's toolbar icon.
5. Obsidian will open with a new note containing the latest answer.
