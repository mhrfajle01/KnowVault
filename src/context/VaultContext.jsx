import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { dbUtils } from '../utils/db';
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
  sortBy: 'newest', // newest, oldest, updated
  scrollTrigger: {
    timestamp: 0,
    type: 'match' // 'match' or 'top'
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Add a small artificial delay to make skeleton loaders visible/interactive
        await new Promise(resolve => setTimeout(resolve, 1000));
        const items = await dbUtils.getAll();
        dispatch({ type: 'SET_ITEMS', payload: items });
      } catch (err) {
        console.error("Failed to load items:", err);
        dispatch({ type: 'SET_ERROR', payload: "Failed to load database." });
      }
    };
    loadData();
  }, []);

  // Actions
  const addItem = async (item) => {
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
      await dbUtils.add(newItem);
      dispatch({ type: 'ADD_ITEM', payload: newItem });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const updateItem = async (item) => {
    try {
      const updatedItem = {
        ...item,
        updatedAt: new Date().toISOString()
      };
      await dbUtils.update(updatedItem);
      dispatch({ type: 'UPDATE_ITEM', payload: updatedItem });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const deleteItem = async (id) => {
    try {
      await dbUtils.delete(id);
      dispatch({ type: 'DELETE_ITEM', payload: id });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  };

  const moveToTrash = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, trashed: true, pinned: false, updatedAt: new Date().toISOString() };
        await dbUtils.update(updated);
        dispatch({ type: 'UPDATE_ITEM', payload: updated });
    }
  };

  const restoreFromTrash = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, trashed: false, updatedAt: new Date().toISOString() };
        await dbUtils.update(updated);
        dispatch({ type: 'UPDATE_ITEM', payload: updated });
    }
  };

  const emptyTrash = async () => {
    const trashedItems = state.items.filter(i => i.trashed);
    for (const item of trashedItems) {
        await dbUtils.delete(item.id);
    }
    dispatch({ type: 'EMPTY_TRASH' });
  };

  const factoryReset = async () => {
    try {
        await dbUtils.clearAll();
        localStorage.clear();
        dispatch({ type: 'RESET_VAULT' });
        window.location.reload(); // Reload to ensure everything is fresh
    } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: "Reset failed: " + err.message });
    }
  };

  const bulkArchiveByType = async (type) => {
    const toUpdate = state.items.filter(i => i.type === type && !i.archived && !i.trashed);
    for (const item of toUpdate) {
        const updated = { ...item, archived: true, updatedAt: new Date().toISOString() };
        await dbUtils.update(updated);
        dispatch({ type: 'UPDATE_ITEM', payload: updated });
    }
  };

  const togglePin = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() };
        await dbUtils.update(updated);
        dispatch({ type: 'UPDATE_ITEM', payload: updated });
    }
  };

  const toggleArchive = async (id) => {
    const item = state.items.find(i => i.id === id);
    if (item) {
        const updated = { ...item, archived: !item.archived, updatedAt: new Date().toISOString() };
        await dbUtils.update(updated);
        dispatch({ type: 'UPDATE_ITEM', payload: updated });
    }
  };

  const setEditingItem = (item) => {
    dispatch({ type: 'SET_EDITING_ITEM', payload: item });
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSort = (sort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  };

  const triggerScroll = (type = 'match') => {
    dispatch({ type: 'TRIGGER_SCROLL', payload: type });
  };

  // Derived Data with useMemo for stability and performance
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
    if (!Array.isArray(state.items)) return [];

    // 1. Initial filter based on main view (Active, Archive, Trash)
    let baseItems = state.items.filter(item => {
      if (!item) return false;
      const isTrashed = !!item.trashed;
      const isArchived = !!item.archived;

      if (state.filters.showTrashed) return isTrashed;
      if (state.filters.showArchived) return isArchived && !isTrashed;
      
      // Default: Active view (not archived AND not trashed)
      return !isArchived && !isTrashed;
    });

    // 2. Apply Search if search string exists
    let searchedItems = baseItems;
    const searchTerm = state.filters.search?.trim();
    
    if (searchTerm) {
      if (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2) {
        // Exact match
        const exactTerm = searchTerm.slice(1, -1).toLowerCase();
        searchedItems = baseItems.filter(item => 
          (item.title || '').toLowerCase().includes(exactTerm) || 
          (item.content || '').toLowerCase().includes(exactTerm) ||
          (item.tags || []).some(t => t.toLowerCase().includes(exactTerm))
        );
      } else {
        // Fuzzy match using the already filtered baseItems
        const searchFuse = new Fuse(baseItems, {
          keys: ['title', 'content', 'tags'],
          threshold: 0.3,
          ignoreLocation: true
        });
        searchedItems = searchFuse.search(searchTerm).map(result => result.item);
      }
    }

    // 3. Apply Tag and Type filters
    return searchedItems
      .filter(item => {
        if (!item) return false;
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        const matchesTag = !state.filters.tag || itemTags.includes(state.filters.tag);
        const matchesType = state.filters.type === 'all' || item.type === state.filters.type;
        return matchesTag && matchesType;
      })
      .sort((a, b) => {
        // Always put pinned items first
        if (!!a.pinned && !b.pinned) return -1;
        if (!a.pinned && !!b.pinned) return 1;

        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

        if (state.sortBy === 'newest') return dateB - dateA;
        if (state.sortBy === 'oldest') return dateA - dateB;
        if (state.sortBy === 'updated') return dateB - dateA;
        return 0;
      });
  }, [state.items, state.filters, state.sortBy]);

  return (
    <VaultContext.Provider value={{ 
      state, 
      addItem, 
      updateItem, 
      deleteItem, 
      moveToTrash,
      restoreFromTrash,
      emptyTrash,
      factoryReset,
      bulkArchiveByType,
      togglePin,
      toggleArchive,
      setEditingItem,
      setFilters,
      setSort,
      triggerScroll,
      filteredItems,
      allTags
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);
