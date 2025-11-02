import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function RegisterPage() {
  console.info('RegisterPage: render start');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // Renamed for clarity
    dob: '',
    phone: '',
    card_number: '',
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.info('RegisterPage.handleSubmit: start');
    setError(null);

    // --- Client-side Validation ---
    if (form.password !== form.confirmPassword) {
      setError('密碼與確認密碼不相符');
      return;
    }
    if (form.password.length < 6) {
      setError('密碼長度至少要 6 碼');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('電子郵件格式不正確');
      return;
    }
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(form.phone)) {
      setError('電話號碼必須是 09 開頭的 10 位數字');
      return;
    }
    // --- End Validation ---

    try {
      const payload = {
        name: form.name,
        password: form.password,
        dob: form.dob,
        phone: form.phone,
        email: form.email,
        card_number: form.card_number,
      };
      await api.post('/api/v1/register/patient', payload);
      console.info('RegisterPage.handleSubmit: end (success)');
      alert('註冊成功！將為您導向登入頁面。');
      navigate('/login');
    } catch (err) {
      console.error(err);
      // Display detailed error from backend
      if (err.response && err.response.data && err.response.data.detail) {
          if (typeof err.response.data.detail === 'string') {
              setError(err.response.data.detail);
          } else {
              // Handle cases where 'detail' might be an array of errors (from Pydantic)
              const errorMessages = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(', ');
              setError(errorMessages);
          }
      } else {
          setError('註冊失敗，請稍後再試');
      }
      console.info('RegisterPage.handleSubmit: end (error)');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>病患註冊</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>姓名</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>電子郵件</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>密碼 (至少6碼)</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <label>確認密碼</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
        </div>
        <div>
          <label>出生日期</label>
          <input name="dob" type="date" value={form.dob} onChange={handleChange} required />
        </div>
        <div>
          <label>聯絡電話 (格式: 0912345678)</label>
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div>
          <label>虛擬健保卡號</label>
          <input name="card_number" value={form.card_number} onChange={handleChange} required />
        </div>
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
        <div style={{ marginTop: '1rem' }}>
          <button type="submit">註冊</button>
        </div>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        已經有帳號了？ <Link to="/login">點此登入</Link>
      </div>
    </div>
  );
}