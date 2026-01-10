import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import ProfileHeader from "./common/ProfileHeader";
import ProfileInfo from "./common/ProfileInfo";
import BorrowedPublications from "./student/BorrowedPublications";

function UserProfile() {
    const { id } = useParams();
    const location = useLocation();

    const [profileUser, setProfileUser] = useState(null);
    const [student, setStudent] = useState(null);

    const loggedUser =
        location.state?.loggedUser ||
        JSON.parse(localStorage.getItem("loggedUser"));

    useEffect(() => {
        fetch(`http://localhost:3000/users/${id}`)
            .then(res => res.json())
            .then(data => setProfileUser(data))
            .catch(err => console.error('Failed to fetch user:', err));
    }, [id]);

    useEffect(() => {
        if (profileUser?.role === 'student' && profileUser.id) {
            fetch(`http://localhost:3000/students/user/${profileUser.id}`)
                .then(res => res.json())
                .then(data => setStudent(data))
                .catch(err => console.error('Failed to fetch student:', err));
        }
    }, [profileUser]);

    if (!profileUser || !loggedUser) {
        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
    }

    const isStudent = profileUser.role === "student";

    return (
        <>
            <Navbar user={loggedUser} />

            <div className="user-profile">
                <ProfileHeader user={profileUser} />
                <ProfileInfo user={profileUser} />

                {isStudent && student && (
                    <BorrowedPublications studentId={student.id} />
                )}
            </div>
        </>
    );
}

export default UserProfile;
