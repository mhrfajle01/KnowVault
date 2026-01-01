// A comprehensive local knowledge base for the offline AI assistant
// Expanded with advanced triggers, regex support, and diverse actions

export const localKnowledge = [
  // --- Greetings & Identity ---
  { keywords: ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup'], answer: "Hello! I'm your Vault AI. Ready to organize?" },
  { keywords: ['who are you', 'what are you', 'your name'], answer: "I am the KnowVault AI, running locally on your device." },
  { keywords: ['thank', 'thanks', 'thx'], answer: "You're very welcome!" },
  { keywords: ['bye', 'goodbye', 'cya'], answer: "Goodbye! Stay productive." },
  { keywords: ['how are you'], answer: "Processing at 100% efficiency! How can I help you?" },

  // --- App Info ---
  { keywords: ['about', 'what is knowvault'], answer: "KnowVault is a privacy-first personal knowledge base built with React and IndexedDB." },
  { keywords: ['privacy', 'secure', 'data safe'], answer: "Your data is stored locally in your browser's IndexedDB. No cloud syncing unless you use an AI API key." },
  { keywords: ['offline', 'no internet'], answer: "Yes! KnowVault works 100% offline." },
  { keywords: ['version', 'build'], answer: "You are running KnowVault v1.1.0-AI." },

  // --- Theme & UI ---
  { keywords: ['theme', 'dark mode', 'light mode', 'switch appearance', 'toggle mode'], answer: "Toggling theme...", action: 'toggle_theme' },
  { keywords: ['sidebar', 'hide menu', 'show menu', 'toggle sidebar'], answer: "Toggling sidebar visibility...", action: 'toggle_sidebar' },
  { keywords: ['dashboard', 'view stats', 'analytics', 'charts'], answer: "Switching to Dashboard view.", action: 'view_dashboard' },
  { keywords: ['vault view', 'home view', 'main list', 'back to notes'], answer: "Returning to your notes.", action: 'view_vault' },
  { keywords: ['fullscreen', 'maximize'], answer: "You can use your browser's F11 for full screen mode!" },

  // --- Note Management (Creation) ---
  { keywords: ['new note', 'create note', 'write something', 'add note'], answer: "Editor is ready for your new note.", action: 'create_note' },
  { keywords: ['quick note', 'jot down', 'remind me'], answer: "I've created a quick note for you.", action: 'quick_note' },
  { keywords: ['new code', 'code snippet', 'add code', 'save snippet'], answer: "Opening editor for a new Code Snippet.", action: 'create_code' },
  { keywords: ['new link', 'save url', 'bookmark', 'add link'], answer: "Opening editor for a new Link.", action: 'create_link' },
  { keywords: ['daily', 'today', 'journal entry', 'log'], answer: "Opening your daily note for today.", action: 'daily_note' },
  
  // --- Templates ---
  {
    keywords: ['template meeting', 'meeting note'], 
    answer: "# Meeting: [Subject]\n**Date:** [Date]\n**Attendees:**\n- \n\n**Agenda:**\n1. \n\n**Notes:**\n\n**Action Items:**\n- [ ] ", 
    action: 'apply_template' 
  },
  {
    keywords: ['template project', 'project plan'], 
    answer: "# Project: [Name]\n**Status:** 🟡 In Progress\n\n## Overview\n[Goal]\n\n## Tasks\n- [ ] Task 1\n- [ ] Task 2\n\n## Resources\n- ", 
    action: 'apply_template' 
  },
  {
    keywords: ['template todo', 'todo list', 'checklist'],
    answer: "# To-Do List\n\n- [ ] \n- [ ] \n- [ ] ",
    action: 'apply_template'
  },

  // --- Regex Based Commands (Action + Parameter) ---
  {
    regex: /search (?:for )?(.+)/i,
    answer: "Searching vault...",
    action: 'search_vault'
  },
  {
    regex: /find (?:all )?(.+)/i,
    answer: "Looking for matches...",
    action: 'search_vault'
  },
  {
    regex: /filter by (?:tag )?(.+)/i,
    answer: "Filtering by tag...",
    action: 'filter_tag'
  },
  {
    regex: /show (?:tag )?#?(.+)/i,
    answer: "Filtering tags...",
    action: 'filter_tag'
  },

  // --- Note Management (Actions) ---
  { keywords: ['delete', 'remove', 'trash'], answer: "To delete, click the trash icon on any note. Be careful!" },
  { keywords: ['archive', 'hide note'], answer: "Archiving moves notes to the hidden archive folder. Use the sidebar to see them." },
  { keywords: ['pin', 'keep at top'], answer: "Pinned notes stay at the very top of your list." },
  { keywords: ['random', 'surprise me', 'random note'], answer: "Picking a random note for you...", action: 'random_note' },
  { keywords: ['suggest tags', 'auto tag', 'tag this'], answer: "Analyzing content for tags...", action: 'suggest_tags' },

  // --- Filtering & Navigation ---
  { keywords: ['show notes', 'only notes', 'filter notes'], answer: "Filtering for text notes.", action: 'filter_notes' },
  { keywords: ['show links', 'only links', 'filter links'], answer: "Filtering for saved links.", action: 'filter_links' },
  { keywords: ['show code', 'only code', 'filter code'], answer: "Filtering for code snippets.", action: 'filter_code' },
  { keywords: ['show pinned', 'important items', 'filter pinned'], answer: "Showing only pinned items.", action: 'filter_pinned' },
  { keywords: ['show trash', 'recycle bin', 'deleted items', 'view trash'], answer: "Opening Trash bin.", action: 'view_trash' },
  { keywords: ['all items', 'clear filter', 'show everything', 'reset view'], answer: "Showing all items in your vault.", action: 'clear_filters' },
  
  // --- Sorting ---
  { keywords: ['sort newest', 'recent first'], answer: "Sorting by newest created.", action: 'sort_newest' },
  { keywords: ['sort oldest', 'earliest first'], answer: "Sorting by oldest created.", action: 'sort_oldest' },
  { keywords: ['sort updated', 'last modified'], answer: "Sorting by recently updated.", action: 'sort_updated' },

  // --- System & Utilities ---
  { keywords: ['stats', 'statistics', 'how many'], answer: "Analyzing your vault...", action: 'vault_stats' },
  { keywords: ['export', 'backup', 'download data', 'save data'], answer: "Exporting your vault to JSON.", action: 'export_data' },
  { keywords: ['clear chat', 'reset chat', 'wipe history'], answer: "Clearing history...", action: 'clear_chat' },
  { keywords: ['shortcuts', 'hotkeys', 'help keys'], answer: "Opening shortcuts menu...", action: 'open_shortcuts' },
  { keywords: ['api key', 'settings', 'config'], answer: "Click the ⚙️ icon in the chat header to configure settings." },
  
  // --- Fun & Dynamic ---
  { keywords: ['time', 'clock', 'what time'], answer: "dynamic_time", action: 'tell_time' },
  { keywords: ['date', 'what day'], answer: "dynamic_date", action: 'tell_date' },
  { keywords: ['joke', 'funny'], answer: "Why do Java developers wear glasses? Because they don't C#!" },
  { keywords: ['flip coin', 'toss coin'], answer: "dynamic_coin", action: 'flip_coin' },
  { keywords: ['roll dice', 'dice roll'], answer: "dynamic_dice", action: 'roll_dice' },

  // --- Help ---
  {
    keywords: ['ability', 'abilities', 'features', 'what can you do', 'commands', 'help', 'power', 'menu'],
    answer: "🚀 **KnowVault AI Capabilities**\n\nI can control almost every aspect of this app. Try these:\n\n**Search:** `search for <term>`, `find <term>`, `show #<tag>`\n**Create:** `new note`, `new code`, `new link`, `quick note <text>`, `daily note`\n**View:** `dashboard`, `vault`, `trash`, `pinned`\n**Filter:** `show code`, `show links`, `sort updated`\n**System:** `theme`, `export`, `stats`, `sidebar`\n**Fun:** `roll dice`, `flip coin`, `tell me a joke`\n\nAnd I can learn! Use `learn: <trigger> => <response>`."
  }
];

export const findLocalAnswer = (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // 1. Check for Regex matches (with parameters)
  for (const entry of localKnowledge) {
    if (entry.regex) {
      const match = query.match(entry.regex);
      if (match) {
        let responseText = entry.answer;
        return {
          text: responseText,
          action: entry.action || null,
          params: match[1]?.trim() || null,
          sound: 'success'
        };
      }
    }
  }

  // 2. Check for keyword matches
  const match = localKnowledge.find(entry => 
    entry.keywords && entry.keywords.some(keyword => normalizedQuery.includes(keyword))
  );

  if (match) {
      let responseText = match.answer;
      let soundEffect = 'info';

      // Dynamic Response Handling
      if (match.answer === 'dynamic_time') {
          responseText = `It is currently ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}. 🕒`;
          soundEffect = 'success';
      } else if (match.answer === 'dynamic_date') {
          responseText = `Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. 📅`;
          soundEffect = 'success';
      } else if (match.answer === 'dynamic_coin') {
          responseText = Math.random() > 0.5 ? "🪙 Heads!" : "🪙 Tails!";
          soundEffect = 'fun';
      } else if (match.answer === 'dynamic_dice') {
          responseText = `🎲 You rolled a ${Math.floor(Math.random() * 6) + 1}!`;
          soundEffect = 'fun';
      } else if (match.action) {
          soundEffect = 'success';
      }

      return { 
          text: responseText, 
          action: match.action || null,
          sound: soundEffect
      };
  }

  return null; 
};
