import React from 'react';
import './Breadcrumb.css';

function Breadcrumb({ path, onNavigate, onBack }) {
  const isInGem = path.length > 1;
  
  return (
    <nav className={`breadcrumb ${isInGem ? 'breadcrumb-prominent' : ''}`}>
      {isInGem && (
        <button 
          className="back-button"
          onClick={() => onBack ? onBack() : onNavigate(path.length - 2)}
          title="Go back one level"
        >
          ← Back
        </button>
      )}
      {path.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="breadcrumb-separator"> › </span>}
          <button 
            className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
            onClick={() => onNavigate(index)}
          >
            {item}
          </button>
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;