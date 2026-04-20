import { useNavigate } from "react-router-dom";
import React from "react";

export default function WelcomeNavbar() {
    const navigate = useNavigate();

    return (
        <header className="welcome-topbar">
            <div className="welcome-logo">Virtual Department</div>
            <div className="welcome-topbar-btns">
                <button
                    className="welcome-topbar-about"
                    onClick={() => navigate("/")}
                >
                    About
                </button>
                <button
                    className="welcome-topbar-signin"
                    onClick={() => navigate("/auth")}
                >
                    Sign In
                </button>
                <button
                    className="welcome-topbar-signup"
                    onClick={() => navigate("/register")}
                >
                    Sign Up
                </button>
            </div>
        </header>
    );
}