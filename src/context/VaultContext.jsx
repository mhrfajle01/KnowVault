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
  sortBy: 'newest' // newest, oldest, updated
};

const vaultReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };
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

  // Derived Data
  const allTags = Array.from(new Set(state.items.flatMap(item => item.tags))).sort();

  // Fuzzy Search Setup
  const fuse = new Fuse(state.items, {
    keys: ['title', 'content', 'tags'],
    threshold: 0.3,
    ignoreLocation: true
  });

  let processedItems = [...state.items];

  // Apply Fuzzy Search if search string exists
  if (state.filters.search) {
    processedItems = fuse.search(state.filters.search).map(result => result.item);
  }

  const filteredItems = processedItems
    .filter(item => {
      const matchesTag = !state.filters.tag || item.tags.includes(state.filters.tag);
      const matchesType = state.filters.type === 'all' || item.type === state.filters.type;
      
      if (state.filters.showTrashed) {
          return item.trashed && matchesTag && matchesType;
      }

      if (state.filters.showArchived) {
          return item.archived && !item.trashed && matchesTag && matchesType;
      }

      return !item.archived && !item.trashed && matchesTag && matchesType;
    })
    .sort((a, b) => {
      // Always put pinned items first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (state.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (state.sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (state.sortBy === 'updated') return new Date(b.updatedAt) - new Date(a.updatedAt);
      return 0;
    });

  return (
    <VaultContext.Provider value={{ 
      state, 
      addItem, 
      updateItem, 
      deleteItem, 
      moveToTrash,
      restoreFromTrash,
      emptyTrash,
      bulkArchiveByType,
      togglePin,
      toggleArchive,
      setEditingItem,
      setFilters,
      setSort,
      filteredItems,
      allTags
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);
