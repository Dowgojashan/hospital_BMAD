import create from 'zustand'

// Auth store: 儲存 access_token，並同步到 localStorage
export const useAuthStore = create((set) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  setToken: (token) => {
    console.info('auth.setToken: start')
    localStorage.setItem('access_token', token)
    set({ accessToken: token })
    console.info('auth.setToken: end')
  },
  clearToken: () => {
    console.info('auth.clearToken: start')
    localStorage.removeItem('access_token')
    set({ accessToken: null })
    console.info('auth.clearToken: end')
  }
}))
