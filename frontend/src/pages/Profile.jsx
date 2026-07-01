import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { User, Lock } from "lucide-react";

export default function Profile() {
  const { user: authUser, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/users/me").then((r) => {
      setProfile(r.data);
      setEditForm({ name: r.data.name, phone: r.data.phone || "" });
    });
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/users/me", editForm);
      setProfile(data);
      toast.success("Profile updated");
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: data.name }));
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.put("/users/me/password", {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success("Password changed successfully");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="text-center text-gray-400 py-12">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="card mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile.name[0].toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold">{profile.name}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
            {profile.role.replace("_", " ")}
          </span>
          {profile.emp_id && (
            <span className="inline-block mt-1 ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-mono">
              {profile.emp_id}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "profile" ? "bg-white shadow text-blue-600" : "text-gray-500"
          }`}
        >
          <User className="w-4 h-4" /> Edit Profile
        </button>
        <button
          onClick={() => setTab("password")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "password" ? "bg-white shadow text-blue-600" : "text-gray-500"
          }`}
        >
          <Lock className="w-4 h-4" /> Change Password
        </button>
      </div>

      {tab === "profile" ? (
        <div className="card">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="input-field"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="input-field"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input-field bg-gray-50" value={profile.email} disabled />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                className="input-field"
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                className="input-field"
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
