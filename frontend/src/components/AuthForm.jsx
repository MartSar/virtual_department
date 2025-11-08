import '../styles/AuthForm.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import  FormFields from "./inner_components/FormFields"
import { handleSignIn } from "../handlers";


function AuthForm() {
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
            <h2>Sign In</h2>
            <FormFields
                role={role} setRole={setRole}
                name={name} setName={setName}
                lastname={lastname} setLastname={setLastname}
                password={password} setPassword={setPassword}
                showPassword={showPassword} setShowPassword={setShowPassword}
            />
            <div className="auth-btns-container">
                <button className="sign-up-btn" onClick={() => navigate('/register')}>Sign Up</button>
                <button className="sign-in-btn" onClick={() => handleSignIn(
                    { role, name, lastname, password, setMessage, navigate }
                )}>Sign In</button>
            </div>
            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default AuthForm;
