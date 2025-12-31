import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import Dashboard from './components/Dashboard';
import CustomModal from './components/CustomModal';
import AIChat from './components/AIChat';
import { useTheme } from './context/ThemeContext';
import { useAI } from './context/AIContext';
import { useUI } from './context/UIContext';
import './App.css';

function App() {
  const [view, setView] = useState('vault'); // 'vault' or 'dashboard'
  const { theme } = useTheme();
  const { toggleChat } = useAI();
  const { showModal } = useUI();
  const editorRef = useRef(null);

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
      <CustomModal />
      <AIChat />
      <Header />
      
      <div className="container mb-4 d-flex justify-content-between align-items-center">
        <ul className="nav nav-pills">
            <li className="nav-item">
                <button 
                    className={`nav-link ${view === 'vault' ? 'active' : ''}`} 
                    onClick={() => setView('vault')}
                >
                    Vault
                </button>
            </li>
            <li className="nav-item">
                <button 
                    className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} 
                    onClick={() => setView('dashboard')}
                >
                    Dashboard
                </button>
            </li>
        </ul>
        <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={showShortcuts} title="Keyboard Shortcuts">
            ⌨️ Shortcuts
        </button>
      </div>

      {view === 'vault' ? (
          <div className="container">
            <div className="row">
              <div className="col-lg-3">
                <Sidebar />
              </div>
              <div className="col-lg-9">
                <div ref={editorRef}>
                    <NoteEditor />
                </div>
                <hr className="my-4" />
                <SearchBar />
                <NoteList onEdit={scrollToEditor} />
              </div>
            </div>
          </div>
      ) : (
          <Dashboard />
      )}
    </div>
  );
}

export default App;
