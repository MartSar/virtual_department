// components/publications/AddPublication.jsx
import React, { useState, useEffect } from "react";
import "../../styles/AddPublication.css";

function AddPublication({ user, onClose }) {
    const [title, setTitle] = useState("");
    const [fileType, setFileType] = useState("");
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState("");
    const [author, setAuthor] = useState(`${user.name} ${user.lastname}`);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // Генерация fileName из title и fileType при их изменении
    useEffect(() => {
        if (title) {
            const ext = fileType ? fileType : "txt";
            const generatedName = `${title.toLowerCase().replace(/\s+/g, "_")}.${ext}`;
            setFileName(generatedName);
        }
    }, [title, fileType]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const ext = selectedFile.name.split(".").pop();
            setFileType(ext);

            e.target.value = null;
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            const ext = droppedFile.name.split(".").pop();
            setFileType(ext);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!title || !fileType || !file) {
            setError("Please fill in all required fields");
            setLoading(false);
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const contentBase64 = reader.result.split(",")[1];

                const response = await fetch("/api/publications/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        file_type: fileType,
                        content: contentBase64,
                        description,
                        author_id: user.user_id,
                        author_type: user.role,
                        file_name: fileName
                    })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || "Failed to create publication");
                }

                console.log("Publication created:", data);
                setLoading(false);
                onClose();
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleZoneClick = (e) => {
        e.stopPropagation();
        setTimeout(() => {
            document.getElementById("fileInput").click();
        }, 0);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Add Publication</h2>
                <form onSubmit={handleSubmit} className="add-publication-form">
                    {/* Title */}
                    <label>
                        Title
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    {/* Author readonly */}
                    <label>
                        Author
                        <input type="text" value={author} readOnly />
                    </label>

                    {/* File Type */}
                    <label>
                        File Type
                        <input
                            type="text"
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                            placeholder="pdf, docx, txt"
                        />
                    </label>

                    {/* File Name */}
                    <label>
                        File Name
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                    </label>

                    {/* Content (file) */}
                    <label
                        htmlFor="fileInput"
                        className={`file-drop-area ${isDragOver ? "drag-over" : ""}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {file ? file.name : "Drag & drop file here or click to select"}
                    </label>

                    <input
                        type="file"
                        id="fileInput"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />

                    {/* Description */}
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
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPublication;
