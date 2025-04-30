import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    image: null
  });
  
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register, error: authError, isAuthenticated, user } = useContext(AuthContext);

  // Redirect only when authentication state changes AND user data is loaded
  useEffect(() => {
    if (isAuthenticated && user?.user) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate, user]);

  // Update local error state when auth context error changes
  useEffect(() => {
    if (authError) {
      setFormError(authError);
    }
  }, [authError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      
      // Create image preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        image: null
      });
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setFormError('Name, username, email, and password are required');
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setFormError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setFormError('');
    
    // Create FormData object for file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    submitData.append('password_confirmation', formData.password_confirmation);
    
    if (formData.phone) {
      submitData.append('phone', formData.phone);
    }
    
    if (formData.image) {
      submitData.append('image', formData.image);
    }
    
    try {
      await register(submitData);
      // Redirection happens in the useEffect hook
    } catch (err) {
      console.error("Registration form error:", err);
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-form-container">
      <h2>Create a new account</h2>
      
      {formError && <div className="error-message">{formError}</div>}
      
      <form onSubmit={handleSubmit} className="wide-form">
        <div className="form-layout">
          <div className="form-main-content">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-animated">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-animated">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-animated">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-animated">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password_confirmation">Confirm Password</label>
                <div className="input-animated">
                  <input
                    type="password"
                    id="password_confirmation"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number (Optional)</label>
              <div className="input-animated">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (123) 456-7890"
                />
              </div>
            </div>
          </div>
          
          <div className="form-image-section">
            <div className="form-group">
              <label htmlFor="image">Profile Picture</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="image-input"
                />
                <div className="image-preview-container">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Profile Preview" 
                      className="image-preview"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      <p>Preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>Creating Your Account...</>
          ) : (
            <>Join NexusSphere</>
          )}
        </button>
      </form>
      
      <div className="form-footer">
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default RegisterForm;