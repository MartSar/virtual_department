import { useEffect, useState } from "react";
import "../../../styles/UserPublications.css";

const CoAuthoredPublications = ({ userId }) => {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPublications = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:3000/users/${userId}/publications/co-author`
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // лучше не 404, а просто []
                throw new Error(data.error || "Failed to fetch co-authored publications");
            }

            setPublications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setPublications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublications();
    }, [userId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <section className="borrowed-publications">
            <h2>Co-Authored Publications</h2>

            {publications.length === 0 ? (
                <p>You have no co-authored publications</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>File Type</th>
                        <th>Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    {publications.map((pub) => (
                        <tr key={pub.id}>
                            <td>{pub.title}</td>
                            <td>{pub.file_type || "-"}</td>
                            <td>{pub.description || "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};

export default CoAuthoredPublications;
