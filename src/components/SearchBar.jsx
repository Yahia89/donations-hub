import React from 'react';
import './SearchBar.css';

const SearchBar = ({ searchTerm, setSearchTerm, onSearch, onClearResults, loading }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchTerm.trim() !== '') {
      onSearch();
    }
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Search..."
        />
        <div className="button-group">
          {searchTerm && (
            <button
              className="clear-button"
              onClick={onClearResults}
              title="Clear"
            >
              Clear
            </button>
          )}
          <button
            className="search-button"
            onClick={onSearch}
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
