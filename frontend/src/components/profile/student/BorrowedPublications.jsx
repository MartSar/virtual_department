import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/UserPublications.css";

const BorrowedPublications = ({ userId }) => {
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const fetchBorrowings = async () => {
        if (!userId) {
            setBorrowings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`http://localhost:3000/users/${userId}/borrowings`);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 404) {
                    setBorrowings([]);
                    return;
                }
                throw new Error(data.error || "Failed to fetch borrowings");
            }

            setBorrowings(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to fetch borrowings");
            setBorrowings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBorrowings();
    }, [userId]);

    const handleOpen = (publicationId, isActive) => {
        if (!isActive) return;
        navigate(`/reader/${publicationId}?user_id=${userId}`);
    };

    const getPublicationTypeLabel = (fileType, fileName = "") => {
        const type = (fileType || "").toLowerCase();
        const name = (fileName || "").toLowerCase();

        if (type.includes("pdf") || name.endsWith(".pdf")) {
            return "PDF";
        }

        if (
            type.includes("word") ||
            type.includes("officedocument") ||
            type.includes("docx") ||
            type.includes("doc") ||
            name.endsWith(".docx") ||
            name.endsWith(".doc")
        ) {
            return "Word";
        }

        if (type.includes("video/mp4") || name.endsWith(".mp4")) {
            return "MP4";
        }

        return "Unknown";
    };

    const getActionLabel = (fileType, fileName = "") => {
        const type = (fileType || "").toLowerCase();
        const name = (fileName || "").toLowerCase();

        if (type.includes("video/mp4") || name.endsWith(".mp4")) {
            return "Watch";
        }

        return "Read";
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <section className="borrowed-publications">
            <h2>Borrowed Publications</h2>

            {borrowings.length === 0 ? (
                <p>You have no borrowed publications</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Access From</th>
                        <th>Access Until</th>
                        <th>Status</th>
                        <th>Get</th>
                    </tr>
                    </thead>
                    <tbody>
                    {borrowings.map((b) => (
                        <tr key={b.id}>
                            <td>{b.publication_title}</td>
                            <td>{getPublicationTypeLabel(b.file_type, b.file_name)}</td>
                            <td>{new Date(b.start_date).toLocaleDateString()}</td>
                            <td>{new Date(b.end_date).toLocaleDateString()}</td>
                            <td>
                                {b.is_active ? (
                                    <span className="status-active">Active</span>
                                ) : (
                                    <span className="status-expired">Expired</span>
                                )}
                            </td>
                            <td>
                                <button
                                    className="read-btn"
                                    onClick={() => handleOpen(b.publication_id, b.is_active)}
                                    disabled={!b.is_active}
                                    title={!b.is_active ? "Borrowing expired" : ""}
                                >
                                    {getActionLabel(b.file_type, b.file_name)}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};

export default BorrowedPublications;