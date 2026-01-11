import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";
import BorrowedPublications from "./student/BorrowedPublications";
import AuthoredPublications from "./author/AuthoredPublications";
import "../../styles/UserProfile.css";

function UserProfile() {
    const { id } = useParams();
    const location = useLocation();

    const [profileUser, setProfileUser] = useState(null);
    const [authorId, setAuthorId] = useState(null);
    const [student, setStudent] = useState(null);
    const [authorLocation, setAuthorLocation] = useState(null);
    const [studentLocation, setStudentLocation] = useState(null);

    const loggedUser =
        location.state?.loggedUser ||
        JSON.parse(localStorage.getItem("loggedUser"));

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Получаем профиль пользователя
                const resUser = await fetch(`http://localhost:3000/users/${id}`);
                const profile = await resUser.json();
                setProfileUser(profile);

                if (profile.role === 'student') {
                    // Получаем данные студента
                    const resStudent = await fetch(`http://localhost:3000/students/user/${profile.id}`);
                    const studentData = await resStudent.json();
                    setStudent(studentData);

                    // Получаем цепочку факультет → университет → город → страна
                    const resLocation = await fetch(`http://localhost:3000/students/${studentData.id}/location`);
                    const locationData = await resLocation.json();
                    setStudentLocation(locationData);
                }

                if (profile.role === 'professor' || profile.role === 'postgraduate') {
                    // Получаем author_id
                    const resAuthor = await fetch(`http://localhost:3000/authors/user/${profile.id}`);
                    const authorData = await resAuthor.json();
                    setAuthorId(authorData.id);

                    // Получаем цепочку факультет → университет → город → страна
                    const resLocation = await fetch(`http://localhost:3000/authors/${authorData.id}/location`);
                    const locationData = await resLocation.json();
                    setAuthorLocation(locationData);
                }
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            }
        };

        fetchProfileData();
    }, [id]);

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
                        setProfileUser(prev => ({ ...prev, avatar: newAvatar }))
                    }
                />
                <ProfileInfo
                    user={profileUser}
                    authorLocation={authorLocation || {}}
                    studentLocation={studentLocation || {}}
                />

                {isStudent && student && (
                    <BorrowedPublications studentId={student.id} />
                )}

                {isAuthor && authorId && (
                    <AuthoredPublications authorId={authorId}/>
                )}
            </div>
        </>
    );
}

export default UserProfile;
