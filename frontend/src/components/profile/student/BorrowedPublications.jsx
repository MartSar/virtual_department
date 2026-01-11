import { useEffect, useState } from "react";
import '../../../styles/UserPublications.css';

const BorrowedPublications = ({ studentId }) => {
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;

        setLoading(true);
        setError(null);

        fetch(`http://localhost:3000/borrowings/${studentId}`)
            .then(async (res) => {
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    if (res.status === 404 && errData.error === 'No borrowings found for this student') {
                        return [];
                    }
                    throw new Error(errData.error || 'Failed to fetch borrowings');
                }
                return res.json();
            })
            .then(data => setBorrowings(Array.isArray(data) ? data : []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [studentId]);

    const handleDownload = async (publicationId, publicationTitle, fileNameFromApi) => {
        try {
            const res = await fetch(`http://localhost:3000/api/publications/download/${publicationId}`);
            if (!res.ok) throw new Error('Failed to download');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            // fallback имя
            const downloadName = fileNameFromApi || `${publicationTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`;
            link.download = downloadName;

            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Failed to download file');
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

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
                        <th>Download</th>
                    </tr>
                    </thead>
                    <tbody>
                    {borrowings.map(b => (
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
                                    className="download-btn"
                                    onClick={() => handleDownload(b.publication_id, b.publication_title, b.file_name)}
                                >
                                    Download
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
