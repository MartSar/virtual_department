import React, { useState, useEffect } from "react";
import "../../styles/AddPublication.css";

function AddPublication({ user, onClose }) {
    const [title, setTitle] = useState("");
    const [fileType, setFileType] = useState("");
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [authorName, setAuthorName] = useState(`${user.name} ${user.lastname}`);

    // central topic
    const [topicId, setTopicId] = useState("");
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // ------------------- Fetch central topics -------------------
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await fetch("http://localhost:3000/central_topics");
                const data = await res.json();
                setTopics(data);
            } catch (err) {
                console.error("Failed to fetch topics:", err);
            }
        };
        fetchTopics();
    }, []);

    // ------------------- Update selected topic -------------------
    useEffect(() => {
        setSelectedTopic(topics.find(t => t.id === Number(topicId)) || null);
    }, [topicId, topics]);

    // ------------------- Generate file name -------------------
    useEffect(() => {
        if (!title) return;
        const ext = fileType || "txt";
        setFileName(`${title.toLowerCase().replace(/\s+/g, "_")}.${ext}`);
    }, [title, fileType]);

    // ------------------- Fetch author -------------------
    const fetchAuthor = async () => {
        const res = await fetch(`http://localhost:3000/authors/user/${user.user_id}`);
        if (!res.ok) throw new Error("Author not found");
        const author = await res.json();
        return { author_id: author.id, author_type: author.author_type };
    };

    // ------------------- File handlers -------------------
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setFileType(selectedFile.name.split(".").pop());
        e.target.value = null;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;
        setFile(droppedFile);
        setFileType(droppedFile.name.split(".").pop());
    };

    // ------------------- Submit -------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!title || !file || !fileType || !topicId) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const { author_id } = await fetchAuthor();

            const reader = new FileReader();
            reader.onload = async () => {
                const contentBase64 = reader.result.split(",")[1];

                const res = await fetch("http://localhost:3000/api/publications/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        file_type: fileType,
                        content: contentBase64,
                        description,
                        file_name: fileName,
                        author_id,
                        topic_id: topicId
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to create publication");

                onClose();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add Publication</h2>
                <form className="add-publication-form" onSubmit={handleSubmit}>

                    <label>
                        Title
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </label>

                    <label>
                        Author
                        <input type="text" value={authorName} readOnly />
                    </label>

                    <label>
                        Central Topic
                        <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                            <option value="">Select topic</option>
                            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </label>

                    <label>
                        File Type
                        <input type="text" value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="pdf, docx, txt" readOnly />
                    </label>

                    <label>
                        File Name
                        <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                    </label>

                    <label
                        className={`file-drop-area ${isDragOver ? "drag-over" : ""}`}
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                    >
                        {file ? file.name : "Drag & drop file here or click to select"}
                        <input type="file" hidden onChange={handleFileChange} />
                    </label>

                    <label>
                        Description
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </label>

                    {error && <p className="error">{error}</p>}

                    <div className="form-buttons">
                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? "Creating..." : "Create Publication"}
                        </button>
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPublication;
