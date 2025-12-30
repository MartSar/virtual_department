const FiltersPanel = ({ filters, setFilters, options }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="filters-panel">
            <h3>Filters</h3>

            <label>Topic</label>
            <select name="topic" value={filters.topic} onChange={handleChange}>
                <option value="">All topics</option>
                {options.topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                        {topic.name}
                    </option>
                ))}
            </select>

            <label>Country</label>
            <select name="country" value={filters.country} onChange={handleChange}>
                <option value="">All countries</option>
                {options.countries.map(country => (
                    <option key={country.id} value={country.id}>
                        {country.name}
                    </option>
                ))}
            </select>

            <label>City</label>
            <select name="city" value={filters.city} onChange={handleChange}>
                <option value="">All cities</option>
                {options.cities.map(city => (
                    <option key={city.id} value={city.id}>
                        {city.name}
                    </option>
                ))}
            </select>

            <label>University</label>
            <select name="university" value={filters.university} onChange={handleChange}>
                <option value="">All universities</option>
                {options.universities.map(university => (
                    <option key={university.id} value={university.id}>
                        {university.name}
                    </option>
                ))}
            </select>

            <label>Faculty</label>
            <select name="faculty" value={filters.faculty} onChange={handleChange}>
                <option value="">All faculties</option>
                {options.faculties.map(faculty => (
                    <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                    </option>
                ))}
            </select>


        </div>
    );
};

export default FiltersPanel;
