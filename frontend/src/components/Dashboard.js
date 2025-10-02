import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

function Dashboard() {
    const location = useLocation();
    const { role, name, lastname, userId } = location.state || {};

    const [publications, setPublications] = useState([]);

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

    const handleBorrow = async (pubId) => {
        try {
            const res = await fetch('http://localhost:3000/borrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: userId, publication_id: pubId }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Publication borrowed successfully!');
                fetchPublications();
            } else alert(data.error);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPublication = async () => {
        const title = prompt('Enter publication title:');
        if (!title) return;
        try {
            const res = await fetch('http://localhost:3000/add-publication', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author_id: userId }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Publication added!');
                fetchPublications();
            } else alert(data.error);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Welcome, {role} {name} {lastname}!</h1>

            <h2>Publications</h2>
            <ul className="publications-list">
                {publications.map(pub => (
                    <li key={pub.id} className="publication-item">
                        <span>{pub.title} by {pub.author_name}</span>
                        {role === 'student' && (
                            <button onClick={() => handleBorrow(pub.id)}>Borrow</button>
                        )}
                    </li>
                ))}
            </ul>

            {(role === 'professor' || role === 'postgraduate') && (
                <button className="add-publication-btn" onClick={handleAddPublication}>
                    Add New Publication
                </button>
            )}
        </div>
    );
}

export default Dashboard;
