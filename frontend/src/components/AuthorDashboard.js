import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';

function AuthorDashboard({ name, lastname, userId, role }) {
    const [publications, setPublications] = useState([]);

    const fetchPublications = async () => {
        const res = await fetch('http://localhost:3000/publications');
        const data = await res.json();
        setPublications(data);
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    const handleAdd = async () => {
        const title = prompt('Write publication Title:');
        if (!title) return;
        await fetch('http://localhost:3000/add-publication', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author_id: userId }),
        });
        fetchPublications();
    };

    const handleEdit = async (id) => {
        const newTitle = prompt('Write new title for publication:');
        if (!newTitle) return;
        await fetch(`http://localhost:3000/edit-publication/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
        });
        fetchPublications();
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Are you sure u want delete publication (pub_name)`)) {
            await fetch(`http://localhost:3000/delete-publication/${id}`, { method: 'DELETE' });
            fetchPublications();
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Welcome, {role} {name} {lastname}!</h1>
            <h2>Your Publications</h2>
            <ul className="publications-list">
                {publications.map(pub => (
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
                Add Publication
            </button>
        </div>
    );
}

export default AuthorDashboard;
