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

    useEffect(() => {
        if (role === 'student' && user_id) {
            fetch(`http://localhost:3000/students/user/${user_id}`)
                .then(res => res.json())
                .then(data => setStudent(data))
                .catch(err => console.error('Failed to fetch student:', err));
        }
    }, [role, user_id]);

    if (!role) {
        return <h2 style={{ textAlign: 'center' }}>Access denied</h2>;
    }

    return (
        <div className="dashboard-wrapper">
            <Navbar user={{ role, name, lastname, user_id }} />

            {role === 'professor' || role === 'postgraduate' ? (
                <AuthorDashboard
                    name={name}
                    lastname={lastname}
                    user={{ role, name, lastname, user_id }}
                    role={role}
                />
            ) : (
                student && <StudentDashboard student={student} />
            )}
        </div>
    );
}

export default Dashboard;
