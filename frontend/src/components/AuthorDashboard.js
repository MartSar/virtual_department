import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';

function AuthorDashboard({ name, lastname, userId, role }) {
    const [publications, setPublications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleAdd = async () => {
        const title = prompt('Enter the publication title:');
        if (!title) return;
        await fetch('http://localhost:3000/add-publication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author_id: userId }),
        });
        fetchPublications();
    };

    const handleEdit = async (id) => {
        const newTitle = prompt('Enter new publication title:');
        if (!newTitle) return;
        await fetch(`http://localhost:3000/edit-publication/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
        });
        fetchPublications();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this publication?')) {
            await fetch(`http://localhost:3000/delete-publication/${id}`, { method: 'DELETE' });
            fetchPublications();
        }
    };

    // Фильтрация по поисковику
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
                <h1>Welcome, {role} {name} {lastname}!</h1>

                {/* Поисковая строка */}
                <input
                    type="text"
                    placeholder="Search publications..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <h2>Your publications</h2>
                <ul className="publications-list">
                    {filteredPublications.map(pub => (
                        <li key={pub.id} className="publication-item">
                            <span>{pub.title}</span>
                            <div>
                                <button onClick={() => handleEdit(pub.id)}>Edit</button>
                                <button onClick={() => handleDelete(pub.id)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <button className="add-publication-btn" onClick={handleAdd}>
                    Add publication
                </button>
            </div>
        </div>
    );
}

export default AuthorDashboard;
