import { createContext, useContext, useEffect, useState } from "react";
import { loginRequest } from "../api/resources";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("inventory_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("inventory_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("inventory_token", token);
    } else {
      localStorage.removeItem("inventory_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("inventory_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("inventory_user");
    }
  }, [user]);

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && token),
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
