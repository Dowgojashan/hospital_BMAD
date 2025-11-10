import NavbarDoctor from "../components/NavbarDoctor";

export default function DoctorHome() {
  return (
    <>
      <NavbarDoctor />
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold text-green-700">🩺 醫師主頁</h1>
        <p className="mt-3 text-gray-600">
          歡迎回來！您可以查看今日看診、管理門診行程與病患清單。
        </p>
      </div>
    </>
  );
}
