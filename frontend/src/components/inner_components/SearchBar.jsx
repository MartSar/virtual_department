import '../../styles/SearchBar.css';
import React from 'react';

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
