import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import CustomModal from './components/CustomModal';
import AIChat from './components/AIChat';
import Toast from './components/Toast';
import Loader from './components/Loader';
import { useTheme } from './context/ThemeContext';
import { useAI } from './context/AIContext';
import { useUI } from './context/UIContext';
import { pageTransition } from './utils/animations';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('vault'); // 'vault' or 'dashboard'
  const { theme } = useTheme();
  const { toggleChat } = useAI();
  const { showModal, isSearchFocused, setIsSearchFocused } = useUI();
  const editorRef = useRef(null);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToEditor = () => {
    if (editorRef.current) {
        editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleChat();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showShortcuts();
        }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const showShortcuts = () => {
    showModal({
        title: 'Keyboard Shortcuts',
        message: (
            <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between"><span>Toggle AI Chat</span> <kbd>Ctrl + K</kbd></div>
                <div className="list-group-item d-flex justify-content-between"><span>Save Note</span> <kbd>Ctrl + S</kbd></div>
                <div className="list-group-item d-flex justify-content-between"><span>This Menu</span> <kbd>Ctrl + /</kbd></div>
                <div className="list-group-item d-flex justify-content-between"><span>Search</span> <kbd>/</kbd></div>
            </div>
        ),
        type: 'info'
    });
  };

  return (
    <div className="min-vh-100 pb-5">
      <AnimatePresence mode="wait">
        {loading ? (
          <Loader key="loader" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CustomModal />
            <Toast />
            <AIChat />
            <Header />

            <AnimatePresence>
                {isSearchFocused && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="search-backdrop"
                    onClick={() => setIsSearchFocused(false)}
                />
                )}
            </AnimatePresence>
            
            <div className="container mb-4 d-flex justify-content-between align-items-center">
                <ul className="nav nav-pills shadow-sm">
                    <li className="nav-item position-relative">
                        <button 
                            className={`nav-link ${view === 'vault' ? 'active' : ''}`} 
                            onClick={() => setView('vault')}
                        >
                            Vault
                            {view === 'vault' && (
                                <motion.div 
                                    layoutId="activePill"
                                    className="nav-pill-background"
                                    style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    </li>
                    <li className="nav-item position-relative">
                        <button 
                            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} 
                            onClick={() => setView('dashboard')}
                        >
                            Dashboard
                            {view === 'dashboard' && (
                                <motion.div 
                                    layoutId="activePill"
                                    className="nav-pill-background"
                                    style={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    </li>
                </ul>
                <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={showShortcuts} title="Keyboard Shortcuts">
                    ⌨️ Shortcuts
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    variants={pageTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                {view === 'vault' ? (
                    <div className="container">
                        <div className={`mb-4 p-4 rounded-4 shadow-sm bg-body border border-light-subtle transition-all ${isSearchFocused ? 'search-section-focused' : ''}`}>
                            <SearchBar />
                        </div>
                        <div className="row">
                        <div className="col-lg-3">
                            <Sidebar />
                        </div>
                        <div className="col-lg-9">
                            <div ref={editorRef}>
                                <NoteEditor />
                            </div>
                            <hr className="my-4" />
                            <NoteList onEdit={scrollToEditor} />
                        </div>
                        </div>
                    </div>
                ) : (
                    <Dashboard onViewChange={setView} />
                )}
                </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default App;

