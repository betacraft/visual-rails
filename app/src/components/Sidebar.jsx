import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ currentView, onNavigate, collapsed, onToggleCollapse }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      description: 'Dependency Graph',
      icon: '📊',
      action: 'overview'
    },
    {
      id: 'database-flow',
      label: 'Database Query Flow',
      description: 'ActiveRecord',
      icon: '🗄️',
      action: 'activerecord-flow'
    },
    {
      id: 'http-flow',
      label: 'HTTP Request Flow',
      description: 'Action Pack',
      icon: '🌐',
      action: 'request-flow'
    },
    {
      id: 'boot-process',
      label: 'Rails Boot Process',
      description: 'Railties',
      icon: '🚀',
      action: 'boot-process'
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="toggle-icon">☰</span>
      </button>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-title">Views</h3>
          <ul className="nav-list">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={`nav-item ${currentView === item.action ? 'active' : ''}`}
                  onClick={() => onNavigate(item.action)}
                  title={`${item.label} - ${item.description}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <div className="nav-text">
                      <span className="nav-label">{item.label}</span>
                      {item.description && (
                        <span className="nav-description">{item.description}</span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Sidebar;