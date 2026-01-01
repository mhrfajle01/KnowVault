import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from '../context/VaultContext';
import NoteCard from './NoteCard';
import { containerVariants, itemVariants, skeleton } from '../utils/animations';

const NoteList = ({ onEdit }) => {
  const { state, filteredItems } = useVault();
  const { loading, error, filters, scrollTrigger } = state;

  const performScroll = (type = 'match') => {
    if (type === 'top') {
        const listContainer = document.querySelector('.note-list-container');
        if (listContainer) {
            listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    if (filters.search && filteredItems.length > 0) {
      setTimeout(() => {
        const firstMatch = document.querySelector('.row mark');
        if (firstMatch) {
          const card = firstMatch.closest('.card');
          if (card) {
            card.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            card.classList.add('ring-primary');
            setTimeout(() => {
              card.classList.remove('ring-primary');
            }, 2000);
          } else {
            firstMatch.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
          }
        }
      }, 100);
    }
  };

  // Auto-scroll when search query changes
  useEffect(() => {
    if (filters.search) {
      performScroll('match');
    }
  }, [filters.search]);

  // Explicit scroll trigger
  useEffect(() => {
    if (scrollTrigger.timestamp > 0) {
      performScroll(scrollTrigger.type);
    }
  }, [scrollTrigger]);

  if (loading) {
    return (
      <div className="row">
        {[1, 2, 3].map(i => (
          <div key={i} className="col-12 mb-3">
            <motion.div 
              variants={skeleton}
              initial="initial"
              animate="animate"
              className="card shadow-sm border-0"
              style={{ height: '150px', background: 'var(--bs-tertiary-bg)' }}
            >
              <div className="card-body">
                 <div className="bg-secondary opacity-25 rounded w-50 mb-3" style={{ height: '20px' }}></div>
                 <div className="bg-secondary opacity-25 rounded w-100 mb-2" style={{ height: '15px' }}></div>
                 <div className="bg-secondary opacity-25 rounded w-75" style={{ height: '15px' }}></div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  
  if (filteredItems.length === 0) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center text-muted mt-5 py-5 shadow-sm border-0"
        >
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
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div 
      className="row note-list-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {filteredItems.map(item => (
          <motion.div 
            key={item.id} 
            layout
            variants={itemVariants}
            exit={{ opacity: 0, scale: 0.95 }}
            className="col-12 mb-3"
          >
            <NoteCard item={item} onEdit={onEdit} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default NoteList;

