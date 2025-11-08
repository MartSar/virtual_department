import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import FiltersPanel from "./inner_components/FiltersPanel";
import SearchBar from "./inner_components/SearchBar";

function StudentDashboard({ name, lastname, userId, role }) {
    const [publications, setPublications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Фильтрация по названию
    const filteredPublications = publications.filter(pub =>
        pub.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="dashboard-layout">
            <FiltersPanel />
            <div className="dashboard-container centered">
                <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                <h2>Publications</h2>
                <ul className="publications-list">
                    {filteredPublications.map(pub => (
                        <li key={pub.id} className="publication-item">
                            <span>{pub.title}</span>
                            <button onClick={() => handleBorrow(pub.id)}>Borrow</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default StudentDashboard;
