import React, { useState, useEffect } from 'react';
import './SearchBar.css';

function SearchBar({ value, onChange, onSelect, data }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value.length > 1) {
      const filtered = data.gems.filter(gem =>
        gem.name.toLowerCase().includes(value.toLowerCase()) ||
        gem.description.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, data]);

  const handleSelect = (gem) => {
    onSelect(gem);
    onChange('');
    setShowSuggestions(false);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search Rails components..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length > 1 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="search-input"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map(gem => (
            <button
              key={gem.id}
              className="suggestion-item"
              onClick={() => handleSelect(gem)}
            >
              <span className="suggestion-name">{gem.name}</span>
              <span className="suggestion-type">{gem.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;