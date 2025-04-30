import React from 'react';
import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom';
import '../pages/LoginPage.css';


const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome to NexusSphere</h1>
          <p>Sign in to continue your journey</p>
        </div>
        <LoginForm />
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;