import React from 'react';
import { useVault } from '../context/VaultContext';

const Sidebar = () => {
  const { state, setFilters, allTags, emptyTrash } = useVault();
  const { filters } = state;

  return (
    <div className="card shadow-sm border-0 p-3 mb-4">
      <h6 className="text-uppercase text-muted small fw-bold mb-3">View</h6>
      <div className="list-group list-group-flush mb-4">
        <button
            className={`list-group-item list-group-item-action border-0 px-2 py-1 rounded-2 mb-1 ${!filters.showArchived && !filters.showTrashed ? 'active bg-primary' : ''}`}
            onClick={() => setFilters({ showArchived: false, showTrashed: false })}
        >
            <span>📥 Active Vault</span>
        </button>
        <button
            className={`list-group-item list-group-item-action border-0 px-2 py-1 rounded-2 mb-1 ${filters.showArchived ? 'active bg-primary' : ''}`}
            onClick={() => setFilters({ showArchived: true, showTrashed: false })}
        >
            <span>📁 Archive</span>
        </button>
        <button
            className={`list-group-item list-group-item-action border-0 px-2 py-1 rounded-2 mb-1 ${filters.showTrashed ? 'active bg-danger text-white' : ''}`}
            onClick={() => setFilters({ showTrashed: true, showArchived: false })}
        >
            <span>🗑️ Trash</span>
        </button>
      </div>

      {filters.showTrashed && (
          <div className="mb-4">
              <button className="btn btn-sm btn-outline-danger w-100" onClick={() => {
                  if (window.confirm("Permanently empty all items in trash?")) {
                      emptyTrash();
                  }
              }}>Empty Trash 🔥</button>
          </div>
      )}

      <h6 className="text-uppercase text-muted small fw-bold mb-3">Content Type</h6>
      <div className="list-group list-group-flush mb-4">
        {['all', 'note', 'link', 'code'].map(type => (
          <button
            key={type}
            className={`list-group-item list-group-item-action border-0 px-2 py-1 rounded-2 mb-1 ${filters.type === type ? 'active bg-primary' : ''}`}
            onClick={() => setFilters({ type })}
          >
            <span className="text-capitalize">{type}s</span>
          </button>
        ))}
      </div>

      <h6 className="text-uppercase text-muted small fw-bold mb-3">Tags</h6>
      <div className="d-flex flex-wrap gap-2">
        <button
          className={`btn btn-sm rounded-pill ${!filters.tag ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setFilters({ tag: null })}
        >
          All Tags
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`btn btn-sm rounded-pill ${filters.tag === tag ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilters({ tag })}
          >
            #{tag}
          </button>
        ))}
        {allTags.length === 0 && <p className="text-muted small italic">No tags yet.</p>}
      </div>
    </div>
  );
};

export default Sidebar;
