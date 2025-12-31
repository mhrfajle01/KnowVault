import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css'; // Light theme for code
import { useVault } from '../context/VaultContext';

const NoteEditor = () => {
  const { state, addItem, updateItem, setEditingItem, allTags } = useVault();
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
          // After add, we don't switch to "editing" mode in this simple version, 
          // we just reset. But for a real "doc" feel, we might want to.
          // For now, let's keep the explicit "Save" button for new items standard.
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

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">{editingItem ? 'Edit Item' : 'New Item'}</h5>
            {editingItem && (
                 <span className={`badge rounded-pill ${saveStatus === 'saved' ? 'text-bg-success' : saveStatus === 'saving' ? 'text-bg-warning' : 'text-bg-secondary'}`}>
                    {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                 </span>
            )}
        </div>
        <div className="d-flex gap-2">
             <button type="button" className={`btn btn-sm ${!isPreview ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setIsPreview(false)}>Write</button>
             <button type="button" className={`btn btn-sm ${isPreview ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setIsPreview(true)}>Preview</button>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={manualSubmit}>
          {/* Top Metadata Row */}
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
            <div className="mb-3">
              <input type="url" className="form-control form-control-sm" name="url" value={formData.url} onChange={handleChange} required placeholder="https://example.com" />
            </div>
          )}

          {formData.type === 'code' && (
             <div className="mb-3">
                <input type="text" className="form-control form-control-sm" name="language" value={formData.language} onChange={handleChange} placeholder="Language (e.g. javascript)" />
             </div>
          )}

          {/* Markdown Toolbar */}
          {!isPreview && formData.type !== 'link' && (
              <div className="btn-group mb-2">
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => insertMarkdown('**')} title="Bold"><b>B</b></button>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => insertMarkdown('_')} title="Italic"><i>I</i></button>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => insertMarkdown('#')} title="Heading">H1</button>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => insertMarkdown('`')} title="Code">`</button>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => insertMarkdown('```')} title="Code Block">```</button>
              </div>
          )}

          {/* Editor / Preview Area */}
          <div className="mb-3">
            {isPreview ? (
                <div className="border rounded p-3 bg-body-tertiary overflow-auto" style={{ minHeight: '200px', maxHeight: '500px' }}>
                    {formData.type === 'code' ? (
                        <pre><code>{formData.content}</code></pre>
                    ) : (
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{formData.content || '*No content*'}</ReactMarkdown>
                    )}
                </div>
            ) : (
                <textarea 
                  className="form-control font-monospace"
                  name="content" 
                  rows="10" 
                  value={formData.content} 
                  onChange={handleChange} 
                  required
                  placeholder="Write in Markdown..."
                ></textarea>
            )}
          </div>

          {/* Tags & Actions */}
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
             {showTagSuggestions && formData.tags.split(',').pop().trim().length > 0 && (
                 <div className="list-group position-absolute w-100 shadow-sm z-3" style={{ top: '100%' }}>
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
                 </div>
             )}
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
             <div className="text-muted small">
                 {wordCount} words | {charCount} chars
             </div>
             <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editingItem ? 'Save' : 'Create'}
                </button>
                {editingItem && (
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteEditor;