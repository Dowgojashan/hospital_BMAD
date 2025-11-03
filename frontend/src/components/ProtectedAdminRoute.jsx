import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { decodeToken } from '../utils/auth';

export default function ProtectedAdminRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);

  if (!token) {
    // No token, redirect to login
    return <Navigate to="/login" replace />;
  }

  const decoded = decodeToken(token);
  if (!decoded || decoded.role !== 'admin') {
    // Token invalid or user is not an admin, redirect to login
    // Optionally, you could redirect to an unauthorized page or show an error
    return <Navigate to="/login" replace />;
  }

  return children;
}
