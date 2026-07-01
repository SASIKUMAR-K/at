import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="card">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color === "blue" ? "text-blue-600" : color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : "text-purple-600"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/analytics/admin")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading analytics...</div>;
  if (!data) return null;

  const pieData = [
    { name: "Present", value: data.present_today },
    { name: "Absent", value: data.absent_today },
  ];

  const hoursData = Object.entries(data.hours_distribution).map(([k, v]) => ({ name: k, count: v }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Employees" value={data.total_employees} color="blue" />
        <StatCard label="Present Today" value={data.present_today} color="green" />
        <StatCard label="Absent Today" value={data.absent_today} color="red" />
        <StatCard label="Attendance Rate" value={`${data.attendance_rate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Today Pie */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Today's Attendance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={["#10b981", "#ef4444"][i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Hours Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Monthly Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Employees */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Top Attendance Employees</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_employees} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="days" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
