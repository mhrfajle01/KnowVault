import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { useUI } from '../context/UIContext';
import { dbUtils } from '../utils/db';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { state, addItem } = useVault();
  const { playAiSound } = useAI();
  const { showModal } = useUI();
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

    showModal({
      title: 'Export Successful',
      message: `Your vault data has been exported to ${exportFileDefaultName}`,
      type: 'confirm'
    });
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
                  showModal({
                    title: 'Import Successful',
                    message: `Successfully imported ${count} items into your vault.`,
                    type: 'confirm'
                  });
              } else {
                  showModal({
                    title: 'Import Failed',
                    message: 'Invalid backup file format. Expected a JSON array.',
                    type: 'danger'
                  });
              }
          } catch (err) {
              console.error(err);
              showModal({
                title: 'Import Error',
                message: 'Failed to parse JSON file. Please ensure it is a valid backup.',
                type: 'danger'
              });
          }
      };
      reader.readAsText(file);
      e.target.value = null; // Reset input
  };

  return (
    <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-body-tertiary border-bottom' : 'navbar-dark bg-gradient-primary'} mb-4 transition-colors`}>
      <div className="container d-flex flex-wrap justify-content-between align-items-center">
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="navbar-brand mb-0 h1 d-none d-sm-inline"
        >
          Personal Knowledge Vault
        </motion.span>
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="navbar-brand mb-0 h1 d-inline d-sm-none"
        >
          KnowVault
        </motion.span>
        
        <div className="d-flex gap-1 gap-sm-2 my-1">
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="btn btn-sm btn-outline-light" 
             onClick={handleExport}
             title="Export Data"
           >
             ⬇ Export
           </motion.button>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             accept=".json" 
             onChange={handleImportFile}
           />
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="btn btn-sm btn-outline-light" 
             onClick={handleImportClick}
             title="Import Data"
           >
             ⬆ Import
           </motion.button>

           <motion.button 
             whileHover={{ rotate: 15 }}
             whileTap={{ scale: 0.8, rotate: -15 }}
             className="btn btn-sm btn-outline-light" 
             onClick={() => {
                 playAiSound('fun');
                 toggleTheme();
             }}
             title="Toggle Theme"
           >
             {theme === 'light' ? '🌙' : '☀️'}
           </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default Header;