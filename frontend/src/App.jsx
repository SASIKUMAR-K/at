import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Peoples from "./pages/admin/Peoples";
import TodayStatus from "./pages/admin/TodayStatus";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeCalendar from "./pages/employee/EmployeeCalendar";
import EmployeeAnalytics from "./pages/employee/EmployeeAnalytics";
import Profile from "./pages/Profile";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "employee") return <Navigate to="/employee/attendance" replace />;
  return <Navigate to="/admin/peoples" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin & Super Admin Routes */}
          <Route path="/admin/peoples" element={
            <ProtectedRoute roles={["super_admin", "admin"]}>
              <Layout><Peoples /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/today" element={
            <ProtectedRoute roles={["super_admin", "admin"]}>
              <Layout><TodayStatus /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute roles={["super_admin", "admin"]}>
              <Layout><AdminAttendance /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute roles={["super_admin", "admin"]}>
              <Layout><AdminAnalytics /></Layout>
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/attendance" element={
            <ProtectedRoute roles={["employee"]}>
              <Layout><EmployeeAttendance /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/employee/calendar" element={
            <ProtectedRoute roles={["employee"]}>
              <Layout><EmployeeCalendar /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/employee/analytics" element={
            <ProtectedRoute roles={["employee"]}>
              <Layout><EmployeeAnalytics /></Layout>
            </ProtectedRoute>
          } />

          {/* Shared */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
