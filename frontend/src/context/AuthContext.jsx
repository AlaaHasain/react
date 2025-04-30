import React, { createContext, useState, useEffect } from 'react';
import { getUserProfile, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // If we have a token, try to get the user profile
          const response = await getUserProfile(token);
          // Extract the user data from the response
          const userData = response.user || response;
          // Store both user data and token in the user state
          setUser({ user: userData, token: token });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        // If getting the user profile fails, clear authentication
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - updated to use identifier (email or username) instead of email
  const login = async (identifier, password) => {
    setError(null);
    try {
      const data = await apiLogin(identifier, password);
      
      // Check if we have a token and user data in the response
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        
        // Set user data from response or fetch it if not provided
        if (data.user) {
          // Store both user data and token in the user state
          setUser({ user: data.user, token: data.token });
        } else {
          // Fetch user profile if not included in login response
          const response = await getUserProfile(data.token);
          const userData = response.user || response;
          setUser({ user: userData, token: data.token });
        }
        
        setIsAuthenticated(true);
        return data.user || {};
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (formData) => {
    setError(null);
    try {
      const data = await apiRegister(formData);
      
      // Check if we have a token and user data in the response
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        
        // Set user data from response or fetch it if not provided
        if (data.user) {
          // Store both user data and token in the user state
          setUser({ user: data.user, token: data.token });
        } else {
          // Fetch user profile if not included in registration response
          const response = await getUserProfile(data.token);
          const userData = response.user || response;
          setUser({ user: userData, token: data.token });
        }
        
        setIsAuthenticated(true);
        return data.user || {};
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await apiLogout(token);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        setUser // Expose setUser function to be used in components
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};