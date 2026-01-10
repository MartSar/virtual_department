import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import AuthorDashboard from './AuthorDashboard';
import Navbar from "../../components/navbar/Navbar";

function Dashboard() {
    const location = useLocation();
    const { role, name, lastname, user_id } = location.state || {};
    const [student, setStudent] = useState(null);
    const [author, setAuthor] = useState(null);

    useEffect(() => {
        if (role === 'student' && user_id) {
            fetch(`http://localhost:3000/students/user/${user_id}`)
                .then(res => res.json())
                .then(data => setStudent(data))
                .catch(err => console.error('Failed to fetch student:', err));
        }
        if (role === 'postgraduate' && user_id) {
            fetch(`http://localhost:3000/postgraduates/user/${user_id}`)
                .then(res => res.json())
                .then(data => setAuthor(data))
                .catch(err => console.error('Failed to fetch postgraduate:', err));
        }
        if (role === 'professor' && user_id) {
            fetch(`http://localhost:3000/professors/user/${user_id}`)
                .then(res => res.json())
                .then(data => setAuthor(data))
                .catch(err => console.error('Failed to fetch professor:', err));
        }

    }, [role, user_id]);

    if (!role) {
        return <h2 style={{ textAlign: 'center' }}>Access denied</h2>;
    }

    return (
        <div className="dashboard-wrapper">
            <Navbar user={{ role, name, lastname, user_id }} />

            {role === 'professor' || role === 'postgraduate' ? (
                author && <AuthorDashboard author={author} />
            ) : (
                student && <StudentDashboard student={student} />
            )}
        </div>
    );
}

export default Dashboard;
