import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function UserForm({ onSubmit, loading, initial = {} }) {
  const [form, setForm] = useState({ name: initial.name || "", phone: initial.phone || "", email: initial.email || "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      {!initial.id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
      )}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-secondary px-6" onClick={onCancel}>Cancel</button>
          <button className="btn-danger px-6" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function UserTable({ users, onEdit, onDelete, onToggle, showEmpId = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {showEmpId && <th className="text-left py-3 px-2 text-gray-500 font-medium">Emp ID</th>}
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Name</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">Email</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Phone</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
              {showEmpId && <td className="py-3 px-2 font-mono text-xs text-blue-600">{u.emp_id}</td>}
              <td className="py-3 px-2 font-medium">{u.name}</td>
              <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">{u.email}</td>
              <td className="py-3 px-2 text-gray-500 hidden md:table-cell">{u.phone || "—"}</td>
              <td className="py-3 px-2">
                <span className={u.is_active ? "badge-active" : "badge-inactive"}>
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onToggle(u)} title={u.is_active ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    {u.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => onEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(u)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-gray-400">No records found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Peoples() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [admins, setAdmins] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "admins" : "employees");
  const [modal, setModal] = useState(null); // {type: 'add'|'edit', role, data?}
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      if (isSuperAdmin) {
        const [a, e] = await Promise.all([api.get("/users/admins"), api.get("/users/employees")]);
        setAdmins(a.data);
        setEmployees(e.data);
      } else {
        const e = await api.get("/users/employees");
        setEmployees(e.data);
      }
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (form) => {
    setLoading(true);
    try {
      const role = modal.role;
      await api.post(`/users/${role}`, { ...form, role: role === "admins" ? "admin" : "employee" });
      toast.success(`${role === "admins" ? "Admin" : "Employee"} added! Credentials sent to email.`);
      setModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setLoading(true);
    try {
      const role = modal.role;
      await api.put(`/users/${role}/${modal.data.id}`, form);
      toast.success("Updated successfully");
      setModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${confirm.role}/${confirm.data.id}`);
      toast.success("Deleted successfully");
      setConfirm(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  const handleToggle = async (u, role) => {
    try {
      await api.patch(`/users/${role}/${u.id}/status`, { is_active: !u.is_active });
      toast.success(`Account ${u.is_active ? "deactivated" : "activated"}`);
      fetchData();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const tabs = isSuperAdmin ? ["admins", "employees"] : ["employees"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Peoples</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setModal({ type: "add", role: activeTab })}
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === "admins" ? "Admin" : "Employee"}</span>
        </button>
      </div>

      {isSuperAdmin && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === t ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {activeTab === "admins" ? (
          <UserTable
            users={admins}
            onEdit={(u) => setModal({ type: "edit", role: "admins", data: u })}
            onDelete={(u) => setConfirm({ role: "admins", data: u })}
            onToggle={(u) => handleToggle(u, "admins")}
          />
        ) : (
          <UserTable
            users={employees}
            showEmpId
            onEdit={(u) => setModal({ type: "edit", role: "employees", data: u })}
            onDelete={(u) => setConfirm({ role: "employees", data: u })}
            onToggle={(u) => handleToggle(u, "employees")}
          />
        )}
      </div>

      {modal && (
        <Modal
          title={`${modal.type === "add" ? "Add" : "Edit"} ${modal.role === "admins" ? "Admin" : "Employee"}`}
          onClose={() => setModal(null)}
        >
          <UserForm
            onSubmit={modal.type === "add" ? handleAdd : handleEdit}
            loading={loading}
            initial={modal.data || {}}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${confirm.data.name}?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
