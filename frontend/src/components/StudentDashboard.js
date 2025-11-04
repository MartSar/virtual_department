import React, { useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import { useNavigate } from 'react-router-dom';

function StudentDashboard({ name, lastname, userId }) {
    const [publications, setPublications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

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
                alert('The publication has been successfully borrowed!');
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    const filteredPublications = publications.filter(pub =>
        pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pub.author_name && pub.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="dashboard-container">

            <h2>List of Publications</h2>

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
                            <span>{pub.title} — {pub.author_name}</span>
                            <button onClick={() => handleBorrow(pub.id)}>Borrow</button>
                        </li>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#777' }}>No publications were found</p>
                )}
            </ul>
        </div>
    );
}

export default StudentDashboard;
