import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import CitizenMap from './components/CitizenMap';
import { ThemeProvider } from './context/ThemeContext';

// Simple Protected Route wrapper
const ProtectedRoute = ({ children, isAllowed, redirectTo = "/" }) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

function App() {
  // role can be null, 'admin', or 'citizen'
  const [role, setRole] = useState(null);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage setRole={setRole} />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute isAllowed={role === 'admin'}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/nearby" 
            element={
              <ProtectedRoute isAllowed={role === 'citizen'}>
                <CitizenMap setRole={setRole} />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
