import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeNavbar from "./WelcomeNavbar";
import "../../styles/WelcomePage.css";

function WelcomePage() {
    const navigate = useNavigate();
    const [showInvite, setShowInvite] = useState(false);

    return (
        <div className="welcome-wrapper">
            <WelcomeNavbar />

            <section className="welcome-hero">
                <h1>Welcome to Virtual Department</h1>
                <p className="welcome-subtitle">
                    A digital space where students, professors and postgraduates
                    share, discover and co-author academic publications.
                </p>

                <div className="welcome-hero-btns">
                    <button
                        className="welcome-btn welcome-btn-primary"
                        onClick={() => navigate("/dashboard")}
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* -------------------- Features -------------------- */}
            <section className="welcome-section">
                <h2 className="welcome-section-title">What You Can Do</h2>

                <div className="welcome-cards">
                    <div className="welcome-card">
                        <div className="welcome-card-icon">📚</div>
                        <h3>Publish</h3>
                        <p>
                            Upload your scientific work and make it available
                            to readers across the whole department.
                        </p>
                    </div>

                    <div className="welcome-card">
                        <div className="welcome-card-icon">🤝</div>
                        <h3>Co-author</h3>
                        <p>
                            Invite colleagues as co-authors and manage shared
                            publications together in one place.
                        </p>
                    </div>

                    <div className="welcome-card">
                        <div className="welcome-card-icon">🔍</div>
                        <h3>Discover</h3>
                        <p>
                            Search and filter publications by topic, country,
                            city, university and faculty.
                        </p>
                    </div>

                    <div className="welcome-card">
                        <div className="welcome-card-icon">📖</div>
                        <h3>Read</h3>
                        <p>
                            Borrow and read publications directly in the built-in
                            universal reader.
                        </p>
                    </div>
                </div>
            </section>

            <section className="welcome-section welcome-section-alt">
                <h2 className="welcome-section-title">Built for Everyone</h2>

                <div className="welcome-roles">
                    <div className="welcome-role welcome-role-student">
                        <h3>Students</h3>
                        <p>
                            Browse publications, borrow them to read, and keep
                            track of your academic sources.
                        </p>
                    </div>

                    <div className="welcome-role welcome-role-professor">
                        <h3>Professors</h3>
                        <p>
                            Publish research, supervise postgraduates and
                            collaborate with co-authors.
                        </p>
                    </div>

                    <div className="welcome-role welcome-role-postgraduate">
                        <h3>Postgraduates</h3>
                        <p>
                            Link up with your supervisors and publish your own
                            research alongside them.
                        </p>
                    </div>
                </div>
            </section>

            {/* -------------------- Invite banner -------------------- */}
            <section className="welcome-invite-banner">
                <div>
                    <h2>Know someone who would love this?</h2>
                    <p>
                        Send them an invite and start building your department
                        together.
                    </p>
                </div>
                <button
                    className="welcome-btn welcome-btn-invite large"
                    onClick={() => setShowInvite(true)}
                >
                    Invite a Colleague
                </button>
            </section>

            {/* -------------------- Footer -------------------- */}
            <footer className="welcome-footer">
                <p>© {new Date().getFullYear()} Virtual Department</p>
                <div className="welcome-footer-btns">
                    <button
                        className="welcome-footer-link"
                        onClick={() => navigate("/auth")}
                    >
                        Sign In
                    </button>
                    <button
                        className="welcome-footer-link"
                        onClick={() => navigate("/register")}
                    >
                        Create Account
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default WelcomePage;