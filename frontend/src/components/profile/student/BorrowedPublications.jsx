import { useEffect, useState } from "react";
import '../../../styles/BorrowedPublications.css';

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
                    throw new Error(errData.error || 'Failed to fetch borrowings');
                }
                return res.json();
            })
            .then(data => setBorrowings(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [studentId]);

    if (loading) {
        return <p>Loading borrowed publications...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <section className="borrowed-publications">
            <h2>My Borrowed Publications</h2>

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
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};

export default BorrowedPublications;
