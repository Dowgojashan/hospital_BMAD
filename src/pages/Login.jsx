import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const mockUsers = [
  { account: "patient001", password: "123456", role: "patient" },
  { account: "doctor001", password: "123456", role: "doctor" },
  { account: "admin001", password: "123456", role: "admin" },
];

export default function Login() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");

    const user = mockUsers.find(
      (u) => u.account === account && u.password === password
    );

    if (!user) {
      setError("帳號或密碼錯誤");
      return;
    }

    // ✅ 登入成功後導向不同首頁
    if (user.role === "patient") navigate("/patient-home");
    else if (user.role === "doctor") navigate("/doctor-home");
    else if (user.role === "admin") navigate("/admin-home");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-200 relative overflow-hidden">
      {/* 背景光球 */}
      <div className="absolute w-96 h-96 bg-blue-300/40 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-80 h-80 bg-blue-400/30 rounded-full blur-3xl bottom-10 right-10"></div>

      {/* 登入卡片 */}
      <div className="relative w-[420px] bg-white/85 backdrop-blur-xl rounded-2xl border border-blue-100 shadow-[0_20px_60px_-15px_rgba(30,64,175,0.35)] p-10 transition-transform duration-300 hover:scale-[1.015]">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-bold text-blue-700 tracking-wide">醫院掛號系統</h1>
          <p className="text-gray-500 mt-2">請輸入帳號與密碼以登入系統</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">帳號</label>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="請輸入帳號"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            登入
          </button>
        </form>

        <div className="text-center mt-5">
          <Link to="/register" className="text-blue-500 hover:underline text-sm">
            註冊帳號
          </Link>
        </div>

        {/* 測試帳號提示 */}
        <div className="absolute -bottom-4 right-4 text-[11px] text-gray-400 italic">
          測試帳號：patient001 / doctor001 / admin001（密碼 123456）
        </div>
      </div>
    </div>
  );
}
