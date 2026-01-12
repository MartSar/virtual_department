import ReactDOM from "react-dom";
import React, { useEffect, useState } from "react";
import "../../../styles/Modal.css"; // стили отдельно

const Modal = ({ children, onClose }) => {
    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    );
};

const AddCoAuthor = ({ publicationId, onUpdate }) => {
    const [allAuthors, setAllAuthors] = useState([]);
    const [currentAuthors, setCurrentAuthors] = useState([]);
    const [selectedAuthorId, setSelectedAuthorId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Получаем всех авторов
    useEffect(() => {
        const fetchAuthors = async () => {
            try {
                const res = await fetch("http://localhost:3000/authors");
                if (!res.ok) throw new Error("Failed to fetch authors");
                const data = await res.json();
                setAllAuthors(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchAuthors();
    }, []);

    // Получаем текущих авторов публикации при открытии модалки
    useEffect(() => {
        if (!showModal) return;

        const fetchCurrentAuthors = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/publications/${publicationId}/authors`
                );
                if (!res.ok) throw new Error("Failed to fetch current authors");
                const data = await res.json();
                setCurrentAuthors(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchCurrentAuthors();
    }, [publicationId, showModal]);

    const handleAddAuthor = async () => {
        if (!selectedAuthorId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:3000/publications/${publicationId}/authors`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ author_id: selectedAuthorId }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add co-author");

            onUpdate && onUpdate();
            setSelectedAuthorId("");
            setShowModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Фильтруем авторов, которых уже есть
    const availableAuthors = allAuthors.filter(
        (a) => !currentAuthors.some((c) => c.id === a.id)
    );

    return (
        <>
            <button className="add-co-author-btn" onClick={() => setShowModal(true)}>
                Add Co-Author
            </button>

            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <h3>Add Co-Author</h3>

                    <select
                        className="modal-select"
                        value={selectedAuthorId}
                        onChange={(e) => setSelectedAuthorId(e.target.value)}
                    >
                        <option value="">Select author</option>
                        {availableAuthors.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} {a.lastname} — {a.author_type}
                            </option>
                        ))}
                    </select>

                    <div className="modal-btns" style={{ display: "flex", justifyContent: "space-between" }}>
                        <button
                            className="modal-cancel-btn"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="modal-assign-btn"
                            onClick={handleAddAuthor}
                            disabled={loading || !selectedAuthorId || availableAuthors.length === 0}
                        >
                            {loading ? "Adding..." : "Add"}
                        </button>
                    </div>

                    {error && <p className="modal-error">{error}</p>}
                </Modal>
            )}
        </>
    );
};

export default AddCoAuthor;
