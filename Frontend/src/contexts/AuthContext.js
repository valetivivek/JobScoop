import React, { createContext, useState, useEffect } from "react";
// import { useNavigate} from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

// Create Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  // const navigate = useNavigate();
  

  const isTokenExpired = (token) => {
    try {
      const { exp } = jwtDecode(token);
      console.log("expiry of token",exp)
      return exp < Date.now() / 1000; // Check if expired
    } catch (error) {
      return true; // Invalid token
    }
  };

  // Function to login and store token
  const login = (token, userData) => {
    localStorage.setItem("token", token);  // Store token
    localStorage.setItem("user", JSON.stringify(userData)); // Store user data
    setToken(token);
    setUser(userData);
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isloggedIn = () => {

    const storedToken = localStorage.getItem("token");

    if(user && storedToken && !isTokenExpired(storedToken) )
    {
      return true
    }
    else{
      return false
    }
  };

  // Check for stored token on load
  useEffect(() => {
    console.log("check auth")
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser && !isTokenExpired(storedToken) ) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // navigate("/home")
    }
    else{
      logout()
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isloggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};
