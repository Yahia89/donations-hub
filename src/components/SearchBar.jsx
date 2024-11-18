import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onClearResults, loading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSearchClick = () => {
    if (inputValue.trim() !== '') {
      onSearch(inputValue);
    }
  };

  const handleClearClick = () => {
    setInputValue('');
    if (onClearResults) {
      onClearResults(); // Notify the parent component to clear search results
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      onSearch(inputValue);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Search..."
        />
        <div className="button-group">
          {inputValue ? (
            <button
              className="clear-button"
              onClick={handleClearClick}
              title="Clear"
            >
              Clear
            </button>
          ) : null}
          <button
            className="search-button"
            onClick={handleSearchClick}
            title="Search"
          >
            Search
          </button>
        </div>
      </div>
      {loading && <div className="loading-spinner">Searching...</div>}
    </div>
  );
};

export default SearchBar;
