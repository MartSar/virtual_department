import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../components/navbar/Navbar";
import AuthorDashboard from './AuthorDashboard';
import { API_URL } from '../../config'

function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    useEffect(() => {
        const stateUserId = location.state?.user_id ?? location.state?.id;

        let saved = null;
        try {
            saved = JSON.parse(localStorage.getItem("loggedUser"));
        } catch (_) {}

        const savedUserId = saved?.user_id ?? saved?.id;

        const userId = stateUserId ?? savedUserId;

        if (!userId) {
            navigate("/", { replace: true });
            return;
        }

        fetch(`${API_URL}/users/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to load user");
                return res.json();
            })
            .then(data => setUser(data))
            .catch(err => {
                console.error("User fetch error:", err);
                navigate("/", { replace: true });
            });
    }, [location.state, navigate]);

    if (!user) {
        return <h2 style={{ textAlign: 'center' }}>Loading...</h2>;
    }

    return (
        <div className="dashboard-wrapper">
            <Navbar user={user}/>
            <div className="main-content">
                <AuthorDashboard user={user}/>
            </div>
        </div>
    );
}

export default Dashboard;
