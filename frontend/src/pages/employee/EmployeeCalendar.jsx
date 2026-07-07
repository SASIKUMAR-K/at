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
  const [joinDate, setJoinDate] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    Promise.all([api.get("/attendance/my"), api.get("/users/me")])
      .then(([attRes, userRes]) => {
        setRecords(attRes.data);
        const jd = new Date(userRes.data.created_at);
        setJoinDate(jd);
        // Start calendar from join month
        setMonth(jd.getMonth() + 1);
        setYear(jd.getFullYear());
      })
      .catch(() => toast.error("Failed to load data"));
  }, []);

  // Build available months from join date to today
  const today = new Date();
  const getAvailableMonths = () => {
    if (!joinDate) return [];
    const months = [];
    let d = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    while (d <= end) {
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  };

  const availableMonths = getAvailableMonths();

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

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const presentDays = filtered.filter((r) => r.login_time).length;
  const totalHours = filtered.reduce((acc, r) => {
    if (r.login_time && r.logout_time)
      return acc + (new Date(r.logout_time + "Z") - new Date(r.login_time + "Z")) / 3600000;
    return acc;
  }, 0);

  const handleMonthChange = (val) => {
    const [y, m] = val.split("-").map(Number);
    setYear(y);
    setMonth(m);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Calendar</h1>
      {joinDate && (
        <p className="text-sm text-gray-400 mb-6">
          Member since {format(joinDate, "MMMM d, yyyy")}
        </p>
      )}

      {/* Month selector — only from join date to today */}
      <div className="mb-6">
        <select
          className="input-field max-w-[200px]"
          value={`${year}-${month}`}
          onChange={(e) => handleMonthChange(e.target.value)}
        >
          {availableMonths.map(({ year: y, month: m }) => (
            <option key={`${y}-${m}`} value={`${y}-${m}`}>
              {format(new Date(y, m - 1), "MMMM yyyy")}
            </option>
          ))}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            {format(new Date(year, month - 1), "MMMM yyyy")}
          </h2>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;

            const cellDate = new Date(year, month - 1, day);
            const isFuture = cellDate > today;
            const isBeforeJoin = joinDate && cellDate < new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

            if (isBeforeJoin) {
              return (
                <div key={day} className="bg-gray-50 rounded-lg p-1 text-center aspect-square flex items-center justify-center">
                  <span className="text-[10px] text-gray-200 font-semibold">{day}</span>
                </div>
              );
            }

            const rec = recordMap[day];
            const bucket = rec ? getHourBucket(rec.login_time, rec.logout_time) : "leave";
            const color = isFuture ? { bg: "bg-gray-50", text: "text-gray-300" } : HOUR_COLORS[bucket];
            const hours = rec?.login_time && rec?.logout_time
              ? ((new Date(rec.logout_time + "Z") - new Date(rec.login_time + "Z")) / 3600000).toFixed(1)
              : null;

            return (
              <div
                key={day}
                className={`${color.bg} ${color.text} rounded-lg p-1 text-center aspect-square flex flex-col items-center justify-center ${
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
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
            <span className="text-xs text-gray-400">Before joining</span>
          </div>
        </div>
      </div>
    </div>
  );
}
