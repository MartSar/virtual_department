import '../../styles/RegisterForm.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFields from "../inner_components/FormFields";
import { handleRegister } from "../../handlers";

function RegisterForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const [universities, setUniversities] = useState([]);
    const [universityId, setUniversityId] = useState('');

    const [faculties, setFaculties] = useState([]);
    const [facultyId, setFacultyId] = useState('');

    const navigate = useNavigate();

    // load universities
    useEffect(() => {
        fetch('http://localhost:3000/universities')
            .then(res => res.json())
            .then(data => setUniversities(data))
            .catch(err => console.error(err));
    }, []);

    // load faculties
    useEffect(() => {
        fetch('http://localhost:3000/faculties')
            .then(res => res.json())
            .then(data => setFaculties(data))
            .catch(err => console.error(err));
    }, []);

    // reset selects when role changes
    useEffect(() => {
        setUniversityId('');
        setFacultyId('');
    }, [role]);

    return (
        <div className="auth-container">
            <h1>Virtual Department</h1>
            <h2>Registration</h2>

            <FormFields
                role={role} setRole={setRole}
                name={name} setName={setName}
                lastname={lastname} setLastname={setLastname}
                password={password} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}

                universities={universities}
                universityId={universityId}
                setUniversityId={setUniversityId}

                faculties={faculties}
                facultyId={facultyId}
                setFacultyId={setFacultyId}
            />

            <div className="register-btns-container">
                <button
                    className="back-to-sign-in-btn"
                    onClick={() => navigate('/')}
                >
                    Back to Sign In
                </button>

                <button
                    className="set-acc-btn"
                    onClick={() =>
                        handleRegister({
                            role,
                            name,
                            lastname,
                            password,
                            university_id: role === 'student' ? universityId : null,
                            faculty_id: role !== 'student' ? facultyId : null,
                            setMessage,
                            navigate
                        })
                    }
                >
                    Set an Account
                </button>
            </div>

            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default RegisterForm;
