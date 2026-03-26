import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function FormFields({
                                       role, setRole,
                                       name, setName,
                                       lastname, setLastname,
                                       login, setLogin,

                                       password, setPassword,
                                       showPassword, setShowPassword,

                                       universities,

                                       faculties,
                                       faculty_id,
                                       setFaculty_id,

                                       requiredFieldType
                                   }) {
    return (
        <div className="form">
            <label>
                Role:
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="professor">Professor</option>
                </select>
            </label>

            <label>
                Faculty:
                <select
                    value={faculty_id}
                    onChange={(e) => setFaculty_id(e.target.value)}
                    required
                >
                    <option value="">Select faculty</option>

                    {faculties.map(f => {
                        const university = universities.find(
                            u => u.id === f.university_id
                        );

                        return (
                            <option key={f.id} value={f.id}>
                                {university
                                    ? `${f.name} (${university.name})`
                                    : f.name}
                            </option>
                        );
                    })}
                </select>
            </label>

            {requiredFieldType && (
                <div>
                    <input
                        className="first-name-input"
                        type="text"
                        placeholder="First Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        className="last-name-input"
                        type="text"
                        placeholder="Last Name"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                    />
                </div>
            )}

            <input
                className="login-input"
                type="text"
                placeholder="Login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
            />

            <div className="password-wrapper">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="password-input"
                />
                <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            </div>
        </div>
    );
}
