import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";
import Avatar from "../avatar/Avatar";

function Navbar({ user }) {
    const navigate = useNavigate();

    if (!user) return null;

    const { name, lastname, user_id } = user;

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

    return (
        <div className="navbar">
            <div className="navbar-left">
                <div className="navbar-avatar" onClick={goToProfile}>
                    <Avatar
                        name={name}
                        lastname={lastname}
                        size={38}
                    />
                </div>

                <button
                    className="navbar-dashboard"
                    onClick={goToDashboard}
                >
                    Dashboard
                </button>
            </div>

            {/* CENTER */}
            <div className="navbar-center">
                Welcome {name} {lastname}!
            </div>

            {/* RIGHT */}
            <div className="navbar-right">
                <button
                    className="navbar-logout"
                    onClick={logout}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default Navbar;
