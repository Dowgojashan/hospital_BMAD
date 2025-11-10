import { Link, useNavigate } from "react-router-dom";

export default function NavbarPatient() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center bg-blue-600 text-white px-8 py-4 shadow-md">
      <h1 className="text-xl font-semibold">🏥 掛號系統 - 病患端</h1>
      <div className="flex gap-6 text-sm">
        <Link to="/patient/appointment" className="hover:text-blue-200">線上掛號</Link>
        <Link to="/patient/schedule" className="hover:text-blue-200">門診時表</Link>
        <Link to="/patient/records" className="hover:text-blue-200">掛號紀錄</Link>
        <Link to="/patient/checkin" className="hover:text-blue-200">線上報到</Link>
      </div>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-800 px-3 py-1 rounded hover:bg-blue-900 text-sm"
      >
        登出
      </button>
    </nav>
  );
}
