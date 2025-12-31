import React, { useMemo } from 'react';
import { useVault } from '../context/VaultContext';

const Dashboard = () => {
  const { state, allTags } = useVault();
  const { items } = state;

  const stats = useMemo(() => {
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
    if (stats.typeCount.link > stats.typeCount.note) insights.push("You're saving a lot of links! Maybe write some notes about them?");
    if (items.length > 20 && stats.topTags.length < 3) insights.push("Consider diversifying your tags to group related ideas.");
    if (insights.length === 0) insights.push("Your vault is looking well-organized! Keep it up.");

    return { typeCount, topTags, recent, insights, tagUsage };
  }, [items]);

  return (
    <div className="container pb-5">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        <span>📊</span> Dashboard
      </h3>
      
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100 shadow-sm border-primary border-start border-4">
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <h1 className="display-4 fw-bold text-primary mb-0">{items.length}</h1>
              <p className="text-muted fw-bold">Total Items</p>
            </div>
          </div>
        </div>
        <div className="col-md-8">
           <div className="card h-100 shadow-sm">
             <div className="card-header fw-bold bg-body-tertiary">Distribution by Type</div>
             <div className="card-body d-flex justify-content-around align-items-center">
                <div className="text-center">
                   <h3 className="mb-0">📝 {stats.typeCount.note}</h3>
                   <small className="text-muted">Notes</small>
                </div>
                <div className="text-center border-start border-end px-4">
                   <h3 className="mb-0">🔗 {stats.typeCount.link}</h3>
                   <small className="text-muted">Links</small>
                </div>
                <div className="text-center">
                   <h3 className="mb-0">💻 {stats.typeCount.code}</h3>
                   <small className="text-muted">Snippets</small>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="card mb-4 shadow-sm">
        <div className="card-header fw-bold bg-body-tertiary">✨ AI Insights</div>
        <div className="card-body">
            {stats.insights.map((insight, i) => (
                <div key={i} className="d-flex align-items-center gap-2 text-primary mb-2">
                    <span className="fs-4">💡</span>
                    <span className="fst-italic">{insight}</span>
                </div>
            ))}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
           <div className="card h-100 shadow-sm">
             <div className="card-header fw-bold bg-body-tertiary">Top Tags</div>
             <div className="card-body">
                <div className="d-flex flex-wrap gap-2 mb-3">
                    {Object.entries(stats.tagUsage).map(([tag, count]) => (
                        <span 
                            key={tag} 
                            className="badge bg-primary-subtle text-primary rounded-pill border border-primary-subtle"
                            style={{ fontSize: `${0.8 + (count * 0.1)}rem` }}
                        >
                            #{tag}
                        </span>
                    ))}
                    {allTags.length === 0 && <p className="text-muted small">No tags used yet.</p>}
                </div>
                <ul className="list-group list-group-flush border-top">
                    {stats.topTags.map(([tag, count]) => (
                        <li key={tag} className="list-group-item d-flex justify-content-between align-items-center px-0">
                           <span>#{tag}</span>
                           <span className="badge bg-secondary rounded-pill">{count}</span>
                        </li>
                    ))}
                </ul>
             </div>
           </div>
        </div>
        <div className="col-md-6">
           <div className="card h-100 shadow-sm">
             <div className="card-header fw-bold bg-body-tertiary">Recently Updated</div>
             <div className="list-group list-group-flush">
                {stats.recent.map(item => (
                    <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-truncate" style={{maxWidth: '70%'}}>{item.title}</h6>
                        <small className="text-muted">{new Date(item.updatedAt).toLocaleDateString()}</small>
                    </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
