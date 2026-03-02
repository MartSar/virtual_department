import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/UserPublications.css";

const BorrowedPublications = ({ userId }) => {
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const fetchBorrowings = async () => {
        if (!userId) return;

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
            setError(err.message);
            setBorrowings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBorrowings();
    }, [userId]);

    const handleDownload = async (publicationId, publicationTitle, fileNameFromApi, isActive) => {
        if (!isActive) return;

        try {
            const res = await fetch(`http://localhost:3000/api/publications/download/${publicationId}`);
            if (!res.ok) throw new Error("Failed to download");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            const downloadName =
                fileNameFromApi || `${publicationTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`;
            link.download = downloadName;

            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert("Failed to download file");
        }
    };

    const handleRead = (publicationId, isActive) => {
        if (!isActive) return;
        navigate(`/reader/${publicationId}?user_id=${userId}`);
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
                        <th>Publication</th>
                        <th>Access From</th>
                        <th>Access Until</th>
                        <th>Status</th>
                        <th>Read</th>
                    </tr>
                    </thead>
                    <tbody>
                    {borrowings.map((b) => (
                        <tr key={b.id}>
                            <td>{b.publication_title}</td>
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
                                    onClick={() => handleRead(b.publication_id, b.is_active)}
                                    disabled={!b.is_active}
                                    title={!b.is_active ? "Borrowing expired" : ""}
                                >
                                    Read
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
