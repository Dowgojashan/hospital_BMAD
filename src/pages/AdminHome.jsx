import NavbarAdmin from "../components/NavbarAdmin";

export default function AdminHome() {
  return (
    <>
      <NavbarAdmin />
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-800">🧑‍💼 管理員主頁</h1>
        <p className="mt-3 text-gray-600">
          您可以管理全院醫師與科別資料，並查看掛號統計報表。
        </p>
      </div>
    </>
  );
}
