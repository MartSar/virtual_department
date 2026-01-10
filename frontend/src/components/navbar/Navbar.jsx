import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";
import Avatar from "../inner_components/avatar/Avatar";
import AddPublication from "../add_publication/AddPublication";

function Navbar({ user }) {
    const navigate = useNavigate();
    const [showAddModal, setShowAddModal] = useState(false);

    if (!user) return null;

    const { name, lastname, user_id, role } = user;

    const goToProfile = () => {
        navigate(`/profile/${user_id}`, {
            state: { loggedUser: user }
        });
    };

    const goToDashboard = () => {
        navigate("/dashboard", { state: user });
    };

    const logout = () => {
        localStorage.removeItem("loggedUser");
        navigate("/");
    };

    const openAddPublication = () => setShowAddModal(true);
    const closeAddPublication = () => setShowAddModal(false);

    return (
        <div className="navbar">
            {/* LEFT */}
            <div className="navbar-left">
                <div className="navbar-avatar" onClick={goToProfile}>
                    <Avatar name={name} lastname={lastname} size={38} />
                </div>

                <button className="navbar-dashboard" onClick={goToDashboard}>
                    Dashboard
                </button>

                {/* Кнопка + Add для профессоров и аспирантов */}
                {(role === "professor" || role === "postgraduate") && (
                    <button
                        className="navbar-add-publication"
                        onClick={openAddPublication}
                    >
                        Add Publication
                    </button>
                )}
            </div>

            {/* CENTER */}
            <div className="navbar-center">
                Welcome {name} {lastname} (fix)!
            </div>

            {/* RIGHT */}
            <div className="navbar-right">
                <button className="navbar-logout" onClick={logout}>
                    Sign Out
                </button>
            </div>

            {showAddModal && (
                <AddPublication user={user} onClose={closeAddPublication} />
            )}

        </div>
    );
}

export default Navbar;
