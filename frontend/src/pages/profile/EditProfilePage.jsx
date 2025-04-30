import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { updateProfile, getUserProfile } from '../../api/auth';
import './ProfilePage.css';

const EditProfilePage = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);

  // Get user data from context
  const userData = user?.user || {};
  const token = user?.token || '';

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        image: null
      });
      
      if (userData.image_url) {
        setPreviewImage(userData.image_url);
      }
    }
  }, [userData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size and type before accepting
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG and GIF images are allowed");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any existing errors when valid image is selected
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      
      if (!formData.username.trim()) {
        throw new Error('Username is required');
      }
      
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      // Create FormData object if there's an image, otherwise use JSON
      let profileData;
      if (formData.image) {
        // Create a new FormData instance
        profileData = new FormData();
        
        // Make sure we're sending the exact field names expected by the Laravel controller
        profileData.append('name', formData.name);
        profileData.append('username', formData.username);
        profileData.append('email', formData.email);
        if (formData.phone) {
          profileData.append('phone', formData.phone);
        }
        
        // Make sure the image field name matches what Laravel expects
        profileData.append('image', formData.image);
        
        // Log form data for debugging
        console.log('Form data being sent:');
        for (const [key, value] of profileData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File - ${value.name}, type: ${value.type}, size: ${value.size}bytes`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      } else {
        // If no image, just use a regular object
        profileData = {
          name: formData.name,
          username: formData.username,
          email: formData.email
        };
        
        if (formData.phone) {
          profileData.phone = formData.phone;
        }
      }

      try {
        // Send the update request
        console.log('Sending profile update request...');
        const result = await updateProfile(profileData, token);
        console.log('Profile update result:', result);
        
        if (!result) {
          throw new Error('No response received from server');
        }
        
        // Fetch the updated user profile
        console.log('Fetching updated profile...');
        const updatedProfile = await getUserProfile(token);
        console.log('Updated profile received:', updatedProfile);
        
        // Update user context with new data
        if (updatedProfile && (updatedProfile.user || updatedProfile)) {
          const userData = updatedProfile.user || updatedProfile;
          setUser({
            user: userData,
            token: token
          });
          console.log('User context updated with new profile data');
        }
        
        setSuccess('Profile updated successfully!');
        
        // Navigate back to profile page after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } catch (updateError) {
        console.error('Profile update failed:', updateError);
        throw new Error(updateError.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-layout">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z" />
              <path fill="#fff" d="M13 7L11 7 11 11 7 11 7 13 11 13 11 17 13 17 13 13 17 13 17 11 13 11z" />
            </svg>
            <span>NexusSphere</span>
          </div>
        </div>
        
        <div className="sidebar-content">
          <nav className="main-nav">
            <Link to="/home" className="nav-item">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="nav-text">Home</span>
            </Link>
            <Link to="/explore" className="nav-item">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <span className="nav-text">Explore</span>
            </Link>
            <Link to="/profile" className="nav-item active">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="nav-text">Profile</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <h1>Edit Profile</h1>
            <Link to="/profile" className="back-button">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              Back to Profile
            </Link>
          </div>

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-group">
              <div className="profile-avatar-edit">
                <div className="avatar-preview">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Profile preview" 
                      className="avatar-image" 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>{formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  )}
                </div>
                <div className="avatar-upload">
                  <label htmlFor="image" className="upload-button">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8h-5zM5 19l3-4 2 3 3-4 4 5H5z" />
                    </svg>
                    Change Photo
                  </label>
                  <input 
                    type="file" 
                    id="image" 
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number <span className="optional">(optional)</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="profile-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link to="/profile" className="cancel-button">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <div className="right-panel">
          <h3 className="panel-header">Profile Tips</h3>
          <div className="profile-tips">
            <div className="tip-item">
              <div className="tip-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div className="tip-content">
                <h4>Profile Picture</h4>
                <p>Upload a clear, friendly photo to help others recognize you.</p>
              </div>
            </div>
            
            <div className="tip-item">
              <div className="tip-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div className="tip-content">
                <h4>Username</h4>
                <p>Choose a unique username that represents you but doesn't contain personal information.</p>
              </div>
            </div>
            
            <div className="tip-item">
              <div className="tip-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div className="tip-content">
                <h4>Phone Number</h4>
                <p>Adding a phone number is optional but helps with account security.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;