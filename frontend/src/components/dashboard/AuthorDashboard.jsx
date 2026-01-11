import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import FiltersPanel from "../inner_components/FiltersPanel";
import SearchBar from "../inner_components/SearchBar";
import PublicationModal from "./PublicationModal";

function AuthorDashboard({ author }) {
    const [publications, setPublications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        topic: '',
        country: '',
        city: '',
        university: '',
        faculty: ''
    });

    const [filterOptions, setFilterOptions] = useState({
        topics: [],
        countries: [],
        cities: [],
        universities: [],
        faculties: []
    });

    const [selectedPublication, setSelectedPublication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // -----------------------------
    // Fetch filter options
    // -----------------------------
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch('http://localhost:3000/filters');
                const data = await res.json();
                setFilterOptions(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchOptions();
    }, []);

    // -----------------------------
    // Fetch publications
    // -----------------------------
    const fetchPublications = async () => {
        try {
            const res = await fetch('http://localhost:3000/publications');
            const data = await res.json();
            setPublications(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    // -----------------------------
    // Filtered publications
    // -----------------------------
    const filteredPublications = publications.filter(pub => {
        const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = !filters.topic || pub.topic_id === Number(filters.topic);
        const matchesCountry = !filters.country || pub.country_id === Number(filters.country);
        const matchesCity = !filters.city || pub.city_id === Number(filters.city);
        const matchesUniversity = !filters.university || pub.university_id === Number(filters.university);
        const matchesFaculty = !filters.faculty || pub.faculty_id === Number(filters.faculty);

        return matchesSearch && matchesTopic && matchesCountry && matchesCity && matchesUniversity && matchesFaculty;
    });

    // -----------------------------
    // Open / Close modal
    // -----------------------------
    const openPublication = (pub) => {
        setSelectedPublication(pub);
        setIsModalOpen(true);
    };

    const closePublication = () => {
        setIsModalOpen(false);
        setSelectedPublication(null);
    };

    return (
        <div className="dashboard-layout">
            <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                options={filterOptions}
            />

            <div className="dashboard-container centered">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                <h2>Publications</h2>
                {filteredPublications.length === 0 ? (
                    <p>No publications found.</p>
                ) : (
                    <ul className="publications-list">
                        {filteredPublications.map(pub => (
                            <li
                                key={pub.id}
                                className="publication-item clickable"
                                onClick={() => openPublication(pub)}
                            >
                                <strong>{pub.title}</strong>
                                {pub.topic_name && (
                                    <span className="publication-topic"> — {pub.topic_name}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {isModalOpen && selectedPublication && (
                <PublicationModal
                    publication={selectedPublication}
                    onClose={closePublication}
                    student={null}
                    user={author}
                />
            )}
        </div>
    );
}

export default AuthorDashboard;
