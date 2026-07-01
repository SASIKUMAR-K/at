import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Eye, X } from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";

const HOUR_COLORS = {
  leave: { bg: "bg-gray-100", text: "text-gray-400", label: "Leave" },
  "0-3": { bg: "bg-red-100", text: "text-red-600", label: "0-3h" },
  "3-5": { bg: "bg-yellow-100", text: "text-yellow-600", label: "3-5h" },
  "5-7": { bg: "bg-blue-100", text: "text-blue-600", label: "5-7h" },
  "9+": { bg: "bg-green-100", text: "text-green-700", label: "9+h" },
  "7-9": { bg: "bg-emerald-100", text: "text-emerald-600", label: "7-9h" },
};

function getHourBucket(login, logout) {
  if (!login) return "leave";
  if (!logout) return "0-3";
  const h = (new Date(logout + "Z") - new Date(login + "Z")) / 3600000;
  if (h < 3) return "0-3";
  if (h < 5) return "3-5";
  if (h < 7) return "5-7";
  if (h < 9) return "7-9";
  return "9+";
}

function AttendanceCalendar({ records, year, month }) {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = getDay(startOfMonth(new Date(year, month - 1)));
  const recordMap = {};
  records.forEach((r) => {
    const d = new Date(r.date).getDate();
    recordMap[d] = r;
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const rec = recordMap[day];
          const bucket = rec ? getHourBucket(rec.login_time, rec.logout_time) : "leave";
          const isFuture = new Date(year, month - 1, day) > today;
          const color = isFuture ? { bg: "bg-gray-50", text: "text-gray-300" } : HOUR_COLORS[bucket];
          const hours = rec?.login_time && rec?.logout_time
            ? ((new Date(rec.logout_time + "Z") - new Date(rec.login_time + "Z")) / 3600000).toFixed(1)
            : null;

          return (
            <div
              key={day}
              title={isFuture ? "" : `${color.label}${hours ? ` · ${hours}h` : ""}`}
              className={`${color.bg} ${color.text} rounded-lg p-1 text-center aspect-square flex flex-col items-center justify-center`}
            >
              <span className="text-xs font-semibold">{day}</span>
              {!isFuture && hours && <span className="text-[9px] leading-tight">{hours}h</span>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {Object.entries(HOUR_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${v.bg}`} />
            <span className="text-xs text-gray-500">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAttendance() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    api.get("/users/employees").then((r) => setEmployees(r.data)).catch(() => toast.error("Failed to load"));
  }, []);

  const viewAttendance = async (emp) => {
    try {
      const { data } = await api.get(`/attendance/employee/${emp.id}`);
      setRecords(data);
      setSelected(emp);
    } catch {
      toast.error("Failed to load attendance");
    }
  };

  const filteredRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Employee Attendance</h1>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Emp ID</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-2 font-mono text-xs text-blue-600">{emp.emp_id}</td>
                  <td className="py-3 px-2 font-medium">{emp.name}</td>
                  <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">{emp.email}</td>
                  <td className="py-3 px-2">
                    <span className={emp.is_active ? "badge-active" : "badge-inactive"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => viewAttendance(emp)}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.emp_id}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <select
                  className="input-field"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(2024, i), "MMMM")}
                    </option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <AttendanceCalendar records={filteredRecords} year={year} month={month} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
