import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom' // Import Link
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  console.info('LoginPage: render start')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.info('LoginPage.handleSubmit: start')
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const resp = await api.post('/api/v1/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      const { access_token } = resp.data
      setToken(access_token)
      console.info('LoginPage.handleSubmit: end (success)')
      navigate('/dashboard')
    } catch (err) {
      console.info('LoginPage.handleSubmit: end (error)')
      console.error(err)
      setError(err.response?.data?.detail || '登入失敗')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>登入</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>帳號（email 或 login id）</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>密碼</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ marginTop: 12 }}>
          <button type="submit">登入</button>
        </div>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        還沒有帳號嗎？ <Link to="/register">點此註冊</Link>
      </div>
    </div>
  )
}