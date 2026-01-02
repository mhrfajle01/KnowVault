import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { useUI } from '../context/UIContext';
import { slideIn, skeleton, accordion } from '../utils/animations';

const Sidebar = () => {
  const { 
    state, 
    setFilters, 
    allTags, 
    emptyTrash, 
    factoryReset, 
    triggerScroll,
    lockVault,
    logoutVault,
    exportVault,
    importVault,
    viewRecoveryCode,
    generateNewRecoveryCode
  } = useVault();
  const { playAiSound } = useAI();
  const { showModal } = useUI();
  const { filters, items, loading } = state;
  const fileInputRef = useRef(null);

  const [openSections, setOpenSections] = useState({
    view: true,
    type: true,
    tags: true,
    system: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleRecoveryKey = () => {
      // Use UI modal to ask for password and show key
      showModal({
          title: 'Recovery Key Management',
          message: (
              <div className="text-start">
                  <p className="small text-muted mb-3">Your Recovery Key is used to access your vault if you forget your master password. Enter your password to view it.</p>
                  <div className="mb-3">
                      <input 
                        type="password" 
                        id="recovery-auth-pwd" 
                        className="form-control" 
                        placeholder="Master Password" 
                      />
                  </div>
                  <div id="recovery-display-area" className="d-none">
                      <div className="p-3 bg-light rounded-3 border border-success text-center mb-3">
                          <code id="recovery-code-text" className="fs-5 fw-bold text-dark"></code>
                      </div>
                      <div className="alert alert-info py-2 x-small">
                          Save this code somewhere safe (offline).
                      </div>
                  </div>
                  <div className="d-grid gap-2">
                      <button 
                        className="btn btn-primary" 
                        id="btn-view-recovery"
                        onClick={async () => {
                            const pwd = document.getElementById('recovery-auth-pwd').value;
                            const btn = document.getElementById('btn-view-recovery');
                            const area = document.getElementById('recovery-display-area');
                            const text = document.getElementById('recovery-code-text');
                            
                            try {
                                btn.disabled = true;
                                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                                const code = await viewRecoveryCode(pwd);
                                if (code) {
                                    text.innerText = code;
                                    area.classList.remove('d-none');
                                    btn.classList.add('d-none');
                                    document.getElementById('recovery-auth-pwd').parentElement.classList.add('d-none');
                                } else {
                                    // Old vault, need to generate
                                    if (confirm("No recovery key found for this vault. Would you like to generate a new one now?")) {
                                        const newCode = await generateNewRecoveryCode(pwd);
                                        text.innerText = newCode;
                                        area.classList.remove('d-none');
                                        btn.classList.add('d-none');
                                        document.getElementById('recovery-auth-pwd').parentElement.classList.add('d-none');
                                    }
                                }
                            } catch (e) {
                                alert("Invalid password.");
                                btn.disabled = false;
                                btn.innerText = 'View Key';
                            }
                        }}
                      >
                        View Key
                      </button>
                  </div>
              </div>
          ),
          type: 'info',
          hideConfirm: true
      });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            await importVault(file);
        } catch (err) {
            console.error(err);
        }
    }
  };

  const counts = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    return {
      active: safeItems.filter(i => !i.archived && !i.trashed).length,
      archived: safeItems.filter(i => i.archived && !i.trashed).length,
      trashed: safeItems.filter(i => i.trashed).length,
      note: safeItems.filter(i => i.type === 'note' && !i.trashed).length,
      link: safeItems.filter(i => i.type === 'link' && !i.trashed).length,
      code: safeItems.filter(i => i.type === 'code' && !i.trashed).length,
      all: safeItems.filter(i => !i.trashed).length
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
                            onClick={() => handleFilterChange({ type: type.id, search: '', tag: null })}
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
                                                                                onClick={() => handleFilterChange({ tag, search: '', type: 'all' })}
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
          <h6 
              className="text-uppercase text-muted small fw-bold mb-3 d-flex align-items-center cursor-pointer justify-content-between"
              onClick={() => toggleSection('system')}
          >
              <div className="d-flex align-items-center">
                  <span className="me-2">🛠️</span> System
              </div>
              <motion.span animate={{ rotate: openSections.system ? 0 : -90 }}>▾</motion.span>
          </h6>
          <AnimatePresence>
            {openSections.system && (
                <motion.div
                    variants={accordion}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="d-flex flex-column gap-1"
                >
                    <motion.button 
                        whileHover={{ x: 5, backgroundColor: 'rgba(220, 53, 69, 0.05)' }}
                        className="btn btn-sm text-danger w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
                        onClick={logoutVault}
                    >
                        <span>🚪</span>
                        <span className="fw-bold small">Logout</span>
                    </motion.button>

                    <motion.button 
                        whileHover={{ x: 5, backgroundColor: 'rgba(102, 16, 242, 0.05)' }}
                        className="btn btn-sm text-primary w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
                        onClick={handleRecoveryKey}
                        style={{ color: '#6610f2' }}
                    >
                        <span>🔑</span>
                        <span className="fw-bold small">Recovery Key</span>
                    </motion.button>

                    <motion.button 
                        whileHover={{ x: 5, backgroundColor: 'rgba(25, 135, 84, 0.05)' }}
                        className="btn btn-sm text-success w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
                        onClick={exportVault}
                    >
                        <span>📤</span>
                        <span className="fw-bold small">Backup Data</span>
                    </motion.button>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept=".json"
                        onChange={handleFileChange}
                    />
                    <motion.button 
                        whileHover={{ x: 5, backgroundColor: 'rgba(255, 193, 7, 0.1)' }}
                        className="btn btn-sm text-warning w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
                        onClick={handleImportClick}
                    >
                        <span>📥</span>
                        <span className="fw-bold small">Restore Backup</span>
                    </motion.button>

                    <motion.button 
                        whileHover={{ x: 5, backgroundColor: 'rgba(220, 53, 69, 0.05)' }}
                        className="btn btn-sm text-danger w-100 border-0 text-start d-flex align-items-center gap-2 py-2 rounded-3" 
                        onClick={handleFactoryReset}
                    >
                        <span>⚙️</span>
                        <span className="fw-bold small text-uppercase">Factory Reset</span>
                    </motion.button>
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;
