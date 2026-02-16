import React, { useState, useEffect } from "react";
import "../../styles/PublicationModal.css";

const borrowOptions = [7, 30, 90, 365];

const PublicationModal = ({ publication, onClose, student, user }) => {
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

    const studentId = student?.id; // если borrowings ещё завязаны на students
    const canBorrow = !!studentId;

    // -----------------------------
    // Get Topic (central_topics)
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
                if (!res.ok) throw new Error("Topic not found");
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
    // /publications/:id/authors-location
    // Expected author shape:
    // {
    //   user_id, name, lastname, role, is_primary_author,
    //   faculty: { faculty_id, name } | null,
    //   university: { university_id, name } | null,
    //   city: { city_id, name } | null,
    //   country: { country_id, name } | null
    // }
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
                if (!res.ok) throw new Error("Failed to fetch authors-location");
                const data = await res.json();

                const authorsArr = Array.isArray(data?.authors) ? data.authors : [];
                setAuthors(authorsArr);

                const fac = uniqBy(
                    authorsArr
                        .map((a) => ({
                            facultyId: a.faculty?.faculty_id ?? null,
                            facultyName: a.faculty?.name ?? null,
                        }))
                        .filter((x) => x.facultyId),
                    (x) => x.facultyId
                );

                const uni = uniqBy(
                    authorsArr
                        .map((a) => ({
                            universityId: a.university?.university_id ?? null,
                            universityName: a.university?.name ?? null,
                        }))
                        .filter((x) => x.universityId),
                    (x) => x.universityId
                );

                const cit = uniqBy(
                    authorsArr
                        .map((a) => ({
                            cityId: a.city?.city_id ?? null,
                            cityName: a.city?.name ?? null,
                        }))
                        .filter((x) => x.cityId),
                    (x) => x.cityId
                );

                const cou = uniqBy(
                    authorsArr
                        .map((a) => ({
                            countryId: a.country?.country_id ?? null,
                            countryName: a.country?.name ?? null,
                        }))
                        .filter((x) => x.countryId),
                    (x) => x.countryId
                );

                setFaculties(fac);
                setUniversities(uni);
                setCities(cit);
                setCountries(cou);
            } catch (err) {
                console.error(err);
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

    const uniqueNames = (arr) =>
        Array.from(new Set(arr.filter(Boolean))).join(", ");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                                .map((a) => {
                                    const main = a.is_primary_author ? " (primary)" : "";
                                    return `${a.name} ${a.lastname} (${a.role})${main}`;
                                })
                                .join(", ")}
                        </p>
                    ) : (
                        <p>
                            <strong>Authors:</strong> None
                        </p>
                    )}
                </div>

                <div className="modal-section">
                    <p>
                        <strong>Topic:</strong> {topicName || "—"}
                    </p>

                    <p>
                        <strong>Faculty:</strong>{" "}
                        {faculties.length ? uniqueNames(faculties.map((f) => f.facultyName)) : "—"}
                    </p>

                    <p>
                        <strong>University:</strong>{" "}
                        {universities.length
                            ? uniqueNames(universities.map((u) => u.universityName))
                            : "—"}
                    </p>

                    <p>
                        <strong>City:</strong>{" "}
                        {cities.length ? uniqueNames(cities.map((c) => c.cityName)) : "—"}
                    </p>

                    <p>
                        <strong>Country:</strong>{" "}
                        {countries.length
                            ? uniqueNames(countries.map((c) => c.countryName))
                            : "—"}
                    </p>
                </div>

                {/* Description */}
                <div className="modal-section">
                    <p>
                        <strong>Description:</strong>
                    </p>
                    <p className="modal-description">
                        {publication.description || "No description available."}
                    </p>
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
