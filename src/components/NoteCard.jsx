import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useVault } from '../context/VaultContext';
import { useUI } from '../context/UIContext';

const NoteCard = ({ item, onEdit }) => {
  const { deleteItem, setEditingItem, togglePin, toggleArchive, state: vaultState, moveToTrash, restoreFromTrash } = useVault();
  const { showModal } = useUI();
  const { filters } = vaultState;

  const handleEdit = () => {
    setEditingItem(item);
    if (onEdit) onEdit();
  };

  const handleExportMarkdown = () => {
    const content = `# ${item.title}\n\n${item.type === 'link' ? `URL: ${item.url}\n\n` : ''}${item.content}\n\nTags: ${item.tags.map(t => `#${t}`).join(' ')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="p-0 bg-warning">{part}</mark> : part
        )}
      </span>
    );
  };

  // Wiki-link parser: replaces [[Title]] with a clickable search trigger
  const renderContentWithWikiLinks = (content) => {
    if (!content) return null;
    
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.slice(2, -2);
        return (
          <span 
            key={i} 
            className="text-primary fw-bold cursor-pointer hover-underline" 
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
                e.stopPropagation();
                setFilters({ search: title, showArchived: false, showTrashed: false });
            }}
          >
            {part}
          </span>
        );
      }
      return <ReactMarkdown key={i} rehypePlugins={[rehypeHighlight]}>{part}</ReactMarkdown>;
    });
  };

  const handleDelete = () => {
    if (item.trashed) {
        showModal({
            title: 'Delete Permanently?',
            message: `Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`,
            type: 'danger',
            onConfirm: () => deleteItem(item.id)
        });
    } else {
        moveToTrash(item.id);
    }
  };

  const handleRestore = () => {
    restoreFromTrash(item.id);
  };

  const handleCopy = () => {
    const text = `${item.title}\n\n${item.content}`;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard! 📋');
  };

  const backlinks = vaultState.items.filter(i => 
    i.id !== item.id && 
    !i.trashed && 
    i.content.includes(`[[${item.title}]]`)
  );

  const getIcon = () => {
    switch(item.type) {
      case 'link': return '🔗';
      case 'code': return '💻';
      default: return '📝';
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  return (
    <div className={`card mb-3 shadow-sm ${item.pinned ? 'border-primary border-2' : ''}`}>
      <div className="card-body p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h5 className="card-title mb-0 d-flex align-items-center flex-grow-1" style={{ minWidth: '150px' }}>
            <span className="me-2">{getIcon()}</span>
            <span className="text-truncate">{highlightText(item.title, filters.search)}</span>
            {item.pinned && <span className="ms-2 text-primary" title="Pinned">📌</span>}
          </h5>
          <div className="d-flex gap-1 ms-auto">
             {!item.trashed && (
                 <>
                    <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={handleCopy}
                        title="Copy to Clipboard"
                    >
                        📋
                    </button>
                    <button 
                        className="btn btn-sm btn-outline-info" 
                        onClick={handleExportMarkdown}
                        title="Download as Markdown"
                    >
                        💾
                    </button>
                    <button 
                        className={`btn btn-sm ${item.pinned ? 'btn-primary' : 'btn-outline-primary'}`} 
                        onClick={() => togglePin(item.id)}
                        title={item.pinned ? "Unpin" : "Pin to top"}
                    >
                        📌
                    </button>
                    <button 
                        className="btn btn-sm btn-outline-secondary" 
                        onClick={() => toggleArchive(item.id)}
                        title={item.archived ? "Restore" : "Archive"}
                    >
                        {item.archived ? '📤' : '📥'}
                    </button>
                    <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={handleEdit} title="Edit">
                        <span>✏️</span>
                        <span className="d-none d-sm-inline">Edit</span>
                    </button>
                 </>
             )}
             {item.trashed && (
                 <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={handleRestore} title="Restore">
                    <span>♻️</span>
                    <span className="d-none d-sm-inline">Restore</span>
                 </button>
             )}
             <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={handleDelete} title={item.trashed ? "Delete Permanently" : "Move to Trash"}>
                <span>{item.trashed ? '🔥' : '🗑️'}</span>
                <span className="d-none d-sm-inline">{item.trashed ? 'Delete' : 'Trash'}</span>
             </button>
          </div>
        </div>

        {item.type === 'link' && (
          <div className="mb-2">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              {item.url} ↗
            </a>
          </div>
        )}

        <div className="card-text mb-3 overflow-hidden">
            {item.type === 'code' ? (
                 <div className="bg-body-tertiary p-3 rounded border">
                    <small className="text-muted d-block mb-1 border-bottom pb-1">{item.language}</small>
                    <pre className="mb-0 overflow-auto"><code>{item.content}</code></pre>
                 </div>
            ) : (
                <div className="markdown-preview" style={{ maxHeight: '150px', overflow: 'hidden', position: 'relative' }}>
                    {renderContentWithWikiLinks(item.content)}
                    {item.content.length > 300 && <div className="fade-bottom"></div>}
                </div>
            )}
        </div>

        <div className="mt-3">
          {item.tags.map((tag, idx) => (
            <span key={idx} className="badge bg-secondary me-1 rounded-pill">#{tag}</span>
          ))}
        </div>

        {backlinks.length > 0 && (
            <div className="mt-3 pt-2 border-top">
                <small className="text-muted d-block mb-1">🔗 Linked from:</small>
                <div className="d-flex flex-wrap gap-2">
                    {backlinks.map(link => (
                        <span 
                            key={link.id} 
                            className="badge bg-light text-primary border cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setFilters({ search: link.title, showArchived: false, showTrashed: false })}
                        >
                            {link.title}
                        </span>
                    ))}
                </div>
            </div>
        )}
      </div>
      <div className="card-footer text-muted small d-flex justify-content-between align-items-center">
        <span>Updated {formatDate(item.updatedAt)}</span>
        {item.type !== 'link' && <span>⏱️ {calculateReadingTime(item.content)} min read</span>}
      </div>
    </div>
  );
};

export default NoteCard;