import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users, LayoutDashboard, Calendar, BarChart2,
  ClipboardList, LogOut, User, Menu, X, ChevronDown
} from "lucide-react";

const adminNav = [
  { to: "/admin/peoples", icon: Users, label: "Peoples" },
  { to: "/admin/today", icon: LayoutDashboard, label: "Today Status" },
  { to: "/admin/attendance", icon: ClipboardList, label: "Attendance" },
  { to: "/admin/analytics", icon: BarChart2, label: "Analytics" },
];

const employeeNav = [
  { to: "/employee/attendance", icon: Calendar, label: "Attendance" },
  { to: "/employee/calendar", icon: ClipboardList, label: "My Calendar" },
  { to: "/employee/analytics", icon: BarChart2, label: "My Analytics" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const nav = user?.role === "employee" ? employeeNav : adminNav;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-blue-600">AttendanceMS</h1>
        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === to
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl z-50">
            <button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="hidden md:block" />
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
