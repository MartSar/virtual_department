import '../styles/Dashboard.css';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import AuthorDashboard from './AuthorDashboard';
import {handleLogout} from "../handlers";

function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, name, lastname, userId } = location.state || {};

    if (!role) {
        return <h2 style={{ textAlign: 'center' }}>Access denied</h2>;
    }

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header">
                <button className="profile-btn" onClick={() => navigate('/profile')}>My Profile</button>
                <h1>Welcome, {role} {name} {lastname}!</h1>
                <button className="logout-btn" onClick={() => handleLogout({ navigate })}>Sign Out</button>
            </div>

            {role === 'professor' || role === 'postgraduate' ? (
                <AuthorDashboard name={name} lastname={lastname} userId={userId} role={role} />
            ) : (
                <StudentDashboard name={name} lastname={lastname} userId={userId} role={role}/>
            )}
        </div>
    );
}

export default Dashboard;
