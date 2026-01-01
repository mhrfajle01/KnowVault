import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useVault } from '../context/VaultContext';
import { useUI } from '../context/UIContext';
import { useAI } from '../context/AIContext';
import { hoverScale, pulse, glow } from '../utils/animations';

const NoteCard = ({ item, onEdit }) => {
  const { deleteItem, setEditingItem, togglePin, toggleArchive, state: vaultState, moveToTrash, restoreFromTrash, setFilters } = useVault();
  const { showModal } = useUI();
  const { playAiSound } = useAI();
  const { filters } = vaultState;
  const [isGlowing, setIsGlowing] = React.useState(false);

  // Trigger glow on update
  React.useEffect(() => {
    // We skip the initial mount glow by checking if updatedAt and createdAt are different
    // or just trigger it every time updatedAt changes after mount.
    // To be simple, let's trigger it when updatedAt changes.
    setIsGlowing(true);
    const timer = setTimeout(() => setIsGlowing(false), 800);
    return () => clearTimeout(timer);
  }, [item.updatedAt]);

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
    playAiSound('success');
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const cleanQuery = query.replace(/^"(.*)"$/, '$1');
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === cleanQuery.toLowerCase() ? <mark key={i} className="p-0 bg-warning">{part}</mark> : part
        )}
      </span>
    );
  };

  // Wiki-link parser: replaces [[Title]] with a clickable search trigger
  const renderContentWithWikiLinks = (content) => {
    if (!content) return null;
    
    // Improved regex to handle spaces: [[ Title | Label ]]
    let processedContent = content.replace(/\[\[\s*([^|\]]+?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]/g, (match, title, label) => {
      return `[${label || title}](wiki://${encodeURIComponent(title.trim())})`;
    });

    const query = filters.search;
    const cleanQuery = query?.replace(/^"(.*)"$/, '$1');
    const escapedQuery = cleanQuery?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return (
      <ReactMarkdown 
        urlTransform={(uri) => uri}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({node, ...props}) => {
            if (props.href && props.href.startsWith('wiki://')) {
              const title = props.href.replace('wiki://', '');
              return (
                <span 
                  className="text-primary fw-bold cursor-pointer hover-underline" 
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playAiSound('info');
                      setFilters({ search: `"${decodeURIComponent(title)}"`, showArchived: false, showTrashed: false });
                  }}
                >
                  {props.children}
                </span>
              );
            }
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
          // Custom text renderer for search highlighting
          text: ({node, ...props}) => {
             if (!cleanQuery || typeof props.children !== 'string') return <span>{props.children}</span>;
             
             const parts = props.children.split(new RegExp(`(${escapedQuery})`, 'gi'));
             return (
               <span>
                 {parts.map((part, i) => 
                   part.toLowerCase() === cleanQuery.toLowerCase() ? <mark key={i} className="p-0 bg-warning rounded-1">{part}</mark> : part
                 )}
               </span>
             );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const handleShowMore = () => {
      playAiSound('info');
      showModal({
          title: item.title,
          item: item,
          type: 'read',
          onConfirm: () => {} 
      });
  };

  const handleDelete = () => {
    if (item.trashed) {
        showModal({
            title: 'Delete Permanently?',
            message: `Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`, 
            type: 'danger',
            onConfirm: () => {
                playAiSound('delete');
                deleteItem(item.id);
            }
        });
    } else {
        playAiSound('delete');
        moveToTrash(item.id);
    }
  };

  const handleRestore = () => {
    playAiSound('success');
    restoreFromTrash(item.id);
  };

  const handleCopy = () => {
    const text = `${item.title}\n\n${item.content}`;
    navigator.clipboard.writeText(text);
    playAiSound('success');
    showModal({
      title: 'Copied!',
      message: 'The note content has been copied to your clipboard.',
      type: 'confirm'
    });
  };

  const backlinks = vaultState.items.filter(i => {
    if (i.id === item.id || i.trashed) return false;
    
    // Improved regex to find wiki-links to this item's title
    // Handles [[Title]], [[ Title ]], [[Title|Label]], [[ Title | Label ]]
    // Escapes special characters in title for regex
    const escapedTitle = item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wikiLinkRegex = new RegExp(`\\[\\[\\s*${escapedTitle}\\s*(\\|.*?)?\\]\\]`, 'i');
    return wikiLinkRegex.test(i.content);
  });

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

  const isLongContent = item.content.length > 300;

  const getMatchCount = () => {
    if (!filters.search) return 0;
    const cleanQuery = filters.search.replace(/^"(.*)"$/, '$1');
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const titleMatches = (item.title.match(regex) || []).length;
    const contentMatches = (item.content.match(regex) || []).length;
    return titleMatches + contentMatches;
  };

  const matchCount = getMatchCount();

  return (
    <motion.div 
      {...hoverScale}
      variants={glow}
      animate={isGlowing ? "animate" : "initial"}
      className={`card h-100 shadow-sm ${item.pinned ? 'border-primary border-2' : ''} ${matchCount > 0 ? 'border-warning' : ''}`}
    >
      <div className="card-body p-3">
        {matchCount > 0 && (
            <div className="position-absolute top-0 end-0 m-2">
                <motion.span 
                    {...pulse}
                    className="badge bg-warning text-dark shadow-sm"
                >
                    ✨ {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                </motion.span>
            </div>
        )}
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h5 className="card-title mb-0 d-flex align-items-center flex-grow-1" style={{ minWidth: '150px' }}>
            <span className="me-2">{getIcon()}</span>
            <span className="text-truncate">{highlightText(item.title, filters.search)}</span>
            {item.pinned && <span className="ms-2 text-primary" title="Pinned">📌</span>}
          </h5>
          <div className="d-flex gap-1 ms-auto">
             {!item.trashed && (
                 <>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleCopy}
                        title="Copy to Clipboard"
                    >
                        📋
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-info"
                        onClick={handleExportMarkdown}
                        title="Download as Markdown"
                    >
                        💾
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className={`btn btn-sm ${item.pinned ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                            playAiSound('info');
                            togglePin(item.id);
                        }}
                        title={item.pinned ? "Unpin" : "Pin to top"}
                    >
                        📌
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                            playAiSound('info');
                            toggleArchive(item.id);
                        }}
                        title={item.archived ? "Restore" : "Archive"}
                    >
                        {item.archived ? '📤' : '📥'}
                    </motion.button>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" 
                        onClick={handleEdit} 
                        title="Edit"
                    >
                        <span>✏️</span>
                        <span className="d-none d-sm-inline">Edit</span>
                    </motion.button>
                 </>
             )}
             {item.trashed && (
                 <motion.button 
                    whileTap={{ scale: 0.9 }}
                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" 
                    onClick={handleRestore} 
                    title="Restore"
                 >
                    <span>♻️</span>
                    <span className="d-none d-sm-inline">Restore</span>
                 </motion.button>
             )}
             <motion.button 
                whileTap={{ scale: 0.9 }}
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" 
                onClick={handleDelete} 
                title={item.trashed ? "Delete Permanently" : "Move to Trash"}
             >
                <span>{item.trashed ? '🔥' : '🗑️'}</span>
                <span className="d-none d-sm-inline">{item.trashed ? 'Delete' : 'Trash'}</span>
             </motion.button>
          </div>
        </div>

        {item.type === 'link' && (
          <div className="mb-2">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
              {item.url} ↗
            </a>
          </div>
        )}

        <div className="card-text mb-3 position-relative">
            {item.type === 'code' ? (
                 <div className="bg-body-tertiary p-3 rounded border border-start-4 border-info" style={{ maxHeight: '250px', overflow: 'hidden' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1 border-bottom pb-1">
                        <small className="text-info fw-bold">{item.language?.toUpperCase() || 'CODE'}</small>
                        <small className="text-muted">{item.content.split('\n').length} lines</small>
                    </div>
                    <pre className="mb-0 overflow-auto" style={{ fontSize: '0.875rem' }}>
                        <code className={`language-${item.language || 'text'}`}>{filters.search ? highlightText(item.content, filters.search) : item.content}</code>
                    </pre>
                 </div>
            ) : (
                <div className="markdown-preview" style={{ maxHeight: '200px', overflow: 'hidden', position: 'relative' }}>
                    {renderContentWithWikiLinks(item.content)}
                    {isLongContent && <div className="fade-bottom"></div>}
                </div>
            )}
            
            {isLongContent && (
                <div className="text-center mt-n3 position-relative z-2">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary btn-sm px-4 rounded-pill shadow-sm" 
                        onClick={handleShowMore}
                        style={{ marginTop: '-15px' }}
                    >
                        Read full note ↗
                    </motion.button>
                </div>
            )}
        </div>

        <div className="mt-3">
          {item.tags.map((tag, idx) => (
            <motion.span 
              key={idx} 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="badge bg-secondary me-1 rounded-pill"
            >
                #{tag}
            </motion.span>
          ))}
        </div>

        {backlinks.length > 0 && (
            <div className="mt-3 pt-2 border-top">
                <small className="text-muted d-block mb-1">🔗 Linked from:</small>
                <div className="d-flex flex-wrap gap-2">
                    {backlinks.map(link => (
                        <motion.span 
                            key={link.id} 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="badge bg-light text-primary border cursor-pointer"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                playAiSound('info');
                                // Use exact match for title search
                                setFilters({ search: `"${link.title}"`, showArchived: false, showTrashed: false });
                            }}
                        >
                            {link.title}
                        </motion.span>
                    ))}
                </div>
            </div>
        )}
      </div>
      <div className="card-footer text-muted small d-flex justify-content-between align-items-center">
        <span>Updated {formatDate(item.updatedAt)}</span>
        {item.type !== 'link' && <span>⏱️ {calculateReadingTime(item.content)} min read</span>}
      </div>
    </motion.div>
  );
};

export default NoteCard;