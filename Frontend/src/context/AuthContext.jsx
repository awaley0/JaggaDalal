import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Initialize auth from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setIsAuthenticated(true);
    setAuthError(null);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberToken");
  }, []);

  const setError = useCallback((error) => {
    setAuthError(error);
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, [user]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    authError,
    login,
    logout,
    setError,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
