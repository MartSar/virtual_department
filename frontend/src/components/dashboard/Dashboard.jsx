import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import AuthorDashboard from './AuthorDashboard';
import Navbar from "../../components/navbar/Navbar";

function Dashboard() {
    const location = useLocation();
    const { role, login, user_id } = location.state || {};
    const [name, setName] = useState("")
    const [lastname, setLastName] = useState("")

    const [student, setStudent] = useState(null);
    const [author, setAuthor] = useState(null);


    useEffect(() => {
        if (!user_id) return;

        fetch(`http://localhost:3000/users/${user_id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to load user");
                }
                return res.json();
            })
            .then(user => {
                setName(user.name);
                setLastName(user.lastname);
            })
            .catch(err => console.error("User fetch error:", err));
    }, [user_id]);


    useEffect(() => {
        if (!user_id || !role) return;

        if (role === 'student') {
            fetch(`http://localhost:3000/students/user/${user_id}`)
                .then(res => res.json())
                .then(data => setStudent(data))
                .catch(err => console.error('Failed to fetch student:', err));
        } else {
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
            <Navbar user={{ role, login, name, lastname, user_id }} />

            {role === 'student' ? (
                student && <StudentDashboard student={student} />
            ) : (
                author && <AuthorDashboard author={author} />
            )}
        </div>
    );
}

export default Dashboard;
