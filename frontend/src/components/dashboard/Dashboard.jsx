import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../components/navbar/Navbar";
import AuthorDashboard from './AuthorDashboard';

function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1) пробуем взять user_id из location.state
        const stateUserId = location.state?.user_id ?? location.state?.id;

        // 2) если нет — берём из localStorage
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

        fetch(`http://localhost:3000/users/${userId}`)
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
            <Navbar user={user} />
            <AuthorDashboard user={user} />
        </div>
    );
}

export default Dashboard;
