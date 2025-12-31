# KnowVault - Personal Knowledge Vault with Local AI

KnowVault is a secure, personal knowledge management application that runs entirely in your browser. It features a built-in AI assistant that can help you organize, search, and answer questions about your notes.

## 🌟 Features

- **Private & Secure**: Your data lives in your browser (IndexedDB).
- **Local AI Assistant**: integrated offline assistant for quick help.
- **Markdown Support**: Rich text editing and rendering.
- **Tagging & Organization**: easy categorization of your thoughts.

## 🤖 AI Setup

KnowVault supports multiple AI providers:

1.  **Local (Q&A)**: A lightweight, offline assistant with pre-defined knowledge about the app. No download or API key required.
2.  **Google Gemini**: Requires an API Key.
3.  **DeepSeek**: Requires an API Key.

### How to use Local AI
1.  Open the AI Chat (sparkle icon).
2.  Click the Settings (gear icon).
3.  Select **Local (Q&A)** from the Provider dropdown.
4.  Click **Save Configuration**.
5.  Ask a question! Example: "What is KnowVault?", "How to add note?", "Search".

## 🛠️ Development

### Prerequisites
- Node.js & npm

### Installation
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Build
```bash
npm run build
```