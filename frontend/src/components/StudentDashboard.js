import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';

function StudentDashboard({ name, lastname, userId }) {
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
            <div className="filters-panel">
                <h3>Filters</h3>
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

            <div className="dashboard-container centered">
                <h1>Welcome, student {name} {lastname}!</h1>

                {/* Поисковая строка */}
                <input
                    type="text"
                    placeholder="Search publications..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

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
