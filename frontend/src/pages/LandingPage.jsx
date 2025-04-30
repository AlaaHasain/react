import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1>Connect, Share, Discover with NexusSphere</h1>
        <p>
          Join our vibrant community where ideas flourish, connections deepen, and creativity knows no bounds.
          Experience social networking reimagined for the digital age.
        </p>
        
        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-outline">Sign In</Link>
        </div>
        
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h3 className="feature-title">Meaningful Connections</h3>
            <p className="feature-description">
              Build genuine relationships with like-minded individuals in a safe and supportive environment.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <h3 className="feature-title">Personal Space</h3>
            <p className="feature-description">
              Customize your profile, share what matters to you, and control your digital presence.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <h3 className="feature-title">Community Discovery</h3>
            <p className="feature-description">
              Find and join communities that share your passions, interests, and goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;