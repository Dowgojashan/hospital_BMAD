import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.account || !formData.password || !formData.confirm) {
      setError("請完整填寫所有欄位");
      return;
    }

    if (formData.password !== formData.confirm) {
      setError("密碼與確認密碼不相符");
      return;
    }

    // 模擬註冊成功
    alert("🎉 註冊成功！請返回登入頁面登入。");
    navigate("/"); // 註冊完成後導回登入頁
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-200 relative overflow-hidden">
      {/* 背景光球 */}
      <div className="absolute w-96 h-96 bg-blue-300/40 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-80 h-80 bg-blue-400/30 rounded-full blur-3xl bottom-10 right-10"></div>

      {/* 卡片 */}
      <div className="relative w-[420px] bg-white/85 backdrop-blur-xl rounded-2xl border border-blue-100 shadow-[0_20px_60px_-15px_rgba(30,64,175,0.35)] p-10 transition-transform duration-300 hover:scale-[1.015]">
        <div className="text-center mb-7">
          <h1 className="text-3xl font-bold text-blue-700">註冊新帳號</h1>
          <p className="text-gray-500 mt-2">請輸入註冊資料以建立新帳戶</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              帳號
            </label>
            <input
              name="account"
              value={formData.account}
              onChange={handleChange}
              placeholder="請輸入帳號"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm
                         outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              密碼
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="請輸入密碼"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm
                         outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              確認密碼
            </label>
            <input
              name="confirm"
              type="password"
              value={formData.confirm}
              onChange={handleChange}
              placeholder="請再次輸入密碼"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm
                         outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 text-white py-2 font-semibold
                       shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            註冊
          </button>
        </form>

        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-blue-500 hover:underline text-sm"
          >
            ← 返回登入頁
          </Link>
        </div>
      </div>
    </div>
  );
}
