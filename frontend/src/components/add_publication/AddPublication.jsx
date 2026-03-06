import React, { useState, useEffect } from "react";
import "../../styles/AddPublication.css";

function AddPublication({ user, onClose }) {
    const [title, setTitle] = useState("");
    const [fileType, setFileType] = useState("");
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [authorName] = useState(`${user.name} ${user.lastname}`);

    const [topicId, setTopicId] = useState("");
    const [topics, setTopics] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const userId = user.user_id ?? user.id;

    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 MB

    const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "video/mp4",
    ];

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await fetch("http://localhost:3000/central_topics");
                const data = await res.json();
                setTopics(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch topics:", err);
            }
        };

        fetchTopics();
    }, []);

    useEffect(() => {
        if (!title || !file) return;

        const originalName = file.name || "";
        const extension = originalName.includes(".")
            ? originalName.split(".").pop().toLowerCase()
            : "";

        setFileName(`${title.toLowerCase().replace(/\s+/g, "_")}.${extension}`);
    }, [title, file]);

    const validateFile = (selectedFile) => {
        if (!selectedFile) return "No file selected";

        if (!allowedTypes.includes(selectedFile.type)) {
            return "Only PDF, DOCX, and MP4 files are allowed";
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            return "File is too large. Maximum allowed size is 150 MB";
        }

        return null;
    };

    const handleSelectedFile = (selectedFile) => {
        const validationError = validateFile(selectedFile);

        if (validationError) {
            setError(validationError);
            setFile(null);
            setFileType("");
            setFileName("");
            return;
        }

        setError(null);
        setFile(selectedFile);
        setFileType(selectedFile.type);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        handleSelectedFile(selectedFile);
        e.target.value = null;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;

        handleSelectedFile(droppedFile);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!userId) {
            setError("User not found");
            return;
        }

        if (!title || !file || !fileType || !topicId) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);

        try {
            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    const result = reader.result;
                    if (typeof result !== "string" || !result.includes(",")) {
                        throw new Error("Failed to process file");
                    }

                    const contentBase64 = result.split(",")[1];

                    const res = await fetch("http://localhost:3000/api/publications/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title,
                            file_type: fileType,
                            content: contentBase64,
                            description,
                            file_name: fileName || file.name,
                            user_id: userId,
                            topic_id: topicId,
                        }),
                    });

                    const data = await res.json().catch(() => ({}));

                    if (!res.ok) {
                        throw new Error(data.error || "Failed to create publication");
                    }

                    onClose?.();
                    window.location.reload();
                } catch (err) {
                    console.error(err);
                    setError(err.message || "Failed to create publication");
                    setLoading(false);
                }
            };

            reader.onerror = () => {
                setError("Failed to read file");
                setLoading(false);
            };

            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unexpected error");
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
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    <label>
                        Author
                        <input type="text" value={authorName} readOnly />
                    </label>

                    <label>
                        Central Topic
                        <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                            <option value="">Select topic</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        File Type
                        <input
                            type="text"
                            value={fileType}
                            placeholder="application/pdf, application/vnd..., video/mp4"
                            readOnly
                        />
                    </label>

                    <label>
                        File Name
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                    </label>

                    <label
                        className={`file-drop-area ${isDragOver ? "drag-over" : ""}`}
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                    >
                        {file ? file.name : "Drag & drop file here or click to select"}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.docx,.mp4,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
                            onChange={handleFileChange}
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </label>

                    {error && <p className="error">{error}</p>}

                    <div className="form-buttons">
                        <button type="submit" className="create-btn" disabled={loading}>
                            {loading ? "Creating..." : "Create Publication"}
                        </button>

                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPublication;