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
  const isTokenExpired = decoded ? decoded.exp * 1000 < Date.now() : true;

  if (!decoded || isTokenExpired || decoded.role !== 'admin') {
    if (isTokenExpired) {
      // Clear the expired token
      useAuthStore.getState().clearToken();
    }
    // Token invalid, expired, or user is not an admin, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}
