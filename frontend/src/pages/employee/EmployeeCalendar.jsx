import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";

const HOUR_COLORS = {
  leave: { bg: "bg-gray-100", text: "text-gray-400", label: "Leave" },
  "0-3": { bg: "bg-red-100", text: "text-red-600", label: "0-3h" },
  "3-5": { bg: "bg-yellow-100", text: "text-yellow-700", label: "3-5h" },
  "5-7": { bg: "bg-blue-100", text: "text-blue-600", label: "5-7h" },
  "7-9": { bg: "bg-emerald-100", text: "text-emerald-600", label: "7-9h" },
  "9+": { bg: "bg-green-200", text: "text-green-700", label: "9+h" },
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

export default function EmployeeCalendar() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    api.get("/attendance/my")
      .then((r) => setRecords(r.data))
      .catch(() => toast.error("Failed to load attendance"));
  }, []);

  const filtered = records.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const recordMap = {};
  filtered.forEach((r) => {
    recordMap[new Date(r.date).getDate()] = r;
  });

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const firstDay = getDay(startOfMonth(new Date(year, month - 1)));
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const presentDays = filtered.filter((r) => r.login_time).length;
  const totalHours = filtered.reduce((acc, r) => {
    if (r.login_time && r.logout_time) {
      return acc + (new Date(r.logout_time + "Z") - new Date(r.login_time + "Z")) / 3600000;
    }
    return acc;
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Calendar</h1>

      <div className="flex gap-2 mb-6">
        <select className="input-field max-w-[140px]" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{format(new Date(2024, i), "MMMM")}</option>
          ))}
        </select>
        <select className="input-field max-w-[100px]" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{presentDays}</p>
          <p className="text-sm text-gray-500">Days Present</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{totalHours.toFixed(1)}h</p>
          <p className="text-sm text-gray-500">Total Hours</p>
        </div>
        <div className="card text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-purple-600">
            {presentDays ? (totalHours / presentDays).toFixed(1) : 0}h
          </p>
          <p className="text-sm text-gray-500">Avg Hours/Day</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const rec = recordMap[day];
            const bucket = rec ? getHourBucket(rec.login_time, rec.logout_time) : "leave";
            const isFuture = new Date(year, month - 1, day) > today;
            const color = isFuture ? { bg: "bg-gray-50", text: "text-gray-300" } : HOUR_COLORS[bucket];
            const hours = rec?.login_time && rec?.logout_time
              ? ((new Date(rec.logout_time + "Z") - new Date(rec.login_time + "Z")) / 3600000).toFixed(1)
              : null;
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

            return (
              <div
                key={day}
                className={`${color.bg} ${color.text} rounded-lg p-1 text-center aspect-square flex flex-col items-center justify-center relative ${
                  isToday ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <span className="text-xs font-semibold">{day}</span>
                {!isFuture && hours && <span className="text-[9px] leading-tight">{hours}h</span>}
                {!isFuture && !rec && <span className="text-[8px] leading-tight opacity-60">—</span>}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
          {Object.entries(HOUR_COLORS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${v.bg}`} />
              <span className="text-xs text-gray-500">{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
