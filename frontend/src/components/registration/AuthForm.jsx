import '../../styles/AuthForm.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFields from "../inner_components/FormFields";
import { handleSignIn } from "../../handlers";

function AuthForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [login, setLogin] = useState('');

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const [universities, setUniversities] = useState([]);

    const [faculties, setFaculties] = useState([]);
    const [faculty_id, setFaculty_id] = useState('');

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

    // reset selects on role change
    useEffect(() => {
        setFaculty_id('');
    }, [role]);

    return (
        <div className="auth-container">
            <h1>Virtual Department</h1>
            <h2>Sign In</h2>

            <FormFields
                role={role} setRole={setRole}
                name={name} setName={setName}
                lastname={lastname} setLastname={setLastname}
                login={login} setLogin={setLogin}

                password={password} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}

                universities={universities}

                faculties={faculties}
                faculty_id={faculty_id}
                setFaculty_id={setFaculty_id}
            />

            <div className="auth-btns-container">
                <button
                    className="sign-up-btn"
                    onClick={() => navigate('/register')}
                >
                    Sign Up
                </button>

                <button
                    className="sign-in-btn"
                    onClick={() =>
                        handleSignIn({
                            role,
                            name,
                            lastname,
                            login,
                            password,
                            universities,
                            faculty_id,
                            setMessage,
                            navigate
                        })
                    }
                >
                    Sign In
                </button>
            </div>

            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default AuthForm;
