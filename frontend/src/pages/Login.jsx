import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pwRules = (pw) => ({
  length: pw.length >= 8,
  lower: /[a-z]/.test(pw),
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
});

function PasswordStrength({ password }) {
  if (!password) return null;
  const rules = pwRules(password);
  const checks = [
    { key: "length", label: "At least 8 characters" },
    { key: "lower", label: "One lowercase letter" },
    { key: "upper", label: "One uppercase letter" },
    { key: "number", label: "One number" },
  ];
  const passed = Object.values(rules).filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? colors[passed - 1] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map(({ key, label }) => (
          <div key={key} className={`flex items-center gap-1.5 text-xs ${rules[key] ? "text-green-600" : "text-gray-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rules[key] ? "bg-green-500" : "bg-gray-300"}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
      <span className="inline-block w-3 h-3 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">!</span>
      {msg}
    </p>
  );
}

export default function Login() {
  const [mode, setMode] = useState("login"); // login | forgot | reset
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [resetForm, setResetForm] = useState({ email: "", token: "", new_password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    if (!emailRegex.test(val)) return "Enter a valid email address";
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(form.email);
    if (emailErr) { setErrors({ ...errors, email: emailErr }); return; }
    if (!form.password) { setErrors({ ...errors, password: "Password is required" }); return; }
    setErrors({ email: "", password: "" });
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      if (data.role === "employee") navigate("/employee/attendance");
      else navigate("/admin/peoples");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "Login failed";
      if (status === 404) {
        setErrors({ email: "No account found with this email", password: "" });
        toast.error("Email not registered");
      } else if (status === 401) {
        setErrors({ email: "", password: "Incorrect password" });
        toast.error("Incorrect password");
      } else if (status === 403) {
        toast.error(detail);
      } else {
        toast.error(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(resetForm.email);
    if (emailErr) { toast.error(emailErr); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetForm.email });
      toast.success("Reset code sent! Check your email.");
      setMode("reset");
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error("No account found with this email");
      } else {
        toast.error(err.response?.data?.detail || "Failed to send reset code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetForm.token) { toast.error("Enter the reset code"); return; }
    const rules = pwRules(resetForm.new_password);
    if (!Object.values(rules).every(Boolean)) {
      toast.error("Password does not meet all requirements");
      return;
    }
    if (resetForm.new_password !== resetForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetForm.email,
        token: resetForm.token,
        new_password: resetForm.new_password,
      });
      toast.success("Password reset successfully! Please login.");
      setMode("login");
      setResetForm({ email: "", token: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                mode === "login" ? "bg-blue-600" : mode === "forgot" ? "bg-orange-500" : "bg-green-500"
              }`}>
                {mode === "login" && <ShieldCheck className="w-8 h-8 text-white" />}
                {mode === "forgot" && <Mail className="w-8 h-8 text-white" />}
                {mode === "reset" && <KeyRound className="w-8 h-8 text-white" />}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === "login" ? "Welcome Back" : mode === "forgot" ? "Forgot Password?" : "Reset Password"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {mode === "login" && "Sign in to your attendance account"}
                {mode === "forgot" && "Enter your email to receive a 6-digit reset code"}
                {mode === "reset" && `Code sent to ${resetForm.email}`}
              </p>
            </div>

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className={`input-field pl-9 ${errors.email ? "border-red-400 bg-red-50 focus:ring-red-300" : ""}`}
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                      onBlur={(e) => setErrors({ ...errors, email: validateEmail(e.target.value) })}
                    />
                  </div>
                  <FieldError msg={errors.email} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => { setResetForm({ ...resetForm, email: form.email }); setMode("forgot"); }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      className={`input-field pl-9 pr-10 ${errors.password ? "border-red-400 bg-red-50 focus:ring-red-300" : ""}`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: "" }); }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError msg={errors.password} />
                </div>

                <button type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-200 mt-2"
                  disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </button>
              </form>
            )}

            {/* ── FORGOT PASSWORD FORM ── */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotRequest} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-9"
                      placeholder="you@company.com"
                      value={resetForm.email}
                      onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">We'll send a 6-digit code to this email if it exists in our system.</p>
                </div>
                <button type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-orange-100"
                  disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
                <button type="button" onClick={() => setMode("login")}
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </form>
            )}

            {/* ── RESET PASSWORD FORM ── */}
            {mode === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">6-Digit Reset Code</label>
                  <input
                    className="input-field tracking-[0.5em] text-center text-xl font-mono font-bold"
                    placeholder="000000"
                    value={resetForm.token}
                    onChange={(e) => setResetForm({ ...resetForm, token: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Code expires in 15 minutes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      value={resetForm.new_password}
                      onChange={(e) => setResetForm({ ...resetForm, new_password: e.target.value })}
                      required
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={resetForm.new_password} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    className={`input-field ${resetForm.confirm && resetForm.confirm !== resetForm.new_password ? "border-red-400 bg-red-50" : ""}`}
                    placeholder="••••••••"
                    value={resetForm.confirm}
                    onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                    required
                  />
                  {resetForm.confirm && resetForm.confirm !== resetForm.new_password && (
                    <FieldError msg="Passwords do not match" />
                  )}
                </div>
                <button type="submit"
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-100"
                  disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <button type="button" onClick={() => setMode("forgot")}
                  className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-700 py-2">
                  <ArrowLeft className="w-4 h-4" /> Resend Code
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          {mode === "login" && (
            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-gray-400">
                Default: <span className="font-mono">superadmin@company.com</span> / <span className="font-mono">Admin@123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
