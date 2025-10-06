import React, { useState } from 'react';
import './InfoPanel.css';

function InfoPanel({ node, data }) {
  const [expandedModules, setExpandedModules] = useState(false);
  const [methodSearch, setMethodSearch] = useState('');

  if (!node) return null;

  // Handle class node type - show methods
  if (node.type === 'class') {
    const instanceMethods = node.methods || [];
    const classMethods = node.class_methods || [];

    const filteredInstanceMethods = methodSearch
      ? instanceMethods.filter(m => m.toLowerCase().includes(methodSearch.toLowerCase()))
      : instanceMethods;

    const filteredClassMethods = methodSearch
      ? classMethods.filter(m => m.toLowerCase().includes(methodSearch.toLowerCase()))
      : classMethods;

    return (
      <div className="info-panel">
        <div className="info-header">
          <h2>{node.name}</h2>
          <span className="info-type badge-class">Class</span>
        </div>

        <p className="info-description">{node.description}</p>

        {node.superclass && (
          <div className="info-section">
            <h3>Inheritance</h3>
            <div className="inheritance-info">
              <span className="superclass-label">Inherits from:</span>
              <span className="superclass-name">{node.superclass}</span>
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>Statistics</h3>
          <div className="info-stats">
            <div className="stat">
              <span className="stat-label">Instance Methods:</span>
              <span className="stat-value">{instanceMethods.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Class Methods:</span>
              <span className="stat-value">{classMethods.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Lines of Code:</span>
              <span className="stat-value">{node.loc?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </div>

        {(instanceMethods.length > 0 || classMethods.length > 0) && (
          <div className="info-section">
            <h3>Methods</h3>
            <input
              type="text"
              className="method-search"
              placeholder="Search methods..."
              value={methodSearch}
              onChange={(e) => setMethodSearch(e.target.value)}
            />
          </div>
        )}

        {filteredInstanceMethods.length > 0 && (
          <div className="info-section method-section">
            <h4>Instance Methods ({filteredInstanceMethods.length})</h4>
            <div className="method-list">
              {filteredInstanceMethods.map((method, index) => (
                <div key={index} className="method-item">
                  <code>#{method}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredClassMethods.length > 0 && (
          <div className="info-section method-section">
            <h4>Class Methods ({filteredClassMethods.length})</h4>
            <div className="method-list">
              {filteredClassMethods.map((method, index) => (
                <div key={index} className="method-item">
                  <code>.{method}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {node.included_modules && node.included_modules.length > 0 && (
          <div className="info-section">
            <h3>Included Modules</h3>
            <ul className="module-list">
              {node.included_modules.map((mod, index) => (
                <li key={index} className="module-item">{mod}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Handle module node type - show module methods and info
  if (node.type === 'module' && node.moduleDetails) {
    const details = node.moduleDetails;
    const instanceMethods = details.methods || [];
    const classMethods = details.class_methods || [];
    const components = details.components || [];

    const filteredInstanceMethods = methodSearch
      ? instanceMethods.filter(m => m.toLowerCase().includes(methodSearch.toLowerCase()))
      : instanceMethods;

    const filteredClassMethods = methodSearch
      ? classMethods.filter(m => m.toLowerCase().includes(methodSearch.toLowerCase()))
      : classMethods;

    return (
      <div className="info-panel">
        <div className="info-header">
          <h2>{node.name}</h2>
          <span className="info-type badge-module">Module</span>
        </div>

        <p className="info-description">{details.description}</p>

        <div className="info-section">
          <h3>Statistics</h3>
          <div className="info-stats">
            <div className="stat">
              <span className="stat-label">Instance Methods:</span>
              <span className="stat-value">{instanceMethods.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Class Methods:</span>
              <span className="stat-value">{classMethods.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Components:</span>
              <span className="stat-value">{components.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Lines of Code:</span>
              <span className="stat-value">{details.loc?.toLocaleString() || 'N/A'}</span>
            </div>
          </div>
        </div>

        {components.length > 0 && (
          <div className="info-section">
            <h3>Included/Extended Modules</h3>
            <ul className="module-list">
              {components.map((comp, index) => (
                <li key={index} className="module-item">{comp}</li>
              ))}
            </ul>
          </div>
        )}

        {(instanceMethods.length > 0 || classMethods.length > 0) && (
          <div className="info-section">
            <h3>Methods</h3>
            <input
              type="text"
              className="method-search"
              placeholder="Search methods..."
              value={methodSearch}
              onChange={(e) => setMethodSearch(e.target.value)}
            />
          </div>
        )}

        {filteredInstanceMethods.length > 0 && (
          <div className="info-section method-section">
            <h4>Instance Methods ({filteredInstanceMethods.length})</h4>
            <div className="method-list">
              {filteredInstanceMethods.map((method, index) => (
                <div key={index} className="method-item">
                  <code>#{method}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredClassMethods.length > 0 && (
          <div className="info-section method-section">
            <h4>Class Methods ({filteredClassMethods.length})</h4>
            <div className="method-list">
              {filteredClassMethods.map((method, index) => (
                <div key={index} className="method-item">
                  <code>.{method}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

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