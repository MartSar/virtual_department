import { useEffect, useState } from "react";
import AddCoAuthor from "./AddCoAuthor";
import "../../../styles/UserPublications.css";

const AuthoredPublications = ({ userId }) => {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // -----------------------------
    // Fetch publications
    // -----------------------------
    const fetchPublications = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:3000/users/${userId}/publications/primary`
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 404) {
                    setPublications([]);
                    return;
                }
                throw new Error(data.error || "Failed to fetch authored publications");
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
    }, [userId]);

    // -----------------------------
    // Delete Publication
    // -----------------------------
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this publication?")) return;

        try {
            const res = await fetch(`http://localhost:3000/api/publications/${id}`, {
                method: "DELETE",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Failed to delete publication");

            fetchPublications();
        } catch (err) {
            alert("Error: " + err.message);
        }
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <section className="borrowed-publications">
            <h2>My Publications</h2>

            {publications.length === 0 ? (
                <p>You have no authored publications</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Topic</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {publications.map((pub) => (
                        <tr key={pub.id}>
                            <td>{pub.title}</td>
                            <td>{pub.topic_name || "-"}</td>
                            <td>{getPublicationTypeLabel(pub.file_type, pub.file_name)}</td>
                            <td>
                                <AddCoAuthor
                                    publicationId={pub.id}
                                    onUpdate={fetchPublications}
                                />
                                <button className="delete-btn" onClick={() => handleDelete(pub.id)}>
                                    Delete
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

export default AuthoredPublications;
