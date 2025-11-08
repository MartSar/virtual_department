const FiltersPanel = ({ filters, setFilters }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="filters-panel">
            <h3>Filters:</h3>

            <label>Topic:</label>
            <select name="topic" value={filters.topic} onChange={handleChange}>
                <option value="">All topics</option>
                <option value="AI">AI</option>
                <option value="Data Science">Data Science</option>
                <option value="Networks">Networks</option>
            </select>

            <label>Country:</label>
            <select name="country" value={filters.country} onChange={handleChange}>
                <option value="">All countries</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Germany">Germany</option>
            </select>

            <label>Faculty:</label>
            <select name="faculty" value={filters.faculty} onChange={handleChange}>
                <option value="">All faculties</option>
                <option value="Informatics">Informatics</option>
                <option value="Engineering">Engineering</option>
                <option value="Mathematics">Mathematics</option>
            </select>
        </div>
    );
};

export default FiltersPanel