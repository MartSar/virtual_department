import React, { useState, useEffect } from "react";
import "../../styles/AddPublication.css";

function AddPublication({ user, onClose }) {
    const [title, setTitle] = useState("");
    const [fileType, setFileType] = useState("");
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [authorName, setAuthorName] = useState(`${user.name} ${user.lastname}`);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [author, setAuthor] = useState(null);

    /* -----------------------------
       Generate file name from title
    ------------------------------ */
    useEffect(() => {
        if (!title) return;
        const ext = fileType || "txt";
        const generated = `${title.toLowerCase().replace(/\s+/g, "_")}.${ext}`;
        setFileName(generated);
    }, [title, fileType]);

    /* -----------------------------
       Fetch author by user_id (unified fetch)
    ------------------------------ */
    useEffect(() => {
        const fetchAuthor = async () => {
            if (user.role === "student") return; // студенты не имеют authors
            try {
                const res = await fetch(`http://localhost:3000/authors/user/${user.user_id}`);
                if (!res.ok) throw new Error("Author not found");
                const data = await res.json();
                setAuthor(data);
            } catch (err) {
                console.error("Failed to fetch author:", err);
            }
        };

        fetchAuthor();
    }, [user]);

    /* -----------------------------
       File handlers
    ------------------------------ */
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

    /* -----------------------------
       Submit
    ------------------------------ */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!title || !file || !fileType) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);

        try {
            let author_id = null;
            let author_type = null;

            if (user.role === "professor" || user.role === "postgraduate") {
                author_id = author?.id;
                author_type = author?.author_type;
                if (!author_id) throw new Error("Author not loaded yet");
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const contentBase64 = reader.result.split(",")[1];

                const response = await fetch(
                    "http://localhost:3000/api/publications/create",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title,
                            file_type: fileType,
                            content: contentBase64,
                            description,
                            file_name: fileName,
                            author_id,
                            author_type
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to create publication");
                }

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
                        File Type
                        <input
                            type="text"
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                            placeholder="pdf, docx, txt"
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
                        <input type="file" hidden onChange={handleFileChange} />
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
                        <button
                            type="submit"
                            className="create-btn"
                            disabled={loading}
                        >
                            {loading ? "Creating..." : "Create Publication"}
                        </button>

                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
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
