import { useEffect, useState } from "react";
import "../../../styles/UserPublications.css";

const CoAuthoredPublications = ({ authorId }) => {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // -----------------------------
    // Fetch publications
    // -----------------------------
    const fetchPublications = async () => {
        if (!authorId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:3000/authors/${authorId}/publications/co-author`
            );
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 404) {
                    setPublications([]);
                    return;
                }
                throw new Error(data.error || "Failed to fetch co-authored publications");
            }
            setPublications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublications();
    }, [authorId]);

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
                        <th>Topic</th>
                        <th>File Type</th>
                        <th>Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    {publications.map(pub => (
                        <tr key={pub.id}>
                            <td>{pub.title}</td>
                            <td>{pub.topic_name || "-"}</td>
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
