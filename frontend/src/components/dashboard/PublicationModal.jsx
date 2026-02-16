import React, { useState, useEffect } from "react";
import "../../styles/PublicationModal.css";

const borrowOptions = [7, 30, 90, 365];

const PublicationModal = ({ publication, onClose, user }) => {
    const [loading, setLoading] = useState(false);
    const [loadingAuthors, setLoadingAuthors] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [showDuration, setShowDuration] = useState(false);
    const [selectedDays, setSelectedDays] = useState(null);

    const [authors, setAuthors] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [cities, setCities] = useState([]);
    const [countries, setCountries] = useState([]);
    const [topicName, setTopicName] = useState("—");

    const userId = user?.id ?? user?.user_id;
    const canBorrow = user?.role === "student";

    // -----------------------------
    // Get Topic
    // -----------------------------
    useEffect(() => {
        if (!publication?.topic_id) {
            setTopicName("—");
            return;
        }

        const fetchTopic = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/central_topics/${publication.topic_id}`
                );
                if (!res.ok) throw new Error();
                const data = await res.json();
                setTopicName(data?.name || "—");
            } catch {
                setTopicName("—");
            }
        };

        fetchTopic();
    }, [publication?.topic_id]);

    // -----------------------------
    // Get Authors + Locations
    // -----------------------------
    useEffect(() => {
        if (!publication?.id) return;

        const uniqBy = (arr, keyFn) => {
            const seen = new Set();
            const out = [];
            for (const item of arr) {
                const k = keyFn(item);
                if (!k || seen.has(k)) continue;
                seen.add(k);
                out.push(item);
            }
            return out;
        };

        const fetchFullData = async () => {
            setLoadingAuthors(true);
            try {
                const res = await fetch(
                    `http://localhost:3000/publications/${publication.id}/authors-location`
                );
                if (!res.ok) throw new Error();
                const data = await res.json();

                const authorsArr = Array.isArray(data?.authors)
                    ? data.authors
                    : [];

                setAuthors(authorsArr);

                setFaculties(
                    uniqBy(
                        authorsArr
                            .map((a) => ({
                                id: a.faculty?.faculty_id,
                                name: a.faculty?.name,
                            }))
                            .filter((x) => x.id),
                        (x) => x.id
                    )
                );

                setUniversities(
                    uniqBy(
                        authorsArr
                            .map((a) => ({
                                id: a.university?.university_id,
                                name: a.university?.name,
                            }))
                            .filter((x) => x.id),
                        (x) => x.id
                    )
                );

                setCities(
                    uniqBy(
                        authorsArr
                            .map((a) => ({
                                id: a.city?.city_id,
                                name: a.city?.name,
                            }))
                            .filter((x) => x.id),
                        (x) => x.id
                    )
                );

                setCountries(
                    uniqBy(
                        authorsArr
                            .map((a) => ({
                                id: a.country?.country_id,
                                name: a.country?.name,
                            }))
                            .filter((x) => x.id),
                        (x) => x.id
                    )
                );
            } catch {
                setAuthors([]);
                setFaculties([]);
                setUniversities([]);
                setCities([]);
                setCountries([]);
            } finally {
                setLoadingAuthors(false);
            }
        };

        fetchFullData();
    }, [publication?.id]);

    // -----------------------------
    // Borrow handlers
    // -----------------------------
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

        if (!userId) {
            setError("User not found.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                "http://localhost:3000/api/borrowings/create",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        borrower_id: userId,
                        publication_id: publication.id,
                        duration_days: selectedDays,
                    }),
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error(data.error || "Failed to borrow");

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

    const uniqueNames = (arr) =>
        Array.from(new Set(arr.map((x) => x.name).filter(Boolean))).join(", ");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close-btn" onClick={onClose}>
                    ✕
                </button>

                <h2>{publication.title}</h2>

                {/* Authors */}
                <div className="modal-section">
                    {loadingAuthors ? (
                        <p>Loading authors...</p>
                    ) : authors.length > 0 ? (
                        <p>
                            <strong>Authors:</strong>{" "}
                            {authors
                                .map(
                                    (a) =>
                                        `${a.name} ${a.lastname} (${a.role})${
                                            a.is_primary_author ? " (primary)" : ""
                                        }`
                                )
                                .join(", ")}
                        </p>
                    ) : (
                        <p>
                            <strong>Authors:</strong> None
                        </p>
                    )}
                </div>

                <div className="modal-section">
                    <p><strong>Topic:</strong> {topicName}</p>
                    <p><strong>Faculty:</strong> {faculties.length ? uniqueNames(faculties) : "—"}</p>
                    <p><strong>University:</strong> {universities.length ? uniqueNames(universities) : "—"}</p>
                    <p><strong>City:</strong> {cities.length ? uniqueNames(cities) : "—"}</p>
                    <p><strong>Country:</strong> {countries.length ? uniqueNames(countries) : "—"}</p>
                </div>

                <div className="modal-section">
                    <p><strong>Description:</strong></p>
                    <p className="modal-description">
                        {publication.description || "No description available."}
                    </p>
                </div>

                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-hint">Successfully borrowed!</p>}

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
                                            className={`duration-btn ${
                                                selectedDays === days ? "selected" : ""
                                            }`}
                                            onClick={() => setSelectedDays(days)}
                                            type="button"
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
                                        type="button"
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
