import React, { useState, useEffect } from "react";
import "../../styles/UserPublications.css";

const PostgraduateProfessors = ({ userId }) => {
    const [postgraduateId, setPostgraduateId] = useState(null);
    const [professors, setProfessors] = useState([]);

    // -------------------
    // Получаем id аспиранта по userId
    // -------------------
    useEffect(() => {
        const fetchPostgraduateId = async () => {
            try {
                const res = await fetch(`http://localhost:3000/postgraduates/user/${userId}`);
                const data = await res.json();

                setPostgraduateId(data.id);
            } catch (err) {
                console.error("Failed to fetch postgraduateId:", err);
            }
        };
        fetchPostgraduateId();
    }, [userId]);

    // -------------------
    // Получаем профессоров по postgraduateId
    // -------------------
    useEffect(() => {
        const fetchProfessors = async () => {
            if (!postgraduateId) return;

            try {
                const res = await fetch(
                    `http://localhost:3000/postgraduates/${postgraduateId}/professors`
                );
                const data = await res.json();
                setProfessors(data);
            } catch (err) {
                console.error("Failed to fetch professors:", err);
            }
        };
        fetchProfessors();
    }, [postgraduateId]);

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
                            <td>{prof.faculty?.name || '-'}</td>
                            <td>{prof.university?.name || '-'}</td>
                            <td>{prof.city?.name || '-'}</td>
                            <td>{prof.country?.name || '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
};

export default PostgraduateProfessors;
