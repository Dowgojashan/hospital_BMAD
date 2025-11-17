import create from 'zustand'
import { jwtDecode } from 'jwt-decode';

// Helper function to decode token and get user info
const getUserFromToken = (token) => {
  try {
    if (!token) return null;
    const decoded = jwtDecode(token);
    return {
      id: decoded.sub,
      role: decoded.role,
      is_verified: decoded.is_verified,
      is_system_admin: decoded.is_system_admin,
      department: decoded.department,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Auth store: 儲存 access_token 和 user 資訊，並同步到 localStorage
export const useAuthStore = create((set) => {
  const initialAccessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const initialUser = getUserFromToken(initialAccessToken);

  return {
    accessToken: initialAccessToken,
    user: initialUser, // Add user state
    setToken: (token) => {
      console.info('auth.setToken: start');
      localStorage.setItem('access_token', token);
      const decodedUser = getUserFromToken(token);
      set({ accessToken: token, user: decodedUser }); // Set both token and user
      console.info('auth.setToken: end');
    },
    clearToken: () => {
      console.info('auth.clearToken: start');
      localStorage.removeItem('access_token');
      set({ accessToken: null, user: null }); // Clear both token and user
      console.info('auth.clearToken: end');
    }
  };
});
