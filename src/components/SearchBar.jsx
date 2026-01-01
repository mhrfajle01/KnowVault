import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../context/VaultContext';
import { useUI } from '../context/UIContext';

const SearchBar = () => {
  const { state, setFilters, setSort, triggerScroll, filteredItems } = useVault();
  const { isSearchFocused, setIsSearchFocused } = useUI();
  const { filters, sortBy } = state;
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      triggerScroll('match');
    }
  };

  useEffect(() => {
    if (filters.search) {
      setIsSearching(true);
      setHasResults(filteredItems.length > 0);
      const timer = setTimeout(() => setIsSearching(false), 600);
      return () => clearTimeout(timer);
    } else {
        setHasResults(false);
    }
  }, [filters.search, filteredItems.length]);

  return (
    <div className="search-section">
      <div className="d-flex align-items-center gap-2 mb-3">
          <motion.span 
            animate={hasResults ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="fs-4"
          >
            🔍
          </motion.span>
          <h5 className="mb-0 fw-bold">Search & Filter</h5>
          <AnimatePresence>
            {filters.search && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className={`badge rounded-pill ms-2 ${hasResults ? 'bg-success' : 'bg-danger'} shadow-sm`}
                >
                  {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
                </motion.span>
            )}
          </AnimatePresence>
          <small className="text-muted ms-auto d-none d-sm-inline">Searching across titles, tags, and content...</small>
      </div>
      <div className="row g-3 align-items-center">
        <div className="col-lg-8 col-md-7">
          <motion.div 
            animate={isSearchFocused ? { scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } : (isSearching ? { scale: 1.01 } : { scale: 1 })}
            className={`input-group shadow-sm rounded-pill overflow-hidden transition-all ${isSearchFocused || isSearching ? 'ring-primary' : ''}`} 
            style={{ border: '2px solid transparent', background: 'var(--bs-tertiary-bg)' }}
          >
            <span className={`input-group-text bg-transparent border-0 ps-3 ${isSearching ? 'animate-pulse text-primary' : ''}`}>
              {isSearching ? '⏳' : '🔍'}
            </span>
            <input
              type="text"
              className="form-control border-0 bg-transparent py-2 shadow-none"
              placeholder="Deep search your vault..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsSearchFocused(true)}
            />
            <AnimatePresence>
                {filters.search && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="btn border-0 bg-transparent text-muted px-3" 
                      onClick={() => setFilters({ search: '' })}
                    >
                        ✕
                    </motion.button>
                )}
            </AnimatePresence>
          </motion.div>
        </div>
        <div className="col-lg-4 col-md-5">
          <div className="d-flex gap-2">
              <select 
                  className="form-select shadow-sm rounded-pill border-0 px-3 py-2" 
                  value={sortBy} 
                  onChange={(e) => setSort(e.target.value)}
                  style={{ background: 'var(--bs-tertiary-bg)' }}
              >
                  <option value="newest">📅 Newest</option>
                  <option value="oldest">⏳ Oldest</option>
                  <option value="updated">🔄 Updated</option>
              </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

