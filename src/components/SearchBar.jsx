import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';

const SearchBar = () => {
  const { state, setFilters, setSort, filteredItems } = useVault();
  const { filters, sortBy } = state;
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);

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
          <span className={`fs-4 ${hasResults ? 'animate-bounce' : ''}`}>🔍</span>
          <h5 className="mb-0 fw-bold">Search & Filter</h5>
          {filters.search && (
              <span className={`badge rounded-pill ms-2 ${hasResults ? 'bg-success' : 'bg-danger'} transition-all`}>
                {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
              </span>
          )}
          <small className="text-muted ms-auto d-none d-sm-inline">Searching across titles, tags, and content...</small>
      </div>
      <div className="row g-3 align-items-center">
        <div className="col-lg-8 col-md-7">
          <div className={`input-group shadow-sm rounded-pill overflow-hidden transition-all ${isSearching ? 'ring-primary' : ''}`} style={{ border: '2px solid transparent', background: 'var(--bs-tertiary-bg)' }}>
            <span className={`input-group-text bg-transparent border-0 ps-3 ${isSearching ? 'animate-pulse text-primary' : ''}`}>
              {isSearching ? '⏳' : '🔍'}
            </span>
            <input
              type="text"
              className="form-control border-0 bg-transparent py-2 shadow-none"
              placeholder="Deep search your vault..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
            {filters.search && (
                <button 
                  className="btn border-0 bg-transparent text-muted px-3" 
                  onClick={() => setFilters({ search: '' })}
                >
                    ✕
                </button>
            )}
          </div>
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
