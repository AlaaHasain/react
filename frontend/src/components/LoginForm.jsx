import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const LoginForm = () => {
  const [identifier, setIdentifier] = useState(''); // Changed from email to identifier (can be email or username)
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, error: authError, user } = useContext(AuthContext);
  
  // Redirect only when authentication state changes AND user data is loaded
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.user) {
      navigate('/home'); // Redirect to the home page
    }
  }, [isAuthenticated, navigate, user]);

  // Update local error state when auth context error changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!identifier || !password) {
        throw new Error("Username/Email and password are required");
      }
      
      await login(identifier, password);
      // Redirection happens in the useEffect hook when both isAuthenticated and user are available
    } catch (err) {
      console.error("Login form error:", err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="identifier">Username or Email</label>
        <input
          type="text"
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          placeholder="Enter your username or email"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </div>
      
      <button 
        type="submit" 
        className="btn btn-primary auth-button"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;