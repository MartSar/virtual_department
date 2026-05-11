import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "../../config";

// Colors for each topic ring (matching project palette + extras)
const TOPIC_COLORS = [
    "#e53935", // red - Informatika
    "#FB8C00", // orange - Pedagogika
    "#FDD835", // yellow - Ekonomika
    "#43A047", // green - Matematika
    "#1E88E5", // blue - Technické vedy
    "#8E24AA", // purple - Manažment
];

const RING_INNER_RATIO = 0.28; // how big the center hole is (fraction of radius)

function RadialPublicationsChart() {
    const [topics, setTopics] = useState([]);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredTopic, setHoveredTopic] = useState(null);
    const [hoveredPub, setHoveredPub] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: "" });
    const svgRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topicsRes, pubsRes] = await Promise.all([
                    fetch(`${API_URL}/central_topics`),
                    fetch(`${API_URL}/publications`),
                ]);
                const topicsData = await topicsRes.json();
                const pubsData = await pubsRes.json();
                setTopics(topicsData);
                setPublications(pubsData);
            } catch (err) {
                console.error("Chart fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "60px", color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                Loading chart data...
            </div>
        );
    }

    if (topics.length === 0 || publications.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
                No publication data available yet.
            </div>
        );
    }

    // Group publications by topic
    const byTopic = {};
    topics.forEach((t) => { byTopic[t.id] = []; });
    publications.forEach((p) => {
        if (p.topic_id && byTopic[p.topic_id] !== undefined) {
            byTopic[p.topic_id].push(p);
        }
    });

    // Only show topics that have publications
    const activeTopics = topics.filter((t) => byTopic[t.id].length > 0);

    const size = 480;
    const cx = size / 2;
    const cy = size / 2;
    const outerRadius = size / 2 - 10;
    const innerRadius = outerRadius * RING_INNER_RATIO;

    // Each topic gets a ring band
    const ringCount = activeTopics.length;
    const ringWidth = (outerRadius - innerRadius) / ringCount;

    // Each ring: divided into slices per publication
    const paths = [];

    activeTopics.forEach((topic, topicIdx) => {
        const pubs = byTopic[topic.id];
        const n = pubs.length;
        if (n === 0) return;

        const rInner = innerRadius + topicIdx * ringWidth;
        const rOuter = rInner + ringWidth - 2; // 2px gap between rings

        const color = TOPIC_COLORS[topicIdx % TOPIC_COLORS.length];
        const sliceAngle = (2 * Math.PI) / n;

        pubs.forEach((pub, pubIdx) => {
            const startAngle = pubIdx * sliceAngle - Math.PI / 2;
            const endAngle = startAngle + sliceAngle - 0.015; // tiny gap between slices

            const x1 = cx + rInner * Math.cos(startAngle);
            const y1 = cy + rInner * Math.sin(startAngle);
            const x2 = cx + rOuter * Math.cos(startAngle);
            const y2 = cy + rOuter * Math.sin(startAngle);
            const x3 = cx + rOuter * Math.cos(endAngle);
            const y3 = cy + rOuter * Math.sin(endAngle);
            const x4 = cx + rInner * Math.cos(endAngle);
            const y4 = cy + rInner * Math.sin(endAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;

            const d = [
                `M ${x1} ${y1}`,
                `L ${x2} ${y2}`,
                `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x3} ${y3}`,
                `L ${x4} ${y4}`,
                `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1} ${y1}`,
                "Z",
            ].join(" ");

            const isHoveredTopic = hoveredTopic === topic.id;
            const isHoveredPub = hoveredPub === pub.id;
            const opacity = hoveredTopic === null ? 1
                : isHoveredTopic ? 1 : 0.25;

            // Label: number inside the slice
            const midAngle = (startAngle + endAngle) / 2;
            const labelR = (rInner + rOuter) / 2;
            const lx = cx + labelR * Math.cos(midAngle);
            const ly = cy + labelR * Math.sin(midAngle);
            const showLabel = sliceAngle > 0.18; // only if slice is big enough

            paths.push(
                <g key={`${topic.id}-${pub.id}`}>
                    <path
                        d={d}
                        fill={color}
                        opacity={opacity}
                        stroke={isHoveredPub ? "#fff" : "rgba(255,255,255,0.3)"}
                        strokeWidth={isHoveredPub ? 2 : 0.5}
                        style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => {
                            setHoveredTopic(topic.id);
                            setHoveredPub(pub.id);
                            const rect = svgRef.current.getBoundingClientRect();
                            setTooltip({
                                visible: true,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                content: pub.title || "Untitled",
                                topic: topic.name,
                                color,
                            });
                        }}
                        onMouseLeave={() => {
                            setHoveredTopic(null);
                            setHoveredPub(null);
                            setTooltip({ visible: false });
                        }}
                    />
                    {showLabel && (
                        <text
                            x={lx}
                            y={ly}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="8"
                            fill="rgba(255,255,255,0.85)"
                            style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                            {pubIdx + 1}
                        </text>
                    )}
                </g>
            );
        });
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            {/* Chart */}
            <div style={{ position: "relative" }}>
                <svg
                    ref={svgRef}
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ maxWidth: "100%", overflow: "visible" }}
                >
                    {/* Background circle */}
                    <circle cx={cx} cy={cy} r={outerRadius} fill="#f0f0f0" />

                    {/* Slices */}
                    {paths}

                    {/* Center hole */}
                    <circle cx={cx} cy={cy} r={innerRadius - 2} fill="white" />

                    {/* Center text */}
                    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#333">
                        {publications.length}
                    </text>
                    <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="#666">
                        publications
                    </text>
                </svg>

                {/* Tooltip */}
                {tooltip.visible && (
                    <div style={{
                        position: "absolute",
                        left: tooltip.x + 12,
                        top: tooltip.y - 10,
                        background: "rgba(30,30,47,0.95)",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        maxWidth: 220,
                        pointerEvents: "none",
                        zIndex: 10,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                        borderLeft: `3px solid ${tooltip.color}`,
                    }}>
                        <div style={{ fontWeight: "bold", marginBottom: 3, color: tooltip.color }}>
                            {tooltip.topic}
                        </div>
                        <div style={{ lineHeight: 1.4 }}>{tooltip.content}</div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 20px",
                justifyContent: "center",
                maxWidth: 500,
            }}>
                {activeTopics.map((topic, idx) => (
                    <div
                        key={topic.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            cursor: "pointer",
                            opacity: hoveredTopic === null || hoveredTopic === topic.id ? 1 : 0.4,
                            transition: "opacity 0.2s",
                        }}
                        onMouseEnter={() => setHoveredTopic(topic.id)}
                        onMouseLeave={() => setHoveredTopic(null)}
                    >
                        <div style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: TOPIC_COLORS[idx % TOPIC_COLORS.length],
                            flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 13, color: "#444" }}>
                            {topic.name}
                            <span style={{ color: "#999", marginLeft: 4 }}>
                                ({byTopic[topic.id].length})
                            </span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RadialPublicationsChart;
