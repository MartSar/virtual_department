import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';

function StudentDashboard({ name, lastname, userId }) {
    const [publications, setPublications] = useState([]);

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
                alert('Publikácia bola úspešne požičaná!');
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Welcome, student {name} {lastname}!</h1>
            <h2>List of Available Publications</h2>
            <ul className="publications-list">
                {publications.map(pub => (
                    <li key={pub.id} className="publication-item">
                        <span>{pub.title} — {pub.author_name}</span>
                        <button onClick={() => handleBorrow(pub.id)}>Borrow</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StudentDashboard;
