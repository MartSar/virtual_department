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
        if (!user_id || !role) return;

        if (role === 'student') {
            fetch(`http://localhost:3000/students/user/${user_id}`)
                .then(res => res.json())
                .then(data => setStudent(data))
                .catch(err => console.error('Failed to fetch student:', err));
        } else {
            // для профессоров и аспирантов единый fetch на таблицу authors
            fetch(`http://localhost:3000/authors/user/${user_id}`)
                .then(res => res.json())
                .then(data => setAuthor(data))
                .catch(err => console.error('Failed to fetch author:', err));
        }
    }, [role, user_id]);

    if (!role) {
        return <h2 style={{ textAlign: 'center' }}>Access denied</h2>;
    }

    return (
        <div className="dashboard-wrapper">
            <Navbar user={{ role, name, lastname, user_id }} />

            {role === 'student' ? (
                student && <StudentDashboard student={student} />
            ) : (
                author && <AuthorDashboard author={author} />
            )}
        </div>
    );
}

export default Dashboard;
