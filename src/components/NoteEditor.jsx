import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Light theme for code
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { useUI } from '../context/UIContext';
import { scaleUp, loadingDots, loadingDot } from '../utils/animations';

const NoteEditor = () => {
  const { state, addItem, updateItem, setEditingItem, allTags, setFilters } = useVault();
  const { enhanceText, playAiSound } = useAI();
  const { showModal } = useUI();
  const { editingItem } = state;

  const initialFormState = {
    type: 'note',
    title: '',
    content: '',
    url: '',
    language: 'javascript',
    tags: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, unsaved
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStage, setEnhanceStage] = useState(''); // reading, thinking, writing
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Ref for auto-save timeout
  const autoSaveTimeoutRef = useRef(null);
  // Ref to track if it's the initial load to prevent auto-save on mount
  const isFirstLoad = useRef(true);

  // Load editing item
  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        tags: editingItem.tags.join(', ')
      });
      setIsPreview(false);
      setSaveStatus('saved');
    } else {
      setFormData(initialFormState);
      setSaveStatus('saved');
    }
    isFirstLoad.current = true;
  }, [editingItem]);

  // Update counts and trigger auto-save
  useEffect(() => {
    setCharCount(formData.content.length);
    setWordCount(formData.content.trim() === '' ? 0 : formData.content.trim().split(/\s+/).length);

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    if (editingItem) {
        setSaveStatus('unsaved');
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        
        autoSaveTimeoutRef.current = setTimeout(() => {
            handleSave(formData);
        }, 2000); // Auto-save after 2 seconds of inactivity
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (dataToSave) => {
    if (!dataToSave.title) return; // Don't auto-save without title
    setSaveStatus('saving');
    
    // Process tags
    const tagsArray = typeof dataToSave.tags === 'string' 
        ? dataToSave.tags.split(',').map(t => t.trim()).filter(t => t)
        : dataToSave.tags;

    const payload = {
      ...dataToSave,
      tags: tagsArray
    };

    try {
        if (editingItem) {
          await updateItem(payload);
        } else {
          // For new items, we generally don't auto-save until they explicitly click "Create" 
          // to avoid creating junk. But if this function is called manually, we do.
          await addItem(payload);
        }
        setSaveStatus('saved');
    } catch (e) {
        setSaveStatus('error');
    }
  };

  const manualSubmit = (e) => {
    e.preventDefault();
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    handleSave(formData).then(() => {
         if (!editingItem) {
             showModal({
                title: 'Item Created',
                message: `"${formData.title}" has been successfully added to your vault.`,
                type: 'confirm'
             });
             setFormData(initialFormState);
             isFirstLoad.current = true;
         }
    });
  };

  const handleCancel = () => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    setEditingItem(null);
    setFormData(initialFormState);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            manualSubmit(e);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const insertMarkdown = (syntax) => {
      const textarea = document.querySelector('textarea[name="content"]');
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.content;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const selection = text.substring(start, end);

      let newText = '';
      if (syntax === '**') newText = before + '**' + selection + '**' + after;
      else if (syntax === '_') newText = before + '_' + selection + '_' + after;
      else if (syntax === '#') newText = before + '# ' + selection + after;
      else if (syntax === '`') newText = before + '`' + selection + '`' + after;
      else if (syntax === '```') newText = before + '\n```\n' + selection + '\n```\n' + after;

      setFormData(prev => ({ ...prev, content: newText }));
      // Focus back (simplistic)
      textarea.focus();
  };

  const formatJSON = () => {
    try {
        const obj = JSON.parse(formData.content);
        const formatted = JSON.stringify(obj, null, 2);
        setFormData(prev => ({ ...prev, content: formatted, type: 'code', language: 'json' }));
    } catch (e) {
        showModal({
            title: 'Invalid JSON',
            message: e.message,
            type: 'danger'
        });
    }
  };

  const handleEnhance = async () => {
    if (!formData.content.trim()) return;
    setIsEnhancing(true);
    playAiSound('info');
    
    try {
        setEnhanceStage('reading');
        await new Promise(r => setTimeout(r, 800));
        
        setEnhanceStage('thinking');
        await new Promise(r => setTimeout(r, 1200));
        
        setEnhanceStage('writing');
        const enhanced = await enhanceText(formData.content);
        
        await new Promise(r => setTimeout(r, 500));
        
        setFormData(prev => ({ ...prev, content: enhanced }));
        playAiSound('success');
    } catch (e) {
        showModal({
            title: 'Enhancement Error',
            message: e.message,
            type: 'danger'
        });
    } finally {
        setIsEnhancing(false);
        setEnhanceStage('');
    }
  };

  const renderMarkdownWithWikiLinks = (content) => {
    if (!content) return null;
    const processedContent = content.replace(/\[\[\s*([^|\]]+?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]/g, (match, title, label) => {
      return `[${label || title}](wiki://${encodeURIComponent(title.trim())})`;
    });

    return (
      <ReactMarkdown 
        urlTransform={(uri) => uri}
        rehypePlugins={[rehypeHighlight]}
        components={{
            a: ({node, ...props}) => {
                if (props.href && props.href.startsWith('wiki://')) {
                  const title = decodeURIComponent(props.href.replace('wiki://', ''));
                  return (
                    <span 
                      className="text-primary fw-bold cursor-pointer hover-underline"
                      onClick={() => {
                          playAiSound('info');
                          setFilters({ search: `"${title}"`, showArchived: false, showTrashed: false });
                      }}
                    >
                      {props.children}
                    </span>
                  );
                }
                return <a {...props} target="_blank" rel="noopener noreferrer" />;
            }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const renderPreview = () => {
    if (!formData.content.trim()) return <div className="text-muted italic">No content to preview</div>;

    const isJson = (formData.type === 'code' && formData.language?.toLowerCase() === 'json') || 
                   (formData.content.trim().startsWith('{') || formData.content.trim().startsWith('['));

    if (isJson && formData.type === 'code') {
        try {
            const obj = JSON.parse(formData.content);
            return (
                <pre className="m-0"><code className="language-json">{JSON.stringify(obj, null, 2)}</code></pre>
            );
        } catch (e) {
            return <pre className="m-0"><code>{formData.content}</code></pre>;
        }
    }

    if (formData.type === 'code') {
        return (
            <div className="bg-body-tertiary p-3 rounded border">
                <small className="text-muted d-block mb-1 border-bottom pb-1">{formData.language}</small>
                <pre className="mb-0 overflow-auto"><code>{formData.content}</code></pre>
            </div>
        );
    }

    return renderMarkdownWithWikiLinks(formData.content);
  };

  return (
    <motion.div 
      layout
      variants={scaleUp}
      initial="initial"
      animate="animate"
      className="card mb-4 shadow-sm"
    >
      <div className="card-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">{editingItem ? 'Edit Item' : 'New Item'}</h5>
            <AnimatePresence>
                {editingItem && (
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`badge rounded-pill ${saveStatus === 'saved' ? 'text-bg-success' : saveStatus === 'saving' ? 'text-bg-warning' : 'text-bg-secondary'}`}
                    >
                        {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
        <div className="d-flex gap-2">
             <button type="button" className={`btn btn-sm ${!isPreview ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setIsPreview(false)}>Write</button>
             <button type="button" className={`btn btn-sm ${isPreview ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setIsPreview(true)}>Preview</button>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={manualSubmit}>
          <div className="row g-2 mb-3">
             <div className="col-md-3">
                <select 
                  className="form-select form-select-sm"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={!!editingItem} 
                >
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="code">Code Snippet</option>
                </select>
             </div>
             <div className="col-md-9">
                <input 
                  type="text" 
                  className="form-control form-select-sm fw-bold"
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  placeholder="Item Title"
                />
             </div>
          </div>

          {formData.type === 'link' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-3">
              <input type="url" className="form-control form-control-sm" name="url" value={formData.url} onChange={handleChange} required placeholder="https://example.com" />
            </motion.div>
          )}

          {formData.type === 'code' && (
             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-3">
                <input type="text" className="form-control form-control-sm" name="language" value={formData.language} onChange={handleChange} placeholder="Language (e.g. javascript)" />
             </motion.div>
          )}

          {!isPreview && formData.type !== 'link' && (
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                  <div className="btn-group btn-group-responsive shadow-sm">
                      <button type="button" className="btn btn-sm btn-light border-end" onClick={() => insertMarkdown('**')} title="Bold"><b>B</b></button>
                      <button type="button" className="btn btn-sm btn-light border-end" onClick={() => insertMarkdown('_')} title="Italic"><i>I</i></button>
                      <button type="button" className="btn btn-sm btn-light border-end" onClick={() => insertMarkdown('#')} title="Heading">H1</button>
                      <button type="button" className="btn btn-sm btn-light border-end" onClick={() => insertMarkdown('`')} title="Code">`</button>
                      <button type="button" className="btn btn-sm btn-light" onClick={() => insertMarkdown('```')} title="Code Block">```</button>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        className={`btn btn-sm ${isEnhancing ? 'btn-secondary shadow-none' : 'btn-outline-primary shadow-sm'} d-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded-pill transition-all flex-grow-1`}
                        onClick={handleEnhance}
                        disabled={isEnhancing || !formData.content.trim()}
                      >
                          {isEnhancing ? (
                              <div className="d-flex align-items-center gap-2">
                                <motion.div 
                                    variants={loadingDots}
                                    initial="initial"
                                    animate="animate"
                                    className="d-flex gap-1"
                                >
                                    <motion.span variants={loadingDot} className="rounded-circle bg-white" style={{ width: '4px', height: '4px' }} />
                                    <motion.span variants={loadingDot} className="rounded-circle bg-white" style={{ width: '4px', height: '4px' }} />
                                    <motion.span variants={loadingDot} className="rounded-circle bg-white" style={{ width: '4px', height: '4px' }} />
                                </motion.div>
                                <span className="text-capitalize small fw-bold">{enhanceStage}...</span>
                              </div>
                          ) : (
                              <>
                                <span className="fs-6">✨</span>
                                <span className="fw-bold">AI Enhance</span>
                              </>
                          )}
                      </motion.button>
                      {(formData.content.trim().startsWith('{') || formData.content.trim().startsWith('[')) && (
                          <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn btn-sm btn-outline-info" onClick={formatJSON}>
                              ✨ Format JSON
                          </motion.button>
                      )}
                  </div>
              </div>
          )}

          <div className="mb-3">
            <AnimatePresence mode="wait">
              {isPreview ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border rounded p-3 bg-body-tertiary overflow-auto markdown-preview"
                    style={{ minHeight: '300px', maxHeight: '600px' }}
                  >
                      {renderPreview()}
                  </motion.div>
              ) : (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <textarea 
                      className="form-control font-monospace"
                      name="content" 
                      rows="10" 
                      value={formData.content} 
                      onChange={handleChange} 
                      required
                      placeholder="Write in Markdown..."
                    ></textarea>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-3 position-relative">
             <input 
                type="text" 
                className="form-control form-control-sm"
                name="tags" 
                value={formData.tags} 
                onChange={handleChange} 
                placeholder="Tags (comma separated)"
                onFocus={() => setShowTagSuggestions(true)}
             />
             <AnimatePresence>
                {showTagSuggestions && formData.tags.split(',').pop().trim().length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="list-group position-absolute w-100 shadow-sm z-3" 
                        style={{ top: '100%' }}
                    >
                        {allTags
                            .filter(t => t.toLowerCase().includes(formData.tags.split(',').pop().trim().toLowerCase()))
                            .filter(t => !formData.tags.split(',').map(st => st.trim().toLowerCase()).includes(t.toLowerCase()))
                            .slice(0, 5)
                            .map(tag => (
                                <button 
                                    key={tag} 
                                    type="button" 
                                    className="list-group-item list-group-item-action py-1 small"
                                    onClick={() => {
                                        const parts = formData.tags.split(',');
                                        parts.pop();
                                        const newTags = [...parts.map(p => p.trim()), tag].join(', ') + ', ';
                                        setFormData(prev => ({ ...prev, tags: newTags }));
                                        setShowTagSuggestions(false);
                                    }}
                                >
                                    #{tag}
                                </button>
                            ))
                        }
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
             <div className="text-muted small">
                 {wordCount} words | {charCount} chars
             </div>
             <div className="d-flex gap-2">
                <motion.button whileTap={{ scale: 0.95 }} type="submit" className="btn btn-success">
                  {editingItem ? 'Save' : 'Create'}
                </motion.button>
                {editingItem && (
                  <motion.button whileTap={{ scale: 0.95 }} type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </motion.button>
                )}
             </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default NoteEditor;
