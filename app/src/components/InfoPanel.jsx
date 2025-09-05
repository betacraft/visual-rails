import React, { useState } from 'react';
import './InfoPanel.css';

function InfoPanel({ node, data }) {
  const [expandedModules, setExpandedModules] = useState(false);
  
  if (!node) return null;

  const dependencies = data.dependencies
    .filter(d => d.source === node.id)
    .map(d => data.gems.find(g => g.id === d.target));

  const dependents = data.dependencies
    .filter(d => d.target === node.id)
    .map(d => data.gems.find(g => g.id === d.source));

  return (
    <div className="info-panel">
      <div className="info-header">
        <h2>{node.name}</h2>
        <span className="info-type">{node.type}</span>
      </div>
      
      <p className="info-description">{node.description}</p>
      
      <div className="info-section">
        <h3>Statistics</h3>
        <div className="info-stats">
          <div className="stat">
            <span className="stat-label">Lines of Code:</span>
            <span className="stat-value">{node.loc?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Modules:</span>
            <span className="stat-value">{node.modules?.length || 0}</span>
          </div>
        </div>
      </div>

      {node.modules && node.modules.length > 0 && (
        <div className="info-section">
          <h3>Key Modules ({node.modules.length})</h3>
          <ul className="module-list">
            {(expandedModules ? node.modules : node.modules.slice(0, 3)).map((module, index) => (
              <li key={index} className="module-item">{module}</li>
            ))}
          </ul>
          {node.modules.length > 3 && (
            <button 
              className="show-more-btn"
              onClick={() => setExpandedModules(!expandedModules)}
            >
              {expandedModules 
                ? '▲ Show less' 
                : `▼ Show ${node.modules.length - 3} more...`}
            </button>
          )}
        </div>
      )}

      {dependencies.length > 0 && (
        <div className="info-section">
          <h3>Dependencies</h3>
          <div className="dependency-list">
            {dependencies.map(dep => (
              <div key={dep.id} className="dependency-item">
                <span className="dep-name">{dep.name}</span>
                <span className="dep-type">{dep.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dependents.length > 0 && (
        <div className="info-section">
          <h3>Used By</h3>
          <div className="dependency-list">
            {dependents.map(dep => (
              <div key={dep.id} className="dependency-item">
                <span className="dep-name">{dep.name}</span>
                <span className="dep-type">{dep.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-footer">
        <a 
          href={`https://github.com/rails/rails/tree/main/${node.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
}

export default InfoPanel;