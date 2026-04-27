import '../../styles/Dashboard.css';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../../components/navbar/Navbar";
import WelcomeNavbar from "../welcome/WelcomeNavbar";
import { API_URL } from '../../config';
import FiltersPanel from "../inner_components/FiltersPanel";
import SearchBar from "../inner_components/SearchBar";
import PublicationModal from "./PublicationModal";

function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false); // true когда мы решили: гость или юзер
    const [publications, setPublications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        topic: "",
        subtopic: "",
        country: "",
        city: "",
        university: "",
        faculty: "",
    });
    const [filterOptions, setFilterOptions] = useState({
        topics: [],
        subtopics: [],
        countries: [],
        cities: [],
        universities: [],
        faculties: []
    });
    const [selectedPublication, setSelectedPublication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingPublications, setLoadingPublications] = useState(true);

    const isGuest = !user;

    // -------------------- Fetch User --------------------
    useEffect(() => {
        const fetchUser = async () => {
            const saved = JSON.parse(localStorage.getItem("loggedUser") || "null");
            const userId = location.state?.user_id ?? location.state?.id ?? saved?.user_id ?? saved?.id;

            // Нет user_id — это гость, продолжаем без редиректа
            if (!userId) {
                setUser(null);
                setUserLoaded(true);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/users/${userId}`);
                if (!res.ok) throw new Error("Failed to load user");
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error("User fetch error:", err);
                // Если userId был, но юзер не загрузился — показываем как гостю
                setUser(null);
            } finally {
                setUserLoaded(true);
            }
        };

        fetchUser();
    }, [location.state, navigate]);

    // -------------------- Fetch Filter Options --------------------
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch(`${API_URL}/filters`);
                const data = await res.json();
                setFilterOptions(data);
            } catch (err) {
                console.error("Failed to fetch filter options:", err);
            }
        };
        fetchOptions();
    }, []);

    // -------------------- Fetch Publications --------------------
    const fetchPublications = async () => {
        try {
            setLoadingPublications(true);

            const res = await fetch(`${API_URL}/publications`);
            const pubs = await res.json();

            const pubsWithLocations = await Promise.all(
                pubs.map(async pub => {
                    const res2 = await fetch(`${API_URL}/publications/${pub.id}/authors-location`);
                    const data = await res2.json();

                    const facultyIds = Array.from(new Set(data.authors.map(a => a.faculty?.faculty_id).filter(Boolean)));
                    const universityIds = Array.from(new Set(data.authors.map(a => a.university?.university_id).filter(Boolean)));
                    const cityIds = Array.from(new Set(data.authors.map(a => a.city?.city_id).filter(Boolean)));
                    const countryIds = Array.from(new Set(data.authors.map(a => a.country?.country_id).filter(Boolean)));

                    return {
                        ...pub,
                        faculty_ids: facultyIds,
                        university_ids: universityIds,
                        city_ids: cityIds,
                        country_ids: countryIds
                    };
                })
            );

            setPublications(pubsWithLocations);
        } catch (err) {
            console.error("Failed to fetch publications:", err);
        } finally {
            setLoadingPublications(false);
        }
    };

    useEffect(() => {
        fetchPublications();
    }, []);

    // -------------------- Filter Publications --------------------
    const filteredPublications = publications.filter((pub) => {
        const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTopic = !filters.topic || pub.topic_id === Number(filters.topic);
        const matchesSubtopic = !filters.subtopic || pub.subtopic_id === Number(filters.subtopic);
        const matchesCountry = !filters.country || pub.country_ids.includes(Number(filters.country));
        const matchesCity = !filters.city || pub.city_ids.includes(Number(filters.city));
        const matchesUniversity = !filters.university || pub.university_ids.includes(Number(filters.university));
        const matchesFaculty = !filters.faculty || pub.faculty_ids.includes(Number(filters.faculty));

        return matchesSearch && matchesTopic && matchesSubtopic &&
            matchesCountry && matchesCity && matchesUniversity && matchesFaculty;
    });

    // -------------------- Modal Handlers --------------------
    const openPublication = (pub) => {
        setSelectedPublication(pub);
        setIsModalOpen(true);
    };

    const closePublication = () => {
        setIsModalOpen(false);
        setSelectedPublication(null);
    };

    // -------------------- Render --------------------
    if (!userLoaded) {
        return (
            <div className="spinner-circle"></div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            {isGuest ? <WelcomeNavbar /> : <Navbar user={user} />}
            <div className="main-content">
                <div className="dashboard-layout">
                    <FiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        options={filterOptions}
                    />

                    <div className="dashboard-container centered">
                        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                        <h2>Publications</h2>
                        {loadingPublications ? (
                            <div className="loader-wrapper">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredPublications.length === 0 ? (
                            <p>No publications found.</p>
                        ) : (
                            <ul className="publications-list">
                                {filteredPublications.map(pub => (
                                    <li
                                        key={pub.id}
                                        className="publication-item clickable"
                                        onClick={() => openPublication(pub)}
                                    >
                                        <strong>{pub.title}</strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {isModalOpen && selectedPublication && (
                        <PublicationModal
                            publication={selectedPublication}
                            onClose={closePublication}
                            user={user}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;