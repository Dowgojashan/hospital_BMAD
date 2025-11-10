import NavbarPatient from "../components/NavbarPatient";

export default function PatientHome() {
  return (
    <>
      <NavbarPatient />
      <div className="p-10 text-center">
        <h1 className="text-3xl font-bold text-blue-700">🏥 病患主頁</h1>
        <p className="mt-3 text-gray-600">
          歡迎使用掛號系統，您可以在線上掛號、查看門診時表與掛號紀錄。
        </p>
      </div>
    </>
  );
}
