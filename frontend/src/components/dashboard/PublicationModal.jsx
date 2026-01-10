import React, { useState } from "react";
import "../../styles/PublicationModal.css";

const borrowOptions = [7, 30, 90, 365];

const PublicationModal = ({ publication, onClose, student, onBorrowed }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showDuration, setShowDuration] = useState(false);
    const [selectedDays, setSelectedDays] = useState(null);

    if (!publication) return null;

    const studentId = student.id;

    const handleBorrowClick = () => {
        if (!studentId) {
            setError("Student ID not found. Please login again.");
            return;
        }
        setShowDuration(true);
        setError(null);
    };

    const handleConfirm = async () => {
        if (!selectedDays) {
            setError("Please select duration first.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("http://localhost:3000/api/borrowings/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: studentId,
                    publication_id: publication.id,
                    duration_days: selectedDays
                })
            });

            let data;
            try {
                data = await res.json();
            } catch {
                data = {};
            }

            if (!res.ok) throw new Error(data.error || "Failed to borrow");

            setSuccess(true);
            setSelectedDays(null);
            setShowDuration(false);
            if (onBorrowed) onBorrowed(publication.id);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                <h2>{publication.title}</h2>

                <div className="modal-section">
                    <p><strong>Topic:</strong> {publication.topic_name || "—"}</p>
                    <p><strong>Country:</strong> {publication.country_name || "—"}</p>
                    <p><strong>City:</strong> {publication.city_name || "—"}</p>
                    <p><strong>University:</strong> {publication.university_name || "—"}</p>
                    <p><strong>Faculty:</strong> {publication.faculty_name || "—"}</p>
                </div>

                <div className="modal-section">
                    <p><strong>Description:</strong></p>
                    <p className="modal-description">
                        {publication.description || "No description available."}
                    </p>
                </div>

                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-hint">Successfully borrowed!</p>}

                <div className="modal-actions">
                    {/* Большая Borrow кнопка по центру */}
                    {!showDuration && !success && (
                        <button
                            className="borrow-btn big-center"
                            onClick={handleBorrowClick}
                            disabled={loading || success || !studentId}
                        >
                            Borrow
                        </button>
                    )}

                    {/* Выбор дней + Confirm справа */}
                    {showDuration && !success && (
                        <>
                            <div className="duration-buttons-row">
                                {borrowOptions.map((days) => (
                                    <button
                                        key={days}
                                        className={`duration-btn ${selectedDays === days ? "selected" : ""}`}
                                        onClick={() => setSelectedDays(days)}
                                    >
                                        {days} days
                                    </button>
                                ))}
                            </div>

                            <div className="confirm-row-right">
                                <button
                                    className="confirm-btn"
                                    onClick={handleConfirm}
                                    disabled={!selectedDays || loading}
                                >
                                    {loading ? "Processing..." : "Confirm"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicationModal;
