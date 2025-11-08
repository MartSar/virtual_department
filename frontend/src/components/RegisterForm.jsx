import '../styles/RegisterForm.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormFields from "./inner_components/FormFields";
import { handleRegister } from "../handlers";


function RegisterForm() {
    const [role, setRole] = useState('student');
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

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
            />
            <div className="register-btns-container">
                <button className="back-to-sign-in-btn" onClick={() => navigate('/')}>Back to Sign In</button>
                <button className="set-acc-btn" onClick={() => handleRegister(
                    { role, name, lastname, password, setMessage, navigate }
                )}>Set an Account</button>
            </div>
            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default RegisterForm;
