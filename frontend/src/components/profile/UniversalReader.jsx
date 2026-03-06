import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../../styles/UniversalReader.css";

pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function UniversalReader({ apiBaseUrl = "http://localhost:3000" }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [meta, setMeta] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState("");

    const userId = useMemo(() => {
        const value = searchParams.get("user_id");
        return value ? String(value) : null;
    }, [searchParams]);

    const fileUrl = useMemo(() => {
        if (!userId) return null;
        return `${apiBaseUrl}/api/publications/read/${id}?user_id=${encodeURIComponent(userId)}`;
    }, [apiBaseUrl, id, userId]);

    useEffect(() => {
        const handler = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handler);
        return () => document.removeEventListener("contextmenu", handler);
    }, []);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                setMetaLoading(true);
                setError("");

                const res = await fetch(`${apiBaseUrl}/api/publications/${id}/meta`);
                const data = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch file metadata");
                }

                setMeta(data);
            } catch (err) {
                console.error(err);
                setError(err.message || "Failed to fetch file metadata");
            } finally {
                setMetaLoading(false);
            }
        };

        fetchMeta();
    }, [apiBaseUrl, id]);

    const handleBack = () => {
        if (window.history.length <= 1) {
            navigate("/dashboard");
        } else {
            navigate(-1);
        }
    };

    const getFileKind = () => {
        const type = (meta?.file_type || "").toLowerCase();
        const name = (meta?.file_name || "").toLowerCase();

        if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";

        if (
            type.includes("word") ||
            type.includes("officedocument") ||
            type.includes("docx") ||
            type.includes("doc") ||
            name.endsWith(".docx") ||
            name.endsWith(".doc")
        ) {
            return "word";
        }

        if (type.includes("video/mp4") || name.endsWith(".mp4")) return "video";

        return "unknown";
    };

    const fileKind = getFileKind();

    if (!userId) {
        return (
            <div className="reader-container">
                <div className="reader-header">
                    <button className="reader-back-btn" onClick={handleBack}>
                        ← Back
                    </button>
                    <div className="reader-title">Publication #{id}</div>
                    <div className="reader-header-spacer" />
                </div>

                <p className="reader-error">Missing user_id in URL</p>
            </div>
        );
    }

    return (
        <div className="reader-container">
            <div className="reader-header">
                <button className="reader-back-btn" onClick={handleBack}>
                    ← Back
                </button>

                <div className="reader-title">
                    {meta?.title || `Publication #${id}`}
                </div>

                <div className="reader-header-spacer" />
            </div>

            {metaLoading && <div className="reader-loading">Loading document...</div>}
            {error && <div className="reader-error">{error}</div>}

            {!metaLoading && !error && fileUrl && (
                <div className="reader-content">
                    {(fileKind === "pdf" || fileKind === "word") && (
                        <Document
                            file={fileUrl}
                            onLoadSuccess={({ numPages }) => {
                                setNumPages(numPages);
                                setError("");
                            }}
                            onLoadError={(e) => {
                                setError(e?.message || "Failed to load document");
                                setNumPages(null);
                            }}
                            loading={<div className="reader-loading">Loading document...</div>}
                            error={<div className="reader-error">Failed to render document</div>}
                        >
                            {numPages &&
                                Array.from({ length: numPages }, (_, i) => (
                                    <div key={i} className="reader-page-wrapper">
                                        <Page pageNumber={i + 1} scale={1.2} />
                                    </div>
                                ))}
                        </Document>
                    )}

                    {fileKind === "video" && (
                        <div className="reader-video-wrapper">
                            <video
                                className="reader-video"
                                controls
                                controlsList="nodownload"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                <source src={fileUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                    {fileKind === "unknown" && (
                        <div className="reader-error">
                            This file type is not supported for preview.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}