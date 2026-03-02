import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './components/registration/AuthForm';
import RegisterForm from "./components/registration/RegisterForm";
import Dashboard from './components/dashboard/Dashboard';
import UserProfile from "./components/profile/UserProfile";
import UniversalReader from "./components/profile/UniversalReader";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile/:id" element={<UserProfile />} />
                <Route path="/reader/:id" element={<UniversalReader apiBaseUrl="http://localhost:3000" />} />
            </Routes>
        </Router>
    );
}

export default App;
