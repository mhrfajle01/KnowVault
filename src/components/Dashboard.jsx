import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useVault } from '../context/VaultContext';
import { useAI } from '../context/AIContext';
import { skeleton } from '../utils/animations';

const Dashboard = ({ onViewChange }) => {
  const { state, allTags, setFilters, triggerScroll } = useVault();
  const { playAiSound } = useAI();
  const { items, loading } = state;

  const stats = useMemo(() => {
    if (loading) return null;
    const typeCount = { note: 0, link: 0, code: 0 };
    items.forEach(item => {
      if (typeCount[item.type] !== undefined) typeCount[item.type]++;
    });

    // Tag usage
    const tagUsage = {};
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagUsage[tag] = (tagUsage[tag] || 0) + 1;
      });
    });
    
    // Sort tags by frequency
    const topTags = Object.entries(tagUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Recent activity
    const recent = [...items]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    // AI Insights
    const untagged = items.filter(i => i.tags.length === 0).length;
    const insights = [];
    if (untagged > items.length / 2) insights.push("Try adding more tags to your notes for better organization.");
    if (typeCount.link > typeCount.note) insights.push("You're saving a lot of links! Maybe write some notes about them?");
    if (items.length > 20 && topTags.length < 3) insights.push("Consider diversifying your tags to group related ideas.");
    if (insights.length === 0) insights.push("Your vault is looking well-organized! Keep it up.");

    return { typeCount, topTags, recent, insights, tagUsage };
  }, [items]);

  const navigateToVault = (filters) => {
    playAiSound('info');
    setFilters({ ...filters, showArchived: false, showTrashed: false });
    onViewChange('vault');
    triggerScroll('top');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="container pb-5">
        <motion.h3 variants={skeleton} initial="initial" animate="animate" className="mb-4 bg-secondary opacity-25 rounded" style={{ height: '32px', width: '200px' }}></motion.h3>
        <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
                <motion.div variants={skeleton} initial="initial" animate="animate" className="card border-0 shadow-sm" style={{ height: '160px', background: 'var(--bs-tertiary-bg)' }}></motion.div>
            </div>
            <div className="col-12 col-md-8">
                <motion.div variants={skeleton} initial="initial" animate="animate" className="card border-0 shadow-sm" style={{ height: '160px', background: 'var(--bs-tertiary-bg)' }}></motion.div>
            </div>
        </div>
        <motion.div variants={skeleton} initial="initial" animate="animate" className="card border-0 shadow-sm mb-4" style={{ height: '120px', background: 'var(--bs-tertiary-bg)' }}></motion.div>
        <div className="row g-4">
            <div className="col-12 col-md-6">
                <motion.div variants={skeleton} initial="initial" animate="animate" className="card border-0 shadow-sm" style={{ height: '300px', background: 'var(--bs-tertiary-bg)' }}></motion.div>
            </div>
            <div className="col-12 col-md-6">
                <motion.div variants={skeleton} initial="initial" animate="animate" className="card border-0 shadow-sm" style={{ height: '300px', background: 'var(--bs-tertiary-bg)' }}></motion.div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="container pb-5"
    >
      <motion.h3 variants={itemVariants} className="mb-4 d-flex align-items-center gap-2 fw-bold text-gradient">
        <span>📊</span> Dashboard
      </motion.h3>
      
      <div className="row g-4 mb-4">
        {/* Total Items Card */}
        <motion.div variants={itemVariants} className="col-12 col-md-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card h-100 shadow-sm border-0 bg-gradient-primary text-white cursor-pointer"
            onClick={() => navigateToVault({ type: 'all', tag: null, search: '' })}
          >
            <div className="card-body text-center d-flex flex-column justify-content-center p-4">
              <motion.h1 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="display-4 display-md-3 fw-bold mb-0 drop-shadow"
              >
                {items.length}
              </motion.h1>
              <p className="lead fw-bold opacity-75">Total Items</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Distribution Card */}
        <motion.div variants={itemVariants} className="col-12 col-md-8">
           <div className="card h-100 shadow-sm border-0">
             <div className="card-header fw-bold text-white border-0 py-3" style={{ background: 'linear-gradient(45deg, #a18cd1 0%, #fbc2eb 100%)' }}>
                Distribution by Type
             </div>
             <div className="card-body p-4">
                <div className="row g-3 text-center align-items-center h-100">
                    <div className="col-4 col-md-4">
                        <motion.div 
                            whileHover={{ scale: 1.1, backgroundColor: 'var(--bs-tertiary-bg)' }} 
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded transition-all cursor-pointer"
                            onClick={() => navigateToVault({ type: 'note' })}
                        >
                            <h2 className="mb-1 fw-bold">📝 {stats.typeCount.note}</h2>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Notes</small>
                        </motion.div>
                    </div>
                    <div className="col-4 col-md-4 border-start border-end border-secondary-subtle">
                         <motion.div 
                            whileHover={{ scale: 1.1, backgroundColor: 'var(--bs-tertiary-bg)' }} 
                            whileTap={{ scale: 0.95 }}
                            className="p-2 transition-all cursor-pointer"
                            onClick={() => navigateToVault({ type: 'link' })}
                         >
                            <h2 className="mb-1 fw-bold">🔗 {stats.typeCount.link}</h2>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Links</small>
                         </motion.div>
                    </div>
                    <div className="col-4 col-md-4">
                         <motion.div 
                            whileHover={{ scale: 1.1, backgroundColor: 'var(--bs-tertiary-bg)' }} 
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded transition-all cursor-pointer"
                            onClick={() => navigateToVault({ type: 'code' })}
                         >
                            <h2 className="mb-1 fw-bold">💻 {stats.typeCount.code}</h2>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Snippets</small>
                         </motion.div>
                    </div>
                </div>
             </div>
           </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div variants={itemVariants} className="card mb-4 shadow-sm border-0 overflow-hidden">
        <div className="card-header fw-bold text-white border-0 py-3" style={{ background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)' }}>
            ✨ AI Insights
        </div>
        <div className="card-body bg-body-tertiary">
            {stats.insights.map((insight, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="d-flex align-items-start align-items-sm-center gap-3 p-3 mb-2 bg-body rounded shadow-sm border-start border-4 border-info"
                >
                    <span className="fs-4 flex-shrink-0">💡</span>
                    <span className="fst-italic small-md">{insight}</span>
                </motion.div>
            ))}
        </div>
      </motion.div>

      <div className="row g-4">
        {/* Top Tags */}
        <motion.div variants={itemVariants} className="col-12 col-md-6">
           <div className="card h-100 shadow-sm border-0">
             <div className="card-header fw-bold text-white border-0 py-3" style={{ background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' }}>
                Top Tags
             </div>
             <div className="card-body">
                <div className="d-flex flex-wrap gap-2 mb-4 p-2 bg-body-tertiary rounded">
                    {Object.entries(stats.tagUsage).map(([tag, count], i) => (
                        <motion.span 
                            key={tag} 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.8 + (i * 0.05) }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="badge bg-body text-body rounded-pill border shadow-sm cursor-pointer"
                            style={{ fontSize: `${Math.min(0.8 + (count * 0.1), 1.2)}rem`, padding: '0.5em 0.8em' }}
                            onClick={() => navigateToVault({ tag: tag })}
                        >
                            #{tag} <span className="opacity-50 ms-1">({count})</span>
                        </motion.span>
                    ))}
                    {allTags.length === 0 && <p className="text-muted small m-0 p-2">No tags used yet. Add tags to organize your vault!</p>}
                </div>
                
                {stats.topTags.length > 0 && (
                    <>
                        <h6 className="text-muted text-uppercase text-xs fw-bold mb-3">Most Used</h6>
                        <ul className="list-group list-group-flush">
                            {stats.topTags.map(([tag, count], idx) => (
                                <motion.li 
                                  key={tag} 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 1 + (idx * 0.1) }}
                                  whileHover={{ backgroundColor: 'var(--bs-tertiary-bg)', paddingLeft: '8px' }}
                                  className="list-group-item d-flex justify-content-between align-items-center px-0 border-bottom-dashed cursor-pointer rounded-2"
                                  onClick={() => navigateToVault({ tag: tag })}
                                >
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary rounded-circle" style={{width: '24px', height: '24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '0.8rem'}}>{idx + 1}</span>
                                    <span className="fw-medium text-truncate" style={{ maxWidth: '150px' }}>#{tag}</span>
                                </div>
                                <span className="badge bg-secondary-subtle text-body border rounded-pill">{count}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </>
                )}
             </div>
           </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="col-12 col-md-6">
           <div className="card h-100 shadow-sm border-0">
             <div className="card-header fw-bold text-white border-0 py-3" style={{ background: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)' }}>
                Recently Updated
             </div>
             <div className="list-group list-group-flush">
                {stats.recent.map((item, i) => (
                    <motion.div 
                      key={item.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + (i * 0.1) }}
                      whileHover={{ backgroundColor: 'var(--bs-tertiary-bg)', scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 border-bottom-dashed px-2 px-sm-3 cursor-pointer"
                      onClick={() => navigateToVault({ search: `"${item.title}"` })}
                    >
                        <div className="d-flex align-items-center gap-2 gap-sm-3 overflow-hidden" style={{ minWidth: 0 }}>
                            <span className="fs-5 flex-shrink-0">{item.type === 'link' ? '🔗' : (item.type === 'code' ? '💻' : '📝')}</span>
                            <div className="d-flex flex-column text-truncate" style={{ minWidth: 0 }}>
                                <h6 className="mb-0 text-truncate fw-bold">{item.title}</h6>
                                <small className="text-muted text-truncate d-block">
                                    {item.tags.length > 0 ? item.tags.map(t => `#${t}`).join(' ') : 'No tags'}
                                </small>
                            </div>
                        </div>
                        <small className="text-muted text-nowrap ms-2 bg-body-tertiary px-2 py-1 rounded flex-shrink-0" style={{ fontSize: '0.75rem' }}>
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </small>
                    </motion.div>
                ))}
                {stats.recent.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        No items yet. Start creating!
                    </div>
                )}
             </div>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;