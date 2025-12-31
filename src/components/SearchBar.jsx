import React from 'react';
import { useVault } from '../context/VaultContext';

const SearchBar = () => {
  const { state, setFilters, setSort } = useVault();
  const { filters, sortBy } = state;

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-8">
        <div className="input-group shadow-sm rounded">
          <span className="input-group-text bg-white border-end-0">
            🔍
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search by title, content or tags..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
      </div>
      <div className="col-md-4">
        <select 
          className="form-select shadow-sm" 
          value={sortBy} 
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="updated">Recently Updated</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
