import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user state from localStorage if available
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    return storedUser && storedToken ? JSON.parse(storedUser) : null;
  });

  const login = (userData) => {
    console.log('Logging in user:', userData); // Debug log
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  };

  const logout = () => {
    console.log('Logging out user'); // Debug log
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          // Verify the token is still valid
          if (userData.token === storedToken) {
            setUser(userData);
          } else {
            console.log('Token mismatch - logging out'); // Debug log
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          console.log('No stored user or token - not logged in'); // Debug log
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth check error:', error); // Debug log
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 