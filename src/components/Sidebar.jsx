import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { useUI } from '../context/UIContext';
import { slideIn, skeleton, accordion } from '../utils/animations';

const Sidebar = () => {
  const { state, setFilters, allTags, emptyTrash, factoryReset, triggerScroll } = useVault();
  const { playAiSound } = useAI();
  const { showModal } = useUI();
  const { filters, items, loading } = state;

  const [openSections, setOpenSections] = useState({
    view: true,
    type: true,
    tags: true
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const counts = useMemo(() => {
    return {
      active: items.filter(i => !i.archived && !i.trashed).length,
      archived: items.filter(i => i.archived && !i.trashed).length,
      trashed: items.filter(i => i.trashed).length,
      note: items.filter(i => i.type === 'note' && !i.trashed).length,
      link: items.filter(i => i.type === 'link' && !i.trashed).length,
      code: items.filter(i => i.type === 'code' && !i.trashed).length,
      all: items.filter(i => !i.trashed).length
    };
  }, [items]);

  const handleFilterChange = (newFilters) => {
    playAiSound('info');
    setFilters(newFilters);
    triggerScroll('top');
  };

  const handleFactoryReset = () => {
    showModal({
        title: 'Factory Reset?',
        message: 'This will permanently DELETE all your notes, links, code snippets and settings. This action is irreversible!',
        type: 'danger',
        onConfirm: () => {
            playAiSound('delete');
            factoryReset();
        }
    });
  };

  const isActiveView = !filters.showArchived && !filters.showTrashed;

  return (
    <motion.div 
      variants={slideIn}
      initial="initial"
      animate="animate"
      className="card shadow-sm border-0 p-3 mb-4 rounded-4 bg-body"
    >
      <div className="mb-4">
        <h6 
            className="text-uppercase text-muted small fw-bold mb-3 d-flex align-items-center cursor-pointer justify-content-between"
            onClick={() => toggleSection('view')}
        >
            <div className="d-flex align-items-center">
                <span className="me-2">🔭</span> View
            </div>
            <motion.span animate={{ rotate: openSections.view ? 0 : -90 }}>▾</motion.span>
        </h6>
        <AnimatePresence>
            {openSections.view && (
                <motion.div 
                    variants={accordion}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="d-flex flex-column gap-1"
                >
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className={`btn btn-sm text-start d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border-0 ${isActiveView ? 'btn-primary shadow-sm' : 'btn-light'}`}
                        onClick={() => handleFilterChange({ showArchived: false, showTrashed: false, search: '', tag: null, type: 'all' })}
                    >
                        <div className="d-flex align-items-center">
                            <span className="me-2">{isActiveView ? '📥' : '📥'}</span>
                            <span>Active Vault</span>
                        </div>
                        {loading ? (
                            <motion.span variants={skeleton} initial="initial" animate="animate" className="badge rounded-pill bg-secondary-subtle" style={{ width: '24px', height: '18px' }}></motion.span>
                        ) : (
                            <span className={`badge rounded-pill ${isActiveView ? 'bg-white text-primary' : 'bg-secondary-subtle text-muted'}`}>{counts.active}</span>
                        )}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className={`btn btn-sm text-start d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border-0 ${filters.showArchived ? 'btn-primary shadow-sm' : 'btn-light'}`}
                        onClick={() => handleFilterChange({ showArchived: true, showTrashed: false, search: '', tag: null, type: 'all' })}
                    >
                        <div className="d-flex align-items-center">
                            <span className="me-2">📁</span>
                            <span>Archive</span>
                        </div>
                        {loading ? (
                            <motion.span variants={skeleton} initial="initial" animate="animate" className="badge rounded-pill bg-secondary-subtle" style={{ width: '24px', height: '18px' }}></motion.span>
                        ) : (
                            <span className={`badge rounded-pill ${filters.showArchived ? 'bg-white text-primary' : 'bg-secondary-subtle text-muted'}`}>{counts.archived}</span>
                        )}
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        className={`btn btn-sm text-start d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border-0 ${filters.showTrashed ? 'btn-danger text-white shadow-sm' : 'btn-light'}`}
                        onClick={() => handleFilterChange({ showTrashed: true, showArchived: false, search: '', tag: null, type: 'all' })}
                    >
                        <div className="d-flex align-items-center">
                            <span className="me-2">🗑️</span>
                            <span>Trash</span>
                        </div>
                        {loading ? (
                            <motion.span variants={skeleton} initial="initial" animate="animate" className="badge rounded-pill bg-secondary-subtle" style={{ width: '24px', height: '18px' }}></motion.span>
                        ) : (
                            <span className={`badge rounded-pill ${filters.showTrashed ? 'bg-white text-danger' : 'bg-secondary-subtle text-muted'}`}>{counts.trashed}</span>
                        )}
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {filters.showTrashed && counts.trashed > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
              <button className="btn btn-sm btn-outline-danger w-100 rounded-3 py-2 fw-bold" onClick={() => {
                  showModal({
                    title: 'Empty Trash?',
                    message: 'Are you sure you want to permanently delete ALL items in the trash? This action cannot be undone.',
                    type: 'danger',
                    onConfirm: () => {
                      playAiSound('delete');
                      emptyTrash();
                    }
                  });
              }}>Empty Trash 🔥</button>
          </motion.div>
      )}

      <div className="mb-4">
        <h6 
            className="text-uppercase text-muted small fw-bold mb-3 d-flex align-items-center cursor-pointer justify-content-between"
            onClick={() => toggleSection('type')}
        >
            <div className="d-flex align-items-center">
                <span className="me-2">🏷️</span> Content Type
            </div>
            <motion.span animate={{ rotate: openSections.type ? 0 : -90 }}>▾</motion.span>
        </h6>
        <AnimatePresence>
            {openSections.type && (
                <motion.div 
                    variants={accordion}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="d-flex flex-column gap-1"
                >
                    {[
                        { id: 'all', label: 'All Items', icon: '🌈' },
                        { id: 'note', label: 'Notes', icon: '📝' },
                        { id: 'link', label: 'Links', icon: '🔗' },
                        { id: 'code', label: 'Snippets', icon: '💻' }
                    ].map(type => (
                        <motion.button
                            key={type.id}
                            whileTap={{ scale: 0.98 }}
                            className={`btn btn-sm text-start d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border-0 ${filters.type === type.id ? 'btn-primary shadow-sm' : 'btn-light'}`}
                            onClick={() => handleFilterChange({ type: type.id, search: '' })}
                        >
                            <div className="d-flex align-items-center">
                                <span className="me-2">{type.icon}</span>
                                <span>{type.label}</span>
                            </div>
                            <span className={`badge rounded-pill ${filters.type === type.id ? 'bg-white text-primary' : 'bg-secondary-subtle text-muted'}`}>{counts[type.id]}</span>
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="mb-4">
        <h6 
            className="text-uppercase text-muted small fw-bold mb-3 d-flex align-items-center cursor-pointer justify-content-between"
            onClick={() => toggleSection('tags')}
        >
            <div className="d-flex align-items-center">
                <span className="me-2">#️⃣</span> Tags
            </div>
            <motion.span animate={{ rotate: openSections.tags ? 0 : -90 }}>▾</motion.span>
        </h6>
        <AnimatePresence>
            {openSections.tags && (
                <motion.div 
                    variants={accordion}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="d-flex flex-wrap gap-2"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`btn btn-sm rounded-pill px-3 ${!filters.tag ? 'btn-primary shadow-sm' : 'btn-light border text-muted'}`}
                        onClick={() => handleFilterChange({ tag: null })}
                    >
                        All Tags
                    </motion.button>
                    {loading ? (
                        <>
                            <motion.span variants={skeleton} initial="initial" animate="animate" className="btn btn-sm rounded-pill px-4 bg-secondary-subtle" style={{ width: '60px', height: '30px' }}></motion.span>
                            <motion.span variants={skeleton} initial="initial" animate="animate" className="btn btn-sm rounded-pill px-4 bg-secondary-subtle" style={{ width: '80px', height: '30px' }}></motion.span>
                        </>
                    ) : (
                        allTags.map((tag, i) => (
                            <motion.button
                                key={tag}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className={`btn btn-sm rounded-pill px-3 ${filters.tag === tag ? 'btn-primary shadow-sm' : 'btn-light border text-muted'}`}
                                                        onClick={() => handleFilterChange({ tag, search: '' })}
                                                    >
                                                        #{tag}
                                                    </motion.button>
                                
                        ))
                    )}
                    {!loading && allTags.length === 0 && <p className="text-muted small italic ms-1">No tags yet.</p>}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-3 border-top">
          <motion.button 
            whileHover={{ x: 5, backgroundColor: 'rgba(220, 53, 69, 0.05)' }}
            className="btn btn-sm text-danger w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
            onClick={handleFactoryReset}
          >
              <span>⚙️</span>
              <span className="fw-bold small text-uppercase">Factory Reset</span>
          </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
