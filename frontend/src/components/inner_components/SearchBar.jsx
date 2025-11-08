// src/components/SearchBar.jsx
import React from 'react';
import '../../styles/SearchBar.css';

const SearchBar = ({ searchQuery, setSearchQuery, placeholder = "Search publications..." }) => {
    return (
        <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
    );
};

export default SearchBar;
