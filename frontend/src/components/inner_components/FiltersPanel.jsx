import React from "react";
import "../../styles/FiltersPanel.css";

const SelectFilter = ({ label, name, value, onChange, options }) => (
    <div className="filter-item">
        <label>{label}</label>
        <select name={name} value={value} onChange={onChange}>
            <option value="">{`All ${label.toLowerCase()}`}</option>
            {options?.map((opt) => (
                <option key={opt.id} value={opt.id}>
                    {opt.name}
                </option>
            ))}
        </select>
    </div>
);

const FiltersPanel = ({ filters, setFilters, options }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFilters((prev) => {
            if (name === "topic") {
                return {
                    ...prev,
                    topic: value,
                    subtopic: "",
                };
            }

            return {
                ...prev,
                [name]: value,
            };
        });
    };

    const filteredSubtopics = filters.topic
        ? (options.subtopics || []).filter(
            (subtopic) => String(subtopic.topic_id) === String(filters.topic)
        )
        : [];

    return (
        <div className="filters-panel">
            <h3>Filters</h3>

            <SelectFilter
                label="Topic"
                name="topic"
                value={filters.topic}
                onChange={handleChange}
                options={options.topics || []}
            />

            {filters.topic && (
                <SelectFilter
                    label="Subtopics"
                    name="subtopic"
                    value={filters.subtopic || ""}
                    onChange={handleChange}
                    options={filteredSubtopics}
                />
            )}

            <SelectFilter
                label="Country"
                name="country"
                value={filters.country}
                onChange={handleChange}
                options={options.countries || []}
            />

            <SelectFilter
                label="City"
                name="city"
                value={filters.city}
                onChange={handleChange}
                options={options.cities || []}
            />

            <SelectFilter
                label="University"
                name="university"
                value={filters.university}
                onChange={handleChange}
                options={options.universities || []}
            />

            <SelectFilter
                label="Faculty"
                name="faculty"
                value={filters.faculty}
                onChange={handleChange}
                options={options.faculties || []}
            />
        </div>
    );
};

export default FiltersPanel;