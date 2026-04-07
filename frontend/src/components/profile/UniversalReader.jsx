import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
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
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const user = location.state?.user || null;

    const [meta, setMeta] = useState(null);
    const [metaLoading, setMetaLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [error, setError] = useState("");

    const userId = useMemo(() => searchParams.get("user_id") || null, [searchParams]);
    const authorId = useMemo(() => searchParams.get("author_id") || null, [searchParams]);

    const fileUrl = useMemo(() => {
        if (!id) return null;
        if (userId) return `${apiBaseUrl}/api/publications/read/${id}?user_id=${encodeURIComponent(userId)}`;
        if (authorId) return `${apiBaseUrl}/api/publications/authored/${id}?author_id=${encodeURIComponent(authorId)}`;
        return null;
    }, [apiBaseUrl, id, userId, authorId]);

    useEffect(() => {
        const handler = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handler);
        return () => document.removeEventListener("contextmenu", handler);
    }, []);

    useEffect(() => {
        const fetchMeta = async () => {
            if (!id) return;
            try {
                setMetaLoading(true);
                setError("");

                const res = await fetch(`${apiBaseUrl}/api/publications/${id}/meta`);
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
    }, [apiBaseUrl, id]);

    const handleBack = () => {
        if (window.history.length <= 1) navigate("/dashboard");
        else navigate(-1);
    };

    const getFileKind = () => {
        const type = (meta?.file_type || "").toLowerCase();
        const name = (meta?.file_name || "").toLowerCase();
        if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";
        if (type.includes("word") || type.includes("officedocument") || name.endsWith(".docx") || name.endsWith(".doc")) return "word";
        if (type.includes("video/mp4") || name.endsWith(".mp4")) return "video";
        if (name.endsWith(".pptx") || type.includes("presentation")) return "pptx";
        return "unknown";
    };

    const fileKind = getFileKind();

    const changePage = (num) => {
        if (num < 1) num = 1;
        if (num > numPages) num = numPages;
        setPageNumber(num);
    };

    const handleZoom = (factor) => {
        setScale(prev => Math.max(0.5, Math.min(prev + factor, 3)));
    };

    if (!userId && !authorId) {
        return (
            <div className="reader-container">
                <div className="reader-header">
                    <button className="reader-back-btn" onClick={handleBack}>Back</button>
                    <div className="reader-title">Publication #{id}</div>
                    <div className="reader-header-spacer" />
                </div>
                <p className="reader-error">Missing access params (user_id or author_id)</p>
            </div>
        );
    }

    return (
        <>
            <Navbar
                user={user}
                titleOverride={meta?.title || `Publication #${id}`}
                showBackButton={true}
                onBack={handleBack}
            />
            <div className="reader-container">
                <div className="reader-header">
                    <div className="reader-header-spacer" />
                </div>

                {metaLoading && (
                    <div className="section-loader" style={{ marginTop: "2rem" }}>
                        <div className="section-spinner"></div>
                    </div>
                )}

                {error && <div className="reader-error">{error}</div>}

                {!metaLoading && !error && fileUrl && (fileKind === "pdf" || fileKind === "word") && (
                    <>
                        <Document
                            file={fileUrl}
                            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setError(""); }}
                            onLoadError={(e) => { setError(e?.message || "Failed to load document"); setNumPages(null); }}
                            loading={
                                <div className="section-loader" style={{ marginTop: "2rem" }}>
                                    <div className="section-spinner"></div>
                                </div>
                            }
                            error={<div className="reader-error">Failed to render document</div>}
                        >
                            <Page pageNumber={pageNumber} scale={scale} />
                        </Document>

                        {/* Controls */}
                        <div className="reader-pdf-controls">
                            <button onClick={() => changePage(pageNumber - 1)} disabled={pageNumber <= 1}>Prev</button>
                            <span>Page {pageNumber} of {numPages || 1}</span>
                            <button onClick={() => changePage(pageNumber + 1)} disabled={pageNumber >= numPages}>Next</button>
                            <input
                                type="range"
                                min={1}
                                max={numPages || 1}
                                value={pageNumber}
                                onChange={(e) => changePage(Number(e.target.value))}
                                className="reader-page-slider"
                            />
                            <button onClick={() => handleZoom(0.2)}>Zoom +</button>
                            <button onClick={() => handleZoom(-0.2)}>Zoom -</button>
                        </div>
                    </>
                )}

                {fileKind === "video" && (
                    <div className="reader-video-wrapper">
                        <video className="reader-video" controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}>
                            <source src={fileUrl} type="video/mp4" />
                        </video>
                    </div>
                )}

                {fileKind === "pptx" && (
                    <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                        className="reader-iframe"
                        title="pptx-viewer"
                    />
                )}

                {fileKind === "unknown" && (
                    <div className="reader-error">This file type is not supported for preview.</div>
                )}
            </div>
        </>
    );
}