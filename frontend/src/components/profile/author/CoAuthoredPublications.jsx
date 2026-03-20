import { useEffect, useState } from "react";
import { API_URL } from "../../../config";
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
                `${API_URL}/users/${userId}/publications/co-author`
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
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

    if (error) {
        return (
            <section className="borrowed-publications">
                <h2>Co-Authored Publications</h2>
                <p style={{ color: "red" }}>Error: {error}</p>
            </section>
        );
    }

    return (
        <section className="borrowed-publications">
            <h2>Co-Authored Publications</h2>
            {loading ? (
                <div className="section-loader">
                    <div className="section-spinner"></div>
                </div>
            ) : publications.length === 0 ? (
                <p>You have no co-authored publications</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    {publications.map((pub) => (
                        <tr key={pub.id}>
                            <td>{pub.title}</td>
                            <td>{getPublicationTypeLabel(pub.file_type, pub.file_name)}</td>
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
