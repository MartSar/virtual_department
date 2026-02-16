import React, { useState, useEffect } from "react";
import "../../styles/UserPublications.css";

const PostgraduateProfessors = ({ userId }) => {
    const [professors, setProfessors] = useState([]);

    useEffect(() => {
        const fetchProfessors = async () => {
            if (!userId) return;

            try {
                const res = await fetch(`http://localhost:3000/postgraduates/${userId}/professors`);
                if (res.status === 404) {
                    setProfessors([]);
                    return;
                }
                const data = await res.json();
                setProfessors(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch professors:", err);
                setProfessors([]);
            }
        };

        fetchProfessors();
    }, [userId]);

    return (
        <section className="borrowed-publications">
            <h2>My Professors</h2>

            {professors.length === 0 ? (
                <p>No assigned professors</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Last Name</th>
                        <th>Faculty</th>
                        <th>University</th>
                        <th>City</th>
                        <th>Country</th>
                    </tr>
                    </thead>
                    <tbody>
                    {professors.map((prof) => (
                        <tr key={prof.id}>
                            <td>{prof.name}</td>
                            <td>{prof.lastname}</td>
                            <td>{prof.faculty?.name || "-"}</td>
                            <td>{prof.university?.name || "-"}</td>
                            <td>{prof.city?.name || "-"}</td>
                            <td>{prof.country?.name || "-"}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};

export default PostgraduateProfessors;
