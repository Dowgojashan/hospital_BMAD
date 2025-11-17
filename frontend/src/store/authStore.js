import create from 'zustand';
import { jwtDecode } from 'jwt-decode';

const getBasicUserFromToken = (token) => {
  try {
    if (!token) return null;
    const decoded = jwtDecode(token);
    return {
      id: decoded.sub,
      role: decoded.role,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const useAuthStore = create((set) => {
  const initialAccessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const initialUser = getBasicUserFromToken(initialAccessToken);

  return {
    accessToken: initialAccessToken,
    user: initialUser,
    setToken: (token) => {
      localStorage.setItem('access_token', token);
      const basicUser = getBasicUserFromToken(token);
      set({ accessToken: token, user: basicUser });
    },
    setFullUser: (profileData) => {
      set((state) => ({
        user: {
          ...state.user, // Keep basic info like id and role
          ...profileData, // Add full profile info
        },
      }));
    },
    clearToken: () => {
      localStorage.removeItem('access_token');
      set({ accessToken: null, user: null });
    },
  };
});
