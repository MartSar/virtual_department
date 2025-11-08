// src/components/FiltersPanel.jsx
import React from 'react';
import '../../styles/FiltersPanel.css';

const FiltersPanel = () => {
    return (
        <div className="filters-panel">
            <h3>Filters:</h3>

            <label>Topic:</label>
            <select>
                <option value="">All topics</option>
                <option value="AI">AI</option>
                <option value="Data Science">Data Science</option>
                <option value="Networks">Networks</option>
            </select>

            <label>Country:</label>
            <select>
                <option value="">All countries</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Germany">Germany</option>
            </select>

            <label>Faculty:</label>
            <select>
                <option value="">All faculties</option>
                <option value="Informatics">Informatics</option>
                <option value="Engineering">Engineering</option>
                <option value="Mathematics">Mathematics</option>
            </select>
        </div>
    );
};

export default FiltersPanel;
