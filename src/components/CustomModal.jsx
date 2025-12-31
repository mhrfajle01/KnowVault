import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useUI } from '../context/UIContext';
import { useVault } from '../context/VaultContext';

const CustomModal = () => {
  const { modalConfig, closeModal } = useUI();
  const { state, setFilters } = useVault();
  const { isOpen, title, message, content, item, type, onConfirm } = modalConfig;
  const { filters } = state;
  const [animate, setAnimate] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const modalBodyRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 10);
      
      // Auto-scroll to first search match in read mode
      if (type === 'read' && filters.search) {
          const scrollToMatch = () => {
              const body = modalBodyRef.current;
              if (!body) return;

              const matches = body.querySelectorAll('mark');
              setTotalMatches(matches.length);
              
              if (matches.length > 0) {
                  setCurrentMatch(1);
                  matches.forEach(m => m.classList.remove('active-mark'));
                  matches[0].classList.add('active-mark');
                  matches[0].scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center'
                  });
              } else {
                  setCurrentMatch(0);
              }
          };

          const timer1 = setTimeout(scrollToMatch, 600);
          return () => clearTimeout(timer1);
      } else {
          setTotalMatches(0);
          setCurrentMatch(0);
      }
    } else {
      setAnimate(false);
    }
  }, [isOpen, type, filters.search]);

  const navigateMatch = (direction) => {
    const body = modalBodyRef.current;
    if (!body) return;
    
    const matches = body.querySelectorAll('mark');
    if (matches.length === 0) return;

    matches.forEach(m => m.classList.remove('active-mark'));

    let nextIndex;
    if (direction === 'next') {
        nextIndex = currentMatch >= totalMatches ? 1 : currentMatch + 1;
    } else {
        nextIndex = currentMatch <= 1 ? totalMatches : currentMatch - 1;
    }

    setCurrentMatch(nextIndex);
    const target = matches[nextIndex - 1];
    target.classList.add('active-mark');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const isReadMode = type === 'read';

  const highlightText = (text, query) => {
    if (!query) return text;
    // Remove quotes if searching for exact match
    const cleanQuery = query.replace(/^"(.*)"$/, '$1');
    const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === cleanQuery.toLowerCase() ? <mark key={i}>{part}</mark> : part
        )}
      </span>
    );
  };

  const renderContentWithWikiLinks = (content) => {
    if (!content) return null;
    let processedContent = content.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (match, title, label) => {
      return `[${label || title}](wiki://${title.trim()})`;
    });

    const query = filters.search;
    const cleanQuery = query?.replace(/^"(.*)"$/, '$1');
    const escapedQuery = cleanQuery?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Use a custom component for all text-containing elements to apply highlighting
    const HighlightedText = ({ children }) => {
        if (!cleanQuery || typeof children !== 'string') return <>{children}</>;
        const parts = children.split(new RegExp(`(${escapedQuery})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => 
                    part.toLowerCase() === cleanQuery.toLowerCase() ? <mark key={i}>{part}</mark> : part
                )}
            </>
        );
    };

    return (
      <ReactMarkdown 
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
                      setFilters({ search: decodeURIComponent(title), showArchived: false, showTrashed: false });
                  }}
                >
                  <HighlightedText>{props.children}</HighlightedText>
                </span>
              );
            }
            return <a {...props} target="_blank" rel="noopener noreferrer"><HighlightedText>{props.children}</HighlightedText></a>;
          },
          p: ({ children }) => <p><HighlightedText>{children}</HighlightedText></p>,
          li: ({ children }) => <li><HighlightedText>{children}</HighlightedText></li>,
          h1: ({ children }) => <h1><HighlightedText>{children}</HighlightedText></h1>,
          h2: ({ children }) => <h2><HighlightedText>{children}</HighlightedText></h2>,
          h3: ({ children }) => <h3><HighlightedText>{children}</HighlightedText></h3>,
          h4: ({ children }) => <h4><HighlightedText>{children}</HighlightedText></h4>,
          h5: ({ children }) => <h5><HighlightedText>{children}</HighlightedText></h5>,
          h6: ({ children }) => <h6><HighlightedText>{children}</HighlightedText></h6>,
          strong: ({ children }) => <strong><HighlightedText>{children}</HighlightedText></strong>,
          em: ({ children }) => <em><HighlightedText>{children}</HighlightedText></em>,
          code: ({ inline, children, ...props }) => {
              if (inline) return <code {...props}><HighlightedText>{children}</HighlightedText></code>;
              return <code {...props}>{children}</code>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const getGradient = () => {
    switch (type) {
      case 'danger': return 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)';
      case 'confirm': return 'linear-gradient(135deg, #51cf66 0%, #94d82d 100%)';
      case 'read': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      default: return 'linear-gradient(135deg, #4dabf7 0%, #3bc9db 100%)';
    }
  };

  const getIcon = () => {
      switch (type) {
          case 'danger': return '🗑️';
          case 'confirm': return '✅';
          case 'read': return '📖';
          default: return 'ℹ️';
      }
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
      style={{ 
        zIndex: 1050, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(8px)',
        opacity: animate ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      onClick={closeModal}
    >
      <div 
        className={`card shadow-2xl border-0 overflow-hidden ${isReadMode ? 'reader-modal' : ''}`} 
        style={{ 
          maxWidth: isReadMode ? '850px' : '450px', 
          width: '95%', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(30px)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRadius: '24px',
          backgroundColor: 'var(--bs-body-bg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Different for Read Mode */}
        {!isReadMode ? (
            <div 
                className="text-white text-center py-5 px-4 flex-shrink-0" 
                style={{ background: getGradient() }}
            >
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{getIcon()}</div>
                <h3 className="fw-bold mb-0">{title}</h3>
            </div>
        ) : (
            <div className="d-flex flex-column border-bottom sticky-top bg-body z-2">
                <div className="d-flex justify-content-between align-items-center p-4">
                    <div className="d-flex align-items-center gap-3">
                        <span className="fs-3">📖</span>
                        <div>
                            <h4 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '50vw' }}>{title}</h4>
                        </div>
                    </div>
                    <button 
                        className="btn btn-link text-secondary p-2 text-decoration-none fs-4 line-height-1" 
                        onClick={closeModal}
                    >
                        ✕
                    </button>
                </div>
                
                {filters.search && totalMatches > 0 && (
                    <div className="px-4 pb-3 d-flex align-items-center gap-3 bg-light-subtle py-2">
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                                ✨ {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} found
                            </span>
                        </div>
                        <div className="ms-auto d-flex align-items-center gap-2">
                            <span className="small text-muted fw-bold me-2">{currentMatch} of {totalMatches}</span>
                            <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-secondary px-3" onClick={() => navigateMatch('prev')}>上 Prev</button>
                                <button className="btn btn-outline-secondary px-3" onClick={() => navigateMatch('next')}>下 Next</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* Body */}
        <div 
            ref={modalBodyRef}
            className={`card-body p-4 p-md-5 overflow-auto custom-scrollbar`}
            style={{ fontSize: isReadMode ? '1.1rem' : '1rem', lineHeight: '1.6' }}
        >
          {item ? (
              <div className="markdown-preview reader-modal-content">
                  {item.type === 'code' ? (
                      <div className="bg-body-tertiary p-3 rounded border border-start-4 border-info">
                          <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                              <small className="text-info fw-bold">{item.language?.toUpperCase() || 'CODE'}</small>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                                  navigator.clipboard.writeText(item.content);
                                  alert('Code copied!');
                              }}>Copy Code</button>
                          </div>
                          <pre className="mb-0 overflow-auto" style={{ fontSize: '0.9rem' }}>
                              <code>{filters.search ? highlightText(item.content, filters.search) : item.content}</code>
                          </pre>
                      </div>
                  ) : (
                      <div className="d-block text-start">
                           {renderContentWithWikiLinks(item.content)}
                      </div>
                  )}
              </div>
          ) : content ? (
              <div className="text-body">
                  {content}
              </div>
          ) : (
              <div className="text-center">
                  <p className="lead text-secondary mb-0">{message}</p>
              </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-top bg-body-tertiary d-flex justify-content-end gap-3 flex-shrink-0`}>
            {!isReadMode ? (
                <>
                    <button 
                        className="btn btn-light px-4 rounded-pill fw-medium border" 
                        onClick={closeModal}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn px-4 rounded-pill text-white fw-bold shadow-sm"
                        style={{ background: type === 'danger' ? '#fa5252' : '#228be6' }} 
                        onClick={handleConfirm}
                    >
                        {type === 'danger' ? 'Yes, Delete' : 'Confirm'}
                    </button>
                </>
            ) : (
                <button 
                    className="btn btn-primary px-5 rounded-pill fw-bold shadow-sm"
                    onClick={closeModal}
                >
                    Done Reading
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;