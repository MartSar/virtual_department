import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';

function AuthorDashboard({ name, lastname, userId, role }) {
    const [publications, setPublications] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // 🔍 Поисковая строка
    const navigate = useNavigate();

    const fetchPublications = async () => {
        const res = await fetch('http://localhost:3000/publications');
        const data = await res.json();
        setPublications(data);
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    const handleAdd = async () => {
        const title = prompt('Enter the title of the publication:');
        if (!title) return;
        await fetch('http://localhost:3000/add-publication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author_id: userId }),
        });
        fetchPublications();
    };

    const handleEdit = async (id) => {
        const newTitle = prompt('Enter a new publication name:');
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

    const handleLogout = () => {
        navigate('/');
    };

    // 🔍 Фильтруем публикации по названию или автору
    const filteredPublications = publications.filter(pub =>
        pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pub.author_name && pub.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <button className="profile-btn" onClick={() => alert('Tu môže byť osobný kabinet')}>
                    Go to personal account
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <h2>Your publications</h2>

            {/* 🔍 Поисковик */}
            <input
                type="text"
                placeholder="Search for a publication by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
            />

            <ul className="publications-list">
                {filteredPublications.length > 0 ? (
                    filteredPublications.map(pub => (
                        <li key={pub.id} className="publication-item">
                            <span>{pub.title}</span>
                            <div>
                                <button onClick={() => handleEdit(pub.id)}>Edit</button>
                                <button onClick={() => handleDelete(pub.id)}>Delete</button>
                            </div>
                        </li>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#777' }}>No publications were found</p>
                )}
            </ul>

            <button className="add-publication-btn" onClick={handleAdd}>
                Add publication
            </button>
        </div>
    );
}

export default AuthorDashboard;
