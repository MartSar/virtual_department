import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";
import BorrowedPublications from "./student/BorrowedPublications";
import ProfessorPostgraduates from "./ProfessorPostgraduates";
import PostgraduateProfessors from "./PostgraduateProfessors";
import AuthoredPublications from "./author/AuthoredPublications";
import CoAuthoredPublications from "./author/CoAuthoredPublications";
import "../../styles/UserProfile.css";

function UserProfile() {
    const { id: userId } = useParams();
    const routerLocation = useLocation();

    const [profileUser, setProfileUser] = useState(null);
    const [student, setStudent] = useState(null);
    const [postgraduate, setPostgraduate] = useState(null);
    const [professor, setProfessor] = useState(null);

    const [authorId, setAuthorId] = useState(null);
    const [location, setLocation] = useState(null);

    const loggedUser =
        routerLocation.state?.loggedUser ||
        JSON.parse(localStorage.getItem("loggedUser"));

    useEffect(() => {
        if (!userId) return;

        // -------------------
        // Вспомогательные функции
        // -------------------
        const fetchLocation = async (url) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return null;
                return await res.json();
            } catch {
                return null;
            }
        };

        console.log(userId)

        const fetchAuthorId = async (userId) => {
            try {
                const res = await fetch(`http://localhost:3000/authors/user/${userId}`);
                if (!res.ok) return null;
                const data = await res.json();
                console.log(data)
                return data?.id || null;
            } catch {
                return null;
            }
        };

        // -------------------
        // Основная функция
        // -------------------
        const fetchProfileData = async () => {
            try {
                // USER
                const userRes = await fetch(`http://localhost:3000/users/${userId}`);
                if (!userRes.ok) throw new Error("User not found");
                const userData = await userRes.json();
                setProfileUser(userData);

                // STUDENT
                if (userData.role === "student") {
                    const studentRes = await fetch(`http://localhost:3000/students/user/${userId}`);
                    const studentData = await studentRes.json();
                    setStudent(studentData);

                    const loc = await fetchLocation(`http://localhost:3000/students/${studentData.id}/location`);
                    setLocation(loc);
                }

                // POSTGRADUATE
                if (userData.role === "postgraduate") {
                    const postgraduateRes = await fetch(`http://localhost:3000/postgraduates/user/${userId}`);
                    const postgraduateData = await postgraduateRes.json();
                    setPostgraduate(postgraduateData);

                    const loc = await fetchLocation(`http://localhost:3000/postgraduates/${postgraduateData.id}/location`);
                    setLocation(loc);

                    // AUTHOR ID
                    const id = await fetchAuthorId(userId);
                    setAuthorId(id);
                }

                // PROFESSOR
                if (userData.role === "professor") {
                    const professorRes = await fetch(`http://localhost:3000/professors/user/${userId}`);
                    const professorData = await professorRes.json();
                    setProfessor(professorData);

                    const loc = await fetchLocation(`http://localhost:3000/professors/${professorData.id}/location`);
                    setLocation(loc);

                    // AUTHOR ID
                    const id = await fetchAuthorId(userId);
                    setAuthorId(id);
                }

            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            }
        };

        fetchProfileData();
    }, [userId]);

    if (!profileUser || !loggedUser) {
        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
    }

    const isStudent = profileUser.role === "student";
    const isPostgraduate = profileUser.role === "postgraduate";
    const isProfessor = profileUser.role === "professor";

    const isAuthor =
        profileUser.role === "professor" ||
        profileUser.role === "postgraduate";

    return (
        <>
            <Navbar user={loggedUser} />

            <div className="user-profile">
                <ProfileHeader
                    user={profileUser}
                    onAvatarChange={(avatar) =>
                        setProfileUser((prev) => ({ ...prev, avatar }))
                    }
                />

                <ProfileInfo
                    user={profileUser}
                    studentLocation={isStudent ? location : null}
                    postgraduateLocation = {isPostgraduate ? location : null}
                    professorLocation = {isProfessor ? location : null}
                />

                {profileUser.role === "professor" && (
                    <ProfessorPostgraduates userId={profileUser.id} />
                )}

                {profileUser.role === "postgraduate" && (
                    <PostgraduateProfessors userId={profileUser.id} />
                )}

                {isStudent && student && (
                    <BorrowedPublications studentId={student.id} />
                )}

                {isAuthor && authorId && (
                    <>
                        <AuthoredPublications authorId={authorId}/>
                        <CoAuthoredPublications authorId={authorId}/>
                    </>
                )}
            </div>
        </>
    );
}

export default UserProfile;
