import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./../../styles/UniversalReader.css";

pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function UniversalReader({ apiBaseUrl = "http://localhost:3000" }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState("");

    const userId = useMemo(() => {
        const v = searchParams.get("user_id");
        return v ? String(v) : null;
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

    if (!userId) {
        return (
            <div style={{ padding: 20 }}>
                <button onClick={() => navigate(-1)}>Back</button>
                <p style={{ color: "red" }}>Missing user_id in URL</p>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f4f6f9",
                padding: "30px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            {/* Header */}
            <div
                style={{
                    width: "100%",
                    maxWidth: 1000,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#2c3e50",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    ← Back
                </button>

                <div style={{ fontWeight: 600, fontSize: 18 }}>
                    Publication #{id}
                </div>

                <div style={{ width: 80 }} /> {/* spacing */}
            </div>

            {error && (
                <div style={{ color: "red", marginBottom: 15 }}>{error}</div>
            )}

            {/* PDF Container */}
            <div
                style={{
                    width: "100%",
                    maxWidth: 900,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 30,
                }}
            >
                {fileUrl && (
                    <Document
                        file={fileUrl}
                        onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages);
                            setError("");
                        }}
                        onLoadError={(e) =>
                            setError(e?.message || "Failed to load PDF")
                        }
                        loading={<div>Loading document...</div>}
                    >
                        {numPages &&
                            Array.from({ length: numPages }, (_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "white",
                                        padding: 20,
                                        borderRadius: 12,
                                        boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
                                    }}
                                >
                                    <Page pageNumber={i + 1} scale={1.2} />
                                </div>
                            ))}
                    </Document>
                )}
            </div>
        </div>
    );
}