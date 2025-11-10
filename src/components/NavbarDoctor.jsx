import { Link, useNavigate } from "react-router-dom";

export default function NavbarDoctor() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center bg-green-600 text-white px-8 py-4 shadow-md">
      <h1 className="text-xl font-semibold">🩺 掛號系統 - 醫師端</h1>
      <div className="flex gap-6 text-sm">
        <Link to="/doctor/today" className="hover:text-green-200">今日看診</Link>
        <Link to="/doctor/patients" className="hover:text-green-200">病患清單</Link>
        <Link to="/doctor/schedule" className="hover:text-green-200">門診行程</Link>
        <Link to="/doctor/calendar" className="hover:text-green-200">行事曆</Link>
      </div>
      <button
        onClick={() => navigate("/")}
        className="bg-green-800 px-3 py-1 rounded hover:bg-green-900 text-sm"
      >
        登出
      </button>
    </nav>
  );
}
