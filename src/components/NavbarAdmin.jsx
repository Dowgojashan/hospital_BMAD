import { Link, useNavigate } from "react-router-dom";

export default function NavbarAdmin() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center bg-gray-700 text-white px-8 py-4 shadow-md">
      <h1 className="text-xl font-semibold">🧑‍💼 管理後台</h1>
      <div className="flex gap-6 text-sm">
        <Link to="/admin/dashboard" className="hover:text-gray-300">Dashboard</Link>
        <Link to="/admin/doctors" className="hover:text-gray-300">醫師管理</Link>
        <Link to="/admin/depts" className="hover:text-gray-300">科別管理</Link>
        <Link to="/admin/reports" className="hover:text-gray-300">報表分析</Link>
      </div>
      <button
        onClick={() => navigate("/")}
        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-500 text-sm"
      >
        登出
      </button>
    </nav>
  );
}
