import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {API_URL} from "../../config";
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
    const [location, setLocation] = useState(null);

    const loggedUser =
        routerLocation.state?.loggedUser ||
        JSON.parse(localStorage.getItem("loggedUser"));

    useEffect(() => {
        if (!userId) return;

        const fetchProfileData = async () => {
            try {
                const userRes = await fetch(`${API_URL}/users/${userId}`);
                if (!userRes.ok) throw new Error("User not found");
                const userData = await userRes.json();
                setProfileUser(userData);

                // если location реально нужно
                const locRes = await fetch(`${API_URL}/users/${userId}/location`);
                setLocation(locRes.ok ? await locRes.json() : null);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            }
        };

        fetchProfileData();
    }, [userId]);

    if (!profileUser || !loggedUser) {
        return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
    }

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

                <ProfileInfo user={profileUser} location={location} />

                {profileUser.role === "student" && (
                    <BorrowedPublications userId={profileUser.id} />
                )}

                {profileUser.role === "professor" && (
                    <ProfessorPostgraduates userId={profileUser.id} />
                )}

                {profileUser.role === "postgraduate" && (
                    <PostgraduateProfessors userId={profileUser.id} />
                )}

                <AuthoredPublications userId={profileUser.id} />
                <CoAuthoredPublications userId={profileUser.id} />
            </div>
        </>
    );
}

export default UserProfile;
