import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";
import BorrowedPublications from "./student/BorrowedPublications";
import AuthoredPublications from "./author/AuthoredPublications";
import ProfessorPostgraduates from "./ProfessorPostgraduates";
import PostgraduateProfessors from "./PostgraduateProfessors";
import "../../styles/UserProfile.css";

function UserProfile() {
    const { id } = useParams();
    const profile_location = useLocation();

    const [profileUser, setProfileUser] = useState(null);
    const [authorId, setAuthorId] = useState(null);
    const [student, setStudent] = useState(null);
    const [location, setLocation] = useState(null);

    // --- For Professors ---
    const [postgraduates, setPostgraduates] = useState([]);
    const [allPostgraduates, setAllPostgraduates] = useState([]);
    const [newPgId, setNewPgId] = useState("");

    const loggedUser =
        profile_location.state?.loggedUser ||
        JSON.parse(localStorage.getItem("loggedUser"));

    // Функция для обновления списка аспирантов профессора
    const fetchPostgraduates = async () => {
        if (profileUser?.role !== "professor") return;

        try {
            const resAssigned = await fetch(
                `http://localhost:3000/professor_postgraduates/${profileUser.id}`
            );
            const assignedData = await resAssigned.json();
            setPostgraduates(assignedData);

            const resAll = await fetch(`http://localhost:3000/postgraduates`);
            const allData = await resAll.json();
            setAllPostgraduates(allData);
        } catch (err) {
            console.error("Failed to fetch postgraduates:", err);
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const resUser = await fetch(`http://localhost:3000/users/${id}`);
                const profile = await resUser.json();
                setProfileUser(profile);

                if (profile.role === "student") {
                    const resStudent = await fetch(
                        `http://localhost:3000/students/user/${profile.id}`
                    );
                    const studentData = await resStudent.json();
                    setStudent(studentData);

                    const resLocation = await fetch(
                        `http://localhost:3000/students/${studentData.id}/location`
                    );
                    const locationData = await resLocation.json();
                    setLocation(locationData);
                }

                if (profile.role === "professor" || profile.role === "postgraduate") {
                    const resAuthor = await fetch(
                        `http://localhost:3000/authors/user/${profile.id}`
                    );
                    const authorData = await resAuthor.json();
                    setAuthorId(authorData.id);

                    const resLocation = await fetch(
                        `http://localhost:3000/authors/${authorData.id}/location`
                    );
                    const locationData = await resLocation.json();
                    setLocation(locationData);
                }

                if (profile.role === "professor") {
                    fetchPostgraduates();
                }

                if (profile.role === "postgraduate") {
                    const resProf = await fetch(
                        `http://localhost:3000/postgraduates/${profile.id}/professor`
                    );
                    const dataProf = await resProf.json();
                    setPostgraduates([dataProf]);
                }
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            }
        };

        fetchProfileData();
    }, [id]);

    const handleAssignPG = async () => {
        if (!newPgId) return;
        try {
            const res = await fetch(
                `http://localhost:3000/professors/${id}/postgraduates`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postgraduate_id: newPgId }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to assign postgraduate");

            fetchPostgraduates(); // обновляем список после назначения
            setNewPgId("");
        } catch (err) {
            alert(err.message);
        }
    };

    if (!profileUser || !loggedUser) {
        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
    }

    const isStudent = profileUser.role === "student";
    const isAuthor = profileUser.role === "professor" || profileUser.role === "postgraduate";

    return (
        <>
            <Navbar user={loggedUser} />

            <div className="user-profile">
                <ProfileHeader
                    user={profileUser}
                    onAvatarChange={(newAvatar) =>
                        setProfileUser((prev) => ({ ...prev, avatar: newAvatar }))
                    }
                />
                <ProfileInfo
                    user={profileUser}
                    studentLocation={isStudent ? location : null}
                    authorLocation={isAuthor ? location : null}

                />

                {profileUser.role === "professor" && (
                    <ProfessorPostgraduates
                        userId={profileUser.id}
                    />
                )}

                {profileUser.role === "postgraduate" && (
                    <PostgraduateProfessors
                        userId={profileUser.id}
                    />
                )}

                {isStudent && student && (
                    <BorrowedPublications studentId={student.id} />
                )}

                {isAuthor && authorId && (
                    <AuthoredPublications authorId={authorId} />
                )}

            </div>
        </>
    );
}

export default UserProfile;
