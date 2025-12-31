import React, { createContext, useContext, useState, useEffect } from 'react';
import { findLocalAnswer } from '../utils/localKnowledge';
import { useVault } from './VaultContext';
import { useTheme } from './ThemeContext';
import { useUI } from './UIContext';
import Fuse from 'fuse.js';

const AIContext = createContext();

export const AIProvider = ({ children }) => {
  const {
    state: vaultState,
    setEditingItem,
    setFilters,
    setSort,
    filteredItems
  } = useVault();
  const { toggleTheme } = useTheme();
  const { showModal } = useUI();

  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini'); // gemini, deepseek, or local
  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [customKnowledge, setCustomKnowledge] = useState([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('knowvault-ai-key');
    const savedProvider = localStorage.getItem('knowvault-ai-provider');
    const savedKnowledge = localStorage.getItem('knowvault-ai-custom-knowledge');

    if (savedKey) setApiKey(savedKey);
    if (savedProvider) setProvider(savedProvider);
    if (savedKnowledge) {
      try {
        setCustomKnowledge(JSON.parse(savedKnowledge));
      } catch (e) {
        console.error("Failed to parse custom knowledge", e);
      }
    }
  }, []);

  const saveConfig = (key, newProvider) => {
    setApiKey(key);
    setProvider(newProvider);
    localStorage.setItem('knowvault-ai-key', key);
    localStorage.setItem('knowvault-ai-provider', newProvider);
  };

  const addCustomKnowledge = (triggers, response, action = null) => {
    const newEntry = {
      id: Date.now(),
      keywords: triggers.map(t => t.trim().toLowerCase()),
      answer: response.trim(),
      action: action ? action.trim() : null
    };

    const updatedKnowledge = [...customKnowledge, newEntry];
    setCustomKnowledge(updatedKnowledge);
    localStorage.setItem('knowvault-ai-custom-knowledge', JSON.stringify(updatedKnowledge));
    return newEntry;
  };

  const toggleChat = () => setIsOpen(prev => !prev);

  const getRelevantContext = (query) => {
    if (!vaultState.items || vaultState.items.length === 0) return [];

    const fuse = new Fuse(vaultState.items, {
        keys: ['title', 'content', 'tags'],
        threshold: 0.4
    });

    return fuse.search(query).slice(0, 5).map(r => r.item);
  };

  const findCustomAnswer = (query) => {
    const normalizedQuery = query.toLowerCase();
    const match = customKnowledge.find(entry => 
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

  const exportVaultData = () => {
    const dataStr = JSON.stringify(vaultState.items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `knowvault-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getVaultStats = () => {
    const total = vaultState.items.length;
    const types = vaultState.items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {});
    const tags = new Set(vaultState.items.flatMap(i => i.tags)).size;

    return `📊 **Vault Statistics**\n\n` +
           `* Total Items: ${total}\n` +
           `* Notes: ${types.note || 0}\n` +
           `* Links: ${types.link || 0}\n` +
           `* Code Snippets: ${types.code || 0}\n` +
           `* Unique Tags: ${tags}`;
  };

  const handleAction = (action) => {
    if (!action) return;
    console.log("AI executing action:", action);
    
    switch (action) {
        case 'create_note':
            setEditingItem(null);
            break;
        case 'clear_chat':
            setChatHistory([]);
            break;
        case 'toggle_theme':
            toggleTheme();
            break;
        case 'export_data':
            exportVaultData();
            break;
        case 'toggle_sidebar':
            const sidebar = document.querySelector('.col-lg-3');
            if (sidebar) sidebar.classList.toggle('d-none');
            break;
        case 'view_dashboard':
            const dashBtn = document.querySelector('button.nav-link:nth-child(2)');
            if (dashBtn) dashBtn.click();
            break;
        case 'view_vault':
            const vaultBtn = document.querySelector('button.nav-link:nth-child(1)');
            if (vaultBtn) vaultBtn.click();
            break;
        case 'filter_notes':
            setFilters({ type: 'note' });
            break;
        case 'filter_links':
            setFilters({ type: 'link' });
            break;
        case 'filter_code':
            setFilters({ type: 'code' });
            break;
        case 'clear_filters':
            setFilters({ type: 'all', tag: null, showArchived: false });
            break;
        case 'sort_newest':
            setSort('newest');
            break;
        case 'sort_oldest':
            setSort('oldest');
            break;
        case 'sort_updated':
            setSort('updated');
            break;
        case 'show_archive':
            setFilters({ showArchived: true });
            break;
        case 'hide_archive':
            setFilters({ showArchived: false });
            break;
        case 'open_shortcuts':
            const shortcutBtn = document.querySelector('button[title="Keyboard Shortcuts"]');
            if (shortcutBtn) shortcutBtn.click();
            break;
        case 'apply_template':
            setEditingItem({
                type: 'note',
                title: 'New Template Note',
                content: vaultState.lastAiResponse,
                tags: ['template'],
                trashed: false,
                archived: false,
                pinned: false
            });
            break;
        case 'suggest_tags':
            if (vaultState.editingItem) {
                const content = vaultState.editingItem.content.toLowerCase();
                const possible = ['work', 'personal', 'idea', 'todo', 'urgent', 'research', 'learning'];
                const suggested = possible.filter(p => content.includes(p));
                if (suggested.length > 0) {
                    setEditingItem({
                        ...vaultState.editingItem,
                        tags: [...new Set([...vaultState.editingItem.tags, ...suggested])]
                    });
                }
            }
            break;
        case 'quick_note':
            // The userMessage will be used as the title/content
            setEditingItem({
                type: 'note',
                title: 'Quick Note: ' + new Date().toLocaleTimeString(),
                content: vaultState.lastUserMessage, // Need to track this
                tags: ['quick-note'],
                trashed: false,
                archived: false,
                pinned: false
            });
            break;
        case 'random_note':
            if (vaultState.items.length > 0) {
                const random = vaultState.items[Math.floor(Math.random() * vaultState.items.length)];
                setEditingItem(random);
            }
            break;
        default:
            break;
    }
  };

  const askAI = async (userMessage) => {
    const learnRegex = /^learn:\s*(.+?)\s*=>\s*(.+?)(?:\s*!!\s*(.+))?$/i;
    const learnMatch = userMessage.match(learnRegex);

    if (learnMatch) {
        const triggers = learnMatch[1].split(',');
        const response = learnMatch[2];
        const action = learnMatch[3];

        addCustomKnowledge(triggers, response, action);
        
        setChatHistory(prev => [
            ...prev, 
            { role: 'user', text: userMessage },
            { role: 'model', text: `🧠 **I've learned something new!**\n\nWhen you say: _"${triggers.join('", "')}"_\nI will reply: _"${response}"_${action ? `\nAnd execute: _${action}_` : ''}` }
        ]);
        return;
    }

    const cleanKey = apiKey.trim();
    if (provider !== 'local' && !cleanKey) {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Please set your API Key in settings.' }]);
      return;
    }

    setIsAiLoading(true);
    const contextItems = getRelevantContext(userMessage);
    
    let fullPrompt = "System: You are a helpful assistant for a Personal Knowledge Vault. Use the context below to answer.\n\n";
    if (contextItems.length > 0) {
        fullPrompt += "--- VAULT CONTEXT ---\n";
        contextItems.forEach(item => {
            fullPrompt += `Title: ${item.title}\nContent: ${item.content}\nTags: ${item.tags.join(', ')}\n\n`;
        });
    } else {
        fullPrompt += "No relevant notes found. Answer from general knowledge.\n";
    }
    fullPrompt += `\nUser Question: ${userMessage}`;

    const newHistory = [...chatHistory, { role: 'user', text: userMessage }];
    setChatHistory(newHistory);

    try {
      let responseText = "";

      if (provider === 'local') {
          await new Promise(resolve => setTimeout(resolve, 600));
          
          let result = findCustomAnswer(userMessage);

          if (!result) {
            result = findLocalAnswer(userMessage);
          }
          
          if (result) {
             responseText = result.text;
             
             if (result.action) {
                 if (result.action === 'clear_chat') {
                     setChatHistory([]);
                     return;
                 }
                 if (result.action === 'vault_stats') {
                     responseText = getVaultStats();
                 }
                 if (result.action === 'apply_template') {
                     setEditingItem({
                        type: 'note',
                        title: 'New Template Note',
                        content: result.text,
                        tags: ['template'],
                        trashed: false,
                        archived: false,
                        pinned: false
                     });
                     responseText = "Template applied to editor! 📝";
                 }
                 if (result.action === 'quick_note') {
                    setEditingItem({
                       type: 'note',
                       title: 'Quick Note: ' + new Date().toLocaleTimeString(),
                       content: userMessage.replace(/note about|remind me to/gi, '').trim(),
                       tags: ['quick-note'],
                       trashed: false,
                       archived: false,
                       pinned: false
                    });
                    responseText = "Quick note created in editor! ⚡";
                 }
                 if (result.action === 'suggest_tags') {
                    if (vaultState.editingItem) {
                        const content = vaultState.editingItem.content.toLowerCase();
                        const possible = ['work', 'personal', 'idea', 'todo', 'urgent', 'research', 'learning', 'react', 'javascript', 'project'];
                        const suggested = possible.filter(p => content.includes(p));
                        if (suggested.length > 0) {
                            setEditingItem({
                                ...vaultState.editingItem,
                                tags: [...new Set([...vaultState.editingItem.tags, ...suggested])]
                            });
                            responseText = `Suggested tags added: ${suggested.join(', ')} 🏷️`;
                        } else {
                            responseText = "No specific keywords found for tagging. 🏷️";
                        }
                    } else {
                        responseText = "Please open a note first to use tag suggestions.";
                    }
                 }
                 if (result.action === 'daily_note') {
                    const today = new Date().toISOString().split('T')[0];
                    const existing = vaultState.items.find(i => i.title === today && !i.trashed);
                    if (existing) {
                        setEditingItem(existing);
                        responseText = `Found your daily note for ${today}. Opening it now! 📅`;
                    } else {
                        setEditingItem({
                            type: 'note',
                            title: today,
                            content: `# Daily Note: ${today}\n\n## Goals\n- \n\n## Notes\n\n## Log\n- `,
                            tags: ['daily'],
                            trashed: false,
                            archived: false,
                            pinned: true
                        });
                        responseText = `Created a new daily note for ${today}. Happy journaling! ✍️`;
                    }
                 }
                 handleAction(result.action);
             }

          } else {
            if (contextItems.length > 0) {
               responseText = `I found some notes related to your query:\n\n` +
               contextItems.map(i => `* **${i.title}**: ${i.content.substring(0, 100)}...`).join('\n') +
               `\n\n(Note: Using Fuzzy Match for retrieval.)`;
            } else {
               responseText = "I'm not sure about that. I can answer basic questions about KnowVault, or try switching to a cloud provider (Gemini/DeepSeek) for more complex questions.";
            }
          }

      } else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      } else {
        // DeepSeek / OpenAI Compatible
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: fullPrompt }],
            stream: false
          })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content;
      }

      setChatHistory(prev => [...prev, { role: 'model', text: responseText || "No response generated." }]);
    } catch (error) {
      console.error("AI Error:", error);
      let displayMsg = `Error: ${error.message}`;
      setChatHistory(prev => [...prev, { role: 'model', text: displayMsg }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const summarizeNote = async (note) => {
      return "Summary feature requires selecting a provider.";
  };

  const clearHistory = () => setChatHistory([]);

  return (
    <AIContext.Provider value={{ 
      apiKey,
      provider,
      saveConfig, 
      chatHistory, 
      askAI, 
      summarizeNote, 
      isAiLoading, 
      clearHistory,
      isOpen,
      toggleChat
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => useContext(AIContext);
