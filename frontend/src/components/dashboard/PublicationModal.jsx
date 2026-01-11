import React, { useState, useEffect } from "react";
import "../../styles/PublicationModal.css";

const borrowOptions = [7, 30, 90, 365];

const PublicationModal = ({ publication, onClose, student, user }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showDuration, setShowDuration] = useState(false);
    const [selectedDays, setSelectedDays] = useState(null);

    const [authors, setAuthors] = useState([]);
    const [loadingAuthors, setLoadingAuthors] = useState(true);

    const [topicName, setTopicName] = useState("");
    const [authorLocations, setAuthorLocations] = useState([]); // массив объектов { faculty, university, city, country }

    const studentId = student?.id;
    const canBorrow = !!studentId;

    /* -----------------------------
       Fetch authors
    ------------------------------ */
    useEffect(() => {
        if (!publication) return;

        const fetchAuthors = async () => {
            try {
                const res = await fetch(`http://localhost:3000/publications/${publication.id}/authors`);
                if (!res.ok) throw new Error("Failed to fetch authors");
                const data = await res.json();
                setAuthors(data);

                // Для каждого автора получаем локацию
                const locationsPromises = data.map(async (author) => {
                    try {
                        const locRes = await fetch(`http://localhost:3000/authors/${author.id}/location`);
                        if (!locRes.ok) throw new Error("Failed to fetch author location");
                        const locData = await locRes.json();
                        return locData; // { faculty, university, city, country }
                    } catch (err) {
                        console.error("Author location error:", err);
                        return { faculty_name: "—", university_name: "—", city_name: "—", country_name: "—" };
                    }
                });

                const locations = await Promise.all(locationsPromises);
                setAuthorLocations(locations);

            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAuthors(false);
            }
        };

        fetchAuthors();
    }, [publication]);

    /* -----------------------------
       Fetch topic
    ------------------------------ */
    useEffect(() => {
        if (!publication?.topic_id) return;

        const fetchTopic = async () => {
            try {
                const res = await fetch(`http://localhost:3000/central_topics/${publication.topic_id}`);
                if (!res.ok) throw new Error("Topic not found");
                const data = await res.json();
                setTopicName(data.name);
            } catch {
                setTopicName("—");
            }
        };

        fetchTopic();
    }, [publication?.topic_id]);

    /* -----------------------------
       Borrow handlers
    ------------------------------ */
    const handleBorrowClick = () => {
        if (!canBorrow) return;
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

            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data.error || "Failed to borrow");

            setSuccess(true);
            setSelectedDays(null);
            setShowDuration(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!publication) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                <h2>{publication.title}</h2>

                {/* ---------------- Authors ---------------- */}
                <div className="modal-section">
                    {loadingAuthors ? (
                        <p>Loading authors...</p>
                    ) : authors.length > 0 ? (
                        <p>
                            <strong>Authors:</strong>{" "}
                            {authors.map((a) => `${a.name} ${a.lastname} (${a.author_type})`).join(", ")}
                        </p>
                    ) : (
                        <p><strong>Authors:</strong> None</p>
                    )}
                </div>

                {/* ---------------- Attributes from authors ---------------- */}
                <div className="modal-section">
                    <p><strong>Topic:</strong> {topicName || "—"}</p>

                    {authorLocations.length > 0 ? (
                        authorLocations.map((loc, idx) => (
                            <div key={idx} style={{ marginBottom: "0.5em" }}>
                                <p><strong>Faculty:</strong> {loc.faculty_name || "—"}</p>
                                <p><strong>University:</strong> {loc.university_name || "—"}</p>
                                <p><strong>City:</strong> {loc.city_name || "—"}</p>
                                <p><strong>Country:</strong> {loc.country_name || "—"}</p>
                                <hr />
                            </div>
                        ))
                    ) : (
                        <p>Faculty, University, City, Country: —</p>
                    )}
                </div>

                {/* ---------------- Description ---------------- */}
                <div className="modal-section">
                    <p><strong>Description:</strong></p>
                    <p className="modal-description">
                        {publication.description || "No description available."}
                    </p>
                </div>

                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-hint">Successfully borrowed!</p>}

                {/* ---------------- Borrow Actions ---------------- */}
                {canBorrow && (
                    <div className="modal-actions">
                        {!showDuration && !success && (
                            <button
                                className="borrow-btn big-center"
                                onClick={handleBorrowClick}
                                disabled={loading}
                            >
                                Borrow
                            </button>
                        )}

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
                )}
            </div>
        </div>
    );
};

export default PublicationModal;
