import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { LogIn, LogOut, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeAttendance() {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // 'checkin' | 'checkout'
  const [acting, setActing] = useState(false);

  const fetchToday = async () => {
    try {
      const { data } = await api.get("/attendance/today");
      setToday(data);
    } catch (err) {
      if (err.response?.status === 404) setToday(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  const handleAction = async () => {
    setActing(true);
    try {
      if (confirm === "checkin") {
        await api.post("/attendance/checkin");
        toast.success("Checked in successfully!");
      } else {
        await api.post("/attendance/checkout");
        toast.success("Checked out successfully!");
      }
      setConfirm(null);
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setActing(false);
    }
  };

  const checkedIn = !!today?.login_time;
  const checkedOut = !!today?.logout_time;

  const hoursWorked = today?.login_time && today?.logout_time
    ? ((new Date(today.logout_time + "Z") - new Date(today.login_time + "Z")) / 3600000).toFixed(2)
    : null;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance</h1>
      <p className="text-gray-500 text-sm mb-6">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>

      <div className="card mb-6">
        <div className="text-center py-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            checkedOut ? "bg-green-100" : checkedIn ? "bg-blue-100" : "bg-gray-100"
          }`}>
            <CheckCircle className={`w-10 h-10 ${checkedOut ? "text-green-500" : checkedIn ? "text-blue-500" : "text-gray-300"}`} />
          </div>
          <p className="text-lg font-semibold text-gray-700">
            {checkedOut ? "Day Complete" : checkedIn ? "Currently Working" : "Not Checked In"}
          </p>
          {today?.login_time && (
            <p className="text-sm text-gray-500 mt-1">
              In: {format(new Date(today.login_time + "Z"), "hh:mm a")}
              {today.logout_time && ` · Out: ${format(new Date(today.logout_time + "Z"), "hh:mm a")}`}
            </p>
          )}
          {hoursWorked && (
            <p className="text-2xl font-bold text-blue-600 mt-2">{hoursWorked}h worked</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          disabled={checkedIn || loading}
          onClick={() => setConfirm("checkin")}
          className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
            checkedIn || loading
              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
              : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300"
          }`}
        >
          <LogIn className="w-8 h-8" />
          <span className="font-semibold">Check In</span>
        </button>

        <button
          disabled={!checkedIn || checkedOut || loading}
          onClick={() => setConfirm("checkout")}
          className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
            !checkedIn || checkedOut || loading
              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
              : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-300"
          }`}
        >
          <LogOut className="w-8 h-8" />
          <span className="font-semibold">Check Out</span>
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              confirm === "checkin" ? "bg-blue-100" : "bg-green-100"
            }`}>
              {confirm === "checkin"
                ? <LogIn className="w-8 h-8 text-blue-600" />
                : <LogOut className="w-8 h-8 text-green-600" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Confirm {confirm === "checkin" ? "Check In" : "Check Out"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {confirm === "checkin"
                ? "Are you sure you want to check in now?"
                : "Are you sure you want to check out now?"}
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirm(null)} disabled={acting}>Cancel</button>
              <button
                className={`flex-1 ${confirm === "checkin" ? "btn-primary" : "btn-success"}`}
                onClick={handleAction}
                disabled={acting}
              >
                {acting ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
