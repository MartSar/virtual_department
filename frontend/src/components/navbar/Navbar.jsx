import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";

function Navbar({ user }) {
    const navigate = useNavigate();

    if (!user) return null;

    const { role, name, lastname, user_id } = user;

    return (
        <div className="navbar">
            {/* LEFT */}
            <div className="navbar-left">
                <button
                    className="navbar-profile"
                    onClick={() =>
                        navigate(`/profile/${user_id}`, { state: { loggedUser: user } })
                    }
                >
                    👤
                </button>

                <button
                    className="navbar-dashboard"
                    onClick={() =>
                        navigate("/dashboard", { state: user })
                    }
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
                    onClick={() => navigate("/")}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default Navbar;
