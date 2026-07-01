import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from "recharts";

export default function EmployeeAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/analytics/employee")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  if (!data) return null;

  const weeklyData = Object.entries(data.weekly_pattern).map(([day, count]) => ({ day, count }));
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  weeklyData.sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  const avgGoal = 8;
  const avgPct = Math.min(100, Math.round((data.avg_hours_per_day / avgGoal) * 100));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{data.total_days_present}</p>
          <p className="text-sm text-gray-500">Total Days Present</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{data.this_month_present}</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{data.avg_hours_per_day}h</p>
          <p className="text-sm text-gray-500">Avg Hours/Day</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-500">{data.total_hours}h</p>
          <p className="text-sm text-gray-500">Total Hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Weekly Attendance Pattern</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col items-center justify-center">
          <h2 className="text-base font-semibold mb-4 self-start">Daily Hours Goal</h2>
          <div className="relative flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="14" />
              <circle
                cx="80" cy="80" r="60"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - avgPct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-blue-600">{avgPct}%</p>
              <p className="text-xs text-gray-400">of 8h goal</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Avg {data.avg_hours_per_day}h / 8h target</p>
        </div>
      </div>
    </div>
  );
}
