import create from 'zustand'
import { jwtDecode } from 'jwt-decode';

// Helper function to decode token and get user info
const getUserFromToken = (token) => {
  try {
    if (!token) return null;
    const decoded = jwtDecode(token);
    // Map 'sub' from JWT payload to 'id' for consistency with frontend usage
    // Also include the 'role'
    return {
      id: decoded.sub,
      role: decoded.role,
      // Add other properties from decoded token if needed, e.g., name, email
      // For now, we only need id and role for authentication checks
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
