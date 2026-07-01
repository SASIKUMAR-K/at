import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const login = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify({ id: data.user_id, name: data.name, role: data.role }));
    setUser({ id: data.user_id, name: data.name, role: data.role });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
