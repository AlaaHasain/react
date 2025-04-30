// Base API URL - adjust this to match your backend
export const API_URL = 'http://localhost:8000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    const error = data.message || response.statusText;
    throw new Error(error);
  }
  
  return data;
};

// Custom error handler with specific error messages
const handleError = (error, defaultMessage) => {
  if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error(defaultMessage);
  }
};

/**
 * Login user with email/username and password
 */
export const login = async (identifier, password) => {
  try {
    // Determine if identifier is an email or username
    const isEmail = identifier.includes('@');
    
    const loginData = {
      password: password
    };
    
    // Use either email or username field based on format
    if (isEmail) {
      loginData.email = identifier;
    } else {
      loginData.username = identifier;
    }
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    handleError(error, 'Login failed. Please check your credentials and try again.');
  }
};

/**
 * Register a new user
 */
export const register = async (userData) => {
  try {
    // For FormData (when there are file uploads)
    if (userData instanceof FormData) {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        body: userData,
      });
      
      const data = await handleResponse(response);
      return data;
    } 
    // For JSON data
    else {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      const data = await handleResponse(response);
      return data;
    }
  } catch (error) {
    handleError(error, 'Registration failed. Please check your information and try again.');
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async (token) => {
  try {
    const response = await fetch(`${API_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    handleError(error, 'Failed to fetch user profile. Please try again later.');
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userData, token) => {
  try {
    // For FormData (when there are file uploads)
    if (userData instanceof FormData) {
      // Add method override for PUT request
      userData.append('_method', 'PUT');
      
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'POST', // Use POST but simulate PUT with _method field
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // Do NOT set Content-Type for FormData
        },
        body: userData,
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Server returned an invalid response format. Please try again.');
      }
      
      // Check if the response contains an error message
      if (!response.ok) {
        throw new Error(data.message || response.statusText || 'Profile update failed');
      }
      
      return data;
    } 
    // For JSON data
    else {
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'PUT', // Use PUT for JSON data
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
      });
      
      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Server returned an invalid response format. Please try again.');
      }
      
      // Check if the response contains an error message
      if (!response.ok) {
        throw new Error(data.message || response.statusText || 'Profile update failed');
      }
      
      return data;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (token) => {
  try {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    handleError(error, 'Logout failed. Please try again.');
  }
};

/**
 * Get random users for suggestions
 */
export const getRandomUsers = async (token) => {
  try {
    const response = await fetch(`${API_URL}/random-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await handleResponse(response);
    return data.users;
  } catch (error) {
    handleError(error, 'Failed to fetch suggested users.');
    return [];
  }
};