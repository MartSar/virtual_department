import { useEffect, useState } from "react";
import AddCoAuthor from "./AddCoAuthor";
import "../../../styles/UserPublications.css";

const AuthoredPublications = ({ authorId }) => {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPublications = async () => {
        if (!authorId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `http://localhost:3000/authors/${authorId}/publications`
            );
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (
                    res.status === 404 &&
                    errData.error === "No publications found for this author"
                ) {
                    setPublications([]);
                    return;
                }
                throw new Error(errData.error || "Failed to fetch authored publications");
            }
            const data = await res.json();
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this publication?")) return;

        try {
            const res = await fetch(`http://localhost:3000/api/publications/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete publication");

            fetchPublications(); // обновляем после удаления
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const refreshPublicationAuthors = (pubId) => {
        fetchPublications(); // можно усложнить для конкретного pubId, если нужно
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
                        <th>File Type</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {publications.map((pub) => (
                        <tr key={pub.id}>
                            <td>{pub.title}</td>
                            <td>{pub.topic_name || "-"}</td>
                            <td>{pub.file_type || "-"}</td>
                            <td>{pub.description || "-"}</td>
                            <td>
                                {/*<AddCoAuthor*/}
                                {/*    publicationId={pub.id}*/}
                                {/*    onUpdate={() => refreshPublicationAuthors(pub.id)}*/}
                                {/*/>*/}
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(pub.id)}
                                >
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
