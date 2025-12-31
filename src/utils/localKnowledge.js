// A comprehensive local knowledge base for the offline AI assistant
// Expanded with 50+ triggers and various actions

export const localKnowledge = [
  // --- Greetings & Identity (1-5) ---
  { keywords: ['hi', 'hello', 'hey', 'greetings', 'yo', 'sup'], answer: "Hello! I'm your Vault AI. Ready to organize?" },
  { keywords: ['who are you', 'what are you', 'your name'], answer: "I am the KnowVault AI, running locally on your device." },
  { keywords: ['thank', 'thanks', 'thx'], answer: "You're very welcome!" },
  { keywords: ['bye', 'goodbye', 'cya'], answer: "Goodbye! Stay productive." },
  { keywords: ['how are you'], answer: "Processing at 100% efficiency! How can I help you?" },

  // --- App Info & Privacy (6-10) ---
  { keywords: ['about', 'what is knowvault'], answer: "KnowVault is a privacy-first personal knowledge base built with React and IndexedDB." },
  { keywords: ['privacy', 'secure', 'data safe'], answer: "Your data is stored locally in your browser's IndexedDB. No cloud syncing unless you use an AI API key." },
  { keywords: ['offline', 'no internet'], answer: "Yes! KnowVault works 100% offline." },
  { keywords: ['version', 'build'], answer: "You are running KnowVault v1.0.0-PRO." },
  { keywords: ['license', 'open source'], answer: "KnowVault is built for personal use with standard web technologies." },

  // --- Theme & UI (11-15) ---
  { keywords: ['theme', 'dark mode', 'light mode', 'switch appearance'], answer: "Toggling theme...", action: 'toggle_theme' },
  { keywords: ['voice', 'microphone', 'dictate', 'listen'], answer: "I can listen to you! Click the microphone 🎤 icon in the chat bar to speak your commands." },
  { keywords: ['tag this', 'suggest tags', 'auto tag'], answer: "Analyzing your content for tag suggestions...", action: 'suggest_tags' },
  { keywords: ['note about', 'remind me to', 'quick note'], answer: "I've created a quick note for you based on our conversation.", action: 'quick_note' },
  { keywords: ['daily', 'today', 'journal entry'], answer: "Opening your daily note for today.", action: 'daily_note' },
  { keywords: ['backlinks', 'who links here', 'connections'], answer: "Look at the bottom of any note to see its connections! I've added a 'Linked from' section." },
  { keywords: ['trash', 'recycle bin', 'delete safely'], answer: "Deleted items now go to the Trash first. You can restore them or empty the trash permanently from the sidebar." },
  { keywords: ['wiki', 'linking', 'internal link'], answer: "You can link notes using `[[Note Title]]`. These are now clickable and will instantly search for the linked note!" },
  { keywords: ['highlight', 'search mark'], answer: "When you search, I'll highlight the matching terms in yellow within your notes." },
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
  { keywords: ['sidebar', 'hide menu', 'show menu', 'toggle sidebar'], answer: "Toggling sidebar visibility...", action: 'toggle_sidebar' },
  { keywords: ['dashboard', 'view stats', 'analytics'], answer: "Switching to Dashboard view.", action: 'view_dashboard' },
  { keywords: ['vault view', 'home view', 'main list'], answer: "Returning to your notes.", action: 'view_vault' },
  { keywords: ['fullscreen', 'expand'], answer: "You can use your browser's F11 for full screen mode!" },

  // --- Note Management (16-25) ---
  { keywords: ['new note', 'create note', 'write something', 'add note'], answer: "Editor is ready for your new note.", action: 'create_note' },
  { keywords: ['save', 'autosave'], answer: "I auto-save your work every 2 seconds of inactivity. You can also press Ctrl+S." },
  { keywords: ['delete', 'remove', 'trash'], answer: "To delete, click the trash icon on any note. Be careful!" },
  { keywords: ['archive', 'hide note'], answer: "Archiving moves notes to the hidden archive folder. Use the sidebar to see them." },
  { keywords: ['pin', 'keep at top'], answer: "Pinned notes stay at the very top of your list." },
  { keywords: ['edit', 'modify'], answer: "Click any note in the list to start editing." },
  { keywords: ['random', 'surprise me', 'random note'], answer: "Picking a random note for you...", action: 'random_note' },
  { keywords: ['clear archive', 'empty trash'], answer: "Are you sure? You can delete archived notes individually from the Archive view." },
  { keywords: ['word count', 'length'], answer: "Look at the bottom of the editor to see word and character counts." },
  { keywords: ['markdown', 'format'], answer: "We support full Markdown! Try **bold**, *italic*, or # headers." },

  // --- Filtering & Sorting (26-35) ---
  { keywords: ['show notes', 'only notes', 'filter notes'], answer: "Filtering for text notes.", action: 'filter_notes' },
  { keywords: ['show links', 'only links', 'filter links'], answer: "Filtering for saved links.", action: 'filter_links' },
  { keywords: ['show code', 'only code', 'filter code'], answer: "Filtering for code snippets.", action: 'filter_code' },
  { keywords: ['all items', 'clear filter', 'show everything'], answer: "Showing all items in your vault.", action: 'clear_filters' },
  { keywords: ['sort newest', 'recent first'], answer: "Sorting by newest created.", action: 'sort_newest' },
  { keywords: ['sort oldest', 'earliest first'], answer: "Sorting by oldest created.", action: 'sort_oldest' },
  { keywords: ['sort updated', 'last modified'], answer: "Sorting by recently updated.", action: 'sort_updated' },
  { keywords: ['archive view', 'show archive'], answer: "Opening your archived notes.", action: 'show_archive' },
  { keywords: ['active view', 'hide archive'], answer: "Returning to active notes.", action: 'hide_archive' },
  { keywords: ['search help', 'how to find'], answer: "Use the search bar at the top or just ask me! I use Fuzzy Search logic." },

  // --- AI & Logic (36-40) ---
  { keywords: ['learn', 'teach', 'custom command'], answer: "Teach me! Use: `learn: trigger => response !! action`" },
  { keywords: ['stats', 'statistics', 'how many'], answer: "Analyzing your vault...", action: 'vault_stats' },
  { keywords: ['export', 'backup', 'download data'], answer: "Exporting your vault to JSON.", action: 'export_data' },
  { keywords: ['clear chat', 'reset chat'], answer: "Clearing history...", action: 'clear_chat' },
  { keywords: ['api key', 'set gemini', 'set deepseek'], answer: "Click the ⚙️ icon in this chat to set your cloud API keys." },

  // --- Productivity & Methods (41-45) ---
  { keywords: ['zettelkasten'], answer: "The Zettelkasten method focuses on atomic notes and linking. Use tags effectively!" },
  { keywords: ['para method'], answer: "PARA: Projects, Areas, Resources, Archives. A great way to organize your sidebar." },
  { keywords: ['linking', 'backlinks'], answer: "Manual linking is best currently. Use descriptive titles!" },
  { keywords: ['daily note', 'journal'], answer: "Try creating a note titled with today's date for daily journaling." },
  { keywords: ['shortcuts', 'hotkeys', 'keyboard'], answer: "Opening shortcuts menu...", action: 'open_shortcuts' },

  // --- Extra & Fun (46-50) ---
  { keywords: ['joke', 'funny'], answer: "Why do programmers prefer dark mode? Because light attracts bugs!" },
  { keywords: ['meaning of life'], answer: "42. And taking good notes, obviously." },
  { keywords: ['coffee', 'drink'], answer: "I wish I could drink coffee. I'll just stick to electrons." },
  { keywords: ['hack', 'matrix'], answer: "Wake up, Neo... The vault has you." },
  {
    keywords: ['ability', 'abilities', 'features', 'what can you do', 'commands', 'help', 'power', 'command list', 'list commands'],
    answer: "🚀 **KnowVault Local AI Power Capabilities**\n\nI am a fully offline AI engine capable of managing your vault through natural language. Here is what I can do:\n\n**1. Vault Management**\n* `new note` - Opens the editor for a new entry.\n* `stats` - Displays detailed vault analytics.\n* `random` - Picks a random note for you to review.\n* `export` - Downloads a full JSON backup of your data.\n\n**2. View & Interface**\n* `theme` - Toggles between Light and Dark mode.\n* `sidebar` - Hides or shows the sidebar menu.\n* `dashboard` - Switches to the analytics dashboard.\n* `vault` - Returns to the main note list.\n* `shortcuts` - Opens the keyboard shortcut helper.\n\n**3. Search & Organization**\n* `filter notes/links/code` - Instantly filters by type.\n* `sort newest/oldest/updated` - Reorders your view.\n* `archive` - Shows your archived items.\n* `clear` - Resets all filters and searches.\n\n**4. Dynamic Learning**\n* I can learn! Use: `learn: trigger => response !! action` to teach me new things.\n\n**5. Privacy**\n* 100% Local processing. No data leaves your device unless you provide a Cloud API key (Gemini/DeepSeek)."
  },
  { keywords: ['help', 'commands', 'what can you do'], answer: "I can search, sort, filter, create notes, toggle themes, and export data. Ask me 'stats' or 'shortcuts'!" }
];

export const findLocalAnswer = (query) => {
  const normalizedQuery = query.toLowerCase();
  
  // Fuzzy match for triggers
  const match = localKnowledge.find(entry => 
    entry.keywords.some(keyword => normalizedQuery.includes(keyword))
  );

  if (match) {
      return { 
          text: match.answer, 
          action: match.action || null 
      };
  }

  return null; 
};
