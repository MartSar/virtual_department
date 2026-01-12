import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import FiltersPanel from "../inner_components/FiltersPanel";
import SearchBar from "../inner_components/SearchBar";
import PublicationModal from './PublicationModal';

function StudentDashboard({ student }) {
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
            const pubs = await res.json();

            // Для каждой публикации достаем авторов и их местоположение
            const pubsWithLocations = await Promise.all(
                pubs.map(async pub => {
                    const res2 = await fetch(`http://localhost:3000/publications/${pub.id}/authors-location`);
                    const data = await res2.json(); // { authors: [...] }

                    // Агрегируем все факультеты, университеты, города и страны в публикации
                    const facultyIds = Array.from(new Set(data.authors.map(a => a.faculty?.faculty_id).filter(Boolean)));
                    const universityIds = Array.from(new Set(data.authors.map(a => a.university?.university_id).filter(Boolean)));
                    const cityIds = Array.from(new Set(data.authors.map(a => a.city?.city_id).filter(Boolean)));
                    const countryIds = Array.from(new Set(data.authors.map(a => a.country?.country_id).filter(Boolean)));

                    return {
                        ...pub,
                        faculty_ids: facultyIds,
                        university_ids: universityIds,
                        city_ids: cityIds,
                        country_ids: countryIds
                    };
                })
            );

            setPublications(pubsWithLocations);
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
        const matchesCountry = !filters.country || pub.country_ids.includes(Number(filters.country));
        const matchesCity = !filters.city || pub.city_ids.includes(Number(filters.city));
        const matchesUniversity = !filters.university || pub.university_ids.includes(Number(filters.university));
        const matchesFaculty = !filters.faculty || pub.faculty_ids.includes(Number(filters.faculty));

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
                    student={student}
                />
            )}
        </div>
    );
}

export default StudentDashboard;
