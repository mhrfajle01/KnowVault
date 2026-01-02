import React, { createContext, useReducer, useContext, useEffect, useState } from 'react';
import { dbUtils } from '../utils/db';
import { cryptoUtils } from '../utils/crypto';
import AuthScreen from '../components/AuthScreen';
import Fuse from 'fuse.js';

const VaultContext = createContext();

const initialState = {
  items: [],
  loading: true,
  error: null,
  editingItem: null,
  filters: {
    search: '',
    tag: null,
    type: 'all',
    showArchived: false,
    showTrashed: false
  },
  sortBy: 'newest',
  scrollTrigger: {
    timestamp: 0,
    type: 'match'
  }
};

const vaultReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload || [], loading: false };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...(state.items || [])] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => item.id === action.payload.id ? action.payload : item),
        editingItem: state.editingItem?.id === action.payload.id ? action.payload : state.editingItem
      };
    case 'DELETE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_EDITING_ITEM':
      return { ...state, editingItem: action.payload };
    case 'TRIGGER_SCROLL':
      return { ...state, scrollTrigger: { timestamp: Date.now(), type: action.payload || 'match' } };
    case 'TOGGLE_PIN':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload ? { ...item, pinned: !item.pinned } : item
        )
      };
    case 'TOGGLE_ARCHIVE':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload ? { ...item, archived: !item.archived } : item
        )
      };
    case 'MOVE_TO_TRASH':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload ? { ...item, trashed: true, pinned: false } : item
        )
      };
    case 'RESTORE_FROM_TRASH':
      return {
        ...state,
        items: state.items.map(item => 
          item.id === action.payload ? { ...item, trashed: false } : item
        )
      };
    case 'EMPTY_TRASH':
      return { ...state, items: state.items.filter(item => !item.trashed) };
    case 'RESET_VAULT':
      return { ...initialState, items: [], loading: false };
    default:
      return state;
  }
};

export const VaultProvider = ({ children }) => {
  const [state, dispatch] = useReducer(vaultReducer, initialState);
  
  // Security State
  const [isLocked, setIsLocked] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isPanicMode, setIsPanicMode] = useState(false);
  
  // Auto-Lock State
  const AUTO_LOCK_TIME = 15 * 60 * 1000; // 15 minutes
  const idleTimerRef = React.useRef(null);

  const lockVault = React.useCallback(() => {
    setCryptoKey(null);
    setIsLocked(true);
    setIsPanicMode(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  const resetIdleTimer = React.useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isLocked && cryptoKey) {
        idleTimerRef.current = setTimeout(() => {
            lockVault();
        }, AUTO_LOCK_TIME);
    }
  }, [isLocked, cryptoKey, lockVault]);

  useEffect(() => {
    if (isLocked) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Start initial timer
    resetIdleTimer();

    return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isLocked, resetIdleTimer]);


  // 1. Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const storedSalt = localStorage.getItem('knowvault_salt');
      if (!storedSalt) {
        setIsSetupMode(true);
      }
      // If salt exists, we stay locked until password is provided
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  // 2. Load Data (Only when unlocked and NOT in panic mode)
  useEffect(() => {
    if (isLocked || !cryptoKey || isPanicMode) return;

    const loadData = async () => {
      try {
        const rawItems = await dbUtils.getAll();
        const decryptedItems = await Promise.all(
          rawItems.map(item => cryptoUtils.decrypt(item, cryptoKey))
        );
        dispatch({ type: 'SET_ITEMS', payload: decryptedItems });
      } catch (err) {
        console.error("Failed to load items:", err);
        dispatch({ type: 'SET_ERROR', payload: "Failed to decrypt database. " + err.message });
      }
    };
    loadData();
  }, [isLocked, cryptoKey, isPanicMode]);

  // Auth Actions
  const handleUnlock = async (password, panicPasswordInput = null) => {
    try {
      if (isSetupMode) {
        // SETUP: Generate Key, Encrypt Verifier
        const salt = cryptoUtils.generateSalt();
        const key = await cryptoUtils.deriveKey(password, salt);
        
        const verifier = await cryptoUtils.encrypt({ status: 'OK' }, key);
        
        localStorage.setItem('knowvault_salt', bufferToBase64(salt));
        localStorage.setItem('knowvault_verifier', JSON.stringify(verifier));

        // Recovery Setup
        const recoveryCode = cryptoUtils.generateRecoveryCode();
        const recoveryKey = await cryptoUtils.deriveKey(recoveryCode, salt);
        const rawMasterKey = await cryptoUtils.exportKey(key);
        const rawKeyB64 = bufferToBase64(rawMasterKey);
        const recoveryBlob = await cryptoUtils.encrypt({ masterKey: rawKeyB64 }, recoveryKey);
        localStorage.setItem('knowvault_recovery_blob', JSON.stringify(recoveryBlob));
        
        // Save recovery code encrypted by master key (to allow viewing later)
        const encryptedRecoveryCode = await cryptoUtils.encrypt({ code: recoveryCode }, key);
        localStorage.setItem('knowvault_recovery_code_encrypted', JSON.stringify(encryptedRecoveryCode));

        // Optional Panic Password Setup
        if (panicPasswordInput && panicPasswordInput.length > 0) {
            console.log("Setting up panic password...");
            const panicKey = await cryptoUtils.deriveKey(panicPasswordInput, salt);
            const panicVerifier = await cryptoUtils.encrypt({ status: 'PANIC' }, panicKey);
            localStorage.setItem('knowvault_panic_verifier', JSON.stringify(panicVerifier));
        }

        // Migration Check
        const existingData = await dbUtils.getAll();
        if (existingData.length > 0 && !existingData[0]._encrypted) {
           await Promise.all(existingData.map(async (item) => {
             const encrypted = await cryptoUtils.encrypt(item, key);
             encrypted.id = item.id; 
             await dbUtils.update(encrypted);
           }));
        }

        setCryptoKey(key);
        setIsSetupMode(false);
        setIsLocked(false);
        return recoveryCode; // Return for UI display
      } else {
        // UNLOCK
        const saltB64 = localStorage.getItem('knowvault_salt');
        const verifierStr = localStorage.getItem('knowvault_verifier');
        const panicVerifierStr = localStorage.getItem('knowvault_panic_verifier');
        
        if (!saltB64 || !verifierStr) {
            throw new Error("Security data missing. Please reset app.");
        }

        const salt = base64ToBuffer(saltB64);
        
        // Helper to attempt decryption
        const attempt = async (pwd, vStr) => {
            const k = await cryptoUtils.deriveKey(pwd, salt);
            const v = JSON.parse(vStr);
            await cryptoUtils.decrypt(v, k);
            return k;
        };

        // 1. Try Master Password
        try {
            console.log("Attempting Master Unlock...");
            const key = await attempt(password, verifierStr);
            console.log("Master Unlock Success");
            setCryptoKey(key);
            setIsPanicMode(false);
            setIsLocked(false);
            return;
        } catch (masterErr) {
            console.warn("Master Unlock Failed:", masterErr);
            
            // 2. Try Panic Password (if exists)
            if (panicVerifierStr) {
                try {
                    console.log("Attempting Panic Unlock...");
                    await attempt(password, panicVerifierStr);
                    console.log("Panic Unlock Success");
                    
                    // Panic Mode Active
                    const randomSalt = cryptoUtils.generateSalt();
                    const randomKey = await cryptoUtils.deriveKey('random', randomSalt);
                    setCryptoKey(randomKey);
                    setIsPanicMode(true);
                    setIsLocked(false);
                    dispatch({ type: 'SET_ITEMS', payload: [] });
                    return;
                } catch (panicErr) {
                    console.warn("Panic Unlock Failed:", panicErr);
                }
            }
        }
        
        throw new Error("Invalid password");
      }
    } catch (err) {
      console.error(err);
      throw new Error("Invalid password or security error.");
    }
  };

  const viewRecoveryCode = async (password) => {
    try {
        const saltB64 = localStorage.getItem('knowvault_salt');
        const encryptedCodeStr = localStorage.getItem('knowvault_recovery_code_encrypted');
        
        if (!saltB64 || !encryptedCodeStr) {
            return null; // Might be an old vault version
        }

        const salt = base64ToBuffer(saltB64);
        const key = await cryptoUtils.deriveKey(password, salt);
        const encryptedData = JSON.parse(encryptedCodeStr);
        
        const decrypted = await cryptoUtils.decrypt(encryptedData, key);
        return decrypted.code;
    } catch (err) {
        throw new Error("Invalid password.");
    }
  };

  const generateNewRecoveryCode = async (password) => {
    try {
        const saltB64 = localStorage.getItem('knowvault_salt');
        if (!saltB64) throw new Error("Security data missing.");
        
        const salt = base64ToBuffer(saltB64);
        const key = await cryptoUtils.deriveKey(password, salt);
        
        // Verify password first
        const verifierStr = localStorage.getItem('knowvault_verifier');
        await cryptoUtils.decrypt(JSON.parse(verifierStr), key);

        // Generate New
        const newCode = cryptoUtils.generateRecoveryCode();
        const newRecoveryKey = await cryptoUtils.deriveKey(newCode, salt);
        const rawMasterKey = await cryptoUtils.exportKey(key);
        
        // Update Recovery Blob
        const rawKeyB64 = bufferToBase64(rawMasterKey);
        const recoveryBlob = await cryptoUtils.encrypt({ masterKey: rawKeyB64 }, newRecoveryKey);
        localStorage.setItem('knowvault_recovery_blob', JSON.stringify(recoveryBlob));
        
        // Update encrypted code view
        const encryptedRecoveryCode = await cryptoUtils.encrypt({ code: newCode }, key);
        localStorage.setItem('knowvault_recovery_code_encrypted', JSON.stringify(encryptedRecoveryCode));

        return newCode;
    } catch (err) {
        throw new Error("Failed to generate code: " + err.message);
    }
  };

  const recoverVault = async (recoveryCode) => {
      try {
        const saltB64 = localStorage.getItem('knowvault_salt');
        const blobStr = localStorage.getItem('knowvault_recovery_blob');
        
        if (!saltB64 || !blobStr) {
            throw new Error("Recovery data missing.");
        }

        const salt = base64ToBuffer(saltB64);
        const recoveryKey = await cryptoUtils.deriveKey(recoveryCode, salt);
        const blob = JSON.parse(blobStr);
        
        // Decrypt the wrapped key
        const decrypted = await cryptoUtils.decrypt(blob, recoveryKey);
        
        if (!decrypted || !decrypted.masterKey) {
            throw new Error("Invalid recovery code.");
        }

        // Import the Master Key
        const rawMasterKey = base64ToBuffer(decrypted.masterKey);
        const masterKey = await cryptoUtils.importKey(rawMasterKey);

        setCryptoKey(masterKey);
        setIsPanicMode(false);
        setIsLocked(false);
      } catch (err) {
          console.error(err);
          throw new Error("Recovery failed: Invalid code.");
      }
  };

  // Helper Wrappers for DB
  const secureAdd = async (item) => {
    try {
      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: item.tags || [],
        pinned: false,
        archived: false,
        trashed: false
      };
      
      if (!isPanicMode) {
        const encrypted = await cryptoUtils.encrypt(newItem, cryptoKey);
        encrypted.id = newItem.id; 
        await dbUtils.add(encrypted);
      }
      
      dispatch({ type: 'ADD_ITEM', payload: newItem });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const secureUpdate = async (item) => {
    try {
      const updatedItem = {
        ...item,
        updatedAt: new Date().toISOString()
      };

      if (!isPanicMode) {
        const encrypted = await cryptoUtils.encrypt(updatedItem, cryptoKey);
        encrypted.id = updatedItem.id;
        await dbUtils.update(encrypted);
      }

      dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  // Delete/Trash/Restore don't need encryption changes as they act on IDs or metadata (which we re-encrypt)
  // BUT: moveToTrash updates the item, so it needs to re-encrypt.
  
  const secureMoveToTrash = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, trashed: true, pinned: false, updatedAt: new Date().toISOString() };
        await secureUpdate(updated); // Reuse secureUpdate
    }
  };

  const secureRestore = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, trashed: false, updatedAt: new Date().toISOString() };
        await secureUpdate(updated);
    }
  };

  const secureTogglePin = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() };
        await secureUpdate(updated);
    }
  };

  const secureToggleArchive = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, archived: !item.archived, updatedAt: new Date().toISOString() };
        await secureUpdate(updated);
    }
  };

  const secureBulkArchive = async (type) => {
      const toUpdate = state.items.filter(i => i.type === type && !i.archived && !i.trashed);
      for (const item of toUpdate) {
          const updated = { ...item, archived: true, updatedAt: new Date().toISOString() };
          await secureUpdate(updated); 
      }
  };

  const deleteItem = async (id) => {
    try {
      if (!isPanicMode) {
        await dbUtils.delete(id);
      }
      dispatch({ type: 'DELETE_ITEM', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const emptyTrash = async () => {
    const trashedItems = state.items.filter(i => i.trashed);
    if (!isPanicMode) {
        for (const item of trashedItems) {
            await dbUtils.delete(item.id);
        }
    }
    dispatch({ type: 'EMPTY_TRASH' });
  };

  const factoryReset = async () => {
    try {
        await dbUtils.clearAll();
        localStorage.clear();
        dispatch({ type: 'RESET_VAULT' });
        window.location.reload(); 
    } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: "Reset failed: " + err.message });
    }
  };

  const exportVault = async () => {
    try {
        const items = await dbUtils.getAll();
        const salt = localStorage.getItem('knowvault_salt');
        const verifier = localStorage.getItem('knowvault_verifier');
        
        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            salt,
            verifier,
            items
        };

        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knowvault-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export failed:", err);
        dispatch({ type: 'SET_ERROR', payload: "Export failed: " + err.message });
    }
  };

  const importVault = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Basic Validation
                if (!data.salt || !data.verifier || !Array.isArray(data.items)) {
                    throw new Error("Invalid backup file format.");
                }

                // Clear existing data
                await dbUtils.clearAll();
                localStorage.clear();

                // Restore Security
                localStorage.setItem('knowvault_salt', data.salt);
                localStorage.setItem('knowvault_verifier', data.verifier);

                // Restore Items
                // We need to re-open DB after clearAll
                for (const item of data.items) {
                    // We use the raw 'add' because items are already encrypted
                    // But we need to bypass 'secureAdd' which tries to encrypt again
                    // We must use dbUtils directly.
                    // NOTE: dbUtils.add might fail if key exists, use update/put
                    const db = await dbUtils.openDB();
                    const transaction = db.transaction(['knowledge_items'], 'readwrite');
                    const store = transaction.objectStore('knowledge_items');
                    store.put(item);
                }

                resolve();
                window.location.reload();

            } catch (err) {
                reject(err);
                dispatch({ type: 'SET_ERROR', payload: "Import failed: " + err.message });
            }
        };
        reader.readAsText(file);
    });
  };

  // Standard Filters/Sort
  const setEditingItem = (item) => dispatch({ type: 'SET_EDITING_ITEM', payload: item });
  const setFilters = (filters) => dispatch({ type: 'SET_FILTERS', payload: filters });
  const setSort = (sort) => dispatch({ type: 'SET_SORT', payload: sort });
  const triggerScroll = (type = 'match') => dispatch({ type: 'TRIGGER_SCROLL', payload: type });

  // Derived Data
  const allTags = React.useMemo(() => {
    if (!Array.isArray(state.items)) return [];
    const tags = new Set();
    state.items.forEach(item => {
        if (item && Array.isArray(item.tags)) {
            item.tags.forEach(t => {
                if (t) tags.add(t);
            });
        }
    });
    return Array.from(tags).sort();
  }, [state.items]);

  const filteredItems = React.useMemo(() => {
    const allItems = Array.isArray(state.items) ? state.items : [];
    const bucketItems = allItems.filter(item => {
      if (!item) return false;
      const isTrashed = !!item.trashed;
      const isArchived = !!item.archived;

      if (state.filters.showTrashed) return isTrashed;
      if (state.filters.showArchived) return isArchived && !isTrashed;
      return !isArchived && !isTrashed;
    });

    let results = bucketItems;
    const searchTerm = state.filters.search?.trim().toLowerCase();
    
    if (searchTerm) {
      if (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2) {
        const exact = searchTerm.slice(1, -1);
        results = bucketItems.filter(item => 
          (item.title || '').toLowerCase().includes(exact) || 
          (item.content || '').toLowerCase().includes(exact) ||
          (item.tags || []).some(t => t.toLowerCase().includes(exact))
        );
      } else {
        const fuse = new Fuse(bucketItems, {
          keys: ['title', 'content', 'tags'],
          threshold: 0.3
        });
        results = fuse.search(searchTerm).map(r => r.item);
      }
    }

    return results
      .filter(item => {
        const matchesTag = !state.filters.tag || (item.tags || []).includes(state.filters.tag);
        const matchesType = state.filters.type === 'all' || item.type === state.filters.type;
        return matchesTag && matchesType;
      })
      .sort((a, b) => {
        if (!!a.pinned && !b.pinned) return -1;
        if (!a.pinned && !!b.pinned) return 1;
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return state.sortBy === 'oldest' ? dateA - dateB : dateB - dateA;
      });
  }, [state.items, state.filters, state.sortBy]);

  if (authChecking) {
      return <div className="d-flex vh-100 justify-content-center align-items-center"><div className="spinner-border" /></div>;
  }

  return (
    <VaultContext.Provider value={{ 
      state, 
      addItem: secureAdd, 
      updateItem: secureUpdate, 
      deleteItem, 
      moveToTrash: secureMoveToTrash,
      restoreFromTrash: secureRestore,
      emptyTrash,
      factoryReset,
      bulkArchiveByType: secureBulkArchive,
      togglePin: secureTogglePin,
      toggleArchive: secureToggleArchive,
      setEditingItem,
      setFilters,
      setSort,
      triggerScroll,
      filteredItems,
      allTags,
      lockVault,
      exportVault,
      importVault,
      recoverVault,
      viewRecoveryCode,
      generateNewRecoveryCode
    }}>
      {isLocked ? (
        <AuthScreen onUnlock={handleUnlock} isSetup={isSetupMode} />
      ) : (
        children
      )}
    </VaultContext.Provider>
  );
};

// Utils for Base64 (needed for localStorage interaction in this file too)
function bufferToBase64(buffer) {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary);
}
  
function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export const useVault = () => useContext(VaultContext);