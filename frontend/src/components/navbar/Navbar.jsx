import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";
import Avatar from "../inner_components/avatar/Avatar";
import AddPublication from "../add_publication/AddPublication";

function Navbar({ user, titleOverride, showBackButton, onBack }) {
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);

    if (!user) return null;

    const userId = user.user_id ?? user.id;
    const { login, name, lastname } = user;

    const goToProfile = () => {
        if (!userId) return;
        navigate(`/profile/${userId}`, { state: { loggedUser: user } });
    };

    const goToDashboard = () => {
        if (!userId) return;
        navigate("/dashboard", { state: { user_id: userId } });
    };

    const logout = () => {
        localStorage.removeItem("loggedUser");
        navigate("/auth");
    };

    return (
        <div className="navbar">
            <div className="navbar-left">
                <div className="navbar-avatar" onClick={goToProfile}>
                    <Avatar name={name} lastname={lastname} size={38} />
                </div>

                <button className="navbar-dashboard" onClick={goToDashboard}>
                    Dashboard
                </button>

                <button className="navbar-add-publication" onClick={() => setShowAddModal(true)}>
                    Add Publication
                </button>
            </div>

            <div className="navbar-center">
                {titleOverride ? titleOverride : `Welcome ${login}!`}
            </div>

            <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {showBackButton && (
                    <button className="navbar-back-btn" onClick={onBack}>
                        Back
                    </button>
                )}

                <button className="navbar-logout" onClick={logout}>
                    Sign Out
                </button>
            </div>

            {showAddModal && (
                <AddPublication user={user} onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
}

export default Navbar;