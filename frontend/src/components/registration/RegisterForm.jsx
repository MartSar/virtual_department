import '../../styles/RegisterForm.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFields from "../inner_components/FormFields";
import { handleRegister } from "../../handlers";
import {API_URL} from "../../config";

function RegisterForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [login, setLogin] = useState('');

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const [universities, setUniversities] = useState([]);

    const [faculties, setFaculties] = useState([]);
    const [faculty_id, setFaculty_id] = useState('');

    const navigate = useNavigate();

    // load universities
    useEffect(() => {
        fetch(`${API_URL}/universities`)
            .then(res => res.json())
            .then(data => setUniversities(data))
            .catch(err => console.error(err));
    }, []);

    // load faculties
    useEffect(() => {
        fetch(`${API_URL}/faculties`)
            .then(res => res.json())
            .then(data => setFaculties(data))
            .catch(err => console.error(err));
    }, []);

    // reset selects when role changes
    useEffect(() => {
        setFaculty_id('');
    }, [role]);

    return (
        <div className="auth-container">
            <h1>Virtual Department</h1>
            <h2>Registration</h2>
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

                requiredFieldType={"registration"}
            />

            <div className="register-btns-container">
                <button
                    className="back-to-sign-in-btn"
                    onClick={() => navigate('/auth')}
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
                            login,
                            password,
                            faculty_id,
                            setMessage,
                            setMessageType,
                            navigate
                        })
                    }
                >
                    Set an Account
                </button>
            </div>

            {message && <p className={`auth-message ${messageType}`}>{message}</p>}
        </div>
    );
}

export default RegisterForm;
