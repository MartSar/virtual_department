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
    const [selectedPublication, setSelectedPublication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3000/publications')
            .then(res => res.json())
            .then(data => setPublications(data))
            .catch(err => console.error(err));
    }, []);

    const [filterOptions, setFilterOptions] = useState({
        topics: [],
        countries: [],
        cities: [],
        universities: [],
        faculties: []
    });

    useEffect(() => {
        fetch('http://localhost:3000/filters')
            .then(res => res.json())
            .then(data => setFilterOptions(data))
            .catch(err => console.error(err));
    }, []);


    const handleBorrow = async (publication_id) => {
        try {
            const res = await fetch('http://localhost:3000/api/borrowings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: student.id, publication_id: publication_id }),
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
        const matchesCity = filters.city === '' || pub.city === filters.city;
        const matchesUniversity = filters.university === '' || pub.university === filters.city;
        const matchesFaculty = filters.faculty === '' || pub.faculty === filters.faculty;

        return matchesSearch && matchesTopic && matchesCountry && matchesCity && matchesUniversity && matchesFaculty;
    });

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
                <ul className="publications-list">
                    {filteredPublications.map(pub => (
                        <li
                            key={pub.id}
                            className="publication-item clickable"
                            onClick={() => openPublication(pub)}
                        >
                            <span>{pub.title}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {isModalOpen && (
                <PublicationModal
                    publication={selectedPublication}
                    onClose={closePublication}
                    student={student}
                    onBorrowed={handleBorrow}
                />
            )}
        </div>
    );
}

export default StudentDashboard;
