import '../../styles/Dashboard.css';
import React from 'react';
import { useLocation } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import AuthorDashboard from './AuthorDashboard';
import Navbar from "../../components/navbar/Navbar";
import { handleLogout } from "../../handlers";

function Dashboard() {
    const location = useLocation();
    const { role, name, lastname, user_id } = location.state || {};

    if (!role) {
        return <h2 style={{ textAlign: 'center' }}>Access denied</h2>;
    }

    // общий объект пользователя
    const user = { role, name, lastname, user_id };

    return (
        <div className="dashboard-wrapper">
            <Navbar user={user} />

            {role === 'professor' || role === 'postgraduate' ? (
                <AuthorDashboard name={name} lastname={lastname} user_id={user_id} role={role} />
            ) : (
                <StudentDashboard name={name} lastname={lastname} user_id={user_id} role={role}/>
            )}
        </div>
    );
}

export default Dashboard;
