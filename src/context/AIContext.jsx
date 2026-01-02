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

  const [apiKey, setApiKey] = useState('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');
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

  const playAiSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        
        if (type === 'success') {
            // Rising chime (C5 -> G5)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); 
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'fun') {
             // 8-bit jump
             osc.type = 'square';
             osc.frequency.setValueAtTime(220, now);
             osc.frequency.linearRampToValueAtTime(880, now + 0.1);
             gain.gain.setValueAtTime(0.05, now);
             gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
             osc.start(now);
             osc.stop(now + 0.1);
        } else if (type === 'delete') {
             // Descending low tone
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(150, now);
             osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
             gain.gain.setValueAtTime(0.05, now);
             gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
             osc.start(now);
             osc.stop(now + 0.3);
        } else {
             // Subtle pop
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(800, now);
             gain.gain.setValueAtTime(0.05, now);
             gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
             osc.start(now);
             osc.stop(now + 0.1);
        }
    } catch (e) {
        console.error("Audio error", e);
    }
  };

  const handleAction = (action) => {
    if (!action) return;
    console.log("AI executing action:", action);
    
    switch (action) {
        case 'create_note':
            setEditingItem({
                type: 'note',
                title: '',
                content: '',
                tags: [],
                trashed: false,
                archived: false,
                pinned: false
            });
            break;
        case 'create_code':
            setEditingItem({
                type: 'code',
                title: 'New Snippet',
                content: '// Code here',
                language: 'javascript',
                tags: [],
                trashed: false,
                archived: false,
                pinned: false
            });
            break;
        case 'create_link':
            setEditingItem({
                type: 'link',
                title: 'New Link',
                url: 'https://',
                content: '',
                tags: [],
                trashed: false,
                archived: false,
                pinned: false
            });
            break;
        case 'view_trash':
            setFilters({ showTrashed: true, showArchived: false, type: 'all' });
            break;
        case 'filter_pinned':
            // Reset filters, pinned items are always at the top
            setFilters({ showTrashed: false, showArchived: false, type: 'all', tag: null, search: '' });
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
            { id: Date.now() + '-user', role: 'user', text: userMessage },
            { id: (Date.now() + 1) + '-reply', role: 'model', text: `🧠 **I've learned something new!**\n\nWhen you say: _"${triggers.join('", "')}"_\nI will reply: _"${response}"_${action ? `\nAnd execute: _${action}_` : ''}` }
        ]);
        return;
    }

    const cleanKey = apiKey.trim();
    if (provider !== 'local' && !cleanKey) {
      setChatHistory(prev => [...prev, { id: 'error-' + Date.now(), role: 'model', text: 'Please set your API Key in settings.' }]);
      return;
    }

    setIsAiLoading(true);
    const contextItems = getRelevantContext(userMessage);
    
    let fullPrompt = `System: You are an intelligent assistant for KnowVault. 
    You can perform actions by including a JSON block at the end of your response like this: 
    [ACTION: {"type": "action_name", "params": "optional_value"}]
    
    Available Actions:
    - create_note: Open editor for new note
    - create_code: Open editor for new code snippet
    - create_link: Open editor for new link
    - view_trash: Switch to trash view
    - view_dashboard: Switch to dashboard
    - view_vault: Switch to active vault
    - filter_notes: Show only notes
    - filter_links: Show only links
    - filter_code: Show only code
    - clear_filters: Reset all filters
    - toggle_theme: Switch dark/light mode
    - export_data: Download backup
    - search_vault: Use "params" for the search query
    - filter_tag: Use "params" for the tag name
    
    VAULT CONTEXT:
    ${contextItems.length > 0 ? contextItems.map(item => `Title: ${item.title}\nContent: ${item.content}\nTags: ${item.tags.join(', ')}`).join('\n---\n') : 'No relevant notes found.'}
    
    User Question: ${userMessage}`;

    const newHistory = [...chatHistory, { id: Date.now() + '-user', role: 'user', text: userMessage }];
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
             
             if (result.sound) playAiSound(result.sound);

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
                 if (result.action === 'search_vault' && result.params) {
                    setFilters({ search: result.params, showArchived: false, showTrashed: false, type: 'all', tag: null });
                    responseText = `Searching vault for: "${result.params}" 🔍`;
                 }
                 if (result.action === 'filter_tag' && result.params) {
                    const cleanTag = result.params.replace('#', '');
                    setFilters({ tag: cleanTag, search: '', showArchived: false, showTrashed: false });
                    responseText = `Filtering notes with tag: #${cleanTag} 🏷️`;
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
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'KnowVault'
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: fullPrompt }],
            stream: false
          })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            if (errData.error?.message === "User not found.") {
                throw new Error("API Key invalid or 'User not found' on OpenRouter. Please check your API key in settings.");
            }
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content;

        // Parse Action
        const actionMatch = responseText.match(/\[ACTION:\s*({.*?})\]/);
        if (actionMatch) {
            try {
                const actionData = JSON.parse(actionMatch[1]);
                if (actionData.type === 'search_vault' && actionData.params) {
                    setFilters({ search: actionData.params, showArchived: false, showTrashed: false, type: 'all', tag: null });
                } else if (actionData.type === 'filter_tag' && actionData.params) {
                    setFilters({ tag: actionData.params.replace('#', ''), search: '', showArchived: false, showTrashed: false });
                } else {
                    handleAction(actionData.type);
                }
                responseText = responseText.replace(actionMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse AI action JSON", e);
            }
        }

      } else {
        // DeepSeek via OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'KnowVault'
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [{ role: "user", content: fullPrompt }],
            stream: false
          })
        });

        if (!response.ok) {
            const errData = await response.json();
            if (errData.error?.message === "User not found.") {
                throw new Error("API Key invalid or 'User not found' on OpenRouter. Please check your API key in settings.");
            }
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content;

        // Parse Action
        const actionMatch = responseText.match(/\[ACTION:\s*({.*?})\]/);
        if (actionMatch) {
            try {
                const actionData = JSON.parse(actionMatch[1]);
                if (actionData.type === 'search_vault' && actionData.params) {
                    setFilters({ search: actionData.params, showArchived: false, showTrashed: false, type: 'all', tag: null });
                } else if (actionData.type === 'filter_tag' && actionData.params) {
                    setFilters({ tag: actionData.params.replace('#', ''), search: '', showArchived: false, showTrashed: false });
                } else {
                    handleAction(actionData.type);
                }
                responseText = responseText.replace(actionMatch[0], '').trim();
            } catch (e) {
                console.error("Failed to parse AI action JSON", e);
            }
        }
      }

      setChatHistory(prev => [...prev, { id: Date.now() + '-reply', role: 'model', text: responseText || "No response generated." }]);
    } catch (error) {
      console.error("AI Error:", error);
      let displayMsg = `Error: ${error.message}`;
      setChatHistory(prev => [...prev, { id: Date.now() + '-err', role: 'model', text: displayMsg }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const summarizeNote = async (note) => {
      return "Summary feature requires selecting a provider.";
  };

  const enhanceText = async (text) => {
    if (!text.trim()) return text;
    
    if (provider === 'local') {
        // Step 1: Deep Cleanup (Removing "unnecessary" text noise)
        let cleanedText = text
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
            .replace(/[\n]{3,}/g, '\n\n') // Normalize excessive newlines
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Filter out generic filler/junk lines
                const lowLine = line.toLowerCase();
                if (line.length < 2) return false;
                if (/^(copy|paste|text|here|untitled|note)$/i.test(lowLine)) return false;
                return true;
            })
            .join('\n');

        const lines = cleanedText.split('\n');
        if (lines.length === 0) return text;

        const emojiMap = {
            'note': '📝', 'link': '🔗', 'idea': '💡', 'task': '✅', 
            'important': '⚠️', 'fix': '🔧', 'code': '💻', 'web': '🌐', 
            'todo': '📅', 'warning': '🚨', 'info': 'ℹ️', 'success': '✨',
            'bug': '🐛', 'user': '👤', 'data': '📊', 'config': '⚙️'
        };

        const processedLines = lines.map((line, i) => {
            let processed = line;

            // 1. Intelligent Title (if first line is short and not a heading)
            if (i === 0 && !line.startsWith('#')) {
                const title = line.replace(/[#\*_]/g, '').trim();
                if (title.length < 100) {
                    return `# 🗒️ ${title}\n---\n`;
                }
            }
            
            // 2. Remove redundant "header" words if they start the line
            processed = processed.replace(/^(note|content|text|title):\s*/i, '');

            // 3. Keyword highlighting & Emojis
            Object.keys(emojiMap).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                if (regex.test(processed) && !processed.includes(emojiMap[key])) {
                    processed = `${emojiMap[key]} ${processed}`;
                }
            });

            // 4. Key-Value Bolding
            if (/^[A-Za-z\s]+:/.test(processed) && !processed.startsWith('#') && processed.includes(': ')) {
                processed = processed.replace(/^([^:]+:)/, '**$1**');
            }

            // 5. List Normalization
            if (/^[\-\*\d\.]/.test(processed)) {
                processed = `- ${processed.replace(/^[\-\*\d\.\s]+/, '')}`;
            } else if (processed.length < 60 && !processed.endsWith('.') && !processed.startsWith('#') && !processed.startsWith('>')) {
                // 6. Section Header Inference
                return `## 📍 ${processed}`;
            }

            // 7. Importance Detection
            if (/\b(must|urgent|priority|important|todo|remember)\b/i.test(processed)) {
                processed = `> ${processed}`;
            }

            // 8. URL Linker
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            processed = processed.replace(urlRegex, (url) => `[${url}](${url})`);

            return processed;
        });

        // 9. Final Utilization: Filter out redundant titles that might have been inferred incorrectly
        const finalContent = processedLines.filter((line, index, self) => {
            if (line.startsWith('# ') && index > 0) return false; // Only one H1
            return true;
        }).join('\n\n');

        return finalContent + `\n\n---\n*✨ Synthesized & Optimized locally by KnowVault*`;
    }

    const cleanKey = apiKey.trim();
    if (!cleanKey) {
        throw new Error('Please set your API Key in AI settings to use Enhance.');
    }

    const prompt = `You are a professional note editor. Enhance the following unformatted text into a beautiful, well-structured Markdown note. 
    Fix grammar, add headings, bullet points, and bold important terms where appropriate. 
    Maintain all the original information but make it highly readable and professional.
    
    CRITICAL: Return ONLY the enhanced content. Do not include any explanations, introductions, or conversational filler.
    
    TEXT TO ENHANCE:
    ${text}`;

    try {
        let enhanced = "";
        if (provider === 'gemini') {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'KnowVault'
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001",
                    messages: [{ role: "user", content: prompt }],
                    stream: false
                })
            });
            if (!response.ok) {
                const errData = await response.json();
                if (errData.error?.message === "User not found.") {
                    throw new Error("API Key invalid or 'User not found' on OpenRouter. Please check your API key in settings.");
                }
                throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
            }
            const data = await response.json();
            enhanced = data.choices?.[0]?.message?.content;
        } else {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'KnowVault'
                },
                body: JSON.stringify({
                    model: "deepseek/deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    stream: false
                })
            });
            const data = await response.json();
            enhanced = data.choices?.[0]?.message?.content;
        }
        return enhanced || text;
    } catch (e) {
        console.error("Enhance error:", e);
        throw e;
    }
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
      enhanceText,
      isAiLoading, 
      clearHistory,
      isOpen,
      toggleChat,
      playAiSound
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => useContext(AIContext);
