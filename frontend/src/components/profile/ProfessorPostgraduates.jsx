import React, { useState, useEffect } from "react";
import {API_URL} from "../../config";
import "../../styles/UserPublications.css";

const ProfessorPostgraduates = ({ userId }) => {
    const [postgraduates, setPostgraduates] = useState([]);
    const [allPostgraduates, setAllPostgraduates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedPgId, setSelectedPgId] = useState("");

    // -------------------
    // Все аспиранты (users.role='postgraduate')
    // -------------------
    useEffect(() => {
        const fetchAllPostgraduates = async () => {
            try {
                const res = await fetch(`${API_URL}/postgraduates`);
                const data = await res.json();
                setAllPostgraduates(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch all postgraduates:", err);
            }
        };
        fetchAllPostgraduates();
    }, []);

    // -------------------
    // Назначенные аспиранты профессора (professor = userId)
    // -------------------
    const fetchAssignedPostgraduates = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/professors/${userId}/postgraduates`);
            const data = await res.json();
            setPostgraduates(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch assigned postgraduates:", err);
        }
    };

    useEffect(() => {
        fetchAssignedPostgraduates();
    }, [userId]);

    // -------------------
    // Assign
    // -------------------
    const handleAssign = async () => {
        if (!selectedPgId || !userId) return;

        try {
            const res = await fetch(`${API_URL}/professors/${userId}/postgraduates`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postgraduate_id: Number(selectedPgId) }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Failed to assign postgraduate");

            setSelectedPgId("");
            setShowModal(false);
            fetchAssignedPostgraduates();
        } catch (err) {
            alert("Failed to assign postgraduate: " + err.message);
        }
    };

    // -------------------
    // available list (exclude already assigned)
    // -------------------
    const availablePostgraduates = allPostgraduates.filter(
        (pg) => !postgraduates.some((assigned) => assigned.id === pg.id)
    );

    return (
        <section className="borrowed-publications">
            <h2>My Postgraduates</h2>

            {postgraduates.length === 0 ? (
                <p>No assigned postgraduates</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Last Name</th>
                        <th>Faculty</th>
                        <th>University</th>
                        <th>City</th>
                        <th>Country</th>
                    </tr>
                    </thead>
                    <tbody>
                    {postgraduates.map((pg) => (
                        <tr key={pg.id}>
                            <td>{pg.name}</td>
                            <td>{pg.lastname}</td>
                            <td>{pg.faculty?.name || "-"}</td>
                            <td>{pg.university?.name || "-"}</td>
                            <td>{pg.city?.name || "-"}</td>
                            <td>{pg.country?.name || "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <button
                className="borrow-btn"
                style={{ marginTop: "10px" }}
                onClick={() => setShowModal(true)}
            >
                Assign Postgraduate
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: "400px" }}
                    >
                        <h3>Assign Postgraduate</h3>

                        {availablePostgraduates.length === 0 ? (
                            <p>All postgraduates are already assigned</p>
                        ) : (
                            <select
                                className="professor-postgraduates-select"
                                value={selectedPgId}
                                onChange={(e) => setSelectedPgId(e.target.value)}
                            >
                                <option value="">Select postgraduate</option>
                                {availablePostgraduates.map((pg) => (
                                    <option key={pg.id} value={pg.id}>
                                        {pg.name} {pg.lastname}
                                    </option>
                                ))}
                            </select>
                        )}

                        <div
                            className="professor-postgraduates-btns"
                            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
                        >
                            <button
                                className="professor-postgraduates-cancel-btn"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="assign-btn"
                                onClick={handleAssign}
                                disabled={!selectedPgId || availablePostgraduates.length === 0}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProfessorPostgraduates;
