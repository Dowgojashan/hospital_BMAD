import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

import PatientHome from "./pages/PatientHome";
import Appointment from "./pages/patient/Appointment";
import Schedule from "./pages/patient/Schedule";
import Records from "./pages/patient/Records";
import Checkin from "./pages/patient/Checkin";

import DoctorHome from "./pages/DoctorHome";
import Today from "./pages/doctor/Today";
import Patients from "./pages/doctor/Patients";
import DoctorSchedule from "./pages/doctor/Schedule";
import Calendar from "./pages/doctor/Calendar";

import AdminHome from "./pages/AdminHome";
import Dashboard from "./pages/admin/Dashboard";
import Doctors from "./pages/admin/Doctors";
import Depts from "./pages/admin/Depts";
import Reports from "./pages/admin/Reports";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },

  // Patient
  { path: "/patient-home", element: <PatientHome /> },
  { path: "/patient/appointment", element: <Appointment /> },
  { path: "/patient/schedule", element: <Schedule /> },
  { path: "/patient/records", element: <Records /> },
  { path: "/patient/checkin", element: <Checkin /> },

  // Doctor
  { path: "/doctor-home", element: <DoctorHome /> },
  { path: "/doctor/today", element: <Today /> },
  { path: "/doctor/patients", element: <Patients /> },
  { path: "/doctor/schedule", element: <DoctorSchedule /> },
  { path: "/doctor/calendar", element: <Calendar /> },

  // Admin
  { path: "/admin-home", element: <AdminHome /> },
  { path: "/admin/dashboard", element: <Dashboard /> },
  { path: "/admin/doctors", element: <Doctors /> },
  { path: "/admin/depts", element: <Depts /> },
  { path: "/admin/reports", element: <Reports /> },
]);
