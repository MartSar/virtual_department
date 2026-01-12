import React, { useState, useEffect } from "react";
import "../../styles/PublicationModal.css";

const borrowOptions = [7, 30, 90, 365];

const PublicationModal = ({ publication, onClose, student }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showDuration, setShowDuration] = useState(false);
    const [selectedDays, setSelectedDays] = useState(null);

    const [authors, setAuthors] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [cities, setCities] = useState([]);
    const [countries, setCountries] = useState([]);

    const [loadingAuthors, setLoadingAuthors] = useState(true);
    const [authorLocations, setAuthorLocations] = useState([]);
    const [topicName, setTopicName] = useState("");

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
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingAuthors(false);
            }
        };

        fetchAuthors();
    }, [publication]);

    /* -----------------------------
       Get Topic
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
       Get Locations of authors /publications/:id/authors-location
    ------------------------------ */
    useEffect(() => {
        if (!publication?.id) return;

        const fetchFullData = async () => {
            try {
                const res = await fetch(`http://localhost:3000/publications/${publication.id}/authors-location`);
                if (!res.ok) throw new Error("Failed to fetch full data");
                const data = await res.json();

                // Faculties
                const formattedFaculties = data.authors.map(author => ({
                    authorId: author.author_id,
                    authorType: author.author_type,
                    facultyId: author.faculty?.faculty_id || null,
                    facultyName: author.faculty?.faculty_name || null
                }));

                // Universities
                const formattedUniversities = data.authors
                    .map(author => ({
                        universityId: author.university?.university_id || null,
                        universityName: author.university?.university_name || null
                    }))
                    .filter((v, i, self) => v.universityId && self.findIndex(u => u.universityId === v.universityId) === i);

                // Cities
                const formattedCities = data.authors
                    .map(author => ({
                        cityId: author.city?.city_id || null,
                        cityName: author.city?.city_name || null
                    }))
                    .filter((v, i, self) => v.cityId && self.findIndex(c => c.cityId === v.cityId) === i);

                // Countries
                const formattedCountries = data.authors
                    .map(author => ({
                        countryId: author.country?.country_id || null,
                        countryName: author.country?.country_name || null
                    }))
                    .filter((v, i, self) => v.countryId && self.findIndex(c => c.countryId === v.countryId) === i);

                setFaculties(formattedFaculties);
                setUniversities(formattedUniversities);
                setCities(formattedCities);
                setCountries(formattedCountries);

            } catch (err) {
                console.error(err);
            }
        };

        fetchFullData();
    }, [publication?.id]);


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
                    duration_days: selectedDays,
                }),
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
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>

                <h2>{publication.title}</h2>

                {/* Authors */}
                <div className="modal-section">
                    {loadingAuthors ? (
                        <p>Loading authors...</p>
                    ) : authors.length > 0 ? (
                        <p><strong>Authors:</strong> {authors.map(a => `${a.name} ${a.lastname} (${a.author_type})`).join(", ")}</p>
                    ) : (
                        <p><strong>Authors:</strong> None</p>
                    )}
                </div>

                <div className="modal-section">
                    <p><strong>Topic:</strong> {topicName || "—"}</p>

                    <p>
                        <strong>Faculty:</strong>{" "}
                        {faculties.length > 0
                            ? faculties
                                .map(f => f.facultyName || "—")
                                .filter((value, index, self) => self.indexOf(value) === index)
                                .join(", ")
                            : "—"}
                    </p>
                    <p>
                        <strong>University:</strong>{" "}
                        {universities.length > 0
                        ? universities
                            .map(u => u.universityName || "—")
                            .filter((value, index, self) => self.indexOf(value) === index)
                            .join(", ")
                        : "—"}
                    </p>
                    <p>
                        <strong>City:</strong>{" "}
                        {cities.length > 0
                            ? cities
                                .map(с => с.cityName || "—")
                                .filter((value, index, self) => self.indexOf(value) === index)
                                .join(", ")
                            : "—"}
                    </p>
                    <p>
                        <strong>Country:</strong>{" "}
                        {countries.length > 0
                            ? countries.map(c => c.countryName || "—").join(", ")
                            : "—"}
                    </p>
                </div>


                {/* Description */}
                <div className="modal-section">
                    <p><strong>Description:</strong></p>
                    <p className="modal-description">{publication.description || "No description available."}</p>
                </div>

                {error && <p className="modal-error">{error}</p>}
                {success && <p className="modal-hint">Successfully borrowed!</p>}

                {/* Borrow actions */}
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
                                    {borrowOptions.map(days => (
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
