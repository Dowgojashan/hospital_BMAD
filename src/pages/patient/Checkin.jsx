import NavbarPatient from "../../components/NavbarPatient";
export default function Appointment() {
  return (
    <>
      <NavbarPatient />
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-blue-700">報到 </h1>
        <p className="mt-2 text-gray-500">這裡未來可以</p>
      </div>
    </>
  );
}
