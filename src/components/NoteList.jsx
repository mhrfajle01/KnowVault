import React from 'react';
import { useVault } from '../context/VaultContext';
import NoteCard from './NoteCard';

const NoteList = ({ onEdit }) => {
  const { state, filteredItems } = useVault();
  const { loading, error, filters } = state;

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  
  if (filteredItems.length === 0) {
    return (
      <div className="card text-center text-muted mt-5 py-5 shadow-sm border-0">
        <div className="card-body">
            <div className="display-6 mb-3">📭</div>
            <h5>No items found</h5>
            <p className="small">Try adjusting your search or filters.</p>
            {(filters.search || filters.tag || filters.type !== 'all') && (
              <button className="btn btn-link btn-sm mt-2" onClick={() => window.location.reload()}>
                Clear all filters
              </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      {filteredItems.map(item => (
        <div key={item.id} className="col-12 mb-3">
          <NoteCard item={item} onEdit={onEdit} />
        </div>
      ))}
    </div>
  );
};

export default NoteList;
