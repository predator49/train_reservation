import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import SeatBooking from './pages/SeatBooking';
import MyBookings from './pages/MyBookings';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Store the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route component (for login and register)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/';

  if (user) {
    return <Navigate to={from} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SeatBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 