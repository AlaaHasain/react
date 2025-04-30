import React from 'react';
import RegisterForm from '../components/RegisterForm';
import { Link } from 'react-router-dom';
import '../pages/RegisterPage.css';

const RegisterPage = () => {
  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Join NexusSphere Today</h1>
          <p>Create your account to get started</p>
        </div>
        <div className="register-content">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;