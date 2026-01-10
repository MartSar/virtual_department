import React from "react";
import "../../../styles/Avatar.css";

export default function Avatar({ name, lastname, size = 40, src }) {
    if (src) {
        return (
            <img
                src={src}
                alt={`${name} ${lastname}`}
                className="avatar"
                style={{ width: size, height: size }}
            />
        );
    }

    const initials = `${name?.[0] || ""}${lastname?.[0] || ""}`.toUpperCase();
    return (
        <div
            className="avatar"
            style={{
                width: size,
                height: size,
                fontSize: Math.floor(size / 2),
            }}
        >
            {initials}
        </div>
    );
}
