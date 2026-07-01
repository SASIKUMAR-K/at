import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Clock, Users, UserCheck } from "lucide-react";
import { format } from "date-fns";

export default function TodayStatus() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/attendance/today-status")
      .then((r) => setRecords(r.data))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const present = records.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Today's Status</h1>
      <p className="text-gray-500 text-sm mb-6">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{present}</p>
            <p className="text-sm text-gray-500">Present Today</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {records.filter((r) => r.login_time && !r.logout_time).length}
            </p>
            <p className="text-sm text-gray-500">Still Working</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {records.filter((r) => r.logout_time).length}
            </p>
            <p className="text-sm text-gray-500">Checked Out</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Employee Check-ins</h2>
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Employee</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">Emp ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Login Time</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Logout Time</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Hours</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.user_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{r.user_name}</td>
                    <td className="py-3 px-2 font-mono text-xs text-blue-600 hidden sm:table-cell">{r.emp_id}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {r.login_time ? format(new Date(r.login_time + "Z"), "hh:mm a") : "—"}
                    </td>
                    <td className="py-3 px-2 text-gray-600 hidden md:table-cell">
                      {r.logout_time ? format(new Date(r.logout_time + "Z"), "hh:mm a") : "—"}
                    </td>
                    <td className="py-3 px-2 text-gray-600 hidden md:table-cell">
                      {r.hours_worked ? `${r.hours_worked}h` : "—"}
                    </td>
                    <td className="py-3 px-2">
                      {r.logout_time ? (
                        <span className="badge-inactive">Checked Out</span>
                      ) : (
                        <span className="badge-active">Working</span>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No check-ins today</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
