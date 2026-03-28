import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { API_URL } from "../../config";
import { Document, Page, pdfjs } from "react-pdf";
import Navbar from '../navbar/Navbar';
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../../styles/UniversalReader.css";

pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function UniversalReader({ apiBaseUrl = API_URL }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const user = location.state?.user; // получили user из state

    const [meta, setMeta] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState("");

    const userId = useMemo(() => user?.id, [user]);

    const fileUrl = useMemo(() => {
        if (!id || !userId) return null;
        return `${apiBaseUrl}/api/publications/read/${id}?user_id=${encodeURIComponent(userId)}`;
    }, [apiBaseUrl, id, userId]);

    useEffect(() => {
        document.addEventListener("contextmenu", (e) => e.preventDefault());
        return () => document.removeEventListener("contextmenu", (e) => e.preventDefault());
    }, []);

    useEffect(() => {
        const fetchMeta = async () => {
            if (!userId) return;
            try {
                setMetaLoading(true);
                setError("");

                const res = await fetch(`${apiBaseUrl}/api/publications/${id}/meta?user_id=${encodeURIComponent(userId)}`);
                const data = await res.json().catch(() => ({}));

                if (!res.ok) throw new Error(data.error || "Failed to fetch file metadata");
                setMeta(data);
            } catch (err) {
                console.error(err);
                setError(err.message || "Failed to fetch file metadata");
            } finally {
                setMetaLoading(false);
            }
        };

        fetchMeta();
    }, [apiBaseUrl, id, userId]);

    const handleBack = () => navigate(-1);

    const getFileKind = () => {
        const type = (meta?.file_type || "").toLowerCase();
        const name = (meta?.file_name || "").toLowerCase();

        if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
        if (type.includes("word") || type.includes("officedocument") || name.endsWith(".docx") || name.endsWith(".doc")) return "word";
        if (type.includes("video/mp4") || name.endsWith(".mp4")) return "video";
        return "unknown";
    };

    const fileKind = getFileKind();

    if (!userId) {
        return <p style={{ textAlign: "center" }}>Missing user info to open publication</p>;
    }

    return (
        <>
            <Navbar user={user} />
            <div className="reader-container">
                <div className="reader-header">
                    <button className="reader-back-btn" onClick={handleBack}>← Back</button>
                    <div className="reader-title">{meta?.title || `Publication #${id}`}</div>
                </div>

                {metaLoading && <div className="reader-loading">Loading document...</div>}
                {error && <div className="reader-error">{error}</div>}

                {!metaLoading && !error && fileUrl && (
                    <div className="reader-content">
                        {(fileKind === "pdf" || fileKind === "word") && (
                            <Document
                                file={fileUrl}
                                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                                onLoadError={(e) => { setError(e?.message || "Failed to load document"); setNumPages(null); }}
                                loading={<div className="reader-loading">Loading document...</div>}
                                error={<div className="reader-error">Failed to render document</div>}
                            >
                                {numPages && Array.from({ length: numPages }, (_, i) => (
                                    <div key={i} className="reader-page-wrapper">
                                        <Page pageNumber={i + 1} scale={1.2} />
                                    </div>
                                ))}
                            </Document>
                        )}
                        {fileKind === "video" && (
                            <video className="reader-video" controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}>
                                <source src={fileUrl} type="video/mp4" />
                            </video>
                        )}
                        {fileKind === "unknown" && <div className="reader-error">This file type is not supported for preview.</div>}
                    </div>
                )}
            </div>
        </>
    );
}