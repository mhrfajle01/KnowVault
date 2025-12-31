import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { dbUtils } from '../utils/db';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, addItem } = useVault();
  const { playAiSound } = useAI();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    playAiSound('success');
    const dataStr = JSON.stringify(state.items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `know-vault-backup-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
      fileInputRef.current.click();
  };

  const handleImportFile = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const importedData = JSON.parse(event.target.result);
              if (Array.isArray(importedData)) {
                  let count = 0;
                  for (const item of importedData) {
                      // Basic validation check
                      if (item.title && item.type) {
                          // We treat import as "add new" or "merge". 
                          // To avoid ID conflicts, we can regenerate IDs or check existence.
                          // For this MVP, let's regenerate IDs to be safe and treat them as copies.
                          const newItem = {
                              ...item,
                              id: crypto.randomUUID(), // New ID
                              importedAt: new Date().toISOString()
                          };
                          await addItem(newItem); // This updates context one by one. Slow for huge lists but fine for MVP.
                          count++;
                      }
                  }
                  playAiSound('success');
                  alert(`Successfully imported ${count} items.`);
              } else {
                  alert('Invalid backup file format.');
              }
          } catch (err) {
              console.error(err);
              alert('Failed to parse JSON file.');
          }
      };
      reader.readAsText(file);
      e.target.value = null; // Reset input
  };

  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-body-tertiary border-bottom' : 'navbar-dark bg-gradient-primary'} mb-4 transition-colors`}>
      <div className="container d-flex flex-wrap justify-content-between align-items-center">
        <span className="navbar-brand mb-0 h1 d-none d-sm-inline">Personal Knowledge Vault</span>
        <span className="navbar-brand mb-0 h1 d-inline d-sm-none">KnowVault</span>
        
        <div className="d-flex gap-1 gap-sm-2 my-1">
           <button 
             className="btn btn-sm btn-outline-light" 
             onClick={handleExport}
             title="Export Data"
           >
             ⬇ Export
           </button>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             accept=".json" 
             onChange={handleImportFile}
           />
           <button 
             className="btn btn-sm btn-outline-light" 
             onClick={handleImportClick}
             title="Import Data"
           >
             ⬆ Import
           </button>

           <button 
             className="btn btn-sm btn-outline-light" 
             onClick={() => {
                 playAiSound('fun');
                 toggleTheme();
             }}
             title="Toggle Theme"
           >
             {theme === 'light' ? '🌙' : '☀️'}
           </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;