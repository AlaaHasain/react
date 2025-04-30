import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Assuming you will create a CSS file for styling

const LandingPage = () => {
    return (
        <div className="landing-page">
            <h1>Welcome to the Social Media Clone</h1>
            <p>Your platform to connect and share with others.</p>
            <div className="landing-buttons">
                <Link to="/login" className="btn">Login</Link>
                <Link to="/register" className="btn">Register</Link>
            </div>
        </div>
    );
};

export default LandingPage;