/**
 * src/App.jsx
 *
 * Main React Router Configuration.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TpoDashboard from './pages/TpoDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentDashboard />} />
      </Route>

      {/* Protected TPO & Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['tpo', 'admin']} />}>
        <Route path="/tpo" element={<TpoDashboard />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
