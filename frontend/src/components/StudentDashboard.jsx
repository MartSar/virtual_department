import '../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import FiltersPanel from "./inner_components/FiltersPanel";
import SearchBar from "./inner_components/SearchBar";
import PublicationModal from './PublicationModal';

function StudentDashboard({ name, lastname, userId, role }) {
    const [publications, setPublications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        topic: '',
        country: '',
        faculty: ''
    });
    const [selectedPublication, setSelectedPublication] = useState(null);

    useEffect(() => {
        fetch('http://localhost:3000/publications')
            .then(res => res.json())
            .then(data => setPublications(data))
            .catch(err => console.error(err));
    }, []);

    const handleBorrow = async (pubId) => {
        try {
            const res = await fetch('http://localhost:3000/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: userId, publication_id: pubId }),
            });
            const data = await res.json();
            if (data.success) {
                alert('The publication was borrowed successfully!');
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredPublications = publications.filter(pub => {
        const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = filters.topic === '' || pub.topic === filters.topic;
        const matchesCountry = filters.country === '' || pub.country === filters.country;
        const matchesFaculty = filters.faculty === '' || pub.faculty === filters.faculty;
        return matchesSearch && matchesTopic && matchesCountry && matchesFaculty;
    });

    return (
        <div className="dashboard-layout">
            <FiltersPanel filters={filters} setFilters={setFilters} />
            <div className="dashboard-container centered">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                <h2>Publications</h2>
                <ul className="publications-list">
                    {filteredPublications.map(pub => (
                        <li
                            key={pub.id}
                            className="publication-item"
                            onClick={() => setSelectedPublication(pub)}
                        >
                            <span>{pub.title}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleBorrow(pub.id); }}>
                                Borrow
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {selectedPublication && (
                <PublicationModal
                    publication={selectedPublication}
                    onClose={() => setSelectedPublication(null)}
                />
            )}
        </div>
    );
}

export default StudentDashboard;
